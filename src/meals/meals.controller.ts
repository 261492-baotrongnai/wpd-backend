import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  Logger,
  Query,
} from '@nestjs/common';
import { MealsService } from './meals.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { UpdateMealDto } from './dto/update-meal.dto';

@Controller('meals')
export class MealsController {
  logger = new Logger(MealsController.name);
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  create(@Body() createMealDto: CreateMealDto) {
    return this.mealsService.create(createMealDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  findAllByUser(@Request() req: { user: { internalId: string; id: number } }) {
    this.logger.log('[/meals/all] for user: ', req.user.internalId);
    return this.mealsService.findAllByUser(+req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('day')
  findMealsByDay(
    @Request()
    req: {
      user: { internalId: string; id: number };
    },
    @Query('date')
    date: string,
  ) {
    this.logger.log('[/meals/day] for user: ', req.user.internalId);
    this.logger.log('[/meals/day] for date: ', date);
    return this.mealsService.findMealsByDay(+req.user.id, date);
  }

  @UseGuards(JwtAuthGuard)
  @Get('day/stats')
  async getStatsOfDay(
    @Request() req: { user: { internalId: string; id: number } },
    @Query('date') date: string,
  ) {
    this.logger.log('[/meals/day/stats] for user: ', req.user.internalId);
    this.logger.log('[/meals/day/stats] for date: ', date);
    const uid = +req.user.id;
    const meals = await this.mealsService.findMealsByDay(uid, date);
    const stats = this.mealsService.getSummaryStats(meals);
    return { meals, stats };
  }

  @UseGuards(JwtAuthGuard)
  @Get('today')
  findTodayMealsByUser(
    @Request()
    req: {
      user: { internalId: string; id: number };
    },
  ) {
    this.logger.log('[/meals/today] for user: ', req.user.internalId);
    return this.mealsService.findTodayMealsByUser(+req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('today/stats')
  async getStatsOfToDay(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    this.logger.log('[/meals/today/stats] for user: ', req.user.internalId);
    const uid = +req.user.id;
    const meals = await this.mealsService.findTodayMealsByUser(uid);
    const stats = this.mealsService.getSummaryStats(meals);
    return { meals, stats };
  }

  @UseGuards(JwtAuthGuard)
  @Get('today-summary')
  getTodaySummary(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    this.logger.log('[/food-grades/today-summary] for user: ', req.user.id);
    return this.mealsService.getTodaySummary(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('week-summary')
  getWeekSummary(@Request() req: { user: { internalId: string; id: number } }) {
    this.logger.log('[/food-grades/week-summary] for user: ', req.user.id);
    return this.mealsService.getWeekSummary(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('month-summary')
  getMonthSummary(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    console.log('[/food-grades/month-summary] for user: ', req.user.id);
    return this.mealsService.getMonthSummary(req.user.id);
  }
}
