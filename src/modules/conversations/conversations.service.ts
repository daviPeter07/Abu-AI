import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

export interface GenerateConversationReplyInput {
  content: string;
  username: string;
}

@Injectable()
export class ConversationsService {
  constructor(private readonly aiService: AiService) { }

  generateReply(
    input: GenerateConversationReplyInput,
  ): Promise<string> {
    return this.aiService.generateResponse({
      message: input.content,
      username: input.username,
    });
  }
}