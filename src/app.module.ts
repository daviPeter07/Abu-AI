import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, envValidationSchema } from './config/app.config';
import { DiscordModule } from './modules/discord/discord.module';
import { AiModule } from './modules/ai/ai.module';
import { ConversationsModule } from './modules/conversations/conversations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),

    DiscordModule,

    AiModule,

    ConversationsModule,
  ],
})
export class AppModule {}
