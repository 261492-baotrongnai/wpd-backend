import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as line from '@line/bot-sdk';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue, QueueEvents } from 'bullmq';
import { MealType } from 'src/meals/entities/meal.entity';
import { getInternalId } from 'src/users/user-utility';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly client: line.messagingApi.MessagingApiClient;

  constructor(
    @InjectQueue('follower') private readonly followerQueue: Queue,
    @InjectQueue('meal') private readonly mealQueue: Queue,
    @InjectQueue('task') private readonly taskQueue: Queue,
    @InjectQueue('user-state') private readonly userStateQueue: Queue,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  private async waitForJobResult(job: Job, queue: Queue) {
    const queueEvents = new QueueEvents(queue.name, {
      connection: queue.opts.connection,
    });
    const result: unknown = await job.waitUntilFinished(queueEvents);
    await queueEvents.close();
    return result;
  }

  // ส่งข้อความไปยังผู้ใช้ที่ไม่ได้ตอบมื้อเช้า
  @Cron('0 7 * * *')
  async handleMorningCron() {
    const job = await this.taskQueue.add('task-breakfast', '');
    const result = await this.waitForJobResult(job, this.taskQueue);
    return result;
  }

  // ส่งข้อความไปยังผู้ใช้ที่ไม่ได้ตอบมื้อเที่ยง
  @Cron('0 11 * * *')
  async handleLunchCron() {
    const job = await this.taskQueue.add('task-lunch', '');
    const result = await this.waitForJobResult(job, this.taskQueue);
    return result;
  }

  // ส่งข้อความไปยังผู้ใช้ที่ไม่ได้ตอบมื้อเย็น
  @Cron('30 16 * * *')
  async handleEveningCron() {
    const job = await this.taskQueue.add('task-dinner', '');
    const result = await this.waitForJobResult(job, this.taskQueue);
    return result;
  }

  async getFollowersToSent(mealType: MealType): Promise<string[]> {
    const job = await this.followerQueue.add('get-user-id', '');

    const result = (await this.waitForJobResult(job, this.followerQueue)) as {
      id: number;
      userId: string;
    }[];

    const AllFollowers: string[] = result.map((u) => u.userId);
    this.logger.log('All followers:', AllFollowers);

    const allMealsJob = await this.mealQueue.add('find-today-all-meals', '');

    const mealsResult = await this.waitForJobResult(
      allMealsJob,
      this.mealQueue,
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

    const stateJob = await this.userStateQueue.add(
      'get-all-iids-user-states',
      {},
    );

    const stateIds = (await this.waitForJobResult(
      stateJob,
      this.userStateQueue,
    )) as string[];

    const followersToSend: string[] = [];
    for (const follower of AllFollowers) {
      const internalId = await getInternalId(undefined, follower);
      if (!internalIds.includes(internalId) || stateIds.includes(internalId)) {
        followersToSend.push(follower);
      }
    }

    return followersToSend;
  }

  async handleBreakfastJob() {
    const message =
      'มื้อเช้านี้จะกินอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิดูด้วยน้าาา 😉';

    const userIds = await this.getFollowersToSent('breakfast');
    this.logger.log('send message to user IDs:', userIds);

    if (userIds.length === 0) {
      this.logger.warn('No users to send breakfast message');
      return 'No users to send breakfast message';
    }

    try {
      await this.client
        .multicast({ to: userIds, messages: [{ type: 'text', text: message }] })
        .then(() =>
          this.logger.log('breakfast message sent successfully: ' + message),
        );

      return {
        result: 'Breakfast job completed successfully',
        userIds,
      };
    } catch (error) {
      this.logger.error('Error sending breakfast job message:', error);
    }
  }

  async handleLunchJob() {
    const message =
      'มื้อเที่ยงนี้จะกินเมนูอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิดูด้วยน้าาา 😉';

    const userIds = await this.getFollowersToSent('lunch');
    this.logger.log('send message to user IDs:', userIds);

    if (userIds.length === 0) {
      this.logger.warn('No users to send lunch message');
      return 'No users to send lunch message';
    }

    try {
      await this.client
        .multicast({ to: userIds, messages: [{ type: 'text', text: message }] })
        .then(() =>
          this.logger.log('lunch message sent successfully: ' + message),
        );
      return {
        result: 'Lunch job completed successfully',
        userIds,
      };
    } catch (error) {
      this.logger.error('Error sending lunch job message:', error);
    }
  }

  async handleDinnerJob() {
    const message =
      'มื้อเย็นนี้จะกินเมนูอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิดูด้วยน้าาา 😉';

    const userIds = await this.getFollowersToSent('dinner');
    this.logger.log('send message to user IDs:', userIds);

    if (userIds.length === 0) {
      this.logger.warn('No users to send dinner message');
      return 'No users to send dinner message';
    }

    try {
      await this.client
        .multicast({ to: userIds, messages: [{ type: 'text', text: message }] })
        .then(() =>
          this.logger.log('dinner message sent successfully: ' + message),
        );

      return {
        result: 'Dinner job completed successfully',
        userIds,
      };
    } catch (error) {
      this.logger.error('Error sending dinner job message:', error);
    }
  }
}
