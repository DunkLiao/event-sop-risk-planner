import type { AppSettings, Project, Template } from './settings';

export const IMPORT_EXPORT_VERSION = '1.0.0';
export const IMPORT_EXPORT_SOURCE = 'event-sop-risk-planner';

export type ImportExportType = 'project' | 'projects' | 'template' | 'templates' | 'settings';
export type ConflictResolutionStrategy = 'skip' | 'overwrite' | 'rename' | 'merge';
export type MenuAction = 'open-import-project' | 'open-export-project' | 'open-settings';

export interface ExportMetadata {
  version: string;
  appVersion: string;
  source: string;
  exportedAt: string;
}

export interface ProjectExportOptions {
  includeSopDocument: boolean;
  includeRiskAssessment: boolean;
  includeSettings: boolean;
}

export interface SettingsExportFile extends ExportMetadata {
  type: 'settings';
  includesApiKeys: boolean;
  data: AppSettings;
}

export interface ProjectExportFile extends ExportMetadata {
  type: 'project';
  options: ProjectExportOptions;
  settings?: AppSettings;
  data: Project;
}

export interface ProjectsExportFile extends ExportMetadata {
  type: 'projects';
  count: number;
  options: ProjectExportOptions;
  settings?: AppSettings;
  data: Project[];
}

export interface TemplateExportFile extends ExportMetadata {
  type: 'template';
  data: Template;
}

export interface TemplatesExportFile extends ExportMetadata {
  type: 'templates';
  count: number;
  data: Template[];
}

export type ImportExportPayload =
  | ProjectExportFile
  | ProjectsExportFile
  | TemplateExportFile
  | TemplatesExportFile
  | SettingsExportFile;

export interface ImportPreviewSummary {
  type: ImportExportType;
  itemCount: number;
  includesSettings: boolean;
  includesApiKeys: boolean;
  warnings: string[];
}

export interface ImportPreview {
  fileName?: string;
  payload: ImportExportPayload;
  summary: ImportPreviewSummary;
}

export interface ImportSelection {
  projectIds?: string[];
  templateIds?: string[];
  includeSettings?: boolean;
}

export interface ImportOptions {
  conflictStrategy: ConflictResolutionStrategy;
  selection?: ImportSelection;
}

export type ImportItemType = 'project' | 'template' | 'settings';
export type ImportItemAction = 'imported' | 'overwritten' | 'renamed' | 'merged' | 'skipped' | 'failed';

export interface ImportItemResult {
  itemType: ImportItemType;
  action: ImportItemAction;
  id: string;
  name: string;
  message: string;
}

export interface ImportResult {
  successCount: number;
  skippedCount: number;
  failureCount: number;
  warnings: string[];
  errors: string[];
  items: ImportItemResult[];
}

export interface SaveExportFileRequest {
  content: string;
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

export interface OpenImportFileResult {
  filePath: string;
  content: string;
}
