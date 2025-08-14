import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';
import { User } from 'src/users/entities/user.entity';
import { MealType } from '../entities/meal.entity';

export class CreateMealDto {
  imageName: string;
  mealType: MealType;
  avgScore: number;
  avgGrade: FoodGradeType;
  user: User;
  maxScore: number;
  lowestGrade: FoodGradeType;
}
