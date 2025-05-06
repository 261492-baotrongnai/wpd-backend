import { Injectable, Logger } from '@nestjs/common';
import { CreateUserStateDto } from './dto/create-user-state.dto';
import { UpdateUserStateDto } from './dto/update-user-state.dto';
import { UserState } from './entities/user-state.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class UserStatesService {
  private readonly logger = new Logger(UserStatesService.name);
  constructor(
    @InjectRepository(UserState)
    private readonly userStatesRepository: Repository<UserState>,
    private readonly entityManager: EntityManager,
  ) {}

  create(createUserStateDto: CreateUserStateDto) {
    const new_user_state = new UserState(createUserStateDto);
    this.logger.debug('Creating user state:', new_user_state);
    return this.entityManager.save(new_user_state);
  }

  findAll() {
    return `This action returns all userStates`;
  }

  async findAllByUser(userId: number): Promise<UserState[]> {
    return this.userStatesRepository.find({
      where: { user: { id: userId } },
      relations: ['user'], // Eagerly load the `user` relationship
    });
  }

  findOne(id: number) {
    return this.userStatesRepository.findOne({ where: { id } });
  }

  update(id: number, updateUserStateDto: UpdateUserStateDto) {
    this.logger.debug('Updating user state:', id, updateUserStateDto);
    return `This action updates a #${id} userState`;
  }

  remove(id: number) {
    return this.userStatesRepository.delete(id);
  }
}
