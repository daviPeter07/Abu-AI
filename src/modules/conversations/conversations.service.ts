import { Inject, Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import type {
  GenerateConversationReplyInput,
  PersistConversationMessageInput,
  ProcessConversationMessageInput,
} from './conversation-message.contract';
import { ConversationContextWindowService } from './conversation-context-window.service';
import {
  CONVERSATION_MESSAGE_REPOSITORY,
  type ConversationMessageRepository,
} from './repositories/conversation-message.repository';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly contextWindowService: ConversationContextWindowService,
    @Inject(CONVERSATION_MESSAGE_REPOSITORY)
    private readonly conversationMessageRepository: ConversationMessageRepository,
  ) {}

  async processMessage(input: ProcessConversationMessageInput): Promise<void> {
    const wasCreated = await this.persistMessage(input.message);

    if (wasCreated !== true) {
      if (wasCreated === false) {
        this.logger.warn(
          `Evento duplicado ignorado para a mensagem ${input.message.discordMessageId}`,
        );
      }

      return;
    }

    const recentMessages = await input.loadRecentMessages();
    const response = await this.generateReply({
      content: input.message.content,
      username: input.message.authorName,
      recentMessages,
    });
    const sentMessage = await input.sendReply(response);

    await this.persistMessage(sentMessage);
  }

  generateReply(input: GenerateConversationReplyInput): Promise<string> {
    const messages = this.contextWindowService.buildMessages(input);

    return this.aiService.generateResponse({
      messages,
    });
  }

  private async persistMessage(
    input: PersistConversationMessageInput,
  ): Promise<boolean | null> {
    try {
      return await this.conversationMessageRepository.createIfNotExists(input);
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);

      this.logger.error(
        `Não foi possível persistir a mensagem ${input.discordMessageId}`,
        stack,
      );

      return null;
    }
  }
}
