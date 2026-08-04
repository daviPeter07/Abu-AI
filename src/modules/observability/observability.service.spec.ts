import { ObservabilityService } from './observability.service';

describe('ObservabilityService', () => {
  it('should record provider state without sensitive request data', () => {
    const service = new ObservabilityService();

    service.recordProviderFailure('openrouter-chat', 120, 'RATE_LIMITED');

    expect(service.getProviderHealth()['openrouter-chat']).toEqual(
      expect.objectContaining({
        status: 'degraded',
        lastErrorCode: 'RATE_LIMITED',
      }),
    );
    const metrics = service.getMetrics();

    expect(metrics.providerRequestsTotal['openrouter-chat']).toBe(1);
    expect(metrics.providerFailuresTotal['openrouter-chat']).toBe(1);
  });

  it('should mark permanent provider failures as down', () => {
    const service = new ObservabilityService();

    service.recordProviderFailure('openrouter-chat', 50, 'AUTHENTICATION');

    expect(service.getProviderHealth()['openrouter-chat'].status).toBe('down');
  });

  it('should expose the latest conversation measurements', () => {
    const service = new ObservabilityService();

    service.recordConversationSuccess({
      contextDurationMs: 10,
      memorySearchDurationMs: 20,
      responseDurationMs: 30,
      totalDurationMs: 60,
      charactersSent: 120,
      memoriesRetrieved: 2,
    });

    const metrics = service.getMetrics();

    expect(metrics.conversationsProcessedTotal).toBe(1);
    expect(metrics.lastCharactersSent).toBe(120);
    expect(metrics.lastMemoriesRetrieved).toBe(2);
    expect(metrics.lastDurationsMs.context).toBe(10);
    expect(metrics.lastDurationsMs.memorySearch).toBe(20);
    expect(metrics.lastDurationsMs.response).toBe(30);
    expect(metrics.lastDurationsMs.total).toBe(60);
  });
});
