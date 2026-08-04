import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';
import { DiscordUsersModule } from '../discord-users/discord-users.module';
import { MemoryModule } from '../memory/memory.module';
import { ObservabilityModule } from '../observability/observability.module';
import { ConversationContextWindowService } from './conversation-context-window.service';
import { ConversationsService } from './conversations.service';
import { CONVERSATION_MESSAGE_REPOSITORY } from './repositories/conversation-message.repository';
import { PrismaConversationMessageRepository } from './repositories/prisma-conversation-message.repository';

@Module({
  imports: [
    AiModule,
    DatabaseModule,
    DiscordUsersModule,
    MemoryModule,
    ObservabilityModule,
  ],
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
