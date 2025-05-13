import { Module } from '@nestjs/common';
import { MealsService } from './meals.service';
import { MealsController } from './meals.controller';
import { Meal } from './entities/meal.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Meal])],
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService, TypeOrmModule],
})
export class MealsModule {}
