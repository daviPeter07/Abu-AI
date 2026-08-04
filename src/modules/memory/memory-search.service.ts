import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  MemoryRecord,
  SearchRelevantMemoriesInput,
} from './contracts/memory.contract';
import { EmbeddingService } from './embedding.service';
import {
  MEMORY_REPOSITORY,
  type MemoryRepository,
} from './repositories/memory.repository';

@Injectable()
export class MemorySearchService {
  private readonly similarityThreshold: number;
  private readonly searchLimit: number;
  private readonly maxCharacters: number;
  private readonly maxItems: number;

  constructor(
    @Inject(MEMORY_REPOSITORY)
    private readonly memoryRepository: MemoryRepository,
    private readonly embeddingService: EmbeddingService,
    configService: ConfigService,
  ) {
    this.similarityThreshold = configService.getOrThrow<number>(
      'app.memory.similarityThreshold',
    );
    this.searchLimit = configService.getOrThrow<number>(
      'app.memory.searchLimit',
    );
    this.maxCharacters = configService.getOrThrow<number>(
      'app.ai.memoryMaxCharacters',
    );
    this.maxItems = configService.getOrThrow<number>('app.ai.memoryMaxItems');
  }

  async search(input: SearchRelevantMemoriesInput): Promise<MemoryRecord[]> {
    if (!(await this.memoryRepository.isMemoryEnabled(input.discordUserId))) {
      return [];
    }

    const queryEmbedding = await this.embeddingService.generate(
      input.query,
      input.correlationId,
    );
    const candidates = await this.memoryRepository.findActiveCandidates({
      discordUserId: input.discordUserId,
      guildId: input.guildId,
    });
    const ranked = candidates
      .filter((memory) => memory.embedding.length === queryEmbedding.length)
      .map((memory) => ({
        memory,
        similarity: this.cosineSimilarity(queryEmbedding, memory.embedding),
      }))
      .filter(({ similarity }) => similarity >= this.similarityThreshold)
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, Math.min(this.searchLimit, this.maxItems));
    const selected: MemoryRecord[] = [];
    let characters = 0;

    for (const { memory } of ranked) {
      if (characters + memory.content.length > this.maxCharacters) {
        continue;
      }

      selected.push(memory);
      characters += memory.content.length;
    }

    return selected;
  }

  private cosineSimilarity(left: number[], right: number[]): number {
    let dotProduct = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;

    for (let index = 0; index < left.length; index += 1) {
      dotProduct += left[index] * right[index];
      leftMagnitude += left[index] ** 2;
      rightMagnitude += right[index] ** 2;
    }

    if (leftMagnitude === 0 || rightMagnitude === 0) {
      return 0;
    }

    return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude);
  }
}
