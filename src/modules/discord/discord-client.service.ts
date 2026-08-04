import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Events, GatewayIntentBits, Message } from 'discord.js';
import { ConversationsService } from '../conversations/conversations.service';

@Injectable()
export class DiscordClientService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private static readonly MAX_MESSAGE_LENGTH = 2_000;
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

  constructor(
    private readonly configService: ConfigService,
    private readonly conversationsService: ConversationsService,
  ) {
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

      const response = await this.conversationsService.generateReply({
        content,
        username: message.author.username,
      });

      await message.reply({
        content: this.limitResponseLength(response),
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

      await this.sendErrorResponse(message);
    }
  }

  private limitResponseLength(content: string): string {
    const normalizedContent = content.trim();

    if (normalizedContent.length <= DiscordClientService.MAX_MESSAGE_LENGTH) {
      return normalizedContent;
    }

    const availableLength = DiscordClientService.MAX_MESSAGE_LENGTH - 3;

    return `${normalizedContent.slice(0, availableLength)}...`;
  }

  private async sendErrorResponse(message: Message): Promise<void> {
    try {
      await message.reply({
        content:
          'Não consegui gerar uma resposta agora. Tente novamente em alguns instantes.',
        allowedMentions: {
          repliedUser: false,
        },
      });
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);

      this.logger.error(
        `Não foi possível enviar a mensagem de erro para ${message.id}`,
        stack,
      );
    }
  }
}
