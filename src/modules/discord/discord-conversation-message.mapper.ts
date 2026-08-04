import type { Message } from 'discord.js';
import type {
  PersistConversationMessageInput,
  PersistedConversationMessageRole,
} from '../conversations/conversation-message.contract';

export function mapDiscordConversationMessage(
  message: Message<true>,
  role: PersistedConversationMessageRole,
  content: string,
): PersistConversationMessageInput {
  return {
    discordMessageId: message.id,
    guildId: message.guildId,
    channelId: message.channelId,
    authorId: message.author.id,
    authorName: message.member?.displayName ?? message.author.username,
    role,
    content,
    discordCreatedAt: message.createdAt,
  };
}
