import { EventFormData, EventInfo, EventScale, EventType } from '../types/event';
import { ProjectStatus } from '../types/settings';
import { EVENT_SCALE_OPTIONS, EVENT_TYPE_OPTIONS } from './constants';

export const DEFAULT_EVENT_FORM_VALUES: EventFormData = {
  name: '',
  type: EVENT_TYPE_OPTIONS[0]?.value ?? EventType.OTHER,
  scale: EVENT_SCALE_OPTIONS[1]?.value ?? EVENT_SCALE_OPTIONS[0]?.value ?? EventScale.MEDIUM,
  startDate: '',
  endDate: '',
  location: '',
  attendees: '',
  budget: '',
  description: '',
  specialRequirements: '',
};

const createUniqueId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const createEventId = (): string => createUniqueId('event');

export const mapEventToFormData = (event: EventInfo): EventFormData => ({
  name: event.name,
  type: event.type,
  scale: event.scale,
  startDate: event.startDate,
  endDate: event.endDate,
  location: event.location,
  attendees: event.attendees > 0 ? String(event.attendees) : '',
  budget: typeof event.budget === 'number' ? String(event.budget) : '',
  description: event.description,
  specialRequirements: event.specialRequirements ?? '',
});

const toNumber = (value: string): number | undefined => {
  if (value.trim() === '') {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? undefined : numericValue;
};

export const buildDraftEventInfo = (
  values: EventFormData,
  existingEvent: EventInfo | null,
  eventId: string = existingEvent?.id ?? createEventId()
): EventInfo => {
  const now = new Date().toISOString();
  const budget = toNumber(values.budget);
  const specialRequirements = values.specialRequirements.trim();
  const attendees = toNumber(values.attendees);

  return {
    id: eventId,
    name: values.name.trim() || existingEvent?.name || '未命名活動',
    type: values.type,
    scale: values.scale,
    startDate: values.startDate,
    endDate: values.endDate,
    location: values.location.trim(),
    description: values.description.trim(),
    attendees: attendees !== undefined && attendees > 0 ? Math.trunc(attendees) : 0,
    budget,
    specialRequirements: specialRequirements === '' ? undefined : specialRequirements,
    createdAt: existingEvent?.createdAt ?? now,
    updatedAt: now,
  };
};

export const hasProjectContent = (values: EventFormData | null | undefined): boolean => {
  if (!values) {
    return false;
  }

  return Object.values(values).some(value => value.trim() !== '');
};

export const getProjectNameFromState = (
  values: EventFormData | null | undefined,
  currentEvent: EventInfo | null
): string => values?.name.trim() || currentEvent?.name.trim() || '未命名專案';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: '草稿',
  in_progress: '進行中',
  completed: '已完成',
};

export const getEventTypeLabel = (type: EventInfo['type']): string =>
  EVENT_TYPE_OPTIONS.find(option => option.value === type)?.label ?? type;

export const getEventScaleLabel = (scale: EventInfo['scale']): string =>
  EVENT_SCALE_OPTIONS.find(option => option.value === scale)?.label ?? scale;
