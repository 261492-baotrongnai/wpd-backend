import {
  Body,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
// import { UpdateUserDto } from './dto/update-user.dto';
import { getInternalId, verifyIdToken } from './user-utility';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as line from '@line/bot-sdk';
import { RegistConfirmFlex } from './user-flex';

@Injectable()
export class UsersService {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly entityManager: EntityManager,
    private readonly jwtService: JwtService,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  async generateToken(internalId: string): Promise<string> {
    const secretKey = process.env.JWT_SECRET;
    return await this.jwtService.signAsync(
      { internalId, role: 'user' },
      { secret: secretKey, expiresIn: '1h' },
    );
  }

  async decodeToken(
    token: string,
  ): Promise<{ internalId: string; role: string }> {
    const secretKey = process.env.JWT_SECRET;
    return await this.jwtService.verifyAsync<{
      internalId: string;
      role: string;
    }>(token, { secret: secretKey });
  }

  async verifyLineIDToken(idToken: string) {
    try {
      await verifyIdToken(idToken);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error verifying ID token: ${error.message}`);
      }
      return false;
    }
  }

  async create(@Body() registerDto: RegisterDto) {
    try {
      this.logger.log('Creating user with ID token:', registerDto);
      const iid = await getInternalId(registerDto.idToken, undefined);
      const uid = this.jwtService.decode<{ sub: string }>(registerDto.idToken);
      this.logger.debug('Decoded ID token:', uid);
      const user = await this.usersRepository.findOneBy({ internalId: iid });
      if (user) {
        const acct = await this.generateToken(user.internalId);
        if (user.program_code !== registerDto.program_code) {
          user.program_code = registerDto.program_code ?? '';
          await this.entityManager.save(user);
        }
        return { type: 'User', access_token: acct };
      }
      const newUser = new User({
        internalId: iid,
        program_code: registerDto.program_code,
      });
      this.logger.debug('New user:', newUser);
      const new_user_created = await this.usersRepository.save(newUser);
      if (!new_user_created) {
        throw new InternalServerErrorException('Failed to create user');
      }
      this.logger.debug('New user created', new_user_created);
      const acct = await this.generateToken(newUser.internalId);
      this.logger.debug('Generated token:', acct);
      // await this.handleRegisterSuccess(uid.sub);
      return { type: 'NewUser', access_token: acct };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    }
  }

  async findAll() {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.images', 'image')
      .leftJoinAndSelect('user.states', 'userState')
      .getMany();

    return users;
  }

  async findUserByInternalId(internalId: string) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.images', 'image')
      .leftJoinAndSelect('user.states', 'userState')
      .where('user.internalId = :internalId', { internalId })
      .getOne();

    return user;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user with data: ${JSON.stringify(updateUserDto)}`;
  // }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async handleRegisterSuccess(userId: string) {
    try {
      await this.client.pushMessage({
        to: userId,
        messages: [RegistConfirmFlex],
      });
      this.logger.log('Registration success message sent successfully');
    } catch (error) {
      this.logger.error('Error handling registration success:', error);
      throw error;
    }
  }
}
