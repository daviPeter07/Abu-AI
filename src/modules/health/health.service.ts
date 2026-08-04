import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DiscordClientService } from '../discord/discord-client.service';
import { ObservabilityService } from '../observability/observability.service';

export interface HealthReport {
  status: 'ok' | 'degraded' | 'error';
  checks: {
    postgresql: 'up' | 'down';
    discord: 'up' | 'down';
    providers: ReturnType<ObservabilityService['getProviderHealth']>;
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly discordClientService: DiscordClientService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async check(): Promise<HealthReport> {
    const postgresql = (await this.prismaService.isHealthy()) ? 'up' : 'down';
    const discord = this.discordClientService.isReady() ? 'up' : 'down';
    const providers = this.observabilityService.getProviderHealth();
    const providerIsDown = Object.values(providers).some(
      (provider) => provider.status === 'down',
    );
    const providerIsDegraded = Object.values(providers).some(
      (provider) => provider.status === 'degraded',
    );
    let status: HealthReport['status'] = 'ok';

    if (postgresql === 'down' || discord === 'down' || providerIsDown) {
      status = 'error';
    } else if (providerIsDegraded) {
      status = 'degraded';
    }

    return {
      status,
      checks: {
        postgresql,
        discord,
        providers,
      },
    };
  }
}
