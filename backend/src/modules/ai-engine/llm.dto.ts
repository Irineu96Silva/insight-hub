/**
 * DTOs para respostas do serviço LLM.
 */

/** Resposta padronizada de uma chamada LLM com cascata */
export class LlmResponse {
  /** Conteúdo textual gerado pelo modelo */
  content: string;

  /** Identificador do modelo que efetivamente respondeu */
  modelUsed: string;

  /** Quantas tentativas foram feitas até obter resposta (1 = primeira tentativa) */
  attemptCount: number;

  constructor(content: string, modelUsed: string, attemptCount: number) {
    this.content = content;
    this.modelUsed = modelUsed;
    this.attemptCount = attemptCount;
  }
}
