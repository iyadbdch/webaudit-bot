import { Global, Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { OpenwaClient } from './openwa-client';

@Global()
@Module({
  providers: [SchedulerService, OpenwaClient],
  exports: [SchedulerService, OpenwaClient],
})
export class CommonModule {}
