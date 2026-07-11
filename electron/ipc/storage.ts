import fs from 'node:fs/promises';
import path from 'node:path';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { LocalDatabase } from '../../src/services/storage/database';
import type { OpenDialogOptions, SaveDialogOptions } from '../../src/types/electron';
import type { SaveExportFileRequest } from '../../src/types/importExport';
import type { AppSettings, Project, ProjectFilter, ProjectStatus, Template, TemplateFilter } from '../../src/types/settings';
import { getApiKey } from '../store/secureStore';

const DATABASE_FILE_NAME = 'event-sop-risk-planner.sqlite3';

const DEFAULT_SETTINGS: AppSettings = {
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

let database: LocalDatabase | null = null;

const getDatabase = (): LocalDatabase => {
  if (!database) {
    database = new LocalDatabase({
      userDataPath: app.getPath('userData'),
      dbFileName: DATABASE_FILE_NAME,
    });
  }

  return database;
};

const getWindow = (event: Electron.IpcMainInvokeEvent): BrowserWindow | null => BrowserWindow.fromWebContents(event.sender);

const registerHandler = <T extends unknown[]>(
  channel: string,
  handler: (_event: Electron.IpcMainInvokeEvent, ...args: T) => Promise<unknown> | unknown
): void => {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
};

const ensureParentDirectory = async (filePath: string): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const getFriendlyFileError = (error: unknown, action: string): Error => {
  if (error instanceof Error) {
    const errorWithCode = error as NodeJS.ErrnoException;

    switch (errorWithCode.code) {
      case 'ENOENT':
        return new Error(`${action}失敗：找不到指定的檔案或資料夾。`);
      case 'EACCES':
      case 'EPERM':
        return new Error(`${action}失敗：目前沒有存取該檔案的權限。`);
      case 'ENOSPC':
        return new Error(`${action}失敗：磁碟空間不足，請釋放空間後再試。`);
      default:
        return new Error(`${action}失敗：${error.message}`);
    }
  }

  return new Error(`${action}失敗，請稍後再試。`);
};

const readJsonFile = async <T>(filePath: string, actionName: string): Promise<T> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`${actionName}失敗：JSON 格式不正確。`);
    }

    throw getFriendlyFileError(error, actionName);
  }
};

const getSettingsForExport = (includeApiKeys: boolean): AppSettings => {
  const storedSettings = getDatabase().getAppSettings() ?? DEFAULT_SETTINGS;

  return {
    ...storedSettings,
    ai: {
      ...storedSettings.ai,
openai: {
        ...storedSettings.ai.openai,
        apiKey: includeApiKeys ? getApiKey('openai') ?? '' : '',
      },
      claude: {
        ...storedSettings.ai.claude,
        apiKey: includeApiKeys ? getApiKey('claude') ?? '' : '',
      },
      openrouter: {
        ...storedSettings.ai.openrouter,
        apiKey: includeApiKeys ? getApiKey('openrouter') ?? '' : '',
      },
    },
  };
};

export const getRuntimeSettings = (): AppSettings => getSettingsForExport(true);

export const registerStorageHandlers = (): void => {
  registerHandler('save-project', (_event, project: Project) => {
    getDatabase().saveProject(project);
  });

  registerHandler('load-projects', () => getDatabase().getProjects());
  registerHandler('list-projects', (_event, filter?: ProjectFilter) => getDatabase().listProjects(filter));
  registerHandler('search-projects', (_event, query: string) => getDatabase().searchProjects(query));
  registerHandler('get-project-by-id', (_event, projectId: string) => getDatabase().getProject(projectId));
  registerHandler('duplicate-project', (_event, projectId: string, newName: string) =>
    getDatabase().duplicateProject(projectId, newName)
  );
  registerHandler('update-project-status', (_event, projectId: string, status: ProjectStatus) =>
    getDatabase().updateProjectStatus(projectId, status)
  );
  registerHandler('get-project-stats', () => getDatabase().getProjectStats());
  registerHandler('delete-project', (_event, projectId: string) => {
    getDatabase().deleteProject(projectId);
  });

  registerHandler('save-template', (_event, template: Template) => {
    getDatabase().saveTemplate(template);
  });
  registerHandler('load-templates', (_event, filter?: TemplateFilter) => getDatabase().getTemplates(filter));
  registerHandler('get-template-by-id', (_event, templateId: string) => getDatabase().getTemplate(templateId));
  registerHandler('delete-template', (_event, templateId: string) => {
    getDatabase().deleteTemplate(templateId);
  });
  registerHandler('get-default-templates', () => getDatabase().getDefaultTemplates());
  registerHandler('set-default-template', (_event, templateId: string, isDefault: boolean) => {
    getDatabase().setDefaultTemplate(templateId, isDefault);
  });
  registerHandler(
    'create-template-from-project',
    (
      _event,
      projectId: string,
      templateName: string,
      options?: {
        includeSop?: boolean;
        includeRisk?: boolean;
        includeEventSettings?: boolean;
        isDefault?: boolean;
      }
    ) => getDatabase().createTemplateFromProject(projectId, templateName, options)
  );
  registerHandler('create-project-from-template', (_event, templateId: string, projectName: string) =>
    getDatabase().createProjectFromTemplate(templateId, projectName)
  );

registerHandler('save-settings', (_event, settings: AppSettings) => {
    getDatabase().saveAppSettings({
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
  });

  registerHandler('get-settings', () => getDatabase().getAppSettings());
  registerHandler('get-settings-for-export', (_event, includeApiKeys: boolean) => getSettingsForExport(includeApiKeys));

  registerHandler('export-project', async (_event, project: Project, filePath: string) => {
    try {
      await ensureParentDirectory(filePath);
      await fs.writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');
    } catch (error) {
      throw getFriendlyFileError(error, '匯出專案');
    }
  });

  registerHandler('import-project', async (_event, filePath: string) => readJsonFile<Project>(filePath, '匯入專案'));

  registerHandler('export-template', async (_event, template: Template, filePath: string) => {
    try {
      await ensureParentDirectory(filePath);
      await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf-8');
    } catch (error) {
      throw getFriendlyFileError(error, '匯出範本');
    }
  });

  registerHandler('import-template', async (_event, filePath: string) => readJsonFile<Template>(filePath, '匯入範本'));

  registerHandler('show-save-dialog', (event, options?: SaveDialogOptions) => {
    const browserWindow = getWindow(event);
    const dialogOptions: SaveDialogOptions = {
      title: '匯出檔案',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      ...options,
    };

    return browserWindow ? dialog.showSaveDialog(browserWindow, dialogOptions) : dialog.showSaveDialog(dialogOptions);
  });

  registerHandler('show-open-dialog', (event, options?: OpenDialogOptions) => {
    const browserWindow = getWindow(event);
    const dialogOptions: OpenDialogOptions = {
      title: '選擇 JSON 檔案',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
      ...options,
    };

    return browserWindow ? dialog.showOpenDialog(browserWindow, dialogOptions) : dialog.showOpenDialog(dialogOptions);
  });

  registerHandler('save-export-file', async (event, request: SaveExportFileRequest) => {
    const browserWindow = getWindow(event);
    const result = browserWindow
      ? await dialog.showSaveDialog(browserWindow, {
          title: request.title ?? '匯出檔案',
          defaultPath: request.defaultPath,
          filters: request.filters ?? [{ name: 'JSON', extensions: ['json'] }],
        })
      : await dialog.showSaveDialog({
          title: request.title ?? '匯出檔案',
          defaultPath: request.defaultPath,
          filters: request.filters ?? [{ name: 'JSON', extensions: ['json'] }],
        });

    if (result.canceled || !result.filePath) {
      return result;
    }

    try {
      await ensureParentDirectory(result.filePath);
      await fs.writeFile(result.filePath, request.content, 'utf-8');
      return result;
    } catch (error) {
      throw getFriendlyFileError(error, '匯出檔案');
    }
  });

  registerHandler('open-import-file', async (event, options?: OpenDialogOptions) => {
    const browserWindow = getWindow(event);
    const dialogOptions: OpenDialogOptions = {
      title: '匯入 JSON 檔案',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
      ...options,
    };
    const result = browserWindow
      ? await dialog.showOpenDialog(browserWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { filePath, content };
    } catch (error) {
      throw getFriendlyFileError(error, '讀取匯入檔案');
    }
  });
};

export const closeStorage = (): void => {
  database?.close();
  database = null;
};
