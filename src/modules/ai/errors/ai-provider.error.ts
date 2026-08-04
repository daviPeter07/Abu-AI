export type AiProviderErrorCode =
  | 'AUTHENTICATION'
  | 'PAYMENT_REQUIRED'
  | 'MODEL_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'PROVIDER_UNAVAILABLE'
  | 'UNKNOWN';

export class AiProviderError extends Error {
  readonly name = 'AiProviderError';

  constructor(
    readonly code: AiProviderErrorCode,
    readonly userMessage: string,
    readonly statusCode?: number,
    cause?: unknown,
  ) {
    super('Não foi possível concluir a chamada ao provedor de IA', { cause });
  }
}

export function classifyOpenRouterError(error: unknown): AiProviderError {
  const statusCode = getStatusCode(error);
  const errorName = error instanceof Error ? error.name : '';

  if (statusCode === 401) {
    return new AiProviderError(
      'AUTHENTICATION',
      'A configuração do provedor de IA precisa ser revisada.',
      statusCode,
      error,
    );
  }

  if (statusCode === 402) {
    return new AiProviderError(
      'PAYMENT_REQUIRED',
      'O provedor de IA está temporariamente indisponível por limite de créditos.',
      statusCode,
      error,
    );
  }

  if (statusCode === 404) {
    return new AiProviderError(
      'MODEL_NOT_FOUND',
      'O modelo de IA configurado não está disponível.',
      statusCode,
      error,
    );
  }

  if (statusCode === 429) {
    return new AiProviderError(
      'RATE_LIMITED',
      'O provedor de IA está ocupado. Tente novamente em alguns instantes.',
      statusCode,
      error,
    );
  }

  if (
    statusCode === 408 ||
    statusCode === 524 ||
    errorName === 'RequestTimeoutError'
  ) {
    return new AiProviderError(
      'TIMEOUT',
      'O provedor de IA demorou demais para responder. Tente novamente.',
      statusCode,
      error,
    );
  }

  if (statusCode === undefined || statusCode >= 500) {
    return new AiProviderError(
      'PROVIDER_UNAVAILABLE',
      'O provedor de IA está temporariamente indisponível.',
      statusCode,
      error,
    );
  }

  return new AiProviderError(
    'UNKNOWN',
    'Não consegui gerar uma resposta agora. Tente novamente em alguns instantes.',
    statusCode,
    error,
  );
}

function getStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return undefined;
  }

  const { statusCode } = error;

  return typeof statusCode === 'number' ? statusCode : undefined;
}
