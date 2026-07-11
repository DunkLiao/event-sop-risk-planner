import { defaultSettings, sanitizeAppSettings } from '../../store/settingsStore';
import type { EventInfo, SOPDocument } from '../../types/event';
import type { RiskAssessment } from '../../types/risk';
import type { AIProvider, AppSettings, Project, ProjectStatus, Template, TemplateContent } from '../../types/settings';
import type {
  ConflictResolutionStrategy,
  ImportExportPayload,
  ImportOptions,
  ImportPreview,
  ImportResult,
  ImportSelection,
  ProjectExportFile,
  ProjectsExportFile,
  SettingsExportFile,
  TemplateExportFile,
  TemplatesExportFile,
} from '../../types/importExport';
import { IMPORT_EXPORT_SOURCE, IMPORT_EXPORT_VERSION } from '../../types/importExport';
import { storageService } from '../storage/storageService';

const PROJECT_STATUS_PRIORITY: Record<ProjectStatus, number> = {
  draft: 0,
  in_progress: 1,
  completed: 2,
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isProjectStatus = (value: unknown): value is ProjectStatus =>
  value === 'draft' || value === 'in_progress' || value === 'completed';

const isEventInfo = (value: unknown): value is EventInfo =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.type === 'string' &&
  typeof value.scale === 'string' &&
  typeof value.startDate === 'string' &&
  typeof value.endDate === 'string' &&
  typeof value.location === 'string' &&
  typeof value.description === 'string' &&
  typeof value.attendees === 'number' &&
  typeof value.createdAt === 'string' &&
  typeof value.updatedAt === 'string';

const isSOPDocument = (value: unknown): value is SOPDocument =>
  isRecord(value) &&
  typeof value.eventId === 'string' &&
  typeof value.eventName === 'string' &&
  Array.isArray(value.sections) &&
  Array.isArray(value.timeline) &&
  Array.isArray(value.checklist) &&
  typeof value.generatedAt === 'string';

const isRiskAssessment = (value: unknown): value is RiskAssessment =>
  isRecord(value) &&
  typeof value.eventId === 'string' &&
  typeof value.eventName === 'string' &&
  Array.isArray(value.risks) &&
  isRecord(value.riskMatrix) &&
  isRecord(value.summary) &&
  typeof value.generatedAt === 'string';

const isCompatibleVersion = (version: string): boolean => version.split('.')[0] === IMPORT_EXPORT_VERSION.split('.')[0];

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : '發生未知錯誤。');

const cloneDeep = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createUniqueName = (baseName: string, existingNames: Set<string>, suffix: string = '匯入副本'): string => {
  const safeBaseName = baseName.trim() || '未命名項目';
  const initialName = `${safeBaseName}（${suffix}）`;

  if (!existingNames.has(initialName)) {
    existingNames.add(initialName);
    return initialName;
  }

  let counter = 2;
  while (existingNames.has(`${initialName} ${counter}`)) {
    counter += 1;
  }

  const resolvedName = `${initialName} ${counter}`;
  existingNames.add(resolvedName);
  return resolvedName;
};

const deepMerge = <T>(baseValue: T, incomingValue: unknown): T => {
  if (Array.isArray(baseValue) || Array.isArray(incomingValue)) {
    return cloneDeep((incomingValue ?? baseValue) as T);
  }

  if (isRecord(baseValue) && isRecord(incomingValue)) {
    const result: Record<string, unknown> = { ...baseValue };

    Object.entries(incomingValue).forEach(([key, value]) => {
      const baseEntry = result[key];
      result[key] = isRecord(baseEntry) && isRecord(value) ? deepMerge(baseEntry, value) : cloneDeep(value);
    });

    return result as T;
  }

  return cloneDeep((incomingValue ?? baseValue) as T);
};

const normalizeProject = (value: unknown): Project => {
  if (!isRecord(value) || !isEventInfo(value.eventInfo) || !isProjectStatus(value.status)) {
    throw new Error('專案資料格式不正確。');
  }

  const eventInfo = value.eventInfo;
  const project: Project = {
    id: String(value.id ?? ''),
    name: String(value.name ?? ''),
    eventInfo: {
      ...eventInfo,
      id: String(eventInfo.id ?? value.id ?? ''),
      name: String(eventInfo.name ?? value.name ?? ''),
      createdAt: String(eventInfo.createdAt ?? value.createdAt ?? new Date().toISOString()),
      updatedAt: String(eventInfo.updatedAt ?? value.updatedAt ?? new Date().toISOString()),
    },
    sopDocument: isSOPDocument(value.sopDocument) ? value.sopDocument : undefined,
    riskAssessment: isRiskAssessment(value.riskAssessment) ? value.riskAssessment : undefined,
    formProgress: isRecord(value.formProgress)
      ? {
          currentStep: Number(value.formProgress.currentStep ?? 0),
        }
      : undefined,
    createdAt: String(value.createdAt ?? eventInfo.createdAt ?? new Date().toISOString()),
    updatedAt: String(value.updatedAt ?? eventInfo.updatedAt ?? new Date().toISOString()),
    status: value.status,
  };

  if (!project.id || !project.name || !project.eventInfo.id || !project.eventInfo.name) {
    throw new Error('專案資料缺少必要欄位。');
  }

  return project;
};

const normalizeTemplate = (value: unknown): Template => {
  if (!isRecord(value) || !isRecord(value.content)) {
    throw new Error('範本資料格式不正確。');
  }

  const type = value.type;
  if (type !== 'sop' && type !== 'risk' && type !== 'full') {
    throw new Error('範本類型不支援。');
  }

  const template: Template = {
    id: String(value.id ?? ''),
    name: String(value.name ?? ''),
    type,
    eventType: String(value.eventType ?? 'other'),
    content: value.content as TemplateContent,
    createdAt: String(value.createdAt ?? new Date().toISOString()),
    isDefault: Boolean(value.isDefault),
  };

  if (!template.id || !template.name) {
    throw new Error('範本資料缺少必要欄位。');
  }

  return template;
};

const normalizeSettings = (value: unknown): AppSettings => {
  if (!isRecord(value) || !isRecord(value.ai) || !isRecord(value.document) || !isRecord(value.general)) {
    throw new Error('設定資料格式不正確。');
  }

  return deepMerge(defaultSettings, value);
};

const normalizePayload = (value: unknown): ImportExportPayload => {
  if (!isRecord(value) || typeof value.type !== 'string' || typeof value.version !== 'string') {
    throw new Error('匯入檔案缺少必要的中繼資料。');
  }

  if (!isCompatibleVersion(value.version)) {
    throw new Error(`檔案版本 ${value.version} 與目前應用程式不相容。`);
  }

  const metadata = {
    version: value.version,
    appVersion: String(value.appVersion ?? value.version),
    source: String(value.source ?? 'unknown'),
    exportedAt: String(value.exportedAt ?? new Date().toISOString()),
  };

  switch (value.type) {
    case 'project':
      return {
        ...metadata,
        type: 'project',
        options: isRecord(value.options)
          ? {
              includeSopDocument: value.options.includeSopDocument !== false,
              includeRiskAssessment: value.options.includeRiskAssessment !== false,
              includeSettings: Boolean(value.options.includeSettings),
            }
          : {
              includeSopDocument: true,
              includeRiskAssessment: true,
              includeSettings: false,
            },
        settings: value.settings ? normalizeSettings(value.settings) : undefined,
        data: normalizeProject(value.data),
      } satisfies ProjectExportFile;
    case 'projects':
      if (!Array.isArray(value.data)) {
        throw new Error('批次專案資料格式不正確。');
      }

      return {
        ...metadata,
        type: 'projects',
        count: Number(value.count ?? value.data.length),
        options: isRecord(value.options)
          ? {
              includeSopDocument: value.options.includeSopDocument !== false,
              includeRiskAssessment: value.options.includeRiskAssessment !== false,
              includeSettings: Boolean(value.options.includeSettings),
            }
          : {
              includeSopDocument: true,
              includeRiskAssessment: true,
              includeSettings: false,
            },
        settings: value.settings ? normalizeSettings(value.settings) : undefined,
        data: value.data.map(normalizeProject),
      } satisfies ProjectsExportFile;
    case 'template':
      return {
        ...metadata,
        type: 'template',
        data: normalizeTemplate(value.data),
      } satisfies TemplateExportFile;
    case 'templates':
      if (!Array.isArray(value.data)) {
        throw new Error('批次範本資料格式不正確。');
      }

      return {
        ...metadata,
        type: 'templates',
        count: Number(value.count ?? value.data.length),
        data: value.data.map(normalizeTemplate),
      } satisfies TemplatesExportFile;
    case 'settings':
      return {
        ...metadata,
        type: 'settings',
        includesApiKeys: Boolean(value.includesApiKeys),
        data: normalizeSettings(value.data),
      } satisfies SettingsExportFile;
    default:
      throw new Error(`不支援的匯入檔案類型：${value.type}`);
  }
};

const buildPreviewSummary = (payload: ImportExportPayload) => ({
  type: payload.type,
  itemCount:
    payload.type === 'project'
      ? 1
      : payload.type === 'template'
        ? 1
        : payload.type === 'settings'
          ? 1
          : payload.data.length,
  includesSettings: payload.type === 'settings' || 'settings' in payload,
  includesApiKeys: payload.type === 'settings' ? payload.includesApiKeys : false,
  warnings: [
    ...(payload.source !== IMPORT_EXPORT_SOURCE ? ['檔案來源無法驗證，請確認檔案來自可信任來源。'] : []),
    ...(payload.appVersion !== IMPORT_EXPORT_VERSION ? [`檔案由版本 ${payload.appVersion} 匯出，已嘗試以相容模式處理。`] : []),
  ],
});

const mergeProject = (existingProject: Project, importedProject: Project): Project => {
  const mergedProject: Project = {
    ...existingProject,
    ...importedProject,
    name: importedProject.name.trim() || existingProject.name,
    eventInfo: deepMerge(existingProject.eventInfo, importedProject.eventInfo),
    sopDocument:
      existingProject.sopDocument && importedProject.sopDocument
        ? importedProject.sopDocument.generatedAt >= existingProject.sopDocument.generatedAt
          ? importedProject.sopDocument
          : existingProject.sopDocument
        : (importedProject.sopDocument ?? existingProject.sopDocument),
    riskAssessment:
      existingProject.riskAssessment && importedProject.riskAssessment
        ? importedProject.riskAssessment.generatedAt >= existingProject.riskAssessment.generatedAt
          ? importedProject.riskAssessment
          : existingProject.riskAssessment
        : (importedProject.riskAssessment ?? existingProject.riskAssessment),
    status:
      PROJECT_STATUS_PRIORITY[importedProject.status] >= PROJECT_STATUS_PRIORITY[existingProject.status]
        ? importedProject.status
        : existingProject.status,
    createdAt: existingProject.createdAt < importedProject.createdAt ? existingProject.createdAt : importedProject.createdAt,
    updatedAt: existingProject.updatedAt > importedProject.updatedAt ? existingProject.updatedAt : importedProject.updatedAt,
  };

  mergedProject.eventInfo.id = existingProject.id;
  mergedProject.eventInfo.name = mergedProject.name;
  mergedProject.eventInfo.updatedAt = mergedProject.updatedAt;

  if (mergedProject.sopDocument) {
    mergedProject.sopDocument = {
      ...mergedProject.sopDocument,
      eventId: mergedProject.id,
      eventName: mergedProject.name,
    };
  }

  if (mergedProject.riskAssessment) {
    mergedProject.riskAssessment = {
      ...mergedProject.riskAssessment,
      eventId: mergedProject.id,
      eventName: mergedProject.name,
    };
  }

  return mergedProject;
};

const cloneProjectForRename = (project: Project, existingNames: Set<string>): Project => {
  const newId = generateId();
  const newName = createUniqueName(project.name, existingNames);
  const now = new Date().toISOString();
  const clonedProject = cloneDeep(project);

  clonedProject.id = newId;
  clonedProject.name = newName;
  clonedProject.createdAt = now;
  clonedProject.updatedAt = now;
  clonedProject.eventInfo = {
    ...clonedProject.eventInfo,
    id: newId,
    name: newName,
    createdAt: now,
    updatedAt: now,
  };

  if (clonedProject.sopDocument) {
    clonedProject.sopDocument = {
      ...clonedProject.sopDocument,
      eventId: newId,
      eventName: newName,
      generatedAt: now,
    };
  }

  if (clonedProject.riskAssessment) {
    clonedProject.riskAssessment = {
      ...clonedProject.riskAssessment,
      eventId: newId,
      eventName: newName,
      generatedAt: now,
    };
  }

  return clonedProject;
};

const mergeTemplate = (existingTemplate: Template, importedTemplate: Template): Template => ({
  ...existingTemplate,
  ...importedTemplate,
  name: importedTemplate.name.trim() || existingTemplate.name,
  content: deepMerge(existingTemplate.content, importedTemplate.content),
  createdAt: existingTemplate.createdAt < importedTemplate.createdAt ? existingTemplate.createdAt : importedTemplate.createdAt,
  isDefault: existingTemplate.isDefault || importedTemplate.isDefault,
});

const cloneTemplateForRename = (template: Template, existingNames: Set<string>): Template => ({
  ...cloneDeep(template),
  id: generateId(),
  name: createUniqueName(template.name, existingNames),
  isDefault: false,
  createdAt: new Date().toISOString(),
});

const resolveSelectedProjectIds = (payload: ImportExportPayload, selection?: ImportSelection): string[] | null => {
  if (!selection?.projectIds) {
    return null;
  }

  if (payload.type === 'project') {
    return selection.projectIds.includes(payload.data.id) ? selection.projectIds : [];
  }

  if (payload.type === 'projects') {
    return selection.projectIds;
  }

  return [];
};

const resolveSelectedTemplateIds = (payload: ImportExportPayload, selection?: ImportSelection): string[] | null => {
  if (!selection?.templateIds) {
    return null;
  }

  if (payload.type === 'template') {
    return selection.templateIds.includes(payload.data.id) ? selection.templateIds : [];
  }

  if (payload.type === 'templates') {
    return selection.templateIds;
  }

  return [];
};

class ImportService {
  async previewImport(content: string, fileName?: string): Promise<ImportPreview> {
    const payload = this.parseImportPayload(content);

    return {
      fileName,
      payload,
      summary: buildPreviewSummary(payload),
    };
  }

  parseImportPayload(content: string): ImportExportPayload {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('JSON 格式錯誤，請確認檔案內容有效。');
    }

    return normalizePayload(parsed);
  }

  async importFromJson(content: string, options: ImportOptions): Promise<ImportResult> {
    const preview = await this.previewImport(content);
    return this.importPreview(preview, options);
  }

  async importPreview(preview: ImportPreview, options: ImportOptions): Promise<ImportResult> {
    const payload = preview.payload;
    const warnings = [...preview.summary.warnings];
    const errors: string[] = [];
    const items: ImportResult['items'] = [];
    const conflictStrategy = options.conflictStrategy;

    const projectSelections = resolveSelectedProjectIds(payload, options.selection);
    const templateSelections = resolveSelectedTemplateIds(payload, options.selection);
    const shouldImportSettings = options.selection?.includeSettings !== false;

    try {
      if (payload.type === 'project' || payload.type === 'projects') {
        const existingProjects = await storageService.listProjects();
        const existingProjectsById = new Map(existingProjects.map(project => [project.id, project]));
        const existingProjectNames = new Set(existingProjects.map(project => project.name));
        const projects = payload.type === 'project' ? [payload.data] : payload.data;

        for (const project of projects) {
          if (projectSelections && !projectSelections.includes(project.id)) {
            items.push({ itemType: 'project', action: 'skipped', id: project.id, name: project.name, message: '未勾選此專案，已略過。' });
            continue;
          }

          const existingProject = existingProjectsById.get(project.id);

          try {
            if (!existingProject) {
              await storageService.saveProject(project);
              existingProjectsById.set(project.id, project);
              existingProjectNames.add(project.name);
              items.push({ itemType: 'project', action: 'imported', id: project.id, name: project.name, message: '專案已匯入。' });
              continue;
            }

            if (conflictStrategy === 'skip') {
              items.push({ itemType: 'project', action: 'skipped', id: project.id, name: project.name, message: '已有同 ID 專案，已略過。' });
              continue;
            }

            if (conflictStrategy === 'overwrite') {
              await storageService.saveProject(project);
              items.push({ itemType: 'project', action: 'overwritten', id: project.id, name: project.name, message: '已覆蓋既有專案。' });
              continue;
            }

            if (conflictStrategy === 'rename') {
              const renamedProject = cloneProjectForRename(project, existingProjectNames);
              await storageService.saveProject(renamedProject);
              items.push({ itemType: 'project', action: 'renamed', id: renamedProject.id, name: renamedProject.name, message: '已建立重新命名的專案副本。' });
              continue;
            }

            const mergedProject = mergeProject(existingProject, project);
            await storageService.saveProject(mergedProject);
            items.push({ itemType: 'project', action: 'merged', id: mergedProject.id, name: mergedProject.name, message: '已合併到既有專案。' });
          } catch (error) {
            const message = getErrorMessage(error);
            errors.push(`${project.name}：${message}`);
            items.push({ itemType: 'project', action: 'failed', id: project.id, name: project.name, message });
          }
        }
      }

      if (payload.type === 'template' || payload.type === 'templates') {
        const existingTemplates = await storageService.loadTemplates();
        const existingTemplatesById = new Map(existingTemplates.map(template => [template.id, template]));
        const existingTemplateNames = new Set(existingTemplates.map(template => template.name));
        const templates = payload.type === 'template' ? [payload.data] : payload.data;

        for (const template of templates) {
          if (templateSelections && !templateSelections.includes(template.id)) {
            items.push({ itemType: 'template', action: 'skipped', id: template.id, name: template.name, message: '未勾選此範本，已略過。' });
            continue;
          }

          const existingTemplate = existingTemplatesById.get(template.id);

          try {
            if (!existingTemplate) {
              await storageService.saveTemplate(template);
              existingTemplatesById.set(template.id, template);
              existingTemplateNames.add(template.name);
              items.push({ itemType: 'template', action: 'imported', id: template.id, name: template.name, message: '範本已匯入。' });
              continue;
            }

            if (conflictStrategy === 'skip') {
              items.push({ itemType: 'template', action: 'skipped', id: template.id, name: template.name, message: '已有同 ID 範本，已略過。' });
              continue;
            }

            if (conflictStrategy === 'overwrite') {
              await storageService.saveTemplate(template);
              items.push({ itemType: 'template', action: 'overwritten', id: template.id, name: template.name, message: '已覆蓋既有範本。' });
              continue;
            }

            if (conflictStrategy === 'rename') {
              const renamedTemplate = cloneTemplateForRename(template, existingTemplateNames);
              await storageService.saveTemplate(renamedTemplate);
              items.push({ itemType: 'template', action: 'renamed', id: renamedTemplate.id, name: renamedTemplate.name, message: '已建立重新命名的範本副本。' });
              continue;
            }

            const mergedTemplate = mergeTemplate(existingTemplate, template);
            await storageService.saveTemplate(mergedTemplate);
            items.push({ itemType: 'template', action: 'merged', id: mergedTemplate.id, name: mergedTemplate.name, message: '已合併到既有範本。' });
          } catch (error) {
            const message = getErrorMessage(error);
            errors.push(`${template.name}：${message}`);
            items.push({ itemType: 'template', action: 'failed', id: template.id, name: template.name, message });
          }
        }
      }

      const importedSettings = payload.type === 'settings' ? payload.data : 'settings' in payload ? payload.settings : undefined;
      if (importedSettings && shouldImportSettings) {
        try {
          if (conflictStrategy !== 'skip' || !(await storageService.getSettings())) {
            await this.importSettings(importedSettings, conflictStrategy, payload.type === 'settings' ? payload.includesApiKeys : false);
          }

          items.push({
            itemType: 'settings',
            action:
              conflictStrategy === 'overwrite' ? 'overwritten' : conflictStrategy === 'skip' ? 'skipped' : 'merged',
            id: 'app-settings',
            name: '應用程式設定',
            message:
              conflictStrategy === 'overwrite'
                ? '設定已覆蓋。'
                : conflictStrategy === 'skip'
                  ? '偵測到既有設定，保留現有設定。'
                  : '設定已完成合併。',
          });
        } catch (error) {
          const message = getErrorMessage(error);
          errors.push(`應用程式設定：${message}`);
          items.push({ itemType: 'settings', action: 'failed', id: 'app-settings', name: '應用程式設定', message });
        }
      } else if (importedSettings && !shouldImportSettings) {
        items.push({ itemType: 'settings', action: 'skipped', id: 'app-settings', name: '應用程式設定', message: '使用者取消匯入設定。' });
      }
    } catch (error) {
      errors.push(getErrorMessage(error));
    }

    return {
      successCount: items.filter(item => ['imported', 'overwritten', 'renamed', 'merged'].includes(item.action)).length,
      skippedCount: items.filter(item => item.action === 'skipped').length,
      failureCount: items.filter(item => item.action === 'failed').length,
      warnings,
      errors,
      items,
    };
  }

  private async importSettings(
    importedSettings: AppSettings,
    conflictStrategy: ConflictResolutionStrategy,
    includesApiKeys: boolean
  ): Promise<void> {
    const existingSettings = (await storageService.getSettings()) ?? defaultSettings;
    const normalizedImportedSettings = normalizeSettings(importedSettings);
    const nextSettings =
      conflictStrategy === 'overwrite' ? normalizedImportedSettings : deepMerge(existingSettings, normalizedImportedSettings);

    await storageService.saveSettings(sanitizeAppSettings(nextSettings));

    if (!includesApiKeys) {
      return;
    }

    for (const provider of ['openai', 'claude', 'openrouter'] as AIProvider[]) {
      const importedApiKey = normalizedImportedSettings.ai[provider].apiKey?.trim() ?? '';

      if (importedApiKey) {
        await storageService.saveApiKey(provider, importedApiKey);
        continue;
      }

      if (conflictStrategy === 'overwrite') {
        await storageService.removeApiKey(provider);
      }
    }
  }
}

export const importService = new ImportService();
