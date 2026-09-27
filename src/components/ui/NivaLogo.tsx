import React from 'react';

interface NivaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  className?: string;
  subtitle?: string;
}

export const NivaLogo: React.FC<NivaLogoProps> = ({
  size = 'md',
  showText = true,
  animated = true,
  className = '',
  subtitle
}) => {
  const iconDimensions = {
    xs: { box: 22, svg: 14, text: 'text-xs', sub: 'text-[9px]' },
    sm: { box: 28, svg: 18, text: 'text-sm', sub: 'text-[10px]' },
    md: { box: 36, svg: 22, text: 'text-base', sub: 'text-[11px]' },
    lg: { box: 44, svg: 28, text: 'text-xl', sub: 'text-xs' },
    xl: { box: 56, svg: 36, text: 'text-2xl', sub: 'text-sm' }
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SaaS Vector Logo Mark */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-zinc-950 text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] border border-zinc-800/80 overflow-hidden group transition-all duration-300"
        style={{
          width: iconDimensions.box,
          height: iconDimensions.box
        }}
      >
        {/* Subtle architectural grid lines in background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="niva-logo-grid" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M 6 0 L 0 0 0 6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#niva-logo-grid)" />
          </svg>
        </div>

        {/* Dynamic Sound Aperture & Resonant Prism SVG */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: iconDimensions.svg, height: iconDimensions.svg }}
          className={`relative z-10 transition-transform duration-300 ${
            animated ? 'group-hover:scale-105' : ''
          }`}
        >
          {/* Subtle Outer Concentric Orbit */}
          <circle
            cx="16"
            cy="16"
            r="13.5"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="0.85"
            strokeDasharray="2 3"
          />

          {/* Central Harmonic Soundwave Ribbon / Prism Vertex */}
          <path
            d="M8 20L12 12L16 21L20 11L24 19"
            stroke="url(#niva-grad-primary)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Precision Architectural Hairline Echoes */}
          <path
            d="M10 22L13 16L16 23L19 15L22 21"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Focus Aperture Points */}
          <circle cx="16" cy="7" r="1.3" fill="#FFFFFF" />
          <circle cx="16" cy="25" r="1.3" fill="rgba(255, 255, 255, 0.6)" />
          <circle cx="7" cy="16" r="1" fill="rgba(255, 255, 255, 0.4)" />
          <circle cx="25" cy="16" r="1" fill="rgba(255, 255, 255, 0.4)" />

          <defs>
            <linearGradient id="niva-grad-primary" x1="8" y1="11" x2="24" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.5" stopColor="#E2E8F0" />
              <stop offset="1" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Ambient Hairline Sheen */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-zinc-950 font-sans ${iconDimensions.text}`}>
              NIVA
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          </div>
          {subtitle ? (
            <span className={`text-zinc-500 font-normal tracking-normal mt-0.5 ${iconDimensions.sub}`}>
              {subtitle}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};
