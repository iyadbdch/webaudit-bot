import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Site } from './site.entity';

@Entity('lighthouse_reports')
@Index(['siteId', 'ranAt'])
export class LighthouseReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  siteId: string;

  @ManyToOne(() => Site, (site) => site.lighthouseReports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @Column({ nullable: true, type: 'float' })
  performance: number;

  @Column({ nullable: true, type: 'float' })
  accessibility: number;

  @Column({ nullable: true, type: 'float' })
  bestPractices: number;

  @Column({ nullable: true, type: 'float' })
  seo: number;

  @Column({ nullable: true, type: 'float' })
  pwa: number;

  @Column({ type: 'text', nullable: true })
  rawJson: string;

  @CreateDateColumn()
  ranAt: Date;
}
