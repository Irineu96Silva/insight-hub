import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Endpoint } from './entities/endpoint.entity';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { UpdateEndpointDto } from './dto/update-endpoint.dto';
import { DataCollectorService } from '../data-collector/data-collector.service';
import { CollectedData } from '../data-collector/entities/collected-data.entity';

@Injectable()
export class EndpointsService {
  constructor(
    @InjectRepository(Endpoint)
    private endpointsRepository: Repository<Endpoint>,
    @Inject(forwardRef(() => DataCollectorService))
    private dataCollectorService: DataCollectorService,
  ) {}

  async create(createEndpointDto: CreateEndpointDto): Promise<Endpoint> {
    const endpoint = this.endpointsRepository.create(createEndpointDto);
    return this.endpointsRepository.save(endpoint);
  }

  async findAll(): Promise<Endpoint[]> {
    return this.endpointsRepository.find({ relations: ['system'] });
  }

  async findBySystem(systemId: string): Promise<Endpoint[]> {
    return this.endpointsRepository.find({ where: { system_id: systemId } });
  }

  async findOne(id: string): Promise<Endpoint | null> {
    return this.endpointsRepository.findOne({
      where: { id },
      relations: ['system'],
    });
  }

  async update(id: string, updateEndpointDto: any): Promise<Endpoint> {
    await this.endpointsRepository.update(id, updateEndpointDto);
    return this.endpointsRepository.findOne({
      where: { id },
    });
  }

  async remove(id: string): Promise<void> {
    await this.endpointsRepository.update(id, { is_active: false });
  }

  async testEndpoint(id: string, params: Record<string, any>): Promise<any> {
    return this.dataCollectorService.testCollection(id, params);
  }

  /**
   * Coleta dados com cache inteligente:
   * Se já existem dados com os mesmos params, retorna do cache.
   * Senão, faz a requisição e armazena.
   */
  async collectWithCache(
    id: string,
    params: Record<string, any>,
  ): Promise<CollectedData> {
    return this.dataCollectorService.collectWithCache(id, params);
  }

  /**
   * Retorna dados coletados de um endpoint, opcionalmente filtrados por params.
   */
  async getCollectedData(
    id: string,
    params?: Record<string, any>,
  ): Promise<CollectedData[]> {
    return this.dataCollectorService.getDataForEndpoint(id, params);
  }
}
