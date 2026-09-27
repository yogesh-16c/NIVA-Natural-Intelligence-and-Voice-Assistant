import React, { useState } from 'react';
import { useAssistant } from '../../context/AssistantContext';
import { VoiceOrb } from './VoiceOrb';
import { LiveTranscription } from './LiveTranscription';
import { ToolStatusBadge } from '../../components/ui/ToolStatusBadge';
import { useRouter, Link } from '../../app/router';
import {
  Mic,
  MicOff,
  Send,
  Square,
  Globe,
  Shield,
  Sparkles,
  ArrowRight,
  BookOpen,
  Search,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  Loader2,
  Sliders,
  MoreHorizontal,
  Play,
  Hourglass,
  CloudSun,
  Timer,
  Terminal,
  Activity,
  ChevronRight
} from 'lucide-react';
import { ActionSafetyModal } from '../../components/safety/ActionSafetyModal';
import { ActionConfirmationDialog } from '../../components/safety/ActionConfirmationDialog';
import { actionSafetyService } from '../../services/security/actionSafetyService';
import { researchService } from '../../services/research/researchService';
import { historyService } from '../../services/history/historyService';
import { ResearchResult } from '../../types/assistant';

export const WorkspacePage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    user,
    assistantState,
    audioLevel,
    currentTranscript,
    isTranscribing,
    currentToolExecution,
    messages,
    startListening,
    stopListening,
    interrupt,
    processUserInput,
    currentLanguage
  } = useAssistant();

  const [inputVal, setInputVal] = useState('');
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Integrated Deep Research state directly in the Dashboard
  const [activeResearch, setActiveResearch] = useState<{
    isLoading: boolean;
    stage: 'searching' | 'synthesizing' | 'complete' | 'idle';
    result: ResearchResult | null;
    query: string;
  } | null>(null);

  const [copiedResearch, setCopiedResearch] = useState(false);

  // Action Safety confirmation modal state for external source clicks
  const [safetyDialog, setSafetyDialog] = useState<{
    isOpen: boolean;
    url: string;
    domain: string;
  }>({
    isOpen: false,
    url: '',
    domain: ''
  });

  const userName = user?.name ? user.name.split(' ')[0] : 'Alex';

  const handleOrbClick = () => {
    if (assistantState === 'speaking') {
      interrupt();
    } else if (assistantState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || assistantState === 'thinking') return;
    const text = inputVal;
    setInputVal('');
    setIsTypingMode(false);

    const lower = text.toLowerCase().trim();
    if (lower.startsWith('research') || lower.startsWith('synthesize') || lower.startsWith('deep research')) {
      handleExecuteIntegratedResearch(text);
    } else {
      processUserInput(text);
    }
  };

  const handleExecuteIntegratedResearch = async (searchTopic: string) => {
    const cleanTopic = searchTopic.replace(/^(research|synthesize|deep research)\s+/i, '').trim() || searchTopic;
    setActiveResearch({
      isLoading: true,
      stage: 'searching',
      result: null,
      query: cleanTopic
    });

    try {
      const output = await researchService.executeResearch(cleanTopic, currentLanguage, (stage) => {
        setActiveResearch((prev) => (prev ? { ...prev, stage } : null));
      });

      setActiveResearch({
        isLoading: false,
        stage: 'complete',
        result: output,
        query: cleanTopic
      });

      historyService.addHistoryItem({
        title: `Research: ${cleanTopic.slice(0, 48)}`,
        type: 'research',
        preview: output.summary.slice(0, 160) + '...',
        metadata: {
          query: cleanTopic,
          sourcesCount: output.sources.length
        },
        researchResult: output
      });
    } catch (err) {
      setActiveResearch(null);
      processUserInput(searchTopic);
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
          reason: 'Direct source click from dashboard'
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
        reason: 'User approved navigation from dashboard'
      });
    }
    setSafetyDialog({ isOpen: false, url: '', domain: '' });
  };

  const handleQuickCommand = (command: string) => {
    processUserInput(command);
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  const getAssistantStatusText = () => {
    switch (assistantState) {
      case 'listening':
        return 'Listening';
      case 'thinking':
        return 'Thinking';
      case 'speaking':
        return 'Speaking';
      case 'interrupted':
        return 'Paused';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="flex-1 w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-between bg-white relative">
      {/* 3-Column Grid Matching Reference Image: Hero Center / Middle Panel / Right Widgets */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Assistant Hero Section (Span 6 or 7 on desktop) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center text-center pt-2 sm:pt-4">
          
          {/* Header Title: How can I help you today, Alex? */}
          <h1 className="text-2xl sm:text-3xl font-medium text-stone-900 tracking-tight">
            Hello, {userName}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-stone-600">
            What can I help you accomplish?
          </p>

          {/* Pearlescent Iridescent Voice Orb */}
          <div className="my-4 sm:my-6 relative flex items-center justify-center">
            <VoiceOrb
              state={assistantState}
              audioLevel={audioLevel}
              onClick={handleOrbClick}
              size={210}
            />
          </div>

          <div className="text-lg sm:text-xl font-medium text-stone-900 tracking-tight">
            {getAssistantStatusText()}
          </div>

          {currentToolExecution && (
            <div className="mt-3">
              <ToolStatusBadge execution={currentToolExecution} compact />
            </div>
          )}

          {/* Audio Waveform Bars + Centered Microphone Icon */}
          <div className="flex items-center justify-center gap-1.5 my-3 h-8 select-none">
            {/* Left Sound Wave Bars */}
            <span
              className={`w-0.5 rounded-full transition-all duration-150 ${
                assistantState === 'listening'
                  ? 'bg-amber-400 h-5 animate-pulse'
                  : 'bg-amber-300/80 h-3'
              }`}
            />
            <span
              className={`w-0.5 rounded-full transition-all duration-150 ${
                assistantState === 'listening'
                  ? 'bg-amber-400 h-7 animate-pulse delay-75'
                  : 'bg-amber-300/80 h-4'
              }`}
            />
            <span
              className={`w-0.5 rounded-full transition-all duration-150 ${
                assistantState === 'listening'
                  ? 'bg-amber-400 h-4 animate-pulse delay-150'
                  : 'bg-amber-300/80 h-2'
              }`}
            />
            <span
              className={`w-0.5 rounded-full transition-all duration-150 ${
                assistantState === 'listening'
                  ? 'bg-amber-400 h-6 animate-pulse delay-100'
                  : 'bg-amber-300/80 h-3'
              }`}
            />

            {/* Interactive Mic Button */}
            <button
              type="button"
              onClick={handleOrbClick}
              aria-label={assistantState === 'listening' ? 'Stop listening' : 'Start listening'}
              className="mx-1.5 p-1 text-stone-700 hover:text-sky-600 transition-colors cursor-pointer"
            >
              {assistantState === 'listening' ? (
                <MicOff className="w-4 h-4 text-emerald-600" />
              ) : assistantState === 'speaking' ? (
                <Square className="w-3.5 h-3.5 text-amber-600 fill-current" />
              ) : (
                <Mic className="w-4 h-4 text-stone-700" />
              )}
            </button>

            {/* Right Sound Wave Bars */}
            <span
              className={`w-0.5 rounded-full transition-all duration-150 ${
                assistantState === 'listening'
                  ? 'bg-amber-400 h-6 animate-pulse delay-100'
                  : 'bg-amber-300/80 h-3'
              }`}
            />
            <span
              className={`w-0.5 rounded-full transition-all duration-150 ${
                assistantState === 'listening'
                  ? 'bg-amber-400 h-4 animate-pulse delay-75'
                  : 'bg-amber-300/80 h-2'
              }`}
            />
            <span
              className={`w-0.5 rounded-full transition-all duration-150 ${
                assistantState === 'listening'
                  ? 'bg-amber-400 h-7 animate-pulse delay-150'
                  : 'bg-amber-300/80 h-4'
              }`}
            />
            <span
              className={`w-0.5 rounded-full transition-all duration-150 ${
                assistantState === 'listening'
                  ? 'bg-amber-400 h-5 animate-pulse'
                  : 'bg-amber-300/80 h-3'
              }`}
            />
          </div>

          {/* Tap to speak or type a command (Pill Button / Input Dock) */}
          <div className="w-full max-w-sm mt-2">
            {!isTypingMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsTypingMode(true);
                  if (assistantState === 'idle') {
                    startListening();
                  }
                }}
                className="w-full py-3 px-5 rounded-2xl bg-white border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-stone-300 text-xs sm:text-sm font-normal text-stone-500 hover:text-stone-800 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Tap to speak or type a command</span>
              </button>
            ) : (
              <form
                onSubmit={handleSendText}
                className="flex items-center bg-white border border-sky-400 rounded-2xl shadow-md p-1 animate-in fade-in zoom-in-95 duration-150"
              >
                <input
                  type="text"
                  autoFocus
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask NIVA anything..."
                  className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-transparent border-0 text-stone-900 placeholder:text-stone-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className="p-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-30 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsTypingMode(false)}
                  className="p-2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Middle Column: Tall Smooth Frosted Card (Matches reference image middle panel) */}
        <div className="lg:col-span-2 hidden xl:flex flex-col justify-between h-[480px] rounded-3xl bg-[#F8FAFC]/90 border border-stone-100 p-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 text-stone-500 text-xs font-semibold">
              <span className="uppercase tracking-wider text-[10px] text-stone-400 font-bold">Workspace</span>
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            </div>

            {/* Live Assistant Activity or Prompts */}
            {currentTranscript || lastAssistantMsg ? (
              <div className="mt-3 space-y-2 text-left">
                {currentTranscript && (
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200/70 text-xs text-stone-700">
                    <span className="text-[10px] uppercase font-bold text-sky-600 block mb-0.5">Live transcript</span>
                    <p className="line-clamp-4">{currentTranscript}</p>
                  </div>
                )}
                {lastAssistantMsg && (
                  <div className="p-2.5 rounded-xl bg-white/90 border border-stone-200/70 text-xs text-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block mb-0.5">Assistant</span>
                    <p className="line-clamp-6 text-[11px] leading-relaxed text-stone-600">
                      {lastAssistantMsg.text}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-2 text-left">
                <p className="text-[11px] text-stone-400 leading-snug">
                  Suggested actions:
                </p>
                <button
                  type="button"
                  onClick={() => handleQuickCommand('Summarize the latest update for my team')}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/60 text-[11px] font-medium text-stone-700 transition-colors shadow-2xs cursor-pointer block"
                >
                  <span className="text-sky-600 font-semibold block mb-0.5">Summarize</span>
                  Latest update for my team
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCommand('Review this project brief and highlight the priorities')}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/60 text-[11px] font-medium text-stone-700 transition-colors shadow-2xs cursor-pointer block"
                >
                  <span className="text-violet-600 font-semibold block mb-0.5">Review</span>
                  Project brief and priorities
                </button>
              </div>
            )}
          </div>

          {/* Quick link to chat */}
          <Link
            to="/app/chat"
            className="w-full py-2 px-3 rounded-xl bg-white border border-stone-200/80 text-[11px] font-medium text-stone-600 hover:text-stone-900 flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
          >
            <span>Open Timeline</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          </Link>
        </div>

        {/* Right Column: Stacked Cards (Recent Activity & Analytics) */}
        <div className="lg:col-span-6 xl:col-span-4 flex flex-col gap-4">
          
          <div className="bg-white rounded-3xl border border-stone-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-left">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-sm font-bold text-stone-900">
                Suggested actions
              </h2>
            </div>
            <div className="space-y-3 mt-2">
              <button
                type="button"
                onClick={() => handleQuickCommand('Draft a short summary of this update')}
                className="w-full text-left p-3 rounded-2xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Summarize</span>
                <span className="mt-1 block text-xs text-stone-800">Draft a short summary</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickCommand('Review my current project priorities')}
                className="w-full text-left p-3 rounded-2xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Review</span>
                <span className="mt-1 block text-xs text-stone-800">Check project priorities</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickCommand('Help me prepare a clear response')}
                className="w-full text-left p-3 rounded-2xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Respond</span>
                <span className="mt-1 block text-xs text-stone-800">Prepare a clear response</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Integrated Research Preview Modal / Banner if triggered */}
      {activeResearch && (
        <div className="mt-4 p-5 rounded-2xl bg-white border border-stone-200/90 shadow-lg text-left animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                  Grounded Research
                </span>
                <h3 className="text-xs font-bold text-stone-900 truncate max-w-md">
                  {activeResearch.query}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveResearch(null)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeResearch.isLoading ? (
            <div className="py-6 text-center space-y-3">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-stone-800">
                {activeResearch.stage === 'searching'
                  ? 'Searching verified documentation & RFCs…'
                  : 'Synthesizing technical findings…'}
              </p>
            </div>
          ) : activeResearch.result ? (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-stone-700 leading-relaxed">
                {activeResearch.result.summary}
              </p>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                {activeResearch.result.sources.map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={(e) => handleSourceClick(e, src.url, src.domain)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-[11px] font-medium text-stone-800 cursor-pointer"
                  >
                    <Globe className="w-3 h-3 text-stone-500" />
                    <span>{src.domain}</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Action Safety Inspection Modal */}
      <ActionSafetyModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
      />

      {/* Action Safety Confirmation Dialog */}
      <ActionConfirmationDialog
        isOpen={safetyDialog.isOpen}
        title="Action Safety"
        message={`NIVA wants to open ${safetyDialog.domain}.`}
        target={safetyDialog.url}
        onAllow={handleConfirmSafety}
        onCancel={() => setSafetyDialog({ isOpen: false, url: '', domain: '' })}
      />
    </div>
  );
};
