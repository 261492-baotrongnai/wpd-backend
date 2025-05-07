import { UserState } from 'src/user-states/entities/user-state.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pending_uploads')
export class PendingUpload {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => UserState, (userState) => userState.pendingUpload, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'userStateId' })
  userState: UserState;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  status: string;

  constructor(pendingUpload: Partial<PendingUpload>) {
    Object.assign(this, pendingUpload);
  }
}
