import { safeStorage } from 'electron';
import type { AIProvider } from '../../src/types/settings';
import { createSecureStore } from './config';

let secureStoreInstance: ReturnType<typeof createSecureStore> | null = null;

const getStore = (): ReturnType<typeof createSecureStore> => {
  if (!secureStoreInstance) {
    secureStoreInstance = createSecureStore();
  }

  return secureStoreInstance;
};

const getStoreKey = (provider: AIProvider): 'apiKeys.openai' | 'apiKeys.claude' =>
  provider === 'openai' ? 'apiKeys.openai' : 'apiKeys.claude';

const ensureSafeStorage = (): void => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('目前作業系統不支援 safeStorage。');
  }
};

const encryptValue = (value: string): string => {
  ensureSafeStorage();
  return safeStorage.encryptString(value).toString('base64');
};

const decryptValue = (value: string): string => {
  ensureSafeStorage();
  return safeStorage.decryptString(Buffer.from(value, 'base64'));
};

export const setApiKey = (provider: AIProvider, key: string): void => {
  const trimmedKey = key.trim();

  if (!trimmedKey) {
    throw new Error('API Key 不可為空白。');
  }

  getStore().set(getStoreKey(provider), encryptValue(trimmedKey));
};

export const getApiKey = (provider: AIProvider): string | null => {
  const encryptedValue = getStore().get(getStoreKey(provider));

  if (!encryptedValue) {
    return null;
  }

  try {
    return decryptValue(encryptedValue);
  } catch {
    return null;
  }
};

export const removeApiKey = (provider: AIProvider): void => {
  getStore().delete(getStoreKey(provider));
};

export const hasApiKey = (provider: AIProvider): boolean => {
  const encryptedValue = getStore().get(getStoreKey(provider));
  return typeof encryptedValue === 'string' && encryptedValue.length > 0;
};
