import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskStatus, type SOPDocument } from '../../../types/event';
import { MitigationApproach, RiskCategory, RiskLevel, RiskSeverity, RiskStatus, type RiskAssessment } from '../../../types/risk';
import SOPEditor from '../SOPEditor';
import RiskEditor from '../RiskEditor';

const sop: SOPDocument = {
  eventId: 'e1',
  eventName: '論壇',
  generatedAt: '2026-01-01',
  sections: [
    {
      id: 's1',
      title: '準備',
      order: 1,
      content: '',
      estimatedDuration: 60,
      tasks: [{ id: 't1', title: '場勘', description: '', responsible: '企劃', estimatedDuration: 30, deadline: '2026-02-01', dependencies: ['設備確認'], status: TaskStatus.PENDING }],
    },
  ],
  timeline: [],
  checklist: [],
};
const risk: RiskAssessment = {
  eventId: 'e1',
  eventName: '論壇',
  generatedAt: '2026-01-01',
  risks: [
    {
      id: 'r1',
      category: RiskCategory.SAFETY,
      title: '人流',
      description: '',
      likelihood: RiskLevel.LOW,
      impact: RiskLevel.LOW,
      riskScore: 4,
      riskLevel: RiskSeverity.LOW,
      status: RiskStatus.IDENTIFIED,
      mitigation: { approach: MitigationApproach.REDUCE, actions: [], timeline: '', resources: [], contingencyPlan: '' },
    },
  ],
  riskMatrix: { dimensions: { likelihood: [], impact: [] }, cells: [] },
  summary: { totalRisks: 1, risksBySeverity: { low: 1, medium: 0, high: 0, critical: 0 }, risksByCategory: { [RiskCategory.SAFETY]: 1 } as never, topRisks: ['r1'] },
};

describe('result editors', () => {
  it('adds an SOP task through the editor', () => {
    const onChange = vi.fn();
    render(<SOPEditor document={sop} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '新增任務' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sections: [expect.objectContaining({ tasks: expect.arrayContaining([expect.objectContaining({ title: '新任務' })]) })] }));
  });

  it('recalculates a risk when likelihood changes', () => {
    const onChange = vi.fn();
    render(<RiskEditor assessment={risk} onChange={onChange} />);
    fireEvent.mouseDown(screen.getByLabelText('可能性'));
    fireEvent.click(screen.getByRole('option', { name: '5' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ risks: [expect.objectContaining({ likelihood: 5, riskScore: 10, riskLevel: RiskSeverity.MEDIUM })] }));
  });
});
