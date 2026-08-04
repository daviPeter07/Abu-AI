export type ConversationMessage =
  | {
      role: 'user';
      username: string;
      content: string;
    }
  | {
      role: 'assistant';
      content: string;
    };

export interface GenerateConversationReplyInput {
  content: string;
  username: string;
  recentMessages: ConversationMessage[];
  relevantMemories?: string[];
}

export type PersistedConversationMessageRole = 'USER' | 'ASSISTANT';

export interface PersistConversationMessageInput {
  discordMessageId: string;
  guildId: string;
  channelId: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  role: PersistedConversationMessageRole;
  content: string;
  discordCreatedAt: Date;
}

export interface ProcessConversationMessageInput {
  message: PersistConversationMessageInput;
  sendReply: (content: string) => Promise<PersistConversationMessageInput>;
}
