import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulerService } from '../../common/scheduler.service';
import { OpenwaClient } from '../../common/openwa-client';
import { SitesService } from '../sites/sites.service';
import { Snapshot } from '../../database/entities/snapshot.entity';
import { ChangeLog } from '../../database/entities/change-log.entity';
import { Site } from '../../database/entities/site.entity';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class ChangesService {
  private readonly logger = new Logger(ChangesService.name);

  constructor(
    @InjectRepository(Snapshot)
    private snapshotsRepo: Repository<Snapshot>,
    @InjectRepository(ChangeLog)
    private changesRepo: Repository<ChangeLog>,
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
      'change-detector',
      'Change Detector',
      60000,
      () => this.checkAllSites(),
    );
    this.scheduler.start('change-detector');
  }

  async checkAllSites() {
    const sites = await this.sitesRepo.find({
      where: { isActive: true, changeEnabled: true },
    });

    for (const site of sites) {
      const lastSnapshot = await this.snapshotsRepo.findOne({
        where: { siteId: site.id },
        order: { capturedAt: 'DESC' },
      });
      const elapsed = lastSnapshot
        ? (Date.now() - lastSnapshot.capturedAt.getTime()) / 60000
        : Infinity;

      if (elapsed >= site.changeInterval) {
        this.checkSite(site).catch((err) =>
          this.logger.error(`Change check failed for ${site.url}: ${err.message}`),
        );
      }
    }
  }

  async checkSite(site: Site): Promise<ChangeLog | null> {
    try {
      const resp = await axios.get(site.url, {
        timeout: 30000,
        headers: { 'User-Agent': 'WebAuditBot/1.0' },
      });

      const content = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      const title = content.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';

      const lastSnapshot = await this.snapshotsRepo.findOne({
        where: { siteId: site.id },
        order: { capturedAt: 'DESC' },
      });

      const snapshot = this.snapshotsRepo.create({
        siteId: site.id,
        hash,
        title,
        contentLength: content.length,
      });
      await this.snapshotsRepo.save(snapshot);

      if (lastSnapshot && lastSnapshot.hash !== hash) {
        const changeLog = this.changesRepo.create({
          siteId: site.id,
          previousHash: lastSnapshot.hash,
          newHash: hash,
          diffSize: Math.abs(content.length - lastSnapshot.contentLength),
          title,
        });
        await this.changesRepo.save(changeLog);

        await this.wa.sendText(
          process.env.WHATSAPP_NOTIFY_CHAT_ID || '',
          `🔄 *Change Detected* — ${site.name}\n${site.url}\nTitle: ${title}\nSize change: ${changeLog.diffSize} chars`,
        );

        return changeLog;
      }

      return null;
    } catch (err) {
      this.logger.error(`Change check error for ${site.url}: ${err.message}`);
      return null;
    }
  }

  async getSnapshots(siteId: string, limit = 20): Promise<Snapshot[]> {
    return this.snapshotsRepo.find({
      where: { siteId },
      order: { capturedAt: 'DESC' },
      take: limit,
    });
  }

  async getChanges(siteId: string, limit = 50): Promise<ChangeLog[]> {
    return this.changesRepo.find({
      where: { siteId },
      order: { detectedAt: 'DESC' },
      take: limit,
    });
  }
}
