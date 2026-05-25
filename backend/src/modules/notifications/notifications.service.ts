import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertRule } from '../../database/entities/alert-rule.entity';
import { CreateAlertRuleDto, UpdateAlertRuleDto } from './dto/create-alert-rule.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(AlertRule)
    private rulesRepo: Repository<AlertRule>,
  ) {}

  async create(siteId: string, dto: CreateAlertRuleDto): Promise<AlertRule> {
    const rule = this.rulesRepo.create({ ...dto, siteId });
    return this.rulesRepo.save(rule);
  }

  async findAll(siteId: string): Promise<AlertRule[]> {
    return this.rulesRepo.find({ where: { siteId } });
  }

  async findOne(id: string): Promise<AlertRule> {
    const rule = await this.rulesRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Alert rule not found');
    return rule;
  }

  async update(id: string, dto: UpdateAlertRuleDto): Promise<AlertRule> {
    const rule = await this.findOne(id);
    Object.assign(rule, dto);
    return this.rulesRepo.save(rule);
  }

  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    await this.rulesRepo.remove(rule);
  }
}
