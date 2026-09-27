import React, { useState } from 'react';
import { useAssistant } from '../../context/AssistantContext';
import { useRouter } from '../../app/router';
import { AVAILABLE_VOICES, SUPPORTED_LANGUAGES } from '../../lib/constants';
import { BackButton } from '../../components/ui/BackButton';
import {
  Volume2,
  Globe,
  User,
  Shield,
  LogOut,
  Check,
  Mic,
  Sliders,
  ArrowRight
} from 'lucide-react';
import { ActionSafetyModal } from '../../components/safety/ActionSafetyModal';
import { actionSafetyService } from '../../services/security/actionSafetyService';

export const SettingsPage: React.FC = () => {
  const {
    user,
    selectedVoice,
    setSelectedVoice,
    autoSpeak,
    setAutoSpeak,
    bargeIn,
    setBargeIn,
    currentLanguage,
    setLanguage,
    updateUser,
    logout
  } = useAssistant();

  const { navigate } = useRouter();

  const [nameVal, setNameVal] = useState(user?.name || '');
  const [autoDetectLang, setAutoDetectLang] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const safetyConfig = actionSafetyService.getConfig();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameVal.trim()) return;
    updateUser(nameVal.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BackButton label="Workspace" to="/app" />
            <span className="text-stone-300">/</span>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Preferences
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Settings
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500">
            Configure real-time voice synthesis, conversational languages, action safety, and account credentials.
          </p>
        </div>
      </div>

      {/* 1. Voice Settings */}
      <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
          <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">
              Voice Synthesis
            </h2>
            <p className="text-[11px] text-stone-500">
              Select synthesis persona, audio playback, and live barge-in behavior.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {/* Selected Voice */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Synthesis Voice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_VOICES.map((voice) => (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                    selectedVoice === voice.id
                      ? 'border-indigo-600 bg-indigo-50/40 font-medium text-stone-900 shadow-2xs'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600 bg-white'
                  }`}
                >
                  <p className="font-semibold text-stone-900">{voice.name}</p>
                  <p className="text-[10px] text-stone-400 mt-1 capitalize font-mono">
                    {voice.gender} · {voice.lang}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Auto Speak Toggle */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-stone-100">
            <div>
              <span className="text-xs font-semibold text-stone-900 block">
                Automatic Speech Playback
              </span>
              <span className="text-[11px] text-stone-500 block">
                Read out NIVA responses using synthesized speech automatically.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                autoSpeak ? 'bg-indigo-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  autoSpeak ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Barge-in Sensitivity */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-stone-100">
            <div>
              <span className="text-xs font-semibold text-stone-900 block">
                Conversational Barge-in
              </span>
              <span className="text-[11px] text-stone-500 block">
                Instantly interrupt NIVA speaking when user speech is detected.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBargeIn(!bargeIn)}
              className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                bargeIn ? 'bg-indigo-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  bargeIn ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Language Settings */}
      <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
          <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">
              Language Intelligence
            </h2>
            <p className="text-[11px] text-stone-500">
              Supported languages: English, Hindi, and Marathi.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  currentLanguage === lang.code
                    ? 'border-indigo-600 bg-indigo-50/40 text-stone-900 shadow-2xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-600 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-stone-900">{lang.name}</span>
                  {currentLanguage === lang.code && (
                    <Check className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">{lang.nativeName}</p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 pt-3 border-t border-stone-100">
            <div>
              <span className="text-xs font-semibold text-stone-900 block">
                Automatic Conversation Language Mode
              </span>
              <span className="text-[11px] text-stone-500 block">
                Automatically align speech synthesis with the detected conversational language.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoDetectLang(!autoDetectLang)}
              className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                autoDetectLang ? 'bg-indigo-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  autoDetectLang ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Action Safety Section */}
      <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Action Safety & Allowlist
              </h2>
              <p className="text-[11px] text-stone-500">
                Deterministic browser navigation confirmation and allowed technical domains.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSafetyModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manage Policies</span>
          </button>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
          <div>
            <span className="text-xs font-semibold text-stone-900 block">
              Allowed Domains ({safetyConfig.allowedDomains.length})
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block truncate max-w-md">
              {safetyConfig.allowedDomains.slice(0, 5).join(', ')}...
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowSafetyModal(true)}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            View Allowlist →
          </button>
        </div>
      </section>

      {/* 4. Account Settings */}
      <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
          <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">
              Account
            </h2>
            <p className="text-[11px] text-stone-500">
              Your profile information and credentials.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              className="w-full max-w-md px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || 'user@example.com'}
              disabled
              className="w-full max-w-md px-3.5 py-2 text-xs bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Save Profile
            </button>
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Saved successfully</span>
              </span>
            )}
          </div>
        </form>
      </section>

      {/* 5. Session & Sign Out */}
      <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900">
              Session
            </h2>
            <p className="text-[11px] text-stone-500 mt-0.5">
              End your active session on this device.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
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
