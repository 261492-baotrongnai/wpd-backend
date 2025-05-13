import { Module } from '@nestjs/common';
import { FoodGradesService } from './food-grades.service';
import { FoodGradesController } from './food-grades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodGrade } from './entities/food-grade.entity';
import { ExternalApiService } from 'src/external-api/external-api.service';

@Module({
  imports: [TypeOrmModule.forFeature([FoodGrade])],
  controllers: [FoodGradesController],
  providers: [FoodGradesService, ExternalApiService],
  exports: [FoodGradesService, TypeOrmModule],
})
export class FoodGradesModule {}
