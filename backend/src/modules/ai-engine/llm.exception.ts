import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exceção lançada quando todos os modelos da cascata falharam.
 * Inclui detalhes dos erros de cada tentativa para diagnóstico.
 */
export class AllModelsFailedException extends HttpException {
  constructor(errors: Array<{ model: string; error: string }>) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'ALL_MODELS_FAILED',
        message:
          'Todos os modelos de IA falharam. Tente novamente em alguns instantes.',
        details: errors,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Exceção lançada quando o erro é do cliente (400, 401, 403).
 * Nesses casos NÃO tentamos fallback — o problema está na requisição.
 */
export class LlmClientErrorException extends HttpException {
  constructor(statusCode: number, message: string, model: string) {
    super(
      {
        statusCode,
        error: 'CLIENT_ERROR',
        message: `Erro do cliente ao chamar modelo ${model}: ${message}`,
        model,
      },
      statusCode,
    );
  }
}
