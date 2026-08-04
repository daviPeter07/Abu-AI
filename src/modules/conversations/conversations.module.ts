import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ConversationContextWindowService } from './conversation-context-window.service';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [AiModule],
  providers: [ConversationsService, ConversationContextWindowService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
