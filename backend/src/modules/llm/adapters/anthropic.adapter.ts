import Anthropic from '@anthropic-ai/sdk';
import {
  LlmAdapter,
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
  LlmModel,
} from './llm-adapter.interface';

/**
 * Adapter para Anthropic (Claude).
 * A Anthropic usa formato de messages diferente do OpenAI:
 * - system prompt vai em parâmetro separado
 * - messages não podem ter role 'system'
 */
export class AnthropicAdapter implements LlmAdapter {
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string) {
    this.defaultModel = defaultModel;
    this.client = new Anthropic({ apiKey });
  }

  async sendChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions,
  ): Promise<ChatCompletionResult> {
    const model = options?.model || this.defaultModel;

    // Separa system prompt das messages (Anthropic exige separação)
    const systemMessages = messages.filter((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content || '',
      }));

    const systemPrompt = systemMessages.map((m) => m.content || '').join('\n\n');

    const response = await this.client.messages.create({
      model,
      max_tokens: options?.max_tokens ?? 2000,
      system: systemPrompt || undefined,
      messages: chatMessages,
    });

    // Extrai texto do formato Anthropic (array de content blocks)
    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const tokens =
      (response.usage?.input_tokens || 0) +
      (response.usage?.output_tokens || 0);

    return {
      content,
      model: response.model,
      tokens_used: tokens,
    };
  }

  async listModels(): Promise<LlmModel[]> {
    // A Anthropic não tem endpoint público de listagem de modelos
    // Retorna os modelos conhecidos
    return [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ];
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });

      if (response.content.length > 0) {
        return {
          success: true,
          message: `Conexão OK! Modelo ${response.model} respondeu.`,
        };
      }
      return { success: false, message: 'Resposta vazia do modelo.' };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Falha na conexão',
      };
    }
  }
}
