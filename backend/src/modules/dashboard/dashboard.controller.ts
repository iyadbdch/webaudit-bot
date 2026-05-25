import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../../database/entities/site.entity';
import { UptimeLog } from '../../database/entities/uptime-log.entity';
import { AuditResult } from '../../database/entities/audit-result.entity';
import { LighthouseReport } from '../../database/entities/lighthouse-report.entity';
import { ChangeLog } from '../../database/entities/change-log.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    @InjectRepository(Site) private sitesRepo: Repository<Site>,
    @InjectRepository(UptimeLog) private uptimeRepo: Repository<UptimeLog>,
    @InjectRepository(AuditResult) private auditsRepo: Repository<AuditResult>,
    @InjectRepository(LighthouseReport) private lhRepo: Repository<LighthouseReport>,
    @InjectRepository(ChangeLog) private changesRepo: Repository<ChangeLog>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard overview data' })
  async getOverview() {
    const sites = await this.sitesRepo.find();
    const activeSites = sites.filter((s) => s.isActive);
    const totalSites = sites.length;
    const recentChanges = await this.changesRepo.count({
      where: { detectedAt: new Date(Date.now() - 86400000) as any },
    });

    const siteSummaries = await Promise.all(
      activeSites.map(async (site) => {
        const lastUptime = await this.uptimeRepo.findOne({
          where: { siteId: site.id },
          order: { checkedAt: 'DESC' },
        });
        const lastAudit = await this.auditsRepo.findOne({
          where: { siteId: site.id },
          order: { ranAt: 'DESC' },
        });
        const lastLh = await this.lhRepo.findOne({
          where: { siteId: site.id },
          order: { ranAt: 'DESC' },
        });
        const uptimeStats = await this.uptimeRepo.count({
          where: { siteId: site.id },
        });
        const uptimeUp = await this.uptimeRepo.count({
          where: { siteId: site.id, status: 'up' },
        });

        return {
          id: site.id,
          name: site.name,
          url: site.url,
          isActive: site.isActive,
          status: lastUptime?.status || 'unknown',
          responseTime: lastUptime?.responseTime || null,
          uptimePercent: uptimeStats > 0 ? Math.round((uptimeUp / uptimeStats) * 100) : 100,
          auditScore: lastAudit?.score || null,
          lighthousePerf: lastLh?.performance || null,
          lighthouseSeo: lastLh?.seo || null,
          lastChecked: lastUptime?.checkedAt || null,
          enabled: {
            uptime: site.uptimeEnabled,
            change: site.changeEnabled,
            audit: site.auditEnabled,
            lighthouse: site.lighthouseEnabled,
          },
        };
      }),
    );

    const downCount = siteSummaries.filter((s) => s.status === 'down').length;

    return {
      totalSites,
      activeSites: activeSites.length,
      downSites: downCount,
      healthySites: activeSites.length - downCount,
      changesToday: recentChanges,
      sites: siteSummaries,
    };
  }
}
