import type { MemoryRecord } from './memory.contract';
import type { MemoryScope, MemoryType } from '../enums/memory.enums';

export interface ExtractMemoriesInput {
  discordMessageId: string;
  guildId: string;
  authorDiscordUserId: string;
  authorName: string;
  content: string;
  activeCandidates: MemoryRecord[];
}

export interface ExtractedMemory {
  scope: MemoryScope;
  type: MemoryType;
  subjectDiscordUserId?: string;
  content: string;
  confidence: number;
  supersedesMemoryId?: string;
}

export interface ExtractMemoriesFromMessageInput {
  discordMessageId: string;
  guildId: string;
  authorDiscordUserId: string;
  authorName: string;
  content: string;
  discordCreatedAt: Date;
}
