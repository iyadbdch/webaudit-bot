import { Controller, Get, Post, Param, ParseUUIDPipe, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChangesService } from './changes.service';
import { SitesService } from '../sites/sites.service';
import { ChangeLog } from '../../database/entities/change-log.entity';
import { Snapshot } from '../../database/entities/snapshot.entity';

@ApiTags('Changes')
@Controller('sites/:siteId/changes')
export class ChangesController {
  constructor(
    private readonly changesService: ChangesService,
    private readonly sitesService: SitesService,
  ) {}

  @Post('check')
  @ApiOperation({ summary: 'Trigger a change detection check now' })
  async check(@Param('siteId', ParseUUIDPipe) siteId: string): Promise<ChangeLog | null> {
    const site = await this.sitesService.findOne(siteId);
    if (!site) throw new NotFoundException('Site not found');
    return this.changesService.checkSite(site);
  }

  @Get()
  @ApiOperation({ summary: 'Get change history' })
  getChanges(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('limit') limit?: number,
  ): Promise<ChangeLog[]> {
    return this.changesService.getChanges(siteId, limit || 50);
  }

  @Get('snapshots')
  @ApiOperation({ summary: 'Get content snapshots' })
  getSnapshots(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('limit') limit?: number,
  ): Promise<Snapshot[]> {
    return this.changesService.getSnapshots(siteId, limit || 20);
  }
}
