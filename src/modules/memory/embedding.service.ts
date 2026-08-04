import { Inject, Injectable } from '@nestjs/common';
import {
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
} from './contracts/embedding-provider.contract';

@Injectable()
export class EmbeddingService {
  constructor(
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  generate(text: string, correlationId?: string): Promise<number[]> {
    return this.embeddingProvider.generate(text, correlationId);
  }
}
