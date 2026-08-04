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

  it('should include Abu personality and user message', async () => {
    const response = await conversationsService.generateReply({
      username: 'Davi',
      content: 'Quem é você?',
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
            'Quem é você?',
          ].join('\n'),
        },
      ],
    });
  });
});
