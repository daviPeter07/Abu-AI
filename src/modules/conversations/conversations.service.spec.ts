import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AiService } from '../ai/ai.service';
import type { AiMessage } from '../ai/contracts/ai-provider.contract';
import {
  DISCORD_USER_REPOSITORY,
  type DiscordUserRepository,
} from '../discord-users/repositories/discord-user.repository';
import { MemoryService } from '../memory/memory.service';
import { MemorySearchService } from '../memory/memory-search.service';
import type {
  ConversationMessage,
  GenerateConversationReplyInput,
  PersistConversationMessageInput,
  ProcessConversationMessageInput,
} from './conversation-message.contract';
import { ConversationContextWindowService } from './conversation-context-window.service';
import { ConversationsService } from './conversations.service';
import {
  CONVERSATION_MESSAGE_REPOSITORY,
  type ConversationMessageRepository,
} from './repositories/conversation-message.repository';

describe('ConversationsService', () => {
  let conversationsService: ConversationsService;

  const generateResponse = jest.fn<
    ReturnType<AiService['generateResponse']>,
    Parameters<AiService['generateResponse']>
  >();

  const buildMessages = jest.fn<
    ReturnType<ConversationContextWindowService['buildMessages']>,
    Parameters<ConversationContextWindowService['buildMessages']>
  >();

  const createIfNotExists = jest.fn<
    ReturnType<ConversationMessageRepository['createIfNotExists']>,
    Parameters<ConversationMessageRepository['createIfNotExists']>
  >();

  const findRecentByChannel = jest.fn<
    ReturnType<ConversationMessageRepository['findRecentByChannel']>,
    Parameters<ConversationMessageRepository['findRecentByChannel']>
  >();

  const upsertDiscordUser = jest.fn<
    ReturnType<DiscordUserRepository['upsert']>,
    Parameters<DiscordUserRepository['upsert']>
  >();

  const getOrThrow = jest.fn().mockReturnValue(50);
  const extractFromMessage = jest.fn();
  const searchMemories = jest.fn();
  const sendReply = jest.fn<
    Promise<PersistConversationMessageInput>,
    [string]
  >();

  const userMessage: PersistConversationMessageInput = {
    discordMessageId: 'user-message-id',
    guildId: 'guild-id',
    channelId: 'channel-id',
    authorId: 'user-id',
    authorUsername: 'davi',
    authorName: 'Davi',
    role: 'USER',
    content: 'Qual é meu nome?',
    discordCreatedAt: new Date('2026-08-04T12:00:00.000Z'),
  };

  const assistantMessage: PersistConversationMessageInput = {
    discordMessageId: 'assistant-message-id',
    guildId: 'guild-id',
    channelId: 'channel-id',
    authorId: 'bot-id',
    authorUsername: 'abu-bot',
    authorName: 'Abu',
    role: 'ASSISTANT',
    content: 'Seu nome é Davi.',
    discordCreatedAt: new Date('2026-08-04T12:00:01.000Z'),
  };

  const recentMessages: ConversationMessage[] = [
    {
      role: 'user',
      username: 'Davi',
      content: 'Meu nome é Davi.',
    },
  ];

  beforeEach(async () => {
    generateResponse.mockReset();
    buildMessages.mockReset();
    createIfNotExists.mockReset();
    findRecentByChannel.mockReset();
    upsertDiscordUser.mockReset();
    getOrThrow.mockReset();
    extractFromMessage.mockReset();
    searchMemories.mockReset();
    sendReply.mockReset();

    generateResponse.mockResolvedValue('Seu nome é Davi.');
    createIfNotExists.mockResolvedValue(true);
    findRecentByChannel.mockResolvedValue(recentMessages);
    upsertDiscordUser.mockResolvedValue({
      id: 'internal-user-id',
      discordUserId: 'user-id',
      username: 'davi',
      displayName: 'Davi',
      firstSeenAt: userMessage.discordCreatedAt,
      lastSeenAt: userMessage.discordCreatedAt,
      createdAt: userMessage.discordCreatedAt,
      updatedAt: userMessage.discordCreatedAt,
    });
    getOrThrow.mockReturnValue(50);
    sendReply.mockResolvedValue(assistantMessage);
    extractFromMessage.mockResolvedValue(undefined);
    searchMemories.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: AiService,
          useValue: {
            generateResponse,
          },
        },
        {
          provide: ConversationContextWindowService,
          useValue: {
            buildMessages,
          },
        },
        {
          provide: CONVERSATION_MESSAGE_REPOSITORY,
          useValue: {
            createIfNotExists,
            findRecentByChannel,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow,
          },
        },
        {
          provide: DISCORD_USER_REPOSITORY,
          useValue: {
            upsert: upsertDiscordUser,
          },
        },
        {
          provide: MemoryService,
          useValue: {
            extractFromMessage,
          },
        },
        {
          provide: MemorySearchService,
          useValue: {
            search: searchMemories,
          },
        },
      ],
    }).compile();

    conversationsService = moduleRef.get(ConversationsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should generate a response using the managed context window', async () => {
    const input: GenerateConversationReplyInput = {
      username: 'Davi',
      content: 'Qual é meu nome?',
      recentMessages,
    };

    const messages: AiMessage[] = [
      {
        role: 'system',
        content: 'System prompt',
      },
      {
        role: 'user',
        content: 'Meu nome é Davi.',
      },
      {
        role: 'user',
        content: 'Qual é meu nome?',
      },
    ];

    buildMessages.mockReturnValue(messages);

    const response = await conversationsService.generateReply(input);

    expect(response).toBe('Seu nome é Davi.');
    expect(buildMessages).toHaveBeenCalledWith(input);
    expect(generateResponse).toHaveBeenCalledWith({ messages });
  });

  it('should persist messages and load recent context from the same channel', async () => {
    const input = createProcessInput();

    await conversationsService.processMessage(input);

    expect(upsertDiscordUser).toHaveBeenNthCalledWith(1, {
      discordUserId: 'user-id',
      username: 'davi',
      displayName: 'Davi',
      seenAt: userMessage.discordCreatedAt,
    });
    expect(createIfNotExists).toHaveBeenNthCalledWith(1, userMessage);
    expect(findRecentByChannel).toHaveBeenCalledWith({
      guildId: 'guild-id',
      channelId: 'channel-id',
      excludeDiscordMessageId: 'user-message-id',
      beforeDiscordCreatedAt: userMessage.discordCreatedAt,
      limit: 50,
    });
    expect(buildMessages).toHaveBeenCalledWith({
      content: userMessage.content,
      username: userMessage.authorName,
      recentMessages,
      relevantMemories: [],
    });
    expect(sendReply).toHaveBeenCalledWith('Seu nome é Davi.');
    expect(upsertDiscordUser).toHaveBeenNthCalledWith(2, {
      discordUserId: 'bot-id',
      username: 'abu-bot',
      displayName: 'Abu',
      seenAt: assistantMessage.discordCreatedAt,
    });
    expect(createIfNotExists).toHaveBeenNthCalledWith(2, assistantMessage);
    expect(upsertDiscordUser.mock.invocationCallOrder[0]).toBeLessThan(
      createIfNotExists.mock.invocationCallOrder[0],
    );
    expect(createIfNotExists.mock.invocationCallOrder[0]).toBeLessThan(
      findRecentByChannel.mock.invocationCallOrder[0],
    );
    expect(getOrThrow).toHaveBeenCalledWith(
      'app.ai.contextCandidateMessagesLimit',
    );
    expect(extractFromMessage).toHaveBeenCalledWith({
      discordMessageId: userMessage.discordMessageId,
      guildId: userMessage.guildId,
      authorDiscordUserId: userMessage.authorId,
      authorName: userMessage.authorName,
      content: userMessage.content,
      discordCreatedAt: userMessage.discordCreatedAt,
    });
  });

  it('should ignore a duplicated Discord event', async () => {
    createIfNotExists.mockResolvedValue(false);

    await conversationsService.processMessage(createProcessInput());

    expect(createIfNotExists).toHaveBeenCalledTimes(1);
    expect(findRecentByChannel).not.toHaveBeenCalled();
    expect(generateResponse).not.toHaveBeenCalled();
    expect(sendReply).not.toHaveBeenCalled();
  });

  it('should stop when updating the user profile fails', async () => {
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    upsertDiscordUser.mockRejectedValue(new Error('Database unavailable'));

    await conversationsService.processMessage(createProcessInput());

    expect(createIfNotExists).not.toHaveBeenCalled();
    expect(findRecentByChannel).not.toHaveBeenCalled();
    expect(sendReply).not.toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalled();
  });

  it('should wait for a successful retry when persisting the user message fails', async () => {
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    createIfNotExists
      .mockRejectedValueOnce(new Error('Database unavailable'))
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    await conversationsService.processMessage(createProcessInput());
    await conversationsService.processMessage(createProcessInput());

    expect(findRecentByChannel).toHaveBeenCalledTimes(1);
    expect(sendReply).toHaveBeenCalledWith('Seu nome é Davi.');
    expect(createIfNotExists).toHaveBeenNthCalledWith(3, assistantMessage);
    expect(loggerError).toHaveBeenCalled();
  });

  it('should not send a reply when AI generation fails', async () => {
    buildMessages.mockReturnValue([]);
    generateResponse.mockRejectedValue(new Error('Provider unavailable'));

    await expect(
      conversationsService.processMessage(createProcessInput()),
    ).rejects.toThrow('Provider unavailable');

    expect(createIfNotExists).toHaveBeenCalledTimes(1);
    expect(sendReply).not.toHaveBeenCalled();
  });

  it('should not generate a reply when loading context fails', async () => {
    findRecentByChannel.mockRejectedValue(new Error('Database unavailable'));

    await expect(
      conversationsService.processMessage(createProcessInput()),
    ).rejects.toThrow('Database unavailable');

    expect(generateResponse).not.toHaveBeenCalled();
    expect(sendReply).not.toHaveBeenCalled();
  });

  it('should not persist an assistant message when sending fails', async () => {
    sendReply.mockRejectedValue(new Error('Discord unavailable'));

    await expect(
      conversationsService.processMessage(createProcessInput()),
    ).rejects.toThrow('Discord unavailable');

    expect(createIfNotExists).toHaveBeenCalledTimes(1);
  });

  it('should keep the delivered reply when its persistence fails', async () => {
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    createIfNotExists
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('Database unavailable'));

    await expect(
      conversationsService.processMessage(createProcessInput()),
    ).resolves.toBeUndefined();

    expect(sendReply).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalled();
  });

  it('should keep the delivered reply when updating the bot profile fails', async () => {
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    upsertDiscordUser
      .mockResolvedValueOnce({
        id: 'internal-user-id',
        discordUserId: 'user-id',
        username: 'davi',
        displayName: 'Davi',
        firstSeenAt: userMessage.discordCreatedAt,
        lastSeenAt: userMessage.discordCreatedAt,
        createdAt: userMessage.discordCreatedAt,
        updatedAt: userMessage.discordCreatedAt,
      })
      .mockRejectedValueOnce(new Error('Database unavailable'));

    await expect(
      conversationsService.processMessage(createProcessInput()),
    ).resolves.toBeUndefined();

    expect(sendReply).toHaveBeenCalledTimes(1);
    expect(createIfNotExists).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalled();
  });

  function createProcessInput(): ProcessConversationMessageInput {
    return {
      message: userMessage,
      sendReply,
    };
  }
});
