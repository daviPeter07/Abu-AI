import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MemoryService } from './memory.service';
import { MEMORY_REPOSITORY } from './repositories/memory.repository';
import { PrismaMemoryRepository } from './repositories/prisma-memory.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    MemoryService,
    {
      provide: MEMORY_REPOSITORY,
      useClass: PrismaMemoryRepository,
    },
  ],
  exports: [MemoryService],
})
export class MemoryModule {}
