import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Compass,
  Gamepad2,
  Keyboard,
  Megaphone,
  Play,
  Search,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import type { NexplayGame, NexplayState, NexplayUser, ViewName } from '../types/nexplay';
import { getPublishedGames, isOwnerUser } from '../utils/nexplayLogic';

interface SearchModalProps {
  open: boolean;
  state: NexplayState;
  currentUser: NexplayUser | null;
  onClose: () => void;
  onNavigate: (view: ViewName) => void;
  onSelectCategory: (cat: string) => void;
  onPlayGame: (gameId: string) => void;
  onDetailsGame: (gameId: string) => void;
  onToggleAnnouncement: () => void;
  onOpenShortcuts: () => void;
  onCycleCosmos: () => void;
}

interface SearchEntry {
  id: string;
  group: "O'yinlar" | 'Kategoriyalar' | "Bo'limlar" | 'Tezkor amallar';
  title: string;
  subtitle: string;
  shortcut?: string;
  onExecute: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  open,
  state,
  currentUser,
  onClose,
  onNavigate,
  onSelectCategory,
  onPlayGame,
  onDetailsGame,
  onToggleAnnouncement,
  onOpenShortcuts,
  onCycleCosmos,
}) => {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      inputRef.current?.blur();
      return;
    }
    setQuery('');
    setActiveIdx(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  const owner = isOwnerUser(currentUser);
  const publishedGames = useMemo(() => getPublishedGames(state.games), [state.games]);

  const entries = useMemo<SearchEntry[]>(() => {
    const q = query.trim().toLowerCase();

    const gameEntries: SearchEntry[] = publishedGames
      .filter(
        (g: NexplayGame) =>
          !q ||
          g.title.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          g.shortDescription.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((g) => ({
        id: `game-${g.id}`,
        group: "O'yinlar",
        title: g.title,
        subtitle: `${g.category} · ${Number(g.plays || 0)} start`,
        onExecute: () => {
          onClose();
          onPlayGame(g.id);
        },
      }));

    const catEntries: SearchEntry[] = state.categories
      .filter((c) => !q || c.toLowerCase().includes(q))
      .map((c) => ({
        id: `cat-${c}`,
        group: 'Kategoriyalar',
        title: `${c} o'yinlari`,
        subtitle: "Katalogni ushbu janr bo'yicha filtrlash",
        onExecute: () => {
          onClose();
          onSelectCategory(c);
        },
      }));

    const sectionItems: Array<{
      view: ViewName;
      title: string;
      subtitle: string;
      shortcut: string;
      enabled: boolean;
    }> = [
      { view: 'home', title: 'Bosh sahifa', subtitle: 'Asosiy vitrina va statistikalar', shortcut: 'H', enabled: true },
      { view: 'catalog', title: 'Katalog', subtitle: "Barcha o'yinlar, qidiruv va saralash", shortcut: 'C', enabled: state.modules.catalog },
      { view: 'categories', title: 'Kategoriyalar', subtitle: "Janrlar bo'yicha ko'rish", shortcut: 'K', enabled: state.modules.categories },
      { view: 'tournaments', title: 'Turnirlar', subtitle: 'Musobaqalar jadvali', shortcut: 'T', enabled: state.modules.tournaments },
      { view: 'rankings', title: 'Reyting', subtitle: "O'yinchilar peshqadamlari", shortcut: 'R', enabled: state.modules.rankings },
      { view: 'community', title: 'Hamjamiyat', subtitle: "Fikrlar va muhokamalar", shortcut: 'J', enabled: state.modules.community },
      { view: 'profile', title: 'Shaxsiy profil', subtitle: 'Hisob, sevimlilar va sessiya tarixi', shortcut: 'P', enabled: true },
      { view: 'admin', title: 'Boshqaruv paneli', subtitle: 'OWNER tizim boshqaruvi', shortcut: 'G', enabled: owner },
    ];

    const navEntries: SearchEntry[] = sectionItems
      .filter(
        (s) =>
          s.enabled &&
          (!q ||
            s.title.toLowerCase().includes(q) ||
            s.subtitle.toLowerCase().includes(q))
      )
      .map((s) => ({
        id: `nav-${s.view}`,
        group: "Bo'limlar",
        title: s.title,
        subtitle: s.subtitle,
        shortcut: s.shortcut,
        onExecute: () => {
          onClose();
          onNavigate(s.view);
        },
      }));

    const rawActionEntries: SearchEntry[] = [
      {
        id: 'act-announcement',
        group: 'Tezkor amallar',
        title: "E'lon panelini yoqish / yopish",
        subtitle: "Yuqori axborot tasmasini ko'rsatish yoki yashirish",
        shortcut: 'A',
        onExecute: () => {
          onClose();
          onToggleAnnouncement();
        },
      },
      {
        id: 'act-shortcuts',
        group: 'Tezkor amallar',
        title: 'Klaviatura yorliqlari',
        subtitle: "Barcha tezkor navigatsiya tugmalari ro'yxati",
        shortcut: '?',
        onExecute: () => {
          onClose();
          onOpenShortcuts();
        },
      },
      {
        id: 'act-cosmos',
        group: 'Tezkor amallar',
        title: 'Koinot fonini almashtirish',
        subtitle: "Atmosfera sahnasini keyingi koinot ko'rinishiga o'tkazish",
        onExecute: () => {
          onCycleCosmos();
        },
      },
    ];

    const actionEntries: SearchEntry[] = rawActionEntries.filter(
      (a) =>
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q)
    );

    return [...gameEntries, ...navEntries, ...catEntries, ...actionEntries];
  }, [
    query,
    publishedGames,
    state.categories,
    state.modules,
    owner,
    onClose,
    onPlayGame,
    onSelectCategory,
    onNavigate,
    onToggleAnnouncement,
    onOpenShortcuts,
    onCycleCosmos,
  ]);

  useEffect(() => {
    if (activeIdx >= entries.length) {
      setActiveIdx(0);
    }
  }, [entries.length, activeIdx]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (entries.length > 0) setActiveIdx((prev) => (prev + 1) % entries.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (entries.length > 0) {
        setActiveIdx((prev) => (prev - 1 + entries.length) % entries.length);
      }
    } else if (e.key === 'Enter' && entries[activeIdx]) {
      e.preventDefault();
      entries[activeIdx].onExecute();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="global-search-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="global-search-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[940] bg-[#03060E]/78 backdrop-blur-md flex items-start justify-center p-4 sm:pt-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={handleKeyDown}
            className="w-full max-w-2xl rounded-2xl nx-elevated overflow-hidden"
          >
            <h2 id="global-search-title" className="sr-only">
              Global qidiruv va tezkor o'tish
            </h2>

            {/* Search Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-[#070b15]">
              <Search className="w-4 h-4 text-cyan-300 shrink-0" />
              <input
                ref={inputRef}
                id="global-search-input"
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIdx(0);
                }}
                placeholder="O'yin, kategoriya, bo'lim yoki buyruq qidiring..."
                aria-label="Global qidiruv"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                id="global-search-close"
                aria-label="Qidiruvni yopish"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Viewport */}
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
              {entries.length === 0 ? (
                <div className="py-10 text-center space-y-1.5">
                  <p className="text-sm font-semibold text-white">Hech narsa topilmadi</p>
                  <p className="text-xs text-slate-400">
                    Boshqa so'z kiriting yoki ESC tugmasini bosing.
                  </p>
                </div>
              ) : (
                entries.map((item, idx) => {
                  const selected = idx === activeIdx;
                  const GroupIcon =
                    item.group === "O'yinlar"
                      ? Gamepad2
                      : item.group === 'Kategoriyalar'
                        ? Tag
                        : item.group === "Bo'limlar"
                          ? Compass
                          : item.id === 'act-announcement'
                            ? Megaphone
                            : item.id === 'act-shortcuts'
                              ? Keyboard
                              : Sparkles;
                  const matchedGame =
                    item.group === "O'yinlar"
                      ? publishedGames.find((g) => `game-${g.id}` === item.id)
                      : undefined;

                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        selected ? 'bg-white/[0.09]' : 'hover:bg-white/[0.05]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={item.onExecute}
                        className="flex-1 flex items-center gap-3 min-w-0 text-left cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 text-cyan-300">
                          <GroupIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {item.group} · {item.subtitle}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        {matchedGame && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onDetailsGame(matchedGame.id);
                              }}
                              className="text-[11px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] cursor-pointer"
                            >
                              Batafsil
                            </button>
                            <button
                              type="button"
                              onClick={item.onExecute}
                              className="nx-btn-primary px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Start</span>
                            </button>
                          </>
                        )}
                        {item.shortcut && <kbd className="nx-kbd">{item.shortcut}</kbd>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-2.5 border-t border-white/[0.07] bg-[#060913] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="nx-kbd">↑↓</kbd> Tanlash
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="nx-kbd">Enter</kbd> Ochish
                </span>
              </div>
              <span className="inline-flex items-center gap-1">
                <kbd className="nx-kbd">Esc</kbd> Yopish
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
