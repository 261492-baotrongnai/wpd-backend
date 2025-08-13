import { Organization } from 'src/organizations/entities/organization.entity';
import { Program } from 'src/programs/entities/programs.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  internalId: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToMany(() => Program, (program) => program.admins)
  @JoinTable({
    name: 'admin_programs',
    joinColumns: [{ name: 'adminId' }],
    inverseJoinColumns: [{ name: 'programId' }],
  })
  programs: Program[];

  @ManyToMany(() => Organization, (organization) => organization.admins)
  @JoinTable({
    name: 'admin_organizations',
    joinColumns: [{ name: 'adminId' }],
    inverseJoinColumns: [{ name: 'organizationId' }],
  })
  organizations: Organization[];
}
