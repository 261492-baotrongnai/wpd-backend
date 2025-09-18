import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';
import { Meal } from 'src/meals/entities/meal.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('foods')
export class Food {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'longtext', nullable: true })
  suggested_name: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  scoring_log: ScoringLog;

  @Column({ type: 'enum', enum: ['A', 'B', 'C'] })
  grade: FoodGradeType;

  @Column({ type: 'boolean', default: false, nullable: true })
  grading_by_rule: boolean;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Meal, (meal) => meal.foods, { onDelete: 'CASCADE' })
  meal: Meal;

  constructor(food: Partial<Food>) {
    Object.assign(this, food);
  }
}

export type ScoringLog = {
  cooking_method: { method: string; deduction: number }[];
  meat: number | null;
  vegetable: number | null;
  rice: { rice: string; deduction: number }[];
  noodle: { noodle: string; deduction: number }[];
  fruit: number | null;
  sweet: number | null;
  drink: { drink: string; deduction: number }[];
  snack: number | null;
  sauce: number | null;
  grain: number | null;
};
