import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as line from '@line/bot-sdk';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue, QueueEvents } from 'bullmq';
import { MealType } from 'src/meals/entities/meal.entity';
import { getInternalId } from 'src/users/user-utility';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly client: line.messagingApi.MessagingApiClient;

  constructor(
    @InjectQueue('follower') private readonly followerQueue: Queue,
    @InjectQueue('meal') private readonly mealQueue: Queue,
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

  @Cron('0 7 * * *')
  async handleMorningCron() {
    const message =
      'มื้อเช้านี้จะกินอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิิดูด้วยน้าาา 😉';

    const userIds = await this.getFollowersToSent('breakfast');
    this.logger.log('Test message to user IDs:', userIds);

    await this.client
      .multicast({ to: userIds, messages: [{ type: 'text', text: message }] })
      .then(() => this.logger.log('Test LINE message sent: ' + message))
      .catch((err) =>
        this.logger.error('Failed to send test LINE message', err),
      );
  }

  @Cron('0 11 * * *')
  async handleLaunchCron() {
    const message =
      'มื้อเที่ยงนี้จะกินเมนูอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิิดูด้วยน้าาา 😉';

    const userIds = await this.getFollowersToSent('lunch');
    this.logger.log('Test message to user IDs:', userIds);

    await this.client
      .multicast({ to: userIds, messages: [{ type: 'text', text: message }] })
      .then(() => this.logger.log('Test LINE message sent: ' + message))
      .catch((err) =>
        this.logger.error('Failed to send test LINE message', err),
      );
  }

  @Cron('0 16 * * *')
  async handleEveningCron() {
    const message =
      'มื้อเย็นนี้จะกินเมนูอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิิดูด้วยน้าาา 😉';

    const userIds = await this.getFollowersToSent('dinner');
    this.logger.log('Test message to user IDs:', userIds);

    await this.client
      .multicast({ to: userIds, messages: [{ type: 'text', text: message }] })
      .then(() => this.logger.log('Test LINE message sent: ' + message))
      .catch((err) =>
        this.logger.error('Failed to send test LINE message', err),
      );
  }

  //   @Cron('* * * * * *')
  //   async handleTestCron() {
  //     const message = 'Test message from SchedulerService';
  //     const userIds = await this.getFollowersToSent('lunch');
  //     this.logger.log('Test message to user IDs:', userIds);

  //     await this.client
  //       .multicast({ to: userIds, messages: [{ type: 'text', text: message }] })
  //       .then(() => this.logger.log('Test LINE message sent: ' + message))
  //       .catch((err) =>
  //         this.logger.error('Failed to send test LINE message', err),
  //       );
  //   }

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

    const followersToSend: string[] = [];
    for (const follower of AllFollowers) {
      const internalId = await getInternalId(undefined, follower);
      if (internalIds.includes(internalId)) {
        followersToSend.push(follower);
      }
    }

    return followersToSend;
  }
}
