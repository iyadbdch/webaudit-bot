import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SchedulerService } from '../../common/scheduler.service';
import { SitesService } from '../sites/sites.service';
import { LighthouseReport } from '../../database/entities/lighthouse-report.entity';
import { Site } from '../../database/entities/site.entity';
import { execSync } from 'child_process';

@Injectable()
export class LighthouseService {
  private readonly logger = new Logger(LighthouseService.name);
  private readonly lighthousePath: string;

  constructor(
    @InjectRepository(LighthouseReport)
    private reportsRepo: Repository<LighthouseReport>,
    @InjectRepository(Site)
    private sitesRepo: Repository<Site>,
    private scheduler: SchedulerService,
    private sitesService: SitesService,
    private config: ConfigService,
  ) {
    this.lighthousePath = config.get<string>('lighthouse.path') || 'npx lighthouse';
    this.initScheduler();
  }

  private initScheduler() {
    this.scheduler.register(
      'lighthouse-runner',
      'Lighthouse Auditor',
      60000,
      () => this.runAllScheduled(),
    );
    this.scheduler.start('lighthouse-runner');
  }

  async runAllScheduled() {
    const sites = await this.sitesRepo.find({
      where: { isActive: true, lighthouseEnabled: true },
    });

    for (const site of sites) {
      const last = await this.reportsRepo.findOne({
        where: { siteId: site.id },
        order: { ranAt: 'DESC' },
      });
      const elapsed = last
        ? (Date.now() - last.ranAt.getTime()) / 60000
        : Infinity;

      if (elapsed >= site.lighthouseInterval) {
        this.runReport(site).catch((err) =>
          this.logger.error(`Lighthouse failed for ${site.url}: ${err.message}`),
        );
      }
    }
  }

  async runReport(site: Site): Promise<LighthouseReport> {
    try {
      const output = execSync(
        `${this.lighthousePath} ${site.url} --output json --chrome-flags="--headless --no-sandbox"`,
        { timeout: 180000, encoding: 'utf-8' },
      );

      let parsed: any = {};
      try {
        parsed = JSON.parse(output);
      } catch {
        parsed = { raw: output };
      }

      const categories = parsed.categories || {};
      const report = this.reportsRepo.create({
        siteId: site.id,
        performance: (categories.performance?.score || 0) * 100,
        accessibility: (categories.accessibility?.score || 0) * 100,
        bestPractices: (categories['best-practices']?.score || 0) * 100,
        seo: (categories.seo?.score || 0) * 100,
        pwa: (categories.pwa?.score || 0) * 100,
        rawJson: JSON.stringify(parsed),
      });
      return this.reportsRepo.save(report);
    } catch (err) {
      const report = this.reportsRepo.create({
        siteId: site.id,
        rawJson: JSON.stringify({ error: err.message }),
      });
      return this.reportsRepo.save(report);
    }
  }

  async getReports(siteId: string, limit = 20): Promise<LighthouseReport[]> {
    return this.reportsRepo.find({
      where: { siteId },
      order: { ranAt: 'DESC' },
      take: limit,
    });
  }

  async getLatest(siteId: string): Promise<LighthouseReport | null> {
    return this.reportsRepo.findOne({
      where: { siteId },
      order: { ranAt: 'DESC' },
    });
  }
}
