import React from 'react';
import { Keyboard, Megaphone, Search, Sparkles } from 'lucide-react';
import { RGB_PRESETS } from '../constants/nexplay';
import type { ViewName } from '../types/nexplay';

interface FooterProps {
  activePreset: string;
  cosmosName: string;
  onSelectRgbPreset: (presetName: string) => void;
  onCycleCosmos: () => void;
  onOpenSearch: () => void;
  onOpenShortcuts: () => void;
  onToggleAnnouncement: () => void;
  onNavigate: (view: ViewName) => void;
}

export const Footer: React.FC<FooterProps> = ({
  activePreset,
  cosmosName,
  onSelectRgbPreset,
  onCycleCosmos,
  onOpenSearch,
  onOpenShortcuts,
  onToggleAnnouncement,
  onNavigate,
}) => {
  const presetEntries = Object.entries(RGB_PRESETS);

  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-[#04070f]/80 backdrop-blur-md mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-white">NEXPLAY</span>
              <span className="text-xs text-slate-500">· HTML5 O'yin Ekotizimi</span>
            </div>
            <p className="text-xs text-slate-400">
              Brauzer ichidagi xavfsiz HTML5/ZIP sandbox platformasi · Koinot foni: {cosmosName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              Katalog
            </button>
            <button
              type="button"
              onClick={() => onNavigate('tournaments')}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              Turnirlar
            </button>
            <button
              type="button"
              onClick={() => onNavigate('rankings')}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              Reyting
            </button>
            <button
              type="button"
              id="footer-btn-search"
              onClick={onOpenSearch}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-cyan-300" />
              <span>Qidiruv</span>
            </button>
            <button
              type="button"
              id="footer-btn-shortcuts"
              onClick={onOpenShortcuts}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-colors cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5 text-blue-300" />
              <span>Yorliqlar</span>
            </button>
            <button
              type="button"
              id="footer-btn-announcement"
              onClick={onToggleAnnouncement}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-colors cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5 text-cyan-300" />
              <span>E'lon</span>
            </button>
            <button
              type="button"
              onClick={onCycleCosmos}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Keyingi koinot rasmi</span>
            </button>
          </div>
        </div>

        <div className="pt-5 border-t border-white/[0.06] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 mr-1">RGB muhiti:</span>
            {presetEntries.map(([name, cfg]) => {
              const isSelected = activePreset === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelectRgbPreset(name)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.1] text-white border-white/[0.24]'
                      : 'bg-white/[0.02] text-slate-400 hover:text-white border-white/[0.06] hover:border-white/[0.14]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: `rgb(${cfg.r}, ${cfg.g}, ${cfg.b})` }}
                  />
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} NEXPLAY Platforma
          </div>
        </div>
      </div>
    </footer>
  );
};
