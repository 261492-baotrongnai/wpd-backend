import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('followers')
export class Follower {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  userId: string;
}
