export interface EventInfo {
  id: string;
  name: string;
  type: EventType;
  scale: EventScale;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  attendees: number;
  budget?: number;
  specialRequirements?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventFormData {
  name: string;
  type: EventType;
  scale: EventScale;
  startDate: string;
  endDate: string;
  location: string;
  attendees: string;
  budget: string;
  description: string;
  specialRequirements: string;
}

export enum EventType {
  CONFERENCE = 'conference',
  EXHIBITION = 'exhibition',
  CONCERT = 'concert',
  SPORTS = 'sports',
  CORPORATE = 'corporate',
  WEDDING = 'wedding',
  FESTIVAL = 'festival',
  SEMINAR = 'seminar',
  WORKSHOP = 'workshop',
  OTHER = 'other',
}

export enum EventScale {
  SMALL = 'small', // < 50 人
  MEDIUM = 'medium', // 50-200 人
  LARGE = 'large', // 200-1000 人
  EXTRA_LARGE = 'extra_large', // > 1000 人
}

export interface SOPSection {
  id: string;
  title: string;
  order: number;
  content: string;
  tasks: SOPTask[];
  estimatedDuration?: number; // 分鐘
}

export interface SOPTask {
  id: string;
  title: string;
  description: string;
  responsible: string;
  estimatedDuration?: number; // 分鐘
  deadline?: string;
  dependencies?: string[];
  status: TaskStatus;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

export interface SOPDocument {
  eventId: string;
  eventName: string;
  sections: SOPSection[];
  timeline: TimelineItem[];
  checklist: ChecklistItem[];
  generatedAt: string;
}

export interface TimelineItem {
  id: string;
  date: string;
  time?: string;
  milestone: string;
  description: string;
}

export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  checked: boolean;
}
