import { GenerateRiskRequest, GenerateSOPRequest } from '../../types/ai.js';
import { getPromptVersions, PromptEffectTracker, PromptKind, PromptVersionDefinition } from './promptVersions.js';
import { ParsedRiskResult, ParsedSOPResult, parseRiskResponse, parseSOPResponse } from './responseParser.js';

export interface PromptEvaluation<TParsed> {
  versionId: string;
  kind: PromptKind;
  parseable: boolean;
  completenessScore: number;
  missingFields: string[];
  issues: string[];
  latencyMs?: number;
  parsed?: TParsed;
}

export interface PromptExecutionResult<TParsed> extends PromptEvaluation<TParsed> {
  systemPrompt: string;
  userPrompt: string;
  rawResponse: string;
}

type PromptRequestMap = {
  sop: GenerateSOPRequest;
  risk: GenerateRiskRequest;
};

type PromptParsedMap = {
  sop: ParsedSOPResult;
  risk: ParsedRiskResult;
};

const average = (values: number[]): number => (values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length);

const evaluateSOPParsedResult = (parsed: ParsedSOPResult): Omit<PromptEvaluation<ParsedSOPResult>, 'versionId' | 'kind' | 'parseable'> => {
  const missingFields: string[] = [];
  const issues: string[] = [];
  const totalTasks = parsed.sections.reduce((sum, section) => sum + section.tasks.length, 0);

  if (parsed.sections.length === 0) {
    missingFields.push('sections');
  }
  if (totalTasks === 0) {
    missingFields.push('sections[].tasks');
  }
  if (parsed.timeline.length === 0) {
    issues.push('timeline is empty');
  }
  if (parsed.checklist.length === 0) {
    issues.push('checklist is empty');
  }

  const completenessScore = average([
    parsed.sections.length > 0 ? 1 : 0,
    totalTasks > 0 ? 1 : 0,
    parsed.timeline.length > 0 ? 1 : 0,
    parsed.checklist.length > 0 ? 1 : 0,
  ]);

  return {
    completenessScore,
    missingFields,
    issues,
    parsed,
  };
};

const evaluateRiskParsedResult = (parsed: ParsedRiskResult): Omit<PromptEvaluation<ParsedRiskResult>, 'versionId' | 'kind' | 'parseable'> => {
  const missingFields: string[] = [];
  const issues: string[] = [];

  if (parsed.risks.length === 0) {
    missingFields.push('risks');
  }

  if (parsed.summary.topRisks.length === 0) {
    issues.push('summary.topRisks is empty');
  }

  const hasMitigationActions = parsed.risks.every(risk => risk.mitigation.actions.length > 0);
  if (!hasMitigationActions) {
    issues.push('one or more risks have empty mitigation actions');
  }

  const completenessScore = average([
    parsed.risks.length > 0 ? 1 : 0,
    parsed.riskMatrix.cells.length === 5 ? 1 : 0,
    parsed.summary.totalRisks > 0 ? 1 : 0,
    hasMitigationActions ? 1 : 0,
  ]);

  return {
    completenessScore,
    missingFields,
    issues,
    parsed,
  };
};

export class PromptTester {
  constructor(private readonly tracker = new PromptEffectTracker()) {}

  getEffectTracker(): PromptEffectTracker {
    return this.tracker;
  }

  evaluateResponse<K extends PromptKind>(
    kind: K,
    versionId: string,
    rawResponse: string,
    latencyMs?: number
  ): PromptEvaluation<PromptParsedMap[K]> {
    try {
      const baseEvaluation =
        kind === 'sop'
          ? evaluateSOPParsedResult(parseSOPResponse(rawResponse))
          : evaluateRiskParsedResult(parseRiskResponse(rawResponse));

      const evaluation = {
        versionId,
        kind,
        parseable: true,
        latencyMs,
        ...baseEvaluation,
      };

      this.tracker.record({
        versionId,
        kind,
        parseable: evaluation.parseable,
        completenessScore: evaluation.completenessScore,
        latencyMs,
        timestamp: new Date().toISOString(),
      });

      return evaluation as PromptEvaluation<PromptParsedMap[K]>;
    } catch (error) {
      const evaluation = {
        versionId,
        kind,
        parseable: false,
        completenessScore: 0,
        missingFields: [],
        issues: [error instanceof Error ? error.message : 'Unknown parsing error'],
        latencyMs,
      };

      this.tracker.record({
        versionId,
        kind,
        parseable: false,
        completenessScore: 0,
        latencyMs,
        timestamp: new Date().toISOString(),
      });

      return evaluation as PromptEvaluation<PromptParsedMap[K]>;
    }
  }

  async runVariantTest<K extends PromptKind>(
    kind: K,
    request: PromptRequestMap[K],
    executor: (prompts: {
      version: PromptVersionDefinition<PromptRequestMap[K]>;
      systemPrompt: string;
      userPrompt: string;
    }) => Promise<{ rawResponse: string; latencyMs?: number }>
  ): Promise<PromptExecutionResult<PromptParsedMap[K]>[]> {
    const versions = getPromptVersions<PromptRequestMap[K]>(kind);
    const results: PromptExecutionResult<PromptParsedMap[K]>[] = [];

    for (const version of versions) {
      const prompts = version.buildPrompts(request);
      const execution = await executor({
        version,
        systemPrompt: prompts.systemPrompt,
        userPrompt: prompts.userPrompt,
      });
      const evaluation = this.evaluateResponse(kind, version.id, execution.rawResponse, execution.latencyMs);

      results.push({
        ...evaluation,
        systemPrompt: prompts.systemPrompt,
        userPrompt: prompts.userPrompt,
        rawResponse: execution.rawResponse,
      } as PromptExecutionResult<PromptParsedMap[K]>);
    }

    return results;
  }

  compareResults<TParsed>(results: PromptExecutionResult<TParsed>[]): PromptExecutionResult<TParsed>[] {
    return [...results].sort((left, right) => {
      if (left.parseable !== right.parseable) {
        return left.parseable ? -1 : 1;
      }

      if (left.completenessScore !== right.completenessScore) {
        return right.completenessScore - left.completenessScore;
      }

      if ((left.latencyMs ?? Number.POSITIVE_INFINITY) !== (right.latencyMs ?? Number.POSITIVE_INFINITY)) {
        return (left.latencyMs ?? Number.POSITIVE_INFINITY) - (right.latencyMs ?? Number.POSITIVE_INFINITY);
      }

      return left.versionId.localeCompare(right.versionId);
    });
  }
}
