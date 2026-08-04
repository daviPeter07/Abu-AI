import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { PersistConversationMessageInput } from '../conversation-message.contract';
import type { ConversationMessageRepository } from './conversation-message.repository';

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
}
