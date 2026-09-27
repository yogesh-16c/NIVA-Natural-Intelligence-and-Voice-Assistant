import React, { useState, useEffect } from 'react';
import { actionSafetyService, ActionLogItem } from '../../services/security/actionSafetyService';
import { ActionSafetyConfig } from '../../types/assistant';
import { BackButton } from '../../components/ui/BackButton';
import {
  Shield,
  Lock,
  Globe,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  AlertTriangle,
  Code2
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const [config, setConfig] = useState<ActionSafetyConfig>(actionSafetyService.getConfig());
  const [logs, setLogs] = useState<ActionLogItem[]>(actionSafetyService.getRecentLogs());

  // Input Sanitization Playground
  const [testInput, setTestInput] = useState('sk-proj-928340192304928340912 and test bearer eyJhbGciOiJIUzI1NiIs...');
  const [sanitizedOutput, setSanitizedOutput] = useState('');

  // Domain form
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = actionSafetyService.subscribe((updated) => {
      setConfig(updated);
      setLogs(actionSafetyService.getRecentLogs());
    });
    return unsub;
  }, []);

  useEffect(() => {
    setSanitizedOutput(actionSafetyService.sanitizePrompt(testInput));
  }, [testInput, config.sanitizeInputs]);

  const handleToggle = (key: keyof ActionSafetyConfig) => {
    if (typeof config[key] === 'boolean') {
      actionSafetyService.updateConfig({ [key]: !config[key] });
    }
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    setDomainError(null);
    if (!newDomain.trim()) return;
    const ok = actionSafetyService.addAllowedDomain(newDomain.trim());
    if (ok) {
      setNewDomain('');
    } else {
      setDomainError('Domain is already allowed or invalid format.');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    actionSafetyService.removeAllowedDomain(domain);
  };

  const handleResetDomains = () => {
    actionSafetyService.resetAllowedDomains();
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BackButton label="Workspace" to="/app" />
            <span className="text-stone-300">/</span>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Safety Guardrails
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Action Safety
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500">
            Deterministic domain allowlisting, sensitive parameter sanitization, and user confirmation policies.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>Active Guardrails</span>
        </div>
      </div>

      {/* Safety Policy Toggles */}
      <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-stone-700" />
          <span>Execution Policies</span>
        </h2>

        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-stone-50 border border-stone-200/70">
            <div>
              <p className="text-xs font-semibold text-stone-900">
                Confirm Browser Navigation
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Always prompt for explicit user confirmation before opening external URLs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('confirmBrowserNavigation')}
              className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                config.confirmBrowserNavigation ? 'bg-indigo-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  config.confirmBrowserNavigation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-stone-50 border border-stone-200/70">
            <div>
              <p className="text-xs font-semibold text-stone-900">
                Require Confirmation for External URLs
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Enforce user review even for links outside verified allowlist.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('requireConfirmationForExternalUrls')}
              className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                config.requireConfirmationForExternalUrls ? 'bg-indigo-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  config.requireConfirmationForExternalUrls ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-stone-50 border border-stone-200/70">
            <div>
              <p className="text-xs font-semibold text-stone-900">
                Sanitize Sensitive Parameters
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Automatically redact recognized API keys and tokens before dispatching actions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('sanitizeInputs')}
              className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                config.sanitizeInputs ? 'bg-indigo-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  config.sanitizeInputs ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Allowed Domains Section */}
      <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-stone-700" />
            <h2 className="text-sm font-bold text-stone-900">
              Allowed Domains ({config.allowedDomains.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={handleResetDomains}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
        </div>

        <form onSubmit={handleAddDomain} className="flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="e.g. docs.github.com"
            className="flex-1 px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-stone-900"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Domain</span>
          </button>
        </form>

        {domainError && (
          <p className="text-xs text-rose-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{domainError}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {config.allowedDomains.map((dom) => (
            <span
              key={dom}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-xs font-medium text-stone-800"
            >
              <span>{dom}</span>
              <button
                type="button"
                onClick={() => handleRemoveDomain(dom)}
                className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                title={`Remove ${dom}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Sensitive Parameter Scrubbing Test */}
      <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-stone-700" />
          <span>Credential Redaction Playground</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Test Input String
          </label>
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-stone-900 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Sanitized Pre-flight Result
          </label>
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-mono break-all">
            {sanitizedOutput || 'No output'}
          </div>
        </div>
      </section>

      {/* Action Logs */}
      <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">
          Recent Action Review ({logs.length})
        </h2>

        {logs.length === 0 ? (
          <p className="text-xs text-stone-500 py-3 text-center">No action logs recorded yet.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {logs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-stone-900 mr-2">{log.actionType}</span>
                  <span className="text-stone-500 font-mono text-[11px]">{log.target}</span>
                  {log.reason && (
                    <p className="text-[11px] text-stone-400 mt-0.5">{log.reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      log.decision === 'allowed' || log.decision === 'auto_allowed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {log.decision}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
