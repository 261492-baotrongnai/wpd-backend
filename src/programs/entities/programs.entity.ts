import { Admin } from 'src/admin/entities/admin.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  code?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToMany(() => Admin, (admin) => admin.programs)
  admins: Admin[];

  @ManyToMany(() => User, (user) => user.programs)
  @JoinTable({
    name: 'user_programs',
    joinColumn: { name: 'programId' },
    inverseJoinColumn: { name: 'userId' },
  })
  users: User[];

  @ManyToOne(() => Organization, (organization) => organization.programs)
  organization: Organization;

  constructor(program: Partial<Program>) {
    Object.assign(this, program);
  }
}
