import { isValidApiKey as validateProviderApiKey } from './apiKeyValidator.js';

/**
 * 驗證電子郵件格式
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 驗證日期範圍
 */
export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

/**
 * 驗證 API Key 格式
 */
export const isValidApiKey = (apiKey: string, provider: 'openai' | 'claude'): boolean => {
  return validateProviderApiKey(apiKey, provider);
};

/**
 * 驗證必填欄位
 */
export const validateRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
};
