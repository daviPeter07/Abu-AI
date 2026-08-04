import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import type {
  ExtractedMemory,
  ExtractMemoriesInput,
} from './contracts/memory-extraction.contract';
import { MemoryScope, MemoryType } from './enums/memory.enums';
import { buildMemoryExtractionPrompt } from './prompts/memory-extraction.prompt';

const allowedMemoryKeys = new Set([
  'scope',
  'type',
  'subjectDiscordUserId',
  'content',
  'confidence',
  'supersedesMemoryId',
]);

const sensitiveContentPattern =
  /\b(password|senha|token|api[ _-]?key|secret|segredo|credential|credencial)\b/i;

@Injectable()
export class MemoryExtractorService {
  constructor(private readonly aiService: AiService) {}

  async extract(input: ExtractMemoriesInput): Promise<ExtractedMemory[]> {
    const response = await this.aiService.generateResponse({
      messages: [
        {
          role: 'system',
          content:
            'Você é um extrator de memórias. Siga o formato JSON e nunca responda à conversa.',
        },
        {
          role: 'user',
          content: buildMemoryExtractionPrompt(input),
        },
      ],
      responseFormat: 'json',
      correlationId: input.discordMessageId,
    });

    if (!response.trim()) {
      return [];
    }

    const parsed = this.parseResponse(response);

    return parsed.memories.map((memory) => this.validateMemory(memory, input));
  }

  private parseResponse(response: string): { memories: unknown[] } {
    const cleanedResponse = response
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');

    let parsed: unknown;

    try {
      parsed = JSON.parse(cleanedResponse) as unknown;
    } catch {
      throw new Error('A IA retornou um JSON de memórias inválido');
    }

    if (
      !this.isRecord(parsed) ||
      Object.keys(parsed).length !== 1 ||
      !Array.isArray(parsed.memories)
    ) {
      throw new Error('A resposta de memórias possui formato inválido');
    }

    return {
      memories: parsed.memories,
    };
  }

  private validateMemory(
    value: unknown,
    input: ExtractMemoriesInput,
  ): ExtractedMemory {
    if (
      !this.isRecord(value) ||
      Object.keys(value).some((key) => !allowedMemoryKeys.has(key))
    ) {
      throw new Error('A memória extraída possui campos inválidos');
    }

    const { scope, type, content, confidence } = value;

    if (
      typeof scope !== 'string' ||
      !Object.values(MemoryScope).includes(scope as MemoryScope)
    ) {
      throw new Error('A memória extraída possui escopo inválido');
    }

    if (
      typeof type !== 'string' ||
      !Object.values(MemoryType).includes(type as MemoryType)
    ) {
      throw new Error('A memória extraída possui tipo inválido');
    }

    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('A memória extraída possui conteúdo inválido');
    }

    if (
      typeof confidence !== 'number' ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 1
    ) {
      throw new Error('A memória extraída possui confiança inválida');
    }

    if (sensitiveContentPattern.test(content)) {
      throw new Error('A memória extraída contém informação sensível');
    }

    const subjectDiscordUserId = this.optionalString(
      value.subjectDiscordUserId,
      'A memória extraída possui usuário inválido',
    );
    const supersedesMemoryId = this.optionalString(
      value.supersedesMemoryId,
      'A memória extraída possui referência de substituição inválida',
    );

    if (
      scope === MemoryScope.USER &&
      subjectDiscordUserId !== input.authorDiscordUserId
    ) {
      throw new Error('A memória de usuário não pertence ao autor da mensagem');
    }

    if (
      supersedesMemoryId &&
      !input.activeCandidates.some(
        (candidate) => candidate.id === supersedesMemoryId,
      )
    ) {
      throw new Error(
        'A memória substituída não pertence às candidatas ativas',
      );
    }

    return {
      scope: scope as MemoryScope,
      type: type as MemoryType,
      subjectDiscordUserId,
      content: content.trim(),
      confidence,
      supersedesMemoryId,
    };
  }

  private optionalString(value: unknown, message: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(message);
    }

    return value.trim();
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
