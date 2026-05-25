import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../../database/entities/site.entity';
import { CreateSiteDto, UpdateSiteDto } from './dto/create-site.dto';

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private repo: Repository<Site>,
  ) {}

  async create(dto: CreateSiteDto): Promise<Site> {
    const existing = await this.repo.findOne({ where: { url: dto.url } });
    if (existing) {
      throw new NotFoundException('Site with this URL already exists');
    }
    const site = this.repo.create(dto);
    return this.repo.save(site);
  }

  async findAll(): Promise<Site[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Site> {
    const site = await this.repo.findOne({ where: { id } });
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async update(id: string, dto: UpdateSiteDto): Promise<Site> {
    const site = await this.findOne(id);
    Object.assign(site, dto);
    return this.repo.save(site);
  }

  async remove(id: string): Promise<void> {
    const site = await this.findOne(id);
    await this.repo.remove(site);
  }

  async getActiveSites(): Promise<Site[]> {
    return this.repo.find({ where: { isActive: true } });
  }
}
