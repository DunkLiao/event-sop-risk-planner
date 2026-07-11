import type { ElectronAPI, OpenDialogOptions, OpenDialogResult, SaveDialogOptions, SaveDialogResult } from '../../types/electron';
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
} from '../../types/settings';
import type { OpenImportFileResult, SaveExportFileRequest } from '../../types/importExport';
import type { GenerateRiskRequest, GenerateSOPRequest } from '../../types/ai';
import type { SOPDocument } from '../../types/event';
import type { RiskAssessment } from '../../types/risk';

export class StorageService {
  private get electronAPI() {
    if (!window.electronAPI) {
      throw new Error('Electron API 無法使用');
    }

    return window.electronAPI as ElectronAPI;
  }

  async saveProject(project: Project): Promise<void> {
    await this.electronAPI.saveProject(project);
  }

  async loadProjects(): Promise<Project[]> {
    return this.electronAPI.loadProjects();
  }

  async listProjects(filter?: ProjectFilter): Promise<Project[]> {
    return this.electronAPI.listProjects(filter);
  }

  async searchProjects(query: string): Promise<Project[]> {
    return this.electronAPI.searchProjects(query);
  }

  async getProjectById(id: string): Promise<Project | null> {
    return this.electronAPI.getProjectById(id);
  }

  async duplicateProject(id: string, newName: string): Promise<Project> {
    return this.electronAPI.duplicateProject(id, newName);
  }

  async updateProjectStatus(id: string, status: ProjectStatus): Promise<Project> {
    return this.electronAPI.updateProjectStatus(id, status);
  }

  async getProjectStats(): Promise<ProjectStats> {
    return this.electronAPI.getProjectStats();
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.electronAPI.deleteProject(projectId);
  }

  async getSettings(): Promise<AppSettings | null> {
    return this.electronAPI.getSettings();
  }

  async getSettingsForExport(includeApiKeys: boolean): Promise<AppSettings> {
    return this.electronAPI.getSettingsForExport(includeApiKeys);
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.electronAPI.saveSettings(settings);
  }

  async saveApiKey(provider: AIProvider, key: string): Promise<ApiKeySaveResult> {
    return this.electronAPI.saveApiKey(provider, key);
  }

  async getApiKey(provider: AIProvider): Promise<string | null> {
    return this.electronAPI.getApiKey(provider);
  }

  async validateApiKey(provider: AIProvider, key: string): Promise<ApiKeyValidationResult> {
    return this.electronAPI.validateApiKey(provider, key);
  }

  async removeApiKey(provider: AIProvider): Promise<boolean> {
    return this.electronAPI.removeApiKey(provider);
  }

  async generateSOP(request: GenerateSOPRequest): Promise<SOPDocument> {
    return this.electronAPI.generateSOP(request);
  }

  async generateRiskAssessment(request: GenerateRiskRequest): Promise<RiskAssessment> {
    return this.electronAPI.generateRiskAssessment(request);
  }

  async exportWordDocument(document: SOPDocument, filePath: string): Promise<void> {
    await this.electronAPI.exportWordDocument(document, filePath);
  }

  async exportExcelDocument(assessment: RiskAssessment, filePath: string): Promise<void> {
    await this.electronAPI.exportExcelDocument(assessment, filePath);
  }

  async exportProject(project: Project, filePath: string): Promise<void> {
    await this.electronAPI.exportProject(project, filePath);
  }

  async importProject(filePath: string): Promise<Project> {
    return this.electronAPI.importProject(filePath);
  }

  async showSaveDialog(options?: SaveDialogOptions): Promise<SaveDialogResult> {
    return this.electronAPI.showSaveDialog(options);
  }

  async showOpenDialog(options?: OpenDialogOptions): Promise<OpenDialogResult> {
    return this.electronAPI.showOpenDialog(options);
  }

  async saveTemplate(template: Template): Promise<void> {
    await this.electronAPI.saveTemplate(template);
  }

  async loadTemplates(filter?: TemplateFilter): Promise<Template[]> {
    return this.electronAPI.loadTemplates(filter);
  }

  async getDefaultTemplates(): Promise<Template[]> {
    return this.electronAPI.getDefaultTemplates();
  }

  async setDefaultTemplate(id: string, isDefault: boolean): Promise<void> {
    await this.electronAPI.setDefaultTemplate(id, isDefault);
  }

  async createTemplateFromProject(
    projectId: string,
    templateName: string,
    options?: {
      includeSop?: boolean;
      includeRisk?: boolean;
      includeEventSettings?: boolean;
      isDefault?: boolean;
    }
  ): Promise<Template> {
    return this.electronAPI.createTemplateFromProject(projectId, templateName, options);
  }

  async createProjectFromTemplate(templateId: string, projectName: string): Promise<Project> {
    return this.electronAPI.createProjectFromTemplate(templateId, projectName);
  }

  async generateTemplateShareCode(templateId: string): Promise<string> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('找不到要分享的範本。');
    }

    return btoa(unescape(encodeURIComponent(JSON.stringify(template))));
  }

  async getTemplateById(id: string): Promise<Template | null> {
    return this.electronAPI.getTemplateById(id);
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.electronAPI.deleteTemplate(id);
  }

  async exportTemplate(template: Template, filePath: string): Promise<void> {
    await this.electronAPI.exportTemplate(template, filePath);
  }

  async importTemplate(filePath: string): Promise<Template> {
    return this.electronAPI.importTemplate(filePath);
  }

  async saveExportFile(request: SaveExportFileRequest): Promise<SaveDialogResult> {
    return this.electronAPI.saveExportFile(request);
  }

  async openImportFile(options?: OpenDialogOptions): Promise<OpenImportFileResult | null> {
    return this.electronAPI.openImportFile(options);
  }
}

export const storageService = new StorageService();
