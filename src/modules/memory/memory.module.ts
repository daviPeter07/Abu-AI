import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';
import { MemoryExtractorService } from './memory-extractor.service';
import { MemoryService } from './memory.service';
import { MEMORY_REPOSITORY } from './repositories/memory.repository';
import { PrismaMemoryRepository } from './repositories/prisma-memory.repository';

@Module({
  imports: [AiModule, DatabaseModule],
  providers: [
    MemoryService,
    MemoryExtractorService,
    {
      provide: MEMORY_REPOSITORY,
      useClass: PrismaMemoryRepository,
    },
  ],
  exports: [MemoryService],
})
export class MemoryModule {}
