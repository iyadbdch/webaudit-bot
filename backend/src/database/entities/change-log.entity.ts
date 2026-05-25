import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Site } from './site.entity';

@Entity('change_logs')
@Index(['siteId', 'detectedAt'])
export class ChangeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  siteId: string;

  @ManyToOne(() => Site, (site) => site.snapshots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @Column({ type: 'text', nullable: true })
  previousHash: string;

  @Column({ type: 'text', nullable: true })
  newHash: string;

  @Column({ type: 'integer', default: 0 })
  diffSize: number;

  @Column({ nullable: true })
  title: string;

  @CreateDateColumn()
  detectedAt: Date;
}
