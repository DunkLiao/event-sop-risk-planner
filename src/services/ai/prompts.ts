import { GenerateRiskRequest, GenerateSOPRequest } from '../../types/ai.js';
import { EventInfo, EventScale, EventType } from '../../types/event.js';

export type PromptTemplateVariant = 'legacy' | 'structured-v2';

interface PromptTemplateConfig {
  variant?: PromptTemplateVariant;
}

const SOP_OUTPUT_EXAMPLE = {
  sections: [
    {
      title: '前置準備',
      order: 1,
      content: '確認場地、講者與報到流程皆已就緒，並完成跨組別溝通。',
      tasks: [
        {
          title: '確認報到動線',
          description: '檢查入口指引、報到櫃台與名牌配置是否一致。',
          responsible: '報到組',
          estimatedDuration: 30,
        },
      ],
    },
  ],
  timeline: [
    {
      date: '活動前 7 天',
      time: '10:00',
      milestone: '完成場地總檢',
      description: '確認場地設備、動線與緊急出口標示。',
    },
  ],
  checklist: [
    {
      category: '場地',
      item: '完成舞台、電力與音響測試',
      checked: false,
    },
  ],
};

const RISK_OUTPUT_EXAMPLE = {
  risks: [
    {
      category: 'safety',
      title: '入口區域人流壅塞',
      description: '報到尖峰時段可能造成排隊回堵並影響緊急通行。',
      likelihood: 3,
      impact: 4,
      riskScore: 12,
      riskLevel: 'medium',
      mitigation: {
        approach: 'reduce',
        actions: ['增設報到櫃台', '安排人流引導人員'],
        timeline: '活動前 3 天完成演練，活動當日提前 1 小時部署',
        resources: ['報到人員', '排隊欄杆', '指引牌'],
      },
    },
  ],
};

const SOP_LEGACY_SYSTEM_PROMPT_TEMPLATE = `你是一位資深活動營運顧問，擅長把活動資訊整理成可直接執行的 SOP。
請使用繁體中文輸出，內容需具體、可落地，並清楚標示前置準備、執行流程、現場應變與活動結束後的收尾。`;

const SOP_LEGACY_USER_PROMPT_TEMPLATE = `請根據以下活動資訊產出 SOP：
{{eventInfo}}

輸出要求：
- 詳細程度：{{detailLevel}}
- 是否包含時間軸：{{includeTimeline}}
- 是否包含檢查清單：{{includeChecklist}}
- 請將內容分成清楚章節，並為每個章節列出可執行任務與負責角色。`;

const SOP_SYSTEM_PROMPT_TEMPLATE = `你是一位資深活動營運與流程設計顧問，專長是為不同類型活動建立可執行、可追蹤、可交接的 SOP。
請以繁體中文回覆，並嚴格遵守以下規則：
1. 只能輸出單一 JSON 物件，不得加入任何前言、結語、說明文字或註解。
2. 不得輸出 Markdown 標題、項目符號或表格；若要使用程式碼區塊，內容也必須是合法 JSON。
3. 每個章節與任務都必須具體、可執行，避免空泛描述。
4. 若資訊不足，請依活動類型提出合理假設，但不得省略必要欄位。
5. 所有欄位名稱必須完全符合指定 schema。`;

const SOP_USER_PROMPT_TEMPLATE = `請根據以下活動資訊產出活動 SOP，並以結構化 JSON 回覆。

【活動資訊】
{{eventInfo}}

【生成條件】
- 詳細程度：{{detailLevel}}
- 是否包含時間軸：{{includeTimeline}}
- 是否包含檢查清單：{{includeChecklist}}
- 活動類型提示：{{eventTypeGuidance}}
- 活動規模提示：{{scaleGuidance}}
- 任務深度要求：{{detailGuidance}}

【JSON Schema】
{
  "sections": [
    {
      "title": "章節標題",
      "order": 1,
      "content": "章節內容",
      "tasks": [
        {
          "title": "任務名稱",
          "description": "任務描述",
          "responsible": "負責角色",
          "estimatedDuration": 30
        }
      ]
    }
  ],
  "timeline": [
    {
      "date": "活動前 7 天",
      "time": "10:00",
      "milestone": "里程碑",
      "description": "說明"
    }
  ],
  "checklist": [
    {
      "category": "分類",
      "item": "檢查項目",
      "checked": false
    }
  ]
}

【輸出規範】
1. sections 至少 4 個章節，且需涵蓋前置準備、現場執行、應變處理、活動結束收尾。
2. 每個 section 至少 2 個 tasks；estimatedDuration 需為分鐘數整數。
3. 若 includeTimeline=false，timeline 請輸出空陣列 []；若 includeChecklist=false，checklist 請輸出空陣列 []。
4. timeline 內容需依活動前、中、後排序。
5. checklist 項目需可直接勾選執行，不要寫成段落。
6. 嚴禁輸出 null、undefined、額外欄位或省略必要欄位。

【Few-shot 範例】
{{exampleOutput}}

現在請直接輸出 JSON。`;

const RISK_LEGACY_SYSTEM_PROMPT_TEMPLATE = `你是一位活動風險管理顧問，熟悉大型活動、企業活動與公共安全管理。
請使用繁體中文輸出風險評估，內容要包含風險描述、可能性、衝擊程度與建議的緩解措施。`;

const RISK_LEGACY_USER_PROMPT_TEMPLATE = `請根據以下活動資訊產出風險評估：
{{eventInfo}}

輸出要求：
- 是否包含風險矩陣：{{includeMatrix}}
- 是否包含緩解措施：{{includeMitigation}}
- 需要涵蓋的風險類別：{{riskCategories}}`;

const RISK_SYSTEM_PROMPT_TEMPLATE = `你是一位資深活動風險管理顧問，熟悉大型群眾活動、企業活動、展演活動與公共安全管理。
請以繁體中文回覆，並嚴格遵守以下規則：
1. 只能輸出單一 JSON 物件，不得加入任何前言、後記或 Markdown 說明。
2. 所有風險都必須包含 category、title、description、likelihood、impact、riskScore、riskLevel、mitigation。
3. likelihood 與 impact 必須是 1-5 整數；riskScore 必須等於 likelihood * impact。
4. riskLevel 僅能使用 low、medium、high、critical。
5. mitigation.approach 僅能使用 avoid、reduce、transfer、accept。`;

const RISK_USER_PROMPT_TEMPLATE = `請根據以下活動資訊產出風險識別與評估結果，並以結構化 JSON 回覆。

【活動資訊】
{{eventInfo}}

【生成條件】
- 是否包含風險矩陣：{{includeMatrix}}
- 是否包含緩解措施：{{includeMitigation}}
- 需要涵蓋的風險類別：{{riskCategories}}
- 活動類型提示：{{eventTypeGuidance}}
- 活動規模提示：{{scaleGuidance}}
- 風險深度要求：{{riskDepthGuidance}}

【JSON Schema】
{
  "risks": [
    {
      "category": "safety",
      "title": "風險標題",
      "description": "風險描述",
      "likelihood": 3,
      "impact": 4,
      "riskScore": 12,
      "riskLevel": "medium",
      "mitigation": {
        "approach": "reduce",
        "actions": ["行動1", "行動2"],
        "timeline": "活動前 1 週",
        "resources": ["資源1"]
      }
    }
  ]
}

【輸出規範】
1. risks 需涵蓋至少 {{minimumRiskCount}} 項風險，並優先納入高風險情境。
2. 每項風險需明確說明觸發情境與可執行的 mitigation actions。
3. 若 includeMitigation=false，mitigation 仍需存在，但 actions 可精簡為最核心的預防措施。
4. 請依風險分數由高到低排序。
5. category 優先使用：safety、health、financial、operational、reputational、legal、technical、environmental、logistical、other。
6. 嚴禁輸出 null、undefined、額外欄位或省略必要欄位。

【Few-shot 範例】
{{exampleOutput}}

現在請直接輸出 JSON。`;

type PromptVariables = Record<string, string | number | boolean | undefined | null>;

const EVENT_TYPE_GUIDANCE: Record<EventType, { sop: string; risk: string }> = {
  [EventType.CONFERENCE]: {
    sop: '聚焦議程管理、講者接待、報到動線、會議設備與議程時間控管。',
    risk: '特別注意講者臨時缺席、投影與音訊設備故障、報到壅塞與貴賓接待失誤。',
  },
  [EventType.EXHIBITION]: {
    sop: '聚焦攤位佈置、參展商協調、入場控管、物流動線與導覽指引。',
    risk: '特別注意攤位用電、展品損壞、撤佈展動線衝突與供應商延誤。',
  },
  [EventType.CONCERT]: {
    sop: '聚焦舞台換場、藝人接待、群眾管制、音控燈控與安檢流程。',
    risk: '特別注意人群推擠、舞台安全、音響斷訊、票務糾紛與緊急疏散。',
  },
  [EventType.SPORTS]: {
    sop: '聚焦參賽報到、裁判協調、醫護待命、器材檢查與觀眾動線。',
    risk: '特別注意運動傷害、天候中斷、器材故障、觀眾衝突與保險責任。',
  },
  [EventType.CORPORATE]: {
    sop: '聚焦品牌接待、貴賓流程、簡報彩排、內外部協作與公關節奏。',
    risk: '特別注意高層行程變更、品牌聲譽、機密外洩、直播失誤與供應商履約。',
  },
  [EventType.WEDDING]: {
    sop: '聚焦儀式流程、親友接待、宴客節奏、攝影協調與場地轉場。',
    risk: '特別注意流程延誤、禮服或花藝瑕疵、餐飲出餐失序與家庭溝通風險。',
  },
  [EventType.FESTIVAL]: {
    sop: '聚焦多區域動線、節目輪替、攤商管理、安全巡檢與志工協調。',
    risk: '特別注意大量人流、天候變化、夜間照明、臨時電力與現場秩序管理。',
  },
  [EventType.SEMINAR]: {
    sop: '聚焦講師報到、教材與投影片、互動問答、直播錄影與學員服務。',
    risk: '特別注意設備兼容性、內容延時、講師交通與現場報名超額。',
  },
  [EventType.WORKSHOP]: {
    sop: '聚焦教材器材準備、分組操作、安全說明、時段控管與成果回收。',
    risk: '特別注意器材短缺、操作受傷、時間超時與學員程度落差。',
  },
  [EventType.OTHER]: {
    sop: '聚焦活動目標、參與者體驗、資源協調、場地執行與收尾交接。',
    risk: '特別注意場地限制、供應商協作、流程中斷與基礎安全管理。',
  },
};

const SCALE_GUIDANCE: Record<EventScale, { sop: string; risk: string; minimumRiskCount: number }> = {
  [EventScale.SMALL]: {
    sop: '小型活動可精簡層級，但仍需明確指定角色分工、關鍵檢查點與基本應變流程。',
    risk: '以高機率且高影響的核心風險為主，避免過度展開次要情境。',
    minimumRiskCount: 4,
  },
  [EventScale.MEDIUM]: {
    sop: '中型活動需兼顧跨組別交接、場地動線與參與者體驗，章節應清楚拆解責任。',
    risk: '需涵蓋營運、現場、安全、技術與供應商風險，並提供可執行的緩解措施。',
    minimumRiskCount: 6,
  },
  [EventScale.LARGE]: {
    sop: '大型活動需提供更細的分工、里程碑、跨團隊溝通節點與現場升級應變程序。',
    risk: '需擴充至人流控制、緊急醫療、法規遵循、供應鏈與聲譽衝擊等多面向風險。',
    minimumRiskCount: 8,
  },
  [EventScale.EXTRA_LARGE]: {
    sop: '超大型活動需強調多區域協調、分級回報、應變指揮鍊與全天候營運監控。',
    risk: '需深度覆蓋公共安全、跨單位協調、交通疏運、極端天候與重大事故情境。',
    minimumRiskCount: 10,
  },
};

const DETAIL_LEVEL_GUIDANCE: Record<'basic' | 'detailed' | 'comprehensive', string> = {
  basic: '產出精簡但完整的章節與任務，優先列出最關鍵的執行步驟。',
  detailed: '章節需具備執行順序、角色分工與可操作任務，適合團隊直接採用。',
  comprehensive: '章節需額外納入跨組別協調、備援方案、檢查點與收尾追蹤事項。',
};

const toText = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '未提供';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(item => toText(item)).join('、') : '未提供';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
};

export const interpolatePrompt = (template: string, variables: PromptVariables): string =>
  template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => toText(variables[key]));

export const formatEventInfo = (eventInfo: EventInfo | Record<string, unknown> | unknown): string => {
  if (!eventInfo || typeof eventInfo !== 'object') {
    return toText(eventInfo);
  }

  const info = eventInfo as Partial<EventInfo> & Record<string, unknown>;

  return [
    `活動名稱：${toText(info.name)}`,
    `活動類型：${toText(info.type)}`,
    `活動規模：${toText(info.scale)}`,
    `活動日期：${toText(info.startDate)} 至 ${toText(info.endDate)}`,
    `活動地點：${toText(info.location)}`,
    `預估人數：${toText(info.attendees)}`,
    `預算：${toText(info.budget)}`,
    `活動描述：${toText(info.description)}`,
    `特殊需求：${toText(info.specialRequirements)}`,
  ].join('\n');
};

const getEventTypeGuidance = (eventInfo: unknown, promptType: 'sop' | 'risk'): string => {
  if (!eventInfo || typeof eventInfo !== 'object' || !('type' in eventInfo)) {
    return promptType === 'sop'
      ? '未提供明確活動類型，請以通用活動 SOP 規劃方式處理。'
      : '未提供明確活動類型，請以通用活動風險盤點方式處理。';
  }

  const eventType = (eventInfo as Partial<EventInfo>).type;
  return EVENT_TYPE_GUIDANCE[eventType ?? EventType.OTHER]?.[promptType] ?? EVENT_TYPE_GUIDANCE[EventType.OTHER][promptType];
};

const getScaleGuidance = (eventInfo: unknown, promptType: 'sop' | 'risk'): string => {
  if (!eventInfo || typeof eventInfo !== 'object' || !('scale' in eventInfo)) {
    return promptType === 'sop'
      ? '未提供活動規模，請使用中型活動的 SOP 深度。'
      : '未提供活動規模，請使用中型活動的風險深度。';
  }

  const scale = (eventInfo as Partial<EventInfo>).scale ?? EventScale.MEDIUM;
  return SCALE_GUIDANCE[scale]?.[promptType] ?? SCALE_GUIDANCE[EventScale.MEDIUM][promptType];
};

const getMinimumRiskCount = (eventInfo: unknown): number => {
  if (!eventInfo || typeof eventInfo !== 'object' || !('scale' in eventInfo)) {
    return SCALE_GUIDANCE[EventScale.MEDIUM].minimumRiskCount;
  }

  const scale = (eventInfo as Partial<EventInfo>).scale ?? EventScale.MEDIUM;
  return SCALE_GUIDANCE[scale]?.minimumRiskCount ?? SCALE_GUIDANCE[EventScale.MEDIUM].minimumRiskCount;
};

export const buildSOPPrompts = (
  request: GenerateSOPRequest,
  config: PromptTemplateConfig = {}
): { systemPrompt: string; userPrompt: string } => {
  const detailLevel = request.options?.detailLevel ?? 'detailed';
  const includeTimeline = request.options?.includeTimeline ?? true;
  const includeChecklist = request.options?.includeChecklist ?? true;

  if (config.variant === 'legacy') {
    return {
      systemPrompt: SOP_LEGACY_SYSTEM_PROMPT_TEMPLATE,
      userPrompt: interpolatePrompt(SOP_LEGACY_USER_PROMPT_TEMPLATE, {
        eventInfo: formatEventInfo(request.eventInfo),
        detailLevel,
        includeTimeline,
        includeChecklist,
      }),
    };
  }

  return {
    systemPrompt: SOP_SYSTEM_PROMPT_TEMPLATE,
    userPrompt: interpolatePrompt(SOP_USER_PROMPT_TEMPLATE, {
      eventInfo: formatEventInfo(request.eventInfo),
      detailLevel,
      includeTimeline,
      includeChecklist,
      eventTypeGuidance: getEventTypeGuidance(request.eventInfo, 'sop'),
      scaleGuidance: getScaleGuidance(request.eventInfo, 'sop'),
      detailGuidance: DETAIL_LEVEL_GUIDANCE[detailLevel],
      exampleOutput: JSON.stringify(SOP_OUTPUT_EXAMPLE, null, 2),
    }),
  };
};

export const buildRiskPrompts = (
  request: GenerateRiskRequest,
  config: PromptTemplateConfig = {}
): { systemPrompt: string; userPrompt: string } => {
  const includeMatrix = request.options?.includeMatrix ?? true;
  const includeMitigation = request.options?.includeMitigation ?? true;

  if (config.variant === 'legacy') {
    return {
      systemPrompt: RISK_LEGACY_SYSTEM_PROMPT_TEMPLATE,
      userPrompt: interpolatePrompt(RISK_LEGACY_USER_PROMPT_TEMPLATE, {
        eventInfo: formatEventInfo(request.eventInfo),
        includeMatrix,
        includeMitigation,
        riskCategories: request.options?.riskCategories?.join('、') ?? '場地、安全、醫療、天氣、供應商、法規',
      }),
    };
  }

  return {
    systemPrompt: RISK_SYSTEM_PROMPT_TEMPLATE,
    userPrompt: interpolatePrompt(RISK_USER_PROMPT_TEMPLATE, {
      eventInfo: formatEventInfo(request.eventInfo),
      includeMatrix,
      includeMitigation,
      riskCategories: request.options?.riskCategories?.join('、') ?? '場地、安全、醫療、天氣、供應商、法規',
      eventTypeGuidance: getEventTypeGuidance(request.eventInfo, 'risk'),
      scaleGuidance: getScaleGuidance(request.eventInfo, 'risk'),
      riskDepthGuidance: getScaleGuidance(request.eventInfo, 'risk'),
      minimumRiskCount: getMinimumRiskCount(request.eventInfo),
      exampleOutput: JSON.stringify(RISK_OUTPUT_EXAMPLE, null, 2),
    }),
  };
};

export const PROMPT_TEMPLATES = {
  sop: {
    legacy: {
      system: SOP_LEGACY_SYSTEM_PROMPT_TEMPLATE,
      user: SOP_LEGACY_USER_PROMPT_TEMPLATE,
    },
    structuredV2: {
      system: SOP_SYSTEM_PROMPT_TEMPLATE,
      user: SOP_USER_PROMPT_TEMPLATE,
    },
  },
  risk: {
    legacy: {
      system: RISK_LEGACY_SYSTEM_PROMPT_TEMPLATE,
      user: RISK_LEGACY_USER_PROMPT_TEMPLATE,
    },
    structuredV2: {
      system: RISK_SYSTEM_PROMPT_TEMPLATE,
      user: RISK_USER_PROMPT_TEMPLATE,
    },
  },
};
