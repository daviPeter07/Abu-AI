import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import type { DiscordUserProfile } from '../contracts/discord-user.contract';
import { PrismaDiscordUserRepository } from './prisma-discord-user.repository';

describe('PrismaDiscordUserRepository', () => {
  let repository: PrismaDiscordUserRepository;

  const upsert = jest.fn();
  const seenAt = new Date('2026-08-04T12:00:00.000Z');
  const profile: DiscordUserProfile = {
    id: 'internal-user-id',
    discordUserId: 'discord-user-id',
    username: 'davi',
    displayName: 'Davi',
    firstSeenAt: seenAt,
    lastSeenAt: seenAt,
    createdAt: seenAt,
    updatedAt: seenAt,
  };

  beforeEach(async () => {
    upsert.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaDiscordUserRepository,
        {
          provide: PrismaService,
          useValue: {
            discordUser: {
              upsert,
            },
          },
        },
      ],
    }).compile();

    repository = moduleRef.get(PrismaDiscordUserRepository);
  });

  it('should create or update a profile using the Discord user ID', async () => {
    upsert.mockResolvedValue(profile);

    await expect(
      repository.upsert({
        discordUserId: 'discord-user-id',
        username: 'davi',
        displayName: 'Davi',
        seenAt,
      }),
    ).resolves.toEqual(profile);

    expect(upsert).toHaveBeenCalledWith({
      where: {
        discordUserId: 'discord-user-id',
      },
      create: {
        discordUserId: 'discord-user-id',
        username: 'davi',
        displayName: 'Davi',
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
      },
      update: {
        username: 'davi',
        displayName: 'Davi',
        lastSeenAt: seenAt,
      },
    });
  });
});
