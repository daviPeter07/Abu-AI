import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';
import { ConversationContextWindowService } from './conversation-context-window.service';
import { ConversationsService } from './conversations.service';
import { CONVERSATION_MESSAGE_REPOSITORY } from './repositories/conversation-message.repository';
import { PrismaConversationMessageRepository } from './repositories/prisma-conversation-message.repository';

@Module({
  imports: [AiModule, DatabaseModule],
  providers: [
    ConversationsService,
    ConversationContextWindowService,
    {
      provide: CONVERSATION_MESSAGE_REPOSITORY,
      useClass: PrismaConversationMessageRepository,
    },
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
