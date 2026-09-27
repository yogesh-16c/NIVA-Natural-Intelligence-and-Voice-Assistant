import React, { useEffect, useState } from 'react';
import { Shield, X, ExternalLink, Check } from 'lucide-react';
import { actionSafetyService } from '../../services/security/actionSafetyService';

interface ActionSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActionSafetyModal: React.FC<ActionSafetyModalProps> = ({ isOpen, onClose }) => {
  const [allowedDomains, setAllowedDomains] = useState<string[]>(() => actionSafetyService.getConfig().allowedDomains);

  useEffect(() => {
    if (isOpen) {
      setAllowedDomains(actionSafetyService.getConfig().allowedDomains);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const domain = 'github.com';
  const isAllowed = allowedDomains.some((item) => item.toLowerCase().includes('github.com'));

  const handleAllow = () => {
    if (!isAllowed) {
      actionSafetyService.addAllowedDomain(domain);
      setAllowedDomains(actionSafetyService.getConfig().allowedDomains);
    }
    actionSafetyService.logAction({
      actionType: 'browser_open',
      target: `https://${domain}`,
      decision: 'allowed',
      reason: 'User approved the site in the confirmation modal.'
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="niva-safety-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_20px_60px_rgba(17,24,39,0.12)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 id="niva-safety-title" className="text-sm font-semibold text-stone-900">NIVA wants to open GitHub.</h2>
              <p className="text-[11px] text-stone-500">Please confirm before opening the site.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-stone-700">
              <ExternalLink className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-medium">{domain}</span>
            </div>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${isAllowed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {isAllowed ? 'Allowlisted' : 'Needs permission'}
            </span>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAllow}
            className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Allow</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const SecurityModal = ActionSafetyModal;
