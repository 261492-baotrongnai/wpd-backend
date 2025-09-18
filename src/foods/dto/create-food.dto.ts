import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';
import { Meal } from 'src/meals/entities/meal.entity';
import { ScoringLog } from '../entities/food.entity';

export class CreateFoodDto {
  name: string;
  description?: string;
  grade: FoodGradeType;
  meal: Meal;
  grading_by_ai?: boolean;
  scoring_log?: ScoringLog;
  grading_by_rule?: boolean;
  is_confirmed?: boolean;
}
