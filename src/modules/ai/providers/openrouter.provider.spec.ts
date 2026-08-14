import { ConfigService } from '@nestjs/config';
import { OpenRouter } from '@openrouter/sdk';
import { ObservabilityService } from '../../observability/observability.service';
import { AiProviderError } from '../errors/ai-provider.error';
import { OpenRouterProvider } from './openrouter.provider';

jest.mock('@openrouter/sdk', () => ({
  OpenRouter: jest.fn(),
}));

const mockedOpenRouter = OpenRouter as unknown as jest.Mock;
const chatSendMock = jest.fn();

describe('OpenRouterProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedOpenRouter.mockImplementation(() => ({
      chat: { send: chatSendMock },
    }));
  });

  function createProvider(): OpenRouterProvider {
    const configValues: Record<string, number | string> = {
      'app.openRouter.apiKey': 'sk-test',
      'app.openRouter.model': 'model-x',
      'app.openRouter.requestTimeoutMs': 30_000,
      'app.openRouter.retryInitialDelayMs': 500,
      'app.openRouter.retryMaxDelayMs': 2_000,
      'app.openRouter.retryMaxElapsedTimeMs': 60_000,
    };
    const configService = {
      getOrThrow: jest.fn((key: string) => configValues[key]),
    } as unknown as ConfigService;

    return new OpenRouterProvider(configService, new ObservabilityService());
  }

  it('should return the trimmed content on success', async () => {
    chatSendMock.mockResolvedValueOnce({
      choices: [{ message: { content: '  olá  ' } }],
    });

    const provider = createProvider();

    await expect(
      provider.generateResponse({
        messages: [{ role: 'user', content: 'oi' }],
      }),
    ).resolves.toBe('olá');
  });

  it('should throw the real error when the SDK resolves an error envelope', async () => {
    const timeoutError = new Error('Request timed out');
    timeoutError.name = 'RequestTimeoutError';
    chatSendMock.mockResolvedValueOnce({ ok: false, error: timeoutError });

    const provider = createProvider();

    await expect(
      provider.generateResponse({
        messages: [{ role: 'user', content: 'oi' }],
      }),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('should classify the status code of an error envelope', async () => {
    chatSendMock.mockResolvedValueOnce({
      ok: false,
      error: { statusCode: 429 },
    });

    const provider = createProvider();

    await expect(
      provider.generateResponse({
        messages: [{ role: 'user', content: 'oi' }],
      }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('should reject on empty content from the provider', async () => {
    chatSendMock.mockResolvedValueOnce({
      choices: [{ message: { content: '   ' } }],
    });

    const provider = createProvider();

    await expect(
      provider.generateResponse({
        messages: [{ role: 'user', content: 'oi' }],
      }),
    ).rejects.toBeInstanceOf(AiProviderError);
  });
});
