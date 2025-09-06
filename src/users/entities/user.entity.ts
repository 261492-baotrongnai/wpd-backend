import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Image } from 'src/images/entities/image.entity';
import { UserState } from 'src/user-states/entities/user-state.entity';
import { Meal } from 'src/meals/entities/meal.entity';
import { Program } from 'src/programs/entities/programs.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  internalId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'int', default: 0 })
  streaks: number;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'int', default: 0 })
  totalDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Image, (image) => image.user)
  images: Image[];

  @OneToMany(() => UserState, (userState) => userState.user)
  states: UserState[];

  @OneToMany(() => Meal, (meal) => meal.user)
  meals: Meal[];

  @ManyToMany(() => Program, (program) => program.users, {
    onDelete: 'CASCADE',
  })
  programs: Program[];

  constructor(user: Partial<User>) {
    Object.assign(this, user);
  }
}
