import { Module } from '@nestjs/common';
import { FoodGradesService } from './food-grades.service';
import { FoodGradesController } from './food-grades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodGrade } from './entities/food-grade.entity';
import { ExternalApiService } from 'src/external-api/external-api.service';
import { BullModule } from '@nestjs/bullmq';
import { FoodGradesProcessor } from './food-grades.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([FoodGrade]),
    BullModule.registerQueue({
      name: 'food-grade',
    }),
  ],
  controllers: [FoodGradesController],
  providers: [FoodGradesService, ExternalApiService, FoodGradesProcessor],
  exports: [FoodGradesService, TypeOrmModule],
})
export class FoodGradesModule {}
