import {
  ChecklistItem,
  SOPSection,
  SOPTask,
  TaskStatus,
  TimelineItem,
} from '../../types/event.js';
import {
  MitigationApproach,
  Risk,
  RiskCategory,
  RiskLevel,
  RiskMatrix,
  RiskStatus,
  RiskSummary,
} from '../../types/risk.js';
import { buildRiskMatrix, buildRiskSummary, deriveRiskSeverity } from './postProcessors.js';

type JsonObject = Record<string, unknown>;

export type AIResponseParseErrorCode =
  | 'empty_response'
  | 'json_not_found'
  | 'json_parse_failed'
  | 'invalid_json_root'
  | 'invalid_structure';

export interface ParsedSOPResult {
  sections: SOPSection[];
  timeline: TimelineItem[];
  checklist: ChecklistItem[];
}

export interface ParsedRiskResult {
  risks: Risk[];
  riskMatrix: RiskMatrix;
  summary: RiskSummary;
}

export class AIResponseParseError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string,
    public readonly cause?: unknown,
    public readonly code: AIResponseParseErrorCode = 'invalid_structure'
  ) {
    super(message);
    this.name = 'AIResponseParseError';
  }
}

const isObject = (value: unknown): value is JsonObject => typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeWhitespace = (value: string): string =>
  value
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const optionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = normalizeWhitespace(value);
  return normalized ? normalized : undefined;
};

const requiredString = (value: unknown, fallback: string): string => optionalString(value) ?? fallback;

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const clampInteger = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = toNumber(value);
  const normalized = parsed === undefined ? fallback : Math.round(parsed);
  return Math.max(min, Math.min(max, normalized));
};

const optionalBoolean = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map(item => optionalString(item))
      .filter((item): item is string => Boolean(item));
  }

  const singleValue = optionalString(value);
  return singleValue ? [singleValue] : [];
};

const toObject = (value: unknown): JsonObject => {
  if (isObject(value)) {
    return value;
  }

  const singleValue = optionalString(value);
  return singleValue ? { title: singleValue, description: singleValue, content: singleValue } : {};
};

const parseTaskStatus = (value: unknown): TaskStatus => {
  switch (value) {
    case TaskStatus.IN_PROGRESS:
    case TaskStatus.COMPLETED:
    case TaskStatus.BLOCKED:
    case TaskStatus.PENDING:
      return value;
    default:
      return TaskStatus.PENDING;
  }
};

const parseRiskCategory = (value: unknown): RiskCategory => {
  const normalized = optionalString(value)?.toLowerCase();

  switch (normalized) {
    case RiskCategory.SAFETY:
    case RiskCategory.HEALTH:
    case RiskCategory.FINANCIAL:
    case RiskCategory.OPERATIONAL:
    case RiskCategory.REPUTATIONAL:
    case RiskCategory.LEGAL:
    case RiskCategory.TECHNICAL:
    case RiskCategory.ENVIRONMENTAL:
    case RiskCategory.LOGISTICAL:
      return normalized;
    default:
      return RiskCategory.OTHER;
  }
};

const parseMitigationApproach = (value: unknown): MitigationApproach => {
  const normalized = optionalString(value)?.toLowerCase();

  switch (normalized) {
    case MitigationApproach.AVOID:
    case MitigationApproach.REDUCE:
    case MitigationApproach.TRANSFER:
    case MitigationApproach.ACCEPT:
      return normalized;
    default:
      return MitigationApproach.REDUCE;
  }
};

const parseRiskStatus = (value: unknown): RiskStatus => {
  const normalized = optionalString(value)?.toLowerCase();

  switch (normalized) {
    case RiskStatus.IDENTIFIED:
    case RiskStatus.MITIGATED:
    case RiskStatus.MONITORED:
    case RiskStatus.CLOSED:
    case RiskStatus.ASSESSED:
      return normalized;
    default:
      return RiskStatus.ASSESSED;
  }
};

const extractFencedCodeBlock = (response: string): string | null => {
  const match = response.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? null;
};

const extractBalancedJsonObject = (response: string): string | null => {
  let start = -1;
  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = 0; index < response.length; index += 1) {
    const character = response[index];

    if (start === -1) {
      if (character === '{') {
        start = index;
        depth = 1;
      }
      continue;
    }

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (character === '\\') {
        isEscaped = true;
        continue;
      }

      if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === '{') {
      depth += 1;
      continue;
    }

    if (character === '}') {
      depth -= 1;

      if (depth === 0) {
        return response.slice(start, index + 1).trim();
      }
    }
  }

  return null;
};

const stripJsonComments = (value: string): string => value.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const quoteBareObjectKeys = (value: string): string => value.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_\-]*)(\s*:)/g, '$1"$2"$3');

const replaceSmartQuotes = (value: string): string =>
  value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

const convertSimpleSingleQuotes = (value: string): string =>
  value.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, content: string) => `"${content.replace(/"/g, '\\"')}"`);

const buildJsonRepairVariants = (payload: string): string[] => {
  const variants = new Set<string>();
  const push = (value: string): void => {
    const normalized = value.trim();
    if (normalized) {
      variants.add(normalized);
    }
  };

  const base = replaceSmartQuotes(payload.replace(/^\uFEFF/, '').trim());
  push(base);

  const withoutComments = stripJsonComments(base);
  push(withoutComments);

  const withoutTrailingCommas = withoutComments.replace(/,\s*([}\]])/g, '$1');
  push(withoutTrailingCommas);

  const quotedKeys = quoteBareObjectKeys(withoutTrailingCommas);
  push(quotedKeys);

  const normalizedLineBreaks = quotedKeys.replace(/\t/g, ' ');
  push(normalizedLineBreaks);

  push(convertSimpleSingleQuotes(withoutTrailingCommas));
  push(convertSimpleSingleQuotes(quotedKeys));

  return [...variants];
};

export const extractJsonPayload = (response: string): string => {
  const trimmed = response.trim();

  if (!trimmed) {
    throw new AIResponseParseError('AI response is empty.', response, undefined, 'empty_response');
  }

  const fenced = extractFencedCodeBlock(trimmed);
  if (fenced) {
    return fenced;
  }

  const balanced = extractBalancedJsonObject(trimmed);
  if (balanced) {
    return balanced;
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new AIResponseParseError('Unable to locate JSON object in AI response.', response, undefined, 'json_not_found');
};

export const parseJsonObject = (response: string): JsonObject => {
  const candidates = new Set<string>();
  const trimmed = response.trim();

  if (trimmed) {
    candidates.add(trimmed);
  }

  try {
    candidates.add(extractJsonPayload(response));
  } catch (error) {
    if (error instanceof AIResponseParseError && error.code === 'json_not_found' && trimmed.startsWith('{') && trimmed.endsWith('}')) {
      candidates.add(trimmed);
    } else if (error instanceof AIResponseParseError && error.code !== 'json_not_found') {
      throw error;
    } else if (error instanceof AIResponseParseError) {
      throw error;
    }
  }

  let lastError: unknown = null;

  for (const candidate of candidates) {
    for (const payload of buildJsonRepairVariants(candidate)) {
      try {
        const parsed = JSON.parse(payload) as unknown;

        if (!isObject(parsed)) {
          throw new AIResponseParseError('Parsed AI response is not a JSON object.', response, undefined, 'invalid_json_root');
        }

        return parsed;
      } catch (error) {
        lastError = error;
      }
    }
  }

  if (lastError instanceof AIResponseParseError && lastError.code === 'invalid_json_root') {
    throw lastError;
  }

  throw new AIResponseParseError('Failed to parse AI response JSON.', response, lastError, 'json_parse_failed');
};

const normalizeTask = (value: unknown, sectionIndex: number, taskIndex: number): SOPTask => {
  const taskObject = toObject(value);
  const title = requiredString(taskObject.title, `任務 ${sectionIndex + 1}-${taskIndex + 1}`);
  const description = requiredString(taskObject.description ?? taskObject.content, title);
  const responsible = requiredString(taskObject.responsible ?? taskObject.owner, '待指派');
  const estimatedDuration = clampInteger(taskObject.estimatedDuration, 30, 0, 1440);

  return {
    id: requiredString(taskObject.id, `section-${sectionIndex + 1}-task-${taskIndex + 1}`),
    title,
    description,
    responsible,
    estimatedDuration,
    deadline: optionalString(taskObject.deadline),
    dependencies: toStringArray(taskObject.dependencies),
    status: parseTaskStatus(taskObject.status),
  } satisfies SOPTask;
};

const normalizeSection = (value: unknown, sectionIndex: number): SOPSection => {
  const sectionObject = toObject(value);
  const taskSource = Array.isArray(sectionObject.tasks)
    ? sectionObject.tasks
    : Array.isArray(sectionObject.steps)
      ? sectionObject.steps
      : Array.isArray(sectionObject.items)
        ? sectionObject.items
        : [];
  const tasks = taskSource.map((task, taskIndex) => normalizeTask(task, sectionIndex, taskIndex));
  const title = requiredString(sectionObject.title, `階段 ${sectionIndex + 1}`);
  const content = requiredString(
    sectionObject.content ?? sectionObject.description ?? sectionObject.summary,
    tasks.length > 0 ? tasks.map(task => task.title).join('、') : '待補充'
  );

  return {
    id: requiredString(sectionObject.id, `section-${sectionIndex + 1}`),
    title,
    order: clampInteger(sectionObject.order, sectionIndex + 1, 1, 999),
    content,
    tasks,
    estimatedDuration: tasks.reduce((sum, task) => sum + (task.estimatedDuration ?? 0), 0),
  } satisfies SOPSection;
};

const normalizeTimelineItem = (value: unknown, index: number): TimelineItem => {
  const timelineObject = toObject(value);
  const milestone = requiredString(timelineObject.milestone ?? timelineObject.title, `里程碑 ${index + 1}`);

  return {
    id: requiredString(timelineObject.id, `timeline-${index + 1}`),
    date: requiredString(timelineObject.date, '待確認'),
    time: optionalString(timelineObject.time),
    milestone,
    description: requiredString(timelineObject.description ?? timelineObject.content, milestone),
  } satisfies TimelineItem;
};

const normalizeChecklistItem = (value: unknown, index: number): ChecklistItem => {
  const checklistObject = toObject(value);
  const item = requiredString(checklistObject.item ?? checklistObject.title, `檢查項目 ${index + 1}`);

  return {
    id: requiredString(checklistObject.id, `checklist-${index + 1}`),
    category: requiredString(checklistObject.category, '一般'),
    item,
    checked: optionalBoolean(checklistObject.checked, false),
  } satisfies ChecklistItem;
};

const normalizeRisk = (value: unknown, index: number): Risk => {
  const riskObject = toObject(value);
  const likelihood = clampInteger(riskObject.likelihood, RiskLevel.MEDIUM, 1, 5) as RiskLevel;
  const impact = clampInteger(riskObject.impact, RiskLevel.MEDIUM, 1, 5) as RiskLevel;
  const riskScore = likelihood * impact;
  const mitigationObject = toObject(riskObject.mitigation);
  const title = requiredString(riskObject.title, `風險 ${index + 1}`);

  return {
    id: requiredString(riskObject.id, `risk-${index + 1}`),
    category: parseRiskCategory(riskObject.category),
    title,
    description: requiredString(riskObject.description ?? riskObject.content, title),
    likelihood,
    impact,
    riskScore,
    riskLevel: deriveRiskSeverity(riskScore),
    mitigation: {
      approach: parseMitigationApproach(mitigationObject.approach),
      actions: toStringArray(mitigationObject.actions ?? mitigationObject.steps).filter(Boolean),
      timeline: requiredString(mitigationObject.timeline, '待確認'),
      resources: toStringArray(mitigationObject.resources),
      contingencyPlan: optionalString(mitigationObject.contingencyPlan),
    },
    responsiblePerson: optionalString(riskObject.responsiblePerson ?? riskObject.owner),
    status: parseRiskStatus(riskObject.status),
  } satisfies Risk;
};

export const parseSOPResponse = (response: string): ParsedSOPResult => {
  const parsed = parseJsonObject(response);

  if (!Array.isArray(parsed.sections)) {
    throw new AIResponseParseError('SOP 必須包含 sections 陣列。', response, parsed.sections, 'invalid_structure');
  }

  if (parsed.sections.length === 0) {
    throw new AIResponseParseError('SOP 至少需要一個 section。', response, parsed.sections, 'invalid_structure');
  }

  return {
    sections: parsed.sections.map((section, index) => normalizeSection(section, index)),
    timeline: Array.isArray(parsed.timeline) ? parsed.timeline.map((item, index) => normalizeTimelineItem(item, index)) : [],
    checklist: Array.isArray(parsed.checklist) ? parsed.checklist.map((item, index) => normalizeChecklistItem(item, index)) : [],
  };
};

export const parseRiskResponse = (response: string): ParsedRiskResult => {
  const parsed = parseJsonObject(response);

  if (!Array.isArray(parsed.risks)) {
    throw new AIResponseParseError('風險評估必須包含 risks 陣列。', response, parsed.risks, 'invalid_structure');
  }

  const risks = parsed.risks.map((risk, index) => normalizeRisk(risk, index));

  return {
    risks,
    riskMatrix: buildRiskMatrix(risks),
    summary: buildRiskSummary(risks),
  };
};
