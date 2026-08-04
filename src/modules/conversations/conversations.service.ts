import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import type { GenerateConversationReplyInput } from './conversation-message.contract';
import { ConversationContextWindowService } from './conversation-context-window.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly aiService: AiService,
    private readonly contextWindowService: ConversationContextWindowService,
  ) {}

  generateReply(input: GenerateConversationReplyInput): Promise<string> {
    const messages = this.contextWindowService.buildMessages(input);

    return this.aiService.generateResponse({
      messages,
    });
  }
}
