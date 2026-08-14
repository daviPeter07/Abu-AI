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
    [504, 'TIMEOUT'],
    [524, 'TIMEOUT'],
  ] as const)('should classify HTTP status %s as %s', (statusCode, code) => {
    const result = classifyOpenRouterError({ statusCode });

    expect(result).toBeInstanceOf(AiProviderError);
    expect(result.code).toBe(code);
    expect(result.statusCode).toBe(statusCode);
  });

  it.each([
    ['RequestTimeoutError'],
    ['RequestAbortedError'],
    ['TimeoutError'],
    ['AbortError'],
  ])('should classify %s as TIMEOUT', (name) => {
    const error = new Error('Request failed');
    error.name = name;

    expect(classifyOpenRouterError(error).code).toBe('TIMEOUT');
  });

  it.each([['ETIMEDOUT'], ['ECONNABORTED'], ['UND_ERR_CONNECT_TIMEOUT']])(
    'should classify %s as TIMEOUT',
    (code) => {
      const error = Object.assign(new Error('Request failed'), { code });

      expect(classifyOpenRouterError(error).code).toBe('TIMEOUT');
    },
  );

  it('should classify a timeout wrapped in a cause chain as TIMEOUT', () => {
    const timeoutCause = Object.assign(new Error('aborted'), {
      name: 'TimeoutError',
    });
    const wrapper = new Error('Unexpected HTTP client error', {
      cause: timeoutCause,
    });
    wrapper.name = 'UnexpectedClientError';

    expect(classifyOpenRouterError(wrapper).code).toBe('TIMEOUT');
  });

  it('should not treat connection resets as timeouts', () => {
    const error = Object.assign(new Error('connect ECONNREFUSED'), {
      code: 'ECONNREFUSED',
    });

    expect(classifyOpenRouterError(error).code).toBe('PROVIDER_UNAVAILABLE');
  });

  it('should not expose the original provider message', () => {
    const result = classifyOpenRouterError(
      new Error('secret prompt and api key'),
    );

    expect(result.message).not.toContain('secret prompt');
    expect(result.userMessage).not.toContain('api key');
  });
});
