import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { getInternalId } from './user-utility';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly entityManager: EntityManager,
  ) {}

  async verifyIDToken(idToken: string) {
    const clientId: string = process.env.LINE_CLIENT_ID || '';
    const secretKey: string = process.env.INTERNAL_ID_SECRET || '';
    const result = await getInternalId(secretKey, idToken, clientId);
    if (typeof result !== 'string') {
      // Check if result is an error
      throw new Error(`Failed to get internal ID: ${result}`);
    }
    const internalId: string = result;
    const user = await this.usersRepository.findOneBy({ internalId });
    if (!user) {
      const newUser = new User({ internalId });
      return await this.entityManager.save(newUser);
    } else {
      return user;
    }
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.usersRepository.findOneBy({
      internalId: createUserDto.internalId,
    });
    if (user) {
      return user;
    }
    const newUser = new User(createUserDto);
    await this.entityManager.save(newUser);
    return newUser;
  }

  async findAll() {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.images', 'image')
      .getMany();

    return users;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user with data: ${JSON.stringify(updateUserDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
