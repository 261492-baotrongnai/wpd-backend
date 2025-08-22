import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('food_grades')
export class FoodGrade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['A', 'B', 'C'],
  })
  grade: FoodGradeType;

  @Column({
    type: 'enum',
    enum: ['อาหาร-ของว่าง', 'ผลไม้', 'เครื่องดื่ม', 'ธัญพืช'],
    nullable: true,
  })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // @Column({ type: 'text', nullable: true })
  // imageUrl: string;
}

export const FoodGradeType = {
  A: 'A',
  B: 'B',
  C: 'C',
} as const;

export type FoodGradeType = (typeof FoodGradeType)[keyof typeof FoodGradeType];
