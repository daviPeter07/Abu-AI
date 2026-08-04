import { Inject, Injectable } from '@nestjs/common';
import {
  AI_PROVIDER,
  type AiProvider,
  type GenerateAiResponseInput,
} from './contracts/ai-provider.contract';

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER)
    private readonly aiProvider: AiProvider,
  ) {}

  generateResponse(input: GenerateAiResponseInput): Promise<string> {
    return this.aiProvider.generateResponse(input);
  }
}
