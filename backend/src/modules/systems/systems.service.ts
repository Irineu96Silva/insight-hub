import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { System } from './entities/system.entity';
import { CreateSystemDto } from './dto/create-system.dto';
import { UpdateSystemDto } from './dto/update-system.dto';

@Injectable()
export class SystemsService {
  constructor(
    @InjectRepository(System)
    private systemsRepository: Repository<System>,
  ) {}

  async create(createSystemDto: CreateSystemDto): Promise<System> {
    const slug = this.generateSlug(createSystemDto.name);
    const system = this.systemsRepository.create({
      ...createSystemDto,
      slug,
    });
    return this.systemsRepository.save(system);
  }

  async findAll(): Promise<System[]> {
    return this.systemsRepository.find();
  }

  async getStats(id: string): Promise<any> {
    const system = await this.findOne(id);
    return {
      endpoints_count: system.endpoints ? system.endpoints.length : 0,
      // Mock other stats for now, needs connection to other modules
      total_collections: 0,
      last_insight: null,
    };
  }

  async findOne(id: string): Promise<System | null> {
    return this.systemsRepository.findOne({
      where: { id },
      relations: ['endpoints'],
    });
  }

  async update(id: string, updateSystemDto: any): Promise<System> {
    await this.systemsRepository.update(id, updateSystemDto);
    return this.systemsRepository.findOne({ where: { id } });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async remove(id: string): Promise<void> {
    await this.systemsRepository.update(id, { is_active: false });
  }
}
