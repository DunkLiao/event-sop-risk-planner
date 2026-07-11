import { EventScale, EventType, TaskStatus, type ChecklistItem, type EventInfo, type SOPDocument, type SOPSection, type SOPTask, type TimelineItem } from '../types/event';
import {
  MitigationApproach,
  RiskCategory,
  RiskSeverity,
  RiskStatus,
  type MitigationStrategy,
  type Risk,
  type RiskAssessment,
  type RiskMatrix,
  type RiskMatrixCell,
  type RiskSummary,
} from '../types/risk';
import type { Project, Template, TemplateContent, TemplateType } from '../types/settings';
import { EVENT_TYPE_OPTIONS } from './constants';
import { generateId } from './helpers';

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  sop: 'SOP',
  risk: '風險評估',
  full: '完整專案',
};

export const TEMPLATE_SORT_LABELS = {
  'createdAt:desc': '最新建立',
  'name:asc': '名稱 A → Z',
  'eventType:asc': '活動類型',
  'type:asc': '範本類型',
} as const;

export interface TemplateCreationOptions {
  includeSop?: boolean;
  includeRisk?: boolean;
  includeEventSettings?: boolean;
  isDefault?: boolean;
}

const createId = (prefix: string): string => `${prefix}-${generateId()}`;

const cloneValue = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const createUniqueTemplateName = (baseName: string, existingTemplates: Template[]): string => {
  const existingNames = new Set(existingTemplates.map(template => template.name));
  const safeBaseName = baseName.trim() || '未命名範本';
  const initialName = `${safeBaseName}（匯入副本）`;

  if (!existingNames.has(initialName)) {
    return initialName;
  }

  let counter = 2;
  while (existingNames.has(`${initialName} ${counter}`)) {
    counter += 1;
  }

  return `${initialName} ${counter}`;
};

export const getTemplateTypeLabel = (type: TemplateType): string => TEMPLATE_TYPE_LABELS[type];

export const getTemplateEventTypeLabel = (eventType: string): string =>
  EVENT_TYPE_OPTIONS.find(option => option.value === eventType)?.label ?? eventType;

export const determineTemplateType = (content: TemplateContent): TemplateType => {
  const hasSop = Boolean(content.sopTemplate);
  const hasRisk = Boolean(content.riskTemplate);
  const hasEventSettings = Boolean(content.eventSettings);

  if ((hasSop && hasRisk) || hasEventSettings) {
    return 'full';
  }

  if (hasRisk) {
    return 'risk';
  }

  return 'sop';
};

export const buildTemplateFromProject = (
  project: Project,
  templateName: string,
  options: TemplateCreationOptions = {}
): Template => {
  const includeSop = options.includeSop ?? true;
  const includeRisk = options.includeRisk ?? true;
  const includeEventSettings = options.includeEventSettings ?? true;

  if (!includeSop && !includeRisk && !includeEventSettings) {
    throw new Error('請至少選擇一項內容納入範本。');
  }

  const content: TemplateContent = {};

  if (includeSop && project.sopDocument) {
    content.sopTemplate = cloneValue(project.sopDocument);
  }

  if (includeRisk && project.riskAssessment) {
    content.riskTemplate = cloneValue(project.riskAssessment);
  }

  if (includeEventSettings) {
    content.eventSettings = cloneValue(project.eventInfo);
  }

  return normalizeTemplate({
    id: createId('template'),
    name: templateName.trim() || `${project.name} 範本`,
    type: determineTemplateType(content),
    eventType: project.eventInfo.type,
    content,
    isDefault: options.isDefault ?? false,
    createdAt: new Date().toISOString(),
  });
};

export const cloneTemplateForImport = (template: Template, existingTemplates: Template[]): Template =>
  normalizeTemplate({
    ...cloneValue(template),
    id: createId('template'),
    name: createUniqueTemplateName(template.name, existingTemplates),
    isDefault: false,
    createdAt: new Date().toISOString(),
  });

const normalizeSopTasks = (tasks: Partial<SOPTask>[] = []): SOPTask[] =>
  tasks.map(task => ({
    id: task.id ?? createId('task'),
    title: task.title ?? '未命名任務',
    description: task.description ?? '',
    responsible: task.responsible ?? '待指派',
    estimatedDuration: task.estimatedDuration,
    deadline: task.deadline,
    dependencies: task.dependencies ?? [],
    status: task.status ?? TaskStatus.PENDING,
  }));

const normalizeSopSections = (sections: Partial<SOPSection>[] = []): SOPSection[] =>
  sections.map((section, index) => ({
    id: section.id ?? createId('section'),
    title: section.title ?? `章節 ${index + 1}`,
    order: section.order ?? index + 1,
    content: section.content ?? '',
    estimatedDuration: section.estimatedDuration,
    tasks: normalizeSopTasks(section.tasks),
  }));

const normalizeTimeline = (timeline: Partial<TimelineItem>[] = []): TimelineItem[] =>
  timeline.map(item => ({
    id: item.id ?? createId('timeline'),
    date: item.date ?? '',
    time: item.time,
    milestone: item.milestone ?? '未命名里程碑',
    description: item.description ?? '',
  }));

const normalizeChecklist = (checklist: Partial<ChecklistItem>[] = []): ChecklistItem[] =>
  checklist.map(item => ({
    id: item.id ?? createId('check'),
    category: item.category ?? '一般',
    item: item.item ?? '未命名檢查項目',
    checked: item.checked ?? false,
  }));

const buildDefaultRiskMatrix = (): RiskMatrix => ({
  dimensions: {
    likelihood: ['極低', '低', '中', '高', '極高'],
    impact: ['極低', '低', '中', '高', '極高'],
  },
  cells: [],
});

const buildEmptyRiskSummary = (): RiskSummary => ({
  totalRisks: 0,
  risksBySeverity: {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  },
  risksByCategory: {
    safety: 0,
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
  topRisks: [],
});

const calculateRiskSummary = (risks: Risk[]): RiskSummary =>
  risks.reduce<RiskSummary>((summary, risk) => {
    const nextSummary = cloneValue(summary);
    nextSummary.totalRisks += 1;
    nextSummary.risksBySeverity[risk.riskLevel] += 1;
    nextSummary.risksByCategory[risk.category] += 1;
    nextSummary.topRisks = [...nextSummary.topRisks, risk.title].slice(0, 5);
    return nextSummary;
  }, buildEmptyRiskSummary());

const normalizeMitigation = (mitigation?: Partial<MitigationStrategy>): MitigationStrategy => ({
  approach: mitigation?.approach ?? MitigationApproach.REDUCE,
  actions: mitigation?.actions ?? [],
  timeline: mitigation?.timeline ?? '',
  resources: mitigation?.resources ?? [],
  contingencyPlan: mitigation?.contingencyPlan,
});

const normalizeRisks = (risks: Partial<Risk>[] = []): Risk[] =>
  risks.map(risk => {
    const likelihood = risk.likelihood ?? 3;
    const impact = risk.impact ?? 3;
    const riskScore = risk.riskScore ?? likelihood * impact;
    const riskLevel =
      risk.riskLevel ??
      (riskScore >= 21 ? RiskSeverity.CRITICAL : riskScore >= 13 ? RiskSeverity.HIGH : riskScore >= 7 ? RiskSeverity.MEDIUM : RiskSeverity.LOW);

    return {
      id: risk.id ?? createId('risk'),
      category: risk.category ?? RiskCategory.OTHER,
      title: risk.title ?? '未命名風險',
      description: risk.description ?? '',
      likelihood,
      impact,
      riskScore,
      riskLevel,
      mitigation: normalizeMitigation(risk.mitigation),
      responsiblePerson: risk.responsiblePerson,
      status: risk.status ?? RiskStatus.IDENTIFIED,
    };
  });

const normalizeRiskMatrixCells = (cells: Partial<RiskMatrixCell>[][] = []): RiskMatrixCell[][] =>
  cells.map(row =>
    row.map(cell => ({
      likelihood: cell.likelihood ?? 1,
      impact: cell.impact ?? 1,
      severity: cell.severity ?? RiskSeverity.LOW,
      risks: cell.risks ?? [],
    }))
  );

const buildEventInfoFromTemplate = (template: Template, projectId: string, projectName: string, now: string): EventInfo => {
  const eventSettings = template.content.eventSettings ?? {};

  return {
    id: projectId,
    name: projectName,
    type: (eventSettings.type as EventType | undefined) ?? ((template.eventType as EventType) || EventType.OTHER),
    scale: (eventSettings.scale as EventScale | undefined) ?? EventScale.MEDIUM,
    startDate: eventSettings.startDate ?? '',
    endDate: eventSettings.endDate ?? '',
    location: eventSettings.location ?? '',
    description: eventSettings.description ?? '',
    attendees: eventSettings.attendees ?? 0,
    budget: eventSettings.budget,
    specialRequirements: eventSettings.specialRequirements,
    createdAt: now,
    updatedAt: now,
  };
};

const buildSopDocumentFromTemplate = (
  projectId: string,
  projectName: string,
  template?: Partial<SOPDocument>
): SOPDocument => ({
  eventId: projectId,
  eventName: projectName,
  sections: normalizeSopSections(template?.sections),
  timeline: normalizeTimeline(template?.timeline),
  checklist: normalizeChecklist(template?.checklist),
  generatedAt: new Date().toISOString(),
});

const buildRiskAssessmentFromTemplate = (
  projectId: string,
  projectName: string,
  template?: Partial<RiskAssessment>
): RiskAssessment => {
  const risks = normalizeRisks(template?.risks);

  return {
    eventId: projectId,
    eventName: projectName,
    risks,
    riskMatrix: {
      dimensions: template?.riskMatrix?.dimensions ?? buildDefaultRiskMatrix().dimensions,
      cells: normalizeRiskMatrixCells(template?.riskMatrix?.cells),
    },
    summary: template?.summary ? cloneValue(template.summary) : calculateRiskSummary(risks),
    generatedAt: new Date().toISOString(),
  };
};

export const buildProjectFromTemplate = (template: Template, projectName: string): Project => {
  const now = new Date().toISOString();
  const projectId = createId('project');
  const normalizedTemplate = normalizeTemplate(template);
  const eventInfo = buildEventInfoFromTemplate(normalizedTemplate, projectId, projectName.trim() || normalizedTemplate.name, now);

  return {
    id: projectId,
    name: projectName.trim() || normalizedTemplate.name,
    eventInfo,
    sopDocument:
      normalizedTemplate.type === 'risk' && !normalizedTemplate.content.sopTemplate
        ? undefined
        : buildSopDocumentFromTemplate(projectId, eventInfo.name, normalizedTemplate.content.sopTemplate),
    riskAssessment:
      normalizedTemplate.type === 'sop' && !normalizedTemplate.content.riskTemplate
        ? undefined
        : buildRiskAssessmentFromTemplate(projectId, eventInfo.name, normalizedTemplate.content.riskTemplate),
    createdAt: now,
    updatedAt: now,
    status: 'draft',
  };
};

export const normalizeTemplate = (value: Partial<Template> & Pick<Template, 'name' | 'eventType'>): Template => {
  const content = cloneValue(value.content ?? {});

  return {
    id: value.id ?? createId('template'),
    name: value.name.trim(),
    type: value.type ?? determineTemplateType(content),
    eventType: value.eventType,
    content,
    isDefault: value.isDefault ?? false,
    createdAt: value.createdAt ?? new Date().toISOString(),
  };
};
