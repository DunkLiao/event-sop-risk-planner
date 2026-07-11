import fs from 'node:fs/promises';
import path from 'node:path';
import { ipcMain } from 'electron';
import { AIManager } from '../../src/services/ai/aiManager';
import { GenerationService } from '../../src/services/ai/generationService';
import { ExcelDocumentService, WordDocumentService } from '../../src/services/document/documentService';
import type { GenerateRiskRequest, GenerateSOPRequest } from '../../src/types/ai';
import type { SOPDocument } from '../../src/types/event';
import type { RiskAssessment } from '../../src/types/risk';
import { getRuntimeSettings } from './storage';

const register = (channel: string, handler: (...args: unknown[]) => unknown): void => {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, (_event, ...args) => handler(...args));
};

export const registerGenerationHandlers = (): void => {
  const manager = new AIManager({ settingsProvider: getRuntimeSettings });
  const generation = new GenerationService(manager);
  const word = new WordDocumentService();
  const excel = new ExcelDocumentService();

  register('generate-sop', request => generation.generateSOP(request as GenerateSOPRequest));
  register('generate-risk-assessment', request => generation.generateRiskAssessment(request as GenerateRiskRequest));
  register('export-word', async (document, filePath) => {
    if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('未提供 Word 輸出路徑。');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await word.generateSOPDocument(document as SOPDocument, filePath);
  });
  register('export-excel', async (document, assessment, filePath) => {
    if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('未提供 Excel 輸出路徑。');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await excel.generateSOPWorkbook(document as SOPDocument, filePath, assessment as RiskAssessment | null);
  });
};
