import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  Logger,
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
  @Get('today')
  findTodayByUser(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    this.logger.log('[/meals/today] for user: ', req.user.internalId);
    return this.mealsService.findTodayByUser(+req.user.id);
  }
}
