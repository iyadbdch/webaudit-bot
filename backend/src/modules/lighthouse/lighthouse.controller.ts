import { Controller, Get, Post, Param, ParseUUIDPipe, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LighthouseService } from './lighthouse.service';
import { SitesService } from '../sites/sites.service';
import { LighthouseReport } from '../../database/entities/lighthouse-report.entity';

@ApiTags('Lighthouse')
@Controller('sites/:siteId/lighthouse')
export class LighthouseController {
  constructor(
    private readonly lighthouseService: LighthouseService,
    private readonly sitesService: SitesService,
  ) {}

  @Post('run')
  @ApiOperation({ summary: 'Run a Lighthouse audit now' })
  async run(@Param('siteId', ParseUUIDPipe) siteId: string): Promise<LighthouseReport> {
    const site = await this.sitesService.findOne(siteId);
    if (!site) throw new NotFoundException('Site not found');
    return this.lighthouseService.runReport(site);
  }

  @Get()
  @ApiOperation({ summary: 'Get Lighthouse report history' })
  getReports(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('limit') limit?: number,
  ): Promise<LighthouseReport[]> {
    return this.lighthouseService.getReports(siteId, limit || 20);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest Lighthouse report' })
  getLatest(@Param('siteId', ParseUUIDPipe) siteId: string): Promise<LighthouseReport | null> {
    return this.lighthouseService.getLatest(siteId);
  }
}
