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
      authorUsername: 'abu-bot',
      authorName: 'Abu',
      role: 'ASSISTANT',
      content: 'Resposta efetivamente enviada pelo Discord',
      discordCreatedAt: createdAt,
    });
  });

  it('should use the username when a display name is unavailable', () => {
    const message = {
      id: 'message-id',
      guildId: 'guild-id',
      channelId: 'channel-id',
      author: {
        id: 'user-id',
        username: 'davi',
      },
      member: null,
      createdAt: new Date('2026-08-04T12:00:00.000Z'),
    } as unknown as Message<true>;

    expect(mapDiscordConversationMessage(message, 'USER', 'Olá')).toEqual(
      expect.objectContaining({
        authorId: 'user-id',
        authorUsername: 'davi',
        authorName: 'davi',
      }),
    );
  });
});
