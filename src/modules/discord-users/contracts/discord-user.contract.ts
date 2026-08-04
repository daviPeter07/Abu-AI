export interface UpsertDiscordUserInput {
  discordUserId: string;
  username: string;
  displayName: string;
  seenAt: Date;
}

export interface DiscordUserProfile {
  id: string;
  discordUserId: string;
  username: string | null;
  displayName: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
