
export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

export interface SummaryHistoryItem {
  id: string;
  timestamp: Date;
  summary: string;
  rawContext: string;
  excludeCode: boolean;
  focusKeywords: string;
}

export type AppLanguage = 'en' | 'th';

export interface AnalysisState {
  rawContext: string;
  summary: string;
  summaryHistory: SummaryHistoryItem[];
  isProcessing: boolean;
  excludeCode: boolean;
  focusKeywords: string;
  error: string | null;
  language: AppLanguage;
}

export enum TabType {
  SUMMARY = 'summary',
  CHAT = 'chat'
}
