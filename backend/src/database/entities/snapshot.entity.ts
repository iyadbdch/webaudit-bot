import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Site } from './site.entity';

@Entity('snapshots')
@Index(['siteId', 'capturedAt'])
export class Snapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  siteId: string;

  @ManyToOne(() => Site, (site) => site.snapshots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @Column({ type: 'text' })
  hash: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'integer', default: 0 })
  contentLength: number;

  @CreateDateColumn()
  capturedAt: Date;
}
