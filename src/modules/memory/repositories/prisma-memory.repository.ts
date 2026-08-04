import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  CreateMemoryRepositoryInput,
  MemoryRecord,
} from '../contracts/memory.contract';
import type { MemoryRepository } from './memory.repository';

interface SelectedMemory {
  id: string;
  scope: MemoryRecord['scope'];
  type: MemoryRecord['type'];
  content: string;
  normalizedContent: string;
  subjectUser: { discordUserId: string } | null;
  guildId: string | null;
  confidence: number;
  status: MemoryRecord['status'];
  sourceMessage: { discordMessageId: string } | null;
  createdAt: Date;
  updatedAt: Date;
  lastConfirmedAt: Date | null;
}

const memorySelect = {
  id: true,
  scope: true,
  type: true,
  content: true,
  normalizedContent: true,
  subjectUser: {
    select: {
      discordUserId: true,
    },
  },
  guildId: true,
  confidence: true,
  status: true,
  sourceMessage: {
    select: {
      discordMessageId: true,
    },
  },
  createdAt: true,
  updatedAt: true,
  lastConfirmedAt: true,
} as const;

@Injectable()
export class PrismaMemoryRepository implements MemoryRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(input: CreateMemoryRepositoryInput): Promise<MemoryRecord> {
    const memory = await this.prismaService.memory.create({
      data: {
        scope: input.scope,
        type: input.type,
        content: input.content,
        normalizedContent: input.normalizedContent,
        guildId: input.guildId,
        confidence: input.confidence,
        status: input.status,
        lastConfirmedAt: input.lastConfirmedAt,
        subjectUser: input.subjectDiscordUserId
          ? {
              connect: {
                discordUserId: input.subjectDiscordUserId,
              },
            }
          : undefined,
        sourceMessage: input.sourceDiscordMessageId
          ? {
              connect: {
                discordMessageId: input.sourceDiscordMessageId,
              },
            }
          : undefined,
      },
      select: memorySelect,
    });

    return this.mapMemory(memory);
  }

  async findByUser(discordUserId: string): Promise<MemoryRecord[]> {
    const memories = await this.prismaService.memory.findMany({
      where: {
        scope: 'USER',
        subjectUser: {
          discordUserId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: memorySelect,
    });

    return memories.map((memory) => this.mapMemory(memory));
  }

  async findByGroup(guildId: string): Promise<MemoryRecord[]> {
    const memories = await this.prismaService.memory.findMany({
      where: {
        scope: 'GROUP',
        guildId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: memorySelect,
    });

    return memories.map((memory) => this.mapMemory(memory));
  }

  private mapMemory(memory: SelectedMemory): MemoryRecord {
    return {
      id: memory.id,
      scope: memory.scope,
      type: memory.type,
      content: memory.content,
      normalizedContent: memory.normalizedContent,
      subjectDiscordUserId: memory.subjectUser?.discordUserId ?? null,
      guildId: memory.guildId,
      confidence: memory.confidence,
      status: memory.status,
      sourceDiscordMessageId: memory.sourceMessage?.discordMessageId ?? null,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
      lastConfirmedAt: memory.lastConfirmedAt,
    };
  }
}
