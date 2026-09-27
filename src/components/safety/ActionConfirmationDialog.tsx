import React from 'react';
import { Shield, ExternalLink, X, AlertTriangle } from 'lucide-react';

interface ActionConfirmationDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  target?: string;
  onAllow: () => void;
  onCancel: () => void;
}

export const ActionConfirmationDialog: React.FC<ActionConfirmationDialogProps> = ({
  isOpen,
  title = 'Action Confirmation',
  message,
  target,
  onAllow,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden p-6 transition-all select-none">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="safety-modal-title" className="text-sm font-semibold text-stone-900">
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200/70">
          <p className="text-sm font-medium text-stone-900 leading-relaxed">
            {message}
          </p>
          {target && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500 font-mono break-all">
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
              <span>{target}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAllow}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <span>Allow</span>
          </button>
        </div>
      </div>
    </div>
  );
};
