import { ServiceUnavailableException } from '@nestjs/common';
import { ObservabilityService } from '../observability/observability.service';
import { HealthController } from './health.controller';
import { HealthService, type HealthReport } from './health.service';

describe('HealthController', () => {
  const check = jest.fn<Promise<HealthReport>, []>();
  const observabilityService = new ObservabilityService();
  const controller = new HealthController(
    { check } as unknown as HealthService,
    observabilityService,
  );

  beforeEach(() => {
    check.mockReset();
  });

  it('should return the health report when dependencies are available', async () => {
    const report = createReport('ok');
    check.mockResolvedValue(report);

    await expect(controller.getHealth()).resolves.toBe(report);
  });

  it('should return a service unavailable error for unhealthy dependencies', async () => {
    check.mockResolvedValue(createReport('error'));

    await expect(controller.getHealth()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  function createReport(status: HealthReport['status']): HealthReport {
    return {
      status,
      checks: {
        postgresql: status === 'ok' ? 'up' : 'down',
        discord: 'up',
        providers: observabilityService.getProviderHealth(),
      },
    };
  }
});
