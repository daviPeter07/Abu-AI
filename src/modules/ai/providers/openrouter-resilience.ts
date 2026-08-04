import type { ConfigService } from '@nestjs/config';

export const OPENROUTER_RETRY_CODES = ['408', '429', '5XX'];
export const OPENROUTER_DISABLED_DEBUG_LOGGER = {
  group: (): void => undefined,
  groupEnd: (): void => undefined,
  log: (): void => undefined,
};

export interface OpenRouterResilienceConfig {
  timeoutMs: number;
  retryConfig: {
    strategy: 'backoff';
    backoff: {
      initialInterval: number;
      maxInterval: number;
      exponent: number;
      maxElapsedTime: number;
    };
    retryConnectionErrors: boolean;
  };
}

export function getOpenRouterResilienceConfig(
  configService: ConfigService,
): OpenRouterResilienceConfig {
  return {
    timeoutMs: configService.getOrThrow<number>(
      'app.openRouter.requestTimeoutMs',
    ),
    retryConfig: {
      strategy: 'backoff',
      backoff: {
        initialInterval: configService.getOrThrow<number>(
          'app.openRouter.retryInitialDelayMs',
        ),
        maxInterval: configService.getOrThrow<number>(
          'app.openRouter.retryMaxDelayMs',
        ),
        exponent: 2,
        maxElapsedTime: configService.getOrThrow<number>(
          'app.openRouter.retryMaxElapsedTimeMs',
        ),
      },
      retryConnectionErrors: true,
    },
  };
}
