
export interface Message {
  id: string;
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
export type OutputLanguage = 'auto' | 'en' | 'th';
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
  outputLanguage: OutputLanguage;
  uploadProgress: number;
  // New Settings
  temperature: number;
  maxOutputTokens: number;
  customPersona?: string;
  appMode: AppMode;
  codeFiles: CodeFile[];
  activeCodeFileId: string | null;
  editMode: boolean;
  summaryUndoStack: string[];
  summaryRedoStack: string[];
}

export enum AppMode {
  ANALYSIS = 'analysis',
  CODE = 'code'
}

export interface CodeFile {
  id: string;
  name: string;
  content: string;
  summary: string;
  lastUpdated: Date;
}

export enum TabType {
  SUMMARY = 'summary',
  CHAT = 'chat',
  CODE_EDITOR = 'code_editor'
}
