import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  ConfirmExtractedMemoryInput,
  CreateMemoryRepositoryInput,
  FindActiveMemoryCandidatesInput,
  MemoryEvidenceInput,
  MemoryRecord,
  SupersedeExtractedMemoryInput,
} from '../contracts/memory.contract';
import type { MemoryRepository } from './memory.repository';

interface SelectedMemory {
  id: string;
  scope: MemoryRecord['scope'];
  type: MemoryRecord['type'];
  content: string;
  normalizedContent: string;
  embedding: number[];
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
  embedding: true,
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

  async findActiveCandidates(
    input: FindActiveMemoryCandidatesInput,
  ): Promise<MemoryRecord[]> {
    const memories = await this.prismaService.memory.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          {
            scope: 'USER',
            subjectUser: {
              discordUserId: input.discordUserId,
            },
          },
          {
            scope: 'GROUP',
            guildId: input.guildId,
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: memorySelect,
    });

    return memories.map((memory) => this.mapMemory(memory));
  }

  async createExtracted(
    input: CreateMemoryRepositoryInput,
    evidence: MemoryEvidenceInput,
  ): Promise<boolean> {
    try {
      await this.prismaService.memory.create({
        data: {
          ...this.createData(input),
          evidence: {
            create: this.evidenceData(evidence),
          },
        },
      });

      return true;
    } catch (error) {
      return this.handleEvidenceConflict(error);
    }
  }

  async confirmExtracted(input: ConfirmExtractedMemoryInput): Promise<boolean> {
    try {
      await this.prismaService.$transaction(async (transaction) => {
        await transaction.memoryEvidence.create({
          data: {
            ...this.evidenceData(input.evidence),
            memory: {
              connect: {
                id: input.memoryId,
              },
            },
          },
        });
        await transaction.memory.update({
          where: {
            id: input.memoryId,
          },
          data: {
            confidence: input.confidence,
            lastConfirmedAt: input.lastConfirmedAt,
          },
        });
      });

      return true;
    } catch (error) {
      return this.handleEvidenceConflict(error);
    }
  }

  async supersedeExtracted(
    input: SupersedeExtractedMemoryInput,
  ): Promise<boolean> {
    try {
      await this.prismaService.$transaction(async (transaction) => {
        await transaction.memory.update({
          where: {
            id: input.supersededMemoryId,
          },
          data: {
            status: 'SUPERSEDED',
          },
        });
        await transaction.memory.create({
          data: {
            ...this.createData(input.memory),
            evidence: {
              create: this.evidenceData(input.evidence),
            },
          },
        });
      });

      return true;
    } catch (error) {
      return this.handleEvidenceConflict(error);
    }
  }

  private createData(input: CreateMemoryRepositoryInput) {
    return {
      scope: input.scope,
      type: input.type,
      content: input.content,
      normalizedContent: input.normalizedContent,
      embedding: input.embedding,
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
    };
  }

  private evidenceData(input: MemoryEvidenceInput) {
    return {
      idempotencyKey: input.idempotencyKey,
      sourceMessage: {
        connect: {
          discordMessageId: input.sourceDiscordMessageId,
        },
      },
    };
  }

  private handleEvidenceConflict(error: unknown): false {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return false;
    }

    throw error;
  }

  private mapMemory(memory: SelectedMemory): MemoryRecord {
    return {
      id: memory.id,
      scope: memory.scope,
      type: memory.type,
      content: memory.content,
      normalizedContent: memory.normalizedContent,
      embedding: memory.embedding,
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

  async isMemoryEnabled(discordUserId: string): Promise<boolean> {
    const user = await this.prismaService.discordUser.findUnique({
      where: {
        discordUserId,
      },
      select: {
        memoryEnabled: true,
      },
    });

    return user?.memoryEnabled ?? false;
  }

  forgetOwnMemory(discordUserId: string, memoryId: string): Promise<boolean> {
    return this.prismaService.$transaction(async (transaction) => {
      const result = await transaction.memory.updateMany({
        where: {
          id: memoryId,
          scope: 'USER',
          status: 'ACTIVE',
          subjectUser: { discordUserId },
        },
        data: { status: 'REJECTED' },
      });

      if (result.count === 0) return false;

      await transaction.memoryAudit.create({
        data: {
          action: 'FORGET',
          actor: { connect: { discordUserId } },
          memory: { connect: { id: memoryId } },
        },
      });
      return true;
    });
  }

  clearOwnMemories(discordUserId: string): Promise<number> {
    return this.prismaService.$transaction(async (transaction) => {
      const result = await transaction.memory.updateMany({
        where: {
          scope: 'USER',
          status: 'ACTIVE',
          subjectUser: { discordUserId },
        },
        data: { status: 'REJECTED' },
      });
      await transaction.memoryAudit.create({
        data: {
          action: 'CLEAR',
          actor: { connect: { discordUserId } },
        },
      });
      return result.count;
    });
  }

  async setMemoryEnabled(
    discordUserId: string,
    enabled: boolean,
  ): Promise<void> {
    await this.prismaService.$transaction(async (transaction) => {
      await transaction.discordUser.update({
        where: { discordUserId },
        data: { memoryEnabled: enabled },
      });
      await transaction.memoryAudit.create({
        data: {
          action: enabled ? 'ENABLE' : 'DISABLE',
          actor: { connect: { discordUserId } },
        },
      });
    });
  }
}
