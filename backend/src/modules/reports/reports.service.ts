import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SchedulerService } from '../../common/scheduler.service';
import { OpenwaClient } from '../../common/openwa-client';
import { UptimeLog } from '../../database/entities/uptime-log.entity';
import { ChangeLog } from '../../database/entities/change-log.entity';
import { AuditResult } from '../../database/entities/audit-result.entity';
import { LighthouseReport } from '../../database/entities/lighthouse-report.entity';
import { Site } from '../../database/entities/site.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(UptimeLog)
    private uptimeRepo: Repository<UptimeLog>,
    @InjectRepository(ChangeLog)
    private changesRepo: Repository<ChangeLog>,
    @InjectRepository(AuditResult)
    private auditsRepo: Repository<AuditResult>,
    @InjectRepository(LighthouseReport)
    private lhRepo: Repository<LighthouseReport>,
    @InjectRepository(Site)
    private sitesRepo: Repository<Site>,
    private scheduler: SchedulerService,
    private wa: OpenwaClient,
    private config: ConfigService,
  ) {
    this.initScheduler();
  }

  private initScheduler() {
    const dailyHour = this.config.get('reports.dailyHour');
    const msUntilDaily = this.msUntilNextDaily(dailyHour);
    setTimeout(() => {
      this.sendDailyReports();
      const day = this.config.get('reports.weeklyDay');
      setInterval(() => this.sendDailyReports(), 86400000);
      this.scheduler.register('weekly-report', 'Weekly Report', 604800000, () =>
        this.sendWeeklyReports(),
      );
      this.scheduler.start('weekly-report');
    }, msUntilDaily);
  }

  private msUntilNextDaily(hour: number): number {
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.getTime() - now.getTime();
  }

  async sendDailyReports() {
    const sites = await this.sitesRepo.find({ where: { isActive: true } });
    for (const site of sites) {
      const report = await this.generateReport(site.id, 'daily');
      await this.wa.sendText(
        process.env.WHATSAPP_NOTIFY_CHAT_ID || '',
        report,
      );
    }
  }

  async sendWeeklyReports() {
    const sites = await this.sitesRepo.find({ where: { isActive: true } });
    for (const site of sites) {
      const report = await this.generateReport(site.id, 'weekly');
      await this.wa.sendText(
        process.env.WHATSAPP_NOTIFY_CHAT_ID || '',
        report,
      );
    }
  }

  async generateReport(siteId: string, type: 'daily' | 'weekly'): Promise<string> {
    const site = await this.sitesRepo.findOne({ where: { id: siteId } });
    if (!site) return 'Site not found';

    const since = new Date();
    since.setDate(since.getDate() - (type === 'daily' ? 1 : 7));

    const uptimeLogs = await this.uptimeRepo.count({
      where: { siteId, checkedAt: Between(since, new Date()) },
    });
    const downCount = await this.uptimeRepo.count({
      where: { siteId, status: 'down', checkedAt: Between(since, new Date()) },
    });
    const changes = await this.changesRepo.count({
      where: { siteId, detectedAt: Between(since, new Date()) },
    });
    const audit = await this.auditsRepo.findOne({
      where: { siteId },
      order: { ranAt: 'DESC' },
    });
    const lh = await this.lhRepo.findOne({
      where: { siteId },
      order: { ranAt: 'DESC' },
    });

    const uptimePct = uptimeLogs > 0
      ? Math.round(((uptimeLogs - downCount) / uptimeLogs) * 100)
      : 100;

    return [
      `📋 *${type.toUpperCase()} REPORT* — ${site.name}`,
      `📅 ${new Date().toLocaleDateString()}`,
      '',
      `📈 *Uptime:* ${uptimePct}% (${downCount} outages)`,
      `🔄 *Changes:* ${changes} detected`,
      audit ? `🔍 *Audit Score:* ${audit.score || 'N/A'}/100` : '',
      lh ? `⚡ *Lighthouse:* Perf ${lh.performance ?? 'N/A'} | A11y ${lh.accessibility ?? 'N/A'} | SEO ${lh.seo ?? 'N/A'}` : '',
      '',
      `🌐 ${site.url}`,
    ].filter(Boolean).join('\n');
  }
}
