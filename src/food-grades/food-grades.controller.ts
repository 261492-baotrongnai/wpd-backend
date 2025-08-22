import { Controller, Logger } from '@nestjs/common';
import { FoodGradesService } from './food-grades.service';
// import { UpdateFoodGradeDto } from './dto/update-food-grade.dto';

@Controller('food-grades')
export class FoodGradesController {
  private readonly logger = new Logger(FoodGradesController.name);
  constructor(private readonly foodGradesService: FoodGradesService) {}
}
