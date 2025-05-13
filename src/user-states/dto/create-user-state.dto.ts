import { MealType } from 'src/meals/entities/meal.entity';
import { User } from 'src/users/entities/user.entity';

export class CreateUserStateDto {
  user: User;
  state: string;
  menuName?: { name: string[] }[] | null;
  pendingFile?: { fileName: string; filePath: string } | null;
  mealType?: MealType;
}
