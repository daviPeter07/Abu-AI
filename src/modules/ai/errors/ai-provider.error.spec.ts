import { AiProviderError, classifyOpenRouterError } from './ai-provider.error';

describe('classifyOpenRouterError', () => {
  it.each([
    [401, 'AUTHENTICATION'],
    [402, 'PAYMENT_REQUIRED'],
    [404, 'MODEL_NOT_FOUND'],
    [408, 'TIMEOUT'],
    [429, 'RATE_LIMITED'],
    [500, 'PROVIDER_UNAVAILABLE'],
    [503, 'PROVIDER_UNAVAILABLE'],
  ] as const)('should classify HTTP status %s as %s', (statusCode, code) => {
    const result = classifyOpenRouterError({ statusCode });

    expect(result).toBeInstanceOf(AiProviderError);
    expect(result.code).toBe(code);
    expect(result.statusCode).toBe(statusCode);
  });

  it('should classify SDK timeouts without an HTTP status', () => {
    const error = new Error('Request timed out');
    error.name = 'RequestTimeoutError';

    expect(classifyOpenRouterError(error).code).toBe('TIMEOUT');
  });

  it('should not expose the original provider message', () => {
    const result = classifyOpenRouterError(
      new Error('secret prompt and api key'),
    );

    expect(result.message).not.toContain('secret prompt');
    expect(result.userMessage).not.toContain('api key');
  });
});
