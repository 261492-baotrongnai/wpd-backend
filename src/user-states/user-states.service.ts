import { Injectable, Logger } from '@nestjs/common';
import { CreateUserStateDto } from './dto/create-user-state.dto';
import { UpdateUserStateDto } from './dto/update-user-state.dto';
import { UserState } from './entities/user-state.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import * as line from '@line/bot-sdk';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class UserStatesService {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(UserStatesService.name);
  constructor(
    @InjectRepository(UserState)
    private readonly userStatesRepository: Repository<UserState>,
    private readonly entityManager: EntityManager,
    private configService: ConfigService,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  async create(createUserStateDto: CreateUserStateDto) {
    const new_user_state = new UserState(createUserStateDto);
    this.logger.debug('Creating user state:', new_user_state);
    return await this.entityManager.save(new_user_state);
  }

  async findAllByUser(userId: number) {
    this.logger.debug(`Finding all user states for user ID: ${userId}`);
    const result = await this.userStatesRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    this.logger.debug(
      `Found ${result.length} user states : ${JSON.stringify(result)}`,
    );
    const plainStates = result.map((state) => {
      return {
        ...state,
        user: {
          id: state.user.id,
          internalId: state.user.internalId,
          isActive: state.user.isActive,
          createdAt: state.user.createdAt,
          updatedAt: state.user.updatedAt,
        },
        updatedAt: state.updatedAt,
        createdAt: state.createdAt,
      };
    });

    return plainStates;
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

  async addDatePosterState(
    filePath: string,
    uid: string,
    id: number,
    iid: string,
  ) {
    const message: line.messagingApi.ImageMessage = {
      type: 'image',
      originalContentUrl: `${this.configService.get('BASE_URL')}/uploads/posters/${iid}/${path.basename(filePath)}`,
      previewImageUrl: `${this.configService.get('BASE_URL')}/uploads/posters/${iid}/${path.basename(filePath)}`,
    };
    // Fetch the User entity by id
    const user = (await this.entityManager.findOne('User', {
      where: { id },
    })) as User;
    if (!user) {
      this.logger.warn(`User with id ${id} not found`);
      return;
    }
    const userState = new UserState({
      lineUserId: uid,
      messageToSend: message,
      state: 'date-poster',
      pendingFile: { fileName: path.basename(filePath), filePath },
      user: user,
    });
    this.logger.debug(`Adding date poster state for user ${id}`);
    try {
      const savedState = await this.userStatesRepository.save(userState);
      this.logger.debug(`Date poster state added successfully for user ${id}`);
      return savedState;
    } catch (error) {
      this.logger.error(
        `Failed to add date poster state for user ${id}`,
        error,
      );
      throw error;
    }
  }

  async sendPosterToUser(filePath: string, uid: string) {
    this.logger.debug(`Sending poster to user ${uid} from path: ${filePath}`);
    const message: line.messagingApi.ImageMessage = {
      type: 'image',
      originalContentUrl: `${this.configService.get('BASE_URL')}/uploads/posters/${path.basename(filePath)}`,
      previewImageUrl: `${this.configService.get('BASE_URL')}/uploads/posters/${path.basename(filePath)}`,
    };

    try {
      await this.client.pushMessage({
        to: uid,
        messages: [message],
      });
      this.logger.debug(`Poster sent successfully to user ${uid}`);
    } catch (error) {
      this.logger.error(`Failed to send poster to user ${uid}`, error);
      throw error;
    }

    return { message: 'Poster sent successfully', uid };
  }

  async saveToUploadsDir(
    file: Express.Multer.File,
    iid: string,
  ): Promise<string> {
    const uploadsDir = path.join(__dirname, '../../uploads/posters', iid);
    const filePath = path.join(uploadsDir, file.originalname);

    // Ensure the uploads directory exists
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    // Save the buffer to the uploads directory
    await fs.promises.writeFile(filePath, file.buffer);
    this.logger.log(`File saved locally: ${filePath}`);
    return filePath;
  }
}
