import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { ABU_SYSTEM_PROMPT } from '../ai/prompts/abu-system-prompt';

export interface GenerateConversationReplyInput {
  content: string;
  username: string;
}

@Injectable()
export class ConversationsService {
  constructor(private readonly aiService: AiService) {}

  generateReply(input: GenerateConversationReplyInput): Promise<string> {
    return this.aiService.generateResponse({
      messages: [
        {
          role: 'system',
          content: ABU_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            `Nome do usuário no Discord: ${input.username}`,
            '',
            input.content,
          ].join('\n'),
        },
      ],
    });
  }
}
