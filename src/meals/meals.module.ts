import { Module } from '@nestjs/common';
import { MealsService } from './meals.service';
import { MealsController } from './meals.controller';
import { Meal } from './entities/meal.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { FoodGradesService } from 'src/food-grades/food-grades.service';
import { FoodGradesModule } from 'src/food-grades/food-grades.module';
import { ExternalApiService } from 'src/external-api/external-api.service';
import { MealsJobService } from './meals.job';
import { MealsProcessor } from './meals.worker';
import { BullModule } from '@nestjs/bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal]),
    FoodGradesModule,
    BullModule.registerQueue({
      name: 'meal',
    }),
  ],
  controllers: [MealsController],
  providers: [
    MealsService,
    JwtService,
    FoodGradesService,
    ExternalApiService,
    MealsJobService,
    MealsProcessor,
    QueueEventsRegistryService,
  ],
  exports: [MealsService, TypeOrmModule],
})
export class MealsModule {}
