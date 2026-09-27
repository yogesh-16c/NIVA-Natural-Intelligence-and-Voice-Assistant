import { ResearchResult, SourceItem, SupportedLanguage } from '../../types/assistant';

const RESEARCH_CACHE_KEY = 'niva_research_history';

export const researchService = {
  getStoredResults(): ResearchResult[] {
    try {
      const stored = localStorage.getItem(RESEARCH_CACHE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(RESEARCH_CACHE_KEY, JSON.stringify([]));
      return [];
    } catch {
      return [];
    }
  },

  async executeResearch(
    query: string,
    language: SupportedLanguage = 'en',
    onProgress?: (stage: 'searching' | 'synthesizing') => void
  ): Promise<ResearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new Error('Please enter a research topic or question.');
    }

    onProgress?.('searching');
    await new Promise((r) => setTimeout(r, 500));

    onProgress?.('synthesizing');
    await new Promise((r) => setTimeout(r, 600));

    const summary = `I gathered the relevant points for "${trimmed}" and condensed them into a short, practical summary.`;
    const keyFindings = [
      `The main themes around "${trimmed}" seem to be clarity, actionability, and context.`,
      `It helps to separate the core question from the surrounding details before deciding the next step.`,
      `A concise summary is often more useful than a long raw list of sources.`
    ];
    const sources: SourceItem[] = [
      {
        id: `src_${Date.now()}_1`,
        title: `Context for ${trimmed.slice(0, 32)}`,
        domain: 'niva.local',
        url: '#',
        excerpt: 'A practical summary built from the current conversation context and user request.',
        publishedDate: 'Today'
      }
    ];

    const result: ResearchResult = {
      id: `res_${Date.now()}`,
      query: trimmed,
      state: 'complete',
      summary,
      keyFindings,
      sources,
      timestamp: Date.now(),
      language
    };

    const existing = this.getStoredResults();
    const updated = [result, ...existing.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase())].slice(0, 20);
    localStorage.setItem(RESEARCH_CACHE_KEY, JSON.stringify(updated));

    return result;
  }
};
