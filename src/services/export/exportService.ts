import packageJson from '../../../package.json';
import { storageService } from '../storage/storageService';
import type { Project, Template } from '../../types/settings';
import type {
  ProjectExportOptions,
  ProjectExportFile,
  ProjectsExportFile,
  SettingsExportFile,
  TemplateExportFile,
  TemplatesExportFile,
} from '../../types/importExport';
import { IMPORT_EXPORT_SOURCE, IMPORT_EXPORT_VERSION } from '../../types/importExport';

const DEFAULT_PROJECT_EXPORT_OPTIONS: ProjectExportOptions = {
  includeSopDocument: true,
  includeRiskAssessment: true,
  includeSettings: false,
};

const APP_VERSION = packageJson.version;

const cloneProjectForExport = (project: Project, options: ProjectExportOptions): Project => ({
  ...project,
  sopDocument: options.includeSopDocument ? project.sopDocument : undefined,
  riskAssessment: options.includeRiskAssessment ? project.riskAssessment : undefined,
});

const buildMetadata = () => ({
  version: IMPORT_EXPORT_VERSION,
  appVersion: APP_VERSION,
  source: IMPORT_EXPORT_SOURCE,
  exportedAt: new Date().toISOString(),
});

const formatJson = (value: unknown): string => JSON.stringify(value, null, 2);

class ExportService {
  async exportProject(project: Project, options: Partial<ProjectExportOptions> = {}): Promise<string> {
    const resolvedOptions: ProjectExportOptions = { ...DEFAULT_PROJECT_EXPORT_OPTIONS, ...options };
    const payload: ProjectExportFile = {
      ...buildMetadata(),
      type: 'project',
      options: resolvedOptions,
      settings: resolvedOptions.includeSettings ? await storageService.getSettingsForExport(false) : undefined,
      data: cloneProjectForExport(project, resolvedOptions),
    };

    return formatJson(payload);
  }

  async exportMultipleProjects(projectIds: string[], options: Partial<ProjectExportOptions> = {}): Promise<string> {
    const resolvedOptions: ProjectExportOptions = { ...DEFAULT_PROJECT_EXPORT_OPTIONS, ...options };
    const projects = await Promise.all(projectIds.map(async projectId => storageService.getProjectById(projectId)));
    const missingProjectIds = projectIds.filter((_projectId, index) => !projects[index]);

    if (missingProjectIds.length > 0) {
      throw new Error(`找不到要匯出的專案：${missingProjectIds.join('、')}`);
    }

    const payload: ProjectsExportFile = {
      ...buildMetadata(),
      type: 'projects',
      count: projectIds.length,
      options: resolvedOptions,
      settings: resolvedOptions.includeSettings ? await storageService.getSettingsForExport(false) : undefined,
      data: projects.map(project => cloneProjectForExport(project as Project, resolvedOptions)),
    };

    return formatJson(payload);
  }

  async exportTemplate(template: Template): Promise<string> {
    const payload: TemplateExportFile = {
      ...buildMetadata(),
      type: 'template',
      data: template,
    };

    return formatJson(payload);
  }

  async exportMultipleTemplates(templateIds: string[]): Promise<string> {
    const templates = await Promise.all(templateIds.map(async templateId => storageService.getTemplateById(templateId)));
    const missingTemplateIds = templateIds.filter((_templateId, index) => !templates[index]);

    if (missingTemplateIds.length > 0) {
      throw new Error(`找不到要匯出的範本：${missingTemplateIds.join('、')}`);
    }

    const payload: TemplatesExportFile = {
      ...buildMetadata(),
      type: 'templates',
      count: templateIds.length,
      data: templates as Template[],
    };

    return formatJson(payload);
  }

  async exportSettings(includeApiKeys: boolean): Promise<string> {
    const payload: SettingsExportFile = {
      ...buildMetadata(),
      type: 'settings',
      includesApiKeys: includeApiKeys,
      data: await storageService.getSettingsForExport(includeApiKeys),
    };

    return formatJson(payload);
  }
}

export const exportService = new ExportService();
