import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MealsJobService } from './meals.job';
import { CreateMealDto } from './dto/create-meal.dto';

@Processor('meal', {
  concurrency: 20,
})
export class MealsProcessor extends WorkerHost {
  private readonly logger = new Logger(MealsProcessor.name);

  constructor(private readonly mealsJobService: MealsJobService) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'create-meal') {
      const { mealData } = job.data as { mealData: CreateMealDto };
      return await this.mealsJobService.handleCreateMealJob(mealData);
    } else if (job.name === 'find-today-all-meals') {
      return await this.mealsJobService.handleFindTodayAllMealJob();
    }
  }
}
