import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const connectionString =
      configService.getOrThrow<string>('app.database.url');

    const adapter = new PrismaPg({
      connectionString,
    });

    super({
      adapter,
      log: ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();

    this.logger.log('Conexão com o PostgreSQL estabelecida');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();

    this.logger.log('Conexão com o PostgreSQL encerrada');
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.conversationMessage.findFirst({
        select: {
          id: true,
        },
      });

      return true;
    } catch {
      this.logger.warn('A verificação de saúde do PostgreSQL falhou');
      return false;
    }
  }
}
