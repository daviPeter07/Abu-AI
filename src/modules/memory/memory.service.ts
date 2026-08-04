import { Inject, Injectable } from '@nestjs/common';
import type {
  CreateMemoryInput,
  CreateMemoryRepositoryInput,
  MemoryRecord,
} from './contracts/memory.contract';
import { MemoryScope, MemoryStatus, MemoryType } from './enums/memory.enums';
import {
  MEMORY_REPOSITORY,
  type MemoryRepository,
} from './repositories/memory.repository';

@Injectable()
export class MemoryService {
  constructor(
    @Inject(MEMORY_REPOSITORY)
    private readonly memoryRepository: MemoryRepository,
  ) {}

  create(input: CreateMemoryInput): Promise<MemoryRecord> {
    const repositoryInput = this.validateCreateInput(input);

    return this.memoryRepository.create(repositoryInput);
  }

  findByUser(discordUserId: string): Promise<MemoryRecord[]> {
    const normalizedDiscordUserId = this.requireIdentifier(
      discordUserId,
      'O ID do usuário do Discord é obrigatório',
    );

    return this.memoryRepository.findByUser(normalizedDiscordUserId);
  }

  findByGroup(guildId: string): Promise<MemoryRecord[]> {
    const normalizedGuildId = this.requireIdentifier(
      guildId,
      'O ID do servidor do Discord é obrigatório',
    );

    return this.memoryRepository.findByGroup(normalizedGuildId);
  }

  private validateCreateInput(
    input: CreateMemoryInput,
  ): CreateMemoryRepositoryInput {
    if (!Object.values(MemoryScope).includes(input.scope)) {
      throw new Error('O escopo da memória é inválido');
    }

    if (!Object.values(MemoryType).includes(input.type)) {
      throw new Error('O tipo da memória é inválido');
    }

    const status = input.status ?? MemoryStatus.ACTIVE;

    if (!Object.values(MemoryStatus).includes(status)) {
      throw new Error('O status da memória é inválido');
    }

    const content = input.content.trim();

    if (!content) {
      throw new Error('O conteúdo da memória é obrigatório');
    }

    if (!Number.isFinite(input.confidence)) {
      throw new Error('A confiança da memória deve ser um número finito');
    }

    if (input.confidence < 0 || input.confidence > 1) {
      throw new Error('A confiança da memória deve estar entre 0 e 1');
    }

    const subjectDiscordUserId = this.optionalIdentifier(
      input.subjectDiscordUserId,
      'O ID do usuário do Discord não pode ser vazio',
    );
    const guildId = this.optionalIdentifier(
      input.guildId,
      'O ID do servidor do Discord não pode ser vazio',
    );
    const sourceDiscordMessageId = this.optionalIdentifier(
      input.sourceDiscordMessageId,
      'O ID da mensagem de origem não pode ser vazio',
    );

    if (input.scope === MemoryScope.USER && !subjectDiscordUserId) {
      throw new Error('Memórias de usuário exigem um usuário relacionado');
    }

    if (input.scope === MemoryScope.USER && guildId) {
      throw new Error('Memórias de usuário não podem pertencer a um servidor');
    }

    if (input.scope === MemoryScope.GROUP && !guildId) {
      throw new Error('Memórias de grupo exigem um servidor relacionado');
    }

    if (
      input.lastConfirmedAt &&
      (!(input.lastConfirmedAt instanceof Date) ||
        Number.isNaN(input.lastConfirmedAt.getTime()))
    ) {
      throw new Error('A data de confirmação da memória é inválida');
    }

    return {
      scope: input.scope,
      type: input.type,
      content,
      normalizedContent: content
        .normalize('NFKC')
        .replace(/\s+/g, ' ')
        .toLowerCase(),
      subjectDiscordUserId,
      guildId,
      confidence: input.confidence,
      status,
      sourceDiscordMessageId,
      lastConfirmedAt: input.lastConfirmedAt,
    };
  }

  private requireIdentifier(value: string, message: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new Error(message);
    }

    return normalizedValue;
  }

  private optionalIdentifier(
    value: string | undefined,
    message: string,
  ): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.requireIdentifier(value, message);
  }
}
