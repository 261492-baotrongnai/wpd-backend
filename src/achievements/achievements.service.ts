import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achievementsRepository: Repository<Achievement>,

    @InjectQueue('meal')
    private readonly mealQueue: Queue,

    @InjectQueue('user')
    private readonly userQueue: Queue,

    private readonly queueEvents: QueueEventsRegistryService,
  ) {}

  async updateStreaks(userId: number) {
    this.logger.log(`Updating achievement for user ${userId}`);
    const streaksJob = await this.mealQueue.add('count-user-streaks', {
      userId,
    });
    const streakResult: number = (await this.queueEvents.waitForJobResult(
      streaksJob,
      this.mealQueue,
    )) as number;
    this.logger.log(`Streaks for user ${userId}: ${streakResult}`);
    const userJob = await this.userQueue.add('update-streaks', {
      streaks: streakResult,
      id: userId,
    });

    this.logger.log(`Waiting for user update job ${userJob.id} to complete`);
    const userResult = await this.queueEvents.waitForJobResult(
      userJob,
      this.userQueue,
    );
    this.logger.log(`User update job ${userJob.id} completed`, userResult);
    this.logger.log(`User update result: ${String(userResult)}`);
  }

  async updateTotalDays(userId: number) {
    this.logger.log(`Updating total days for user ${userId}`);
    const totalDaysJob = await this.mealQueue.add('count-total-days', {
      userId,
    });
    const totalDaysResult: number = (await this.queueEvents.waitForJobResult(
      totalDaysJob,
      this.mealQueue,
    )) as number;

    this.logger.log(`Total days for user ${userId}: ${totalDaysResult}`);
    const userJob = await this.userQueue.add('update-total-days', {
      totalDays: totalDaysResult,
      id: userId,
    });

    this.logger.log(`Waiting for user update job ${userJob.id} to complete`);
    const userResult = await this.queueEvents.waitForJobResult(
      userJob,
      this.userQueue,
    );
    this.logger.log(`User update job ${userJob.id} completed`, userResult);
    this.logger.log(`User update result: ${String(userResult)}`);
  }
}
