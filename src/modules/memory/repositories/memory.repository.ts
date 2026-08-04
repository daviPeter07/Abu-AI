import type {
  CreateMemoryRepositoryInput,
  MemoryRecord,
} from '../contracts/memory.contract';

export const MEMORY_REPOSITORY = Symbol('MEMORY_REPOSITORY');

export interface MemoryRepository {
  create(input: CreateMemoryRepositoryInput): Promise<MemoryRecord>;
  findByUser(discordUserId: string): Promise<MemoryRecord[]>;
  findByGroup(guildId: string): Promise<MemoryRecord[]>;
}
