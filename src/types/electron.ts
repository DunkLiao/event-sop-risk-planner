import type {
  AIProvider,
  ApiKeyConnectionResult,
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
import type { GenerateRiskRequest, GenerateSOPRequest } from './ai';
import type { SOPDocument } from './event';
import type { RiskAssessment } from './risk';

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
  generateSOP: (request: GenerateSOPRequest) => Promise<SOPDocument>;
  generateRiskAssessment: (request: GenerateRiskRequest) => Promise<RiskAssessment>;
  exportWordDocument: (sopData: SOPDocument, filePath: string) => Promise<void>;
  exportExcelDocument: (sopData: SOPDocument, riskData: RiskAssessment | null, filePath: string) => Promise<void>;
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
  getDefaultTemplates: () => Promise<Template[]>;
  getTemplateById: (templateId: string) => Promise<Template | null>;
  setDefaultTemplate: (templateId: string, isDefault: boolean) => Promise<void>;
  createTemplateFromProject: (
    projectId: string,
    templateName: string,
    options?: {
      includeSop?: boolean;
      includeRisk?: boolean;
      includeEventSettings?: boolean;
      isDefault?: boolean;
    }
  ) => Promise<Template>;
  createProjectFromTemplate: (templateId: string, projectName: string) => Promise<Project>;
  deleteTemplate: (templateId: string) => Promise<void>;
  exportTemplate: (templateData: Template, filePath: string) => Promise<void>;
  importTemplate: (filePath: string) => Promise<Template>;
  getSettings: () => Promise<AppSettings | null>;
  getSettingsForExport: (includeApiKeys: boolean) => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
saveApiKey: (provider: AIProvider, key: string) => Promise<ApiKeySaveResult>;
  getApiKey: (provider: AIProvider) => Promise<string | null>;
  validateApiKey: (provider: AIProvider, key: string) => Promise<ApiKeyValidationResult>;
  testApiKeyConnection: (provider: AIProvider, key: string) => Promise<ApiKeyConnectionResult>;
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
