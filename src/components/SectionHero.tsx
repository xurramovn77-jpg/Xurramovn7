import React from 'react';
import { SECTION_HERO_CONFIG } from '../constants/nexplay';
import type { SectionHeroMeta, ViewName } from '../types/nexplay';

interface SectionHeroProps {
  view: ViewName;
  override?: Partial<SectionHeroMeta>;
  publishedCount: number;
  usersCount: number;
  onNavigate: (view: ViewName) => void;
}

export const SectionHero: React.FC<SectionHeroProps> = ({
  view,
  override,
  publishedCount,
  usersCount,
  onNavigate,
}) => {
  const base = SECTION_HERO_CONFIG[view] || SECTION_HERO_CONFIG.home;
  const meta: SectionHeroMeta = { ...base, ...override };

  return (
    <section className="relative overflow-hidden rounded-2xl nx-surface p-6 sm:p-8 mb-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 w-64 h-64 rounded-full blur-3xl opacity-35"
        style={{ background: meta.accent || 'rgba(59, 130, 246, 0.24)' }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 220 220"
        className="pointer-events-none hidden md:block absolute right-6 top-1/2 -translate-y-1/2 w-40 h-40 opacity-25"
        fill="none"
      >
        <g className="nx-orbit-spin-slow">
          <circle cx="110" cy="110" r="88" stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
          <circle
            cx="110"
            cy="110"
            r="58"
            stroke="rgba(59,130,246,0.58)"
            strokeWidth="1.1"
            strokeDasharray="5 6"
          />
        </g>
        <g className="nx-orbit-spin-reverse">
          <polygon
            points="110,44 166,77 166,143 110,176 54,143 54,77"
            stroke="rgba(6,182,212,0.5)"
            strokeWidth="1"
          />
        </g>
      </svg>

      <div className="relative z-10 max-w-2xl space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold tracking-wide text-cyan-300">{meta.badge}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 tabular-nums">{publishedCount} o'yin</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 tabular-nums">{usersCount} foydalanuvchi</span>
        </div>

        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white leading-tight">
          {meta.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{meta.desc}</p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => onNavigate(meta.primaryTarget)}
            className="nx-btn-primary nx-btn-gaming px-4 py-2 rounded-xl text-xs cursor-pointer"
          >
            {meta.primaryLabel}
          </button>
          <button
            type="button"
            onClick={() => onNavigate(meta.secondaryTarget)}
            className="nx-btn-secondary px-4 py-2 rounded-xl text-xs cursor-pointer"
          >
            {meta.secondaryLabel}
          </button>
        </div>
      </div>
    </section>
  );
};
