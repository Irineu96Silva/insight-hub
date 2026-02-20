/**
 * Configuração centralizada dos modelos LLM para cascata.
 *
 * Ordem de tentativa: Primary → Secondary → Fallback
 * - Primary (Reasoning): modelo mais capaz, para análises complexas
 * - Secondary (Fast): modelo rápido, para respostas ágeis
 * - Fallback: último recurso, garante disponibilidade
 */
export const LLM_MODELS = {
  primary: 'deepseek/deepseek-r1-0528:free',
  secondary: 'stepfun/step-3.5-flash:free',
  fallback: 'arcee-ai/arcee-trinity-large:free',
} as const;

/** Timeout por tentativa individual (ms) — 30s para acomodar modelos reasoning */
export const LLM_TIMEOUT_MS = 30_000;

/** Status codes HTTP que disparam fallback para o próximo modelo */
export const LLM_FALLBACK_STATUS_CODES = [400, 429, 500, 502, 503, 504];

/** Status codes de erro do cliente — falham imediatamente, sem fallback */
export const LLM_CLIENT_ERROR_CODES = [401, 403];

/** Lista ordenada de modelos para a cascata */
export const LLM_CASCADE_ORDER = [
  LLM_MODELS.primary,
  LLM_MODELS.secondary,
  LLM_MODELS.fallback,
] as const;
