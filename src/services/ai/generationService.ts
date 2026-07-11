import type { AIManager } from './aiManager.js';
import type { EventInfo, SOPDocument } from '../../types/event.js';
import type { RiskAssessment } from '../../types/risk.js';
import type { GenerateRiskRequest, GenerateSOPRequest } from '../../types/ai.js';
import { buildRiskPrompts, buildSOPPrompts } from './prompts.js';
import { parseRiskResponse, parseSOPResponse } from './parseAIResponse.js';

const requireEventInfo = (value: unknown): EventInfo => {
  if (!value || typeof value !== 'object' || typeof (value as { id?: unknown }).id !== 'string' || typeof (value as { name?: unknown }).name !== 'string') {
    throw new Error('活動資料格式不正確。');
  }
  return value as EventInfo;
};

export class GenerationService {
  constructor(private readonly manager: Pick<AIManager, 'generateCompletion'>) {}

  async generateSOP(request: GenerateSOPRequest): Promise<SOPDocument> {
    const eventInfo = requireEventInfo(request.eventInfo);
    const prompts = buildSOPPrompts(request);
    const response = await this.manager.generateCompletion({ prompt: prompts.userPrompt, systemPrompt: prompts.systemPrompt });
    return parseSOPResponse(response.content, eventInfo);
  }

  async generateRiskAssessment(request: GenerateRiskRequest): Promise<RiskAssessment> {
    const eventInfo = requireEventInfo(request.eventInfo);
    const prompts = buildRiskPrompts(request);
    const response = await this.manager.generateCompletion({ prompt: prompts.userPrompt, systemPrompt: prompts.systemPrompt });
    return parseRiskResponse(response.content, eventInfo);
  }
}
