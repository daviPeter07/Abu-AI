import { Test } from '@nestjs/testing';
import type {
  CreateMemoryInput,
  MemoryRecord,
} from './contracts/memory.contract';
import { MemoryScope, MemoryStatus, MemoryType } from './enums/memory.enums';
import { MemoryService } from './memory.service';
import {
  MEMORY_REPOSITORY,
  type MemoryRepository,
} from './repositories/memory.repository';

describe('MemoryService', () => {
  let memoryService: MemoryService;

  const create = jest.fn<
    ReturnType<MemoryRepository['create']>,
    Parameters<MemoryRepository['create']>
  >();
  const findByUser = jest.fn<
    ReturnType<MemoryRepository['findByUser']>,
    Parameters<MemoryRepository['findByUser']>
  >();
  const findByGroup = jest.fn<
    ReturnType<MemoryRepository['findByGroup']>,
    Parameters<MemoryRepository['findByGroup']>
  >();

  const now = new Date('2026-08-04T12:00:00.000Z');
  const memory: MemoryRecord = {
    id: 'memory-id',
    scope: MemoryScope.USER,
    type: MemoryType.PREFERENCE,
    content: 'Davi gosta de TypeScript',
    normalizedContent: 'davi gosta de typescript',
    subjectDiscordUserId: 'discord-user-id',
    guildId: null,
    confidence: 0.9,
    status: MemoryStatus.ACTIVE,
    sourceDiscordMessageId: 'discord-message-id',
    createdAt: now,
    updatedAt: now,
    lastConfirmedAt: null,
  };

  const validUserInput: CreateMemoryInput = {
    scope: MemoryScope.USER,
    type: MemoryType.PREFERENCE,
    content: '  Davi   GOSTA de TypeScript  ',
    subjectDiscordUserId: ' discord-user-id ',
    confidence: 0.9,
    sourceDiscordMessageId: ' discord-message-id ',
  };

  beforeEach(async () => {
    create.mockReset();
    findByUser.mockReset();
    findByGroup.mockReset();

    create.mockResolvedValue(memory);
    findByUser.mockResolvedValue([memory]);
    findByGroup.mockResolvedValue([memory]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        MemoryService,
        {
          provide: MEMORY_REPOSITORY,
          useValue: {
            create,
            findByUser,
            findByGroup,
          },
        },
      ],
    }).compile();

    memoryService = moduleRef.get(MemoryService);
  });

  it('should validate and normalize a user memory', async () => {
    await expect(memoryService.create(validUserInput)).resolves.toEqual(memory);

    expect(create).toHaveBeenCalledWith({
      scope: MemoryScope.USER,
      type: MemoryType.PREFERENCE,
      content: 'Davi   GOSTA de TypeScript',
      normalizedContent: 'davi gosta de typescript',
      subjectDiscordUserId: 'discord-user-id',
      guildId: undefined,
      confidence: 0.9,
      status: MemoryStatus.ACTIVE,
      sourceDiscordMessageId: 'discord-message-id',
      lastConfirmedAt: undefined,
    });
  });

  it('should create a group memory with an optional subject', async () => {
    await memoryService.create({
      scope: MemoryScope.GROUP,
      type: MemoryType.PROJECT,
      content: 'O grupo está desenvolvendo o Abu',
      subjectDiscordUserId: 'user-id',
      guildId: 'guild-id',
      confidence: 1,
      status: MemoryStatus.ACTIVE,
      lastConfirmedAt: now,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: MemoryScope.GROUP,
        subjectDiscordUserId: 'user-id',
        guildId: 'guild-id',
        lastConfirmedAt: now,
      }),
    );
  });

  it.each([
    {
      input: { ...validUserInput, content: '   ' },
      message: 'O conteúdo da memória é obrigatório',
    },
    {
      input: { ...validUserInput, confidence: -0.1 },
      message: 'A confiança da memória deve estar entre 0 e 1',
    },
    {
      input: { ...validUserInput, confidence: Number.NaN },
      message: 'A confiança da memória deve ser um número finito',
    },
    {
      input: { ...validUserInput, subjectDiscordUserId: undefined },
      message: 'Memórias de usuário exigem um usuário relacionado',
    },
    {
      input: { ...validUserInput, guildId: 'guild-id' },
      message: 'Memórias de usuário não podem pertencer a um servidor',
    },
    {
      input: {
        ...validUserInput,
        scope: MemoryScope.GROUP,
        guildId: undefined,
      },
      message: 'Memórias de grupo exigem um servidor relacionado',
    },
    {
      input: { ...validUserInput, sourceDiscordMessageId: ' ' },
      message: 'O ID da mensagem de origem não pode ser vazio',
    },
    {
      input: { ...validUserInput, lastConfirmedAt: new Date('invalid') },
      message: 'A data de confirmação da memória é inválida',
    },
  ])('should reject invalid memory data', ({ input, message }) => {
    expect(() => memoryService.create(input)).toThrow(message);
  });

  it('should reject unsupported enum values at runtime', () => {
    const invalidInput = {
      ...validUserInput,
      scope: 'INVALID',
    } as unknown as CreateMemoryInput;

    expect(() => memoryService.create(invalidInput)).toThrow(
      'O escopo da memória é inválido',
    );
  });

  it('should find memories by Discord user ID', async () => {
    await expect(memoryService.findByUser(' user-id ')).resolves.toEqual([
      memory,
    ]);

    expect(findByUser).toHaveBeenCalledWith('user-id');
  });

  it('should find memories by Discord guild ID', async () => {
    await expect(memoryService.findByGroup(' guild-id ')).resolves.toEqual([
      memory,
    ]);

    expect(findByGroup).toHaveBeenCalledWith('guild-id');
  });

  it('should reject an empty lookup identifier', () => {
    expect(() => memoryService.findByUser(' ')).toThrow(
      'O ID do usuário do Discord é obrigatório',
    );
  });
});
