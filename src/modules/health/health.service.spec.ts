import { PrismaService } from '../database/prisma.service';
import { DiscordClientService } from '../discord/discord-client.service';
import { ObservabilityService } from '../observability/observability.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const isHealthy = jest.fn();
  const isReady = jest.fn();
  let observabilityService: ObservabilityService;
  let service: HealthService;

  beforeEach(() => {
    isHealthy.mockReset();
    isReady.mockReset();
    observabilityService = new ObservabilityService();
    service = new HealthService(
      { isHealthy } as unknown as PrismaService,
      { isReady } as unknown as DiscordClientService,
      observabilityService,
    );
  });

  it('should report healthy dependencies', async () => {
    isHealthy.mockResolvedValue(true);
    isReady.mockReturnValue(true);

    const report = await service.check();

    expect(report.status).toBe('ok');
    expect(report.checks.postgresql).toBe('up');
    expect(report.checks.discord).toBe('up');
  });

  it('should report an unavailable core dependency', async () => {
    isHealthy.mockResolvedValue(false);
    isReady.mockReturnValue(true);

    const report = await service.check();

    expect(report.status).toBe('error');
    expect(report.checks.postgresql).toBe('down');
  });

  it('should report Discord as unavailable', async () => {
    isHealthy.mockResolvedValue(true);
    isReady.mockReturnValue(false);

    const report = await service.check();

    expect(report.status).toBe('error');
    expect(report.checks.discord).toBe('down');
  });

  it('should report temporary provider failures as degraded', async () => {
    isHealthy.mockResolvedValue(true);
    isReady.mockReturnValue(true);
    observabilityService.recordProviderFailure(
      'openrouter-chat',
      100,
      'RATE_LIMITED',
    );

    const report = await service.check();

    expect(report.status).toBe('degraded');
    expect(report.checks.providers['openrouter-chat'].status).toBe('degraded');
  });

  it('should report permanent provider failures as unavailable', async () => {
    isHealthy.mockResolvedValue(true);
    isReady.mockReturnValue(true);
    observabilityService.recordProviderFailure(
      'openrouter-chat',
      100,
      'AUTHENTICATION',
    );

    const report = await service.check();

    expect(report.status).toBe('error');
    expect(report.checks.providers['openrouter-chat'].status).toBe('down');
  });
});
