import { User } from 'src/users/entities/user.entity';

export class CreateUserStateDto {
  user: User;
  state: string;
}
