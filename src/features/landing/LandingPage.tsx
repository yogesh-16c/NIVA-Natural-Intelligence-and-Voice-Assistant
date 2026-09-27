import React, { useState } from 'react';
import { Link } from '../../app/router';
import { VoiceOrb } from '../assistant/VoiceOrb';
import { ToolStatusBadge } from '../../components/ui/ToolStatusBadge';
import { NivaLogo } from '../../components/ui/NivaLogo';
import { ActionSafetyModal } from '../../components/safety/ActionSafetyModal';
import { speechService } from '../../services/voice/speechService';
import { AnimatedSoundWaveLines } from '../../components/ui/ArchitecturalLineAccents';
import {
  Mic,
  ArrowRight,
  Shield,
  Compass,
  MessageSquare,
  Clock,
  Layers,
  CheckCircle,
  ExternalLink,
  Languages,
  Zap,
  Globe,
  Code2,
  Volume2,
  Play,
  Square,
  Sliders,
  Check,
  Search
} from 'lucide-react';
import { ToolExecution } from '../../types/assistant';

export const LandingPage: React.FC = () => {
  const [previewTab, setPreviewTab] = useState<'voice' | 'tools'>('voice');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Interactive Voice Demo state
  const [activeVoicePrompt, setActiveVoicePrompt] = useState<'daily' | 'hindi' | 'marathi'>('daily');

  // Interactive Tool state
  const [activeToolDemo, setActiveToolDemo] = useState<'search' | 'calc' | 'browser'>('search');

  // Interactive Safety test state
  const [safetyTestResult, setSafetyTestResult] = useState<string | null>(null);

  // Multilingual active selection
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('en');

  const handlePlayVoiceSample = async (text: string) => {
    if (isPlayingAudio) {
      speechService.interrupt();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    try {
      await speechService.speak(text);
    } catch {
      // fallback
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const demoToolExecs: Record<string, ToolExecution> = {
    search: {
      id: 'demo_exec_search',
      type: 'web_search',
      label: 'Checking a source',
      status: 'success',
      input: { query: 'Best way to organize work priorities' },
      output: {
        summary: 'A clear summary is often more useful than a long raw list.',
        formattedText: 'Quick scan · practical summary'
      },
      timestamp: Date.now()
    },
    calc: {
      id: 'demo_exec_calc',
      type: 'calculator',
      label: 'Calculated expression',
      status: 'success',
      input: { expression: '25 * 4 + (180 / 3)' },
      output: {
        result: 160,
        formattedText: 'Result: 160'
      },
      timestamp: Date.now()
    },
    browser: {
      id: 'demo_exec_browser',
      type: 'browser_open',
      label: 'Needs confirmation',
      status: 'requires_confirmation',
      confirmationRequired: true,
      confirmationMessage: 'NIVA wants to open https://github.com.',
      input: { url: 'https://github.com' },
      timestamp: Date.now()
    }
  };

  const langContent: Record<'en' | 'hi' | 'mr', { name: string; native: string; sample: string; prompt: string }> = {
    en: {
      name: 'English',
      native: 'English',
      sample: 'Hello! I am NIVA. I can help with conversations, quick checks, and focused actions in a calm workspace.',
      prompt: 'Help me summarize my priorities for the day.'
    },
    hi: {
      name: 'Hindi',
      native: 'हिन्दी',
      sample: 'नमस्ते! मैं निवा हूँ। मैं सरल बातचीत, त्वरित जाँच और शांत तरीके से काम करने में मदद कर सकता हूँ।',
      prompt: 'आज की प्राथमिकताओं का संक्षिप्त सारांश बनाओ।'
    },
    mr: {
      name: 'Marathi',
      native: 'मराठी',
      sample: 'नमस्कार! मी निवा आहे. मी शांतपणे संभाषण, तपशीलांची पडताळणी आणि लक्ष केंद्रित कामांमध्ये मदत करू शकतो.',
      prompt: 'आजची प्राथमिकतां संक्षेपात मांड.'
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center bg-[#F8F5F1] antialiased selection:bg-sky-500 selection:text-white relative w-full">
      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center">
        {/* Subtle Category Kicker */}
        <div className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-stone-600 mb-6 px-3.5 py-1.5 rounded-full border border-stone-200/90 bg-white shadow-2xs">
          <NivaLogo size="xs" showText={false} />
          <span className="font-semibold text-stone-900">NIVA</span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span>Voice workspace</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-stone-900 max-w-3xl mx-auto leading-[1.08] text-balance">
          Your calm AI workspace for conversations, research, and action.
        </h1>

        <p className="mt-5 text-sm sm:text-base md:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed text-balance">
          Ask questions, explore ideas, and move between voice, chat, and context-aware assistance without extra clutter.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/app"
            className="px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/app/chat"
            className="px-5 py-3 text-xs sm:text-sm font-semibold text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 active:scale-[0.98]"
          >
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Voice & Chat</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowSafetyModal(true)}
            className="px-4 py-3 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-all cursor-pointer flex items-center gap-2 active:scale-[0.98]"
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Action Safety</span>
          </button>
        </div>

        {/* Interactive Orb Showcase */}
        <div className="mt-12 sm:mt-14 mb-4 flex flex-col items-center justify-center">
          <div className="relative group">
            <button
              type="button"
              onClick={() => handlePlayVoiceSample('Hello! I am NIVA. I can help with conversations, research, and mindful action in your workspace.')}
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95 relative focus:outline-none"
              title="Voice Assistant Orb"
              aria-label="Voice Assistant Orb"
            >
              <VoiceOrb state={isPlayingAudio ? 'speaking' : 'idle'} size={210} />
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Product Preview Card */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="bg-white border border-stone-200/90 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Header of Preview */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/60">
            <div className="flex items-center gap-2">
              <NivaLogo size="xs" showText={false} />
              <span className="text-xs font-bold text-stone-800 tracking-tight">
                Live capabilities
              </span>
            </div>

            {/* Segmented controls */}
            <div className="flex items-center gap-1 p-0.5 bg-stone-100 rounded-lg border border-stone-200/70 overflow-x-auto">
              {[
                { id: 'voice', label: 'Voice' },
                { id: 'tools', label: 'Tools' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPreviewTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    previewTab === tab.id
                      ? 'bg-white text-stone-900 font-bold shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab 1: Voice Stream */}
          {previewTab === 'voice' && (
            <div className="p-6 sm:p-8 bg-white min-h-[300px] flex flex-col justify-center space-y-4">
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-stone-100">
                <span className="text-xs font-semibold text-stone-500">Sample Query:</span>
                <button
                  type="button"
                  onClick={() => setActiveVoicePrompt('daily')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeVoicePrompt === 'daily'
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Daily planning
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVoicePrompt('hindi')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeVoicePrompt === 'hindi'
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  हिन्दी संवाद
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVoicePrompt('marathi')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeVoicePrompt === 'marathi'
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  मराठी संवाद
                </button>
              </div>

              <div className="max-w-xl mx-auto w-full space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    You
                  </div>
                  <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-xs sm:text-sm text-stone-800">
                    {activeVoicePrompt === 'daily' && '"Help me summarize my priorities for the day and keep the next steps clear."'}
                    {activeVoicePrompt === 'hindi' && '"आज की प्राथमिकताओं का संक्षिप्त सारांश बनाओ और अगले कदम साफ़ बताओ।"'}
                    {activeVoicePrompt === 'marathi' && '"आजची प्राथमिकतां संक्षेपात सांग आणि पुढील पायऱ्या स्पष्ट करा."'}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <NivaLogo size="xs" showText={false} className="shrink-0 mt-0.5" />
                  <div className="p-4 bg-white border border-stone-200/90 rounded-xl text-xs sm:text-sm text-stone-800 shadow-2xs space-y-2">
                    <p className="leading-relaxed">
                      {activeVoicePrompt === 'daily' && 'NIVA can organize the main tasks, surface the next best step, and keep the plan calm and easy to follow without extra noise.'}
                      {activeVoicePrompt === 'hindi' && 'NIVA मुख्य कामों को सरल रूप में प्रस्तुत कर सकता है, अगला कदम स्पष्ट कर सकता है, और बिना ज़्यादा जटिलता के योजना बनाता है।'}
                      {activeVoicePrompt === 'marathi' && 'NIVA मुख्य कामे स्पष्टपणे मांडू शकतो, पुढचा योग्य पायरा सांगू शकतो आणि अधिक गोंधळ न देता योजना सोपी ठेवू शकतो.'}
                    </p>
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Barge-in active</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePlayVoiceSample(
                          activeVoicePrompt === 'daily'
                            ? 'NIVA can organize the priorities for the day and keep the next steps simple and clear.'
                            : activeVoicePrompt === 'hindi'
                            ? 'NIVA मुख्य कामों को सरल तरीके से समझा सकता है और अगले कदमों को स्पष्ट कर सकता है।'
                            : 'NIVA मुख्य कामे स्पष्ट मांडू शकतो आणि पुढील पायऱ्या सहज सांगू शकतो.'
                        )}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen to audio</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tool Execution */}
          {previewTab === 'tools' && (
            <div className="p-6 sm:p-8 bg-white min-h-[300px] flex flex-col justify-center space-y-4">
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-stone-100">
                <span className="text-xs font-semibold text-stone-500">Simulate Tool:</span>
                <button
                  type="button"
                  onClick={() => setActiveToolDemo('search')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeToolDemo === 'search'
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Web Search
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToolDemo('calc')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeToolDemo === 'calc'
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Calculator
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToolDemo('browser')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeToolDemo === 'browser'
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Action Confirmation
                </button>
              </div>

              <div className="max-w-xl mx-auto w-full space-y-3">
                <ToolStatusBadge execution={demoToolExecs[activeToolDemo]} />
                <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-600 leading-relaxed">
                  <span className="font-semibold text-stone-900">Simple guardrail:</span> NIVA asks before opening external pages and keeps user approval in the loop.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Core Architecture */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18 border-t border-stone-200/80">
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Engine Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
            Talk → Understand → Research → Act → History
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed">
            A cohesive feedback loop engineered for low latency, transparent citations, and deterministic execution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {[
            {
              step: '01',
              title: 'Talk',
              desc: 'Continuous real-time voice streaming with sub-second acoustic barge-in.'
            },
            {
              step: '02',
              title: 'Understand',
              desc: 'Contextual semantic parsing supporting English, हिन्दी, and मराठी.'
            },
            {
              step: '03',
              title: 'Research',
              desc: 'Multi-source technical synthesis grounded in official documentation.'
            },
            {
              step: '04',
              title: 'Act',
              desc: 'Tool dispatch with explicit user confirmation and allowlists.'
            },
            {
              step: '05',
              title: 'History',
              desc: 'Structured session timelines for transcripts, research, and actions.'
            }
          ].map((item) => (
            <div
              key={item.step}
              className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-colors"
            >
              <span className="text-xs font-mono font-bold text-stone-400">
                {item.step}
              </span>
              <h3 className="text-sm font-bold text-stone-900 mt-2 tracking-tight">
                {item.title}
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Multilingual Support Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18 border-t border-stone-200/80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-stone-500 mb-2 font-medium">
              <Globe className="w-3.5 h-3.5 text-stone-400" />
              <span>Multilingual Voice</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Natural Indic Voice & Dialect Intelligence
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
              NIVA is natively multilingual. Speak naturally in English, हिन्दी, or मराठी. Speech models handle code-switching and technical jargon cleanly.
            </p>

            <div className="mt-6 space-y-2.5">
              {(['en', 'hi', 'mr'] as const).map((code) => {
                const item = langContent[code];
                const isSelected = selectedLang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelectedLang(code)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-50 border-stone-900 shadow-2xs'
                        : 'bg-white border-stone-200/80 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">{item.native} ({item.name})</span>
                      {isSelected && <span className="text-[10px] font-semibold text-stone-600 uppercase">Selected</span>}
                    </div>
                    <span className="text-xs text-stone-500 mt-1 block">"{item.prompt}"</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Language Voice Tester Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Languages className="w-4 h-4 text-stone-700" />
              Spoken Audio Sample: {langContent[selectedLang].native}
            </h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Click below to hear NIVA synthesize spoken audio in {langContent[selectedLang].name}:
            </p>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl mb-4 text-xs text-stone-800 leading-relaxed">
              "{langContent[selectedLang].sample}"
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handlePlayVoiceSample(langContent[selectedLang].sample)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear {langContent[selectedLang].name}</span>
              </button>

              <span className="text-[11px] text-stone-400">
                Client speech synthesis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Action Safety Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18 border-t border-stone-200/80">
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 mb-2 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Action Safety Guardrails</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              User Confirmation for Sensitive Actions
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
              Whenever an action involves opening an external website, navigating outside trusted domains, or processing sensitive parameters, NIVA pauses execution until you explicitly authorize the action.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSafetyModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure Action Safety</span>
              </button>

              <Link
                to="/app"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-stone-800 text-xs font-semibold hover:bg-stone-50 border border-stone-200/90 transition-colors shadow-2xs"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Action Safety Modal */}
      <ActionSafetyModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
      />
    </div>
  );
};
