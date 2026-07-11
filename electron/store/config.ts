import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { app, safeStorage } from 'electron';
import Store from 'electron-store';

const STORE_NAME = 'secure-settings';
const STORE_KEY_FILE = `${STORE_NAME}.key`;

export interface SecureSettingsSchema {
  'apiKeys.openai'?: string;
  'apiKeys.claude'?: string;
}

const ensureUserDataDirectory = (userDataPath: string): void => {
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
};

const getEncryptionKeyPath = (): string => {
  const userDataPath = app.getPath('userData');
  ensureUserDataDirectory(userDataPath);
  return path.join(userDataPath, STORE_KEY_FILE);
};

const createAndPersistEncryptionKey = (keyPath: string): string => {
  const encryptionKey = randomBytes(32).toString('hex');
  const encryptedKey = safeStorage.encryptString(encryptionKey).toString('base64');

  fs.writeFileSync(keyPath, encryptedKey, 'utf-8');

  return encryptionKey;
};

export const getStoreEncryptionKey = (): string => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('safeStorage 無法使用，無法建立安全儲存。');
  }

  const keyPath = getEncryptionKeyPath();

  if (!fs.existsSync(keyPath)) {
    return createAndPersistEncryptionKey(keyPath);
  }

  const encryptedKey = fs.readFileSync(keyPath, 'utf-8');
  return safeStorage.decryptString(Buffer.from(encryptedKey, 'base64'));
};

export const createSecureStore = (): Store<SecureSettingsSchema> =>
  new Store<SecureSettingsSchema>({
    cwd: app.getPath('userData'),
    encryptionKey: getStoreEncryptionKey(),
    name: STORE_NAME,
    fileExtension: 'dat',
  });
