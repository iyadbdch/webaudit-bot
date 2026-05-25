import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UptimeLog } from '../../database/entities/uptime-log.entity';
import { ChangeLog } from '../../database/entities/change-log.entity';
import { AuditResult } from '../../database/entities/audit-result.entity';
import { LighthouseReport } from '../../database/entities/lighthouse-report.entity';
import { Site } from '../../database/entities/site.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UptimeLog, ChangeLog, AuditResult, LighthouseReport, Site]),
    CommonModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
