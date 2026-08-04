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
  embedding?: number[];
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
  embedding: number[];
  subjectDiscordUserId: string | null;
  guildId: string | null;
  confidence: number;
  status: MemoryStatus;
  sourceDiscordMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastConfirmedAt: Date | null;
}

export interface FindActiveMemoryCandidatesInput {
  discordUserId: string;
  guildId: string;
}

export interface SearchRelevantMemoriesInput {
  query: string;
  discordUserId: string;
  guildId: string;
}

export interface MemoryEvidenceInput {
  idempotencyKey: string;
  sourceDiscordMessageId: string;
}

export interface ConfirmExtractedMemoryInput {
  memoryId: string;
  confidence: number;
  lastConfirmedAt: Date;
  evidence: MemoryEvidenceInput;
}

export interface SupersedeExtractedMemoryInput {
  supersededMemoryId: string;
  memory: CreateMemoryRepositoryInput;
  evidence: MemoryEvidenceInput;
}
