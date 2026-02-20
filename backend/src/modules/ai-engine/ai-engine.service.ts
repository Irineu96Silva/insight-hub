import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmGatewayService } from '../llm/llm-gateway.service';
import { PromptBuilderService } from './prompt-builder.service';
import {
  Insight,
  InsightType,
  InsightSeverity,
} from './entities/insight.entity';
import { AiLog } from './entities/ai-log.entity';
import { AiUsage } from './entities/ai-usage.entity';
import { CollectedData, CollectionStatus } from '../data-collector/entities/collected-data.entity';
import { Endpoint } from '../endpoints/entities/endpoint.entity';
import { EndpointsService } from '../endpoints/endpoints.service';
// import * as fs from 'fs';
// import * as path from 'path';
import { SystemsService } from '../systems/systems.service';
import { SystemFilesService } from '../systems/system-files.service';

@Injectable()
export class AiEngineService {
  private readonly logger = new Logger(AiEngineService.name);

  constructor(
    @InjectRepository(Insight)
    private insightRepo: Repository<Insight>,
    @InjectRepository(AiLog)
    private aiLogRepo: Repository<AiLog>,
    @InjectRepository(AiUsage)
    private aiUsageRepo: Repository<AiUsage>,
    @InjectRepository(CollectedData)
    private collectedDataRepo: Repository<CollectedData>,
    @InjectRepository(Endpoint)
    private endpointRepo: Repository<Endpoint>,
    @Inject(forwardRef(() => EndpointsService))
    private endpointsService: EndpointsService,
    @Inject(forwardRef(() => SystemsService))
    private systemsService: SystemsService,
    private systemFilesService: SystemFilesService,
    private llmGateway: LlmGatewayService,
    private promptBuilder: PromptBuilderService,
  ) {}

  // =========================================================================
  //  MÉTODOS FALTANTES (LEGACY COMPATIBILITY & CHAT)
  // =========================================================================

  async generateInsight(
    type: InsightType,
    data: any,
    context?: string,
    userId?: string,
  ): Promise<Insight> {
    // buildPrompt retorna { system, prompt }
    const { system, prompt } = this.promptBuilder.buildPrompt(type, {
      ...data,
      context,
    });

    const result = await this.llmGateway.chat([
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ]);

    this.trackUsage(result.tokens_used, userId);

    const insight = this.insightRepo.create({
      type,
      title: this.generateTitle(type, data),
      content: this.cleanResponse(result.content),
      severity: this.extractSeverity(result.content),
      data_snapshot: data,
      prompt_used: prompt, // Agora é string
      model_used: result.model,
    });

    return this.insightRepo.save(insight);
  }

  async chat(
    systemId: string,
    question: string,
    dataContext: any,
    userId?: string,
  ): Promise<string> {
    // ═══════════════════════════════════════════════════════════════
    //  1. IDENTIFICAR O SISTEMA CORRETO
    // ═══════════════════════════════════════════════════════════════
    let resolvedSystemId = systemId;

    if (!systemId || systemId === 'general') {
      const detectedId = await this.detectSystemFromQuestion(question);
      if (detectedId) {
        resolvedSystemId = detectedId;
        this.logger.log(`[CHAT] Sistema detectado na pergunta: ${detectedId}`);
      }
    }

    this.logger.log(`[CHAT] systemId: "${systemId}" → resolvido: "${resolvedSystemId}"`);
    this.logger.log(`[CHAT] Pergunta: "${question}"`);

    // ═══════════════════════════════════════════════════════════════
    //  2. CONSTRUIR CONTEXTO COMPLETO
    // ═══════════════════════════════════════════════════════════════
    let fullContext = '';

    if (resolvedSystemId && resolvedSystemId !== 'general') {
      fullContext = await this.buildFullSystemContext(resolvedSystemId);
    } else {
      fullContext = await this.buildAllSystemsSummary();
    }

    if (dataContext && Object.keys(dataContext).length > 0) {
      fullContext += `\n\n# Dados Adicionais do Usuário\n${JSON.stringify(dataContext, null, 2)}`;
    }

    // ═══════════════════════════════════════════════════════════════
    //  3. SYSTEM PROMPT — IA COM TOOLS
    // ═══════════════════════════════════════════════════════════════
    const systemInstruction = `
Você é o **InsightHub AI**, um Analista de Inteligência de Negócios Sênior.

## SUA MISSÃO
Analisar dados de sistemas empresariais com **Profundidade e Eficiência**.
Você não é apenas um leitor de resumos. Você é um investigador.

## HIERARQUIA DO SISTEMA
Entenda a estrutura dos dados:
1. **SISTEMA** (Pai) - Ex: "CRM", "ERP". Possui configurações de segurança e testes de rede.
2. **ENDPOINTS** (Filhos) - Fontes de dados vivas (APIs). Ex: "Vendas", "Clientes".
3. **ARQUIVOS** (Anexos) - Documentação ou bases legadas (CSV/PDF).

## ESTRATÉGIA DE DADOS (JUNIOR vs SENIOR)
Você deve decidir como abordar cada pergunta para equilibrar CUSTO (tokens) e QUALIDADE.

### 1. Perguntas de KPI (Modo Econômico)
*Ex: "Qual foi o total de vendas?", "Quantos clientes novos?", "A média do ticket?"*
- **NÃO** baixe os dados brutos.
- **USE** \`collect_endpoint_data\` (para garantir frescor) -> Leia o RESUMO.
- **OU USE** \`analyze_endpoint_metric\` (para cálculo exato no servidor).

### 2. Perguntas de Análise Profunda (Modo Sênior)
*Ex: "Identifique tendências de queda", "Por que o produto X vendeu pouco?", "Faça uma correlação..."*
- O resumo NÃO é suficiente.
- **USE** \`collect_endpoint_data(include_raw=true)\` (Baixa JSON/CSV completo).
- **OU USE** \`analyze_collected_data\` (Delega a análise para uma IA especializada).

## FERRAMENTAS DISPONÍVEIS
1. \`collect_endpoint_data\`: Baixa dados.
   - Padrão: Retorna Estatísticas (Count, Sum).
   - \`include_raw=true\`: Retorna TUDO (Use com sabedoria).
2. \`analyze_endpoint_metric\`: Calcula métrica específica no servidor (Soma, Média, Contagem).
3. \`analyze_collected_data\`: Cria um relatório de insight profundo.

## REGRAS DE OURO
- **Contexto**: Veja se os dados JÁ estão no texto acima antes de chamar ferramenta.
- **Identificação**: Use o ID (UUID) ou NOME do sistema. Se falhar, tente a DESCRIÇÃO.
- **Resposta**: Seja direto, profissional e baseie-se estritamente nos dados.
- **Idioma**: Sempre Português do Brasil.

## FLUXO EXEMPLAR
- Usuário: "Analise a performance de vendas de Janeiro"
- AI (Pensamento): "Isso é vago. Preciso ver os dados."
- Ação: \`collect_endpoint_data(identifier="Vendas", include_raw=true)\`
- ... (Recebe CSV) ...
- AI: "Notei uma tendência de alta na segunda quinzena..."
    `.trim();

    // ═══════════════════════════════════════════════════════════════
    //  4. PREPARAR MENSAGENS E TOOLS
    // ═══════════════════════════════════════════════════════════════
    const messages: any[] = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: question },
    ];

    const tools = [
      {
        type: 'function',
        function: {
          name: 'collect_endpoint_data',
          description: 'Baixa/Atualiza dados de um sistema. Retorna resumo estatístico.',
          parameters: {
            type: 'object',
            properties: {
              identifier: { type: 'string', description: 'ID ou Nome do sistema.' },
              params: { type: 'object', description: 'Filtros (mes, ano).' },
              include_raw: { type: 'boolean', description: 'Se true, traz dados brutos (caro em tokens).' },
            },
            required: ['identifier'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'analyze_endpoint_metric',
          description: 'Calcula uma métrica específica (soma, média, contagem) no servidor, economizando tokens.',
          parameters: {
            type: 'object',
            properties: {
              identifier: { type: 'string', description: 'ID ou Nome do sistema.' },
              metric: { 
                  type: 'string', 
                  description: 'A métrica a calcular. Ex: "total_X" (soma campo X), "average_Y" (média campo Y), "count" (contagem de registros).',
              },
            },
            required: ['identifier', 'metric'],
          },
        },
      },
    ];

    // ═══════════════════════════════════════════════════════════════
    //  5. LOOP DE EXECUÇÃO (REACT)
    // ═══════════════════════════════════════════════════════════════
    let finalResponse = '';
    let totalTokens = 0;
    
    // Máximo de 5 turnos
    for (let i = 0; i < 5; i++) {
        const result = await this.llmGateway.chat(messages, {
            tools,
            tool_choice: 'auto', 
        });

        totalTokens += result.tokens_used;
        finalResponse = result.content || '';

        messages.push({
            role: 'assistant',
            content: result.content,
            tool_calls: result.tool_calls,
        });

        if (!result.tool_calls || result.tool_calls.length === 0) {
            break;
        }

        this.logger.log(`[CHAT] Modelo solicitou ${result.tool_calls.length} ferramentas.`);

        for (const toolCallObj of result.tool_calls) {
            const toolCall = toolCallObj as any;
            const functionName = toolCall.name || toolCall.function?.name;
            const argsStr = toolCall.arguments || toolCall.function?.arguments;
            let args: any = {};
            try { args = JSON.parse(argsStr); } catch { args = {}; }
            
            this.logger.log(`[TOOL] Executando ${functionName} (${JSON.stringify(args)})`);
            
            let toolOutput = '';

            try {
                // 1. Resolver Identificador (ID ou Nome) Comum a todas as tools
                let endpointId = args.identifier || args.endpoint_id;
                let endpointName = args.identifier;

                if (endpointId) { // Só busca se tiver ID, senão tool específica trata erro
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(endpointId);
                    if (!isUuid) {
                        this.logger.log(`[TOOL] Buscando endpoint por nome: "${endpointId}"`);
                        const found = await this.endpointRepo.createQueryBuilder('e')
                            .where('LOWER(e.name) LIKE LOWER(:name)', { name: `%${endpointId}%` })
                            .orWhere('LOWER(e.description) LIKE LOWER(:name)', { name: `%${endpointId}%` })
                            .getOne();
                        
                        if (found) {
                                endpointId = found.id;
                                endpointName = found.name;
                        } else {
                            // Se não achou, deixa passar o ID original pra ver se o serviço trata ou estoura erro
                            this.logger.warn(`[TOOL] Nome "${endpointId}" não encontrado no banco.`);
                        }
                    }
                }

                if (functionName === 'collect_endpoint_data') {
                    if (!endpointId) throw new Error("Identifier é obrigatório.");

                    const data = await this.endpointsService.collectWithCache(endpointId, args.params || {});
                    
                    const summary = data.processed_data?.summary || 'N/A';
                    const count = data.processed_data?.total_items || (Array.isArray(data.raw_data) ? data.raw_data.length : 'N/A');
                    
                    const responseObj: any = {
                        status: 'success',
                        message: `Dados de "${endpointName || endpointId}" coletados.`,
                        collected_at: data.collected_at,
                        resumo: { count, stats: summary }
                    };

                    let includeRaw = args.include_raw === true;
                    let rawString = '';
                    if (data.csv_raw) rawString = data.csv_raw;
                    else if (data.raw_data) rawString = JSON.stringify(data.raw_data);

                    if (rawString.length < 2000) includeRaw = true; 

                    if (includeRaw) {
                         responseObj.dados_completos = rawString.slice(0, 50000); 
                    } else {
                         const lines = rawString.split('\n');
                         responseObj.amostra = lines.slice(0, 5).join('\n');
                         responseObj.dica = 'DICA DE ANALISTA: Este é apenas um resumo. Para análise profunda (correlações, tendências, detalhe item a item), solicite novamente usando include_raw=true.';
                    }

                    toolOutput = JSON.stringify(responseObj);

                } else if (functionName === 'analyze_endpoint_metric') {
                    if (!endpointId) throw new Error("Identifier é obrigatório.");
                    
                    // Lógica de cálculo no servidor (Server-Side Analysis)
                    const metric = args.metric || 'count';
                    const collectedList = await this.collectedDataRepo.find({
                        where: { endpoint_id: endpointId, status: CollectionStatus.SUCCESS },
                        order: { collected_at: 'DESC' },
                        take: 1
                    });

                    if (collectedList.length === 0) {
                        toolOutput = JSON.stringify({ status: 'error', message: 'Sem dados coletados para analisar.' });
                    } else {
                        const latest = collectedList[0];
                        let result: any = null;
                        
                        // Processamento genérico simples
                        const data = latest.raw_data; // Assumindo Array de Objetos ou Objeto
                        
                        if (Array.isArray(data)) {
                             if (metric === 'count') {
                                 result = data.length;
                             } else if (metric.startsWith('total_') || metric.startsWith('sum_')) {
                                 const field = metric.replace('total_', '').replace('sum_', '');
                                 result = data.reduce((acc: number, item: any) => {
                                     // Tenta parsear numero (R$ 1.000,00 -> 1000.00)
                                     let val = item[field];
                                     if (typeof val === 'string') {
                                         val = parseFloat(val.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;
                                     }
                                     return acc + (Number(val) || 0);
                                 }, 0);
                                 result = `R$ ${result.toFixed(2)}`; // Formata moeda por padrão se for valor
                             } else if (metric.startsWith('average_')) {
                                 const field = metric.replace('average_', '');
                                 const total = data.reduce((acc: number, item: any) => acc + (Number(item[field]) || 0), 0);
                                 result = (total / data.length).toFixed(2);
                             }
                        } else {
                             result = "Formato de dados não suportado para cálculo automático (não é array).";
                        }

                        toolOutput = JSON.stringify({
                            status: 'success',
                            endpoint: endpointName,
                            metric_requested: metric,
                            calculated_result: result,
                            data_ref: latest.collected_at
                        });
                    }

                } else {
                    toolOutput = JSON.stringify({ error: 'Função desconhecida' });
                }
            } catch (error: any) {
                this.logger.error(`[TOOL] Erro: ${error.message}`);
                toolOutput = JSON.stringify({ status: 'error', message: error.message });
            }

            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: functionName,
                content: toolOutput,
            });
        }
    }

    this.logger.log(`[CHAT] Resposta Final: ${finalResponse.length} chars | Tokens: ${totalTokens}`);
    this.logInteraction(question, finalResponse, 'tool-augmented-model', userId);
    this.trackUsage(totalTokens, userId);

    return finalResponse;
  }

  /**
   * Detecta se a pergunta do usuário menciona algum sistema cadastrado pelo nome.
   * Retorna o ID do sistema encontrado, ou null.
   */
  private async detectSystemFromQuestion(question: string): Promise<string | null> {
    try {
      const systems = await this.systemsService.findAll();
      const questionLower = question.toLowerCase();

      for (const sys of systems) {
        // Comparar nomes (case-insensitive)
        if (questionLower.includes(sys.name.toLowerCase())) {
          this.logger.log(`[DETECT] Sistema "${sys.name}" encontrado na pergunta`);
          return sys.id;
        }
        // Comparar slug também
        if (sys.slug && questionLower.includes(sys.slug.toLowerCase())) {
          this.logger.log(`[DETECT] Sistema com slug "${sys.slug}" encontrado na pergunta`);
          return sys.id;
        }
      }
    } catch (err) {
      this.logger.warn(`[DETECT] Erro ao detectar sistema na pergunta: ${err}`);
    }
    return null;
  }

  /**
   * Constrói um contexto completo e rico de um sistema específico,
   * incluindo TODAS as informações cadastradas.
   */
  private async buildFullSystemContext(systemId: string): Promise<string> {
    const parts: string[] = [];

    // ── 1. Dados Cadastrais do Sistema ──
    const system = await this.systemsService.findOne(systemId);
    if (!system) {
      return '⚠️ Sistema não encontrado no banco de dados.';
    }

    parts.push(`# Sistema: ${system.name}`);
    parts.push(`Status: ${system.is_active ? 'Ativo' : 'Inativo'} | Slug: ${system.slug || 'N/A'} | URL: ${system.base_url || 'N/A'}`);
    if (system.description) parts.push(`Descrição: ${system.description}`);

    const meta: string[] = [];
    if (system.company_name) meta.push(`Empresa: ${system.company_name}`);
    if (system.environment) meta.push(`Ambiente: ${system.environment}`);
    if (system.criticality) meta.push(`Criticalidade: ${system.criticality}`);
    if (system.sla_uptime) meta.push(`SLA Uptime: ${system.sla_uptime}%`);
    if (meta.length > 0) parts.push(meta.join(' | '));

    // ── 2. Endpoints ──
    const endpoints = system.endpoints || [];
    if (endpoints.length > 0) {
      parts.push(`\n## Endpoints configurados: ${endpoints.length}`);
      for (const ep of endpoints) {
        const params = ep.params_schema ? Object.keys(ep.params_schema).join(', ') : 'nenhum';
        parts.push(`- ${ep.name} (ID: ${ep.id}, method: ${ep.method || 'GET'}, type: ${ep.response_type || 'json'}, params: ${params})`);
      }
    } else {
      parts.push('\nNenhum endpoint cadastrado.');
    }

    // ── 3. Arquivos complementares (com CONTEÚDO para CSV/TXT) ──
    try {
      const files = await this.systemFilesService.findAllBySystem(systemId);
      if (files.length > 0) {
        parts.push(`\n## Arquivos do sistema: ${files.length}`);
        for (const file of files) {
          parts.push(`\n### Arquivo: ${file.original_name}`);
          parts.push(`Tipo: ${file.mimetype} | Tamanho: ${file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'N/A'}`);
          if (file.description) parts.push(`Descrição: ${file.description}`);

          // Ler conteúdo de CSV/TXT para a IA poder analisar
          if (file.mimetype && (file.mimetype.includes('csv') || file.mimetype.includes('text/plain'))) {
            try {
              const content = await this.systemFilesService.readFileContent(file.filename);
              const lines = content.split('\n');
              const maxLines = 200;
              const preview = lines.slice(0, maxLines).join('\n');
              parts.push(`\`\`\`csv\n${preview}\n\`\`\``);
              if (lines.length > maxLines) {
                parts.push(`_(${lines.length - maxLines} linhas adicionais omitidas)_`);
              }
            } catch (err) {
              this.logger.warn(`Erro ao ler arquivo ${file.original_name}: ${err}`);
            }
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Erro ao buscar arquivos: ${err}`);
    }

    // ── 3.1 Segurança & Autenticação ──
    parts.push(`\n## Segurança & Configuração`);
    parts.push(`Tipo de Autenticação: ${system.auth_type}`);
    if (system.auth_config) {
        const configKeys = Object.keys(system.auth_config).join(', ');
        parts.push(`Chaves de Configuração presentes: [${configKeys}] (Valores ocultos por segurança)`);
    }

    // ── 3.2 Testes de Rede (Latência/Disponibilidade) ──
    // *Nota: Idealmente injetar NetworkTestsService, mas aqui vamos assumir que a IA
    // deve saber que pode PEDIR para rodar testes se precisar, ou ver o histórico se disponível via repository*
    // Para simplificar e evitar dependência circular excessiva, apenas mencionamos a capacidade por enquanto,
    // ou se tivermos acesso ao repo, listamos. (Assumindo que não injetamos o repo ainda, deixamos o prompt ciente).
    parts.push(`\n## Diagnóstico de Rede`);
    parts.push(`A IA pode solicitar execução de testes de rede (ping, dns, http) via ferramenta apropriada se disponível.`);


    // ── 4. DADOS COLETADOS REAIS (com valores!) ──
    if (endpoints.length > 0) {
      parts.push('\n## Dados Coletados (valores reais)');
      let hasAnyData = false;

      for (const ep of endpoints) {
        try {
          const collectedList = await this.collectedDataRepo.find({
            where: {
              endpoint_id: ep.id,
              status: CollectionStatus.SUCCESS,
            },
            order: { collected_at: 'DESC' },
            take: 5,
          });

          if (collectedList.length > 0) {
            hasAnyData = true;
            parts.push(`\n### ${ep.name} (${collectedList.length} coleta(s))`);

            for (const collected of collectedList) {
              const paramInfo = collected.params_used
                ? Object.entries(collected.params_used).map(([k, v]) => `${k}=${v}`).join(', ')
                : 'sem parâmetros';
              parts.push(`\n**Coleta** [${paramInfo}] em ${collected.collected_at}:`);

              // Incluir dados REAIS (CSV raw ou JSON)
              if (collected.csv_raw) {
                const lines = collected.csv_raw.split('\n');
                const maxLines = 100;
                const preview = lines.slice(0, maxLines).join('\n');
                parts.push(`\`\`\`csv\n${preview}\n\`\`\``);
                if (lines.length > maxLines) {
                  parts.push(`_(${lines.length - maxLines} linhas omitidas)_`);
                }
              } else if (collected.raw_data) {
                const jsonStr = JSON.stringify(collected.raw_data, null, 2);
                if (jsonStr.length > 8000) {
                  // Dados muito grandes: enviar amostra
                  const sample = Array.isArray(collected.raw_data)
                    ? JSON.stringify(collected.raw_data.slice(0, 30), null, 2)
                    : jsonStr.substring(0, 8000);
                  parts.push(`\`\`\`json\n${sample}\n\`\`\``);
                  if (Array.isArray(collected.raw_data)) {
                    parts.push(`_(Total: ${collected.raw_data.length} registros, mostrando primeiros 30)_`);
                  }
                } else {
                  parts.push(`\`\`\`json\n${jsonStr}\n\`\`\``);
                }
              }

              // Incluir resumo processado se existir
              if (collected.processed_data?.summary) {
                parts.push(`**Resumo processado:** ${JSON.stringify(collected.processed_data.summary)}`);
              }
              if (collected.processed_data?.total_items) {
                parts.push(`**Total de itens:** ${collected.processed_data.total_items}`);
              }
            }
          }
        } catch (err) {
          this.logger.warn(`Erro ao buscar dados de ${ep.name}: ${err}`);
        }
      }

      if (!hasAnyData) {
        parts.push('Nenhum dado coletado ainda.');
      }
    }

    return parts.join('\n');
  }

  /**
   * Busca dados brutos de um endpoint específico para quando a IA realmente
   * precisar analisar os dados (chamada sob demanda).
   */
  private async getEndpointData(endpointId: string, limit = 2): Promise<string> {
    const collectedList = await this.collectedDataRepo.find({
      where: {
        endpoint_id: endpointId,
        status: CollectionStatus.SUCCESS,
      },
      order: { collected_at: 'DESC' },
      take: limit,
    });

    if (collectedList.length === 0) return 'Sem dados coletados.';

    const parts: string[] = [];
    for (const collected of collectedList) {
      const paramInfo = collected.params_used ? JSON.stringify(collected.params_used) : 'sem parâmetros';
      parts.push(`\nColeta (${paramInfo}) em ${collected.collected_at}:`);

      if (collected.csv_raw) {
        const lines = collected.csv_raw.split('\n');
        const preview = lines.slice(0, 30).join('\n');
        parts.push(`\`\`\`csv\n${preview}\n\`\`\``);
        if (lines.length > 30) parts.push(`_(${lines.length - 30} linhas omitidas)_`);
      } else if (collected.raw_data) {
        const jsonStr = JSON.stringify(collected.raw_data, null, 2);
        if (jsonStr.length > 3000) {
          const sample = Array.isArray(collected.raw_data)
            ? JSON.stringify(collected.raw_data.slice(0, 5), null, 2)
            : jsonStr.substring(0, 3000);
          parts.push(`\`\`\`json\n${sample}\n\`\`\``);
        } else {
          parts.push(`\`\`\`json\n${jsonStr}\n\`\`\``);
        }
      }
    }

    return parts.join('\n');
  }

  /**
   * Constrói um resumo de todos os sistemas cadastrados (modo geral).
   */
  private async buildAllSystemsSummary(): Promise<string> {
    const systems = await this.systemsService.findAll();
    if (!systems || systems.length === 0) {
      return 'Nenhum sistema cadastrado no InsightHub.';
    }

    const parts: string[] = [];
    parts.push(`Sistemas cadastrados: ${systems.length}`);

    for (const sys of systems) {
      const info = [
        sys.is_active ? 'Ativo' : 'Inativo',
        sys.base_url || '',
        sys.company_name || '',
      ].filter(Boolean).join(' | ');
      parts.push(`- **${sys.name}**: ${info}${sys.description ? ' — ' + sys.description : ''}`);
    }

    return parts.join('\n');
  }

  /**
   * Busca automaticamente todos os dados coletados e monta um contexto
   * rico para a IA. Se systemId for informado, filtra apenas esse sistema.
   *
   * @param systemId ID opcional para filtrar por sistema
   */
  /**
   * Busca automaticamente todos os dados coletados e monta um contexto
   * rico para a IA. Se systemId for informado, filtra apenas esse sistema.
   *
   * @param systemId ID opcional para filtrar por sistema
   */
  private async buildAutoContext(
    systemId?: string,
  ): Promise<Record<string, any>> {
    // Buscar todos os endpoints com relação ao sistema
    let queryBuilder = this.endpointRepo
      .createQueryBuilder('endpoint')
      .leftJoinAndSelect('endpoint.system', 'system')
      .where('endpoint.is_active = :active', { active: true });

    if (systemId && systemId !== 'general') {
      queryBuilder = queryBuilder.andWhere('endpoint.system_id = :systemId', { systemId });
    }

    const endpoints = await queryBuilder.getMany();

    if (endpoints.length === 0) {
      return {};
    }

    // 2. Definir períodos (Mês Anterior + Atual)
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }

    const periods = [
      { mes: prevMonth, ano: prevYear, label: 'Mês Anterior' },
      { mes: currentMonth, ano: currentYear, label: 'Mês Atual' },
    ];

    const context: Record<string, any> = {
      _meta: {
        descricao: 'Dados coletados dos endpoints cadastrados no InsightHub',
        total_endpoints: endpoints.length,
        sistemas: [...new Set(endpoints.map((e) => e.system?.name).filter(Boolean))],
        periodos: periods.map((p) => `${p.mes}/${p.ano}`),
        gerado_em: now.toISOString(),
      },
    };

    // 3. Para cada endpoint, coletar e montar contexto
    for (const endpoint of endpoints) {
      const coletasEndpoint: any[] = [];
      
      for (const period of periods) {
        try {
          const params: Record<string, any> = {};
          if (endpoint.url_template.includes(':mes')) params['mes'] = period.mes;
          if (endpoint.url_template.includes(':ano')) params['ano'] = period.ano;

          // Se endpoint não tem parâmetros de data, só coletamos 1 vez (no loop do mês atual)
          if (Object.keys(params).length === 0 && period.label !== 'Mês Atual') {
             continue;
          }

          const data = await this.endpointsService.collectWithCache(endpoint.id, params);
          
          if (data && data.status === CollectionStatus.SUCCESS) {
             const entry: Record<string, any> = {
                 periodo: period.label,
                 ref: `${period.mes}/${period.ano}`,
                 coletado_em: data.collected_at,
                 dados_resumo: data.processed_data?.summary || 'N/A',
             };

             // CSV Raw ou JSON
             if (data.csv_raw) {
                const lines = data.csv_raw.split('\n');
                const maxLines = 150; 
                entry.dados_csv = lines.length > maxLines 
                    ? lines.slice(0, maxLines).join('\n') + `\n... (${lines.length - maxLines} linhas omitidas)` 
                    : data.csv_raw;
             } else if (data.raw_data) {
                const jsonStr = JSON.stringify(data.raw_data);
                entry.dados_json = jsonStr.length > 30000 
                    ? { resumo: 'Dados muito grandes', amostra: Array.isArray(data.raw_data) ? data.raw_data.slice(0, 10) : 'Objeto complexo' }
                    : data.raw_data;
             }
             
             coletasEndpoint.push(entry);
          }
        } catch (err) {
          this.logger.warn(`Erro ao coletar ${endpoint.name} (${period.mes}/${period.ano}): ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      if (coletasEndpoint.length > 0) {
        const systemName = endpoint.system?.name || 'Sistema';
        const key = `${systemName} > ${endpoint.name}`;
        context[key] = {
            descricao: endpoint.description,
            tipo: endpoint.response_type,
            historico: coletasEndpoint
        };
      }
    }

    return context;
  }

  // =========================================================================
  //  ANÁLISE DE DADOS COLETADOS
  // =========================================================================

  /**
   * Analisa dados coletados de um endpoint específico.
   * Busca os dados mais recentes e gera insight via IA.
   */
  async analyzeCollectedData(
    endpointId: string,
    params?: Record<string, any>,
    userId?: string,
  ): Promise<Insight> {
    const endpoint = await this.endpointRepo.findOne({
      where: { id: endpointId },
      relations: ['system'],
    });

    if (!endpoint) throw new Error(`Endpoint ${endpointId} não encontrado`);

    // Buscar dados coletados mais recentes
    const collectedList = await this.collectedDataRepo.find({
      where: {
        endpoint_id: endpointId,
        status: CollectionStatus.SUCCESS,
      },
      order: { collected_at: 'DESC' },
      take: 5,
    });

    // Filtrar por params se fornecido
    let collected = collectedList;
    if (params && Object.keys(params).length > 0) {
      collected = collectedList.filter((item) => {
        if (!item.params_used) return false;
        return Object.entries(params).every(
          ([key, value]) => String(item.params_used[key]) === String(value),
        );
      });
    }

    if (collected.length === 0) {
      throw new Error('Nenhum dado coletado encontrado para análise');
    }

    const latestData = collected[0];
    const dataForAnalysis = latestData.raw_data;

    // Usar prompt especializado para CSV ou JSON
    const isCsv = !!latestData.csv_raw;
    const { system, prompt } = isCsv
      ? this.promptBuilder.buildCsvAnalysisPrompt(
          dataForAnalysis,
          endpoint.name,
          endpoint.system?.name || 'Sistema',
          latestData.params_used || {},
        )
      : this.promptBuilder.buildPrompt(InsightType.ANALYSIS, {
          systemName: endpoint.system?.name,
          endpointName: endpoint.name,
          collectedData: dataForAnalysis,
          period: latestData.params_used
            ? `${latestData.params_used.mes}/${latestData.params_used.ano}`
            : 'atual',
        });

    const result = await this.llmGateway.chat([
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ]);

    this.logger.log(
      `Análise de dados gerada via ${result.model} | Tokens: ${result.tokens_used}`,
    );

    this.logInteraction(prompt, result.content, result.model, userId);
    this.trackUsage(result.tokens_used, userId);

    const severity = this.extractSeverity(result.content);

    const insight = this.insightRepo.create({
      system_id: endpoint.system_id,
      endpoint_id: endpointId,
      type: InsightType.ANALYSIS,
      title: `Análise — ${endpoint.name} (${latestData.params_used ? JSON.stringify(latestData.params_used) : 'último'})`,
      content: this.cleanResponse(result.content),
      severity,
      data_snapshot: dataForAnalysis,
      prompt_used: prompt,
      model_used: result.model,
    });

    return this.insightRepo.save(insight);
  }

  /**
   * Análise cruzada: combina dados de múltiplos endpoints e gera insight.
   */
  async crossAnalyze(
    endpointIds: string[],
    params?: Record<string, any>,
    userId?: string,
  ): Promise<Insight> {
    const datasets: Array<{
      endpointName: string;
      systemName: string;
      data: any;
      params: Record<string, any>;
    }> = [];

    for (const eid of endpointIds) {
      const endpoint = await this.endpointRepo.findOne({
        where: { id: eid },
        relations: ['system'],
      });

      if (!endpoint) continue;

      const collectedList = await this.collectedDataRepo.find({
        where: {
          endpoint_id: eid,
          status: CollectionStatus.SUCCESS,
        },
        order: { collected_at: 'DESC' },
        take: 1,
      });

      if (collectedList.length > 0) {
        datasets.push({
          endpointName: endpoint.name,
          systemName: endpoint.system?.name || 'Sistema',
          data: collectedList[0].raw_data,
          params: collectedList[0].params_used || {},
        });
      }
    }

    if (datasets.length < 2) {
      throw new Error(
        'Análise cruzada requer dados de pelo menos 2 endpoints',
      );
    }

    const { system, prompt } =
      this.promptBuilder.buildCrossAnalysisPrompt(datasets);

    const result = await this.llmGateway.chat([
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ]);

    this.logger.log(
      `Análise cruzada gerada via ${result.model} | Tokens: ${result.tokens_used}`,
    );

    this.logInteraction(prompt, result.content, result.model, userId);
    this.trackUsage(result.tokens_used, userId);

    const severity = this.extractSeverity(result.content);

    const insight = this.insightRepo.create({
      type: InsightType.COMPARISON,
      title: `Análise Cruzada — ${datasets.map((d) => d.endpointName).join(' × ')}`,
      content: this.cleanResponse(result.content),
      severity,
      data_snapshot: datasets,
      prompt_used: prompt,
      model_used: result.model,
    });

    return this.insightRepo.save(insight);
  }

  async getHealthStatus() {
    const providerInfo = await this.llmGateway.getActiveProviderInfo();
    return {
      llm_active: providerInfo.active,
      provider: providerInfo.provider,
      model: providerInfo.model,
    };
  }

  // =========================================================================
  //  UTILITÁRIOS
  // =========================================================================

  private async logInteraction(
    prompt: string,
    response: string,
    model: string,
    userId?: string,
  ) {
    try {
      const log = this.aiLogRepo.create({ prompt, response, model, userId });
      await this.aiLogRepo.save(log);
    } catch (e) {
      this.logger.error('Falha ao salvar log de IA', e);
    }
  }

  private async trackUsage(tokens: number, userId?: string) {
    if (!tokens) return;
    try {
      const estimatedCost = tokens * 0.000002;
      const usage = this.aiUsageRepo.create({
        userId,
        tokensUsed: tokens,
        estimatedCost,
      });
      await this.aiUsageRepo.save(usage);
    } catch (e) {
      this.logger.error('Falha ao salvar uso de IA', e);
    }
  }

  private extractSeverity(response: string): InsightSeverity {
    const match = response.match(/\[SEVERITY:(\w+)\]/);
    if (match) {
      const sev = match[1].toUpperCase();
      if (Object.values(InsightSeverity).includes(sev as InsightSeverity)) {
        return sev as InsightSeverity;
      }
    }
    return InsightSeverity.INFO;
  }

  private cleanResponse(response: string): string {
    return response.replace(/\[SEVERITY:\w+\]\n?/, '').trim();
  }

  private generateTitle(type: InsightType, data: any): string {
    const titles: Record<InsightType, string> = {
      [InsightType.ANALYSIS]: `Análise - ${data.endpointName} (${data.period || 'atual'})`,
      [InsightType.COMPARISON]: `Comparativo - ${data.period1} vs ${data.period2}`,
      [InsightType.ANOMALY]: `Anomalias Detectadas - ${data.endpointName}`,
      [InsightType.FORECAST]: `Previsão - ${data.endpointName}`,
      [InsightType.CUSTOM]: `Consulta - ${data.systemName}`,
    };
    return titles[type] || 'Insight';
  }

  /**
   * Gera uma análise global baseada em todos os dados disponíveis (com coleta automática).
   */
  async generateGlobalInsight(systemId?: string, userId?: string): Promise<Insight> {
    // 1. Coletar e montar contexto (Mês Atual + Anterior)
    const context = await this.buildAutoContext(systemId);

    if (!context || Object.keys(context).length <= 1) {
       // Apenas _meta
       throw new Error('Não há dados suficientes para gerar uma análise global.');
    }

    // 2. Construir Prompt
    // Tranformar contexto em string para o prompt
    const dataContextStr = JSON.stringify(context, null, 2);
    
    // Prompt específico para "Relatório de Inteligência de Negócio"
    const systemPrompt = this.promptBuilder.insightSystemPrompt;
    const userPrompt = `
Gere um **Relatório de Inteligência de Negócio (BI)** baseado nos dados coletados abaixo.
O relatório deve cobrir o desempenho do **Mês Anterior** comparado com o **Mês Atual**.

DADOS DO SISTEMA:
\`\`\`json
${dataContextStr}
\`\`\`

ESTRUTURA DA RESPOSTA:
1. **Resumo Executivo**: Visão geral da saúde do negócio/sistema.
2. **Tendências Identificadas**: O que melhorou ou piorou de um mês para o outro?
3. **Alertas de Negócio**: Algum KPI crítico fora do esperado? (Queda de vendas, aumento de latência impactando receita, etc)
4. **Recomendações Estratégicas**: Ações sugeridas para a diretoria.

Lembre-se: Foque em RESULTADOS, não em logs técnicos.
    `.trim();

    // 3. Chamar LLM
    const result = await this.llmGateway.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    this.logger.log(`Análise Global gerada via ${result.model} | Tokens: ${result.tokens_used}`);
    this.trackUsage(result.tokens_used, userId);

    // 4. Salvar Insight
    const severity = this.extractSeverity(result.content);
    
    const insight = this.insightRepo.create({
      system_id: systemId, // pode ser null se for todos
      type: InsightType.ANALYSIS, // ou CUSTOM/REPORT
      title: systemId ? `Relatório de BI - ${systemId}` : 'Relatório Global de Inteligência',
      content: this.cleanResponse(result.content),
      severity,
      data_snapshot: { meta: context._meta, summary: 'Contexto completo omitido por tamanho' },
      prompt_used: userPrompt.substring(0, 1000) + '...',
      model_used: result.model,
    });

    return this.insightRepo.save(insight);
  }

  async findAll(systemId?: string): Promise<Insight[]> {
    const query = this.insightRepo
      .createQueryBuilder('insight')
      .leftJoinAndSelect('insight.system', 'system')
      .leftJoinAndSelect('insight.endpoint', 'endpoint')
      .orderBy('insight.created_at', 'DESC');

    if (systemId) {
      query.where('insight.system_id = :systemId', { systemId });
    }

    return query.getMany();
  }
}
