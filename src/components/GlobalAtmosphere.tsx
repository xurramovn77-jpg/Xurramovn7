import React, { useEffect, useRef } from 'react';
import { COSMOS_SCENES } from '../constants/nexplay';
import type { BgMediaConfig, ViewName } from '../types/nexplay';
import { isSafeMedia } from '../utils/nexplayLogic';

interface GlobalAtmosphereProps {
  activeView: ViewName;
  authBoostActive: boolean;
  cosmosSceneIdx: number;
  bgMedia: BgMediaConfig;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  alpha: number;
  vx: number;
  vy: number;
  phase: number;
  depth: 1 | 2 | 3;
  tint: 'blue' | 'cyan' | 'silver';
}

export const GlobalAtmosphere: React.FC<GlobalAtmosphereProps> = ({
  activeView,
  authBoostActive,
  cosmosSceneIdx,
  bgMedia,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const authBoostRef = useRef(authBoostActive);
  authBoostRef.current = authBoostActive;

  const parallaxCurRef = useRef({ x: 0, y: 0 });
  const parallaxSettingEnabled = bgMedia.parallaxEnabled !== false;
  const parallaxEnabledRef = useRef(parallaxSettingEnabled);
  parallaxEnabledRef.current = parallaxSettingEnabled;

  const particlesEnabled = bgMedia.particlesEnabled !== false;
  const particlesEnabledRef = useRef(particlesEnabled);
  particlesEnabledRef.current = particlesEnabled;

  const motionIntensity = Math.min(1.8, Math.max(0.25, Number(bgMedia.motionIntensity ?? 1)));
  const motionIntensityRef = useRef(motionIntensity);
  motionIntensityRef.current = motionIntensity;

  const contextValue = authBoostActive
    ? 'auth'
    : activeView === 'home'
      ? 'home'
      : activeView === 'catalog' || activeView === 'categories' || activeView === 'game-details'
        ? 'catalog'
        : activeView === 'player'
          ? 'player'
          : activeView === 'admin'
            ? 'admin'
            : activeView === 'profile'
              ? 'profile'
              : 'default';

  // Multi-depth floating particle canvas synced with App.tsx --px-x / --px-y relative percentage parallax
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const particles: Particle[] = [];
    let rafId = 0;
    let lastW = 0;
    let lastH = 0;

    const buildParticles = (w: number, h: number) => {
      particles.length = 0;
      const isMobile = w < 640;
      const count = isMobile ? 36 : Math.min(86, Math.floor((w * h) / 18500));
      const tints: Array<'blue' | 'cyan' | 'silver'> = ['blue', 'cyan', 'silver'];
      for (let i = 0; i < count; i++) {
        const depth = ((i % 3) + 1) as 1 | 2 | 3;
        const angle = Math.PI * 1.15 + (Math.random() - 0.5) * 0.9;
        const speed = (depth === 3 ? 0.16 : depth === 2 ? 0.11 : 0.065) * (0.7 + Math.random() * 0.6);
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: depth === 3 ? 1.5 + Math.random() * 1.1 : depth === 2 ? 1.0 + Math.random() * 0.7 : 0.6 + Math.random() * 0.55,
          alpha: depth === 3 ? 0.34 + Math.random() * 0.24 : depth === 2 ? 0.2 + Math.random() * 0.16 : 0.1 + Math.random() * 0.12,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          phase: Math.random() * Math.PI * 2,
          depth,
          tint: tints[i % tints.length],
        });
      }
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, window.innerWidth);
      const h = Math.max(320, window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0 || Math.abs(w - lastW) > 180 || Math.abs(h - lastH) > 180) {
        lastW = w;
        lastH = h;
        buildParticles(w, h);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    const renderFrame = (now = 0) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      if (!particlesEnabledRef.current) {
        if (!reduced) {
          rafId = window.requestAnimationFrame(renderFrame);
        }
        return;
      }

      const speedMul = motionIntensityRef.current;
      const boost = (authBoostRef.current ? 1.4 : 1) * speedMul;
      const alphaBoost = authBoostRef.current ? 1.25 : 1;
      const canParallax = parallaxEnabledRef.current && !reduced && !isTouch;

      if (canParallax) {
        const rawX = parseFloat(document.documentElement.style.getPropertyValue('--px-x') || '0') || 0;
        const rawY = parseFloat(document.documentElement.style.getPropertyValue('--px-y') || '0') || 0;
        // Convert -50..50% to normalized -1..1 and lerp for smooth particle depth
        const targetNx = rawX / 50;
        const targetNy = rawY / 50;
        parallaxCurRef.current.x += (targetNx - parallaxCurRef.current.x) * 0.085;
        parallaxCurRef.current.y += (targetNy - parallaxCurRef.current.y) * 0.085;
      } else {
        parallaxCurRef.current.x = 0;
        parallaxCurRef.current.y = 0;
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!reduced) {
          p.x += (p.vx + Math.sin(now * 0.00035 + p.phase) * 0.045) * boost;
          p.y += (p.vy + Math.cos(now * 0.0003 + p.phase) * 0.032) * boost;
          if (p.y < -12) p.y = h + 12;
          if (p.y > h + 12) p.y = -12;
          if (p.x < -12) p.x = w + 12;
          if (p.x > w + 12) p.x = -12;
        }

        // Depth-weighted parallax offset per particle plane
        const depthFactor = p.depth === 3 ? 16 : p.depth === 2 ? 9 : 4;
        const drawX = canParallax ? p.x - parallaxCurRef.current.x * depthFactor : p.x;
        const drawY = canParallax ? p.y - parallaxCurRef.current.y * depthFactor * 0.8 : p.y;

        const twinkle = reduced ? 1 : 0.72 + 0.28 * Math.sin(now * 0.0022 + p.phase);
        const a = Math.min(0.92, p.alpha * alphaBoost * twinkle);
        const rgb =
          p.tint === 'blue'
            ? '147, 197, 253'
            : p.tint === 'cyan'
              ? '103, 232, 249'
              : '226, 232, 240';

        // Subtle constellation links among nearby foreground/mid particles for kinetic gaming energy
        if (p.depth >= 2) {
          let links = 0;
          for (let j = i + 1; j < particles.length && links < 2; j++) {
            const q = particles[j];
            if (q.depth < 2) continue;
            const qFactor = q.depth === 3 ? 16 : 9;
            const qx = canParallax ? q.x - parallaxCurRef.current.x * qFactor : q.x;
            const qy = canParallax ? q.y - parallaxCurRef.current.y * qFactor * 0.8 : q.y;
            const dist = Math.hypot(drawX - qx, drawY - qy);
            if (dist < 120) {
              const lineAlpha = (1 - dist / 120) * 0.2 * alphaBoost;
              ctx.beginPath();
              ctx.moveTo(drawX, drawY);
              ctx.lineTo(qx, qy);
              ctx.strokeStyle = `rgba(103, 232, 249, ${lineAlpha.toFixed(3)})`;
              ctx.lineWidth = 0.85;
              ctx.stroke();
              links++;
            }
          }
        }

        if (p.depth === 3) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.r * 3.1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, ${(a * 0.18).toFixed(3)})`;
          ctx.fill();

          // Subtle kinetic velocity tail glint for foreground gaming motion
          ctx.beginPath();
          ctx.moveTo(drawX, drawY);
          ctx.lineTo(drawX - p.vx * 24 * boost, drawY - p.vy * 24 * boost);
          ctx.strokeStyle = `rgba(${rgb}, ${(a * 0.42).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.8, p.r * 0.7);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${a.toFixed(3)})`;
        ctx.fill();
      }

      if (!reduced) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderFrame(0);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const customOpacity = Math.min(0.85, Math.max(0.05, Number(bgMedia.opacity ?? 0.28)));
  const customBlur = Math.min(16, Math.max(0, Number(bgMedia.blur ?? 0)));
  const hasCustomMedia = bgMedia.type !== 'none' && isSafeMedia(bgMedia.url);
  const scene =
    COSMOS_SCENES[((cosmosSceneIdx % COSMOS_SCENES.length) + COSMOS_SCENES.length) % COSMOS_SCENES.length];

  return (
    <>
      <div
        id="nx-global-bg"
        className="nx-global-bg"
        data-bg-context={contextValue}
        aria-hidden="true"
      >
        {/* Layer 1: Deep Atmospheric Scene Backdrop (0.28x parallax) */}
        <div
          className="nx-cosmos-backdrop is-visible"
          style={{
            background: `radial-gradient(circle at 26% 24%, ${scene.accent}24 0%, transparent 48%), radial-gradient(circle at 78% 72%, ${scene.sec}1e 0%, transparent 52%), radial-gradient(circle at 52% 48%, ${scene.c1} 0%, ${scene.c0} 100%)`,
          }}
        />

        {/* Layer 2: Large Soft Dynamic Ambient Illumination (0.54x parallax) */}
        <div className="nx-orb-parallax-layer">
          <div
            className="nx-ambient-orb w-[34rem] h-[34rem] -top-28 -left-24"
            style={{ background: 'rgba(var(--rgb-r), var(--rgb-g), var(--rgb-b), 0.56)' }}
          />
          <div
            className="nx-ambient-orb w-[30rem] h-[30rem] top-1/3 right-[-7rem]"
            style={{
              background: 'rgba(var(--rgb-sec-r), var(--rgb-sec-g), var(--rgb-sec-b), 0.42)',
              animationDelay: '-6s',
            }}
          />
          <div
            className="nx-ambient-orb w-[28rem] h-[28rem] bottom-[-4rem] left-1/4"
            style={{
              background: 'rgba(var(--rgb-acc-r), var(--rgb-acc-g), var(--rgb-acc-b), 0.36)',
              animationDelay: '-12s',
            }}
          />
        </div>

        {/* Layer 2b: Moving Gaming Horizon Perspective Grid & Sweeping Energy Pulse */}
        {bgMedia.gridEnabled !== false && (
          <>
            <div className="nx-horizon-beam" />
            <div className="nx-gaming-horizon-wrap">
              <div
                className="nx-gaming-horizon-grid"
                style={{ animationDuration: `${(7.5 / motionIntensity).toFixed(2)}s` }}
              />
            </div>
          </>
        )}
        <div className="nx-aurora-beam" />
        {bgMedia.streaksEnabled !== false && (
          <>
            <div className="nx-scan-pulse" />
            <div className="nx-energy-streak nx-energy-streak-a" />
            <div className="nx-energy-streak nx-energy-streak-b" />
            <div className="nx-energy-streak nx-energy-streak-c" />
          </>
        )}

        {/* Layer 3: Distant Orbital Geometry & Animated Tactical Reticle (0.82x parallax) */}
        <svg
          className="nx-geo-depth-layer"
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <g className="nx-orbit-spin-slow">
            <circle cx="1180" cy="180" r="240" stroke="rgba(148,163,184,0.11)" strokeWidth="1" />
            <circle
              cx="1180"
              cy="180"
              r="165"
              stroke="rgba(59,130,246,0.22)"
              strokeWidth="1.2"
              strokeDasharray="6 8"
            />
            <path d="M1180 15 A165 165 0 0 1 1345 180" stroke="rgba(34,211,238,0.42)" strokeWidth="1.6" />
          </g>
          <g className="nx-orbit-spin-reverse">
            <circle
              cx="1180"
              cy="180"
              r="112"
              stroke="rgba(34,211,238,0.18)"
              strokeWidth="1"
              strokeDasharray="18 10"
            />
          </g>
          <g className="nx-hex-drift">
            <polygon
              points="180,680 260,634 340,680 340,772 260,818 180,772"
              stroke="rgba(6,182,212,0.18)"
              strokeWidth="1"
            />
            <polygon
              points="210,698 260,668 310,698 310,754 260,784 210,754"
              stroke="rgba(139,92,246,0.14)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          </g>
          <line x1="0" y1="540" x2="480" y2="300" stroke="rgba(148,163,184,0.07)" strokeWidth="1" />
          <line x1="960" y1="880" x2="1440" y2="620" stroke="rgba(139,92,246,0.08)" strokeWidth="1" />
        </svg>

        {/* Layer 4: Multi-Plane Floating Constellation Particle Canvas (depth-weighted parallax) */}
        <canvas id="nx-starfield-canvas" ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Layer 5a: Subtle Foreground Vector Light Accents (1.15x parallax) */}
        <svg
          className="nx-fg-accent-layer"
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <path d="M90 120H145M117.5 92.5V147.5" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
          <path d="M1300 760H1345M1322.5 737.5V782.5" stroke="rgba(103,232,249,0.20)" strokeWidth="1" />
          <circle cx="290" cy="210" r="2.5" fill="rgba(147,197,253,0.30)" />
          <circle cx="1110" cy="520" r="2" fill="rgba(103,232,249,0.26)" />
        </svg>

        {/* Layer 5b: Controlled Contrast Scrim & Reactive Top Edge Light */}
        <div className="nx-global-bg-scrim" />
      </div>

      {/* OWNER Custom Background Media Layer */}
      <div
        id="nx-custom-bg"
        className={`nx-custom-bg ${hasCustomMedia ? 'is-active' : ''}`}
        style={
          {
            '--nx-bg-opacity': String(customOpacity),
            '--nx-bg-blur': `${customBlur}px`,
          } as React.CSSProperties
        }
        aria-hidden="true"
      >
        {bgMedia.type === 'image' && isSafeMedia(bgMedia.url) && (
          <img
            src={bgMedia.url}
            alt=""
            referrerPolicy="no-referrer"
            className="nx-custom-bg-media"
          />
        )}
        {bgMedia.type === 'video' && isSafeMedia(bgMedia.url) && (
          <video
            src={bgMedia.url}
            autoPlay
            loop
            muted
            playsInline
            className="nx-custom-bg-media"
          />
        )}
        <div className="absolute inset-0 bg-[#050811]/50" />
      </div>
    </>
  );
};
