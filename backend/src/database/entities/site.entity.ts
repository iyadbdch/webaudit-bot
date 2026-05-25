import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany
} from 'typeorm';
import { UptimeLog } from './uptime-log.entity';
import { Snapshot } from './snapshot.entity';
import { AuditResult } from './audit-result.entity';
import { LighthouseReport } from './lighthouse-report.entity';
import { AlertRule } from './alert-rule.entity';

export type CheckType = 'uptime' | 'change' | 'audit' | 'lighthouse';

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  url: string;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 5 })
  uptimeInterval: number;

  @Column({ default: 60 })
  changeInterval: number;

  @Column({ default: 1440 })
  auditInterval: number;

  @Column({ default: 1440 })
  lighthouseInterval: number;

  @Column({ default: false })
  uptimeEnabled: boolean;

  @Column({ default: false })
  changeEnabled: boolean;

  @Column({ default: false })
  auditEnabled: boolean;

  @Column({ default: false })
  lighthouseEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UptimeLog, (log) => log.site, { cascade: true })
  uptimeLogs: UptimeLog[];

  @OneToMany(() => Snapshot, (s) => s.site, { cascade: true })
  snapshots: Snapshot[];

  @OneToMany(() => AuditResult, (a) => a.site, { cascade: true })
  auditResults: AuditResult[];

  @OneToMany(() => LighthouseReport, (l) => l.site, { cascade: true })
  lighthouseReports: LighthouseReport[];

  @OneToMany(() => AlertRule, (a) => a.site, { cascade: true })
  alertRules: AlertRule[];
}
