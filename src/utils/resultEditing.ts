import type { RiskAssessment } from '../types/risk';
import { buildRiskMatrix, buildRiskSummary, deriveRiskSeverity } from '../services/ai/postProcessors';

export const moveArrayItem = <T>(items: readonly T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return [...items];
  }

  const result = [...items];
  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);
  return result;
};

export const rebuildRiskAssessment = (assessment: RiskAssessment): RiskAssessment => {
  const risks = assessment.risks.map(risk => {
    const riskScore = risk.likelihood * risk.impact;
    return { ...risk, riskScore, riskLevel: deriveRiskSeverity(riskScore) };
  });

  return {
    ...assessment,
    risks,
    riskMatrix: buildRiskMatrix(risks),
    summary: buildRiskSummary(risks),
  };
};
