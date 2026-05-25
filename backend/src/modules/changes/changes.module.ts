import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snapshot } from '../../database/entities/snapshot.entity';
import { ChangeLog } from '../../database/entities/change-log.entity';
import { Site } from '../../database/entities/site.entity';
import { ChangesController } from './changes.controller';
import { ChangesService } from './changes.service';
import { SitesModule } from '../sites/sites.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Snapshot, ChangeLog, Site]),
    SitesModule,
    CommonModule,
  ],
  controllers: [ChangesController],
  providers: [ChangesService],
  exports: [ChangesService],
})
export class ChangesModule {}
