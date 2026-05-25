import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Site } from './site.entity';

export type AlertEvent = 'downtime' | 'uptime_recovery' | 'content_change' | 'audit_threshold' | 'audit_complete' | 'scheduled_report';

@Entity('alert_rules')
@Index(['siteId', 'event'])
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  siteId: string;

  @ManyToOne(() => Site, (site) => site.alertRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @Column({ type: 'varchar', length: 30 })
  event: AlertEvent;

  @Column({ default: true })
  whatsappEnabled: boolean;

  @Column({ nullable: true })
  threshold: number;

  @Column({ type: 'text', nullable: true })
  customMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
