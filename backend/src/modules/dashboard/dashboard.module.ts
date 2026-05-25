import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from '../../database/entities/site.entity';
import { UptimeLog } from '../../database/entities/uptime-log.entity';
import { AuditResult } from '../../database/entities/audit-result.entity';
import { LighthouseReport } from '../../database/entities/lighthouse-report.entity';
import { ChangeLog } from '../../database/entities/change-log.entity';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Site, UptimeLog, AuditResult, LighthouseReport, ChangeLog]),
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
