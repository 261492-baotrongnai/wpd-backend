import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  accessToken: string;

  @Column({ default: true })
  isActive: boolean;

  constructor(user: Partial<User>) {
    Object.assign(this, user);
  }
}
