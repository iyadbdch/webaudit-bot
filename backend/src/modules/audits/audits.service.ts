import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SchedulerService } from '../../common/scheduler.service';
import { SitesService } from '../sites/sites.service';
import { AuditResult } from '../../database/entities/audit-result.entity';
import { Site } from '../../database/entities/site.entity';
import { execSync } from 'child_process';
import * as path from 'path';

@Injectable()
export class AuditsService {
  private readonly logger = new Logger(AuditsService.name);
  private readonly scriptPath: string;

  constructor(
    @InjectRepository(AuditResult)
    private auditsRepo: Repository<AuditResult>,
    @InjectRepository(Site)
    private sitesRepo: Repository<Site>,
    private scheduler: SchedulerService,
    private sitesService: SitesService,
    private config: ConfigService,
  ) {
    this.scriptPath = config.get<string>('audit.scriptPath') || path.resolve(__dirname, '../../..', 'scripts/WebAudit.ps1');
    this.initScheduler();
  }

  private initScheduler() {
    this.scheduler.register(
      'audit-runner',
      'Audit Engine',
      60000,
      () => this.runAllScheduled(),
    );
    this.scheduler.start('audit-runner');
  }

  async runAllScheduled() {
    const sites = await this.sitesRepo.find({
      where: { isActive: true, auditEnabled: true },
    });

    for (const site of sites) {
      const lastAudit = await this.auditsRepo.findOne({
        where: { siteId: site.id },
        order: { ranAt: 'DESC' },
      });
      const elapsed = lastAudit
        ? (Date.now() - lastAudit.ranAt.getTime()) / 60000
        : Infinity;

      if (elapsed >= site.auditInterval) {
        this.runAudit(site, 'full').catch((err) =>
          this.logger.error(`Audit failed for ${site.url}: ${err.message}`),
        );
      }
    }
  }

  async runAudit(site: Site, type: string = 'full'): Promise<AuditResult> {
    try {
      const tempDir = path.resolve(__dirname, '../../..', 'data', 'audits', site.id.substring(0, 8));
      const output = execSync(
        `powershell -NoProfile -ExecutionPolicy Bypass -File "${this.scriptPath}" -Url "${site.url}" -OutputDir "${tempDir}" -RequestTimeoutSec 20 -MaxPagesFromSitemap 100`,
        { timeout: 300000, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 },
      );

      let parsed: any = {};
      const jsonStart = output.indexOf('{');
      if (jsonStart >= 0) {
        try {
          parsed = JSON.parse(output.substring(jsonStart));
        } catch {
          parsed = { raw: output.slice(0, 2000) };
        }
      }

      const score = parsed.score?.overall ?? null;
      const grade = parsed.score?.grade ?? null;
      const summary = parsed.summary || {};
      const pages = parsed.pages || [];
      const issues = parsed.issues || [];

      const result = this.auditsRepo.create({
        siteId: site.id,
        type: type as any,
        score: score,
        summary: summary.totalPages
          ? `Pages: ${summary.totalPages} | Issues: ${summary.issuesCount} | Grade: ${grade || 'N/A'} | Avg TTFB: ${summary.avgTtfbMs || '?'}ms | Avg Size: ${summary.avgSizeKb || '?'}KB`
          : JSON.stringify(summary).slice(0, 1000),
        rawJson: JSON.stringify({
          meta: parsed.meta,
          score: parsed.score,
          summary: summary,
          categories: parsed.score?.categories,
          issuesCount: issues.length,
          pagesCount: pages.length,
          pagesWithNoindex: summary.pagesWithNoindex,
          pagesWithMixedContent: summary.pagesWithMixedContent,
          pagesMissingAlt: summary.pagesMissingAlt,
          duplicateTitles: summary.duplicateTitles,
        }),
        passed: summary.pctWithTitle || 0,
        warnings: issues.filter((i: any) => i.Severity === 'Medium' || i.Severity === 'Low').length,
        errors: issues.filter((i: any) => i.Severity === 'Critical' || i.Severity === 'High').length,
      });
      return this.auditsRepo.save(result);
    } catch (err) {
      const result = this.auditsRepo.create({
        siteId: site.id,
        type: type as any,
        summary: `Audit failed: ${err.message}`,
        rawJson: JSON.stringify({ error: err.message }),
        errors: 1,
      });
      return this.auditsRepo.save(result);
    }
  }

  async getAudits(siteId: string, limit = 20): Promise<AuditResult[]> {
    return this.auditsRepo.find({
      where: { siteId },
      order: { ranAt: 'DESC' },
      take: limit,
    });
  }

  async getLatest(siteId: string): Promise<AuditResult | null> {
    return this.auditsRepo.findOne({
      where: { siteId },
      order: { ranAt: 'DESC' },
    });
  }
}
