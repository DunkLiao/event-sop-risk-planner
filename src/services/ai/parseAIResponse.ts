import { EventInfo, SOPDocument } from '../../types/event.js';
import { RiskAssessment } from '../../types/risk.js';
import {
  AIResponseParseError,
  parseRiskResponse as parseStructuredRiskResponse,
  parseSOPResponse as parseStructuredSOPResponse,
} from './responseParser.js';
import {
  createFallbackRiskAssessment,
  createFallbackSOPDocument,
  postProcessRiskAssessment,
  postProcessSOPDocument,
} from './postProcessors.js';
import { validateRiskAssessment, validateSOPDocument } from './validators.js';

const isRecoverableJsonError = (error: unknown): error is AIResponseParseError =>
  error instanceof AIResponseParseError &&
  ['empty_response', 'json_not_found', 'json_parse_failed', 'invalid_json_root'].includes(error.code);

const buildValidationErrorMessage = (label: string, errors: string[], warnings: string[]): string => {
  const detail = errors.join('；');
  const warningText = warnings.length > 0 ? ` 警告：${warnings.join('；')}。` : '';
  return `${label} 結構驗證失敗：${detail}。建議重新生成。${warningText}`.trim();
};

export async function parseSOPResponse(rawResponse: string, eventInfo: EventInfo): Promise<SOPDocument> {
  try {
    const parsed = parseStructuredSOPResponse(rawResponse);
    const document = postProcessSOPDocument({
      eventId: eventInfo.id,
      eventName: eventInfo.name,
      sections: parsed.sections,
      timeline: parsed.timeline,
      checklist: parsed.checklist,
      generatedAt: new Date().toISOString(),
    });
    const validation = validateSOPDocument(document);

    if (!validation.isValid) {
      throw new AIResponseParseError(
        buildValidationErrorMessage('SOP', validation.errors, validation.warnings),
        rawResponse,
        validation,
        'invalid_structure'
      );
    }

    if (validation.warnings.length > 0) {
      console.warn('[AIParser] SOP warnings:', validation.warnings, { rawResponse });
    }

    return document;
  } catch (error) {
    if (isRecoverableJsonError(error)) {
      console.warn('[AIParser] Failed to parse SOP JSON, using fallback document.', error, { rawResponse });
      return createFallbackSOPDocument(rawResponse, eventInfo);
    }

    throw error;
  }
}

export async function parseRiskResponse(rawResponse: string, eventInfo: EventInfo): Promise<RiskAssessment> {
  try {
    const parsed = parseStructuredRiskResponse(rawResponse);
    const assessment = postProcessRiskAssessment({
      eventId: eventInfo.id,
      eventName: eventInfo.name,
      risks: parsed.risks,
      riskMatrix: parsed.riskMatrix,
      summary: parsed.summary,
      generatedAt: new Date().toISOString(),
    });
    const validation = validateRiskAssessment(assessment);

    if (!validation.isValid) {
      throw new AIResponseParseError(
        buildValidationErrorMessage('風險評估', validation.errors, validation.warnings),
        rawResponse,
        validation,
        'invalid_structure'
      );
    }

    if (validation.warnings.length > 0) {
      console.warn('[AIParser] Risk warnings:', validation.warnings, { rawResponse });
    }

    return assessment;
  } catch (error) {
    if (isRecoverableJsonError(error)) {
      console.warn('[AIParser] Failed to parse risk JSON, using fallback assessment.', error, { rawResponse });
      return createFallbackRiskAssessment(rawResponse, eventInfo);
    }

    throw error;
  }
}
