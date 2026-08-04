import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { MemoryModule } from '../memory/memory.module';
import { DiscordClientService } from './discord-client.service';
import { DiscordMemoryCommandsService } from './discord-memory-commands.service';

@Module({
  imports: [ConversationsModule, MemoryModule],
  providers: [DiscordClientService, DiscordMemoryCommandsService],
})
export class DiscordModule {}
