import { PendingUpload } from 'src/pending-uploads/entities/pending-uploads.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_states')
export class UserState {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.states, { onDelete: 'CASCADE' })
  user: User;

  @OneToOne(() => PendingUpload, (pendingUpload) => pendingUpload.userState, {
    nullable: true,
  })
  pendingUpload: PendingUpload | null;

  @Column()
  state: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  constructor(userState: Partial<UserState>) {
    Object.assign(this, userState);
  }
}
