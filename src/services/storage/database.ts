import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type {
  AppSettings,
  Project,
  ProjectFilter,
  ProjectStats,
  ProjectStatus,
  Template,
  TemplateFilter,
} from '../../types/settings';
import { DEFAULT_TEMPLATES } from '../../templates/defaults';
import { buildProjectFromTemplate, buildTemplateFromProject, normalizeTemplate } from '../../utils/template';

const DEFAULT_DATABASE_FILE_NAME = 'event-sop-risk-planner.sqlite3';
const APP_SETTINGS_KEY = 'app-settings';

type ProjectRow = {
  id: string;
  name: string;
  event_info_json: string;
  sop_document_json: string | null;
  risk_assessment_json: string | null;
  form_progress_json: string | null;
  status: Project['status'];
  created_at: string;
  updated_at: string;
};

type TemplateRow = {
  id: string;
  name: string;
  type: Template['type'];
  event_type: string;
  content_json: string;
  is_default: number;
  created_at: string;
};

type SettingRow = {
  key: string;
  value: string;
};

export interface LocalDatabaseOptions {
  userDataPath: string;
  dbFileName?: string;
}

interface Migration {
  version: number;
  up: (database: Database.Database) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: database => {
      database.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          event_info_json TEXT NOT NULL,
          sop_document_json TEXT,
          risk_assessment_json TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          event_type TEXT NOT NULL,
          content_json TEXT NOT NULL,
          is_default INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_templates_type_event_type ON templates(type, event_type);
      `);
    },
  },
  {
    version: 2,
    up: database => {
      database.exec(`
        ALTER TABLE projects ADD COLUMN form_progress_json TEXT;
      `);
    },
  },
];

const serializeJson = (value: unknown): string => JSON.stringify(value);

const deserializeJson = <T>(value: string | null): T | undefined => {
  if (value === null) {
    return undefined;
  }

  return JSON.parse(value) as T;
};

const mapProjectRow = (row: ProjectRow): Project => ({
  id: row.id,
  name: row.name,
  eventInfo: deserializeJson<Project['eventInfo']>(row.event_info_json) as Project['eventInfo'],
  sopDocument: deserializeJson<Project['sopDocument']>(row.sop_document_json),
  riskAssessment: deserializeJson<Project['riskAssessment']>(row.risk_assessment_json),
  formProgress: deserializeJson<Project['formProgress']>(row.form_progress_json),
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTemplateRow = (row: TemplateRow): Template =>
  normalizeTemplate({
    id: row.id,
    name: row.name,
    type: row.type,
    eventType: row.event_type,
    content: deserializeJson(row.content_json),
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  });

const PROJECT_STATUS_PRIORITY: Record<ProjectStatus, number> = {
  draft: 0,
  in_progress: 1,
  completed: 2,
};

const TEMPLATE_TYPE_PRIORITY: Record<Template['type'], number> = {
  full: 0,
  sop: 1,
  risk: 2,
};

const sortProjects = (
  projects: Project[],
  sortBy: ProjectFilter['sortBy'] = 'updatedAt',
  sortDirection: ProjectFilter['sortDirection'] = 'desc'
): Project[] => {
  const sortedProjects = [...projects].sort((left, right) => {
    switch (sortBy) {
      case 'name':
        return left.name.localeCompare(right.name, 'zh-Hant');
      case 'createdAt':
        return left.createdAt.localeCompare(right.createdAt);
      case 'status':
        return (
          PROJECT_STATUS_PRIORITY[left.status] - PROJECT_STATUS_PRIORITY[right.status] ||
          right.updatedAt.localeCompare(left.updatedAt)
        );
      case 'updatedAt':
      default:
        return left.updatedAt.localeCompare(right.updatedAt);
    }
  });

  if (sortDirection === 'asc') {
    return sortedProjects;
  }

  return sortedProjects.reverse();
};

const sortTemplates = (
  templates: Template[],
  sortBy: TemplateFilter['sortBy'] = 'createdAt',
  sortDirection: TemplateFilter['sortDirection'] = 'desc'
): Template[] => {
  const sortedTemplates = [...templates].sort((left, right) => {
    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? -1 : 1;
    }

    switch (sortBy) {
      case 'name':
        return left.name.localeCompare(right.name, 'zh-Hant');
      case 'eventType':
        return left.eventType.localeCompare(right.eventType, 'zh-Hant');
      case 'type':
        return TEMPLATE_TYPE_PRIORITY[left.type] - TEMPLATE_TYPE_PRIORITY[right.type];
      case 'createdAt':
      default:
        return left.createdAt.localeCompare(right.createdAt);
    }
  });

  if (sortDirection === 'asc') {
    return sortedTemplates;
  }

  return sortedTemplates.reverse();
};

const ensureDirectoryExists = (directoryPath: string): void => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

export const getDatabaseFilePath = (
  userDataPath: string,
  dbFileName: string = DEFAULT_DATABASE_FILE_NAME
): string => {
  ensureDirectoryExists(userDataPath);
  return path.join(userDataPath, dbFileName);
};

export class LocalDatabase {
  private readonly db: Database.Database;
  readonly databasePath: string;

  constructor({ userDataPath, dbFileName = DEFAULT_DATABASE_FILE_NAME }: LocalDatabaseOptions) {
    this.databasePath = getDatabaseFilePath(userDataPath, dbFileName);
    this.db = new Database(this.databasePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.runMigrations();
    this.ensureDefaultTemplates();
  }

  private runMigrations(): void {
    const currentVersion = Number(this.db.pragma('user_version', { simple: true }) ?? 0);
    const pendingMigrations = migrations
      .filter(migration => migration.version > currentVersion)
      .sort((left, right) => left.version - right.version);

    if (pendingMigrations.length === 0) {
      return;
    }

    const migrate = this.db.transaction(() => {
      pendingMigrations.forEach(migration => {
        migration.up(this.db);
        this.db.pragma(`user_version = ${migration.version}`);
      });
    });

    migrate();
  }

  private ensureDefaultTemplates(): void {
    const defaultTemplateIds = DEFAULT_TEMPLATES.map(template => template.id);
    const existingIds = new Set(
      this.db
        .prepare<[string, string, string, string], { id: string }>('SELECT id FROM templates WHERE id IN (?, ?, ?, ?)')
        .all(defaultTemplateIds[0], defaultTemplateIds[1], defaultTemplateIds[2], defaultTemplateIds[3])
        .map(row => row.id)
    );

    DEFAULT_TEMPLATES.filter(template => !existingIds.has(template.id)).forEach(template => {
      this.saveTemplate(template);
    });
  }

  close(): void {
    if (this.db.open) {
      this.db.close();
    }
  }

  getRawDatabase(): Database.Database {
    return this.db;
  }

  saveProject(project: Project): void {
    this.db
      .prepare<[ProjectRow]>(`
        INSERT INTO projects (
          id,
          name,
          event_info_json,
          sop_document_json,
          risk_assessment_json,
          form_progress_json,
          status,
          created_at,
          updated_at
        ) VALUES (
          @id,
          @name,
          @event_info_json,
          @sop_document_json,
          @risk_assessment_json,
          @form_progress_json,
          @status,
          @created_at,
          @updated_at
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          event_info_json = excluded.event_info_json,
          sop_document_json = excluded.sop_document_json,
          risk_assessment_json = excluded.risk_assessment_json,
          form_progress_json = excluded.form_progress_json,
          status = excluded.status,
          updated_at = excluded.updated_at
      `)
      .run({
        id: project.id,
        name: project.name,
        event_info_json: serializeJson(project.eventInfo),
        sop_document_json: project.sopDocument === undefined ? null : serializeJson(project.sopDocument),
        risk_assessment_json: project.riskAssessment === undefined ? null : serializeJson(project.riskAssessment),
        form_progress_json: project.formProgress === undefined ? null : serializeJson(project.formProgress),
        status: project.status,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      });
  }

  getProjects(): Project[] {
    const rows = this.db.prepare<[], ProjectRow>('SELECT * FROM projects ORDER BY updated_at DESC').all();
    return rows.map(mapProjectRow);
  }

  getProject(projectId: string): Project | null {
    const row = this.db.prepare<[string], ProjectRow>('SELECT * FROM projects WHERE id = ?').get(projectId);
    return row ? mapProjectRow(row) : null;
  }

  listProjects(filter?: ProjectFilter): Project[] {
    const searchQuery = filter?.search?.trim().toLocaleLowerCase();
    const filteredProjects = this.getProjects().filter(project => {
      if (filter?.status && filter.status !== 'all' && project.status !== filter.status) {
        return false;
      }

      if (filter?.eventType && filter.eventType !== 'all' && project.eventInfo.type !== filter.eventType) {
        return false;
      }

      if (!searchQuery) {
        return true;
      }

      const searchableContent = [project.name, project.eventInfo.description, project.eventInfo.location]
        .join(' ')
        .toLocaleLowerCase();

      return searchableContent.includes(searchQuery);
    });

    const sortedProjects = sortProjects(filteredProjects, filter?.sortBy, filter?.sortDirection);
    if (typeof filter?.limit === 'number' && filter.limit > 0) {
      return sortedProjects.slice(0, filter.limit);
    }

    return sortedProjects;
  }

  searchProjects(query: string): Project[] {
    return this.listProjects({ search: query, sortBy: 'updatedAt', sortDirection: 'desc' });
  }

  duplicateProject(projectId: string, newName: string): Project {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error('找不到要複製的專案。');
    }

    const duplicatedProject = buildProjectFromTemplate(
      buildTemplateFromProject(project, newName.trim() || `${project.name} 副本`, {
        includeSop: true,
        includeRisk: true,
        includeEventSettings: true,
      }),
      newName.trim() || `${project.name} 副本`
    );
    duplicatedProject.formProgress = {
      currentStep: 0,
    };

    this.saveProject(duplicatedProject);
    return duplicatedProject;
  }

  updateProjectStatus(projectId: string, status: ProjectStatus): Project {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error('找不到要更新狀態的專案。');
    }

    const timestamp = new Date().toISOString();
    const updatedProject: Project = {
      ...project,
      status,
      updatedAt: timestamp,
      eventInfo: {
        ...project.eventInfo,
        updatedAt: timestamp,
      },
    };

    this.saveProject(updatedProject);
    return updatedProject;
  }

  getProjectStats(): ProjectStats {
    return this.getProjects().reduce<ProjectStats>(
      (stats, project) => ({
        total: stats.total + 1,
        byStatus: {
          ...stats.byStatus,
          [project.status]: stats.byStatus[project.status] + 1,
        },
        lastUpdatedAt:
          !stats.lastUpdatedAt || project.updatedAt > stats.lastUpdatedAt ? project.updatedAt : stats.lastUpdatedAt,
      }),
      {
        total: 0,
        byStatus: {
          draft: 0,
          in_progress: 0,
          completed: 0,
        },
        lastUpdatedAt: null,
      }
    );
  }

  deleteProject(projectId: string): void {
    this.db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  }

  saveTemplate(template: Template): void {
    const normalizedTemplate = normalizeTemplate(template);

    this.db
      .prepare<[TemplateRow]>(`
        INSERT INTO templates (
          id,
          name,
          type,
          event_type,
          content_json,
          is_default,
          created_at
        ) VALUES (
          @id,
          @name,
          @type,
          @event_type,
          @content_json,
          @is_default,
          @created_at
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          type = excluded.type,
          event_type = excluded.event_type,
          content_json = excluded.content_json,
          is_default = excluded.is_default
      `)
      .run({
        id: normalizedTemplate.id,
        name: normalizedTemplate.name,
        type: normalizedTemplate.type,
        event_type: normalizedTemplate.eventType,
        content_json: serializeJson(normalizedTemplate.content),
        is_default: normalizedTemplate.isDefault ? 1 : 0,
        created_at: normalizedTemplate.createdAt,
      });
  }

  getTemplate(templateId: string): Template | null {
    const row = this.db.prepare<[string], TemplateRow>('SELECT * FROM templates WHERE id = ?').get(templateId);
    return row ? mapTemplateRow(row) : null;
  }

  getTemplates(filter?: TemplateFilter): Template[] {
    const searchQuery = filter?.search?.trim().toLocaleLowerCase();
    const filteredTemplates = this.db
      .prepare<[], TemplateRow>('SELECT * FROM templates')
      .all()
      .map(mapTemplateRow)
      .filter(template => {
        if (filter?.type && filter.type !== 'all' && template.type !== filter.type) {
          return false;
        }

        if (filter?.eventType && filter.eventType !== 'all' && template.eventType !== filter.eventType) {
          return false;
        }

        if (filter?.defaultOnly && !template.isDefault) {
          return false;
        }

        if (!searchQuery) {
          return true;
        }

        return template.name.toLocaleLowerCase().includes(searchQuery);
      });

    const sortedTemplates = sortTemplates(filteredTemplates, filter?.sortBy, filter?.sortDirection);
    if (typeof filter?.limit === 'number' && filter.limit > 0) {
      return sortedTemplates.slice(0, filter.limit);
    }

    return sortedTemplates;
  }

  getDefaultTemplates(): Template[] {
    return this.getTemplates({ defaultOnly: true, sortBy: 'createdAt', sortDirection: 'desc' });
  }

  setDefaultTemplate(templateId: string, isDefault: boolean): void {
    const result = this.db
      .prepare('UPDATE templates SET is_default = ? WHERE id = ?')
      .run(isDefault ? 1 : 0, templateId);

    if (result.changes === 0) {
      throw new Error('找不到要更新的範本。');
    }
  }

  createTemplateFromProject(
    projectId: string,
    templateName: string,
    options?: {
      includeSop?: boolean;
      includeRisk?: boolean;
      includeEventSettings?: boolean;
      isDefault?: boolean;
    }
  ): Template {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error('找不到要建立範本的專案。');
    }

    const template = buildTemplateFromProject(project, templateName, options);
    this.saveTemplate(template);
    return template;
  }

  createProjectFromTemplate(templateId: string, projectName: string): Project {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('找不到指定範本。');
    }

    const project = buildProjectFromTemplate(template, projectName);
    this.saveProject(project);
    return project;
  }

  deleteTemplate(templateId: string): void {
    this.db.prepare('DELETE FROM templates WHERE id = ?').run(templateId);
  }

  saveSetting(key: string, value: unknown): void {
    this.db
      .prepare<[SettingRow]>(`
        INSERT INTO settings (key, value)
        VALUES (@key, @value)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `)
      .run({
        key,
        value: serializeJson(value),
      });
  }

  getSetting<T>(key: string): T | null {
    const row = this.db.prepare<[string], SettingRow>('SELECT * FROM settings WHERE key = ?').get(key);
    return row ? (deserializeJson<T>(row.value) ?? null) : null;
  }

  getSettings(): Record<string, unknown> {
    const rows = this.db.prepare<[], SettingRow>('SELECT * FROM settings').all();

    return rows.reduce<Record<string, unknown>>((accumulator, row) => {
      accumulator[row.key] = deserializeJson(row.value);
      return accumulator;
    }, {});
  }

  deleteSetting(key: string): void {
    this.db.prepare('DELETE FROM settings WHERE key = ?').run(key);
  }

  saveAppSettings(settings: AppSettings): void {
    this.saveSetting(APP_SETTINGS_KEY, settings);
  }

  getAppSettings(): AppSettings | null {
    return this.getSetting<AppSettings>(APP_SETTINGS_KEY);
  }
}
