import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import type { PersistConversationMessageInput } from '../conversation-message.contract';
import { PrismaConversationMessageRepository } from './prisma-conversation-message.repository';

describe('PrismaConversationMessageRepository', () => {
  let repository: PrismaConversationMessageRepository;

  const createMany = jest.fn();

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

    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaConversationMessageRepository,
        {
          provide: PrismaService,
          useValue: {
            conversationMessage: {
              createMany,
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
});
