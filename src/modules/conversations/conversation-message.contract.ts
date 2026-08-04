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
}
