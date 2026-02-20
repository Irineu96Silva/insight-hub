import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LlmProvider } from './entities/llm-provider.entity';
import { encrypt, decrypt } from './utils/crypto.util';
import { createAdapter } from './adapters/adapter.factory';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly encryptionSecret: string;

  constructor(
    @InjectRepository(LlmProvider)
    private providerRepo: Repository<LlmProvider>,
    private configService: ConfigService,
  ) {
    this.encryptionSecret = this.configService.get<string>(
      'JWT_SECRET',
      'fallback-secret-key',
    );
  }

  // =========================================================================
  //  CRUD
  // =========================================================================

  async findAll(): Promise<Omit<LlmProvider, 'api_key_encrypted'>[]> {
    const providers = await this.providerRepo.find({
      order: { is_active: 'DESC', name: 'ASC' },
    });
    // Nunca retorna a key encriptada para o frontend
    return providers.map(({ api_key_encrypted, ...rest }) => rest as any);
  }

  async findOne(id: string): Promise<LlmProvider> {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException(`Provedor LLM "${id}" não encontrado.`);
    }
    return provider;
  }

  async findActive(): Promise<LlmProvider | null> {
    return this.providerRepo.findOne({ where: { is_active: true } });
  }

  async create(data: {
    name: string;
    slug: string;
    base_url: string;
    api_key?: string;
    default_model: string;
    is_active?: boolean;
    extra_config?: Record<string, any>;
  }): Promise<any> {
    // Verifica slug duplicado
    const existing = await this.providerRepo.findOne({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictException(
        `Já existe um provedor com o slug "${data.slug}".`,
      );
    }

    const provider = this.providerRepo.create({
      name: data.name,
      slug: data.slug,
      base_url: data.base_url,
      default_model: data.default_model,
      extra_config: data.extra_config || {},
      is_active: false, // Nunca cria já ativo
    });

    // Encripta API key se fornecida
    if (data.api_key) {
      provider.api_key_encrypted = encrypt(
        data.api_key,
        this.encryptionSecret,
      );
    }

    const saved = await this.providerRepo.save(provider);

    // Se pediu para ativar, ativa (desativando os demais)
    if (data.is_active) {
      await this.activate(saved.id);
      saved.is_active = true;
    }

    this.logger.log(`Provedor LLM criado: ${saved.name} (${saved.slug})`);
    const { api_key_encrypted, ...safeResult } = saved;
    return safeResult;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      base_url: string;
      api_key: string;
      default_model: string;
      extra_config: Record<string, any>;
    }>,
  ): Promise<any> {
    const provider = await this.findOne(id);

    if (data.name !== undefined) provider.name = data.name;
    if (data.base_url !== undefined) provider.base_url = data.base_url;
    if (data.default_model !== undefined)
      provider.default_model = data.default_model;
    if (data.extra_config !== undefined)
      provider.extra_config = data.extra_config;

    // Atualiza API key (nova encriptação)
    if (data.api_key) {
      provider.api_key_encrypted = encrypt(
        data.api_key,
        this.encryptionSecret,
      );
    }

    const saved = await this.providerRepo.save(provider);
    this.logger.log(`Provedor LLM atualizado: ${saved.name}`);
    const { api_key_encrypted, ...safeResult } = saved;
    return safeResult;
  }

  async remove(id: string): Promise<void> {
    const provider = await this.findOne(id);
    if (provider.is_active) {
      throw new ConflictException(
        'Não é possível deletar o provedor ativo. Ative outro primeiro.',
      );
    }
    await this.providerRepo.remove(provider);
    this.logger.log(`Provedor LLM removido: ${provider.name}`);
  }

  // =========================================================================
  //  ATIVAÇÃO (apenas um ativo por vez)
  // =========================================================================

  async activate(id: string): Promise<any> {
    const provider = await this.findOne(id);

    // Desativa todos os outros
    await this.providerRepo.update(
      { id: Not(id) },
      { is_active: false },
    );

    // Ativa o selecionado
    provider.is_active = true;
    const saved = await this.providerRepo.save(provider);

    this.logger.log(
      `Provedor LLM ativado: ${saved.name} (${saved.slug}) — modelo: ${saved.default_model}`,
    );
    const { api_key_encrypted, ...safeResult } = saved;
    return safeResult;
  }

  // =========================================================================
  //  TESTE + MODELOS
  // =========================================================================

  async testConnection(id: string) {
    const provider = await this.findOne(id);
    const apiKey = this.decryptApiKey(provider);
    const adapter = createAdapter(provider, apiKey);
    return adapter.testConnection();
  }

  async listModels(id: string) {
    const provider = await this.findOne(id);
    const apiKey = this.decryptApiKey(provider);
    const adapter = createAdapter(provider, apiKey);
    return adapter.listModels();
  }

  // =========================================================================
  //  UTILITÁRIOS INTERNOS
  // =========================================================================

  /** Decripta a API key do provedor. Retorna null se não tiver key. */
  decryptApiKey(provider: LlmProvider): string | null {
    if (!provider.api_key_encrypted) return null;
    try {
      return decrypt(provider.api_key_encrypted, this.encryptionSecret);
    } catch (error) {
      this.logger.error(
        `Falha ao decriptar API key do provedor ${provider.name}`,
      );
      return null;
    }
  }
}
