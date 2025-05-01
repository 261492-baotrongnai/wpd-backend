import { Body, Injectable, InternalServerErrorException } from '@nestjs/common';
// import { UpdateUserDto } from './dto/update-user.dto';
import { getInternalId, verifyIdToken } from './user-utility';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as line from '@line/bot-sdk';

@Injectable()
export class UsersService {
  private readonly client: line.messagingApi.MessagingApiClient;
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
      console.error('Error verifying LINE ID token:', error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    }
  }

  async create(@Body() registerDto: RegisterDto) {
    // console.log('Registering user:', registerDto);
    try {
      const iid = await getInternalId(registerDto.idToken, undefined);
      const uid = this.jwtService.decode<{ sub: string }>(registerDto.idToken);

      const user = await this.usersRepository.findOneBy({ internalId: iid });
      if (user) {
        const acct = await this.generateToken(user.internalId);
        return { type: 'User', access_token: acct };
      }
      const newUser = new User({
        internalId: iid,
        program_code: registerDto.program_code,
      });
      await this.entityManager.save(newUser);
      const acct = await this.generateToken(newUser.internalId);
      await this.handleRegisterSuccess(uid.sub);
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
      .getMany();

    return users;
  }

  async findUserByInternalId(internalId: string) {
    return await this.usersRepository.findOneBy({ internalId });
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
        messages: [
          {
            type: 'text',
            text: `มะลิสวัสดีเจ้าา 🙏
  มะลิจะช่วยดูแลเรื่องการกินอาหารของคุณ
  ทุกวันเลยค่ะ เพื่อสุขภาพดี ห่างไกลเบาหวาน
  กดเมนูด้านล่างเพื่อเริ่มการใช้งานได้เลยนะคะ`,
          },
        ],
      });
      console.log('Registration success message sent successfully');
    } catch (error) {
      console.error('Error handling registration success:', error);
      throw error;
    }
  }
}
