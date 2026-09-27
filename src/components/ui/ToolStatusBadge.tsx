import React from 'react';
import { ToolExecution, ToolType } from '../../types/assistant';
import { Globe, BookOpen, Calculator, ExternalLink, Monitor, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ToolStatusBadgeProps {
  execution: ToolExecution;
  onViewDetails?: () => void;
  compact?: boolean;
}

export const ToolStatusBadge: React.FC<ToolStatusBadgeProps> = ({
  execution,
  onViewDetails,
  compact = false
}) => {
  const getToolIcon = (type: ToolType) => {
    switch (type) {
      case 'web_search':
        return <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'research_sources':
        return <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
      case 'calculator':
        return <Calculator className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'browser_open':
        return <ExternalLink className="w-3.5 h-3.5 text-zinc-700 shrink-0" />;
      case 'screen_analysis':
        return <Monitor className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />;
    }
  };

  const getStatusText = () => {
    switch (execution.status) {
      case 'requires_confirmation':
        return 'Needs confirmation';
      case 'running':
        return execution.type === 'web_search' || execution.type === 'research_sources' ? 'Searching' : 'Thinking';
      case 'success':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Idle';
    }
  };

  const getStatusIcon = () => {
    if (execution.status === 'running') {
      return <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />;
    }
    if (execution.status === 'success') {
      return <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    }
    if (execution.status === 'error') {
      return <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    }
    if (execution.status === 'requires_confirmation') {
      return <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />;
    }
    return null;
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs text-stone-700 shadow-2xs">
        {getToolIcon(execution.type)}
        <span className="font-medium text-stone-900">{execution.label}</span>
        {getStatusIcon()}
        <span className="text-[11px] text-stone-500">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className="w-full my-2.5 p-3.5 bg-stone-50/70 border border-stone-200/90 rounded-xl text-xs text-stone-700 transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center shadow-2xs">
            {getToolIcon(execution.type)}
          </div>
          <div className="truncate">
            <span className="font-semibold text-stone-900">{execution.label}</span>
            {execution.input && (
              <span className="text-stone-500 ml-2 truncate font-mono text-[11px]">
                {execution.input.query || execution.input.expression || execution.input.url || ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {getStatusIcon()}
          <span className="text-[11px] font-medium text-stone-600">
            {getStatusText()}
          </span>
          {onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className="text-indigo-600 hover:text-indigo-800 font-medium text-[11px] cursor-pointer ml-1"
            >
              Details
            </button>
          )}
        </div>
      </div>

      {/* Output preview if completed */}
      {execution.status === 'success' && execution.output && (
        <div className="mt-2 pt-2 border-t border-zinc-200/60 text-zinc-600">
          {execution.output.formattedText && (
            <p className="font-mono text-[11px] text-zinc-800">{execution.output.formattedText}</p>
          )}
          {execution.output.summary && (
            <p className="line-clamp-2 text-zinc-600">{execution.output.summary}</p>
          )}
          {execution.output.openedUrl && (
            <p className="text-zinc-600">Navigated to <span className="font-mono text-zinc-800">{execution.output.openedUrl}</span></p>
          )}
        </div>
      )}

      {/* Error preview */}
      {execution.status === 'error' && execution.error && (
        <div className="mt-2 pt-2 border-t border-rose-200/60 text-rose-600 text-[11px]">
          {execution.error}
        </div>
      )}
    </div>
  );
};
