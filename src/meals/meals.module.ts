import { Module } from '@nestjs/common';
import { MealsService } from './meals.service';
import { MealsController } from './meals.controller';
import { Meal } from './entities/meal.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Meal])],
  controllers: [MealsController],
  providers: [MealsService, JwtService],
  exports: [MealsService, TypeOrmModule],
})
export class MealsModule {}
