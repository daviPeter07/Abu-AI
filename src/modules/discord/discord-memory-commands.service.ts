import { Injectable } from '@nestjs/common';
import type { Message } from 'discord.js';
import { MemoryService } from '../memory/memory.service';

@Injectable()
export class DiscordMemoryCommandsService {
  constructor(private readonly memoryService: MemoryService) {}

  async handle(message: Message<true>): Promise<boolean> {
    const [command, argument] = message.content.trim().split(/\s+/, 2);

    switch (command.toLowerCase()) {
      case '/memorias': {
        const memories = await this.memoryService.listOwnMemories(
          message.author.id,
        );
        const content = memories.length
          ? memories
              .map((memory) => `- ${memory.id}: ${memory.content}`)
              .join('\n')
              .slice(0, 2_000)
          : 'Não tenho memórias ativas sobre você.';
        await message.reply({
          content,
          allowedMentions: { repliedUser: false },
        });
        return true;
      }
      case '/esquecer': {
        if (!argument) {
          await this.reply(
            message,
            'Informe o ID da memória que deseja esquecer.',
          );
          return true;
        }

        const forgotten = await this.memoryService.forgetOwnMemory(
          message.author.id,
          argument,
        );
        await this.reply(
          message,
          forgotten
            ? 'Memória esquecida.'
            : 'Memória não encontrada ou não pertence a você.',
        );
        return true;
      }
      case '/limpar-memorias': {
        const count = await this.memoryService.clearOwnMemories(
          message.author.id,
        );
        await this.reply(message, `${count} memória(s) foram desativadas.`);
        return true;
      }
      case '/memoria-status': {
        if (argument === 'ativar' || argument === 'desativar') {
          const enabled = argument === 'ativar';
          await this.memoryService.setMemoryEnabled(message.author.id, enabled);
          await this.reply(
            message,
            enabled
              ? 'Memória individual ativada.'
              : 'Memória individual desativada.',
          );
          return true;
        }

        const enabled = await this.memoryService.isMemoryEnabled(
          message.author.id,
        );
        await this.reply(
          message,
          `A memória individual está ${enabled ? 'ativada' : 'desativada'}.`,
        );
        return true;
      }
      default:
        return false;
    }
  }

  private async reply(message: Message<true>, content: string): Promise<void> {
    await message.reply({ content, allowedMentions: { repliedUser: false } });
  }
}
