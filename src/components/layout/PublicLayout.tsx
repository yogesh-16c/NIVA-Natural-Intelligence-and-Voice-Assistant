import React from 'react';
import { Link, useRouter } from '../../app/router';
import { useAssistant } from '../../context/AssistantContext';
import { NivaLogo } from '../ui/NivaLogo';
import { BackButton } from '../ui/BackButton';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { user } = useAssistant();
  const { pathname } = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#EBF5FB] via-[#F4F9F8] via-[#FAF0F5] to-[#F1EFF9] flex flex-col antialiased text-stone-900 selection:bg-sky-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-stone-200/60 bg-white/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between sticky top-0 z-40 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {/* Zone 1: Logo & Brand */}
        <div className="flex items-center gap-3">
          {pathname !== '/' && (
            <BackButton label="Back" to="/" variant="subtle" />
          )}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="font-bold text-xl sm:text-2xl tracking-tight text-stone-900">
              NIVA
            </span>
            <span className="h-4 w-[1.5px] bg-stone-300" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-normal text-stone-500 tracking-normal">
              Voice Assistant
            </span>
          </Link>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-stone-600">
          <Link to="/app" className="hover:text-stone-900 transition-colors">
            Workspace
          </Link>
          <Link to="/app/chat" className="hover:text-stone-900 transition-colors">
            Chat
          </Link>
          <Link to="/app/history" className="hover:text-stone-900 transition-colors">
            History
          </Link>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/app"
              className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all whitespace-nowrap shadow-xs cursor-pointer"
            >
              Open Workspace
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all whitespace-nowrap shadow-xs cursor-pointer"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-10 px-6 md:px-12 text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <NivaLogo size="xs" showText={false} />
            <span className="font-semibold text-stone-900">NIVA</span>
            <span>·</span>
            <span>Voice-First AI SaaS Workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Conversations · Action Safety · History</span>
            <span>·</span>
            <span>English / हिन्दी / मराठी</span>
          </div>

          <div>
            © 2026 NIVA Workspace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
