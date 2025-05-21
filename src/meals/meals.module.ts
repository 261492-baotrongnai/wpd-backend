import { Module } from '@nestjs/common';
import { MealsService } from './meals.service';
import { MealsController } from './meals.controller';
import { Meal } from './entities/meal.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { FoodGradesService } from 'src/food-grades/food-grades.service';
import { FoodGradesModule } from 'src/food-grades/food-grades.module';
import { ExternalApiService } from 'src/external-api/external-api.service';

@Module({
  imports: [TypeOrmModule.forFeature([Meal]), FoodGradesModule],
  controllers: [MealsController],
  providers: [MealsService, JwtService, FoodGradesService, ExternalApiService],
  exports: [MealsService, TypeOrmModule],
})
export class MealsModule {}
