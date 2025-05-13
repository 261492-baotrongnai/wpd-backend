import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Image } from 'src/images/entities/image.entity';
import { UserState } from 'src/user-states/entities/user-state.entity';
import { Meal } from 'src/meals/entities/meal.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  internalId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Image, (image) => image.user)
  images: Image[];

  @Column({ nullable: true })
  program_code: string;

  @OneToMany(() => UserState, (userState) => userState.user)
  states: UserState[];

  @OneToMany(() => Meal, (meal) => meal.user)
  meals: Meal[];

  constructor(user: Partial<User>) {
    Object.assign(this, user);
  }
}
