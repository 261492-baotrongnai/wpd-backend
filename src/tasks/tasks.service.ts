import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as line from '@line/bot-sdk';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MealType } from 'src/meals/entities/meal.entity';
import { getInternalId } from 'src/users/user-utility';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly client: line.messagingApi.MessagingApiClient;

  constructor(
    @InjectQueue('follower') private readonly followerQueue: Queue,
    @InjectQueue('meal') private readonly mealQueue: Queue,
    @InjectQueue('task') private readonly taskQueue: Queue,
    @InjectQueue('user-state') private readonly userStateQueue: Queue,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  // ส่งข้อความไปยังผู้ใช้ที่ไม่ได้ตอบมื้อเช้า
  @Cron('0 7 * * *')
  async handleMorningCron() {
    this.logger.log('Starting morning cron job');
    try {
      const job = await this.taskQueue.add('task-breakfast', '', {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });

      const result = await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.taskQueue,
        300000, // 5 minutes timeout
      );

      this.logger.log('Morning cron job completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Morning cron job failed:', error);
      throw error;
    }
  }

  // ส่งข้อความไปยังผู้ใช้ที่ไม่ได้ตอบมื้อเที่ยง
  @Cron('0 11 * * *')
  async handleLunchCron() {
    this.logger.log('Starting lunch cron job');
    try {
      const job = await this.taskQueue.add('task-lunch', '', {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });

      const result = await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.taskQueue,
        300000, // 5 minutes timeout
      );

      this.logger.log('Lunch cron job completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Lunch cron job failed:', error);
      throw error;
    }
  }

  // ส่งข้อความไปยังผู้ใช้ที่ไม่ได้ตอบมื้อเย็น
  @Cron('30 16 * * *')
  async handleEveningCron() {
    this.logger.log('Starting evening cron job');
    try {
      const job = await this.taskQueue.add('task-dinner', '', {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });

      const result = await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.taskQueue,
        300000, // 5 minutes timeout
      );

      this.logger.log('Evening cron job completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Evening cron job failed:', error);
      throw error;
    }
  }

  async getFollowersToSent(mealType: MealType): Promise<string[]> {
    this.logger.debug(`Getting followers for meal type: ${mealType}`);

    try {
      // Step 1: Get all followers with timeout
      const followerJob = await this.followerQueue.add('get-user-id', '', {
        removeOnComplete: 5,
        removeOnFail: 10,
      });

      const result = (await this.queueEventsRegistryService.waitForJobResult(
        followerJob,
        this.followerQueue,
        60000, // 1 minute timeout
      )) as { id: number; userId: string }[];

      const allFollowers: string[] = result.map((u) => u.userId);
      this.logger.log('All followers:', allFollowers);

      // Step 2: Get today's meals with timeout
      const allMealsJob = await this.mealQueue.add('find-today-all-meals', '', {
        removeOnComplete: 5,
        removeOnFail: 10,
      });

      const mealsResult =
        await this.queueEventsRegistryService.waitForJobResult(
          allMealsJob,
          this.mealQueue,
          60000, // 1 minute timeout
        );

      type MealUser = { internalId: string };
      type Meal = { mealType: MealType; user?: MealUser };

      const meals: Meal[] = Array.isArray(mealsResult)
        ? (mealsResult as Meal[])
        : [];

      const internalIds: string[] = Array.from(
        new Set(
          meals
            .filter(
              (meal) =>
                meal.mealType === mealType && meal.user && meal.user.internalId,
            )
            .map((meal) => meal.user!.internalId),
        ),
      );

      // Step 3: Get user states with timeout
      const stateJob = await this.userStateQueue.add(
        'get-all-iids-user-states',
        {},
        {
          removeOnComplete: 5,
          removeOnFail: 10,
        },
      );

      const stateIds = (await this.queueEventsRegistryService.waitForJobResult(
        stateJob,
        this.userStateQueue,
        60000, // 1 minute timeout
      )) as string[];
      this.logger.debug(
        `Internal IDs: ${JSON.stringify(internalIds)}, State IDs: ${JSON.stringify(stateIds)}`,
      );

      // Step 4: Filter followers
      const followersToSend: string[] = [];
      for (const follower of allFollowers) {
        try {
          const internalId = await getInternalId(undefined, follower);
          if (
            !internalIds.includes(internalId) ||
            !stateIds.includes(internalId)
          ) {
            followersToSend.push(follower);
          }
        } catch (error) {
          this.logger.warn(
            `Failed to get internal ID for follower ${follower}:`,
            error,
          );
          // Continue processing other followers
        }
      }

      this.logger.debug(
        `Found ${followersToSend.length} followers to send ${mealType} message`,
      );
      return followersToSend;
    } catch (error) {
      this.logger.error(`Error in getFollowersToSent for ${mealType}:`, error);
      throw error;
    }
  }

  async handleBreakfastJob() {
    this.logger.debug('Starting breakfast job processing');
    const message =
      'มื้อเช้านี้จะกินอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิดูด้วยน้าาา 😉';

    try {
      const userIds = await this.getFollowersToSent('breakfast');
      this.logger.log('send message to user IDs:', userIds);

      if (userIds.length === 0) {
        this.logger.warn('No users to send breakfast message');
        return 'No users to send breakfast message';
      }

      await this.client
        .multicast({ to: userIds, messages: [{ type: 'text', text: message }] })
        .then(() =>
          this.logger.log('breakfast message sent successfully: ' + message),
        );

      const result = {
        result: 'Breakfast job completed successfully',
        userIds,
        timestamp: new Date().toISOString(),
      };

      this.logger.debug('Breakfast job completed:', result);
      return result;
    } catch (error) {
      this.logger.error('Error in breakfast job:', error);
      throw error;
    }
  }

  async handleLunchJob() {
    this.logger.debug('Starting lunch job processing');
    const message =
      'มื้อเที่ยงนี้จะกินเมนูอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิดูด้วยน้ااา 😉';

    try {
      const userIds = await this.getFollowersToSent('lunch');
      this.logger.log('send message to user IDs:', userIds);

      if (userIds.length === 0) {
        this.logger.warn('No users to send lunch message');
        return 'No users to send lunch message';
      }

      await this.client
        .multicast({ to: userIds, messages: [{ type: 'text', text: message }] })
        .then(() =>
          this.logger.log('lunch message sent successfully: ' + message),
        );

      const result = {
        result: 'Lunch job completed successfully',
        userIds,
        timestamp: new Date().toISOString(),
      };

      this.logger.debug('Lunch job completed:', result);
      return result;
    } catch (error) {
      this.logger.error('Error in lunch job:', error);
      throw error;
    }
  }

  async handleDinnerJob() {
    this.logger.debug('Starting dinner job processing');
    const message =
      'มื้อเย็นนี้จะกินเมนูอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิดูด้วยน้าาา 😉';

    try {
      const userIds = await this.getFollowersToSent('dinner');
      this.logger.log('send message to user IDs:', userIds);

      if (userIds.length === 0) {
        this.logger.warn('No users to send dinner message');
        return 'No users to send dinner message';
      }

      await this.client
        .multicast({ to: userIds, messages: [{ type: 'text', text: message }] })
        .then(() =>
          this.logger.log('dinner message sent successfully: ' + message),
        );

      const result = {
        result: 'Dinner job completed successfully',
        userIds,
        timestamp: new Date().toISOString(),
      };

      this.logger.debug('Dinner job completed:', result);
      return result;
    } catch (error) {
      this.logger.error('Error in dinner job:', error);
      throw error;
    }
  }
}
