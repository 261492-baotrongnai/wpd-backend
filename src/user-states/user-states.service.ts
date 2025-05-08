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
      relations: ['user', 'pendingUpload'],
    });
  }

  findOne(id: number) {
    return this.userStatesRepository.findOne({ where: { id } });
  }

  update(id: number, updateUserStateDto: UpdateUserStateDto) {
    this.logger.debug('Updating user state:', id, updateUserStateDto);
    return this.userStatesRepository.update(id, updateUserStateDto);
  }

  async remove(id: number): Promise<void> {
    this.logger.debug(`Removing user state with ID: ${id}`);

    // Find the user state with its pending upload
    const userState = await this.userStatesRepository.findOne({
      where: { id },
      relations: ['pendingUpload'],
    });

    if (!userState) {
      this.logger.warn(`UserState with id ${id} not found for removal`);
      return;
    }

    try {
      // With cascade: true, this will delete the pending upload as well
      await this.userStatesRepository.remove(userState);
      this.logger.debug(`Successfully removed user state with ID: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to remove user state with ID: ${id}`, error);
      throw error;
    }
  }
}
