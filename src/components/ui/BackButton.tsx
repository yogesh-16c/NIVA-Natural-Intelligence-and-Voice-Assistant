import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from '../../app/router';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
  variant?: 'subtle' | 'outline' | 'pill';
  showLabel?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = 'Previous menu',
  className = '',
  variant = 'subtle',
  showLabel = true,
}) => {
  const { navigate, pathname } = useRouter();

  const handleBack = () => {
    if (to) {
      navigate(to);
      return;
    }

    // Smart fallback: if in a subpage of app, return to /app if history isn't deep enough
    if (window.history.length > 2) {
      window.history.back();
    } else {
      if (pathname.startsWith('/app/')) {
        navigate('/app');
      } else {
        navigate('/');
      }
    }
  };

  const variantStyles = {
    subtle:
      'bg-white/80 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-zinc-200/80 hover:border-zinc-300 shadow-xs',
    outline:
      'bg-transparent hover:bg-zinc-100/80 text-zinc-600 hover:text-zinc-900 border border-zinc-200',
    pill:
      'bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs'
  }[variant];

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer group active:scale-98 ${variantStyles} ${className}`}
      title={label}
      aria-label={label}
    >
      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200 text-current" />
      {showLabel && <span>{label}</span>}
    </button>
  );
};
