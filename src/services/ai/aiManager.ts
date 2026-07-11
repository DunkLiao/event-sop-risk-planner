import { useSettingsStore } from '../../store/settingsStore.js';
import { AIRequest, AIResponse, AILocale, AIProviderName } from '../../types/ai.js';
import { AppSettings } from '../../types/settings.js';
import { AIService, AIServiceFactory } from './aiService.js';
import { AIServiceError, InvalidAPIKeyError, RateLimitError } from './errors.js';

interface CacheEntry {
  expiresAt: number;
  response: AIResponse;
}

export interface AIManagerOptions {
  cacheTtlMs?: number;
  minRequestIntervalMs?: number;
  settingsProvider?: () => AppSettings | null;
  serviceFactory?: (
    provider: AIProviderName,
    apiKey: string,
    model: string,
    locale: AILocale
  ) => AIService;
}

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MIN_REQUEST_INTERVAL_MS = 750;

/**
 * 統一管理 OpenAI 與 Claude 請求。
 */
export class AIManager {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly queueTails = new Map<AIProviderName, Promise<void>>();
  private readonly lastRequestAt = new Map<AIProviderName, number>();
  private readonly cacheTtlMs: number;
  private readonly minRequestIntervalMs: number;
  private readonly settingsProvider: () => AppSettings | null;
  private readonly serviceFactory: (
    provider: AIProviderName,
    apiKey: string,
    model: string,
    locale: AILocale
  ) => AIService;

  constructor(options: AIManagerOptions = {}) {
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.minRequestIntervalMs = options.minRequestIntervalMs ?? DEFAULT_MIN_REQUEST_INTERVAL_MS;
    this.settingsProvider = options.settingsProvider ?? (() => useSettingsStore.getState().settings);
    this.serviceFactory = options.serviceFactory ?? AIServiceFactory.createService;
  }

  validateApiKey(provider: AIProviderName): boolean {
    const settings = this.getSettings();
    const providerSettings = settings.ai[provider];

    if (!providerSettings.apiKey.trim()) {
      throw new InvalidAPIKeyError(this.getLocale(settings), { provider, details: 'missing' });
    }

    return true;
  }

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const settings = this.getSettings();
    const locale = request.locale ?? this.getLocale(settings);
    const candidates = this.getCandidateProviders(request.provider, settings);

    if (candidates.length === 0) {
      throw new InvalidAPIKeyError(locale, { provider: request.provider, details: 'missing' });
    }

    let lastError: unknown;

    for (const provider of candidates) {
      const providerSettings = settings.ai[provider];
      const effectiveRequest: AIRequest = {
        ...request,
        provider,
        model: request.model ?? providerSettings.model,
        temperature: request.temperature ?? providerSettings.temperature,
        maxTokens: request.maxTokens ?? providerSettings.maxTokens,
        locale,
      };

      try {
        const cachedResponse = await this.getCachedResponse(effectiveRequest);
        if (cachedResponse) {
          return cachedResponse;
        }

        this.validateApiKey(provider);

        const response = await this.enqueue(provider, async () => {
          const service = this.serviceFactory(provider, providerSettings.apiKey, effectiveRequest.model ?? providerSettings.model, locale);
          return service.generateCompletion(effectiveRequest);
        });

        this.setCache(effectiveRequest, response);
        return response;
      } catch (error) {
        lastError = error;

        if (request.provider || error instanceof InvalidAPIKeyError) {
          throw error;
        }

        if (!(error instanceof RateLimitError || error instanceof AIServiceError)) {
          throw error;
        }
      }
    }

    throw (
      lastError ??
      new AIServiceError('service_unavailable', locale, {
        provider: request.provider,
      })
    );
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getSettings(): AppSettings {
    return this.settingsProvider() ?? useSettingsStore.getState().settings ?? useSettingsStore.getInitialState().settings!;
  }

  private getLocale(settings: AppSettings): AILocale {
    return settings.general.language;
  }

  private getCandidateProviders(preferred: AIProviderName | undefined, settings: AppSettings): AIProviderName[] {
    if (preferred) {
      return [preferred];
    }

    const orderedProviders: AIProviderName[] = [settings.ai.defaultProvider];
    const fallbackProvider: AIProviderName = settings.ai.defaultProvider === 'openai' ? 'claude' : 'openai';

    if (!orderedProviders.includes(fallbackProvider)) {
      orderedProviders.push(fallbackProvider);
    }

    return orderedProviders.filter(provider => Boolean(settings.ai[provider].apiKey.trim()));
  }

  private async getCachedResponse(request: AIRequest): Promise<AIResponse | null> {
    if (request.useCache === false) {
      return null;
    }

    this.pruneExpiredCache();
    const cacheKey = this.buildCacheKey(request);
    const cached = this.cache.get(cacheKey);

    if (!cached || cached.expiresAt <= Date.now()) {
      return null;
    }

    if (request.stream && request.onChunk) {
      await request.onChunk(cached.response.content);
    }

    return {
      ...cached.response,
      cached: true,
    };
  }

  private setCache(request: AIRequest, response: AIResponse): void {
    if (request.useCache === false) {
      return;
    }

    this.cache.set(this.buildCacheKey(request), {
      response: { ...response, cached: false },
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  private buildCacheKey(request: AIRequest): string {
    return JSON.stringify({
      provider: request.provider,
      model: request.model,
      prompt: request.prompt,
      systemPrompt: request.systemPrompt,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });
  }

  private pruneExpiredCache(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  private enqueue<T>(provider: AIProviderName, task: () => Promise<T>): Promise<T> {
    const previousTail = this.queueTails.get(provider) ?? Promise.resolve();

    const execution = previousTail.catch(() => undefined).then(async () => {
      const lastRequestAt = this.lastRequestAt.get(provider) ?? 0;
      const waitMs = Math.max(0, this.minRequestIntervalMs - (Date.now() - lastRequestAt));

      if (waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }

      try {
        return await task();
      } finally {
        this.lastRequestAt.set(provider, Date.now());
      }
    });

    this.queueTails.set(
      provider,
      execution
        .then(() => undefined)
        .catch(() => undefined)
    );

    return execution;
  }
}

export const aiManager = new AIManager();
