import { Test } from '@nestjs/testing';
import { AiService } from '../ai/ai.service';
import type { AiMessage } from '../ai/contracts/ai-provider.contract';
import type { GenerateConversationReplyInput } from './conversation-message.contract';
import { ConversationContextWindowService } from './conversation-context-window.service';
import { ConversationsService } from './conversations.service';

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

  beforeEach(async () => {
    generateResponse.mockReset();
    buildMessages.mockReset();

    generateResponse.mockResolvedValue('Resposta do Abu');

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
      ],
    }).compile();

    conversationsService = moduleRef.get(ConversationsService);
  });

  it('should generate a response using the managed context window', async () => {
    const input: GenerateConversationReplyInput = {
      username: 'Davi',
      content: 'Qual é meu nome?',
      recentMessages: [
        {
          role: 'user',
          username: 'Davi',
          content: 'Meu nome é Davi.',
        },
      ],
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

    expect(response).toBe('Resposta do Abu');

    expect(buildMessages).toHaveBeenCalledWith(input);

    expect(generateResponse).toHaveBeenCalledWith({
      messages,
    });
  });
});
