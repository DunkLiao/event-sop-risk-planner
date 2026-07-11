import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AIRequest, AIResponse, AILocale, AIProviderName } from '../../types/ai.js';
import { isValidApiKey } from '../../utils/validators.js';
import { AIServiceError, InvalidAPIKeyError, RateLimitError } from './errors.js';

interface RetryConfig {
  locale?: AILocale;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface OpenAIServiceOptions extends RetryConfig {
  client?: Pick<OpenAI, 'chat'>;
  providerName?: AIProviderName;
}

export interface ClaudeServiceOptions extends RetryConfig {
  client?: Pick<Anthropic, 'messages'>;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * AI 服務基礎類別
 */
export abstract class AIService {
  protected readonly apiKey: string;
  protected readonly model: string;
  protected readonly locale: AILocale;
  protected readonly maxRetries: number;
  protected readonly retryDelayMs: number;

  constructor(apiKey: string, model: string, config: RetryConfig = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.locale = config.locale ?? 'zh-TW';
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelayMs = config.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  }

  abstract generateCompletion(request: AIRequest): Promise<AIResponse>;

  protected validateApiKey(provider: AIProviderName): void {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new InvalidAPIKeyError(this.locale, { provider, details: 'missing' });
    }

    if (!isValidApiKey(this.apiKey, provider)) {
      throw new InvalidAPIKeyError(this.locale, { provider });
    }
  }

  protected async executeWithRetry<T>(provider: AIProviderName, operation: () => Promise<T>): Promise<T> {
    let attempt = 0;
    let lastError: AIServiceError | null = null;

    while (attempt < this.maxRetries) {
      attempt += 1;

      try {
        return await operation();
      } catch (error) {
        const normalizedError = this.normalizeError(provider, error);
        lastError = normalizedError;

        if (!normalizedError.retryable || attempt >= this.maxRetries) {
          throw normalizedError;
        }

        const delayMs = this.retryDelayMs * Math.pow(2, attempt - 1);
        await this.sleep(delayMs);
      }
    }

    throw (
      lastError ??
      new AIServiceError('service_unavailable', this.locale, {
        provider,
        retryable: false,
      })
    );
  }

  protected normalizeError(provider: AIProviderName, error: unknown): AIServiceError {
    if (error instanceof AIServiceError) {
      return error;
    }

    const statusCode = this.getStatusCode(error);
    const errorName = this.getErrorName(error);
    const details = this.getErrorMessage(error);

    if (statusCode === 401 || statusCode === 403 || errorName.includes('AuthenticationError')) {
      return new InvalidAPIKeyError(this.locale, {
        provider,
        statusCode,
        details,
        cause: error,
      });
    }

    if (statusCode === 429 || errorName.includes('RateLimitError')) {
      return new RateLimitError(this.locale, {
        provider,
        statusCode,
        details,
        cause: error,
      });
    }

    const retryable = Boolean(
      (typeof statusCode === 'number' && statusCode >= 500) ||
        errorName.includes('APIConnection') ||
        errorName.includes('Timeout') ||
        errorName.includes('Retryable')
    );

    return new AIServiceError(retryable ? 'service_unavailable' : 'request_failed', this.locale, {
      provider,
      statusCode,
      details,
      retryable,
      cause: error,
    });
  }

  protected buildResponse(
    provider: AIProviderName,
    content: string,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined,
    finishReason?: string
  ): AIResponse {
    return {
      content,
      provider,
      model: this.model,
      usage,
      finishReason,
    };
  }

  protected async emitChunk(request: AIRequest, chunk: string | null | undefined): Promise<void> {
    if (!chunk || !request.onChunk) {
      return;
    }

    await request.onChunk(chunk);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getStatusCode(error: unknown): number | undefined {
    if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
      return error.status;
    }

    return undefined;
  }

  private getErrorName(error: unknown): string {
    if (error instanceof Error) {
      return error.name;
    }

    if (typeof error === 'object' && error !== null && 'name' in error && typeof error.name === 'string') {
      return error.name;
    }

    return 'Error';
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown error';
  }
}

/**
 * OpenAI 服務
 */
export class OpenAIService extends AIService {
  protected readonly providerName: AIProviderName = 'openai';
  protected readonly client: Pick<OpenAI, 'chat'>;

  constructor(apiKey: string, model: string, options: OpenAIServiceOptions = {}) {
    super(apiKey, model, options);
    this.client = options.client ?? new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    if (options.providerName) {
      this.providerName = options.providerName;
    }
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    this.validateApiKey(this.providerName);

    return this.executeWithRetry(this.providerName, async () => {
      const resolvedModel = request.model ?? this.model;
      const messages = [] as Array<{ role: 'system' | 'user'; content: string }>;

      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }

      messages.push({ role: 'user', content: request.prompt });

      if (request.stream) {
        const stream = await this.client.chat.completions.create({
          model: resolvedModel,
          messages,
          temperature: request.temperature,
          max_completion_tokens: request.maxTokens,
          stream: true,
          stream_options: { include_usage: true },
        });

        let content = '';
        let finishReason: string | undefined;
        let usage: AIResponse['usage'];

        for await (const chunk of stream) {
          const choice = chunk.choices[0];
          const delta = choice?.delta?.content ?? '';

          if (delta) {
            content += delta;
            await this.emitChunk(request, delta);
          }

          if (choice?.finish_reason) {
            finishReason = choice.finish_reason;
          }

          if (chunk.usage) {
            usage = {
              promptTokens: chunk.usage.prompt_tokens,
              completionTokens: chunk.usage.completion_tokens,
              totalTokens: chunk.usage.total_tokens,
            };
          }
        }

        return {
          ...this.buildResponse(this.providerName, content, usage, finishReason),
          model: resolvedModel,
        };
      }

      const completion = await this.client.chat.completions.create({
        model: resolvedModel,
        messages,
        temperature: request.temperature,
        max_completion_tokens: request.maxTokens,
      });

      const choice = completion.choices[0];
      const content = choice?.message?.content ?? '';
      const usage = completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined;

      return {
        ...this.buildResponse(this.providerName, content, usage, choice?.finish_reason ?? undefined),
        model: resolvedModel,
      };
    });
  }
}

/**
 * Claude 服務
 */
export class ClaudeService extends AIService {
  private readonly client: Pick<Anthropic, 'messages'>;

  constructor(apiKey: string, model: string, options: ClaudeServiceOptions = {}) {
    super(apiKey, model, options);
    this.client = options.client ?? new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    this.validateApiKey('claude');

    return this.executeWithRetry('claude', async () => {
      const resolvedModel = request.model ?? this.model;
      const baseRequest = {
        model: resolvedModel,
        system: request.systemPrompt,
        messages: [{ role: 'user' as const, content: request.prompt }],
        max_tokens: request.maxTokens ?? 4000,
        temperature: request.temperature,
      };

      if (request.stream) {
        const stream = await this.client.messages.create({
          ...baseRequest,
          stream: true,
        });

        let content = '';
        let finishReason: string | undefined;
        let usage: AIResponse['usage'];

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            content += event.delta.text;
            await this.emitChunk(request, event.delta.text);
          }

          if (event.type === 'message_delta') {
            finishReason = event.delta.stop_reason ?? finishReason;
            usage = {
              promptTokens: event.usage.input_tokens ?? 0,
              completionTokens: event.usage.output_tokens,
              totalTokens:
                (event.usage.input_tokens ?? 0) +
                (event.usage.cache_creation_input_tokens ?? 0) +
                (event.usage.cache_read_input_tokens ?? 0) +
                event.usage.output_tokens,
            };
          }
        }

        return {
          ...this.buildResponse('claude', content, usage, finishReason),
          model: resolvedModel,
        };
      }

      const message = await this.client.messages.create(baseRequest);

      const content = message.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');
      const usage = message.usage
        ? {
            promptTokens:
              (message.usage.input_tokens ?? 0) +
              (message.usage.cache_creation_input_tokens ?? 0) +
              (message.usage.cache_read_input_tokens ?? 0),
            completionTokens: message.usage.output_tokens,
            totalTokens:
              (message.usage.input_tokens ?? 0) +
              (message.usage.cache_creation_input_tokens ?? 0) +
              (message.usage.cache_read_input_tokens ?? 0) +
              message.usage.output_tokens,
          }
        : undefined;

      return {
        ...this.buildResponse('claude', content, usage, message.stop_reason ?? undefined),
        model: resolvedModel,
      };
    });
  }
}

/**
 * OpenRouter 服務（OpenAI 相容 API）
 */
export class OpenRouterService extends OpenAIService {
  constructor(apiKey: string, model: string, options: OpenAIServiceOptions = {}) {
    const client = options.client ?? new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: true,
    });
    super(apiKey, model, { ...options, client, providerName: 'openrouter' });
  }
}

/**
 * AI 服務工廠
 */
export class AIServiceFactory {
  static createService(
    provider: AIProviderName,
    apiKey: string,
    model: string,
    locale: AILocale = 'zh-TW'
  ): AIService {
    switch (provider) {
      case 'openai':
        return new OpenAIService(apiKey, model, { locale });
      case 'claude':
        return new ClaudeService(apiKey, model, { locale });
      case 'openrouter':
        return new OpenRouterService(apiKey, model, { locale });
      default:
        throw new AIServiceError('unsupported_provider', locale, { provider });
    }
  }
}
