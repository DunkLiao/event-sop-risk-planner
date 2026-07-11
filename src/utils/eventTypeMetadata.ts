import { EventType } from '../types/event';

export type EventTypeFilterGroup = 'business' | 'showcase' | 'celebration' | 'learning' | 'general';

export interface EventTypeMetadata {
  description: string;
  typicalScaleRange: string;
  commonRiskCategories: string[];
  sopFocusItems: string[];
  filterGroup: EventTypeFilterGroup;
  keywords: string[];
}

export const EVENT_TYPE_FILTER_OPTIONS: Array<{ value: EventTypeFilterGroup | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'business', label: '商務' },
  { value: 'showcase', label: '展演' },
  { value: 'celebration', label: '慶典' },
  { value: 'learning', label: '學習' },
  { value: 'general', label: '其他' },
];

export const EVENT_TYPE_METADATA: Record<EventType, EventTypeMetadata> = {
  [EventType.CONFERENCE]: {
    description: '適合企業會議、論壇與研討會等正式交流場合。',
    typicalScaleRange: '50-800 人，常見於室內場館或飯店會議中心',
    commonRiskCategories: ['報到壅塞', '設備備援', '貴賓接待', '議程延誤'],
    sopFocusItems: ['報到動線設計', '議程控時', '視聽設備測試', '講者接待流程'],
    filterGroup: 'business',
    keywords: ['論壇', '峰會', '會議', '研討會', 'conference'],
  },
  [EventType.EXHIBITION]: {
    description: '適合品牌展覽、產品展示與大型攤位導覽活動。',
    typicalScaleRange: '100-5000 人，常見於展覽館與大型開放空間',
    commonRiskCategories: ['人流管制', '攤位用電', '進撤場安全', '展品損壞'],
    sopFocusItems: ['展區分流規劃', '攤位進撤場管理', '展品保全', '觀眾導覽動線'],
    filterGroup: 'showcase',
    keywords: ['博覽會', '展銷', '展覽', 'expo', 'exhibition'],
  },
  [EventType.CONCERT]: {
    description: '適合演唱會、音樂會與舞台表演等高能量演出。',
    typicalScaleRange: '200-20000 人，常見於室內外舞台與大型場館',
    commonRiskCategories: ['群眾推擠', '音響燈光故障', '票務驗證', '緊急疏散'],
    sopFocusItems: ['入場驗票流程', '舞台轉場管理', '後台動線控管', '安保與醫護配置'],
    filterGroup: 'showcase',
    keywords: ['表演', '演唱會', '音樂會', 'live', 'concert'],
  },
  [EventType.SPORTS]: {
    description: '適合體育競賽、聯賽活動與大型賽事轉播場合。',
    typicalScaleRange: '100-30000 人，常見於體育館、球場與戶外場地',
    commonRiskCategories: ['觀眾秩序', '選手動線', '天候變化', '醫療支援'],
    sopFocusItems: ['賽事進程控管', '選手與裁判動線', '觀眾分區管理', '醫療救護待命'],
    filterGroup: 'showcase',
    keywords: ['比賽', '競技', '體育', 'sports', 'match'],
  },
  [EventType.CORPORATE]: {
    description: '適合尾牙、品牌發表與客戶關係經營等企業活動。',
    typicalScaleRange: '30-2000 人，常見於飯店宴會廳與企業園區',
    commonRiskCategories: ['品牌形象', '餐飲協調', '貴賓接待', '跨部門協作'],
    sopFocusItems: ['流程彩排', '品牌視覺一致性', 'VIP 接待', '供應商協調'],
    filterGroup: 'business',
    keywords: ['尾牙', '發表會', '企業活動', 'corporate', 'brand'],
  },
  [EventType.WEDDING]: {
    description: '適合婚禮、證婚與家宴等重視情感體驗的儀式型活動。',
    typicalScaleRange: '20-500 人，常見於宴會廳、戶外婚宴與特色場地',
    commonRiskCategories: ['流程延誤', '天候備案', '賓客接待', '音樂與影像播放'],
    sopFocusItems: ['儀式節點控時', '新人與親友動線', '宴客座位安排', '備案流程通知'],
    filterGroup: 'celebration',
    keywords: ['婚宴', '證婚', '婚禮', 'wedding', 'banquet'],
  },
  [EventType.FESTIVAL]: {
    description: '適合節慶市集、社區嘉年華與戶外慶典活動。',
    typicalScaleRange: '100-10000 人，常見於戶外廣場、公園與街區',
    commonRiskCategories: ['天候風險', '人車分流', '攤商管理', '公共安全'],
    sopFocusItems: ['場域分區規劃', '攤商管理', '雨備與停辦機制', '志工與工作人員調度'],
    filterGroup: 'celebration',
    keywords: ['市集', '嘉年華', '節慶', 'festival', 'outdoor'],
  },
  [EventType.SEMINAR]: {
    description: '適合知識分享、主題講座與小型工作坊交流場合。',
    typicalScaleRange: '20-300 人，常見於教室、共享空間與講堂',
    commonRiskCategories: ['報名超額', '講師時程', '教材設備', '互動秩序'],
    sopFocusItems: ['報到與座位安排', '講師支援', '教材發放', 'QA 與互動節奏'],
    filterGroup: 'learning',
    keywords: ['講座', '論壇', '工作坊', 'seminar', 'talk'],
  },
  [EventType.WORKSHOP]: {
    description: '適合內訓、技能培訓與實作導向課程。',
    typicalScaleRange: '10-200 人，常見於教室、實作場域與企業訓練中心',
    commonRiskCategories: ['器材損耗', '學員安全', '教材版本', '講師支援'],
    sopFocusItems: ['課前通知', '教材與器材準備', '分組實作管理', '學習成果回收'],
    filterGroup: 'learning',
    keywords: ['培訓', '內訓', '課程', 'training', 'workshop'],
  },
  [EventType.OTHER]: {
    description: '適合混合型、客製化或尚未明確定義的活動情境。',
    typicalScaleRange: '依活動需求彈性調整，適用於跨型態活動',
    commonRiskCategories: ['需求變更', '資源配置', '跨團隊溝通', '責任分工'],
    sopFocusItems: ['需求確認', '關鍵里程碑盤點', '責任分工表', '風險滾動追蹤'],
    filterGroup: 'general',
    keywords: ['其他', '客製', '混合型', 'other', 'custom'],
  },
};

export const getEventTypeMetadata = (eventType: EventType): EventTypeMetadata => EVENT_TYPE_METADATA[eventType];
