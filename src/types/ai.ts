export type AIProviderName = 'openai' | 'claude' | 'openrouter';
export type AILocale = 'zh-TW' | 'zh-CN' | 'en';

export interface AIProvider {
  name: AIProviderName;
  apiKey: string;
  model?: string;
  enabled: boolean;
}

export interface AIRequest {
  provider?: AIProviderName;
  model?: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onChunk?: (chunk: string) => void | Promise<void>;
  useCache?: boolean;
  locale?: AILocale;
}

export interface AIResponse {
  content: string;
  provider: AIProviderName;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  cached?: boolean;
}

export interface GenerateSOPRequest {
  eventInfo: unknown;
  options?: {
    includeTimeline?: boolean;
    includeChecklist?: boolean;
    detailLevel?: 'basic' | 'detailed' | 'comprehensive';
  };
}

export interface GenerateRiskRequest {
  eventInfo: unknown;
  options?: {
    includeMatrix?: boolean;
    includeMitigation?: boolean;
    riskCategories?: string[];
  };
}
