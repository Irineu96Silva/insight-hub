/**
 * Interface comum para todos os adapters de LLM.
 * Padrão Strategy: cada provedor implementa essa interface.
 */

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ChatCompletionOptions {
  model?: string;        // Override do modelo padrão do provider
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: any[];
  tool_choice?: any;
}

export interface ChatCompletionResult {
  content: string | null;
  model: string;
  tokens_used: number;
  tool_calls?: ToolCall[];
}

export interface LlmModel {
  id: string;
  name: string;
}

export interface LlmAdapter {
  /** Envia uma completion de chat e retorna a resposta */
  sendChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions,
  ): Promise<ChatCompletionResult>;

  /** Lista modelos disponíveis no provedor */
  listModels(): Promise<LlmModel[]>;

  /** Testa a conexão com o provedor (retorna true se OK) */
  testConnection(): Promise<{ success: boolean; message: string }>;
}
