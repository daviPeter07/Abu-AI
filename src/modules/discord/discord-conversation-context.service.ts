import { Injectable } from '@nestjs/common';
import type { Message } from 'discord.js';
import type { ConversationMessage } from '../conversations/conversation-message.contract';

@Injectable()
export class DiscordConversationContextService {
  private static readonly CONTEXT_CANDIDATE_MESSAGES_LIMIT = 50;

  async getRecentMessages(
    message: Message<true>,
    botUserId: string,
  ): Promise<ConversationMessage[]> {
    const messages = await message.channel.messages.fetch({
      before: message.id,
      limit: DiscordConversationContextService.CONTEXT_CANDIDATE_MESSAGES_LIMIT,
      cache: false,
    });

    return [...messages.values()]
      .sort((left, right) => left.createdTimestamp - right.createdTimestamp)
      .flatMap((recentMessage): ConversationMessage[] => {
        const content = recentMessage.content.trim();

        if (!content || recentMessage.system) {
          return [];
        }

        if (recentMessage.author.id === botUserId) {
          return [
            {
              role: 'assistant',
              content,
            },
          ];
        }

        if (recentMessage.author.bot) {
          return [];
        }

        return [
          {
            role: 'user',
            username:
              recentMessage.member?.displayName ??
              recentMessage.author.username,
            content,
          },
        ];
      });
  }
}
