import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { UpdateUserDto } from './dto/update-user.dto';
import { getInternalId } from './user-utility';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { warn } from 'console';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly entityManager: EntityManager,
    private readonly jwtService: JwtService,
  ) {}

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
    const result = await getInternalId(idToken);
    if (typeof result !== 'string') {
      // Check if result is an error
      throw new Error(`Failed to get internal ID`);
    }
    const internalId: string = result;
    const user = await this.usersRepository.findOneBy({ internalId });
    if (!user) {
      throw new warn(
        `please classify and agree terms and conditions before using`,
      );
    } else {
      return user;
    }
  }

  async create(registerDto: RegisterDto) {
    try {
      const iid = await getInternalId(registerDto.idToken);
      if (typeof iid !== 'string') {
        throw new Error(`Failed to get internal ID at create user`);
      }
      const user = await this.usersRepository.findOneBy({ internalId: iid });
      if (user) {
        return user;
      }
      const newUser = new User({
        internalId: iid,
        program_code: registerDto.program_code,
      });
      await this.entityManager.save(newUser);
      return newUser;
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
}
