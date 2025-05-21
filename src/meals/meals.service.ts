import { Injectable, Logger } from '@nestjs/common';
import { CreateMealDto } from './dto/create-meal.dto';
// import { UpdateMealDto } from './dto/update-meal.dto';
import { Meal } from './entities/meal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, EntityManager, Repository } from 'typeorm';
import * as moment from 'moment-timezone';
import { FoodGradesService } from 'src/food-grades/food-grades.service';

@Injectable()
export class MealsService {
  logger = new Logger(MealsService.name);

  constructor(
    @InjectRepository(Meal)
    private readonly mealsRepository: Repository<Meal>,
    private readonly entityManager: EntityManager,
    private readonly foodGrades: FoodGradesService,
  ) {}
  create(createMealDto: CreateMealDto) {
    const new_meal = new Meal({
      imageName: createMealDto.imageName,
      mealType: createMealDto.mealType,
      avgScore: createMealDto.avgScore,
      avgGrade: createMealDto.avgGrade,
      user: createMealDto.user,
    });

    return this.entityManager.save(new_meal);
  }

  findAll() {
    return `This action returns all meals`;
  }

  findOne(id: number) {
    return this.mealsRepository.findOne({ where: { id } });
  }

  findAllByUser(userId: number) {
    return this.mealsRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'foods'],
    });
  }

  async findTodayMealsByUser(userId: number) {
    const today = moment.tz('Asia/Bangkok').startOf('day').toDate();
    const tomorrow = moment.tz('Asia/Bangkok').endOf('day').toDate();
    this.logger.debug(`Today: ${today.toISOString()}`);
    this.logger.debug(`Tomorrow: ${tomorrow.toISOString()}`);
    const today_meals = await this.mealsRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(today, tomorrow),
      },
      relations: ['foods'],
    });
    // this.logger.debug(`Today meals:`, today_meals);
    return today_meals;
  }

  async findMealsByDay(userId: number, date: string) {
    const startOfDay = moment.tz(date, 'Asia/Bangkok').startOf('day').toDate();
    const endOfDay = moment.tz(date, 'Asia/Bangkok').endOf('day').toDate();
    this.logger.debug(`Start of day: ${startOfDay.toISOString()}`);
    this.logger.debug(`End of day: ${endOfDay.toISOString()}`);
    const meals = await this.mealsRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(startOfDay, endOfDay),
      },
      relations: ['foods'],
    });
    this.logger.debug(`Meals:`, meals);
    return meals;
  }

  getStatsOfDay(meals: Meal[]) {
    const stats = {
      avgScore: 0,
      avgGrade: '',
      totalMeal: meals.length,
      countA: 0,
      countB: 0,
      countC: 0,
      totalFood: 0,
    };
    meals.forEach((meal) => {
      stats.avgScore += meal.avgScore;
      stats.totalFood += meal.foods.length;
      stats.countA += meal.avgGrade === 'A' ? 1 : 0;
      stats.countB += meal.avgGrade === 'B' ? 1 : 0;
      stats.countC += meal.avgGrade === 'C' ? 1 : 0;
    });

    stats.avgScore /= meals.length;
    this.logger.debug(`Avg score: ${stats.avgScore}`);
    stats.avgGrade = this.foodGrades.scoreToGrade(stats.avgScore) as string;
    this.logger.debug(`Stats:`, stats);
    return stats;
  }

  // update(id: number, updateMealDto: UpdateMealDto) {
  //   return `This action updates a #${id} meal`;
  // }

  remove(id: number) {
    return `This action removes a #${id} meal`;
  }
}
