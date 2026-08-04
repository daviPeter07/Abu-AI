import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  DiscordUserProfile,
  UpsertDiscordUserInput,
} from '../contracts/discord-user.contract';
import type { DiscordUserRepository } from './discord-user.repository';

@Injectable()
export class PrismaDiscordUserRepository implements DiscordUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  upsert(input: UpsertDiscordUserInput): Promise<DiscordUserProfile> {
    return this.prismaService.discordUser.upsert({
      where: {
        discordUserId: input.discordUserId,
      },
      create: {
        discordUserId: input.discordUserId,
        username: input.username,
        displayName: input.displayName,
        firstSeenAt: input.seenAt,
        lastSeenAt: input.seenAt,
      },
      update: {
        username: input.username,
        displayName: input.displayName,
        lastSeenAt: input.seenAt,
      },
    });
  }
}
