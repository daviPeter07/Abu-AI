import type { ConfigService } from '@nestjs/config';
import { ABU_SYSTEM_PROMPT } from '../ai/prompts/abu-system-prompt';
import type { GenerateConversationReplyInput } from './conversation-message.contract';
import { ConversationContextWindowService } from './conversation-context-window.service';

describe('ConversationContextWindowService', () => {
  const createService = (
    maxCharacters: number,
  ): ConversationContextWindowService => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue(maxCharacters),
    } as unknown as ConfigService;

    return new ConversationContextWindowService(configService);
  };

  const createUserContent = (username: string, content: string): string =>
    [`Nome do usuário no Discord: ${username}`, '', content].join('\n');

  it('should keep recent messages when they fit the context window', () => {
    const service = createService(20_000);

    const messages = service.buildMessages({
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
      ],
    });

    expect(messages).toEqual([
      {
        role: 'system',
        content: ABU_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: createUserContent('Davi', 'Meu nome é Davi.'),
      },
      {
        role: 'assistant',
        content: 'Prazer em conhecer você.',
      },
      {
        role: 'user',
        content: createUserContent('Davi', 'Qual é meu nome?'),
      },
    ]);
  });

  it('should remove older messages when the context limit is reached', () => {
    const currentMessage = createUserContent('Davi', 'Mensagem atual');

    const newestMessage = createUserContent('Ana', 'Mensagem mais recente');

    const maxCharacters =
      ABU_SYSTEM_PROMPT.length + currentMessage.length + newestMessage.length;

    const service = createService(maxCharacters);

    const messages = service.buildMessages({
      username: 'Davi',
      content: 'Mensagem atual',
      recentMessages: [
        {
          role: 'user',
          username: 'Carlos',
          content: 'Mensagem mais antiga',
        },
        {
          role: 'user',
          username: 'Ana',
          content: 'Mensagem mais recente',
        },
      ],
    });

    expect(messages).toEqual([
      {
        role: 'system',
        content: ABU_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: newestMessage,
      },
      {
        role: 'user',
        content: currentMessage,
      },
    ]);
  });

  it('should skip an oversized message and keep other messages that fit', () => {
    const olderMessage = createUserContent('Davi', 'Mensagem curta antiga');

    const newestMessage = {
      role: 'assistant' as const,
      content: 'Mensagem curta recente',
    };

    const currentMessage = createUserContent('Davi', 'Mensagem atual');

    const maxCharacters =
      ABU_SYSTEM_PROMPT.length +
      olderMessage.length +
      newestMessage.content.length +
      currentMessage.length;

    const service = createService(maxCharacters);

    const messages = service.buildMessages({
      username: 'Davi',
      content: 'Mensagem atual',
      recentMessages: [
        {
          role: 'user',
          username: 'Davi',
          content: 'Mensagem curta antiga',
        },
        {
          role: 'assistant',
          content: 'x'.repeat(5_000),
        },
        newestMessage,
      ],
    });

    expect(messages).toEqual([
      {
        role: 'system',
        content: ABU_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: olderMessage,
      },
      newestMessage,
      {
        role: 'user',
        content: currentMessage,
      },
    ]);
  });

  it('should always keep the system prompt and current message', () => {
    const service = createService(1);

    const input: GenerateConversationReplyInput = {
      username: 'Davi',
      content: 'Mensagem atual',
      recentMessages: [
        {
          role: 'assistant',
          content: 'Mensagem anterior',
        },
      ],
    };

    const messages = service.buildMessages(input);

    expect(messages).toEqual([
      {
        role: 'system',
        content: ABU_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: createUserContent('Davi', 'Mensagem atual'),
      },
    ]);
  });
});
