import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Events, GatewayIntentBits, Message } from 'discord.js';

@Injectable()
export class DiscordClientService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(DiscordClientService.name);

  private readonly client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  private readonly botToken: string;
  private readonly aiChannelId: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.getOrThrow<string>(
      'app.discord.botToken',
    );

    this.aiChannelId = this.configService.getOrThrow<string>(
      'app.discord.aiChannelId',
    );
  }

  async onApplicationBootstrap(): Promise<void> {
    this.registerEvents();

    await this.client.login(this.botToken);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.destroy();

    this.logger.log('Conexão com o Discord encerrada');
  }

  private registerEvents(): void {
    this.client.once(Events.ClientReady, (readyClient) => {
      this.logger.log(`Bot conectado ao Discord como ${readyClient.user.tag}`);
    });

    this.client.on(Events.MessageCreate, (message) => {
      void this.handleMessage(message);
    });
  }

  private async handleMessage(message: Message): Promise<void> {
    try {
      if (message.author.bot) {
        return;
      }

      if (!message.inGuild()) {
        return;
      }

      if (message.channelId !== this.aiChannelId) {
        return;
      }

      const content = message.content.trim();

      if (!content) {
        return;
      }

      this.logger.log(`Mensagem recebida de ${message.author.username}`);

      await message.channel.sendTyping();

      await message.reply({
        content: `Olá, ${message.author.username}! Recebi sua mensagem: "${content}"`,
        allowedMentions: {
          repliedUser: false,
        },
      });
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);

      this.logger.error(
        `Não foi possível responder à mensagem ${message.id}`,
        stack,
      );
    }
  }
}
