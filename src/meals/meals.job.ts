import { Injectable, Logger } from '@nestjs/common';
import { MealsService } from './meals.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MealsJobService {
  private readonly logger = new Logger(MealsJobService.name);
  constructor(
    private readonly mealsService: MealsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async handleCreateMealJob(mealData: CreateMealDto) {
    this.logger.debug(`Creating meal with data: ${JSON.stringify(mealData)}`);
    const result = await this.mealsService.create(mealData);

    // Check if this is the first meal of the day for the user
    try {
      const todayMeals = await this.mealsService.findTodayMealsByUser(
        mealData.userId,
      );
      if (todayMeals.length === 1) {
        this.logger.debug(
          `First meal of the day for user ${mealData.userId}, emitting daily record event`,
        );
        this.eventEmitter.emit('user.daily.firstMeal', {
          userId: mealData.userId,
        });
      }
    } catch (err) {
      this.logger.error(
        `Error checking first meal of day for user ${mealData.userId}: ${err instanceof Error ? err.message : err}`,
      );
    }

    this.eventEmitter.emit('user.streaks.updated', { userId: mealData.userId });
    this.eventEmitter.emit('user.totalDays.updated', {
      userId: mealData.userId,
    });
    this.eventEmitter.emit('user.points.updated', {
      userId: mealData.userId,
    });
    return result;
  }

  async handleFindTodayAllMealJob() {
    this.logger.debug('Finding all meals for today');
    return await this.mealsService.findTodayAllMeals();
  }
}
