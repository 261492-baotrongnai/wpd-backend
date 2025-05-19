import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  Delete,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { MealsService } from './meals.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/users/entities/user.entity';
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
  @Get('user')
  findAllByUser(@Request() req: { user: { internalId: string; id: number } }) {
    this.logger.log('/meals/user for user: ', req.user.internalId);
    return this.mealsService.findAllByUser(+req.user.id);
  }
}
