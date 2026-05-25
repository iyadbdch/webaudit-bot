import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UptimeLog } from '../../database/entities/uptime-log.entity';
import { Site } from '../../database/entities/site.entity';
import { UptimeController } from './uptime.controller';
import { UptimeService } from './uptime.service';
import { SitesModule } from '../sites/sites.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UptimeLog, Site]),
    SitesModule,
    CommonModule,
  ],
  controllers: [UptimeController],
  providers: [UptimeService],
  exports: [UptimeService],
})
export class UptimeModule {}
