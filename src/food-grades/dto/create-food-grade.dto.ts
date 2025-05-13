import { FoodGradeType } from '../entities/food-grade.entity';

export class CreateFoodGradeDto {
  grade: FoodGradeType;
  category: string;
  names: string[];
}
