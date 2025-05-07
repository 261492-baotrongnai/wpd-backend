import { User } from 'src/users/entities/user.entity';

export class CreateImageDto {
  name: string;
  user: User;
}
