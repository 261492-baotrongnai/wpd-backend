import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';
import { Meal } from 'src/meals/entities/meal.entity';

export class CreateFoodDto {
  name: string;
  description?: string;
  grade: FoodGradeType;
  meal: Meal;
}
