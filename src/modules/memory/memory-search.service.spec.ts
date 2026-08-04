import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { MemoryRecord } from './contracts/memory.contract';
import { EmbeddingService } from './embedding.service';
import { MemoryScope, MemoryStatus, MemoryType } from './enums/memory.enums';
import { MemorySearchService } from './memory-search.service';
import { MEMORY_REPOSITORY } from './repositories/memory.repository';

describe('MemorySearchService', () => {
  let service: MemorySearchService;

  const isMemoryEnabled = jest.fn();
  const findActiveCandidates = jest.fn();
  const generate = jest.fn();
  const now = new Date('2026-08-04T12:00:00.000Z');
  const memory = (
    id: string,
    content: string,
    embedding: number[],
  ): MemoryRecord => ({
    id,
    scope: MemoryScope.USER,
    type: MemoryType.FACT,
    content,
    normalizedContent: content.toLowerCase(),
    embedding,
    subjectDiscordUserId: 'user-id',
    guildId: null,
    confidence: 1,
    status: MemoryStatus.ACTIVE,
    sourceDiscordMessageId: null,
    createdAt: now,
    updatedAt: now,
    lastConfirmedAt: now,
  });

  beforeEach(async () => {
    isMemoryEnabled.mockReset().mockResolvedValue(true);
    findActiveCandidates.mockReset();
    generate.mockReset().mockResolvedValue([1, 0]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        MemorySearchService,
        {
          provide: MEMORY_REPOSITORY,
          useValue: { isMemoryEnabled, findActiveCandidates },
        },
        {
          provide: EmbeddingService,
          useValue: { generate },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) =>
              ({
                'app.memory.similarityThreshold': 0.7,
                'app.memory.searchLimit': 10,
                'app.ai.memoryMaxCharacters': 100,
                'app.ai.memoryMaxItems': 2,
              })[key],
          },
        },
      ],
    }).compile();

    service = moduleRef.get(MemorySearchService);
  });

  it('should return relevant memories ordered by cosine similarity', async () => {
    findActiveCandidates.mockResolvedValue([
      memory('partial', 'Parcial', [0.8, 0.6]),
      memory('exact', 'Exata', [1, 0]),
      memory('irrelevant', 'Irrelevante', [0, 1]),
    ]);

    await expect(
      service.search({
        query: 'consulta',
        discordUserId: 'user-id',
        guildId: 'guild-id',
      }),
    ).resolves.toEqual([
      expect.objectContaining({ id: 'exact' }),
      expect.objectContaining({ id: 'partial' }),
    ]);
  });

  it('should not generate embeddings when individual memory is disabled', async () => {
    isMemoryEnabled.mockResolvedValue(false);

    await expect(
      service.search({
        query: 'consulta',
        discordUserId: 'user-id',
        guildId: 'guild-id',
      }),
    ).resolves.toEqual([]);
    expect(generate).not.toHaveBeenCalled();
  });
});
