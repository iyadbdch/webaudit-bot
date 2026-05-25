import { Controller, Get, Post, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('sites/:siteId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('generate')
  @ApiOperation({ summary: 'Generate a report for a site' })
  generate(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('type') type?: string,
  ): Promise<string> {
    return this.reportsService.generateReport(siteId, (type as 'daily' | 'weekly') || 'daily');
  }

  @Post('send-daily')
  @ApiOperation({ summary: 'Send daily reports to all sites' })
  sendDaily(): Promise<void> {
    return this.reportsService.sendDailyReports();
  }

  @Post('send-weekly')
  @ApiOperation({ summary: 'Send weekly reports to all sites' })
  sendWeekly(): Promise<void> {
    return this.reportsService.sendWeeklyReports();
  }
}
