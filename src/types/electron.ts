import type {
  AIProvider,
  ApiKeySaveResult,
  ApiKeyValidationResult,
  AppSettings,
  Project,
  ProjectFilter,
  ProjectStats,
  ProjectStatus,
  Template,
  TemplateFilter,
} from './settings';
import type { MenuAction, OpenImportFileResult, SaveExportFileRequest } from './importExport';

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

export interface OpenDialogOptions {
  title?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  properties?: Array<'openFile' | 'multiSelections'>;
}

export interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

export interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export interface ElectronAPI {
  ping: () => Promise<unknown>;
  generateSOP: (eventData: unknown) => Promise<unknown>;
  generateRiskAssessment: (eventData: unknown) => Promise<unknown>;
  exportWordDocument: (sopData: unknown, filePath: string) => Promise<unknown>;
  exportExcelDocument: (riskData: unknown, filePath: string) => Promise<unknown>;
  showSaveDialog: (options?: SaveDialogOptions) => Promise<SaveDialogResult>;
  showOpenDialog: (options?: OpenDialogOptions) => Promise<OpenDialogResult>;
  saveProject: (projectData: Project) => Promise<void>;
  loadProjects: () => Promise<Project[]>;
  listProjects: (filter?: ProjectFilter) => Promise<Project[]>;
  searchProjects: (query: string) => Promise<Project[]>;
  getProjectById: (projectId: string) => Promise<Project | null>;
  duplicateProject: (projectId: string, newName: string) => Promise<Project>;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => Promise<Project>;
  getProjectStats: () => Promise<ProjectStats>;
  deleteProject: (projectId: string) => Promise<void>;
  exportProject: (projectData: Project, filePath: string) => Promise<void>;
  importProject: (filePath: string) => Promise<Project>;
  saveTemplate: (templateData: Template) => Promise<void>;
  loadTemplates: (filter?: TemplateFilter) => Promise<Template[]>;
  getTemplateById: (templateId: string) => Promise<Template | null>;
  deleteTemplate: (templateId: string) => Promise<void>;
  exportTemplate: (templateData: Template, filePath: string) => Promise<void>;
  importTemplate: (filePath: string) => Promise<Template>;
  getSettings: () => Promise<AppSettings | null>;
  getSettingsForExport: (includeApiKeys: boolean) => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  saveApiKey: (provider: AIProvider, key: string) => Promise<ApiKeySaveResult>;
  getApiKey: (provider: AIProvider) => Promise<string | null>;
  validateApiKey: (provider: AIProvider, key: string) => Promise<ApiKeyValidationResult>;
  removeApiKey: (provider: AIProvider) => Promise<boolean>;
  saveExportFile: (request: SaveExportFileRequest) => Promise<SaveDialogResult>;
  openImportFile: (options?: OpenDialogOptions) => Promise<OpenImportFileResult | null>;
  onMenuAction: (listener: (action: MenuAction) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
