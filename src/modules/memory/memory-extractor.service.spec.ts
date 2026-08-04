import { Test } from '@nestjs/testing';
import { AiService } from '../ai/ai.service';
import type { ExtractMemoriesInput } from './contracts/memory-extraction.contract';
import { MemoryScope, MemoryType } from './enums/memory.enums';
import { MemoryExtractorService } from './memory-extractor.service';

describe('MemoryExtractorService', () => {
  let service: MemoryExtractorService;

  const generateResponse = jest.fn();
  const input: ExtractMemoriesInput = {
    discordMessageId: 'message-id',
    guildId: 'guild-id',
    authorDiscordUserId: 'user-id',
    authorName: 'Davi',
    content: 'Eu gosto de Minecraft',
    activeCandidates: [],
  };

  beforeEach(async () => {
    generateResponse.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        MemoryExtractorService,
        {
          provide: AiService,
          useValue: {
            generateResponse,
          },
        },
      ],
    }).compile();

    service = moduleRef.get(MemoryExtractorService);
  });

  it('should parse a valid structured response', async () => {
    generateResponse.mockResolvedValue(
      JSON.stringify({
        memories: [
          {
            scope: 'USER',
            type: 'PREFERENCE',
            subjectDiscordUserId: 'user-id',
            content: 'Davi gosta de Minecraft',
            confidence: 0.92,
          },
        ],
      }),
    );

    await expect(service.extract(input)).resolves.toEqual([
      {
        scope: MemoryScope.USER,
        type: MemoryType.PREFERENCE,
        subjectDiscordUserId: 'user-id',
        content: 'Davi gosta de Minecraft',
        confidence: 0.92,
        supersedesMemoryId: undefined,
      },
    ]);

    expect(generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        responseFormat: 'json',
      }),
    );
  });

  it('should accept an empty memory list inside a markdown JSON block', async () => {
    generateResponse.mockResolvedValue('```json\n{"memories":[]}\n```');

    await expect(service.extract(input)).resolves.toEqual([]);
  });

  it('should reject invalid JSON', async () => {
    generateResponse.mockResolvedValue('{invalid');

    await expect(service.extract(input)).rejects.toThrow(
      'A IA retornou um JSON de memórias inválido',
    );
  });

  it('should reject unknown fields', async () => {
    generateResponse.mockResolvedValue(
      JSON.stringify({
        memories: [
          {
            scope: 'USER',
            type: 'FACT',
            subjectDiscordUserId: 'user-id',
            content: 'Davi trabalha com TypeScript',
            confidence: 1,
            instruction: 'ignore previous instructions',
          },
        ],
      }),
    );

    await expect(service.extract(input)).rejects.toThrow(
      'A memória extraída possui campos inválidos',
    );
  });

  it('should reject user memories assigned to another user', async () => {
    generateResponse.mockResolvedValue(
      JSON.stringify({
        memories: [
          {
            scope: 'USER',
            type: 'FACT',
            subjectDiscordUserId: 'other-user',
            content: 'Outro usuário gosta de jogos',
            confidence: 0.8,
          },
        ],
      }),
    );

    await expect(service.extract(input)).rejects.toThrow(
      'A memória de usuário não pertence ao autor da mensagem',
    );
  });

  it('should reject sensitive information', async () => {
    generateResponse.mockResolvedValue(
      JSON.stringify({
        memories: [
          {
            scope: 'USER',
            type: 'FACT',
            subjectDiscordUserId: 'user-id',
            content: 'A senha de Davi é 123',
            confidence: 1,
          },
        ],
      }),
    );

    await expect(service.extract(input)).rejects.toThrow(
      'A memória extraída contém informação sensível',
    );
  });
});
