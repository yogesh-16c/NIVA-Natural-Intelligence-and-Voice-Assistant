import React from 'react';
import { AssistantState } from '../../types/assistant';
import { Mic } from 'lucide-react';

interface LiveTranscriptionProps {
  transcript: string;
  assistantState: AssistantState;
  lastAssistantSpeech?: string;
  isTranscribing: boolean;
}

export const LiveTranscription: React.FC<LiveTranscriptionProps> = ({
  transcript,
  assistantState,
  lastAssistantSpeech,
  isTranscribing
}) => {
  if (!transcript && assistantState !== 'speaking' && !isTranscribing) {
    return (
      <div className="h-14 flex items-center justify-center text-xs text-zinc-400">
        <span>Tap orb or microphone to speak naturally</span>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Live audio transcript"
      className="w-full max-w-xl mx-auto min-h-14 px-4 py-2 flex flex-col items-center justify-center text-center transition-all"
    >
      {/* User Speaking Transcript */}
      {isTranscribing && transcript && (
        <div className="flex items-center gap-2 text-zinc-800 text-sm sm:text-base font-normal leading-relaxed">
          <Mic className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
          <p className="italic text-zinc-800">
            "{transcript}"
          </p>
        </div>
      )}

      {/* Assistant Speaking Stream */}
      {assistantState === 'speaking' && lastAssistantSpeech && (
        <div className="text-zinc-700 text-sm sm:text-base font-normal leading-relaxed line-clamp-3">
          <span className="text-blue-600 font-medium mr-1.5">NIVA:</span>
          {lastAssistantSpeech}
        </div>
      )}

      {/* Thinking state */}
      {assistantState === 'thinking' && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          <span>Understanding intent & evaluating tools…</span>
        </div>
      )}
    </div>
  );
};
