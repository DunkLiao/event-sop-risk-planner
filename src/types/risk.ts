export interface RiskAssessment {
  eventId: string;
  eventName: string;
  risks: Risk[];
  riskMatrix: RiskMatrix;
  summary: RiskSummary;
  generatedAt: string;
}

export interface Risk {
  id: string;
  category: RiskCategory;
  title: string;
  description: string;
  likelihood: RiskLevel; // 可能性：1-5
  impact: RiskLevel; // 影響程度：1-5
  riskScore: number; // likelihood * impact
  riskLevel: RiskSeverity; // 低/中/高/極高
  mitigation: MitigationStrategy;
  responsiblePerson?: string;
  status: RiskStatus;
}

export enum RiskCategory {
  SAFETY = 'safety', // 安全風險
  HEALTH = 'health', // 健康風險
  FINANCIAL = 'financial', // 財務風險
  OPERATIONAL = 'operational', // 營運風險
  REPUTATIONAL = 'reputational', // 聲譽風險
  LEGAL = 'legal', // 法律風險
  TECHNICAL = 'technical', // 技術風險
  ENVIRONMENTAL = 'environmental', // 環境風險
  LOGISTICAL = 'logistical', // 物流風險
  OTHER = 'other',
}

export enum RiskLevel {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5,
}

export enum RiskSeverity {
  LOW = 'low', // 1-6
  MEDIUM = 'medium', // 7-12
  HIGH = 'high', // 13-20
  CRITICAL = 'critical', // 21-25
}

export enum RiskStatus {
  IDENTIFIED = 'identified',
  ASSESSED = 'assessed',
  MITIGATED = 'mitigated',
  MONITORED = 'monitored',
  CLOSED = 'closed',
}

export interface MitigationStrategy {
  approach: MitigationApproach;
  actions: string[];
  timeline: string;
  resources: string[];
  contingencyPlan?: string;
}

export enum MitigationApproach {
  AVOID = 'avoid', // 避免
  REDUCE = 'reduce', // 降低
  TRANSFER = 'transfer', // 轉移
  ACCEPT = 'accept', // 接受
}

export interface RiskMatrix {
  dimensions: {
    likelihood: string[];
    impact: string[];
  };
  cells: RiskMatrixCell[][];
}

export interface RiskMatrixCell {
  likelihood: number;
  impact: number;
  severity: RiskSeverity;
  risks: string[]; // Risk IDs
}

export interface RiskSummary {
  totalRisks: number;
  risksBySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  risksByCategory: Record<RiskCategory, number>;
  topRisks: string[]; // Top 5 risk IDs
}
