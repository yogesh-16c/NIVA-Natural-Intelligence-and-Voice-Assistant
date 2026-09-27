import React, { useState } from 'react';
import { useRouter, Link } from '../../app/router';
import { useAssistant } from '../../context/AssistantContext';
import {
  LayoutGrid,
  MessageSquare,
  Clock,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Volume2,
  VolumeX,
  ChevronRight
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../lib/constants';
import { ActionSafetyModal } from '../safety/ActionSafetyModal';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { pathname, navigate } = useRouter();
  const {
    user,
    logout,
    currentLanguage,
    setLanguage,
    autoSpeak,
    setAutoSpeak,
    confirmationModal
  } = useAssistant();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: LayoutGrid },
    { label: 'Conversations', path: '/app/chat', icon: MessageSquare },
    { label: 'History', path: '/app/history', icon: Clock },
    { label: 'Settings', path: '/app/settings', icon: Settings },
  ];

  const userName = user?.name ? user.name.split(' ')[0] : 'Alex';

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#EBF5FB] via-[#F4F9F8] via-[#FAF0F5] to-[#F1EFF9] p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center font-sans antialiased text-stone-900 selection:bg-sky-500 selection:text-white">
      {/* Floating Card Tablet Container (matches reference image) */}
      <div className="w-full max-w-[1380px] bg-white rounded-[28px] sm:rounded-[36px] shadow-[0_25px_80px_-15px_rgba(20,30,50,0.07),0_2px_12px_rgba(0,0,0,0.02)] border border-white/90 overflow-hidden flex flex-col min-h-[760px] relative">
        
        {/* Top Header Bar inside Floating Tablet */}
        <header className="h-18 px-5 sm:px-8 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white/95">
          {/* Brand: NIVA | Voice workspace */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 -ml-1 text-stone-600 hover:text-stone-900 rounded-lg"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/app" className="flex items-center gap-3 group">
              <span className="font-bold text-xl sm:text-2xl tracking-tight text-stone-900">
                NIVA
              </span>
              <span className="h-4 w-[1.5px] bg-stone-300" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-normal text-stone-500 tracking-normal">
                Voice Assistant
              </span>
            </Link>
          </div>

          {/* Right Zone: Welcome Alex + Profile Avatar + Notification Bell */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Language Switcher */}
            <div className="hidden sm:flex items-center p-0.5 bg-stone-100/90 rounded-lg border border-stone-200/70">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    currentLanguage === lang.code
                      ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                  title={`Switch language to ${lang.name}`}
                >
                  {lang.nativeName}
                </button>
              ))}
            </div>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                autoSpeak
                  ? 'bg-stone-100 text-stone-900 border-stone-200'
                  : 'text-stone-400 hover:text-stone-700 border-transparent hover:bg-stone-100'
              }`}
              title={autoSpeak ? 'Voice speech enabled' : 'Voice speech muted'}
              aria-label={autoSpeak ? 'Mute voice feedback' : 'Unmute voice feedback'}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4 text-stone-800" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
            </button>

            {/* Welcome User Text */}
            <span className="text-xs sm:text-sm font-medium text-stone-700 hidden sm:inline-block">
              Welcome, {userName}
            </span>

            {/* User Profile Avatar */}
            <div className="relative group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-2 ring-stone-100 shadow-2xs bg-stone-200 flex items-center justify-center cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                  alt={userName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to stylized monogram if image doesn't load
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-xs font-semibold text-stone-700">
                  {userName.charAt(0)}
                </span>
              </div>
            </div>

            {/* Notification Bell with red indicator dot */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 text-stone-500 hover:text-stone-800 transition-colors rounded-lg hover:bg-stone-50 cursor-pointer relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-stone-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200/90 p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="text-xs font-bold text-stone-900">Notifications</span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-semibold">1 New</span>
                  </div>
                  <div className="py-2.5 space-y-2">
                    <div className="text-xs text-stone-700">
                      <p className="font-medium text-stone-900">NIVA is ready</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">Your conversation and action preferences are available.</p>
                      <span className="text-[10px] text-stone-400 mt-1 block">Just now</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Inner Main Area: Left Sidebar + Content */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Left Vertical Navigation Sidebar (matches reference image) */}
          <aside className="hidden md:flex flex-col w-24 sm:w-28 border-r border-stone-100 bg-white shrink-0 py-6 px-2 justify-between items-center select-none">
            <nav className="flex flex-col items-center gap-3 w-full">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`w-full flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EBF5FB] text-[#2563EB] border border-[#BFDBFE]/60 font-semibold shadow-2xs'
                        : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50/80'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-[#2563EB]' : 'text-stone-400'}`} />
                    <span className={`text-[11px] tracking-tight leading-none ${isActive ? 'font-medium text-[#2563EB]' : 'text-stone-500'}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Sign Out */}
            <div className="w-full flex flex-col items-center pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full flex flex-col items-center justify-center py-2 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer text-[10px]"
                title="Sign out of workspace"
              >
                <LogOut className="w-4 h-4 mb-1" />
                <span>Exit</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
            {children}
          </main>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-stone-900/30 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full flex flex-col justify-between p-5 shadow-2xl animate-in slide-in-from-left duration-200">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-stone-900">NIVA</span>
                    <span className="text-xs text-stone-500">Voice Assistant</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="py-4 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#EBF5FB] text-[#2563EB] font-semibold'
                            : 'text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-stone-400'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Global Confirmation Modal */}
        {confirmationModal && (
          <ConfirmationModal
            isOpen={confirmationModal.isOpen}
            title={confirmationModal.title}
            message={confirmationModal.message}
            onConfirm={confirmationModal.onConfirm}
            onCancel={confirmationModal.onCancel}
          />
        )}

        {/* Action Safety Inspection Modal */}
        <ActionSafetyModal
          isOpen={showSafetyModal}
          onClose={() => setShowSafetyModal(false)}
        />
      </div>
    </div>
  );
};
