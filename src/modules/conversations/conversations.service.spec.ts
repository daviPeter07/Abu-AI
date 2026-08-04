import { Test } from '@nestjs/testing';
import { AiService } from '../ai/ai.service';
import { ABU_SYSTEM_PROMPT } from '../ai/prompts/abu-system-prompt';
import { ConversationsService } from './conversations.service';

describe('ConversationsService', () => {
  let conversationsService: ConversationsService;

  const generateResponse = jest.fn<
    ReturnType<AiService['generateResponse']>,
    Parameters<AiService['generateResponse']>
  >();

  beforeEach(async () => {
    generateResponse.mockReset();
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
      ],
    }).compile();

    conversationsService = moduleRef.get(ConversationsService);
  });

  it('should include recent messages before the current message', async () => {
    const response = await conversationsService.generateReply({
      username: 'Davi',
      content: 'Qual é meu nome?',
      recentMessages: [
        {
          role: 'user',
          username: 'Davi',
          content: 'Meu nome é Davi.',
        },
        {
          role: 'assistant',
          content: 'Prazer em conhecer você.',
        },
        {
          role: 'user',
          username: 'Ana',
          content: 'Meu nome é Ana.',
        },
      ],
    });

    expect(response).toBe('Resposta do Abu');

    expect(generateResponse).toHaveBeenCalledWith({
      messages: [
        {
          role: 'system',
          content: ABU_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            'Nome do usuário no Discord: Davi',
            '',
            'Meu nome é Davi.',
          ].join('\n'),
        },
        {
          role: 'assistant',
          content: 'Prazer em conhecer você.',
        },
        {
          role: 'user',
          content: [
            'Nome do usuário no Discord: Ana',
            '',
            'Meu nome é Ana.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            'Nome do usuário no Discord: Davi',
            '',
            'Qual é meu nome?',
          ].join('\n'),
        },
      ],
    });
  });

  it('should generate a reply without recent messages', async () => {
    await conversationsService.generateReply({
      username: 'Davi',
      content: 'Olá',
      recentMessages: [],
    });

    expect(generateResponse).toHaveBeenCalledWith({
      messages: [
        {
          role: 'system',
          content: ABU_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: ['Nome do usuário no Discord: Davi', '', 'Olá'].join('\n'),
        },
      ],
    });
  });
});
