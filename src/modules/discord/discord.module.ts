import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { DiscordClientService } from './discord-client.service';
import { DiscordConversationContextService } from './discord-conversation-context.service';

@Module({
  imports: [ConversationsModule],
  providers: [DiscordClientService, DiscordConversationContextService],
})
export class DiscordModule {}
