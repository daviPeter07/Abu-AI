export const AI_PROVIDER = Symbol('AI_PROVIDER');

export type AiMessageRole = 'system' | 'user' | 'assistant';

export interface AiMessage {
  role: AiMessageRole;
  content: string;
}

export interface GenerateAiResponseInput {
  messages: AiMessage[];
}

export interface AiProvider {
  generateResponse(input: GenerateAiResponseInput): Promise<string>;
}
