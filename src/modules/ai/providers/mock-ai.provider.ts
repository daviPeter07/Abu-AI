import { Injectable } from '@nestjs/common';
import type {
  AiProvider,
  GenerateAiResponseInput,
} from '../contracts/ai-provider.contract';

@Injectable()
export class MockAiProvider implements AiProvider {
  generateResponse(input: GenerateAiResponseInput): Promise<string> {
    const userMessage = [...input.messages]
      .reverse()
      .find((message) => message.role === 'user');

    return Promise.resolve(`Mock response: ${userMessage?.content ?? ''}`);
  }
}
