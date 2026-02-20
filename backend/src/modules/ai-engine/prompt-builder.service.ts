import { Injectable } from '@nestjs/common';
import { InsightType } from './entities/insight.entity';

@Injectable()
export class PromptBuilderService {
  // =========================================================================
  //  SYSTEM PROMPT — INSIGHTS (Business Intelligence Expert)
  // =========================================================================
  //  SYSTEM PROMPT — INSIGHTS (Business Intelligence Expert)
  // =========================================================================
  public readonly insightSystemPrompt = `
Você é um **Especialista Sênior em Business Intelligence (BI)** e Análise de Dados Corporativos.
Seu objetivo é extrair valor estratégico, tendências de mercado e oportunidades de negócio a partir dos dados fornecidos.

🚫 **O QUE NÃO FAZER:**
- Não foque em métricas técnicas de TI (latência, CPU, uptime) a menos que impactem a receita.
- Não use jargão de desenvolvedor (JSON, array, null pointer).

✅ **O QUE FAZER:**
- Foque em: **Receita, Custos, Vendas, Clientes, Churn, Eficiência Operacional, Estoque**.
- Identifique padrões de comportamento do consumidor ou da operação.
- Sugira ações que aumentem o lucro ou reduzam desperdícios.
- Use linguagem executiva, clara e direta.
- Responda SEMPRE em **Português Brasileiro**.
- Classifique a severidade com base no **impacto financeiro/estratégico**:
  - INFO: Curiosidade ou dado neutro.
  - SUCCESS: Meta batida ou crescimento notável.
  - WARNING: Tendência de queda ou risco moderado.
  - CRITICAL: Prejuízo financeiro, perda de clientes ou risco grave à operação.
  - Retorne a severidade na primeira linha: [SEVERITY:INFO]
  `.trim();

  // =========================================================================
  //  SYSTEM PROMPT — CHAT AI (Assistente do InsightHub)
  // =========================================================================
  private readonly chatSystemPrompt = `
Você é a **IA Assistente do InsightHub** — uma plataforma de monitoramento e análise inteligente de sistemas empresariais.

## Sua Personalidade
- Você é **solicita, respeitosa e amigável** — sempre com vontade de ajudar
- Responde com **clareza e simplicidade**, sem jargões desnecessários
- Quando não souber algo, admite honestamente e tenta orientar
- Usa emojis com moderação para ser mais acolhedora (✅, 📊, 💡, etc.)
- Responde SEMPRE em **português brasileiro**

## Suas Capacidades
Você pode ajudar o usuário com:
1. **Explicar funcionalidades** do InsightHub (sistemas, endpoints, insights, coleta de dados)
2. **Analisar dados** coletados pelos endpoints cadastrados, quando disponíveis
3. **Orientar o uso** do sistema passo a passo (como cadastrar sistemas, endpoints, etc.)
4. **Interpretar insights** gerados pela plataforma
5. **Responder dúvidas gerais** de forma educada e útil

## Como o InsightHub Funciona (para você ensinar ao usuário)
- **Sistemas**: O usuário cadastra os sistemas que deseja monitorar (ex: ERP, CRM, APIs externas)
- **Endpoints**: Dentro de cada sistema, o usuário cadastra os endpoints/APIs que retornam dados
- **Coleta de Dados**: O InsightHub coleta dados automaticamente desses endpoints
- **Insights**: A IA analisa os dados coletados e gera insights com severidade (INFO, WARNING, CRITICAL)
- **Chat**: O usuário pode conversar com você para tirar dúvidas, pedir análises ou aprender a usar o sistema

## Quando NÃO houver dados disponíveis
- Responda normalmente à pergunta ou saudação do usuário
- Informe que você pode analisar dados quando houver endpoints cadastrados e dados coletados
- Oriente o usuário sobre como começar: "Cadastre um sistema → adicione endpoints → os dados serão coletados → eu posso analisá-los!"
- NÃO invente dados ou métricas fictícias

## Regras Importantes
- NUNCA use tags como [SEVERITY:...] no chat — isso é só para insights
- NUNCA ignore a mensagem do usuário para forçar uma análise de dados
- NUNCA finja ter dados que você não tem
- Se o usuário enviar uma saudação simples ("Olá", "Oi"), responda de forma calorosa e ofereça suas capacidades
- Se receberem dados de contexto, use-os na conversa de forma natural
  `.trim();

  // =========================================================================
  //  BUILD CHAT PROMPT
  // =========================================================================

  buildChatPrompt(
    question: string,
    dataContext?: any,
  ): { system: string; prompt: string } {
    let prompt = question;

    if (dataContext && Object.keys(dataContext).length > 0) {
      const hasRealData = Object.values(dataContext).some(
        (v) => v !== undefined && v !== null && v !== '',
      );

      if (hasRealData) {
        // Construir representação legível dos dados
        const dataSections: string[] = [];

        for (const [key, value] of Object.entries(dataContext)) {
          if (key === '_meta') {
            dataSections.push(`## Informações Gerais\n${JSON.stringify(value, null, 2)}`);
            continue;
          }

          const dataset = value as any;
          if (!dataset?.coletas) continue;

          let section = `## ${key}\n`;
          section += `- Tipo: ${dataset.tipo_resposta || 'json'}\n`;
          if (dataset.descricao) section += `- Descrição: ${dataset.descricao}\n`;

          for (const coleta of dataset.coletas) {
            section += `\n### Coleta (params: ${JSON.stringify(coleta.params)}, data: ${coleta.coletado_em})\n`;

            if (coleta.dados_csv) {
              section += `Dados CSV (${coleta.total_linhas_csv} linhas):\n\`\`\`csv\n${coleta.dados_csv}\n\`\`\`\n`;
            }

            if (coleta.dados_json) {
              const jsonStr = JSON.stringify(coleta.dados_json, null, 2);
              section += `Dados JSON:\n\`\`\`json\n${jsonStr}\n\`\`\`\n`;
            }

            if (coleta.dados_json_resumo) {
              section += `Resumo: ${coleta.dados_json_resumo}\n`;
              if (coleta.dados_json_amostra) {
                section += `Amostra:\n\`\`\`json\n${JSON.stringify(coleta.dados_json_amostra, null, 2)}\n\`\`\`\n`;
              }
            }
          }

          dataSections.push(section);
        }

        prompt = `
Pergunta do usuário: ${question}

# Dados de Negócio Disponíveis
Os dados abaixo foram coletados dos sistemas da empresa. Use-os para responder com foco em resultados, tendências e estratégia.

${dataSections.join('\n---\n')}

**INSTRUÇÕES:**
- Analise os dados como um estrategista de negócios.
- Se os dados forem técnicos, tente traduzi-los para impacto no negócio (ex: lentidão = perda de vendas).
- Use valores reais dos dados.
- Apresente os resultados de forma clara com formatação Markdown.
        `.trim();
      }
    }

    return {
      system: this.chatSystemPrompt,
      prompt,
    };
  }

  // =========================================================================
  //  BUILD INSIGHT PROMPTS
  // =========================================================================

  buildPrompt(
    type: InsightType,
    data: any,
    context?: string,
  ): {
    system: string;
    prompt: string;
  } {
    const promptMap: Record<InsightType, (data: any, ctx?: string) => string> =
      {
        [InsightType.ANALYSIS]: this.buildAnalysisPrompt,
        [InsightType.COMPARISON]: this.buildComparisonPrompt,
        [InsightType.ANOMALY]: this.buildAnomalyPrompt,
        [InsightType.FORECAST]: this.buildForecastPrompt,
        [InsightType.CUSTOM]: this.buildCustomPrompt,
      };

    return {
      system: this.insightSystemPrompt,
      prompt: promptMap[type](data, context),
    };
  }

  // =========================================================================
  //  PROMPT ESPECIALIZADO PARA CSV
  // =========================================================================

  /**
   * Prompt otimizado para dados CSV parseados.
   * Lida com grandes volumes de dados tabulares.
   */
  buildCsvAnalysisPrompt(
    csvData: any,
    endpointName: string,
    systemName: string,
    params: Record<string, any>,
  ): { system: string; prompt: string } {
    const rows = Array.isArray(csvData) ? csvData : [];
    const sampleSize = Math.min(rows.length, 20);
    const sample = rows.slice(0, sampleSize);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    const prompt = `
Analise os dados CSV do sistema "${systemName}" (Fonte: "${endpointName}").

PARÂMETROS: ${JSON.stringify(params)}
TOTAL REGISTROS: ${rows.length}
COLUNAS: ${columns.join(', ')}

AMOSTRA (primeiros ${sampleSize}):
\`\`\`json
${JSON.stringify(sample, null, 2)}
\`\`\`

${rows.length > sampleSize ? `RESUMO ESTATÍSTICO:
${this.buildStatsSummary(rows, columns)}` : ''}

Por favor, gere um **Relatório de Inteligência de Negócio**:
1. **Performance Comercial/Operacional**: Como estamos indo? (Totais, médias, crescimento).
2. **Padrões de Comportamento**: O que os dados revelam sobre clientes ou processos?
3. **Top Players**: Melhores produtos, vendedores, regiões ou itens.
4. **Pontos de Atenção**: Onde estamos perdendo dinheiro ou eficiência?
5. **Plano de Ação**: 3 recomendações estratégicas baseadas nestes números.
6. **Classificação**: Defina a severidade (INFO, SUCCESS, WARNING, CRITICAL).
    `.trim();

    return {
      system: this.insightSystemPrompt,
      prompt,
    };
  }

  // =========================================================================
  //  PROMPT PARA ANÁLISE CRUZADA
  // =========================================================================

  /**
   * Combina dados de múltiplos endpoints para análise cruzada.
   */
  buildCrossAnalysisPrompt(
    datasets: Array<{
      endpointName: string;
      systemName: string;
      data: any;
      params: Record<string, any>;
    }>,
  ): { system: string; prompt: string } {
    const datasetsText = datasets
      .map((ds, i) => {
        const rows = Array.isArray(ds.data) ? ds.data : [];
        const sample = rows.slice(0, 10);
        return `
### Fonte ${i + 1}: "${ds.endpointName}" (${ds.systemName})
Params: ${JSON.stringify(ds.params)}
Registros: ${rows.length}
Amostra:
\`\`\`json
${JSON.stringify(sample, null, 2)}
\`\`\`
        `.trim();
      })
      .join('\n\n');

    const prompt = `
Realize uma **Análise Estratégica Cruzada** (Cross-Analysis) das seguintes fontes de dados:

${datasetsText}

Por favor:
1. **Correlações de Negócio**: Existe relação entre essas fontes? (Ex: Marketing vs Vendas).
2. **Visão Holística**: O que a combinação desses dados revela que olhá-los isoladamente não mostraria?
3. **Discrepâncias**: Os números batem? Há furos no processo?
4. **Oportunidades Inexploradas**: Onde podemos crescer?
5. **Recomendações Estratégicas**: Sugira ações integradas.
    `.trim();

    return {
      system: this.insightSystemPrompt,
      prompt,
    };
  }

  // =========================================================================
  //  PROMPTS DE INSIGHT EXISTENTES (Refinados para BI)
  // =========================================================================

  private buildAnalysisPrompt = (data: any, context?: string): string =>
    `
Analise os dados de negócio abaixo (Fonte: "${data.systemName}" - "${data.endpointName}"):

DADOS:
\`\`\`json
${JSON.stringify(data.collectedData, null, 2)}
\`\`\`

CONTEXTO: ${context || 'Análise de performance comercial e operacional'}

Por favor, gere um relatório executivo contendo:
1. **Resumo Executivo**: Os números mais importantes (Total vendido, Novos leads, etc).
2. **Tendências de Negócio**: O que está subindo ou descendo? (Ex: Vendas caindo no fim de semana).
3. **Destaques**: Melhores produtos/vendedores ou gargalos operacionais.
4. **Oportunidades**: Onde podemos ganhar mais ou economizar?
5. **Ação Recomendada**: Uma sugestão prática para a diretoria.
  `.trim();

  private buildComparisonPrompt = (data: any, context?: string): string =>
    `
Compare os resultados de negócio entre dois períodos para "${data.systemName}":

PERÍODO 1 (${data.period1}):
\`\`\`json
${JSON.stringify(data.data1, null, 2)}
\`\`\`

PERÍODO 2 (${data.period2}):
\`\`\`json
${JSON.stringify(data.data2, null, 2)}
\`\`\`

Foque em:
1. **Variação de Performance**: Crescimento ou retração (em % e valor absoluto).
2. **Mudança de Mix**: O que mudou na composição das vendas/operação?
3. **Causalidade**: Hipóteses de negócio para as mudanças (sazonalidade, novas campanhas?).
4. **Projeção**: Se continuar assim, onde vamos parar?
  `.trim();

  private buildAnomalyPrompt = (data: any, context?: string): string =>
    `
Identifique ANOMALIAS DE NEGÓCIO nos dados abaixo:

SISTEMA: ${data.systemName}
DADOS:
\`\`\`json
${JSON.stringify(data.collectedData, null, 2)}
\`\`\`

Procure por situações como:
1. Queda brusca em vendas ou leads.
2. Aumento repentino de cancelamentos (Churn).
3. Custos operacionais fora da média.
4. Desvios de estoque ou métricas financeiras suspeitas.

Explique a anomalia e seu possível impacto financeiro.
  `.trim();

  private buildForecastPrompt = (data: any, context?: string): string =>
    `
Com base no histórico operacional abaixo, projete o futuro do negócio:

SISTEMA: ${data.systemName}
HISTÓRICO:
\`\`\`json
${JSON.stringify(data.historicalData, null, 2)}
\`\`\`

Por favor:
1. **Tendência de Longo Prazo**: O negócio está saudável?
2. **Previsão de Receita/Demanda**: O que esperar para o próximo ciclo?
3. **Sazonalidade**: Identifique padrões recorrentes.
4. **Alerta de Risco**: Alguma tendência preocupante no horizonte?
  `.trim();

  private buildCustomPrompt = (data: any, context?: string): string =>
    `
SISTEMA: ${data.systemName}
DADOS DE NEGÓCIO:
\`\`\`json
${JSON.stringify(data.collectedData, null, 2)}
\`\`\`

PERGUNTA ESTRATÉGICA: ${context}

Responda com foco em ROI, eficiência e resultados.
  `.trim();

  // =========================================================================
  //  UTILITÁRIOS
  // =========================================================================

  /**
   * Gera resumo estatístico de dados tabulares para prompts CSV.
   */
  private buildStatsSummary(
    rows: Record<string, any>[],
    columns: string[],
  ): string {
    const numericColumns = columns.filter((col) => {
      const sample = rows.slice(0, 10);
      return sample.every(
        (row) => typeof row[col] === 'number' || !isNaN(Number(row[col])),
      );
    });

    if (numericColumns.length === 0) return 'Sem colunas numéricas detectadas.';

    return numericColumns
      .map((col) => {
        const values = rows
          .map((r) => Number(r[col]))
          .filter((v) => !isNaN(v));
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return `- ${col}: soma=${sum.toFixed(2)}, média=${avg.toFixed(2)}, min=${min}, max=${max}`;
      })
      .join('\n');
  }
}
