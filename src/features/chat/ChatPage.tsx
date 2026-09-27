import React, { useState, useRef, useEffect } from 'react';
import { useAssistant } from '../../context/AssistantContext';
import { ToolStatusBadge } from '../../components/ui/ToolStatusBadge';
import { BackButton } from '../../components/ui/BackButton';
import { NivaLogo } from '../../components/ui/NivaLogo';
import { AnimatedSoundWaveLines } from '../../components/ui/ArchitecturalLineAccents';
import {
  Mic,
  MicOff,
  Send,
  Square,
  ExternalLink,
  Trash2,
  Volume2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { speechService } from '../../services/voice/speechService';
import { historyService } from '../../services/history/historyService';
import { useRouter } from '../../app/router';

export const ChatPage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    messages,
    assistantState,
    processUserInput,
    startListening,
    stopListening,
    interrupt,
    clearChat,
    selectedVoice
  } = useAssistant();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || assistantState === 'thinking') return;
    const text = inputVal;
    setInputVal('');
    processUserInput(text);
  };

  const handleMicClick = () => {
    if (assistantState === 'speaking') {
      interrupt();
    } else if (assistantState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSpeakMessage = (text: string) => {
    speechService.speak(text, selectedVoice);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4.25rem)] max-w-4xl w-full mx-auto p-4 sm:p-6">
      {/* Top Action Row */}
      <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/80 mb-3 text-xs">
        <div className="flex items-center gap-3">
          <BackButton label="Workspace" to="/app" />
          <div className="h-4 w-[1px] bg-stone-200 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 text-stone-500 font-medium">
            <span>Conversation Timeline</span>
            <span>·</span>
            <span>{messages.length} messages</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick link to History */}
          <button
            type="button"
            onClick={() => navigate('/app/history')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer border border-stone-200/70"
            title="Browse full session history"
          >
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-semibold">History</span>
          </button>

          {/* Assistant Voice Status indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200 bg-white">
            <AnimatedSoundWaveLines bars={6} height={12} active={assistantState !== 'idle'} />
            <span className="text-[10px] font-semibold text-stone-600 capitalize">
              {assistantState === 'listening' ? 'Listening' : assistantState === 'speaking' ? 'Speaking' : assistantState === 'thinking' ? 'Thinking' : 'Ready'}
            </span>
          </div>

          <button
            type="button"
            onClick={clearChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-stone-200/60"
            title="Clear timeline"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="font-medium">Clear</span>
          </button>
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400">
            <NivaLogo size="md" showText={false} />
            <h3 className="text-sm font-semibold text-stone-900 mt-3">
              Conversation timeline is ready
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mt-1">
              Ask technical questions, trigger research syntheses, or activate voice mode.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Header info */}
              <div className="flex items-center gap-2 mb-1.5 text-[11px] text-stone-400 px-1">
                {msg.role === 'user' ? (
                  <>
                    <span className="font-semibold text-stone-700">You</span>
                    <span>·</span>
                    <span className="font-mono text-[10px]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <NivaLogo size="xs" showText={false} />
                    <span className="font-semibold text-stone-900">NIVA</span>
                    <span>·</span>
                    <span className="font-mono text-[10px]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Message Box */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-stone-900 text-white font-normal shadow-xs'
                    : 'bg-white border border-stone-200/90 text-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Tool Execution in Assistant Response */}
                {msg.toolExecution && (
                  <div className="mt-2.5">
                    <ToolStatusBadge execution={msg.toolExecution} />
                  </div>
                )}

                {/* Source Cards if present */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-stone-100">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                      Referenced Sources ({msg.sources.length})
                    </span>
                    <div className="space-y-1.5">
                      {msg.sources.map((src) => (
                        <a
                          key={src.id}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/70 text-xs text-stone-700 transition-colors group"
                        >
                          <div className="truncate mr-2">
                            <p className="font-semibold text-stone-900 truncate">
                              {src.title}
                            </p>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {src.domain}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Read Aloud Affordance for Assistant Messages */}
                {msg.role === 'assistant' && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                    <button
                      type="button"
                      onClick={() => handleSpeakMessage(msg.text)}
                      className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer font-medium"
                      title="Speak response aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Speak</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Live Thinking Indicator */}
        {assistantState === 'thinking' && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-stone-400 px-1">
              <NivaLogo size="xs" showText={false} />
              <span className="font-semibold text-stone-900">NIVA</span>
              <span>·</span>
              <span className="font-mono text-[10px] text-indigo-600 font-bold">THINKING</span>
            </div>
            <div className="bg-white border border-stone-200/90 rounded-2xl px-4 py-3 text-xs text-stone-600 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span>Thinking & evaluating tools…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <div className="pt-3">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-white border border-stone-200/90 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-600/10 transition-all p-1.5"
        >
          <button
            type="button"
            onClick={handleMicClick}
            aria-label={assistantState === 'listening' ? 'Stop listening' : 'Start speaking'}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              assistantState === 'listening'
                ? 'bg-emerald-600 text-white animate-pulse'
                : assistantState === 'speaking'
                ? 'bg-amber-100 text-amber-800'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            {assistantState === 'listening' ? (
              <MicOff className="w-4 h-4" />
            ) : assistantState === 'speaking' ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask NIVA anything..."
            disabled={assistantState === 'thinking'}
            className="flex-1 bg-transparent px-3 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || assistantState === 'thinking'}
            className="p-2.5 rounded-xl text-stone-400 hover:text-indigo-600 disabled:opacity-30 hover:bg-indigo-50/60 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
