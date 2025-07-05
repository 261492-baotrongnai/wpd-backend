import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';
import { Food } from 'src/foods/entities/food.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('meals')
export class Meal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  imageName: string;

  @Column({
    type: 'enum',
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    nullable: true,
    default: 'snack',
  })
  mealType: MealType;

  @Column({ type: 'float', default: 0 })
  avgScore: number;

  @Column({ type: 'enum', enum: ['A', 'B', 'C'] })
  avgGrade: FoodGradeType;

  @ManyToOne(() => User, (user) => user.meals, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Food, (food) => food.meal)
  foods: Food[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  constructor(meal: Partial<Meal>) {
    Object.assign(this, meal);
  }
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
