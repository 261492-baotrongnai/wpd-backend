import { Controller } from '@nestjs/common';
import { FoodGradesService } from './food-grades.service';
// import { UpdateFoodGradeDto } from './dto/update-food-grade.dto';

@Controller('food-grades')
export class FoodGradesController {
  constructor(private readonly foodGradesService: FoodGradesService) {}
}
