import { Controller, Get, Post, Param, ParseUUIDPipe, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UptimeService } from './uptime.service';
import { SitesService } from '../sites/sites.service';
import { UptimeLog } from '../../database/entities/uptime-log.entity';

@ApiTags('Uptime')
@Controller('sites/:siteId/uptime')
export class UptimeController {
  constructor(
    private readonly uptimeService: UptimeService,
    private readonly sitesService: SitesService,
  ) {}

  @Post('check')
  @ApiOperation({ summary: 'Trigger an uptime check now' })
  async check(@Param('siteId', ParseUUIDPipe) siteId: string): Promise<UptimeLog> {
    const site = await this.sitesService.findOne(siteId);
    if (!site) throw new NotFoundException('Site not found');
    return this.uptimeService.checkSite(site);
  }

  @Get()
  @ApiOperation({ summary: 'Get uptime logs' })
  getLogs(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('limit') limit?: number,
  ): Promise<UptimeLog[]> {
    return this.uptimeService.getLogs(siteId, limit || 100);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get uptime statistics' })
  getStats(@Param('siteId', ParseUUIDPipe) siteId: string) {
    return this.uptimeService.getStats(siteId);
  }
}
