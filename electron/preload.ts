import { contextBridge, ipcRenderer } from 'electron';
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
} from '../src/types/settings';
import type { ElectronAPI, OpenDialogOptions, SaveDialogOptions, SaveDialogResult } from '../src/types/electron';
import type { MenuAction } from '../src/types/importExport';
import type { GenerateRiskRequest, GenerateSOPRequest } from '../src/types/ai';
import type { SOPDocument } from '../src/types/event';
import type { RiskAssessment } from '../src/types/risk';

const electronAPI: ElectronAPI = {
  ping: () => ipcRenderer.invoke('ping'),
  generateSOP: (request: GenerateSOPRequest): Promise<SOPDocument> => ipcRenderer.invoke('generate-sop', request),
  generateRiskAssessment: (request: GenerateRiskRequest): Promise<RiskAssessment> => ipcRenderer.invoke('generate-risk-assessment', request),
  exportWordDocument: (sopData: SOPDocument, filePath: string): Promise<void> => ipcRenderer.invoke('export-word', sopData, filePath),
  exportExcelDocument: (riskData: RiskAssessment, filePath: string): Promise<void> => ipcRenderer.invoke('export-excel', riskData, filePath),
  showSaveDialog: (options?: SaveDialogOptions): Promise<SaveDialogResult> => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options?: OpenDialogOptions) => ipcRenderer.invoke('show-open-dialog', options),
  saveProject: (projectData: Project) => ipcRenderer.invoke('save-project', projectData),
  loadProjects: (): Promise<Project[]> => ipcRenderer.invoke('load-projects'),
  listProjects: (filter?: ProjectFilter): Promise<Project[]> => ipcRenderer.invoke('list-projects', filter),
  searchProjects: (query: string): Promise<Project[]> => ipcRenderer.invoke('search-projects', query),
  getProjectById: (projectId: string): Promise<Project | null> => ipcRenderer.invoke('get-project-by-id', projectId),
  duplicateProject: (projectId: string, newName: string): Promise<Project> => ipcRenderer.invoke('duplicate-project', projectId, newName),
  updateProjectStatus: (projectId: string, status: ProjectStatus): Promise<Project> =>
    ipcRenderer.invoke('update-project-status', projectId, status),
  getProjectStats: (): Promise<ProjectStats> => ipcRenderer.invoke('get-project-stats'),
  deleteProject: (projectId: string) => ipcRenderer.invoke('delete-project', projectId),
  exportProject: (projectData: Project, filePath: string) => ipcRenderer.invoke('export-project', projectData, filePath),
  importProject: (filePath: string): Promise<Project> => ipcRenderer.invoke('import-project', filePath),
  saveTemplate: (templateData: Template) => ipcRenderer.invoke('save-template', templateData),
  loadTemplates: (filter?: TemplateFilter): Promise<Template[]> => ipcRenderer.invoke('load-templates', filter),
  getDefaultTemplates: (): Promise<Template[]> => ipcRenderer.invoke('get-default-templates'),
  getTemplateById: (templateId: string): Promise<Template | null> => ipcRenderer.invoke('get-template-by-id', templateId),
  setDefaultTemplate: (templateId: string, isDefault: boolean): Promise<void> =>
    ipcRenderer.invoke('set-default-template', templateId, isDefault),
  createTemplateFromProject: (projectId, templateName, options): Promise<Template> =>
    ipcRenderer.invoke('create-template-from-project', projectId, templateName, options),
  createProjectFromTemplate: (templateId: string, projectName: string): Promise<Project> =>
    ipcRenderer.invoke('create-project-from-template', templateId, projectName),
  deleteTemplate: (templateId: string) => ipcRenderer.invoke('delete-template', templateId),
  exportTemplate: (templateData: Template, filePath: string) => ipcRenderer.invoke('export-template', templateData, filePath),
  importTemplate: (filePath: string): Promise<Template> => ipcRenderer.invoke('import-template', filePath),
  getSettings: (): Promise<AppSettings | null> => ipcRenderer.invoke('get-settings'),
  getSettingsForExport: (includeApiKeys: boolean): Promise<AppSettings> => ipcRenderer.invoke('get-settings-for-export', includeApiKeys),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('save-settings', settings),
  saveApiKey: (provider: AIProvider, key: string): Promise<ApiKeySaveResult> => ipcRenderer.invoke('save-api-key', provider, key),
  getApiKey: (provider: AIProvider): Promise<string | null> => ipcRenderer.invoke('get-api-key', provider),
  validateApiKey: (provider: AIProvider, key: string): Promise<ApiKeyValidationResult> =>
    ipcRenderer.invoke('validate-api-key', provider, key),
  removeApiKey: (provider: AIProvider): Promise<boolean> => ipcRenderer.invoke('remove-api-key', provider),
  saveExportFile: request => ipcRenderer.invoke('save-export-file', request),
  openImportFile: (options?: OpenDialogOptions) => ipcRenderer.invoke('open-import-file', options),
  onMenuAction: listener => {
    const handler = (_event: Electron.IpcRendererEvent, action: MenuAction) => {
      listener(action);
    };

    ipcRenderer.on('menu-action', handler);

    return () => {
      ipcRenderer.removeListener('menu-action', handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
