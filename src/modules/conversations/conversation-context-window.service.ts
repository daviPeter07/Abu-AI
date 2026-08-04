import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiMessage } from '../ai/contracts/ai-provider.contract';
import { ABU_SYSTEM_PROMPT } from '../ai/prompts/abu-system-prompt';
import type {
  ConversationMessage,
  GenerateConversationReplyInput,
} from './conversation-message.contract';

@Injectable()
export class ConversationContextWindowService {
  private readonly maxCharacters: number;

  constructor(private readonly configService: ConfigService) {
    this.maxCharacters = this.configService.getOrThrow<number>(
      'app.ai.contextMaxCharacters',
    );
  }

  buildMessages(input: GenerateConversationReplyInput): AiMessage[] {
    const systemMessage: AiMessage = {
      role: 'system',
      content: ABU_SYSTEM_PROMPT,
    };

    const currentMessage = this.createUserMessage(
      input.username,
      input.content,
    );

    const mandatoryCharacters =
      this.getMessageCharacters(systemMessage) +
      this.getMessageCharacters(currentMessage);

    let availableCharacters = Math.max(
      this.maxCharacters - mandatoryCharacters,
      0,
    );

    const selectedMessages: AiMessage[] = [];

    for (let index = input.recentMessages.length - 1; index >= 0; index--) {
      const recentMessage = input.recentMessages[index];
      const aiMessage = this.toAiMessage(recentMessage);
      const messageCharacters = this.getMessageCharacters(aiMessage);

      if (messageCharacters > availableCharacters) {
        continue;
      }

      selectedMessages.unshift(aiMessage);
      availableCharacters -= messageCharacters;
    }

    return [systemMessage, ...selectedMessages, currentMessage];
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

  private getMessageCharacters(message: AiMessage): number {
    return message.content.length;
  }
}
