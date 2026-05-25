import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { SitesModule } from './modules/sites/sites.module';
import { UptimeModule } from './modules/uptime/uptime.module';
import { ChangesModule } from './modules/changes/changes.module';
import { AuditsModule } from './modules/audits/audits.module';
import { LighthouseModule } from './modules/lighthouse/lighthouse.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    CommonModule,
    SitesModule,
    UptimeModule,
    ChangesModule,
    AuditsModule,
    LighthouseModule,
    NotificationsModule,
    ReportsModule,
    DashboardModule,
  ],
})
export class AppModule {}
