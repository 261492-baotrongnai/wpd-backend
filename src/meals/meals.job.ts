import { Injectable, Logger } from '@nestjs/common';
import { MealsService } from './meals.service';
import { CreateMealDto } from './dto/create-meal.dto';

@Injectable()
export class MealsJobService {
  private readonly logger = new Logger(MealsJobService.name);
  constructor(private readonly mealsService: MealsService) {}
  async handleCreateMealJob(mealData: CreateMealDto) {
    this.logger.debug(`Creating meal with data: ${JSON.stringify(mealData)}`);
    return await this.mealsService.create(mealData);
  }

  async handleFindTodayAllMealJob() {
    this.logger.debug('Finding all meals for today');
    return await this.mealsService.findTodayAllMeals();
  }
}
