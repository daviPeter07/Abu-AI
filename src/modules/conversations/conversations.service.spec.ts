import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AiService } from '../ai/ai.service';
import type { AiMessage } from '../ai/contracts/ai-provider.contract';
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

  const loadRecentMessages = jest.fn<Promise<ConversationMessage[]>, []>();
  const sendReply = jest.fn<
    Promise<PersistConversationMessageInput>,
    [string]
  >();

  const userMessage: PersistConversationMessageInput = {
    discordMessageId: 'user-message-id',
    guildId: 'guild-id',
    channelId: 'channel-id',
    authorId: 'user-id',
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
    loadRecentMessages.mockReset();
    sendReply.mockReset();

    generateResponse.mockResolvedValue('Seu nome é Davi.');
    createIfNotExists.mockResolvedValue(true);
    loadRecentMessages.mockResolvedValue(recentMessages);
    sendReply.mockResolvedValue(assistantMessage);

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

  it('should persist the user message and the sent assistant message', async () => {
    const input = createProcessInput();

    await conversationsService.processMessage(input);

    expect(createIfNotExists).toHaveBeenNthCalledWith(1, userMessage);
    expect(loadRecentMessages).toHaveBeenCalledTimes(1);
    expect(sendReply).toHaveBeenCalledWith('Seu nome é Davi.');
    expect(createIfNotExists).toHaveBeenNthCalledWith(2, assistantMessage);
  });

  it('should ignore a duplicated Discord event', async () => {
    createIfNotExists.mockResolvedValue(false);

    await conversationsService.processMessage(createProcessInput());

    expect(createIfNotExists).toHaveBeenCalledTimes(1);
    expect(loadRecentMessages).not.toHaveBeenCalled();
    expect(generateResponse).not.toHaveBeenCalled();
    expect(sendReply).not.toHaveBeenCalled();
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

    expect(loadRecentMessages).toHaveBeenCalledTimes(1);
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

  function createProcessInput(): ProcessConversationMessageInput {
    return {
      message: userMessage,
      loadRecentMessages,
      sendReply,
    };
  }
});
