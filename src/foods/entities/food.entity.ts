import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';
import { Meal } from 'src/meals/entities/meal.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Food {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['A', 'B', 'C'] })
  grade: FoodGradeType;

  @ManyToOne(() => Meal, (meal) => meal.foods, { onDelete: 'CASCADE' })
  meal: Meal;

  constructor(food: Partial<Food>) {
    Object.assign(this, food);
  }
}
