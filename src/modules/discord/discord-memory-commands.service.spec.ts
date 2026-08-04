import { Test } from '@nestjs/testing';
import type { Message } from 'discord.js';
import { MemoryService } from '../memory/memory.service';
import { DiscordMemoryCommandsService } from './discord-memory-commands.service';

describe('DiscordMemoryCommandsService', () => {
  let service: DiscordMemoryCommandsService;

  const listOwnMemories = jest.fn();
  const forgetOwnMemory = jest.fn();
  const clearOwnMemories = jest.fn();
  const setMemoryEnabled = jest.fn();
  const isMemoryEnabled = jest.fn();
  const reply = jest.fn();

  beforeEach(async () => {
    listOwnMemories.mockReset().mockResolvedValue([]);
    forgetOwnMemory.mockReset().mockResolvedValue(false);
    clearOwnMemories.mockReset().mockResolvedValue(0);
    setMemoryEnabled.mockReset().mockResolvedValue(undefined);
    isMemoryEnabled.mockReset().mockResolvedValue(true);
    reply.mockReset().mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        DiscordMemoryCommandsService,
        {
          provide: MemoryService,
          useValue: {
            listOwnMemories,
            forgetOwnMemory,
            clearOwnMemories,
            setMemoryEnabled,
            isMemoryEnabled,
          },
        },
      ],
    }).compile();

    service = moduleRef.get(DiscordMemoryCommandsService);
  });

  it('should list only the requesting user memories', async () => {
    await expect(service.handle(message('/memorias'))).resolves.toBe(true);

    expect(listOwnMemories).toHaveBeenCalledWith('user-id');
    expect(reply).toHaveBeenCalled();
  });

  it('should delegate forgetting with the requesting user ID', async () => {
    forgetOwnMemory.mockResolvedValue(true);

    await expect(service.handle(message('/esquecer memory-id'))).resolves.toBe(
      true,
    );

    expect(forgetOwnMemory).toHaveBeenCalledWith('user-id', 'memory-id');
  });

  function message(content: string): Message<true> {
    return {
      content,
      author: { id: 'user-id' },
      reply,
    } as unknown as Message<true>;
  }
});
