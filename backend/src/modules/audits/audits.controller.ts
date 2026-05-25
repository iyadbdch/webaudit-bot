import { Controller, Get, Post, Param, ParseUUIDPipe, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditsService } from './audits.service';
import { SitesService } from '../sites/sites.service';
import { AuditResult } from '../../database/entities/audit-result.entity';

@ApiTags('Audits')
@Controller('sites/:siteId/audits')
export class AuditsController {
  constructor(
    private readonly auditsService: AuditsService,
    private readonly sitesService: SitesService,
  ) {}

  @Post('run')
  @ApiOperation({ summary: 'Run a full SEO audit now' })
  async run(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('type') type?: string,
  ): Promise<AuditResult> {
    const site = await this.sitesService.findOne(siteId);
    if (!site) throw new NotFoundException('Site not found');
    return this.auditsService.runAudit(site, type || 'full');
  }

  @Get()
  @ApiOperation({ summary: 'Get audit history' })
  getAudits(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('limit') limit?: number,
  ): Promise<AuditResult[]> {
    return this.auditsService.getAudits(siteId, limit || 20);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest audit result' })
  getLatest(@Param('siteId', ParseUUIDPipe) siteId: string): Promise<AuditResult | null> {
    return this.auditsService.getLatest(siteId);
  }
}
