import type {
  DiscordUserProfile,
  UpsertDiscordUserInput,
} from '../contracts/discord-user.contract';

export const DISCORD_USER_REPOSITORY = Symbol('DISCORD_USER_REPOSITORY');

export interface DiscordUserRepository {
  upsert(input: UpsertDiscordUserInput): Promise<DiscordUserProfile>;
}
