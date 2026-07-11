import { EventInfo, SOPDocument, SOPSection, SOPTask, TimelineItem, ChecklistItem, TaskStatus } from '../../types/event.js';
import {
  MitigationApproach,
  Risk,
  RiskAssessment,
  RiskCategory,
  RiskMatrix,
  RiskSeverity,
  RiskStatus,
  RiskSummary,
} from '../../types/risk.js';

const trimText = (value: string): string =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const uniqueId = (preferred: string | undefined, fallback: string, usedIds: Set<string>): string => {
  const base = trimText(preferred ?? '') || fallback;
  let candidate = base;
  let suffix = 1;

  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  usedIds.add(candidate);
  return candidate;
};

const formatIsoDate = (value: string): string => {
  const trimmed = trimText(value);

  if (!trimmed) {
    return '待確認';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return trimmed;
  }

  return new Date(parsed).toISOString().slice(0, 10);
};

const formatTime = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = trimText(value);
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return trimmed || undefined;
  }

  const hours = match[1].padStart(2, '0');
  return `${hours}:${match[2]}`;
};

const formatTimestamp = (value?: string): string => {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
};

export const deriveRiskSeverity = (riskScore: number): RiskSeverity => {
  if (riskScore >= 21) {
    return RiskSeverity.CRITICAL;
  }
  if (riskScore >= 13) {
    return RiskSeverity.HIGH;
  }
  if (riskScore >= 7) {
    return RiskSeverity.MEDIUM;
  }
  return RiskSeverity.LOW;
};

export const buildRiskMatrix = (risks: Risk[]): RiskMatrix => {
  const cells: RiskMatrix['cells'] = Array.from({ length: 5 }, (_, likelihoodIndex) =>
    Array.from({ length: 5 }, (_, impactIndex) => ({
      likelihood: likelihoodIndex + 1,
      impact: impactIndex + 1,
      severity: deriveRiskSeverity((likelihoodIndex + 1) * (impactIndex + 1)),
      risks: [] as string[],
    }))
  );

  risks.forEach(risk => {
    cells[risk.likelihood - 1][risk.impact - 1].risks.push(risk.id);
  });

  return {
    dimensions: {
      likelihood: ['很低', '低', '中', '高', '很高'],
      impact: ['很低', '低', '中', '高', '很高'],
    },
    cells,
  };
};

export const buildRiskSummary = (risks: Risk[]): RiskSummary => {
  const summary: RiskSummary = {
    totalRisks: risks.length,
    risksBySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
    risksByCategory: {
      [RiskCategory.SAFETY]: 0,
      [RiskCategory.HEALTH]: 0,
      [RiskCategory.FINANCIAL]: 0,
      [RiskCategory.OPERATIONAL]: 0,
      [RiskCategory.REPUTATIONAL]: 0,
      [RiskCategory.LEGAL]: 0,
      [RiskCategory.TECHNICAL]: 0,
      [RiskCategory.ENVIRONMENTAL]: 0,
      [RiskCategory.LOGISTICAL]: 0,
      [RiskCategory.OTHER]: 0,
    },
    topRisks: [],
  };

  const sorted = [...risks].sort((left, right) => right.riskScore - left.riskScore);
  summary.topRisks = sorted.slice(0, 5).map(risk => risk.id);

  risks.forEach(risk => {
    summary.risksBySeverity[risk.riskLevel] += 1;
    summary.risksByCategory[risk.category] += 1;
  });

  return summary;
};

export const postProcessSOPDocument = (document: SOPDocument): SOPDocument => {
  const usedSectionIds = new Set<string>();
  const sections = [...document.sections]
    .map((section, sectionIndex) => {
      const usedTaskIds = new Set<string>();
      const tasks: SOPTask[] = section.tasks.map((task, taskIndex) => ({
        ...task,
        id: uniqueId(task.id, `section-${sectionIndex + 1}-task-${taskIndex + 1}`, usedTaskIds),
        title: trimText(task.title),
        description: trimText(task.description),
        responsible: trimText(task.responsible),
        estimatedDuration: Math.max(0, Math.round(task.estimatedDuration ?? 0)),
        deadline: task.deadline ? formatIsoDate(task.deadline) : undefined,
        dependencies: Array.isArray(task.dependencies) ? task.dependencies.filter(Boolean).map(trimText) : [],
        status: task.status ?? TaskStatus.PENDING,
      }));

      const processedSection: SOPSection = {
        ...section,
        id: uniqueId(section.id, `section-${sectionIndex + 1}`, usedSectionIds),
        title: trimText(section.title),
        order: Number.isFinite(section.order) ? Math.max(1, Math.round(section.order)) : sectionIndex + 1,
        content: trimText(section.content),
        tasks,
        estimatedDuration: tasks.reduce((sum, task) => sum + (task.estimatedDuration ?? 0), 0),
      };

      return processedSection;
    })
    .sort((left, right) => left.order - right.order);

  const timelineIds = new Set<string>();
  const timeline: TimelineItem[] = document.timeline.map((item, index) => ({
    ...item,
    id: uniqueId(item.id, `timeline-${index + 1}`, timelineIds),
    date: formatIsoDate(item.date),
    time: formatTime(item.time),
    milestone: trimText(item.milestone),
    description: trimText(item.description),
  }));

  const checklistIds = new Set<string>();
  const checklist: ChecklistItem[] = document.checklist.map((item, index) => ({
    ...item,
    id: uniqueId(item.id, `checklist-${index + 1}`, checklistIds),
    category: trimText(item.category),
    item: trimText(item.item),
    checked: Boolean(item.checked),
  }));

  return {
    ...document,
    eventName: trimText(document.eventName),
    sections,
    timeline,
    checklist,
    generatedAt: formatTimestamp(document.generatedAt),
  };
};

export const postProcessRiskAssessment = (assessment: RiskAssessment): RiskAssessment => {
  const usedRiskIds = new Set<string>();

  const risks: Risk[] = assessment.risks.map((risk, index) => {
    const likelihood = Math.max(1, Math.min(5, Math.round(risk.likelihood)));
    const impact = Math.max(1, Math.min(5, Math.round(risk.impact)));
    const riskScore = likelihood * impact;

    return {
      ...risk,
      id: uniqueId(risk.id, `risk-${index + 1}`, usedRiskIds),
      category: risk.category ?? RiskCategory.OTHER,
      title: trimText(risk.title),
      description: trimText(risk.description),
      likelihood,
      impact,
      riskScore,
      riskLevel: deriveRiskSeverity(riskScore),
      mitigation: {
        approach: risk.mitigation.approach ?? MitigationApproach.REDUCE,
        actions: Array.isArray(risk.mitigation.actions)
          ? risk.mitigation.actions.map(trimText).filter(Boolean)
          : [],
        timeline: trimText(risk.mitigation.timeline),
        resources: Array.isArray(risk.mitigation.resources)
          ? risk.mitigation.resources.map(trimText).filter(Boolean)
          : [],
        contingencyPlan: risk.mitigation.contingencyPlan ? trimText(risk.mitigation.contingencyPlan) : undefined,
      },
      responsiblePerson: risk.responsiblePerson ? trimText(risk.responsiblePerson) : undefined,
      status: risk.status ?? RiskStatus.ASSESSED,
    };
  });

  return {
    ...assessment,
    eventName: trimText(assessment.eventName),
    risks,
    riskMatrix: buildRiskMatrix(risks),
    summary: buildRiskSummary(risks),
    generatedAt: formatTimestamp(assessment.generatedAt),
  };
};

const buildExcerpt = (rawResponse: string): string => {
  const normalized = trimText(rawResponse);
  if (!normalized) {
    return 'AI 回應為空，請重新生成。';
  }

  return normalized.length > 500 ? `${normalized.slice(0, 500)}…` : normalized;
};

export const createFallbackSOPDocument = (rawResponse: string, eventInfo: EventInfo): SOPDocument =>
  postProcessSOPDocument({
    eventId: eventInfo.id,
    eventName: eventInfo.name,
    sections: [
      {
        id: 'section-1',
        title: 'AI 生成內容（待整理）',
        order: 1,
        content: buildExcerpt(rawResponse),
        tasks: [
          {
            id: 'section-1-task-1',
            title: '人工整理 AI 內容',
            description: '此回應未能完整解析，請根據原始內容補充 SOP 細節。',
            responsible: '待指派',
            estimatedDuration: 30,
            status: TaskStatus.PENDING,
          },
        ],
      },
    ],
    timeline: [],
    checklist: [],
    generatedAt: new Date().toISOString(),
  });

export const createFallbackRiskAssessment = (rawResponse: string, eventInfo: EventInfo): RiskAssessment =>
  postProcessRiskAssessment({
    eventId: eventInfo.id,
    eventName: eventInfo.name,
    risks: [
      {
        id: 'risk-1',
        category: RiskCategory.OPERATIONAL,
        title: '需人工確認的風險摘要',
        description: buildExcerpt(rawResponse),
        likelihood: 3,
        impact: 3,
        riskScore: 9,
        riskLevel: RiskSeverity.MEDIUM,
        mitigation: {
          approach: MitigationApproach.REDUCE,
          actions: ['重新生成 AI 風險評估', '由專案負責人人工補充風險項目'],
          timeline: '立即處理',
          resources: ['專案負責人'],
        },
        responsiblePerson: '待指派',
        status: RiskStatus.ASSESSED,
      },
    ],
    riskMatrix: buildRiskMatrix([]),
    summary: buildRiskSummary([]),
    generatedAt: new Date().toISOString(),
  });
