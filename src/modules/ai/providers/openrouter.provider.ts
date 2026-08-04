import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouter } from '@openrouter/sdk';
import { ObservabilityService } from '../../observability/observability.service';
import type {
  AiProvider,
  GenerateAiResponseInput,
} from '../contracts/ai-provider.contract';
import { classifyOpenRouterError } from '../errors/ai-provider.error';
import {
  getOpenRouterResilienceConfig,
  OPENROUTER_DISABLED_DEBUG_LOGGER,
  OPENROUTER_RETRY_CODES,
  type OpenRouterResilienceConfig,
} from './openrouter-resilience';

@Injectable()
export class OpenRouterProvider implements AiProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);

  private readonly client: OpenRouter;
  private readonly model: string;
  private readonly resilience: OpenRouterResilienceConfig;

  constructor(
    configService: ConfigService,
    private readonly observabilityService: ObservabilityService,
  ) {
    const apiKey = configService.getOrThrow<string>('app.openRouter.apiKey');

    this.model = configService.getOrThrow<string>('app.openRouter.model');
    this.resilience = getOpenRouterResilienceConfig(configService);

    this.client = new OpenRouter({
      apiKey,
      timeoutMs: this.resilience.timeoutMs,
      retryConfig: this.resilience.retryConfig,
      debugLogger: OPENROUTER_DISABLED_DEBUG_LOGGER,
    });
  }

  async generateResponse(input: GenerateAiResponseInput): Promise<string> {
    const startedAt = performance.now();

    try {
      const completion = await this.client.chat.send(
        {
          chatRequest: {
            model: this.model,
            stream: false,
            responseFormat:
              input.responseFormat === 'json'
                ? {
                    type: 'json_object',
                  }
                : undefined,
            messages: input.messages.map((message) => {
              switch (message.role) {
                case 'system':
                  return {
                    role: 'system' as const,
                    content: message.content,
                  };

                case 'assistant':
                  return {
                    role: 'assistant' as const,
                    content: message.content,
                  };

                case 'user':
                  return {
                    role: 'user' as const,
                    content: message.content,
                  };
              }
            }),
          },
        },
        {
          timeoutMs: this.resilience.timeoutMs,
          retries: this.resilience.retryConfig,
          retryCodes: OPENROUTER_RETRY_CODES,
        },
      );

      if (!('choices' in completion)) {
        throw new Error(
          'O OpenRouter retornou uma resposta em formato de stream',
        );
      }

      const content = completion.choices[0]?.message.content;

      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('O OpenRouter retornou uma resposta vazia');
      }

      this.observabilityService.recordProviderSuccess(
        'openrouter-chat',
        this.elapsedMilliseconds(startedAt),
      );

      return content.trim();
    } catch (error) {
      const providerError = classifyOpenRouterError(error);
      const durationMs = this.elapsedMilliseconds(startedAt);

      this.observabilityService.recordProviderFailure(
        'openrouter-chat',
        durationMs,
        providerError.code,
      );

      this.logger.error(
        JSON.stringify({
          event: 'openrouter_chat_failed',
          message: 'Falha ao gerar resposta pelo OpenRouter',
          correlationId: input.correlationId,
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
