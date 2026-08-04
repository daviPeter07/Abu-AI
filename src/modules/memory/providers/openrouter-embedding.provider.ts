import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouter } from '@openrouter/sdk';
import { classifyOpenRouterError } from '../../ai/errors/ai-provider.error';
import {
  getOpenRouterResilienceConfig,
  OPENROUTER_DISABLED_DEBUG_LOGGER,
  OPENROUTER_RETRY_CODES,
  type OpenRouterResilienceConfig,
} from '../../ai/providers/openrouter-resilience';
import { ObservabilityService } from '../../observability/observability.service';
import type { EmbeddingProvider } from '../contracts/embedding-provider.contract';

@Injectable()
export class OpenRouterEmbeddingProvider implements EmbeddingProvider {
  private readonly logger = new Logger(OpenRouterEmbeddingProvider.name);
  private readonly client: OpenRouter;
  private readonly model: string;
  private readonly resilience: OpenRouterResilienceConfig;

  constructor(
    configService: ConfigService,
    private readonly observabilityService: ObservabilityService,
  ) {
    this.resilience = getOpenRouterResilienceConfig(configService);
    this.client = new OpenRouter({
      apiKey: configService.getOrThrow<string>('app.openRouter.apiKey'),
      timeoutMs: this.resilience.timeoutMs,
      retryConfig: this.resilience.retryConfig,
      debugLogger: OPENROUTER_DISABLED_DEBUG_LOGGER,
    });
    this.model = configService.getOrThrow<string>(
      'app.openRouter.embeddingModel',
    );
  }

  async generate(text: string, correlationId?: string): Promise<number[]> {
    const startedAt = performance.now();

    try {
      const response = await this.client.embeddings.generate(
        {
          requestBody: {
            input: text,
            model: this.model,
          },
        },
        {
          timeoutMs: this.resilience.timeoutMs,
          retries: this.resilience.retryConfig,
          retryCodes: OPENROUTER_RETRY_CODES,
        },
      );

      if (typeof response === 'string') {
        throw new Error(
          'O OpenRouter retornou um embedding em formato inválido',
        );
      }

      const embedding = response.data[0]?.embedding;

      if (
        !embedding ||
        typeof embedding === 'string' ||
        embedding.length === 0
      ) {
        throw new Error('O OpenRouter retornou um embedding inválido');
      }

      this.observabilityService.recordProviderSuccess(
        'openrouter-embeddings',
        this.elapsedMilliseconds(startedAt),
      );

      return embedding;
    } catch (error) {
      const providerError = classifyOpenRouterError(error);
      const durationMs = this.elapsedMilliseconds(startedAt);

      this.observabilityService.recordProviderFailure(
        'openrouter-embeddings',
        durationMs,
        providerError.code,
      );

      this.logger.error(
        JSON.stringify({
          event: 'openrouter_embedding_failed',
          message: 'Falha ao gerar embedding pelo OpenRouter',
          correlationId,
          model: this.model,
          errorCode: providerError.code,
          statusCode: providerError.statusCode,
          durationMs,
        }),
      );

      throw providerError;
    }
  }

  private elapsedMilliseconds(startedAt: number): number {
    return Math.round(performance.now() - startedAt);
  }
}
