import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { DiscordClientService } from './discord-client.service';

@Module({
  imports: [ConversationsModule],
  providers: [DiscordClientService],
})
export class DiscordModule { }