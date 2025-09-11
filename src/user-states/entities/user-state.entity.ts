import { MealType } from 'src/meals/entities/meal.entity';
import { User } from 'src/users/entities/user.entity';
import * as line from '@line/bot-sdk';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_states')
export class UserState {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.states, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'json', nullable: true })
  pendingFile: { fileName: string; filePath: string } | null;

  @Column()
  state: string;

  @Column({ type: 'json', nullable: true })
  messageToSend:
    | line.messagingApi.TextMessage
    | line.messagingApi.ImageMessage
    | line.messagingApi.FlexMessage;

  @Column({ type: 'text', nullable: true })
  lineUserId: string;

  @Column({ type: 'json', nullable: true })
  menuName: { name: string[] }[] | null;

  @Column({
    type: 'enum',
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    nullable: true,
  })
  mealType: MealType;

  @Column({ type: 'text', nullable: true })
  geminiImageName: string;

  @Column({ type: 'json', nullable: true})
  foodGradingInfo: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  constructor(userState: Partial<UserState>) {
    Object.assign(this, userState);
  }
}
