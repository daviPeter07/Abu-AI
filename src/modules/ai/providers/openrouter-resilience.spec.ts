import { ConfigService } from '@nestjs/config';
import {
  getOpenRouterResilienceConfig,
  OPENROUTER_DISABLED_DEBUG_LOGGER,
  OPENROUTER_RETRY_CODES,
} from './openrouter-resilience';

describe('getOpenRouterResilienceConfig', () => {
  it('should build a bounded backoff policy for temporary errors', () => {
    const values: Record<string, number> = {
      'app.openRouter.requestTimeoutMs': 30_000,
      'app.openRouter.retryInitialDelayMs': 500,
      'app.openRouter.retryMaxDelayMs': 2_000,
      'app.openRouter.retryMaxElapsedTimeMs': 5_000,
    };
    const configService = {
      getOrThrow: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;

    expect(getOpenRouterResilienceConfig(configService)).toEqual({
      timeoutMs: 30_000,
      retryConfig: {
        strategy: 'backoff',
        backoff: {
          initialInterval: 500,
          maxInterval: 2_000,
          exponent: 2,
          maxElapsedTime: 5_000,
        },
        retryConnectionErrors: true,
      },
    });
    expect(OPENROUTER_RETRY_CODES).toEqual(['408', '429', '5XX']);
    expect(typeof OPENROUTER_DISABLED_DEBUG_LOGGER.group).toBe('function');
    expect(typeof OPENROUTER_DISABLED_DEBUG_LOGGER.groupEnd).toBe('function');
    expect(typeof OPENROUTER_DISABLED_DEBUG_LOGGER.log).toBe('function');
  });
});
