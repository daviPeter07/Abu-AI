import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [AiModule],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
