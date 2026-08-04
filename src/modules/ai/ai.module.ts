import { Module } from '@nestjs/common';
import { AI_PROVIDER } from './contracts/ai-provider.contract';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AiService } from './ai.service';

@Module({
  providers: [
    AiService,
    {
      provide: AI_PROVIDER,
      useClass: MockAiProvider,
    },
  ],
  exports: [AiService],
})
export class AiModule {}
