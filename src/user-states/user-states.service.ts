import { Injectable, Logger } from '@nestjs/common';
import { CreateUserStateDto } from './dto/create-user-state.dto';
import { UpdateUserStateDto } from './dto/update-user-state.dto';
import { UserState } from './entities/user-state.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import * as path from 'path';
import * as line from '@line/bot-sdk';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/entities/user.entity';
import { ObjectCannedACL } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createS3Client } from 'src/images/spaceUtil';
import { ImagesService } from 'src/images/images.service';

@Injectable()
export class UserStatesService {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(UserStatesService.name);
  private readonly s3Client = createS3Client();

  constructor(
    @InjectRepository(UserState)
    private readonly userStatesRepository: Repository<UserState>,
    private readonly entityManager: EntityManager,
    private configService: ConfigService,
    private readonly imagesService: ImagesService,
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

  async addPosterState(
    signed_url: string,
    uid: string,
    id: number,
    state_name: string,
  ) {
    const message: line.messagingApi.ImageMessage = {
      type: 'image',
      originalContentUrl: `${signed_url}`,
      previewImageUrl: `${signed_url}`,
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
      state: state_name,
      user: user,
    });
    this.logger.debug(
      `Adding poster state for user ${id}, state: ${state_name}`,
    );
    try {
      const savedState = await this.userStatesRepository.save(userState);
      this.logger.debug(`Poster state added successfully for user ${id}`);
      this.logger.log(`Poster state added: ${JSON.stringify(savedState)}`);
      return savedState;
    } catch (error) {
      this.logger.error(`Failed to add poster state for user ${id}`, error);
      throw error;
    }
  }

  // เหมือนจะไม่ได้ใช้ที่ไหน
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

  async saveToUploadsSpace(
    file: Express.Multer.File,
    iid: string,
  ): Promise<{ signed_url: string }> {
    const key = `posters/${iid}-${file.originalname}`;
    const uploadParams = {
      Bucket: process.env.SPACE_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: `image/${file.mimetype.split('/')[1]}`,
      ACL: 'private' as ObjectCannedACL,
    };

    const parallelUpload = new Upload({
      client: this.s3Client,
      params: uploadParams,
    });
    await parallelUpload.done();
    this.logger.log(`File uploaded successfully to Space: ${key}`);
    const result = await this.imagesService.getSignedUrl(key);
    // this.logger.log(`Generated signed URL: ${result.signed_url}`);
    return result;
  }

  async postToSpaceWithoutLocal(
    user_id: number,
    file_name: string,
    image_content: Buffer,
    file_type: string,
  ): Promise<void> {
    // Upload the image directly to the Space bucket without saving locally
    const key = `meal_images/waitings/${file_name}`;
    try {
      const uploadParams = {
        Bucket: process.env.SPACE_NAME,
        Key: key,
        Body: image_content,
        ContentType: `image/${file_type}`,
        ACL: 'private' as ObjectCannedACL,
      };
      const parallelUpload = new Upload({
        client: this.s3Client,
        params: uploadParams,
      });
      await parallelUpload.done();
      this.logger.log(
        `File uploaded directly to Space: ${file_name} for user ${user_id}`,
      );
    } catch (error) {
      this.logger.error(`Error uploading file to Space:`, error);
      throw new Error(
        `Error uploading file to Space: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
