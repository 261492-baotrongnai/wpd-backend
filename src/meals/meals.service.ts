import { Injectable, Logger } from '@nestjs/common';
import { CreateMealDto } from './dto/create-meal.dto';
// import { UpdateMealDto } from './dto/update-meal.dto';
import { Meal } from './entities/meal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, EntityManager, Repository } from 'typeorm';
import moment from 'moment-timezone';
import { FoodGradesService } from 'src/food-grades/food-grades.service';
import { User } from 'src/users/entities/user.entity';
import { Food } from 'src/foods/entities/food.entity';

@Injectable()
export class MealsService {
  logger = new Logger(MealsService.name);

  constructor(
    @InjectRepository(Meal)
    private readonly mealsRepository: Repository<Meal>,
    private readonly entityManager: EntityManager,
    private readonly foodGrades: FoodGradesService,
  ) {}
  async create(createMealDto: CreateMealDto) {
    const user = await this.entityManager.findOne(User, {
      where: { id: createMealDto.userId },
    });
    if (!user) {
      throw new Error('User not found');
    }
    const new_meal = new Meal({
      imageName: createMealDto.imageName,
      mealType: createMealDto.mealType,
      avgScore: createMealDto.avgScore,
      avgGrade: createMealDto.avgGrade,
      user: user,
      maxScore: createMealDto.maxScore,
      lowestGrade: createMealDto.lowestGrade,
      createdAt: createMealDto.createdAt || new Date(),
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

  async findTodayAllMeals() {
    const today = moment.tz('Asia/Bangkok').startOf('day').toDate();
    const tomorrow = moment.tz('Asia/Bangkok').endOf('day').toDate();
    this.logger.debug(`Today: ${today.toISOString()}`);
    return this.mealsRepository.find({
      where: {
        createdAt: Between(today, tomorrow),
      },
      relations: ['user'],
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

  getSummaryStats(meals: Meal[]) {
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
    const is_grading_by_rule = meals.some((meal) =>
      meal.foods?.some((f: Food) => f.grading_by_rule === true),
    );
    stats.avgGrade = is_grading_by_rule
      ? (this.foodGrades.scoreToGradeRulebased(stats.avgScore) as string)
      : (this.foodGrades.scoreToGrade(stats.avgScore) as string);
    return stats;
  }

  async getTodaySummary(userId: number) {
    try {
      const today = new Date();
      this.logger.debug(' today: ', today.toISOString());
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
      );

      this.logger.debug(
        `Fetching meals for userId: ${userId}, from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`,
      );

      const meals: Meal[] = await this.mealsRepository.find({
        where: {
          user: { id: userId },
          createdAt: Between(startOfDay, endOfDay),
        },
        relations: ['foods'],
      });

      const result = this.getSummaryStats(meals);
      return result;
    } catch (error) {
      this.logger.error('Error at [getTodaySummary]:', error);
      throw error;
    }
  }

  async getWeekSummary(userId: number) {
    try {
      const today = moment.tz('Asia/Bangkok').startOf('day').toDate();
      const startOfWeek = moment(today).startOf('week').toDate();
      const endOfWeek = moment(today).endOf('week').toDate();
      this.logger.debug(
        `Fetching meals for userId: ${userId}, from ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`,
      );
      const meals: Meal[] = await this.mealsRepository.find({
        where: {
          user: { id: userId },
          createdAt: Between(startOfWeek, endOfWeek),
        },
        relations: ['foods'],
      });
      const result = this.getSummaryStats(meals);
      this.logger.debug(`Week summary:`, result);
      return result;
    } catch (error) {
      this.logger.error('Error at [getWeekSummary]:', error);
      throw error;
    }
  }

  async getMonthSummary(userId: number) {
    try {
      const today = moment.tz('Asia/Bangkok').startOf('day').toDate();
      const startOfMonth = moment(today).startOf('month').toDate();
      const endOfMonth = moment(today).endOf('month').toDate();
      this.logger.debug(
        `Fetching meals for userId: ${userId}, from ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`,
      );
      const meals = await this.mealsRepository.find({
        where: {
          user: { id: userId },
          createdAt: Between(startOfMonth, endOfMonth),
        },
        relations: ['foods'],
      });
      const result = this.getSummaryStats(meals);
      this.logger.debug(`Month summary:`, result);
      return result;
    } catch (error) {
      this.logger.error('Error at [getMonthSummary]:', error);
      throw error;
    }
  }
  remove(id: number) {
    return `This action removes a #${id} meal`;
  }

  async FindLatestMeal(userId: number) {
    this.logger.debug(`Finding latest meal for userId: ${userId}`);
    const latestMeal = await this.mealsRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: ['foods'],
    });
    if (!latestMeal) {
      this.logger.warn(`No meals found for userId: ${userId}`);
      return null;
    }
    this.logger.debug(`Latest meal found:`, latestMeal);
    return latestMeal;
  }

  async countUserStreaks(id: number) {
    try {
      const result: {
        userId: number;
        streakCount: number;
        lastMealDate: string;
      }[] = await this.entityManager.query(
        `
      WITH ranked_meals AS (
        SELECT
          userId,
          DATE(createdAt) AS mealDate,
          ROW_NUMBER() OVER (PARTITION BY userId ORDER BY DATE(createdAt)) AS rn
        FROM meals
        GROUP BY userId, DATE(createdAt)
      ),
      streaks AS (
        SELECT
          userId,
          mealDate,
          rn,
          DATE_SUB(mealDate, INTERVAL rn DAY) AS streakGroup
        FROM ranked_meals
      ),
      streak_counts AS (
        SELECT
          userId,
          COUNT(*) AS streakCount,
          MAX(mealDate) AS lastMealDate
        FROM streaks
        GROUP BY userId, streakGroup
      )
      SELECT
        userId,
        streakCount,
        lastMealDate
      FROM streak_counts
      WHERE userId = ? 
      ORDER BY lastMealDate DESC
      LIMIT 1;
    `,
        [id],
      );

      this.logger.debug('Streak query result:', result);

      const lastMealDate = result[0]?.lastMealDate;
      const streakCount = result[0]?.streakCount || 0;

      // Use moment-timezone to ensure all dates are in Asia/Bangkok timezone

      const today = moment.tz('Asia/Bangkok').startOf('day');
      const yesterday = moment
        .tz('Asia/Bangkok')
        .subtract(1, 'day')
        .startOf('day');
      const lastMealMoment = lastMealDate
        ? moment.tz(lastMealDate, 'YYYY-MM-DD', 'Asia/Bangkok')
        : null;

      const lastMealDateStr = lastMealMoment
        ? lastMealMoment.format('YYYY-MM-DD')
        : null;
      const todayStr = today.format('YYYY-MM-DD');
      const yesterdayStr = yesterday.format('YYYY-MM-DD');

      this.logger.debug(`Last meal date from database: ${lastMealDate}`);
      this.logger.debug(
        `Last meal date string (Asia/Bangkok): ${lastMealDateStr}`,
      );
      this.logger.debug(`Today (Asia/Bangkok): ${todayStr}`);
      this.logger.debug(`Yesterday (Asia/Bangkok): ${yesterdayStr}`);
      this.logger.debug(`Current streak count: ${streakCount}`);
      this.logger.debug(
        `Last meal date is today:`,
        lastMealDateStr === todayStr,
      );
      this.logger.debug(
        `Last meal date is yesterday:`,
        lastMealDateStr === yesterdayStr,
      );

      if (lastMealDateStr === todayStr || lastMealDateStr === yesterdayStr) {
        return streakCount;
      } else {
        return 0;
      }
    } catch (error) {
      this.logger.error('Error at [getUserStreaks]:', error);
      throw error;
    }
  }

  async countTotalDays(userId: number) {
    this.logger.debug(`Counting total days for userId: ${userId}`);
    const result: { totalDays: number }[] = await this.entityManager.query(
      `
      SELECT COUNT(DISTINCT DATE(createdAt)) AS totalDays
      FROM meals
      WHERE userId = ?
    `,
      [userId],
    );
    this.logger.debug(`Total days result:`, result);
    return result[0]?.totalDays || 0;
  }
}
