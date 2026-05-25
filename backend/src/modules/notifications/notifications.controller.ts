import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateAlertRuleDto, UpdateAlertRuleDto } from './dto/create-alert-rule.dto';
import { AlertRule } from '../../database/entities/alert-rule.entity';

@ApiTags('Notifications')
@Controller('sites/:siteId/alerts')
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create alert rule for site' })
  create(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateAlertRuleDto,
  ): Promise<AlertRule> {
    return this.notifService.create(siteId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List alert rules' })
  findAll(@Param('siteId', ParseUUIDPipe) siteId: string): Promise<AlertRule[]> {
    return this.notifService.findAll(siteId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update alert rule' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlertRuleDto,
  ): Promise<AlertRule> {
    return this.notifService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete alert rule' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.notifService.remove(id);
  }
}
