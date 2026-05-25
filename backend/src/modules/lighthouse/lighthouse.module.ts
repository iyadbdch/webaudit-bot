import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LighthouseReport } from '../../database/entities/lighthouse-report.entity';
import { Site } from '../../database/entities/site.entity';
import { LighthouseController } from './lighthouse.controller';
import { LighthouseService } from './lighthouse.service';
import { SitesModule } from '../sites/sites.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LighthouseReport, Site]),
    SitesModule,
    CommonModule,
  ],
  controllers: [LighthouseController],
  providers: [LighthouseService],
  exports: [LighthouseService],
})
export class LighthouseModule {}
