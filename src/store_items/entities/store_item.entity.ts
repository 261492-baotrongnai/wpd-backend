import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('store_items')
export class StoreItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['frame', 'others'], default: 'others' })
  category: StoreItemCategory;

  @Column({ type: 'int', nullable: true })
  pointsRequired: number;

  @ManyToMany(() => User, (user) => user.storeItems)
  users: User[];
}

export type StoreItemCategory = 'frame' | 'others';
