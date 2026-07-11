import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { TaskStatus, type SOPDocument } from '../../../types/event';
import { MitigationApproach, RiskCategory, RiskLevel, RiskSeverity, RiskStatus, type RiskAssessment } from '../../../types/risk';
import { ExcelDocumentService, WordDocumentService } from '../documentService';

const sop: SOPDocument = {
  eventId: 'e1', eventName: '年度論壇', generatedAt: new Date().toISOString(),
  sections: [{ id: 's1', title: '準備', order: 1, content: '確認場地', tasks: [{ id: 't1', title: '場勘', description: '完成場勘', responsible: '企劃', status: TaskStatus.PENDING }] }],
  timeline: [{ id: 'l1', date: '2026-08-01', milestone: '場勘', description: '確認動線' }],
  checklist: [{ id: 'c1', category: '場地', item: '消防檢查', checked: false }],
};

const risk: RiskAssessment = {
  eventId: 'e1', eventName: '年度論壇', generatedAt: new Date().toISOString(),
  risks: [{ id: 'r1', category: RiskCategory.SAFETY, title: '人流', description: '入口壅塞', likelihood: RiskLevel.HIGH, impact: RiskLevel.HIGH, riskScore: 16, riskLevel: RiskSeverity.HIGH, responsiblePerson: '安全組', status: RiskStatus.IDENTIFIED, mitigation: { approach: MitigationApproach.REDUCE, actions: ['分流'], timeline: '活動前', resources: ['保全'] } }],
  riskMatrix: { dimensions: { likelihood: [], impact: [] }, cells: [] },
  summary: { totalRisks: 1, risksBySeverity: { low: 0, medium: 0, high: 1, critical: 0 }, risksByCategory: { [RiskCategory.SAFETY]: 1 } as never, topRisks: ['r1'] },
};

describe('document services', () => {
  it('writes a non-empty editable Word document', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'event-sop-word-'));
    const file = path.join(dir, 'sop.docx');
    await new WordDocumentService().generateSOPDocument(sop, file);
    expect((await fs.stat(file)).size).toBeGreaterThan(1000);
  });

  it('writes an Excel workbook with risk list and matrix sheets', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'event-risk-excel-'));
    const file = path.join(dir, 'risk.xlsx');
    await new ExcelDocumentService().generateRiskDocument(risk, file);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file);
    expect(workbook.worksheets.map(sheet => sheet.name)).toEqual(['風險清單', '風險矩陣', '摘要']);
    expect(workbook.getWorksheet('風險清單')?.getCell('A2').value).toBe('人流');
  });
});
