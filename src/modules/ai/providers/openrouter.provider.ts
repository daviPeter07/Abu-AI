import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouter } from '@openrouter/sdk';
import type {
  AiProvider,
  GenerateAiResponseInput,
} from '../contracts/ai-provider.contract';

@Injectable()
export class OpenRouterProvider implements AiProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);

  private readonly client: OpenRouter;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>(
      'app.openRouter.apiKey',
    );

    this.model = this.configService.getOrThrow<string>('app.openRouter.model');

    this.client = new OpenRouter({
      apiKey,
    });
  }

  async generateResponse(input: GenerateAiResponseInput): Promise<string> {
    try {
      const completion = await this.client.chat.send({
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
      });

      if (!('choices' in completion)) {
        throw new Error(
          'O OpenRouter retornou uma resposta em formato de stream',
        );
      }

      const content = completion.choices[0]?.message.content;

      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('O OpenRouter retornou uma resposta vazia');
      }

      return content.trim();
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);

      this.logger.error(
        `Falha ao gerar resposta com o modelo ${this.model}`,
        stack,
      );

      throw new Error('Não foi possível gerar uma resposta com o OpenRouter');
    }
  }
}
