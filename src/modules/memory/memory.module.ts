import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';
import { MemoryExtractorService } from './memory-extractor.service';
import { MemoryService } from './memory.service';
import { EmbeddingService } from './embedding.service';
import { MemorySearchService } from './memory-search.service';
import { EMBEDDING_PROVIDER } from './contracts/embedding-provider.contract';
import { OpenRouterEmbeddingProvider } from './providers/openrouter-embedding.provider';
import { MEMORY_REPOSITORY } from './repositories/memory.repository';
import { PrismaMemoryRepository } from './repositories/prisma-memory.repository';

@Module({
  imports: [AiModule, DatabaseModule],
  providers: [
    MemoryService,
    MemoryExtractorService,
    EmbeddingService,
    MemorySearchService,
    {
      provide: EMBEDDING_PROVIDER,
      useClass: OpenRouterEmbeddingProvider,
    },
    {
      provide: MEMORY_REPOSITORY,
      useClass: PrismaMemoryRepository,
    },
  ],
  exports: [MemoryService, MemorySearchService],
})
export class MemoryModule {}
