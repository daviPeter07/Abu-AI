import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  GenerateAiResponseInput,
} from '../contracts/ai-provider.contract';

@Injectable()
export class MockAiProvider implements AiProvider {
  async generateResponse(
    input: GenerateAiResponseInput,
  ): Promise<string> {
    return Promise.resolve(
      `Olá, ${input.username}! Recebi sua mensagem: "${input.message}"`,
    );
  }
}