import React from 'react';

/**
 * Premium clean UI: Crosshairs, line sweeps and scanlines removed
 * to eliminate technical blueprint distractions.
 */
export const CornerCrosshairs: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = () => null;

export const LineBeamSweep: React.FC<{
  position?: 'top' | 'bottom';
  className?: string;
}> = () => null;

export const ArchitecturalLinearScan: React.FC<{ className?: string }> = () => null;

/**
 * Refined sound wave visualizer in charcoal
 */
export const AnimatedSoundWaveLines: React.FC<{
  bars?: number;
  height?: number;
  active?: boolean;
  className?: string;
}> = ({ bars = 16, height = 20, active = true, className = '' }) => {
  return (
    <div
      className={`flex items-center gap-[3px] select-none ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const delay = (i % 5) * 0.15;
        const baseHeight = 25 + Math.sin(i * 0.9) * 45;
        const dur = 1.0 + (i % 3) * 0.3;

        return (
          <span
            key={i}
            className={`w-[1.5px] rounded-full bg-stone-800 transition-all duration-300 ${
              active ? 'opacity-70' : 'opacity-20'
            }`}
            style={{
              height: active ? `${Math.max(20, baseHeight)}%` : '20%',
              animation: active
                ? `pulseHairline ${dur}s ease-in-out ${delay}s infinite alternate`
                : 'none'
            }}
          />
        );
      })}
    </div>
  );
};
