import { SOPDocument } from '../../types/event';

/**
 * Word 文件生成服務（待實作）
 */
export class WordDocumentService {
  /**
   * 生成 SOP Word 文件
   */
  async generateSOPDocument(sop: SOPDocument, filePath: string): Promise<void> {
    // TODO: 使用 docx 套件生成 Word 文件
    console.log('生成 SOP 文件:', sop, filePath);
    throw new Error('Word 文件生成服務尚未實作');
  }

  // /**
  //  * 驗證文件資料
  //  */
  // private validateSOPData(_sop: SOPDocument): void {
  //   if (!_sop.eventName) {
  //     throw new Error('活動名稱不可為空');
  //   }
  //   if (!_sop.sections || _sop.sections.length === 0) {
  //     throw new Error('SOP 必須包含至少一個章節');
  //   }
  // }
}

/**
 * Excel 文件生成服務（待實作）
 */
export class ExcelDocumentService {
  /**
   * 生成風險評估 Excel 文件
   */
  async generateRiskDocument(risk: unknown, filePath: string): Promise<void> {
    // TODO: 使用 exceljs 套件生成 Excel 文件
    console.log('生成風險評估文件:', risk, filePath);
    throw new Error('Excel 文件生成服務尚未實作');
  }

  // /**
  //  * 驗證文件資料
  //  */
  // private validateRiskData(_risk: unknown): void {
  //   // TODO: 實作驗證邏輯
  // }
}
