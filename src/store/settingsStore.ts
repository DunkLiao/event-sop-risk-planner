import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { AIProvider, AppSettings } from '../types/settings.js';

interface SettingsState {
  settings: AppSettings | null;
  setSettings: (settings: AppSettings) => void;
  updateAISettings: (provider: AIProvider, key: string, value: unknown) => void;
  updateDocumentSettings: (key: string, value: unknown) => void;
  updateGeneralSettings: (key: string, value: unknown) => void;
}

export const defaultSettings: AppSettings = {
  ai: {
    defaultProvider: 'openai',
    openai: {
      apiKey: '',
      model: 'gpt-4o',
    },
    claude: {
      apiKey: '',
      model: 'claude-3-5-sonnet-20241022',
    },
    openrouter: {
      apiKey: '',
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
};

export const sanitizeAppSettings = (settings: AppSettings): AppSettings => ({
  ...settings,
  ai: {
    ...settings.ai,
    openai: {
      ...settings.ai.openai,
      apiKey: '',
    },
    claude: {
      ...settings.ai.claude,
      apiKey: '',
    },
    openrouter: {
      ...settings.ai.openrouter,
      apiKey: '',
    },
  },
});

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const settingsStorage = createJSONStorage(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return memoryStorage;
});

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      settings: defaultSettings,
      setSettings: settings => set({ settings: sanitizeAppSettings(settings) }),
      updateAISettings: (provider, key, value) =>
        set(state => ({
          settings: state.settings
            ? {
                ...state.settings,
                ai: {
                  ...state.settings.ai,
                  [provider]: {
                    ...state.settings.ai[provider],
                    [key]: key === 'apiKey' ? '' : value,
                  },
                },
              }
            : state.settings,
        })),
      updateDocumentSettings: (key, value) =>
        set(state => ({
          settings: state.settings
            ? {
                ...state.settings,
                document: {
                  ...state.settings.document,
                  [key]: value,
                },
              }
            : state.settings,
        })),
      updateGeneralSettings: (key, value) =>
        set(state => ({
          settings: state.settings
            ? {
                ...state.settings,
                general: {
                  ...state.settings.general,
                  [key]: value,
                },
              }
            : state.settings,
        })),
    }),
    {
      name: 'app-settings',
      storage: settingsStorage,
      partialize: state => ({
        settings: state.settings ? sanitizeAppSettings(state.settings) : state.settings,
      }),
    }
  )
);
