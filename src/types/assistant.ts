export type AssistantState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'error';

export type ToolStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'error'
  | 'requires_confirmation';

export type ToolType =
  | 'web_search'
  | 'research_sources'
  | 'calculator'
  | 'browser_open'
  | 'screen_analysis';

export interface ToolExecution {
  id: string;
  type: ToolType;
  label: string;
  status: ToolStatus;
  input: Record<string, any>;
  output?: any;
  error?: string;
  timestamp: number;
  confirmationRequired?: boolean;
  confirmationMessage?: string;
}

export type ResearchState =
  | 'idle'
  | 'searching'
  | 'synthesizing'
  | 'complete'
  | 'error';

export interface SourceItem {
  id: string;
  title: string;
  domain: string;
  url: string;
  excerpt: string;
  publishedDate?: string;
}

export interface ResearchResult {
  id: string;
  query: string;
  state: ResearchState;
  summary: string;
  keyFindings: string[];
  sources: SourceItem[];
  timestamp: number;
  language: SupportedLanguage;
}

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  samplePrompt: string;
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  subGreeting: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: 'female' | 'male';
  recommendedFor: SupportedLanguage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  language?: SupportedLanguage;
  toolExecution?: ToolExecution;
  sources?: SourceItem[];
}

export interface ActivityItem {
  id: string;
  type: 'conversation' | 'web_research' | 'tool_execution' | 'browser_action' | 'screen_analysis';
  title: string;
  description: string;
  timestamp: number;
  status: 'success' | 'running' | 'failed' | 'interrupted';
  details?: Record<string, any>;
}

export type HistorySessionType = 'voice' | 'text' | 'research' | 'action';

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
  type: HistorySessionType;
  preview: string;
  durationSeconds?: number;
  metadata?: {
    messageCount?: number;
    query?: string;
    sourcesCount?: number;
    url?: string;
    actionType?: string;
    actionResult?: string;
  };
  messages?: ChatMessage[];
  researchResult?: ResearchResult;
  toolExecution?: ToolExecution;
}

export interface ActionSafetyConfig {
  confirmBrowserNavigation: boolean;
  allowedDomains: string[];
  requireConfirmationForExternalUrls: boolean;
  sanitizeInputs: boolean;
}

export interface ActionSafetyRequest {
  id: string;
  actionType: ToolType;
  title: string;
  target?: string;
  message: string;
  status: 'pending' | 'allowed' | 'cancelled';
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}
