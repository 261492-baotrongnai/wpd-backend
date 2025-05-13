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
}

export type FoodGradeType = 'A' | 'B' | 'C';
