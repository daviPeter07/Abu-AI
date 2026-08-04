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
          messages: [
            {
              role: 'user',
              content: [
                `O nome do usuário é ${input.username}.`,
                '',
                input.message,
              ].join('\n'),
            },
          ],
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
