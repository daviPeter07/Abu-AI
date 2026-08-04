import { Injectable } from '@nestjs/common';

export type ProviderName = 'openrouter-chat' | 'openrouter-embeddings';
export type ProviderStatus = 'unknown' | 'up' | 'degraded' | 'down';

export interface ProviderHealth {
  status: ProviderStatus;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastErrorCode: string | null;
}

export interface ConversationMetricsInput {
  contextDurationMs: number;
  memorySearchDurationMs: number;
  responseDurationMs: number;
  totalDurationMs: number;
  charactersSent: number;
  memoriesRetrieved: number;
}

@Injectable()
export class ObservabilityService {
  private readonly providers: Record<ProviderName, ProviderHealth> = {
    'openrouter-chat': this.createUnknownProviderHealth(),
    'openrouter-embeddings': this.createUnknownProviderHealth(),
  };

  private readonly metrics = {
    conversationsProcessedTotal: 0,
    conversationFailuresTotal: 0,
    providerRequestsTotal: {
      'openrouter-chat': 0,
      'openrouter-embeddings': 0,
    },
    providerFailuresTotal: {
      'openrouter-chat': 0,
      'openrouter-embeddings': 0,
    },
    lastDurationsMs: {
      context: 0,
      memorySearch: 0,
      response: 0,
      total: 0,
      'openrouter-chat': 0,
      'openrouter-embeddings': 0,
    },
    lastCharactersSent: 0,
    lastMemoriesRetrieved: 0,
  };

  recordProviderSuccess(name: ProviderName, durationMs: number): void {
    const checkedAt = new Date().toISOString();

    this.metrics.providerRequestsTotal[name] += 1;
    this.metrics.lastDurationsMs[name] = durationMs;
    this.providers[name] = {
      status: 'up',
      lastCheckedAt: checkedAt,
      lastSuccessAt: checkedAt,
      lastFailureAt: this.providers[name].lastFailureAt,
      lastErrorCode: null,
    };
  }

  recordProviderFailure(
    name: ProviderName,
    durationMs: number,
    errorCode: string,
  ): void {
    const checkedAt = new Date().toISOString();

    this.metrics.providerRequestsTotal[name] += 1;
    this.metrics.providerFailuresTotal[name] += 1;
    this.metrics.lastDurationsMs[name] = durationMs;
    this.providers[name] = {
      status: this.isPermanentProviderError(errorCode) ? 'down' : 'degraded',
      lastCheckedAt: checkedAt,
      lastSuccessAt: this.providers[name].lastSuccessAt,
      lastFailureAt: checkedAt,
      lastErrorCode: errorCode,
    };
  }

  recordConversationSuccess(input: ConversationMetricsInput): void {
    this.metrics.conversationsProcessedTotal += 1;
    this.metrics.lastDurationsMs.context = input.contextDurationMs;
    this.metrics.lastDurationsMs.memorySearch = input.memorySearchDurationMs;
    this.metrics.lastDurationsMs.response = input.responseDurationMs;
    this.metrics.lastDurationsMs.total = input.totalDurationMs;
    this.metrics.lastCharactersSent = input.charactersSent;
    this.metrics.lastMemoriesRetrieved = input.memoriesRetrieved;
  }

  recordConversationFailure(): void {
    this.metrics.conversationFailuresTotal += 1;
  }

  getProviderHealth(): Record<ProviderName, ProviderHealth> {
    return {
      'openrouter-chat': { ...this.providers['openrouter-chat'] },
      'openrouter-embeddings': {
        ...this.providers['openrouter-embeddings'],
      },
    };
  }

  getMetrics(): typeof this.metrics {
    return structuredClone(this.metrics);
  }

  private createUnknownProviderHealth(): ProviderHealth {
    return {
      status: 'unknown',
      lastCheckedAt: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastErrorCode: null,
    };
  }

  private isPermanentProviderError(errorCode: string): boolean {
    return [
      'AUTHENTICATION',
      'PAYMENT_REQUIRED',
      'MODEL_NOT_FOUND',
      'UNKNOWN',
    ].includes(errorCode);
  }
}
