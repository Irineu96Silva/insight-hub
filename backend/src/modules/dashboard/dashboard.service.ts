import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { Insight } from '../ai-engine/entities/insight.entity';
import { AiLog } from '../ai-engine/entities/ai-log.entity';
import { AiUsage } from '../ai-engine/entities/ai-usage.entity';
import { Endpoint } from '../endpoints/entities/endpoint.entity';
import { System } from '../systems/entities/system.entity';
import { CollectedData, CollectionStatus } from '../data-collector/entities/collected-data.entity';

@Injectable()
export class DashboardService {
  constructor(
    private readonly aiEngineService: AiEngineService,
    @InjectRepository(Insight) private insightRepo: Repository<Insight>,
    @InjectRepository(AiLog) private aiLogRepo: Repository<AiLog>,
    @InjectRepository(AiUsage) private aiUsageRepo: Repository<AiUsage>,
    @InjectRepository(Endpoint) private endpointRepo: Repository<Endpoint>,
    @InjectRepository(System) private systemRepo: Repository<System>,
    @InjectRepository(CollectedData) private collectedDataRepo: Repository<CollectedData>,
  ) {}

  async getSummary() {
    // ─── Períodos ────────────────────────────────────
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ─── Sistemas ────────────────────────────────────
    const allSystems = await this.systemRepo.find({
      relations: ['endpoints'],
      order: { name: 'ASC' },
    });

    const totalSystems = allSystems.length;
    const activeSystems = allSystems.filter(s => s.is_active).length;
    const inactiveSystems = totalSystems - activeSystems;

    const systemsDetail = allSystems.map(s => ({
      id: s.id,
      name: s.name,
      base_url: s.base_url,
      is_active: s.is_active,
      environment: s.environment,
      criticality: s.criticality,
      company_name: s.company_name,
      endpointsCount: s.endpoints?.length || 0,
      endpointsActive: s.endpoints?.filter(e => e.is_active).length || 0,
      created_at: s.created_at,
    }));

    // ─── Endpoints ───────────────────────────────────
    const allEndpoints = await this.endpointRepo.find({
      relations: ['system'],
      order: { name: 'ASC' },
    });

    const totalEndpoints = allEndpoints.length;
    const activeEndpoints = allEndpoints.filter(e => e.is_active).length;
    const inactiveEndpoints = totalEndpoints - activeEndpoints;

    const endpointsDetail = allEndpoints.map(ep => ({
      id: ep.id,
      name: ep.name,
      method: ep.method,
      url_template: ep.url_template,
      is_active: ep.is_active,
      response_type: ep.response_type,
      system_name: ep.system?.name || '—',
      system_id: ep.system_id,
      last_collected_at: ep.last_collected_at,
    }));

    // ─── Coletas de Dados ────────────────────────────
    const totalCollections = await this.collectedDataRepo.count();
    const successCollections = await this.collectedDataRepo.count({
      where: { status: CollectionStatus.SUCCESS },
    });
    const errorCollections = await this.collectedDataRepo.count({
      where: { status: CollectionStatus.ERROR },
    });
    const collectionsLast24h = await this.collectedDataRepo.count({
      where: { collected_at: MoreThan(last24h) },
    });
    const collectionsLast7d = await this.collectedDataRepo.count({
      where: { collected_at: MoreThan(last7d) },
    });

    // Últimas 10 coletas detalhadas
    const recentCollections = await this.collectedDataRepo.find({
      take: 10,
      order: { collected_at: 'DESC' },
      relations: ['endpoint', 'endpoint.system'],
    });

    const collectionsDetail = recentCollections.map(cd => ({
      id: cd.id,
      endpoint_name: cd.endpoint?.name || '—',
      system_name: cd.endpoint?.system?.name || '—',
      status: cd.status,
      error_message: cd.error_message,
      params_used: cd.params_used,
      collected_at: cd.collected_at,
    }));

    // ─── Insights ────────────────────────────────────
    const totalInsights = await this.insightRepo.count();
    const insightsLast24h = await this.insightRepo.count({
      where: { created_at: MoreThan(last24h) },
    });
    const insightsLast7d = await this.insightRepo.count({
      where: { created_at: MoreThan(last7d) },
    });

    // Breakdown por tipo
    const insightsByType = await this.insightRepo
      .createQueryBuilder('i')
      .select('i.type', 'type')
      .addSelect('COUNT(i.id)', 'count')
      .groupBy('i.type')
      .getRawMany();

    // Breakdown por severidade
    const insightsBySeverity = await this.insightRepo
      .createQueryBuilder('i')
      .select('i.severity', 'severity')
      .addSelect('COUNT(i.id)', 'count')
      .groupBy('i.severity')
      .getRawMany();

    // Insights recentes (top 10)
    const recentInsights = await this.insightRepo.find({
      take: 10,
      order: { created_at: 'DESC' },
      relations: ['system', 'endpoint'],
    });

    // ─── Status da IA ────────────────────────────────
    const health = await this.aiEngineService.getHealthStatus();

    // ─── Uso da IA (Tokens & Custo) ──────────────────
    const monthlyUsage = await this.aiUsageRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.tokensUsed), 0)', 'totalTokens')
      .addSelect('COALESCE(SUM(u.estimatedCost), 0)', 'totalCost')
      .addSelect('COUNT(u.id)', 'totalRequests')
      .where('u.created_at >= :start', { start: startOfMonth })
      .getRawOne();

    // Uso nas últimas 24h
    const usage24h = await this.aiUsageRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.tokensUsed), 0)', 'totalTokens')
      .addSelect('COALESCE(SUM(u.estimatedCost), 0)', 'totalCost')
      .addSelect('COUNT(u.id)', 'totalRequests')
      .where('u.created_at >= :start', { start: last24h })
      .getRawOne();

    // Interações de chat
    const chatTotal = await this.aiLogRepo.count();
    const chatLast24h = await this.aiLogRepo.count({ where: { createdAt: MoreThan(last24h) } });
    const chatLast7d = await this.aiLogRepo.count({ where: { createdAt: MoreThan(last7d) } });

    // Últimas 10 interações de chat
    const recentChats = await this.aiLogRepo.find({
      take: 10,
      order: { createdAt: 'DESC' },
      select: ['id', 'model', 'createdAt'],
    });

    const chatsDetail = recentChats.map(c => ({
      id: c.id,
      model: c.model,
      created_at: c.createdAt,
    }));

    // ─── Montar Resposta ─────────────────────────────
    return {
      overview: {
        systems: { total: totalSystems, active: activeSystems, inactive: inactiveSystems },
        endpoints: { total: totalEndpoints, active: activeEndpoints, inactive: inactiveEndpoints },
        insights: { total: totalInsights, last24h: insightsLast24h, last7d: insightsLast7d },
        collections: {
          total: totalCollections,
          success: successCollections,
          errors: errorCollections,
          last24h: collectionsLast24h,
          last7d: collectionsLast7d,
        },
      },
      ai: {
        status: health.llm_active ? 'Online' : 'Offline',
        provider: health.provider || 'Nenhum',
        model: health.model || 'N/A',
        monthly: {
          tokens: parseInt(monthlyUsage?.totalTokens || '0'),
          cost: parseFloat(monthlyUsage?.totalCost || '0'),
          requests: parseInt(monthlyUsage?.totalRequests || '0'),
        },
        today: {
          tokens: parseInt(usage24h?.totalTokens || '0'),
          cost: parseFloat(usage24h?.totalCost || '0'),
          requests: parseInt(usage24h?.totalRequests || '0'),
        },
        chatInteractions: {
          total: chatTotal,
          last24h: chatLast24h,
          last7d: chatLast7d,
        },
        recentChats: chatsDetail,
      },
      drilldown: {
        systems: systemsDetail,
        endpoints: endpointsDetail,
        collections: collectionsDetail,
        insightsByType,
        insightsBySeverity,
      },
      recentInsights,
    };
  }
}
