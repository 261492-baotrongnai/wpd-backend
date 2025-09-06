import { Injectable, Logger } from '@nestjs/common';
import { MealsService } from './meals.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Injectable()
export class MealsJobService {
  private readonly logger = new Logger(MealsJobService.name);
  constructor(
    private readonly mealsService: MealsService,
    @InjectQueue('achievement')
    private readonly achievementQueue: Queue,

    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {}
  async handleCreateMealJob(mealData: CreateMealDto) {
    this.logger.debug(`Creating meal with data: ${JSON.stringify(mealData)}`);
    const result = await this.mealsService.create(mealData);

    const achievementJob = await this.achievementQueue.add(
      'update-achievement',
      { userId: mealData.userId },
    );
    const achievementResult =
      await this.queueEventsRegistryService.waitForJobResult(
        achievementJob,
        this.achievementQueue,
      );
    this.logger.debug(
      `Achievement job result: ${JSON.stringify(achievementResult)}`,
    );
    return result;
  }

  async handleFindTodayAllMealJob() {
    this.logger.debug('Finding all meals for today');
    return await this.mealsService.findTodayAllMeals();
  }
}
