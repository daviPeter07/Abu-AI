export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface GenerateAiResponseInput {
  message: string;
  username: string;
}

export interface AiProvider {
  generateResponse(input: GenerateAiResponseInput): Promise<string>;
}
