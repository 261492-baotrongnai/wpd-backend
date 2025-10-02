import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MealsJobService } from './meals.job';
import { CreateMealDto } from './dto/create-meal.dto';
import { MealsService } from './meals.service';

@Processor('meal', {
  concurrency: 100,
})
export class MealsProcessor extends WorkerHost {
  private readonly logger = new Logger(MealsProcessor.name);

  constructor(
    private readonly mealsJobService: MealsJobService,
    private readonly mealsService: MealsService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'create-meal') {
      const mealData = job.data as CreateMealDto;
      return await this.mealsJobService.handleCreateMealJob(mealData);
    } else if (job.name === 'find-today-all-meals') {
      return await this.mealsJobService.handleFindTodayAllMealJob();
    } else if (job.name === 'find-latest-meal') {
      const { userId } = job.data as { userId: number };
      return await this.mealsService.FindLatestMeal(userId);
    } else if (job.name === 'count-user-streaks') {
      const { userId } = job.data as { userId: number };
      return await this.mealsService.countUserStreaks(userId);
    } else if (job.name === 'count-total-days') {
      const { userId } = job.data as { userId: number };
      return await this.mealsService.countTotalDays(userId);
    } else if (job.name === 'get-user-all-meal') {
      const { userId } = job.data as { userId: number };
      return await this.mealsService.getUserAllMeal(userId);
    }
  }

  // @OnWorkerEvent('progress')
  // onProgress(job: Job) {
  //   const progressStr =
  //     typeof job.progress === 'object'
  //       ? JSON.stringify(job.progress)
  //       : String(job.progress);
  //   this.logger.log(`Job ${job.id} progress: ${progressStr}%`);
  // }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }
  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} is now active.`);
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.warn(`Job ${job.id} has stalled.`);
  }
}
