import React, { useRef, useEffect } from 'react';
import { AssistantState } from '../../types/assistant';

interface VoiceOrbProps {
  state: AssistantState;
  audioLevel?: number;
  onClick?: () => void;
  size?: number; // default ~200px
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  audioLevel = 0,
  onClick,
  size = 210
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // Base radius of the inner glass sphere
      const baseRadius = (size * 0.38) * dpr;
      let dynamicScale = 1.0;

      if (!prefersReducedMotion) {
        if (state === 'listening') {
          dynamicScale = 1.0 + audioLevel * 0.16;
          phase += 0.04 + audioLevel * 0.05;
        } else if (state === 'thinking') {
          dynamicScale = 1.0 + Math.sin(phase * 2) * 0.03;
          phase += 0.035;
        } else if (state === 'speaking') {
          dynamicScale = 1.0 + Math.sin(phase * 3.5) * (0.04 + audioLevel * 0.1);
          phase += 0.05;
        } else {
          // Calm idling float
          dynamicScale = 1.0 + Math.sin(phase) * 0.015;
          phase += 0.018;
        }
      }

      const r = baseRadius * dynamicScale;

      // 1. Soft ethereal golden-peach backglow (matching reference image)
      const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.55);
      glowGrad.addColorStop(0, 'rgba(254, 215, 170, 0.45)'); // warm peach/gold
      glowGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.35)'); // sky blue
      glowGrad.addColorStop(0.8, 'rgba(233, 213, 255, 0.2)'); // soft violet
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // 2. Flowing golden energy ribbons/wisps around the orb (matching reference image)
      if (!prefersReducedMotion) {
        ctx.save();
        ctx.lineWidth = 2.5 * dpr;

        // Ribbon 1 (swirling from bottom-left to top-right)
        const ribbon1 = ctx.createLinearGradient(cx - r * 1.4, cy + r * 0.8, cx + r * 1.3, cy - r * 0.7);
        ribbon1.addColorStop(0, 'rgba(251, 191, 36, 0)');
        ribbon1.addColorStop(0.3, 'rgba(251, 191, 36, 0.45)');
        ribbon1.addColorStop(0.6, 'rgba(253, 224, 71, 0.7)');
        ribbon1.addColorStop(1, 'rgba(251, 191, 36, 0)');

        ctx.strokeStyle = ribbon1;
        ctx.beginPath();
        const p1 = phase * 0.8;
        ctx.moveTo(cx - r * 1.3, cy + r * 0.5 + Math.sin(p1) * 6);
        ctx.bezierCurveTo(
          cx - r * 0.8, cy + r * 1.1 + Math.cos(p1) * 8,
          cx + r * 0.9, cy + r * 0.2 - Math.sin(p1) * 6,
          cx + r * 1.25, cy - r * 0.6 - Math.cos(p1) * 8
        );
        ctx.stroke();

        // Ribbon 2 (delicate wisp curling top-left to right)
        const ribbon2 = ctx.createLinearGradient(cx - r * 1.1, cy - r * 0.4, cx + r * 1.2, cy + r * 0.6);
        ribbon2.addColorStop(0, 'rgba(254, 215, 170, 0)');
        ribbon2.addColorStop(0.5, 'rgba(253, 186, 116, 0.5)');
        ribbon2.addColorStop(1, 'rgba(254, 215, 170, 0)');

        ctx.strokeStyle = ribbon2;
        ctx.beginPath();
        const p2 = phase * 0.6 + 1.5;
        ctx.moveTo(cx - r * 1.1, cy - r * 0.2 + Math.cos(p2) * 5);
        ctx.bezierCurveTo(
          cx - r * 0.4, cy - r * 0.9 + Math.sin(p2) * 6,
          cx + r * 0.8, cy - r * 0.7 - Math.cos(p2) * 6,
          cx + r * 1.15, cy + r * 0.4 + Math.sin(p2) * 5
        );
        ctx.stroke();

        ctx.restore();
      }

      // 3. Pearlescent Iridescent Sphere Base
      // Light source offset for 3D bubble depth
      const lightX = cx - r * 0.28 + Math.sin(phase * 0.5) * (r * 0.05);
      const lightY = cy - r * 0.28 + Math.cos(phase * 0.5) * (r * 0.05);

      const sphereGrad = ctx.createRadialGradient(lightX, lightY, r * 0.1, cx, cy, r);
      // Beautiful chromatic palette matching reference image:
      sphereGrad.addColorStop(0, '#FFFFFF'); // Bright specular reflection
      sphereGrad.addColorStop(0.2, '#E0F7FA'); // Soft cyan/mint
      sphereGrad.addColorStop(0.42, '#80DEEA'); // Aquamarine
      sphereGrad.addColorStop(0.62, '#B39DDB'); // Soft lavender/periwinkle
      sphereGrad.addColorStop(0.78, '#F48FB1'); // Iridescent pink
      sphereGrad.addColorStop(0.92, '#81D4FA'); // Sky reflection
      sphereGrad.addColorStop(1, '#CE93D8'); // Delicate purple rim

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // 4. Secondary internal caustic swirl (creates translucent glass marble effect)
      ctx.save();
      const swirlGrad = ctx.createRadialGradient(cx + r * 0.25, cy + r * 0.25, r * 0.05, cx, cy, r * 0.85);
      swirlGrad.addColorStop(0, 'rgba(255, 236, 179, 0.65)'); // warm golden amber core
      swirlGrad.addColorStop(0.4, 'rgba(128, 222, 234, 0.45)'); // cyan
      swirlGrad.addColorStop(0.75, 'rgba(179, 157, 219, 0.35)'); // soft purple
      swirlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = swirlGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5. Glossy Rim and Glazed Reflection
      ctx.save();
      ctx.lineWidth = 1.2 * dpr;
      const rimGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      rimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
      rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.75)');
      ctx.strokeStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Specular highlight crescent (top-left glossy reflection)
      const specGrad = ctx.createRadialGradient(
        cx - r * 0.32,
        cy - r * 0.35,
        1,
        cx - r * 0.32,
        cy - r * 0.35,
        r * 0.38
      );
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      specGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.55)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.arc(cx - r * 0.32, cy - r * 0.35, r * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Subtle bottom-right counter-reflection (light bounce)
      const bounceGrad = ctx.createRadialGradient(
        cx + r * 0.28,
        cy + r * 0.32,
        1,
        cx + r * 0.28,
        cy + r * 0.32,
        r * 0.28
      );
      bounceGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      bounceGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = bounceGrad;
      ctx.beginPath();
      ctx.arc(cx + r * 0.28, cy + r * 0.32, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, audioLevel, size]);

  return (
    <div className="flex flex-col items-center justify-center select-none relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Voice Assistant Orb: currently ${state}. Click to toggle listening.`}
        className="group relative cursor-pointer outline-none rounded-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-sky-400"
        style={{ width: size, height: size }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size }}
          className="block"
        />
      </button>
    </div>
  );
};
