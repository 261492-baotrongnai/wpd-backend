import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';
import { Meal } from 'src/meals/entities/meal.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('foods')
export class Food {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['A', 'B', 'C'] })
  grade: FoodGradeType;

  @Column({ type: 'boolean', default: false, nullable: true })
  grading_by_ai: boolean;

  @Column({ type: 'boolean', default: false, nullable: true })
  is_confirmed: boolean;

  @Column({ type: 'boolean', default: false, nullable: true })
  is_rejected: boolean;

  @Column({ type: 'enum', enum: ['A', 'B', 'C'], nullable: true })
  unconfirmed_grade: FoodGradeType;

  @Column({ type: 'longtext', nullable: true })
  unconfirmed_description: string;

  @ManyToOne(() => Meal, (meal) => meal.foods, { onDelete: 'CASCADE' })
  meal: Meal;

  constructor(food: Partial<Food>) {
    Object.assign(this, food);
  }
}
