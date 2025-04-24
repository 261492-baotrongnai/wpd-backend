import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Image } from 'src/images/entities/image.entity';

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

  constructor(user: Partial<User>) {
    Object.assign(this, user);
  }
}
