import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAssistant } from '../context/AssistantContext';

interface RouterContextType {
  pathname: string;
  navigate: (to: string) => void;
  goBack: (fallback?: string) => void;
  searchParams: URLSearchParams;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  const { user } = useAssistant();

  const navigate = (to: string) => {
    if (to === pathname) return;
    const url = new URL(to, window.location.origin);
    window.history.pushState({}, '', to);
    setPathname(url.pathname);
    setSearchParams(new URLSearchParams(url.search));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = (fallback?: string) => {
    if (window.history.length > 2) {
      window.history.back();
    } else if (fallback) {
      navigate(fallback);
    } else if (pathname.startsWith('/app/')) {
      navigate('/app');
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/');
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Protected route verification
  useEffect(() => {
    const isAppRoute = pathname.startsWith('/app');
    const isAuthRoute = pathname === '/login' || pathname === '/signup';

    if (isAppRoute && !user) {
      // Redirect to login with return url
      navigate(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (isAuthRoute && user) {
      // If already logged in, redirect to main workspace
      navigate('/app');
    }
  }, [pathname, user]);

  return (
    <RouterContext.Provider value={{ pathname, navigate, goBack, searchParams }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

export const Link: React.FC<{
  to: string;
  className?: string;
  children: ReactNode;
  title?: string;
  onClick?: () => void;
}> = ({ to, className, children, title, onClick }) => {
  const { navigate } = useRouter();

  return (
    <a
      href={to}
      title={title}
      className={className}
      onClick={(e) => {
        // Allow ctrl/cmd + click to open in new tab
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
};
