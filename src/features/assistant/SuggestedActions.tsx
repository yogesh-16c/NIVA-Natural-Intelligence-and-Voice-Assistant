import React from 'react';
import { SUGGESTED_ACTIONS } from '../../lib/constants';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SuggestedActionsProps {
  onSelectAction: (query: string) => void;
  disabled?: boolean;
}

export const SuggestedActions: React.FC<SuggestedActionsProps> = ({
  onSelectAction,
  disabled = false
}) => {
  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-zinc-400" />
          Suggested Actions
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SUGGESTED_ACTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAction(item.query)}
            className="group relative flex flex-col items-start justify-between p-2.5 text-left bg-white hover:bg-zinc-50 border border-zinc-200/90 hover:border-zinc-300 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-full flex items-center justify-between text-zinc-400 group-hover:text-zinc-700 transition-colors">
              <span className="text-[10px] uppercase font-mono text-zinc-400">
                {item.category}
              </span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            <span className="mt-1 text-xs font-medium text-zinc-800 group-hover:text-zinc-950 truncate w-full">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
