import { IsString, IsUrl, IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateSiteDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsString()
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  uptimeEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  changeEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  auditEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  lighthouseEnabled?: boolean;

  @IsNumber()
  @Min(1)
  @IsOptional()
  uptimeInterval?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  changeInterval?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  auditInterval?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  lighthouseInterval?: number;
}

export class UpdateSiteDto extends PartialType(CreateSiteDto) {}
