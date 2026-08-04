import type {
  ConfirmExtractedMemoryInput,
  CreateMemoryRepositoryInput,
  FindActiveMemoryCandidatesInput,
  MemoryEvidenceInput,
  MemoryRecord,
  SupersedeExtractedMemoryInput,
} from '../contracts/memory.contract';

export const MEMORY_REPOSITORY = Symbol('MEMORY_REPOSITORY');

export interface MemoryRepository {
  create(input: CreateMemoryRepositoryInput): Promise<MemoryRecord>;
  findByUser(discordUserId: string): Promise<MemoryRecord[]>;
  findByGroup(guildId: string): Promise<MemoryRecord[]>;
  findActiveCandidates(
    input: FindActiveMemoryCandidatesInput,
  ): Promise<MemoryRecord[]>;
  createExtracted(
    input: CreateMemoryRepositoryInput,
    evidence: MemoryEvidenceInput,
  ): Promise<boolean>;
  confirmExtracted(input: ConfirmExtractedMemoryInput): Promise<boolean>;
  supersedeExtracted(input: SupersedeExtractedMemoryInput): Promise<boolean>;
}
