
export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface AnalysisState {
  rawContext: string;
  summary: string;
  isProcessing: boolean;
  excludeCode: boolean;
  focusKeywords: string;
  error: string | null;
}

export enum TabType {
  SUMMARY = 'summary',
  CHAT = 'chat'
}
