export type AiProviderErrorCode =
  | 'AUTHENTICATION'
  | 'PAYMENT_REQUIRED'
  | 'MODEL_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'PROVIDER_UNAVAILABLE'
  | 'UNKNOWN';

const TIMEOUT_STATUS_CODES = new Set([408, 504, 524]);
const TIMEOUT_ERROR_NAMES = new Set([
  'RequestTimeoutError',
  'RequestAbortedError',
  'TimeoutError',
  'AbortError',
]);
const TIMEOUT_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'ECONNABORTED',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);

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

  if (statusCode !== undefined && TIMEOUT_STATUS_CODES.has(statusCode)) {
    return new AiProviderError(
      'TIMEOUT',
      'O provedor de IA demorou demais para responder. Tente novamente.',
      statusCode,
      error,
    );
  }

  if (isTimeoutLikeError(error)) {
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

function isTimeoutLikeError(error: unknown): boolean {
  let current: unknown = error;
  const visited = new Set<unknown>();

  while (
    typeof current === 'object' &&
    current !== null &&
    !visited.has(current)
  ) {
    visited.add(current);

    const name = getStringProperty(current, 'name');
    const code = getStringProperty(current, 'code');

    if (name !== undefined && TIMEOUT_ERROR_NAMES.has(name)) {
      return true;
    }

    if (code !== undefined && TIMEOUT_ERROR_CODES.has(code)) {
      return true;
    }

    current = getProperty(current, 'cause');
  }

  return false;
}

function getStringProperty(value: object, key: string): string | undefined {
  if (!(key in value)) {
    return undefined;
  }

  const propertyValue = (value as Record<string, unknown>)[key];

  return typeof propertyValue === 'string' ? propertyValue : undefined;
}

function getProperty(value: object, key: string): unknown {
  return (value as Record<string, unknown>)[key];
}
