import type {
  AIProvider,
  ApiKeyConnectionResult,
  ApiKeyValidationResult,
} from '../types/settings.js';

const OPENAI_KEY_PATTERN = /^sk-.{16,}$/;
const CLAUDE_KEY_PATTERN = /^sk-ant-.{16,}$/;
const OPENROUTER_KEY_PATTERN = /^sk-or-.{8,}$/;
const CONNECTION_TIMEOUT_MS = 10000;

const withTimeout = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const maskApiKey = (apiKey: string): string => {
  const trimmedKey = apiKey.trim();

  if (trimmedKey.length <= 8) {
    return `${trimmedKey.slice(0, 2)}***`;
  }

  return `${trimmedKey.slice(0, 4)}...${trimmedKey.slice(-3)}`;
};

export const validateApiKeyFormat = (
  provider: AIProvider,
  apiKey: string
): ApiKeyValidationResult => {
  const trimmedKey = apiKey.trim();

  if (!trimmedKey) {
    return {
      isValid: false,
      message: 'API Key 不可為空白。',
    };
  }

  const isValid =
    provider === 'openai'
      ? OPENAI_KEY_PATTERN.test(trimmedKey)
      : provider === 'claude'
        ? CLAUDE_KEY_PATTERN.test(trimmedKey)
        : OPENROUTER_KEY_PATTERN.test(trimmedKey);

  return {
    isValid,
    message: isValid
      ? 'API Key 格式正確。'
      : provider === 'openai'
        ? 'OpenAI API Key 格式應以 sk- 開頭。'
        : provider === 'claude'
          ? 'Claude API Key 格式應以 sk-ant- 開頭。'
          : 'OpenRouter API Key 格式應以 sk-or- 開頭。',
  };
};

export const isValidApiKey = (apiKey: string, provider: AIProvider): boolean =>
  validateApiKeyFormat(provider, apiKey).isValid;

export const testApiKeyConnection = async (
  provider: AIProvider,
  apiKey: string
): Promise<ApiKeyConnectionResult> => {
  const validation = validateApiKeyFormat(provider, apiKey);

  if (!validation.isValid) {
    return {
      success: false,
      message: validation.message,
    };
  }

  try {
    const trimmedKey = apiKey.trim();

    const response =
      provider === 'openai'
        ? await withTimeout('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${trimmedKey}`,
            },
          })
        : provider === 'claude'
          ? await withTimeout('https://api.anthropic.com/v1/models', {
              method: 'GET',
              headers: {
                'x-api-key': trimmedKey,
                'anthropic-version': '2023-06-01',
              },
            })
          : await withTimeout('https://openrouter.ai/api/v1/key', {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${trimmedKey}`,
              },
            });

    if (response.ok) {
      return {
        success: true,
        message: 'API 連線測試成功。',
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: 'API Key 無效或權限不足。',
      };
    }

    return {
      success: false,
      message: `API 連線測試失敗（HTTP ${response.status}）。`,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.name === 'AbortError'
          ? 'API 連線測試逾時。'
          : `API 連線測試失敗：${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
