import type { Message } from 'discord.js';
import { mapDiscordConversationMessage } from './discord-conversation-message.mapper';

describe('mapDiscordConversationMessage', () => {
  it('should map the identifiers, author, date and effective Discord content', () => {
    const createdAt = new Date('2026-08-04T12:00:01.000Z');
    const message = {
      id: 'sent-message-id',
      guildId: 'guild-id',
      channelId: 'channel-id',
      author: {
        id: 'bot-id',
        username: 'abu-bot',
      },
      member: {
        displayName: 'Abu',
      },
      content: 'Resposta efetivamente enviada pelo Discord',
      createdAt,
    } as unknown as Message<true>;

    expect(
      mapDiscordConversationMessage(message, 'ASSISTANT', message.content),
    ).toEqual({
      discordMessageId: 'sent-message-id',
      guildId: 'guild-id',
      channelId: 'channel-id',
      authorId: 'bot-id',
      authorName: 'Abu',
      role: 'ASSISTANT',
      content: 'Resposta efetivamente enviada pelo Discord',
      discordCreatedAt: createdAt,
    });
  });
});
