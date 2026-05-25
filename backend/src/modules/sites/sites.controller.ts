import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { CreateSiteDto, UpdateSiteDto } from './dto/create-site.dto';
import { Site } from '../../database/entities/site.entity';

@ApiTags('Sites')
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a website to monitor' })
  @ApiResponse({ status: 201, description: 'Site created' })
  create(@Body() dto: CreateSiteDto): Promise<Site> {
    return this.sitesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all monitored websites' })
  findAll(): Promise<Site[]> {
    return this.sitesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get site details' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Site> {
    return this.sitesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update site configuration' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSiteDto,
  ): Promise<Site> {
    return this.sitesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a website' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.sitesService.remove(id);
  }
}
