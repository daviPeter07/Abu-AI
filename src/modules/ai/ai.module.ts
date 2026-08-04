import { Module } from '@nestjs/common';
import { AI_PROVIDER } from './contracts/ai-provider.contract';
import { AiService } from './ai.service';
import { OpenRouterProvider } from './providers/openrouter.provider';

@Module({
  providers: [
    AiService,
    {
      provide: AI_PROVIDER,
      useClass: OpenRouterProvider,
    },
  ],
  exports: [AiService],
})
export class AiModule {}
