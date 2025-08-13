import { Admin } from 'src/admin/entities/admin.entity';
import { Program } from 'src/programs/entities/programs.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  thai_name: string;

  @Column()
  eng_name: string;

  @Column({ type: 'text', nullable: true })
  code_name?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Program, (program) => program.organization)
  programs: Program[];

  @ManyToMany(() => Admin, (admin) => admin.organizations)
  admins: Admin[];

  constructor(organization: Partial<Organization>) {
    Object.assign(this, organization);
  }
}
