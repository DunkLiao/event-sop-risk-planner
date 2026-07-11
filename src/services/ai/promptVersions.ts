import { GenerateRiskRequest, GenerateSOPRequest } from '../../types/ai.js';
import { buildRiskPrompts, buildSOPPrompts, PromptTemplateVariant } from './prompts.js';

export type PromptKind = 'sop' | 'risk';

export interface PromptVersionDefinition<TRequest> {
  id: string;
  kind: PromptKind;
  name: string;
  description: string;
  variant: PromptTemplateVariant;
  buildPrompts: (request: TRequest) => { systemPrompt: string; userPrompt: string };
}

export interface PromptUsageRecord {
  versionId: string;
  kind: PromptKind;
  parseable: boolean;
  completenessScore: number;
  latencyMs?: number;
  timestamp: string;
}

export interface PromptVersionStats {
  versionId: string;
  kind: PromptKind;
  totalRuns: number;
  parseableRate: number;
  averageCompletenessScore: number;
  averageLatencyMs: number | null;
}

export const SOP_PROMPT_VERSIONS: ReadonlyArray<PromptVersionDefinition<GenerateSOPRequest>> = [
  {
    id: 'sop-legacy-v1',
    kind: 'sop',
    name: 'Legacy SOP Prompt',
    description: '早期自由格式 SOP prompt，用於與結構化版本比較。',
    variant: 'legacy',
    buildPrompts: request => buildSOPPrompts(request, { variant: 'legacy' }),
  },
  {
    id: 'sop-structured-v2',
    kind: 'sop',
    name: 'Structured SOP Prompt v2',
    description: '加入 JSON schema、few-shot 範例與活動類型/規模客製化。',
    variant: 'structured-v2',
    buildPrompts: request => buildSOPPrompts(request, { variant: 'structured-v2' }),
  },
] as const;

export const RISK_PROMPT_VERSIONS: ReadonlyArray<PromptVersionDefinition<GenerateRiskRequest>> = [
  {
    id: 'risk-legacy-v1',
    kind: 'risk',
    name: 'Legacy Risk Prompt',
    description: '早期自由格式風險評估 prompt，用於與結構化版本比較。',
    variant: 'legacy',
    buildPrompts: request => buildRiskPrompts(request, { variant: 'legacy' }),
  },
  {
    id: 'risk-structured-v2',
    kind: 'risk',
    name: 'Structured Risk Prompt v2',
    description: '加入 JSON schema、風險分數要求與活動規模風險深度控制。',
    variant: 'structured-v2',
    buildPrompts: request => buildRiskPrompts(request, { variant: 'structured-v2' }),
  },
] as const;

export const getPromptVersions = <TRequest>(kind: PromptKind): ReadonlyArray<PromptVersionDefinition<TRequest>> =>
  (kind === 'sop' ? SOP_PROMPT_VERSIONS : RISK_PROMPT_VERSIONS) as ReadonlyArray<PromptVersionDefinition<TRequest>>;

export const getPromptVersionById = <TRequest>(kind: PromptKind, versionId: string): PromptVersionDefinition<TRequest> | null =>
  getPromptVersions<TRequest>(kind).find(version => version.id === versionId) ?? null;

const hashSeed = (seed: string): number =>
  seed.split('').reduce((accumulator, char) => (accumulator * 31 + char.charCodeAt(0)) >>> 0, 0);

export const selectPromptVersion = <TRequest>(
  kind: PromptKind,
  strategy: 'latest' | 'ab' = 'latest',
  seed = 'default'
): PromptVersionDefinition<TRequest> => {
  const versions = getPromptVersions<TRequest>(kind);

  if (versions.length === 0) {
    throw new Error(`No prompt versions registered for kind: ${kind}`);
  }

  if (strategy === 'latest') {
    return versions[versions.length - 1];
  }

  return versions[hashSeed(seed) % versions.length];
};

export class PromptEffectTracker {
  private readonly records: PromptUsageRecord[] = [];

  record(record: PromptUsageRecord): void {
    this.records.push(record);
  }

  getRecords(kind?: PromptKind): PromptUsageRecord[] {
    return this.records.filter(record => !kind || record.kind === kind);
  }

  getStats(kind?: PromptKind): PromptVersionStats[] {
    const scopedRecords = this.getRecords(kind);
    const byVersion = new Map<string, PromptUsageRecord[]>();

    for (const record of scopedRecords) {
      const records = byVersion.get(record.versionId) ?? [];
      records.push(record);
      byVersion.set(record.versionId, records);
    }

    return Array.from(byVersion.entries()).map(([versionId, records]) => {
      const totalRuns = records.length;
      const parseableRuns = records.filter(record => record.parseable).length;
      const completenessScoreSum = records.reduce((sum, record) => sum + record.completenessScore, 0);
      const latencyValues = records
        .map(record => record.latencyMs)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

      return {
        versionId,
        kind: records[0].kind,
        totalRuns,
        parseableRate: totalRuns === 0 ? 0 : parseableRuns / totalRuns,
        averageCompletenessScore: totalRuns === 0 ? 0 : completenessScoreSum / totalRuns,
        averageLatencyMs:
          latencyValues.length === 0 ? null : latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length,
      };
    });
  }
}
