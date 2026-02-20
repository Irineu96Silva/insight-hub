import { LlmAdapter } from './llm-adapter.interface';
import { OpenAICompatibleAdapter } from './openai-compatible.adapter';
import { AnthropicAdapter } from './anthropic.adapter';
import { LlmProvider } from '../entities/llm-provider.entity';

/**
 * Presets de configuração para os provedores mais comuns.
 * Cada preset tem o slug, base_url e observações sobre api_key.
 */
export const LLM_PROVIDER_PRESETS = [
  {
    slug: 'openai',
    name: 'OpenAI',
    base_url: 'https://api.openai.com/v1',
    default_model: 'gpt-4o-mini',
    requires_key: true,
  },
  {
    slug: 'openrouter',
    name: 'OpenRouter',
    base_url: 'https://openrouter.ai/api/v1',
    default_model: 'deepseek/deepseek-r1-0528:free',
    requires_key: true,
  },
  {
    slug: 'anthropic',
    name: 'Anthropic',
    base_url: 'https://api.anthropic.com',
    default_model: 'claude-3-5-haiku-20241022',
    requires_key: true,
  },
  {
    slug: 'groq',
    name: 'Groq',
    base_url: 'https://api.groq.com/openai/v1',
    default_model: 'llama-3.3-70b-versatile',
    requires_key: true,
  },
  {
    slug: 'ollama',
    name: 'Ollama (Local)',
    base_url: 'http://localhost:11434/v1',
    default_model: 'llama3.2',
    requires_key: false,
  },
] as const;

/**
 * Factory que cria o adapter correto baseado no slug do provedor.
 */
export function createAdapter(provider: LlmProvider, decryptedApiKey: string | null): LlmAdapter {
  const slug = provider.slug.toLowerCase();

  // Anthropic usa SDK próprio
  if (slug === 'anthropic') {
    if (!decryptedApiKey) {
      throw new Error('Anthropic requer uma API Key configurada.');
    }
    return new AnthropicAdapter(decryptedApiKey, provider.default_model);
  }

  // Todos os outros são OpenAI-compatible
  const extraHeaders: Record<string, string> = {};

  // OpenRouter precisa de headers adicionais
  if (slug === 'openrouter') {
    extraHeaders['HTTP-Referer'] = 'https://insighthub.com';
    extraHeaders['X-Title'] = 'InsightHub';
  }

  return new OpenAICompatibleAdapter(
    provider.base_url,
    decryptedApiKey,
    provider.default_model,
    (Object.keys(extraHeaders).length > 0 ? extraHeaders : undefined) as Record<string, string> | undefined,
  );
}
