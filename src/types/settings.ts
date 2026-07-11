export type AIProvider = 'openai' | 'claude';

export interface ProviderSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

import type { EventInfo, SOPDocument } from './event.js';
import type { RiskAssessment } from './risk.js';

export interface AppSettings {
  ai: AISettings;
  document: DocumentSettings;
  general: GeneralSettings;
}

export interface AISettings {
  defaultProvider: AIProvider;
  openai: ProviderSettings;
  claude: ProviderSettings;
}

export interface DocumentSettings {
  defaultExportFormat: 'word' | 'excel' | 'both';
  autoSave: boolean;
  saveDirectory: string;
  templatePreferences: {
    sopTemplate: string;
    riskTemplate: string;
  };
}

export interface GeneralSettings {
  language: 'zh-TW' | 'zh-CN' | 'en';
  theme: 'light' | 'dark';
  autoUpdate: boolean;
  telemetry: boolean;
}

export type ProjectStatus = 'draft' | 'in_progress' | 'completed';
export type ProjectSortField = 'name' | 'createdAt' | 'updatedAt' | 'status';
export type SortDirection = 'asc' | 'desc';
export type TemplateType = 'sop' | 'risk' | 'full';
export type TemplateSortField = 'name' | 'createdAt' | 'eventType' | 'type';

export interface ProjectFormProgress {
  currentStep: number;
}

export interface Project {
  id: string;
  name: string;
  eventInfo: EventInfo;
  sopDocument?: SOPDocument;
  riskAssessment?: RiskAssessment;
   formProgress?: ProjectFormProgress;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
}

export interface ProjectFilter {
  status?: ProjectStatus | 'all';
  eventType?: EventInfo['type'] | 'all';
  search?: string;
  sortBy?: ProjectSortField;
  sortDirection?: SortDirection;
  limit?: number;
}

export interface ProjectStats {
  total: number;
  byStatus: Record<ProjectStatus, number>;
  lastUpdatedAt: string | null;
}

export interface TemplateContent {
  sopTemplate?: Partial<SOPDocument>;
  riskTemplate?: Partial<RiskAssessment>;
  eventSettings?: Partial<EventInfo>;
}

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  eventType: string;
  content: TemplateContent;
  createdAt: string;
  isDefault: boolean;
}

export interface TemplateFilter {
  type?: TemplateType | 'all';
  eventType?: EventInfo['type'] | 'all';
  search?: string;
  sortBy?: TemplateSortField;
  sortDirection?: SortDirection;
  defaultOnly?: boolean;
  limit?: number;
}

export interface ApiKeyValidationResult {
  isValid: boolean;
  message: string;
}

export interface ApiKeyConnectionResult {
  success: boolean;
  message: string;
}

export interface ApiKeySaveResult {
  success: boolean;
  message: string;
  maskedKey: string | null;
}
