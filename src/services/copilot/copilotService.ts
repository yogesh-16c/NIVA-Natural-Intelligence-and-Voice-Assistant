import { SourceItem, SupportedLanguage } from '../../types/assistant';

export type CopilotMode = 'code' | 'synthesis' | 'task' | 'voice';

export interface CopilotStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done';
  detail?: string;
}

export interface CopilotResponse {
  id: string;
  query: string;
  mode: CopilotMode;
  timestamp: number;
  executiveSummary: string;
  keyInsights: string[];
  codeBlock?: {
    language: string;
    filename?: string;
    code: string;
  };
  actionPlan?: {
    step: number;
    title: string;
    description: string;
  }[];
  sources: SourceItem[];
  reasoningSteps: CopilotStep[];
}

const COPILOT_HISTORY_KEY = 'niva_copilot_history';

export const copilotService = {
  getHistory(): CopilotResponse[] {
    try {
      const stored = localStorage.getItem(COPILOT_HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch {
      return [];
    }
  },

  async executeCopilot(
    query: string,
    mode: CopilotMode = 'synthesis',
    _language: SupportedLanguage = 'en',
    onStepUpdate?: (steps: CopilotStep[]) => void
  ): Promise<CopilotResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new Error('Please enter a query or instruction for NIVA.');
    }

    const steps: CopilotStep[] = [
      { id: '1', label: 'Reviewing the request', status: 'active' },
      { id: '2', label: 'Preparing a clear summary', status: 'pending' },
      { id: '3', label: 'Finalizing the response', status: 'pending' }
    ];

    onStepUpdate?.([...steps]);
    await new Promise((r) => setTimeout(r, 300));
    steps[0].status = 'done';
    steps[1].status = 'active';
    onStepUpdate?.([...steps]);
    await new Promise((r) => setTimeout(r, 300));
    steps[1].status = 'done';
    steps[2].status = 'active';
    onStepUpdate?.([...steps]);
    await new Promise((r) => setTimeout(r, 300));
    steps[2].status = 'done';
    onStepUpdate?.([...steps]);

    const response: CopilotResponse = {
      id: `copilot_${Date.now()}`,
      query: trimmed,
      mode,
      timestamp: Date.now(),
      executiveSummary: `I reviewed the request and distilled it into a clear, practical response for: "${trimmed}".`,
      keyInsights: [
        'Keep the aim specific and the next action visible.',
        'A short summary often helps more than a long list of details.',
        'Focus on the most relevant context before moving forward.'
      ],
      sources: [],
      reasoningSteps: steps
    };

    const existing = this.getHistory();
    const updated = [response, ...existing.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase())].slice(0, 25);
    localStorage.setItem(COPILOT_HISTORY_KEY, JSON.stringify(updated));

    return response;
  }
};
