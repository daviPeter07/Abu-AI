import { Test } from '@nestjs/testing';
import type {
  CreateMemoryInput,
  MemoryRecord,
} from './contracts/memory.contract';
import { MemoryScope, MemoryStatus, MemoryType } from './enums/memory.enums';
import { MemoryService } from './memory.service';
import { MemoryExtractorService } from './memory-extractor.service';
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
  const findActiveCandidates = jest.fn<
    ReturnType<MemoryRepository['findActiveCandidates']>,
    Parameters<MemoryRepository['findActiveCandidates']>
  >();
  const createExtracted = jest.fn<
    ReturnType<MemoryRepository['createExtracted']>,
    Parameters<MemoryRepository['createExtracted']>
  >();
  const confirmExtracted = jest.fn<
    ReturnType<MemoryRepository['confirmExtracted']>,
    Parameters<MemoryRepository['confirmExtracted']>
  >();
  const supersedeExtracted = jest.fn<
    ReturnType<MemoryRepository['supersedeExtracted']>,
    Parameters<MemoryRepository['supersedeExtracted']>
  >();
  const extract = jest.fn();

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
    findActiveCandidates.mockReset();
    createExtracted.mockReset();
    confirmExtracted.mockReset();
    supersedeExtracted.mockReset();
    extract.mockReset();

    create.mockResolvedValue(memory);
    findByUser.mockResolvedValue([memory]);
    findByGroup.mockResolvedValue([memory]);
    findActiveCandidates.mockResolvedValue([]);
    createExtracted.mockResolvedValue(true);
    confirmExtracted.mockResolvedValue(true);
    supersedeExtracted.mockResolvedValue(true);
    extract.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        MemoryService,
        {
          provide: MEMORY_REPOSITORY,
          useValue: {
            create,
            findByUser,
            findByGroup,
            findActiveCandidates,
            createExtracted,
            confirmExtracted,
            supersedeExtracted,
          },
        },
        {
          provide: MemoryExtractorService,
          useValue: {
            extract,
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

  it('should persist a new extracted memory with idempotent evidence', async () => {
    extract.mockResolvedValue([
      {
        scope: MemoryScope.USER,
        type: MemoryType.PREFERENCE,
        subjectDiscordUserId: 'discord-user-id',
        content: 'Davi gosta de TypeScript',
        confidence: 0.9,
      },
    ]);

    await memoryService.extractFromMessage({
      discordMessageId: 'discord-message-id',
      guildId: 'guild-id',
      authorDiscordUserId: 'discord-user-id',
      authorName: 'Davi',
      content: 'Eu gosto de TypeScript',
      discordCreatedAt: now,
    });

    expect(createExtracted).toHaveBeenCalledWith(
      expect.objectContaining({
        normalizedContent: 'davi gosta de typescript',
        sourceDiscordMessageId: 'discord-message-id',
      }),
      expect.any(Object),
    );
    const evidence = createExtracted.mock.calls[0]?.[1];

    expect(evidence?.sourceDiscordMessageId).toBe('discord-message-id');
    expect(evidence?.idempotencyKey).toHaveLength(64);
  });

  it('should confirm an equivalent active memory', async () => {
    findActiveCandidates.mockResolvedValue([memory]);
    extract.mockResolvedValue([
      {
        scope: MemoryScope.USER,
        type: MemoryType.PREFERENCE,
        subjectDiscordUserId: 'discord-user-id',
        content: 'Davi gosta de TypeScript',
        confidence: 0.5,
      },
    ]);

    await memoryService.extractFromMessage({
      discordMessageId: 'new-message-id',
      guildId: 'guild-id',
      authorDiscordUserId: 'discord-user-id',
      authorName: 'Davi',
      content: 'Ainda gosto de TypeScript',
      discordCreatedAt: now,
    });

    expect(confirmExtracted).toHaveBeenCalledWith(
      expect.objectContaining({
        memoryId: 'memory-id',
        confidence: 0.95,
      }),
    );
  });

  it('should supersede an active memory without deleting its history', async () => {
    findActiveCandidates.mockResolvedValue([memory]);
    extract.mockResolvedValue([
      {
        scope: MemoryScope.USER,
        type: MemoryType.PREFERENCE,
        subjectDiscordUserId: 'discord-user-id',
        content: 'Davi prefere NestJS',
        confidence: 0.95,
        supersedesMemoryId: 'memory-id',
      },
    ]);

    await memoryService.extractFromMessage({
      discordMessageId: 'new-message-id',
      guildId: 'guild-id',
      authorDiscordUserId: 'discord-user-id',
      authorName: 'Davi',
      content: 'Agora prefiro NestJS',
      discordCreatedAt: now,
    });

    const supersedeInput = supersedeExtracted.mock.calls[0]?.[0];

    expect(supersedeInput?.supersededMemoryId).toBe('memory-id');
    expect(supersedeInput?.memory.status).toBe(MemoryStatus.ACTIVE);
    expect(supersedeInput?.memory.normalizedContent).toBe(
      'davi prefere nestjs',
    );
  });
});
