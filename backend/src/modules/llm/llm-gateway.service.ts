import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { LlmService } from './llm.service';
import { createAdapter } from './adapters/adapter.factory';
import type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
} from './adapters/llm-adapter.interface';

/**
 * Ponto único de chamada LLM no app.
 *
 * Busca o provedor ativo no banco, cria o adapter correto,
 * e executa a request. Substitui o antigo OpenRouterService.
 */
@Injectable()
export class LlmGatewayService {
  private readonly logger = new Logger(LlmGatewayService.name);

  constructor(private readonly llmService: LlmService) {}

  /**
   * Envia uma completion de chat usando o provedor LLM ativo.
   */
  async chat(
    messages: ChatMessage[],
    options?: ChatCompletionOptions,
  ): Promise<ChatCompletionResult> {
    const provider = await this.llmService.findActive();

    if (!provider) {
      throw new ServiceUnavailableException(
        'Nenhum provedor LLM está ativo. Acesse Configurações → LLM para configurar.',
      );
    }

    const apiKey = this.llmService.decryptApiKey(provider);
    const adapter = createAdapter(provider, apiKey);

    this.logger.log(
      `[LLM] Chamando ${provider.name} (${provider.slug}) — modelo: ${options?.model || provider.default_model}`,
    );

    try {
      const start = Date.now();
      const result = await adapter.sendChatCompletion(messages, options);
      const duration = Date.now() - start;

      this.logger.log(
        `[LLM] Resposta em ${duration}ms | Tokens: ${result.tokens_used} | Modelo: ${result.model}`,
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `[LLM] Falha no provedor ${provider.name}: ${error.message}`,
      );
      throw new ServiceUnavailableException(
        `Falha ao chamar o provedor LLM "${provider.name}": ${error.message}`,
      );
    }
  }

  /**
   * Retorna informações do provedor ativo para health checks.
   */
  async getActiveProviderInfo() {
    const provider = await this.llmService.findActive();
    if (!provider) {
      return { active: false, provider: null, model: null };
    }
    return {
      active: true,
      provider: provider.name,
      model: provider.default_model,
      slug: provider.slug,
    };
  }
}
