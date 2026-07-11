import assert from 'node:assert/strict';
import test from 'node:test';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AppSettings } from '../../../types/settings.js';
import { AIProviderName, AIRequest, AIResponse } from '../../../types/ai.js';
import { AIManager } from '../aiManager.js';
import { AIService, ClaudeService, OpenAIService } from '../aiService.js';
import { InvalidAPIKeyError, RateLimitError } from '../errors.js';

const createSettings = (): AppSettings => ({
  ai: {
    defaultProvider: 'openai',
    openai: {
      apiKey: 'sk-test-openai-key-123456',
      model: 'gpt-4o',
    },
    claude: {
      apiKey: 'sk-ant-test-claude-key-123456',
      model: 'claude-3-5-sonnet-20241022',
    },
    openrouter: {
      apiKey: 'sk-or-test-openrouter-key-123456',
      model: 'openai/gpt-4o',
    },
  },
  document: {
    defaultExportFormat: 'both',
    autoSave: true,
    saveDirectory: '',
    templatePreferences: {
      sopTemplate: 'default',
      riskTemplate: 'default',
    },
  },
  general: {
    language: 'zh-TW',
    theme: 'light',
    autoUpdate: true,
    telemetry: false,
  },
});

class MockAIService extends AIService {
  constructor(private readonly responseFactory: () => Promise<AIResponse>) {
    super('sk-test-openai-key-123456', 'gpt-4o', { maxRetries: 1, retryDelayMs: 0 });
  }

  generateCompletion(_request: AIRequest): Promise<AIResponse> {
    return this.responseFactory();
  }
}

test('AIManager validates missing API key', () => {
  const settings = createSettings();
  settings.ai.openai.apiKey = '';

  const manager = new AIManager({ settingsProvider: () => settings });

  assert.throws(() => manager.validateApiKey('openai'), error => {
    assert.ok(error instanceof InvalidAPIKeyError);
    assert.match(error.message, /API Key/);
    return true;
  });
});

test('OpenAIService retries rate-limit errors and eventually succeeds', async () => {
  let attempts = 0;
  const client = {
    chat: {
      completions: {
        create: async () => {
          attempts += 1;

          if (attempts < 3) {
            throw Object.assign(new Error('rate limit'), { name: 'RateLimitError', status: 429 });
          }

          return {
            choices: [
              {
                message: { content: '成功回應' },
                finish_reason: 'stop',
              },
            ],
            usage: {
              prompt_tokens: 12,
              completion_tokens: 8,
              total_tokens: 20,
            },
          };
        },
      },
    },
  } as unknown as Pick<OpenAI, 'chat'>;

  const service = new OpenAIService('sk-test-openai-key-123456', 'gpt-4o', {
    retryDelayMs: 0,
    client,
  });

  const response = await service.generateCompletion({ prompt: 'hello' });

  assert.equal(attempts, 3);
  assert.equal(response.content, '成功回應');
  assert.deepEqual(response.usage, {
    promptTokens: 12,
    completionTokens: 8,
    totalTokens: 20,
  });
});

test('ClaudeService converts authentication failures to InvalidAPIKeyError', async () => {
  const client = {
    messages: {
      create: async () => {
        throw Object.assign(new Error('invalid x-api-key'), { name: 'AuthenticationError', status: 401 });
      },
    },
  } as unknown as Pick<Anthropic, 'messages'>;

  const service = new ClaudeService('sk-ant-test-claude-key-123456', 'claude-3-5-sonnet-20241022', {
    retryDelayMs: 0,
    client,
  });

  await assert.rejects(service.generateCompletion({ prompt: 'hello' }), error => {
    assert.ok(error instanceof InvalidAPIKeyError);
    assert.match(error.message, /API Key/);
    return true;
  });
});

test('AIManager caches identical prompts for five minutes', async () => {
  let callCount = 0;
  const settings = createSettings();
  const manager = new AIManager({
    settingsProvider: () => settings,
    serviceFactory: (_provider: AIProviderName) =>
      new MockAIService(async () => {
        callCount += 1;
        return {
          content: 'cached result',
          provider: 'openai',
          model: 'gpt-4o',
          cached: false,
        };
      }),
  });

  const request: AIRequest = {
    prompt: '請產出 SOP',
    systemPrompt: 'system',
    provider: 'openai',
  };

  const first = await manager.generateCompletion(request);
  const second = await manager.generateCompletion(request);

  assert.equal(callCount, 1);
  assert.equal(first.cached, false);
  assert.equal(second.cached, true);
});

test('OpenAIService throws RateLimitError after exhausting retries', async () => {
  const client = {
    chat: {
      completions: {
        create: async () => {
          throw Object.assign(new Error('rate limit'), { name: 'RateLimitError', status: 429 });
        },
      },
    },
  } as unknown as Pick<OpenAI, 'chat'>;

  const service = new OpenAIService('sk-test-openai-key-123456', 'gpt-4o', {
    retryDelayMs: 0,
    client,
  });

  await assert.rejects(service.generateCompletion({ prompt: 'hello' }), error => {
    assert.ok(error instanceof RateLimitError);
    return true;
  });
});
