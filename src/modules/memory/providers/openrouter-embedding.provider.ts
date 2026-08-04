import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouter } from '@openrouter/sdk';
import type { EmbeddingProvider } from '../contracts/embedding-provider.contract';

@Injectable()
export class OpenRouterEmbeddingProvider implements EmbeddingProvider {
  private readonly logger = new Logger(OpenRouterEmbeddingProvider.name);
  private readonly client: OpenRouter;
  private readonly model: string;

  constructor(configService: ConfigService) {
    this.client = new OpenRouter({
      apiKey: configService.getOrThrow<string>('app.openRouter.apiKey'),
    });
    this.model = configService.getOrThrow<string>(
      'app.openRouter.embeddingModel',
    );
  }

  async generate(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.generate({
        requestBody: {
          input: text,
          model: this.model,
        },
      });

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

      return embedding;
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);

      this.logger.error(
        `Falha ao gerar embedding com o modelo ${this.model}`,
        stack,
      );
      throw new Error('Não foi possível gerar o embedding da memória');
    }
  }
}
