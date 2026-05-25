import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Site } from './site.entity';

export type AuditType = 'seo' | 'accessibility' | 'performance' | 'security' | 'full';

@Entity('audit_results')
@Index(['siteId', 'ranAt'])
export class AuditResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  siteId: string;

  @ManyToOne(() => Site, (site) => site.auditResults, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @Column({ type: 'varchar', length: 20 })
  type: AuditType;

  @Column({ nullable: true, type: 'float' })
  score: number;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  rawJson: string;

  @Column({ type: 'integer', default: 0 })
  passed: number;

  @Column({ type: 'integer', default: 0 })
  warnings: number;

  @Column({ type: 'integer', default: 0 })
  errors: number;

  @CreateDateColumn()
  ranAt: Date;
}
