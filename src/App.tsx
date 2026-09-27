/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { AssistantProvider } from './context/AssistantContext';
import { RouterProvider, useRouter } from './app/router';
import { AppLayout } from './components/layout/AppLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { Loader2 } from 'lucide-react';

// Primary routes
import { LandingPage } from './features/landing/LandingPage';
import { WorkspacePage } from './features/assistant/WorkspacePage';

// Lazy-loaded routes
const ChatPage = lazy(() => import('./features/chat/ChatPage').then(m => ({ default: m.ChatPage })));
const HistoryPage = lazy(() => import('./features/history/HistoryPage').then(m => ({ default: m.HistoryPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./features/auth/SignupPage').then(m => ({ default: m.SignupPage })));

const RouteLoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center p-12 text-xs text-stone-400">
    <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
    <span>Loading view…</span>
  </div>
);

const AppContent: React.FC = () => {
  const { pathname } = useRouter();

  // Public Layout pages
  if (pathname === '/') {
    return (
      <PublicLayout>
        <LandingPage />
      </PublicLayout>
    );
  }

  if (pathname === '/login') {
    return (
      <PublicLayout>
        <Suspense fallback={<RouteLoadingFallback />}>
          <LoginPage />
        </Suspense>
      </PublicLayout>
    );
  }

  if (pathname === '/signup') {
    return (
      <PublicLayout>
        <Suspense fallback={<RouteLoadingFallback />}>
          <SignupPage />
        </Suspense>
      </PublicLayout>
    );
  }

  // Authenticated App Shell routes
  if (pathname === '/app') {
    return (
      <AppLayout>
        <WorkspacePage />
      </AppLayout>
    );
  }

  if (pathname === '/app/chat') {
    return (
      <AppLayout>
        <Suspense fallback={<RouteLoadingFallback />}>
          <ChatPage />
        </Suspense>
      </AppLayout>
    );
  }

  if (pathname === '/app/history') {
    return (
      <AppLayout>
        <Suspense fallback={<RouteLoadingFallback />}>
          <HistoryPage />
        </Suspense>
      </AppLayout>
    );
  }

  if (pathname === '/app/settings') {
    return (
      <AppLayout>
        <Suspense fallback={<RouteLoadingFallback />}>
          <SettingsPage />
        </Suspense>
      </AppLayout>
    );
  }

  // Fallback route handling
  if (pathname.startsWith('/app')) {
    return (
      <AppLayout>
        <WorkspacePage />
      </AppLayout>
    );
  }

  return (
    <PublicLayout>
      <LandingPage />
    </PublicLayout>
  );
};

export default function App() {
  return (
    <AssistantProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AssistantProvider>
  );
}
