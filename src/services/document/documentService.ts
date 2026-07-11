import fs from 'node:fs/promises';
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import ExcelJS from 'exceljs';
import type { SOPDocument } from '../../types/event';
import { RiskSeverity, type RiskAssessment } from '../../types/risk';

const table = (headers: string[], rows: string[][]): Table =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(value => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: value, bold: true })] })] })) }),
      ...rows.map(row => new TableRow({ children: row.map(value => new TableCell({ children: [new Paragraph(value)] })) })),
    ],
  });

export class WordDocumentService {
  async generateSOPDocument(sop: SOPDocument, filePath: string): Promise<void> {
    if (!sop.eventName.trim()) throw new Error('活動名稱不可為空。');
    if (sop.sections.length === 0) throw new Error('SOP 必須包含至少一個章節。');

    const children: Array<Paragraph | Table> = [
      new Paragraph({ text: sop.eventName, heading: HeadingLevel.TITLE }),
      new Paragraph({ text: '活動標準作業流程（SOP）', heading: HeadingLevel.HEADING_1 }),
      new Paragraph(`產生時間：${new Date(sop.generatedAt).toLocaleString('zh-TW')}`),
    ];

    for (const section of [...sop.sections].sort((a, b) => a.order - b.order)) {
      children.push(new Paragraph({ text: `${section.order}. ${section.title}`, heading: HeadingLevel.HEADING_2 }));
      children.push(new Paragraph(section.content));
      if (section.tasks.length > 0) {
        children.push(table(['任務', '說明', '負責人', '期限', '狀態'], section.tasks.map(task => [task.title, task.description, task.responsible, task.deadline ?? '', task.status])));
      }
    }

    if (sop.timeline.length > 0) {
      children.push(new Paragraph({ text: '時程', heading: HeadingLevel.HEADING_1 }));
      children.push(table(['日期', '時間', '里程碑', '說明'], sop.timeline.map(item => [item.date, item.time ?? '', item.milestone, item.description])));
    }
    if (sop.checklist.length > 0) {
      children.push(new Paragraph({ text: '檢查清單', heading: HeadingLevel.HEADING_1 }));
      children.push(table(['完成', '分類', '項目'], sop.checklist.map(item => [item.checked ? '✓' : '□', item.category, item.item])));
    }

    const document = new Document({ sections: [{ children }] });
    await fs.writeFile(filePath, await Packer.toBuffer(document));
  }
}

const severityColor: Record<RiskSeverity, string> = {
  [RiskSeverity.LOW]: 'C6EFCE', [RiskSeverity.MEDIUM]: 'FFEB9C', [RiskSeverity.HIGH]: 'F4B183', [RiskSeverity.CRITICAL]: 'FFC7CE',
};

export class ExcelDocumentService {
  async generateRiskDocument(risk: RiskAssessment, filePath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '活動 SOP 與風險規劃生成器';
    const list = workbook.addWorksheet('風險清單');
    list.columns = [
      { header: '風險', key: 'title', width: 22 }, { header: '分類', key: 'category', width: 16 },
      { header: '說明', key: 'description', width: 36 }, { header: '可能性', key: 'likelihood', width: 10 },
      { header: '影響', key: 'impact', width: 10 }, { header: '分數', key: 'score', width: 10 },
      { header: '等級', key: 'severity', width: 12 }, { header: '應對方式', key: 'approach', width: 14 },
      { header: '應對行動', key: 'actions', width: 36 }, { header: '負責人', key: 'owner', width: 16 },
      { header: '狀態', key: 'status', width: 14 },
    ];
    risk.risks.forEach(item => {
      const row = list.addRow({ title: item.title, category: item.category, description: item.description, likelihood: item.likelihood, impact: item.impact, score: item.riskScore, severity: item.riskLevel, approach: item.mitigation.approach, actions: item.mitigation.actions.join('、'), owner: item.responsiblePerson ?? '', status: item.status });
      row.getCell('severity').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: severityColor[item.riskLevel] } };
    });
    list.getRow(1).font = { bold: true };
    list.views = [{ state: 'frozen', ySplit: 1 }];
    list.autoFilter = { from: 'A1', to: 'K1' };

    const matrix = workbook.addWorksheet('風險矩陣');
    matrix.addRow(['可能性／影響', 1, 2, 3, 4, 5]);
    for (let likelihood = 5; likelihood >= 1; likelihood -= 1) {
      const row = matrix.addRow([likelihood]);
      for (let impact = 1; impact <= 5; impact += 1) {
        const matching = risk.risks.filter(item => item.likelihood === likelihood && item.impact === impact);
        const cell = row.getCell(impact + 1);
        cell.value = matching.map(item => item.title).join('、');
        const score = likelihood * impact;
        const severity = score <= 6 ? RiskSeverity.LOW : score <= 12 ? RiskSeverity.MEDIUM : score <= 20 ? RiskSeverity.HIGH : RiskSeverity.CRITICAL;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: severityColor[severity] } };
      }
    }
    matrix.columns.forEach(column => { column.width = 22; });

    const summary = workbook.addWorksheet('摘要');
    summary.addRows([
      ['活動', risk.eventName], ['風險總數', risk.summary.totalRisks], ['低風險', risk.summary.risksBySeverity.low],
      ['中風險', risk.summary.risksBySeverity.medium], ['高風險', risk.summary.risksBySeverity.high],
      ['極高風險', risk.summary.risksBySeverity.critical],
    ]);
    summary.getColumn(1).font = { bold: true };
    summary.columns = [{ width: 18 }, { width: 30 }];

    await workbook.xlsx.writeFile(filePath);
  }
}
