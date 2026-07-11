import { describe, expect, it } from 'vitest';
import { RiskCategory, RiskLevel, RiskSeverity, RiskStatus, MitigationApproach } from '../../types/risk';
import { moveArrayItem, rebuildRiskAssessment } from '../resultEditing';

describe('moveArrayItem', () => {
  it('moves an item without mutating the original array', () => {
    const source = ['a', 'b', 'c'];
    expect(moveArrayItem(source, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(source).toEqual(['a', 'b', 'c']);
  });
});

describe('rebuildRiskAssessment', () => {
  it('recalculates score, severity, matrix and summary', () => {
    const result = rebuildRiskAssessment({
      eventId: 'event-1',
      eventName: '測試活動',
      generatedAt: '2026-01-01T00:00:00.000Z',
      risks: [{
        id: 'risk-1', category: RiskCategory.SAFETY, title: '人流', description: '擁擠',
        likelihood: RiskLevel.VERY_HIGH, impact: RiskLevel.VERY_HIGH,
        riskScore: 1, riskLevel: RiskSeverity.LOW, status: RiskStatus.IDENTIFIED,
        mitigation: { approach: MitigationApproach.REDUCE, actions: [], timeline: '', resources: [] },
      }],
      riskMatrix: { dimensions: { likelihood: [], impact: [] }, cells: [] },
      summary: { totalRisks: 0, risksBySeverity: { low: 0, medium: 0, high: 0, critical: 0 }, risksByCategory: {} as never, topRisks: [] },
    });

    expect(result.risks[0]).toMatchObject({ riskScore: 25, riskLevel: RiskSeverity.CRITICAL });
    expect(result.summary.totalRisks).toBe(1);
    expect(result.summary.risksBySeverity.critical).toBe(1);
    expect(result.riskMatrix.cells.flat().some(cell => cell.risks.includes('risk-1'))).toBe(true);
  });
});
