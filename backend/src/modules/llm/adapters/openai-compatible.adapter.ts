import OpenAI from 'openai';
import {
  LlmAdapter,
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
  LlmModel,
} from './llm-adapter.interface';

/**
 * Adapter base para provedores OpenAI-compatible.
 * Funciona para: OpenAI, OpenRouter, Groq, Ollama.
 */
export class OpenAICompatibleAdapter implements LlmAdapter {
  protected client: OpenAI;
  protected defaultModel: string;

  constructor(
    baseURL: string,
    apiKey: string | null,
    defaultModel: string,
    extraHeaders?: Record<string, string>,
  ) {
    this.defaultModel = defaultModel;
    this.client = new OpenAI({
      apiKey: apiKey || 'ollama', // Ollama não precisa de key
      baseURL,
      defaultHeaders: extraHeaders || {},
    });
  }

  async sendChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions,
  ): Promise<ChatCompletionResult> {
    const model = options?.model || this.defaultModel;

    const response = await this.client.chat.completions.create({
      model,
      messages: messages as any,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 2000,
      tools: options?.tools,
      tool_choice: options?.tool_choice,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content || null;
    const tokens = response.usage?.total_tokens || 0;
    const tool_calls = choice?.message?.tool_calls as any;

    return {
      content,
      model: response.model || model,
      tokens_used: tokens,
      tool_calls,
    };
  }

  async listModels(): Promise<LlmModel[]> {
    try {
      const response = await this.client.models.list();
      const models: LlmModel[] = [];

      for await (const model of response) {
        models.push({
          id: model.id,
          name: model.id, // A maioria dos provedores usa o ID como nome
        });
      }

      // Ordena alfabeticamente e limita a 100
      return models
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 100);
    } catch {
      return [];
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Tenta uma chamada mínima de chat
      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });

      if (response.choices[0]?.message?.content) {
        return {
          success: true,
          message: `Conexão OK! Modelo ${response.model || this.defaultModel} respondeu.`,
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
