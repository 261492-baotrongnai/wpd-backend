import { Food } from 'src/foods/entities/food.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Meal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  imageName: string;

  @Column({
    type: 'enum',
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    nullable: true,
  })
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';

  @Column()
  avgScore: number;

  @Column({ type: 'enum', enum: ['A', 'B', 'C'] })
  avgGrade: 'A' | 'B' | 'C';

  @ManyToOne(() => User, (user) => user.meals, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Food, (food) => food.meal)
  foods: Food[];

  constructor(meal: Partial<Meal>) {
    Object.assign(this, meal);
  }
}
