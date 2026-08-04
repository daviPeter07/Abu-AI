import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ObservabilityService } from '../observability/observability.service';
import { HealthService, type HealthReport } from './health.service';

@Controller()
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  @Get('health')
  async getHealth(): Promise<HealthReport> {
    const report = await this.healthService.check();

    if (report.status === 'error') {
      throw new ServiceUnavailableException(report);
    }

    return report;
  }

  @Get('metrics')
  getMetrics(): ReturnType<ObservabilityService['getMetrics']> {
    return this.observabilityService.getMetrics();
  }
}
