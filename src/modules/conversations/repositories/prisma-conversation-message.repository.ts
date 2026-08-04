import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  ConversationMessage,
  PersistConversationMessageInput,
} from '../conversation-message.contract';
import type {
  ConversationMessageRepository,
  FindRecentConversationMessagesInput,
} from './conversation-message.repository';

@Injectable()
export class PrismaConversationMessageRepository implements ConversationMessageRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createIfNotExists(
    input: PersistConversationMessageInput,
  ): Promise<boolean> {
    const result = await this.prismaService.conversationMessage.createMany({
      data: input,
      skipDuplicates: true,
    });

    return result.count === 1;
  }

  async findRecentByChannel(
    input: FindRecentConversationMessagesInput,
  ): Promise<ConversationMessage[]> {
    const messages = await this.prismaService.conversationMessage.findMany({
      where: {
        guildId: input.guildId,
        channelId: input.channelId,
        discordMessageId: {
          not: input.excludeDiscordMessageId,
        },
        OR: [
          {
            discordCreatedAt: {
              lt: input.beforeDiscordCreatedAt,
            },
          },
          {
            discordCreatedAt: input.beforeDiscordCreatedAt,
            discordMessageId: {
              lt: input.excludeDiscordMessageId,
            },
          },
        ],
      },
      orderBy: [
        {
          discordCreatedAt: 'desc',
        },
        {
          discordMessageId: 'desc',
        },
      ],
      take: input.limit,
      select: {
        role: true,
        authorName: true,
        content: true,
      },
    });

    return messages.reverse().map((message): ConversationMessage => {
      if (message.role === 'USER') {
        return {
          role: 'user',
          username: message.authorName,
          content: message.content,
        };
      }

      return {
        role: 'assistant',
        content: message.content,
      };
    });
  }
}
