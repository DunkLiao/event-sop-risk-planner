import { AILocale, AIProviderName } from '../../types/ai.js';

export type AIErrorCode =
  | 'api_key_missing'
  | 'invalid_api_key'
  | 'rate_limit'
  | 'request_failed'
  | 'service_unavailable'
  | 'unsupported_provider';

const LOCALIZED_MESSAGES: Record<AILocale, Record<AIErrorCode, string>> = {
  'zh-TW': {
    api_key_missing: '{{provider}} API Key 未設定。',
    invalid_api_key: '{{provider}} API Key 無效，請確認設定是否正確。',
    rate_limit: '{{provider}} API 請求過於頻繁，請稍後再試。',
    request_failed: '{{provider}} API 請求失敗：{{details}}',
    service_unavailable: '{{provider}} 服務暫時無法使用，請稍後再試。',
    unsupported_provider: '不支援的 AI 供應商：{{provider}}。',
  },
  'zh-CN': {
    api_key_missing: '{{provider}} API Key 未设置。',
    invalid_api_key: '{{provider}} API Key 无效，请确认设置是否正确。',
    rate_limit: '{{provider}} API 请求过于频繁，请稍后再试。',
    request_failed: '{{provider}} API 请求失败：{{details}}',
    service_unavailable: '{{provider}} 服务暂时不可用，请稍后再试。',
    unsupported_provider: '不支持的 AI 供应商：{{provider}}。',
  },
  en: {
    api_key_missing: '{{provider}} API key is not configured.',
    invalid_api_key: '{{provider}} API key is invalid. Please verify your settings.',
    rate_limit: '{{provider}} API rate limit exceeded. Please try again later.',
    request_failed: '{{provider}} API request failed: {{details}}',
    service_unavailable: '{{provider}} service is temporarily unavailable. Please try again later.',
    unsupported_provider: 'Unsupported AI provider: {{provider}}.',
  },
};

const PROVIDER_LABELS: Record<AIProviderName, string> = {
  openai: 'OpenAI',
  claude: 'Claude',
};

export interface AIServiceErrorOptions {
  provider?: AIProviderName;
  statusCode?: number;
  details?: string;
  retryable?: boolean;
  cause?: unknown;
}

const interpolate = (template: string, variables: Record<string, string>): string =>
  template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => variables[key] ?? '');

export const getProviderLabel = (provider?: AIProviderName): string => {
  if (!provider) {
    return 'AI';
  }

  return PROVIDER_LABELS[provider];
};

export const localizeAIErrorMessage = (
  code: AIErrorCode,
  locale: AILocale = 'zh-TW',
  variables: Partial<Record<'provider' | 'details', string>> = {}
): string => {
  const messages = LOCALIZED_MESSAGES[locale] ?? LOCALIZED_MESSAGES['zh-TW'];

  return interpolate(messages[code], {
    provider: variables.provider ?? 'AI',
    details: variables.details ?? '',
  });
};

export class AIServiceError extends Error {
  readonly code: AIErrorCode;
  readonly locale: AILocale;
  readonly provider?: AIProviderName;
  readonly statusCode?: number;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(code: AIErrorCode, locale: AILocale = 'zh-TW', options: AIServiceErrorOptions = {}) {
    const providerLabel = getProviderLabel(options.provider);
    const message = localizeAIErrorMessage(code, locale, {
      provider: providerLabel,
      details: options.details,
    });

    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.locale = locale;
    this.provider = options.provider;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
}

export class RateLimitError extends AIServiceError {
  constructor(locale: AILocale = 'zh-TW', options: AIServiceErrorOptions = {}) {
    super('rate_limit', locale, { ...options, retryable: true });
    this.name = 'RateLimitError';
  }
}

export class InvalidAPIKeyError extends AIServiceError {
  constructor(locale: AILocale = 'zh-TW', options: AIServiceErrorOptions = {}) {
    const code = options.details === 'missing' ? 'api_key_missing' : 'invalid_api_key';
    super(code, locale, { ...options, retryable: false });
    this.name = 'InvalidAPIKeyError';
  }
}
