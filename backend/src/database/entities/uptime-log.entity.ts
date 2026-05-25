import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Site } from './site.entity';

export type UptimeStatus = 'up' | 'down' | 'slow';

@Entity('uptime_logs')
@Index(['siteId', 'checkedAt'])
export class UptimeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  siteId: string;

  @ManyToOne(() => Site, (site) => site.uptimeLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @Column({ type: 'varchar', length: 10 })
  status: UptimeStatus;

  @Column({ nullable: true })
  statusCode: number;

  @Column({ nullable: true, type: 'float' })
  responseTime: number;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  checkedAt: Date;
}
