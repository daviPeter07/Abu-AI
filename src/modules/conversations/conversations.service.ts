import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import type { AiMessage } from '../ai/contracts/ai-provider.contract';
import { ABU_SYSTEM_PROMPT } from '../ai/prompts/abu-system-prompt';
import {
  ConversationMessage,
  GenerateConversationReplyInput,
} from './conversation-message.contract';

@Injectable()
export class ConversationsService {
  constructor(private readonly aiService: AiService) {}

  generateReply(input: GenerateConversationReplyInput): Promise<string> {
    const messages: AiMessage[] = [
      {
        role: 'system',
        content: ABU_SYSTEM_PROMPT,
      },
      ...input.recentMessages.map((message) => this.toAiMessage(message)),
      this.createUserMessage(input.username, input.content),
    ];

    return this.aiService.generateResponse({
      messages,
    });
  }

  private toAiMessage(message: ConversationMessage): AiMessage {
    if (message.role === 'assistant') {
      return {
        role: 'assistant',
        content: message.content,
      };
    }

    return this.createUserMessage(message.username, message.content);
  }

  private createUserMessage(username: string, content: string): AiMessage {
    return {
      role: 'user',
      content: [`Nome do usuário no Discord: ${username}`, '', content].join(
        '\n',
      ),
    };
  }
}
