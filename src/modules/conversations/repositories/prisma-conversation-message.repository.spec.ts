import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import type { PersistConversationMessageInput } from '../conversation-message.contract';
import { PrismaConversationMessageRepository } from './prisma-conversation-message.repository';

describe('PrismaConversationMessageRepository', () => {
  let repository: PrismaConversationMessageRepository;

  const createMany = jest.fn();
  const findMany = jest.fn();

  const message: PersistConversationMessageInput = {
    discordMessageId: 'discord-message-id',
    guildId: 'guild-id',
    channelId: 'channel-id',
    authorId: 'author-id',
    authorName: 'Davi',
    role: 'USER',
    content: 'Olá, Abu!',
    discordCreatedAt: new Date('2026-08-04T12:00:00.000Z'),
  };

  beforeEach(async () => {
    createMany.mockReset();
    findMany.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaConversationMessageRepository,
        {
          provide: PrismaService,
          useValue: {
            conversationMessage: {
              createMany,
              findMany,
            },
          },
        },
      ],
    }).compile();

    repository = moduleRef.get(PrismaConversationMessageRepository);
  });

  it('should create a message that does not exist yet', async () => {
    createMany.mockResolvedValue({ count: 1 });

    await expect(repository.createIfNotExists(message)).resolves.toBe(true);

    expect(createMany).toHaveBeenCalledWith({
      data: message,
      skipDuplicates: true,
    });
  });

  it('should report an existing message as a duplicate', async () => {
    createMany.mockResolvedValue({ count: 0 });

    await expect(repository.createIfNotExists(message)).resolves.toBe(false);
  });

  it('should load the most recent channel messages in chronological order', async () => {
    findMany.mockResolvedValue([
      {
        role: 'ASSISTANT',
        authorName: 'Abu',
        content: 'Mensagem mais recente',
      },
      {
        role: 'USER',
        authorName: 'Davi',
        content: 'Mensagem mais antiga',
      },
    ]);

    await expect(
      repository.findRecentByChannel({
        guildId: 'guild-id',
        channelId: 'channel-id',
        excludeDiscordMessageId: 'current-message-id',
        beforeDiscordCreatedAt: new Date('2026-08-04T12:00:00.000Z'),
        limit: 25,
      }),
    ).resolves.toEqual([
      {
        role: 'user',
        username: 'Davi',
        content: 'Mensagem mais antiga',
      },
      {
        role: 'assistant',
        content: 'Mensagem mais recente',
      },
    ]);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        guildId: 'guild-id',
        channelId: 'channel-id',
        discordMessageId: {
          not: 'current-message-id',
        },
        OR: [
          {
            discordCreatedAt: {
              lt: new Date('2026-08-04T12:00:00.000Z'),
            },
          },
          {
            discordCreatedAt: new Date('2026-08-04T12:00:00.000Z'),
            discordMessageId: {
              lt: 'current-message-id',
            },
          },
        ],
      },
      orderBy: [
        {
          discordCreatedAt: 'desc',
        },
        {
          discordMessageId: 'desc',
        },
      ],
      take: 25,
      select: {
        role: true,
        authorName: true,
        content: true,
      },
    });
  });

  it('should return an empty context when the channel has no previous messages', async () => {
    findMany.mockResolvedValue([]);

    await expect(
      repository.findRecentByChannel({
        guildId: 'guild-id',
        channelId: 'channel-id',
        excludeDiscordMessageId: 'current-message-id',
        beforeDiscordCreatedAt: new Date('2026-08-04T12:00:00.000Z'),
        limit: 50,
      }),
    ).resolves.toEqual([]);
  });
});
