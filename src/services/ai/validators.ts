import { SOPDocument } from '../../types/event.js';
import { RiskAssessment, RiskCategory, RiskSeverity } from '../../types/risk.js';
import { deriveRiskSeverity } from './postProcessors.js';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const isPositiveInteger = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value > 0;

const isNonNegativeNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export const validateSOPDocument = (sop: SOPDocument): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!hasText(sop.eventId)) {
    warnings.push('eventId 缺失');
  }

  if (!hasText(sop.eventName)) {
    warnings.push('eventName 缺失');
  }

  if (!Array.isArray(sop.sections)) {
    errors.push('sections 必須為陣列');
  } else if (sop.sections.length === 0) {
    errors.push('SOP 至少需要一個 section');
  } else {
    const sectionIds = new Set<string>();

    sop.sections.forEach((section, sectionIndex) => {
      const path = `sections[${sectionIndex}]`;

      if (!hasText(section.id)) {
        warnings.push(`${path}.id 缺失`);
      } else if (sectionIds.has(section.id)) {
        warnings.push(`${path}.id 重複`);
      } else {
        sectionIds.add(section.id);
      }

      if (!hasText(section.title)) {
        errors.push(`${path}.title 缺失`);
      }

      if (!isPositiveInteger(section.order)) {
        errors.push(`${path}.order 必須為正整數`);
      }

      if (!hasText(section.content)) {
        errors.push(`${path}.content 缺失`);
      }

      if (!Array.isArray(section.tasks)) {
        errors.push(`${path}.tasks 必須為陣列`);
        return;
      }

      if (section.tasks.length === 0) {
        warnings.push(`${path}.tasks 為空`);
      }

      const taskIds = new Set<string>();

      section.tasks.forEach((task, taskIndex) => {
        const taskPath = `${path}.tasks[${taskIndex}]`;

        if (!hasText(task.id)) {
          warnings.push(`${taskPath}.id 缺失`);
        } else if (taskIds.has(task.id)) {
          warnings.push(`${taskPath}.id 重複`);
        } else {
          taskIds.add(task.id);
        }

        if (!hasText(task.title)) {
          errors.push(`${taskPath}.title 缺失`);
        }

        if (!hasText(task.description)) {
          errors.push(`${taskPath}.description 缺失`);
        }

        if (!hasText(task.responsible)) {
          errors.push(`${taskPath}.responsible 缺失`);
        }

        if (task.estimatedDuration !== undefined && !isNonNegativeNumber(task.estimatedDuration)) {
          errors.push(`${taskPath}.estimatedDuration 必須為非負數`);
        }
      });
    });
  }

  if (!Array.isArray(sop.timeline)) {
    errors.push('timeline 必須為陣列');
  }

  if (!Array.isArray(sop.checklist)) {
    errors.push('checklist 必須為陣列');
  }

  if (!hasText(sop.generatedAt)) {
    warnings.push('generatedAt 缺失');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateRiskAssessment = (riskAssessment: RiskAssessment): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!hasText(riskAssessment.eventId)) {
    warnings.push('eventId 缺失');
  }

  if (!hasText(riskAssessment.eventName)) {
    warnings.push('eventName 缺失');
  }

  if (!Array.isArray(riskAssessment.risks)) {
    errors.push('risks 必須為陣列');
  } else if (riskAssessment.risks.length === 0) {
    errors.push('風險評估至少需要一項風險');
  } else {
    const riskIds = new Set<string>();

    riskAssessment.risks.forEach((risk, riskIndex) => {
      const path = `risks[${riskIndex}]`;

      if (!hasText(risk.id)) {
        warnings.push(`${path}.id 缺失`);
      } else if (riskIds.has(risk.id)) {
        warnings.push(`${path}.id 重複`);
      } else {
        riskIds.add(risk.id);
      }

      if (!Object.values(RiskCategory).includes(risk.category)) {
        errors.push(`${path}.category 不合法`);
      }

      if (!hasText(risk.title)) {
        errors.push(`${path}.title 缺失`);
      }

      if (!hasText(risk.description)) {
        errors.push(`${path}.description 缺失`);
      }

      if (!Number.isInteger(risk.likelihood) || risk.likelihood < 1 || risk.likelihood > 5) {
        errors.push(`${path}.likelihood 必須介於 1 到 5`);
      }

      if (!Number.isInteger(risk.impact) || risk.impact < 1 || risk.impact > 5) {
        errors.push(`${path}.impact 必須介於 1 到 5`);
      }

      if (risk.riskScore !== risk.likelihood * risk.impact) {
        errors.push(`${path}.riskScore 應等於 likelihood × impact`);
      }

      if (!Object.values(RiskSeverity).includes(risk.riskLevel)) {
        errors.push(`${path}.riskLevel 不合法`);
      } else if (risk.riskLevel !== deriveRiskSeverity(risk.riskScore)) {
        warnings.push(`${path}.riskLevel 與 riskScore 不一致`);
      }

      if (!risk.mitigation || typeof risk.mitigation !== 'object') {
        errors.push(`${path}.mitigation 缺失`);
        return;
      }

      if (!Array.isArray(risk.mitigation.actions)) {
        errors.push(`${path}.mitigation.actions 必須為陣列`);
      } else if (risk.mitigation.actions.length === 0) {
        warnings.push(`${path}.mitigation.actions 為空`);
      }

      if (!hasText(risk.mitigation.timeline)) {
        warnings.push(`${path}.mitigation.timeline 缺失`);
      }

      if (!Array.isArray(risk.mitigation.resources)) {
        errors.push(`${path}.mitigation.resources 必須為陣列`);
      }
    });
  }

  if (riskAssessment.summary.totalRisks !== riskAssessment.risks.length) {
    errors.push('summary.totalRisks 與 risks 長度不一致');
  }

  if (riskAssessment.riskMatrix.cells.length !== 5 || riskAssessment.riskMatrix.cells.some(row => row.length !== 5)) {
    errors.push('riskMatrix 必須為 5x5 矩陣');
  }

  if (!hasText(riskAssessment.generatedAt)) {
    warnings.push('generatedAt 缺失');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
