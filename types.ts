
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
export type SummaryType = 'summary' | 'action_items' | 'key_takeaways' | 'bullets';
export type ComplexityLevel = 'simple' | 'standard' | 'detailed' | 'technical';

export interface AnalysisState {
  rawContext: string;
  summary: string;
  summaryHistory: SummaryHistoryItem[];
  isProcessing: boolean;
  excludeCode: boolean;
  focusKeywords: string;
  summaryType: SummaryType;
  complexity: ComplexityLevel;
  error: string | null;
  language: AppLanguage;
  uploadProgress: number;
  // New Settings
  temperature: number;
  maxOutputTokens: number;
  customPersona?: string;
}

export enum TabType {
  SUMMARY = 'summary',
  CHAT = 'chat'
}
