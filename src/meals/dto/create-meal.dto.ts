import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';
import { MealType } from '../entities/meal.entity';

export class CreateMealDto {
  imageName: string;
  mealType: MealType;
  avgScore: number;
  avgGrade: FoodGradeType;
  userId: number;
  maxScore: number;
  lowestGrade: FoodGradeType;
  createdAt?: Date;
}
