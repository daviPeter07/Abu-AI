import type {
  ConversationMessage,
  PersistConversationMessageInput,
} from '../conversation-message.contract';

export const CONVERSATION_MESSAGE_REPOSITORY = Symbol(
  'CONVERSATION_MESSAGE_REPOSITORY',
);

export interface FindRecentConversationMessagesInput {
  guildId: string;
  channelId: string;
  excludeDiscordMessageId: string;
  beforeDiscordCreatedAt: Date;
  limit: number;
}

export interface ConversationMessageRepository {
  createIfNotExists(input: PersistConversationMessageInput): Promise<boolean>;
  findRecentByChannel(
    input: FindRecentConversationMessagesInput,
  ): Promise<ConversationMessage[]>;
}
