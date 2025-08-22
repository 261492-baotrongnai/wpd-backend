import { Processor, WorkerHost } from '@nestjs/bullmq';
import { FoodGradesService } from './food-grades.service';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CreateFoodGradeDto } from './dto/create-food-grade.dto';

@Processor('food-grade')
export class FoodGradesProcessor extends WorkerHost {
  private readonly logger = new Logger(FoodGradesProcessor.name);

  constructor(private readonly foodGradesService: FoodGradesService) {
    super();
  }

  async process(job: Job) {
    this.logger.log(`Processing job ${job.name} with data:`, job.data);
    switch (job.name) {
      case 'create-food-grade': {
        const data = job.data as { foodData: CreateFoodGradeDto };
        return await this.foodGradesService.create(data.foodData);
      }
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }
}
