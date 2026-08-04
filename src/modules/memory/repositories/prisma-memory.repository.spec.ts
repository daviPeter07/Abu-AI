import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import type { MemoryRecord } from '../contracts/memory.contract';
import { MemoryScope, MemoryStatus, MemoryType } from '../enums/memory.enums';
import { PrismaMemoryRepository } from './prisma-memory.repository';

describe('PrismaMemoryRepository', () => {
  let repository: PrismaMemoryRepository;

  const create = jest.fn();
  const findMany = jest.fn();
  const now = new Date('2026-08-04T12:00:00.000Z');
  const selectedMemory = {
    id: 'memory-id',
    scope: MemoryScope.USER,
    type: MemoryType.FACT,
    content: 'Davi trabalha com TypeScript',
    normalizedContent: 'davi trabalha com typescript',
    subjectUser: {
      discordUserId: 'discord-user-id',
    },
    guildId: null,
    confidence: 0.95,
    status: MemoryStatus.ACTIVE,
    sourceMessage: {
      discordMessageId: 'discord-message-id',
    },
    createdAt: now,
    updatedAt: now,
    lastConfirmedAt: null,
  };
  const expectedMemory: MemoryRecord = {
    id: 'memory-id',
    scope: MemoryScope.USER,
    type: MemoryType.FACT,
    content: 'Davi trabalha com TypeScript',
    normalizedContent: 'davi trabalha com typescript',
    subjectDiscordUserId: 'discord-user-id',
    guildId: null,
    confidence: 0.95,
    status: MemoryStatus.ACTIVE,
    sourceDiscordMessageId: 'discord-message-id',
    createdAt: now,
    updatedAt: now,
    lastConfirmedAt: null,
  };

  beforeEach(async () => {
    create.mockReset();
    findMany.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaMemoryRepository,
        {
          provide: PrismaService,
          useValue: {
            memory: {
              create,
              findMany,
            },
          },
        },
      ],
    }).compile();

    repository = moduleRef.get(PrismaMemoryRepository);
  });

  it('should create a memory using external Discord identifiers', async () => {
    create.mockResolvedValue(selectedMemory);

    await expect(
      repository.create({
        scope: MemoryScope.USER,
        type: MemoryType.FACT,
        content: 'Davi trabalha com TypeScript',
        normalizedContent: 'davi trabalha com typescript',
        subjectDiscordUserId: 'discord-user-id',
        confidence: 0.95,
        status: MemoryStatus.ACTIVE,
        sourceDiscordMessageId: 'discord-message-id',
      }),
    ).resolves.toEqual(expectedMemory);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          scope: MemoryScope.USER,
          type: MemoryType.FACT,
          content: 'Davi trabalha com TypeScript',
          normalizedContent: 'davi trabalha com typescript',
          guildId: undefined,
          confidence: 0.95,
          status: MemoryStatus.ACTIVE,
          lastConfirmedAt: undefined,
          subjectUser: {
            connect: {
              discordUserId: 'discord-user-id',
            },
          },
          sourceMessage: {
            connect: {
              discordMessageId: 'discord-message-id',
            },
          },
        },
      }),
    );
  });

  it('should find user memories ordered by creation date', async () => {
    findMany.mockResolvedValue([selectedMemory]);

    await expect(repository.findByUser('discord-user-id')).resolves.toEqual([
      expectedMemory,
    ]);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          scope: 'USER',
          subjectUser: {
            discordUserId: 'discord-user-id',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    );
  });

  it('should find group memories isolated by guild', async () => {
    findMany.mockResolvedValue([]);

    await expect(repository.findByGroup('guild-id')).resolves.toEqual([]);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          scope: 'GROUP',
          guildId: 'guild-id',
        },
      }),
    );
  });
});
