import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { researchService } from '../../services/research/researchService';
import { historyService } from '../../services/history/historyService';
import { ResearchResult, SourceItem } from '../../types/assistant';
import { BackButton } from '../../components/ui/BackButton';
import { ActionConfirmationDialog } from '../../components/safety/ActionConfirmationDialog';
import { actionSafetyService } from '../../services/security/actionSafetyService';

const SUGGESTED_RESEARCH = [
  'React 2026 Compiler & Memoization Foundations',
  'Full-Duplex Voice Latency and Barge-in Protocols',
  'Indic Speech Synthesis & Acoustic Alignment in Hindi',
  'Web Audio Worklets vs AudioContext Stream Buffering'
];

export const ResearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<'idle' | 'searching' | 'synthesizing' | 'complete' | 'error'>('idle');
  const [progressStep, setProgressStep] = useState<number>(0); // 0: Query, 1: Searching, 2: Sources, 3: Synthesis
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Safety confirmation dialog for external source clicks
  const [safetyDialog, setSafetyDialog] = useState<{
    isOpen: boolean;
    url: string;
    domain: string;
  }>({
    isOpen: false,
    url: '',
    domain: ''
  });

  // Load previous research if any exists
  useEffect(() => {
    const stored = researchService.getStoredResults();
    if (stored.length > 0) {
      setResult(stored[0]);
      setState('complete');
      setProgressStep(3);
    }
  }, []);

  const handleStartResearch = async (searchTopic?: string) => {
    const q = (searchTopic || query).trim();
    if (!q) return;

    if (searchTopic) {
      setQuery(searchTopic);
    }

    setErrorMessage(null);
    setState('searching');
    setProgressStep(1);

    try {
      // Step 1: Searching
      const researchOutput = await researchService.executeResearch(q, 'en', (stage) => {
        if (stage === 'searching') {
          setState('searching');
          setProgressStep(1);
        } else if (stage === 'synthesizing') {
          setState('synthesizing');
          setProgressStep(2);
        }
      });

      // Step 2 & 3: Sources verified and Synthesized
      setProgressStep(3);
      setState('complete');
      setResult(researchOutput);

      // Record into history
      historyService.addHistoryItem({
        title: `Research: ${q.slice(0, 48)}`,
        type: 'research',
        preview: researchOutput.summary.slice(0, 160) + '...',
        metadata: {
          query: q,
          sourcesCount: researchOutput.sources.length
        },
        researchResult: researchOutput
      });
    } catch (err: any) {
      setState('error');
      setErrorMessage(err?.message || 'Research synthesis failed. Please try a different query.');
    }
  };

  const handleSourceClick = (e: React.MouseEvent, url: string, domain: string) => {
    e.preventDefault();
    const config = actionSafetyService.getConfig();
    const isAllowed = actionSafetyService.isDomainAllowed(domain);

    if (config.confirmBrowserNavigation && !isAllowed) {
      setSafetyDialog({
        isOpen: true,
        url,
        domain
      });
    } else {
      const opened = actionSafetyService.openApprovedUrl(url, { sameTab: true });
      if (opened) {
        actionSafetyService.logAction({
          actionType: 'open_research_source',
          target: url,
          decision: isAllowed ? 'auto_allowed' : 'allowed',
          reason: 'Direct source click'
        });
      }
    }
  };

  const handleConfirmSafety = () => {
    const opened = actionSafetyService.openApprovedUrl(safetyDialog.url, { sameTab: true });
    if (opened) {
      actionSafetyService.logAction({
        actionType: 'open_research_source',
        target: safetyDialog.url,
        decision: 'allowed',
        reason: 'User approved navigation'
      });
    }
    setSafetyDialog({ isOpen: false, url: '', domain: '' });
  };

  const handleCopySummary = () => {
    if (!result?.summary) return;
    navigator.clipboard.writeText(`${result.summary}\n\nKey Findings:\n${result.keyFindings.map((f) => `• ${f}`).join('\n')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BackButton label="Workspace" to="/app" />
            <span className="text-stone-300">/</span>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Research
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Deep Technical Research
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Grounded multi-source technical synthesis with verified documentation links and transparent reasoning.
          </p>
        </div>

        {/* Workflow breadcrumb: Query → Searching → Sources → Synthesis */}
        <div className="flex items-center gap-2 text-xs font-semibold bg-stone-100/80 p-2 rounded-xl border border-stone-200/60 self-start sm:self-auto">
          <span className={progressStep >= 0 ? 'text-stone-900' : 'text-stone-400'}>Query</span>
          <span className="text-stone-300">→</span>
          <span className={progressStep >= 1 ? 'text-indigo-600 font-bold' : 'text-stone-400'}>Searching</span>
          <span className="text-stone-300">→</span>
          <span className={progressStep >= 2 ? 'text-indigo-600 font-bold' : 'text-stone-400'}>Sources</span>
          <span className="text-stone-300">→</span>
          <span className={progressStep >= 3 ? 'text-emerald-600 font-bold' : 'text-stone-400'}>Synthesis</span>
        </div>
      </div>

      {/* Query Input Dock */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleStartResearch();
        }}
        className="my-6 relative"
      >
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={state === 'searching' || state === 'synthesizing'}
            placeholder="Enter research query (e.g. React 2026 Compiler Architecture)..."
            className="w-full pl-12 pr-28 py-3.5 bg-white border border-stone-200/90 rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 shadow-xs placeholder:text-stone-400 transition-all"
          />
          <button
            type="submit"
            disabled={!query.trim() || state === 'searching' || state === 'synthesizing'}
            className="absolute right-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {state === 'searching' || state === 'synthesizing' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Researching…</span>
              </>
            ) : (
              <>
                <span>Research</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested prompts pills if idle */}
      {state === 'idle' && !result && (
        <div className="mb-6 space-y-2">
          <span className="text-xs font-medium text-stone-500">
            Suggested Technical Topics:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_RESEARCH.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => handleStartResearch(topic)}
                className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 transition-colors cursor-pointer text-left flex items-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>{topic}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Progress State */}
      {(state === 'searching' || state === 'synthesizing') && (
        <div className="my-8 p-8 bg-white border border-stone-200 rounded-2xl shadow-xs text-center space-y-4 animate-in fade-in duration-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              {state === 'searching' ? 'Searching Technical Documentation…' : 'Synthesizing Verified Sources…'}
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              Scanning authoritative RFCs, official blog notes, and engineering papers for {query}.
            </p>
          </div>
          <div className="w-full max-w-xs mx-auto bg-stone-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
              style={{ width: state === 'searching' ? '50%' : '85%' }}
            />
          </div>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="my-6 p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-rose-900">Research Operation Interrupted</h3>
          <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
          <button
            type="button"
            onClick={() => handleStartResearch()}
            className="mt-4 px-4 py-2 bg-white text-rose-700 border border-rose-300 rounded-xl text-xs font-semibold hover:bg-rose-50 cursor-pointer"
          >
            Retry Query
          </button>
        </div>
      )}

      {/* Synthesis & Sources View (Completed State) */}
      {state === 'complete' && result && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Synthesis Box */}
          <div className="p-6 sm:p-7 bg-white border border-stone-200/90 rounded-2xl shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    Executive Synthesis
                  </span>
                  <h2 className="text-base font-bold text-stone-900">
                    {result.query}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Synthesized Paragraph */}
            <p className="text-sm text-stone-800 leading-relaxed font-normal">
              {result.summary}
            </p>

            {/* Key Technical Findings */}
            {result.keyFindings && result.keyFindings.length > 0 && (
              <div className="pt-4 border-t border-stone-100">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
                  Key Technical Findings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {result.keyFindings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-700 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-normal">{finding}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Authoritative Sources Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Authoritative Referenced Sources ({result.sources.length})
              </h3>
              <span className="text-[11px] text-stone-500">
                Direct external documentation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.sources.map((source) => (
                <div
                  key={source.id}
                  onClick={(e) => handleSourceClick(e, source.url, source.domain)}
                  className="group p-4 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-2xl transition-all shadow-2xs hover:shadow-xs cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-500">
                        <Globe className="w-3 h-3 text-stone-400" />
                        <span className="truncate">{source.domain}</span>
                      </div>
                      {source.publishedDate && (
                        <span className="text-[10px] text-stone-400 font-mono">
                          {source.publishedDate}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {source.title}
                    </h4>

                    <p className="text-[11px] text-stone-500 mt-2 line-clamp-3 leading-relaxed">
                      {source.excerpt}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-700">
                    <span>Inspect Source</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Safety Confirmation Dialog for external link clicking */}
      <ActionConfirmationDialog
        isOpen={safetyDialog.isOpen}
        title="Action Safety Confirmation"
        message={`NIVA wants to open external documentation from ${safetyDialog.domain}.`}
        target={safetyDialog.url}
        onAllow={handleConfirmSafety}
        onCancel={() => setSafetyDialog({ isOpen: false, url: '', domain: '' })}
      />
    </div>
  );
};
