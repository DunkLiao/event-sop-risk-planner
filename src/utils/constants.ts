import { EventType, EventScale } from '../types/event';

/**
 * 活動類型選項
 */
export const EVENT_TYPE_OPTIONS = [
  { value: EventType.CONFERENCE, label: '會議/研討會' },
  { value: EventType.EXHIBITION, label: '展覽' },
  { value: EventType.CONCERT, label: '演唱會/音樂會' },
  { value: EventType.SPORTS, label: '體育賽事' },
  { value: EventType.CORPORATE, label: '企業活動' },
  { value: EventType.WEDDING, label: '婚禮' },
  { value: EventType.FESTIVAL, label: '節慶活動' },
  { value: EventType.SEMINAR, label: '講座/工作坊' },
  { value: EventType.WORKSHOP, label: '培訓課程' },
  { value: EventType.OTHER, label: '其他' },
];

/**
 * 活動規模選項
 */
export const EVENT_SCALE_OPTIONS = [
  { value: EventScale.SMALL, label: '小型（< 50 人）' },
  { value: EventScale.MEDIUM, label: '中型（50-200 人）' },
  { value: EventScale.LARGE, label: '大型（200-1000 人）' },
  { value: EventScale.EXTRA_LARGE, label: '超大型（> 1000 人）' },
];

/**
 * AI 模型選項
 */
export const AI_MODEL_OPTIONS = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o（推薦）' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  claude: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet（推薦）' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  ],
};

/**
 * 應用程式版本
 */
export const APP_VERSION = '1.0.0';

/**
 * 最大檔案大小（MB）
 */
export const MAX_FILE_SIZE_MB = 10;

/**
 * 支援的匯出格式
 */
export const EXPORT_FORMATS = {
  WORD: { extension: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  EXCEL: { extension: '.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
};
