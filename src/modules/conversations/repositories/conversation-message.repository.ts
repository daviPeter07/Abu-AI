import type { PersistConversationMessageInput } from '../conversation-message.contract';

export const CONVERSATION_MESSAGE_REPOSITORY = Symbol(
  'CONVERSATION_MESSAGE_REPOSITORY',
);

export interface ConversationMessageRepository {
  createIfNotExists(input: PersistConversationMessageInput): Promise<boolean>;
}
