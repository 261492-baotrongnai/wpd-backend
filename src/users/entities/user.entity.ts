import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { Image } from 'src/images/entities/image.entity';
import { UserState } from 'src/user-states/entities/user-state.entity';
import { Meal } from 'src/meals/entities/meal.entity';
import { Program } from 'src/programs/entities/programs.entity';
import { Achievement } from 'src/achievements/entities/achievement.entity';
import { StoreItem } from 'src/store_items/entities/store_item.entity';

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

  // Current selected frame: FK to StoreItem (many users can share same frame)
  @ManyToOne(() => StoreItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'currentFrameId' })
  currentFrame?: StoreItem | null;

  // Convenience: expose raw FK id without loading relation
  @RelationId((user: User) => user.currentFrame)
  currentFrameId?: number | null;

  // Accumulated streak days from previous broken streak segments used to progress towards higher achievements
  @Column({ type: 'int', default: 0 })
  carryStreak: number;

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

  @ManyToMany(() => Achievement, (achievement) => achievement.users)
  @JoinTable({
    name: 'user_achievements',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'achievementId',
      referencedColumnName: 'id',
    },
  })
  achievements: Achievement[];

  @ManyToMany(() => StoreItem, (storeItem) => storeItem.users)
  @JoinTable({
    name: 'user_store_items',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'storeItemId',
      referencedColumnName: 'id',
    },
  })
  storeItems: StoreItem[];

  constructor(user: Partial<User>) {
    Object.assign(this, user);
  }
}
