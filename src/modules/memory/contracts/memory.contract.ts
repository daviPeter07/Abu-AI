import type {
  MemoryScope,
  MemoryStatus,
  MemoryType,
} from '../enums/memory.enums';

export interface CreateMemoryInput {
  scope: MemoryScope;
  type: MemoryType;
  content: string;
  subjectDiscordUserId?: string;
  guildId?: string;
  confidence: number;
  status?: MemoryStatus;
  sourceDiscordMessageId?: string;
  lastConfirmedAt?: Date;
}

export interface CreateMemoryRepositoryInput {
  scope: MemoryScope;
  type: MemoryType;
  content: string;
  normalizedContent: string;
  subjectDiscordUserId?: string;
  guildId?: string;
  confidence: number;
  status: MemoryStatus;
  sourceDiscordMessageId?: string;
  lastConfirmedAt?: Date;
}

export interface MemoryRecord {
  id: string;
  scope: MemoryScope;
  type: MemoryType;
  content: string;
  normalizedContent: string;
  subjectDiscordUserId: string | null;
  guildId: string | null;
  confidence: number;
  status: MemoryStatus;
  sourceDiscordMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastConfirmedAt: Date | null;
}
