import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Endpoint } from '../endpoints/entities/endpoint.entity';
import { System, AuthType } from '../systems/entities/system.entity';
import {
  CollectedData,
  CollectionStatus,
} from './entities/collected-data.entity';

@Injectable()
export class DataCollectorService {
  private readonly logger = new Logger(DataCollectorService.name);

  constructor(
    @InjectRepository(Endpoint)
    private endpointRepo: Repository<Endpoint>,
    @InjectRepository(CollectedData)
    private collectedDataRepo: Repository<CollectedData>,
    @InjectRepository(System)
    private systemRepo: Repository<System>,
  ) {}

  /**
   * Lista dados coletados de todos os endpoints de um sistema.
   */
  async getDataBySystem(systemId: string, limit = 50): Promise<CollectedData[]> {
    return this.collectedDataRepo
      .createQueryBuilder('cd')
      .leftJoinAndSelect('cd.endpoint', 'endpoint')
      .where('endpoint.system_id = :systemId', { systemId })
      .andWhere('cd.status = :status', { status: CollectionStatus.SUCCESS })
      .orderBy('cd.collected_at', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Retorna um dado coletado específico pelo ID.
   */
  async getDataById(id: string): Promise<CollectedData | null> {
    return this.collectedDataRepo.findOne({
      where: { id },
      relations: ['endpoint'],
    });
  }

  /**
   * Coleta dados da API e salva no banco.
   * SEMPRE faz nova coleta (sem bloquear por cache).
   * Retorna o dado recém-coletado.
   */
  async collectWithCache(
    endpointId: string,
    params: Record<string, any>,
  ): Promise<CollectedData> {
    this.logger.log(
      `[COLLECT] Endpoint ${endpointId} com params ${JSON.stringify(params)} — coletando da API`,
    );
    return this.collectFromEndpoint(endpointId, params);
  }

  /**
   * Busca dados coletados de um endpoint, opcionalmente filtrados por params.
   */
  async getDataForEndpoint(
    endpointId: string,
    params?: Record<string, any>,
  ): Promise<CollectedData[]> {
    if (params && Object.keys(params).length > 0) {
      // Buscar com filtro de params
      const all = await this.collectedDataRepo.find({
        where: {
          endpoint_id: endpointId,
          status: CollectionStatus.SUCCESS,
        },
        order: { collected_at: 'DESC' },
      });

      // Filtrar por params_used (comparação de valores)
      return all.filter((item) => {
        if (!item.params_used) return false;
        return Object.entries(params).every(
          ([key, value]) =>
            String(item.params_used[key]) === String(value),
        );
      });
    }

    return this.collectedDataRepo.find({
      where: {
        endpoint_id: endpointId,
        status: CollectionStatus.SUCCESS,
      },
      order: { collected_at: 'DESC' },
      take: 50,
    });
  }

  /**
   * Coleta dados de um endpoint específico com parâmetros
   */
  async collectFromEndpoint(
    endpointId: string,
    params: Record<string, any>,
  ): Promise<CollectedData> {
    const endpoint = await this.endpointRepo.findOne({
      where: { id: endpointId },
      relations: ['system'],
    });

    if (!endpoint) throw new Error(`Endpoint ${endpointId} não encontrado`);

    const builtUrl = this.buildUrl(endpoint, params);
    this.logger.log(`[COLLECT] Endpoint "${endpoint.name}" → URL: ${builtUrl}`);
    this.logger.log(`[COLLECT] Params: ${JSON.stringify(params)}`);

    try {
      const { data, processedData, paramsUsed, csvRaw } = await this.fetchData(
        endpoint,
        params,
      );

      // Salvar dados coletados
      const collected = this.collectedDataRepo.create({
        endpoint_id: endpointId,
        raw_data: data,
        processed_data: processedData,
        params_used: paramsUsed,
        csv_raw: csvRaw || null,
        status: CollectionStatus.SUCCESS,
        collected_at: new Date(),
      });

      // Atualizar timestamp de última coleta
      await this.endpointRepo.update(endpointId, {
        last_collected_at: new Date(),
      });

      const saved = await this.collectedDataRepo.save(collected);
      this.logger.log(`[COLLECT] ✅ Coleta salva com sucesso! ID: ${saved.id}`);
      return saved;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[COLLECT] ❌ Erro ao coletar "${endpoint.name}": ${errorMsg}`);

      // Salvar registro de erro para histórico
      const collected = this.collectedDataRepo.create({
        endpoint_id: endpointId,
        raw_data: {},
        params_used: params,
        status: CollectionStatus.ERROR,
        error_message: errorMsg,
        collected_at: new Date(),
      });
      await this.collectedDataRepo.save(collected);

      // Lançar erro para o frontend saber que falhou
      throw new Error(`Falha ao coletar "${endpoint.name}": ${errorMsg}`);
    }
  }

  async testCollection(
    endpointId: string,
    params: Record<string, any>,
  ): Promise<any> {
    const endpoint = await this.endpointRepo.findOne({
      where: { id: endpointId },
      relations: ['system'],
    });

    if (!endpoint) throw new Error(`Endpoint ${endpointId} não encontrado`);

    return this.fetchData(endpoint, params);
  }

  private async fetchData(
    endpoint: Endpoint,
    params: Record<string, any>,
  ) {
    // Montar URL substituindo parâmetros dinâmicos
    const url = this.buildUrl(endpoint, params);
    const headers = this.buildAuthHeaders(endpoint.system);

    this.logger.log(`Coletando: ${endpoint.name} -> ${url}`);

    const response = await axios({
      method: endpoint.method,
      url,
      headers,
      timeout: 60000, // 60s para downloads maiores
      responseType: 'arraybuffer', // Para suportar CSV binário
    });

    const contentType =
      response.headers['content-type'] || '';
    const isCsv =
      contentType.includes('text/csv') ||
      contentType.includes('application/csv') ||
      contentType.includes('text/plain') ||
      (endpoint as any).response_type === 'csv';

    let data: any;
    let csvRaw: string | null = null;

    if (isCsv) {
      // Resposta é CSV — armazenar como texto e parsear
      csvRaw = Buffer.from(response.data).toString('utf-8');
      data = this.parseCsvToJson(csvRaw);
      this.logger.log(
        `CSV parseado: ${Array.isArray(data) ? data.length : 0} linhas`,
      );
    } else {
      // Resposta é JSON
      const rawStr = Buffer.from(response.data).toString('utf-8');
      try {
        data = JSON.parse(rawStr);
      } catch {
        // Se não é JSON válido, pode ser CSV sem content-type correto
        if (rawStr.includes(',') && rawStr.includes('\n')) {
          csvRaw = rawStr;
          data = this.parseCsvToJson(rawStr);
          this.logger.log(
            `Detectado CSV sem Content-Type correto: ${Array.isArray(data) ? data.length : 0} linhas`,
          );
        } else {
          data = { raw_text: rawStr };
        }
      }
    }

    return {
      data,
      processedData: this.processData(data, endpoint.response_mapping),
      paramsUsed: params,
      csvRaw,
    };
  }

  /**
   * Coleta todos os endpoints ativos (scheduled)
   */
  async collectAll(mes?: number, ano?: number): Promise<CollectedData[]> {
    const now = new Date();
    const targetMes = mes || now.getMonth() + 1;
    const targetAno = ano || now.getFullYear();

    const endpoints = await this.endpointRepo.find({
      where: { is_active: true },
      relations: ['system'],
    });

    const results: CollectedData[] = [];

    for (const endpoint of endpoints) {
      try {
        const params = this.resolveDefaultParams(
          endpoint,
          targetMes,
          targetAno,
        );
        const result = await this.collectWithCache(endpoint.id, params);
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Erro ao coletar ${endpoint.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return results;
  }

  // =========================================================================
  //  UTILITÁRIOS PRIVADOS
  // =========================================================================

  /**
   * Busca no cache por endpoint_id + params iguais
   */
  private async findCachedData(
    endpointId: string,
    params: Record<string, any>,
  ): Promise<CollectedData | null> {
    const allData = await this.collectedDataRepo.find({
      where: {
        endpoint_id: endpointId,
        status: CollectionStatus.SUCCESS,
      },
      order: { collected_at: 'DESC' },
    });

    // Comparar params_used (jsonb) — TypeORM não suporta query JSONB direta fácilmente
    return (
      allData.find((item) => {
        if (!item.params_used) return false;
        const itemKeys = Object.keys(item.params_used);
        const paramKeys = Object.keys(params);
        if (itemKeys.length !== paramKeys.length) return false;
        return paramKeys.every(
          (key) =>
            String(item.params_used[key]) === String(params[key]),
        );
      }) || null
    );
  }

  /**
   * Parse simples de CSV para array de objetos JSON.
   * Usa a primeira linha como header.
   */
  private parseCsvToJson(csv: string): Record<string, any>[] {
    const lines = csv
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

    // Detectar delimitador (vírgula ou ponto-e-vírgula)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));

    return lines.slice(1).map((line) => {
      const values = this.parseCsvLine(line, delimiter);
      const obj: Record<string, any> = {};
      headers.forEach((header, i) => {
        let val: any = values[i] || '';
        // Tentar converter para número
        const num = Number(val);
        if (!isNaN(num) && val !== '') val = num;
        obj[header] = val;
      });
      return obj;
    });
  }

  /** Parse de uma linha CSV respeitando aspas */
  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private buildUrl(endpoint: Endpoint, params: Record<string, any>): string {
    let url = endpoint.url_template;

    // Substituir :param pelos valores
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });

    // Se url_template já é uma URL completa (começa com http), usar direto
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Caso contrário, concatenar com base_url do sistema
    const baseUrl = (endpoint.system.base_url || '').replace(/\/+$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${path}`;
  }

  private buildAuthHeaders(system: System): Record<string, string> {
    const headers: Record<string, string> = {};

    if (system.auth_type === AuthType.BEARER && system.auth_config?.token) {
      headers['Authorization'] = `Bearer ${system.auth_config.token}`;
    } else if (system.auth_type === AuthType.API_KEY && system.auth_config) {
      const { header, value } = system.auth_config;
      headers[header] = value;
    }

    return headers;
  }

  private processData(
    rawData: any,
    mapping?: Record<string, any>,
  ): Record<string, any> | null {
    if (!mapping) {
      // Se não há mapping mas é um array, criar summary básico
      if (Array.isArray(rawData)) {
        return {
          total_items: rawData.length,
          columns: rawData.length > 0 ? Object.keys(rawData[0]) : [],
          sample: rawData.slice(0, 5),
        };
      }
      return null;
    }

    try {
      const dataField = mapping.data_field;
      const items = dataField ? rawData[dataField] : rawData;

      if (Array.isArray(items)) {
        return {
          total_items: items.length,
          items: items.map((item: any) => ({
            label: mapping.label_field ? item[mapping.label_field] : null,
            value: mapping.value_field ? item[mapping.value_field] : null,
            ...item,
          })),
          summary: {
            total: items.reduce(
              (sum: number, item: any) =>
                sum + (Number(item[mapping.value_field]) || 0),
              0,
            ),
          },
        };
      }

      return rawData;
    } catch {
      return null;
    }
  }

  private resolveDefaultParams(
    endpoint: Endpoint,
    mes: number,
    ano: number,
  ): Record<string, any> {
    const params: Record<string, any> = {};

    if (endpoint.url_template.includes(':mes')) params.mes = mes;
    if (endpoint.url_template.includes(':ano')) params.ano = ano;

    return params;
  }
}
