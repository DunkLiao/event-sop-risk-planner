import { ipcMain } from 'electron';
import type { AIProvider, ApiKeySaveResult, ApiKeyValidationResult } from '../../src/types/settings';
import { maskApiKey, validateApiKeyFormat } from '../../src/utils/apiKeyValidator';
import { getApiKey, removeApiKey, setApiKey } from '../store/secureStore';

const registerHandler = <T extends unknown[]>(
  channel: string,
  handler: (_event: Electron.IpcMainInvokeEvent, ...args: T) => Promise<unknown> | unknown
): void => {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
};

export const registerSettingsHandlers = (): void => {
  registerHandler('save-api-key', (_event, provider: AIProvider, key: string): ApiKeySaveResult => {
    const validation = validateApiKeyFormat(provider, key);

    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message,
        maskedKey: null,
      };
    }

    setApiKey(provider, key);

    return {
      success: true,
      message: 'API Key 已安全儲存。',
      maskedKey: maskApiKey(key),
    };
  });

  registerHandler('get-api-key', (_event, provider: AIProvider): string | null => {
    const apiKey = getApiKey(provider);
    return apiKey ? maskApiKey(apiKey) : null;
  });

  registerHandler(
    'validate-api-key',
    (_event, provider: AIProvider, key: string): ApiKeyValidationResult =>
      validateApiKeyFormat(provider, key)
  );

  registerHandler('remove-api-key', (_event, provider: AIProvider) => {
    removeApiKey(provider);
    return true;
  });
};
