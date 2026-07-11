import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { EventScale, EventType } from '../../src/types/event.js';
import type { MitigationApproach, RiskCategory, RiskSeverity, RiskStatus } from '../../src/types/risk.js';
import type { AppSettings, Project, Template } from '../../src/types/settings.js';
import { LocalDatabase, getDatabaseFilePath } from '../../src/services/storage/database.js';

const workspaceRoot = path.join(process.cwd(), '.test-workspace', 'database');

const createTestDatabase = (name: string) => {
  const userDataPath = path.join(workspaceRoot, name);
  fs.rmSync(userDataPath, { recursive: true, force: true });

  return new LocalDatabase({
    userDataPath,
    dbFileName: 'test.sqlite3',
  });
};

const sampleProject: Project = {
  id: 'project-1',
  name: '�ն��C�|',
  eventInfo: {
    id: 'project-1',
    name: '�ն��C�|',
    type: 'festival' as EventType,
    scale: 'medium' as EventScale,
    startDate: '2026-07-20',
    endDate: '2026-07-21',
    location: '���ʤ���',
    description: '�ն�~�׶�C�|�P��t����',
    attendees: 300,
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-07-10T11:00:00.000Z',
  },
  sopDocument: {
    eventId: 'project-1',
    eventName: '�ն��C�|',
    sections: [
      {
        id: 'section-1',
        title: '�G�m',
        order: 1,
        content: '�����|���G�m�P�ʽu�W��',
        tasks: [],
      },
    ],
    timeline: [],
    checklist: [],
    generatedAt: '2026-07-10T10:30:00.000Z',
  },
  riskAssessment: {
    eventId: 'project-1',
    eventName: '�ն��C�|',
    risks: [
      {
        id: 'risk-1',
        category: 'safety' as RiskCategory,
        title: '�U�B',
        description: '��~�ϰ�i��]�j�B�v�T�i��',
        likelihood: 3,
        impact: 4,
        riskScore: 12,
        riskLevel: 'medium' as RiskSeverity,
        mitigation: {
          approach: 'reduce' as MitigationApproach,
          actions: ['�ǳƫB�Ƴ��a'],
          timeline: '���ʫe�@�g',
          resources: ['�ƴ��׬['],
        },
        status: 'identified' as RiskStatus,
      },
    ],
    riskMatrix: {
      dimensions: {
        likelihood: ['�C', '��', '��'],
        impact: ['�C', '��', '��'],
      },
      cells: [],
    },
    summary: {
      totalRisks: 1,
      risksBySeverity: {
        low: 0,
        medium: 1,
        high: 0,
        critical: 0,
      },
      risksByCategory: {
        safety: 1,
        health: 0,
        financial: 0,
        operational: 0,
        reputational: 0,
        legal: 0,
        technical: 0,
        environmental: 0,
        logistical: 0,
        other: 0,
      },
      topRisks: ['�U�B'],
    },
    generatedAt: '2026-07-10T10:45:00.000Z',
  },
  formProgress: {
    currentStep: 1,
  },
  status: 'draft',
  createdAt: '2026-07-10T10:00:00.000Z',
  updatedAt: '2026-07-10T11:00:00.000Z',
};

const secondProject: Project = {
  ...sampleProject,
  id: 'project-2',
  name: '���~�~�|',
  eventInfo: {
    ...sampleProject.eventInfo,
    id: 'project-2',
    name: '���~�~�|',
    type: 'corporate' as EventType,
    scale: 'large' as EventScale,
    description: '���~�~�ת���P�߮b',
    updatedAt: '2026-07-11T08:00:00.000Z',
  },
  status: 'completed',
  createdAt: '2026-07-11T07:00:00.000Z',
  updatedAt: '2026-07-11T08:00:00.000Z',
};

const sampleTemplate: Template = {
  id: 'template-1',
  name: '���� SOP �d��',
  type: 'sop',
  eventType: 'festival',
  content: {
    sopTemplate: {
      checklist: [
        { id: 'checklist-1', category: '�{��', item: '�T�{���a', checked: false },
        { id: 'checklist-2', category: '�H��', item: '�T�{�H�O', checked: false },
      ],
    },
  },
  createdAt: '2026-07-10T09:00:00.000Z',
  isDefault: true,
};

const sampleSettings: AppSettings = {
  ai: {
    defaultProvider: 'openai',
    openai: {
      apiKey: 'test-openai-key',
      model: 'gpt-4o',
      temperature: 0.4,
      maxTokens: 2048,
    },
    claude: {
      apiKey: 'test-claude-key',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
      maxTokens: 4096,
    },
  },
  document: {
    defaultExportFormat: 'both',
    autoSave: true,
    saveDirectory: 'C:\\exports',
    templatePreferences: {
      sopTemplate: 'default-sop',
      riskTemplate: 'default-risk',
    },
  },
  general: {
    language: 'zh-TW',
    theme: 'dark',
    autoUpdate: true,
    telemetry: false,
  },
};

test('initializes database schema and file', () => {
  const database = createTestDatabase('initialization');

  try {
    const databasePath = getDatabaseFilePath(path.join(workspaceRoot, 'initialization'), 'test.sqlite3');
    assert.equal(fs.existsSync(databasePath), true);

    const tables = database
      .getRawDatabase()
      .prepare<[], { name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('projects', 'templates', 'settings') ORDER BY name"
      )
      .all()
      .map((row: { name: string }) => row.name);

    assert.deepEqual(tables, ['projects', 'settings', 'templates']);
    assert.equal(database.getRawDatabase().pragma('user_version', { simple: true }), 2);
  } finally {
    database.close();
  }
});

test('supports CRUD operations and JSON serialization', () => {
  const database = createTestDatabase('crud');

  try {
    database.saveProject(sampleProject);
    database.saveTemplate(sampleTemplate);
    database.saveAppSettings(sampleSettings);

    assert.deepEqual(database.getProject(sampleProject.id), sampleProject);
    assert.deepEqual(database.getProjects(), [sampleProject]);
    assert.deepEqual(database.getTemplates({ type: 'sop' }), [sampleTemplate]);
    assert.deepEqual(database.getAppSettings(), sampleSettings);

    database.deleteTemplate(sampleTemplate.id);
    database.deleteProject(sampleProject.id);

    assert.equal(database.getProject(sampleProject.id), null);
    assert.equal(database.getTemplate(sampleTemplate.id), null);
    assert.equal(database.getTemplates().every(template => template.id !== sampleTemplate.id), true);
  } finally {
    database.close();
  }
});

test('persists data after reopening the database', () => {
  const userDataPath = path.join(workspaceRoot, 'persistence');
  fs.rmSync(userDataPath, { recursive: true, force: true });

  const firstDatabase = new LocalDatabase({
    userDataPath,
    dbFileName: 'test.sqlite3',
  });

  firstDatabase.saveProject(sampleProject);
  firstDatabase.close();

  const secondDatabase = new LocalDatabase({
    userDataPath,
    dbFileName: 'test.sqlite3',
  });

  try {
    assert.deepEqual(secondDatabase.getProjects(), [sampleProject]);
  } finally {
    secondDatabase.close();
  }
});

test('supports project filters, duplication, status updates and statistics', () => {
  const database = createTestDatabase('project-management');

  try {
    database.saveProject(sampleProject);
    database.saveProject(secondProject);

    assert.deepEqual(
      database.listProjects({ search: '���~', status: 'completed', sortBy: 'name', sortDirection: 'asc' }),
      [secondProject]
    );

    const duplicatedProject = database.duplicateProject(sampleProject.id, '�ն��C�| �ƥ�');
    assert.equal(duplicatedProject.name, '�ն��C�| �ƥ�');
    assert.equal(duplicatedProject.status, 'draft');
    assert.notEqual(duplicatedProject.id, sampleProject.id);
    assert.equal(duplicatedProject.formProgress?.currentStep, 0);

    const updatedProject = database.updateProjectStatus(sampleProject.id, 'in_progress');
    assert.equal(updatedProject.status, 'in_progress');

    const stats = database.getProjectStats();
    assert.equal(stats.total, 3);
    assert.equal(stats.byStatus.draft, 1);
    assert.equal(stats.byStatus.in_progress, 1);
    assert.equal(stats.byStatus.completed, 1);
    assert.equal(stats.lastUpdatedAt !== null, true);
  } finally {
    database.close();
  }
});
