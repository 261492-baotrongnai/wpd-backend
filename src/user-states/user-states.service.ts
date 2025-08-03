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

  async create(createUserStateDto: CreateUserStateDto) {
    const new_user_state = new UserState(createUserStateDto);
    this.logger.debug('Creating user state:', new_user_state);
    return await this.entityManager.save(new_user_state);
  }

  async findAllByUser(userId: number): Promise<UserState[]> {
    this.logger.debug(`Finding all user states for user ID: ${userId}`);
    return await this.userStatesRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async getAllUserInternalIds(): Promise<string[]> {
    const userStates = await this.userStatesRepository.find({
      select: ['user'],
      relations: ['user'],
    });

    return userStates.map((userState) => userState.user.internalId);
  }

  async findOne(id: number) {
    return await this.userStatesRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserStateDto: UpdateUserStateDto) {
    this.logger.debug('Updating user state:', id, updateUserStateDto);
    return await this.userStatesRepository.update(id, updateUserStateDto);
  }

  async remove(id: number): Promise<void> {
    this.logger.debug(`Removing user state with ID: ${id}`);

    const userState = await this.userStatesRepository.findOne({
      where: { id },
    });

    if (!userState) {
      this.logger.warn(`UserState with id ${id} not found for removal`);
      return;
    }

    try {
      await this.userStatesRepository.remove(userState);
      this.logger.debug(`Successfully removed user state with ID: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to remove user state with ID: ${id}`, error);
      throw error;
    }
  }

  async findCandidates(id: number) {
    const userState = await this.userStatesRepository.findOne({
      where: { user: { id } },
    });

    if (!userState) {
      this.logger.warn(`UserState with user ${id} not found`);
      return null;
    }

    const candidates = userState.menuName;

    return candidates;
  }
}
