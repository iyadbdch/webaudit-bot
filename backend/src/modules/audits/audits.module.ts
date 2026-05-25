import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditResult } from '../../database/entities/audit-result.entity';
import { Site } from '../../database/entities/site.entity';
import { AuditsController } from './audits.controller';
import { AuditsService } from './audits.service';
import { SitesModule } from '../sites/sites.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditResult, Site]),
    SitesModule,
    CommonModule,
  ],
  controllers: [AuditsController],
  providers: [AuditsService],
  exports: [AuditsService],
})
export class AuditsModule {}
