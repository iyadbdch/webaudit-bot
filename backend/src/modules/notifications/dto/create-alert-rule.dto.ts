import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { AlertEvent } from '../../../database/entities/alert-rule.entity';

export class CreateAlertRuleDto {
  @IsString()
  event: AlertEvent;

  @IsBoolean()
  @IsOptional()
  whatsappEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  threshold?: number;

  @IsString()
  @IsOptional()
  customMessage?: string;
}

export class UpdateAlertRuleDto extends PartialType(CreateAlertRuleDto) {}
