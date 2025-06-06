import { MealType } from 'src/meals/entities/meal.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_states')
export class UserState {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.states, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'json', nullable: true })
  pendingFile: { fileName: string; filePath: string } | null;

  @Column()
  state: string;

  @Column({ type: 'json', nullable: true })
  menuName: { name: string[] }[] | null;

  @Column({
    type: 'enum',
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    nullable: true,
  })
  mealType: MealType;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  constructor(userState: Partial<UserState>) {
    Object.assign(this, userState);
  }
}
