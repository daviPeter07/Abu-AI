import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DISCORD_USER_REPOSITORY } from './repositories/discord-user.repository';
import { PrismaDiscordUserRepository } from './repositories/prisma-discord-user.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: DISCORD_USER_REPOSITORY,
      useClass: PrismaDiscordUserRepository,
    },
  ],
  exports: [DISCORD_USER_REPOSITORY],
})
export class DiscordUsersModule {}
