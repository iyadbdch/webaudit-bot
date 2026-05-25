import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SchedulerService } from '../../common/scheduler.service';
import { OpenwaClient } from '../../common/openwa-client';
import { SitesService } from '../sites/sites.service';
import { UptimeLog } from '../../database/entities/uptime-log.entity';
import { Site } from '../../database/entities/site.entity';
import axios from 'axios';
import * as https from 'https';

const sharedHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 20,
  timeout: 10000,
  scheduling: 'lifo',
});

@Injectable()
export class UptimeService {
  private readonly logger = new Logger(UptimeService.name);
  private readonly CHECK_TIMEOUT = 15000;

  constructor(
    @InjectRepository(UptimeLog)
    private logsRepo: Repository<UptimeLog>,
    @InjectRepository(Site)
    private sitesRepo: Repository<Site>,
    private scheduler: SchedulerService,
    private sitesService: SitesService,
    private wa: OpenwaClient,
  ) {
    this.initScheduler();
  }

  private initScheduler() {
    this.scheduler.register(
      'uptime-checker',
      'Uptime Monitor',
      60000,
      () => this.checkAllSites(),
    );
    this.scheduler.start('uptime-checker');
  }

  async checkAllSites() {
    const sites = await this.sitesRepo.find({
      where: { isActive: true, uptimeEnabled: true },
    });

    for (const site of sites) {
      const lastLog = await this.logsRepo.findOne({
        where: { siteId: site.id },
        order: { checkedAt: 'DESC' },
      });

      const elapsed = lastLog
        ? (Date.now() - lastLog.checkedAt.getTime()) / 60000
        : Infinity;

      if (elapsed >= site.uptimeInterval) {
        this.checkSite(site).catch((err) =>
          this.logger.error(`Check failed for ${site.url}: ${err.message}`),
        );
      }
    }
  }

  async checkSite(site: Site): Promise<UptimeLog> {
    const start = Date.now();
    let status: 'up' | 'down' | 'slow' = 'down';
    let statusCode = 0;
    let error: string | null = null;

    try {
      const resp = await axios.get(site.url, {
        timeout: this.CHECK_TIMEOUT,
        validateStatus: () => true,
        headers: { 'User-Agent': 'WebAuditBot/1.0', 'Connection': 'keep-alive' },
        httpsAgent: sharedHttpsAgent,
      });
      statusCode = resp.status;
      const responseTime = Date.now() - start;

      if (statusCode >= 200 && statusCode < 400) {
        status = responseTime > 5000 ? 'slow' : 'up';
      } else {
        status = 'down';
      }
    } catch (err) {
      error = err.message;
      status = 'down';
    }

    const log = this.logsRepo.create({
      siteId: site.id,
      status,
      statusCode,
      responseTime: Date.now() - start,
      error,
    });
    await this.logsRepo.save(log);

    await this.handleStatusChange(site, log);
    return log;
  }

  private async handleStatusChange(site: Site, log: UptimeLog) {
    const logs = await this.logsRepo.find({
      where: { siteId: site.id },
      order: { checkedAt: 'DESC' },
      take: 2,
    });
    const previous = logs.length > 1 ? logs[1] : null;

    if (!previous) return;
    if (previous.status === log.status) return;
    if (log.status === 'up' || log.status === 'slow') {
      await this.wa.sendText(
        process.env.WHATSAPP_NOTIFY_CHAT_ID || '',
        `✅ *BACK UP* — ${site.name}\n${site.url}\nStatus: HTTP ${log.statusCode} | ${log.responseTime}ms`,
      );
    } else {
      await this.wa.sendText(
        process.env.WHATSAPP_NOTIFY_CHAT_ID || '',
        `🔴 *DOWN* — ${site.name}\n${site.url}\nError: ${log.error || `HTTP ${log.statusCode}`}\nChecked at: ${log.checkedAt.toLocaleTimeString()}`,
      );
    }
  }

  async getLogs(siteId: string, limit = 100): Promise<UptimeLog[]> {
    return this.logsRepo.find({
      where: { siteId },
      order: { checkedAt: 'DESC' },
      take: limit,
    });
  }

  async getStats(siteId: string): Promise<any> {
    const total = await this.logsRepo.count({ where: { siteId } });
    const up = await this.logsRepo.count({ where: { siteId, status: 'up' } });
    const down = await this.logsRepo.count({ where: { siteId, status: 'down' } });
    const slow = await this.logsRepo.count({ where: { siteId, status: 'slow' } });
    return {
      total,
      up,
      down,
      slow,
      uptimePercent: total > 0 ? Math.round((up / total) * 10000) / 100 : 100,
    };
  }
}
