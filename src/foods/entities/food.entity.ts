import { Meal } from 'src/meals/entities/meal.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Food {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['A', 'B', 'C'] })
  grade: 'A' | 'B' | 'C';

  @ManyToOne(() => Meal, (meal) => meal.foods, { onDelete: 'CASCADE' })
  meal: Meal;
}
