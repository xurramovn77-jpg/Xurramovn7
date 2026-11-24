import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Heart, Info, Play } from 'lucide-react';
import type { NexplayGame } from '../types/nexplay';
import { wrapCarouselIndex } from '../utils/nexplayLogic';
import { GameCover } from './GameCard';

interface FeaturedGamesCarouselProps {
  games: NexplayGame[];
  favoriteIds?: string[];
  onPlay: (gameId: string) => void;
  onDetails: (gameId: string) => void;
  onToggleFavorite?: (gameId: string) => void;
}

const ACCENT_ATMOSPHERE: Record<'blue' | 'cyan' | 'violet', { glow: string; line: string }> = {
  blue: { glow: 'rgba(59, 130, 246, 0.36)', line: 'rgba(96, 165, 250, 0.72)' },
  cyan: { glow: 'rgba(6, 182, 212, 0.34)', line: 'rgba(34, 211, 238, 0.72)' },
  violet: { glow: 'rgba(139, 92, 246, 0.36)', line: 'rgba(167, 139, 250, 0.72)' },
};

const AUTOPLAY_MS = 8500;

export const FeaturedGamesCarousel: React.FC<FeaturedGamesCarouselProps> = ({
  games,
  favoriteIds = [],
  onPlay,
  onDetails,
  onToggleFavorite,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);

  const safeIndex = games.length > 0 ? activeIndex % games.length : 0;
  const activeGame = games[safeIndex] || null;

  useEffect(() => {
    if (games.length > 0 && activeIndex >= games.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, games.length]);

  const goStep = useCallback(
    (delta: number) => {
      if (games.length <= 1) return;
      setDirection(delta >= 0 ? 1 : -1);
      setActiveIndex((prev) => wrapCarouselIndex(prev, delta, games.length));
    },
    [games.length]
  );

  const goToIndex = useCallback(
    (targetIdx: number) => {
      if (games.length <= 1 || targetIdx === safeIndex) return;
      setDirection(targetIdx > safeIndex ? 1 : -1);
      setActiveIndex(wrapCarouselIndex(targetIdx, 0, games.length));
    },
    [games.length, safeIndex]
  );

  useEffect(() => {
    if (games.length <= 1 || isPaused) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => wrapCarouselIndex(prev, 1, games.length));
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [games.length, isPaused]);

  const tone = useMemo(() => {
    const key = activeGame?.accentTone || 'blue';
    return ACCENT_ATMOSPHERE[key] || ACCENT_ATMOSPHERE.blue;
  }, [activeGame?.accentTone]);

  if (!activeGame) {
    return null;
  }

  const isFavorite = favoriteIds.includes(activeGame.id);
  const rawPkg = activeGame.packageMeta?.packageType?.toUpperCase() || 'HTML5';
  const pkgType = rawPkg === 'HTML' ? 'HTML5' : rawPkg;

  return (
    <div
      id="featured-games-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Tanlangan o'yinlar karuseli"
      tabIndex={0}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goStep(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goStep(1);
        }
      }}
      className="relative rounded-3xl nx-surface overflow-hidden group/carousel focus-visible:outline-2 focus-visible:outline-cyan-400/80"
    >
      {/* Dynamic Atmospheric Glow synced with Active Slide */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 w-[30rem] h-[24rem] rounded-full blur-3xl opacity-55 transition-colors duration-700"
        style={{ background: `radial-gradient(circle, ${tone.glow}, transparent 70%)` }}
      />

      {/* Cinematic Visual Stage */}
      <div className="relative min-h-[340px] sm:min-h-[390px] lg:min-h-[420px] flex flex-col justify-end overflow-hidden bg-[#04070f]">
        <AnimatePresence initial={false} mode="sync" custom={direction}>
          <motion.div
            key={activeGame.id}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 44 : -44, scale: 1.045 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction > 0 ? -36 : 36, scale: 1.015 }}
            transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <GameCover game={activeGame} className="w-full h-full object-cover" />
          </motion.div>
        </AnimatePresence>

        {/* Measured Contrast Scrims for >= 4.5:1 Text Readability & Atmospheric Blend */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050811]/95 via-[#050811]/72 to-[#050811]/20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/55 to-transparent"
        />

        {/* Top Counter Strip */}
        <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-5 sm:pt-7">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <span className="font-semibold tracking-wide text-cyan-300">Tanlangan vitrina</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="font-mono-tabular text-slate-300">
              {String(safeIndex + 1).padStart(2, '0')} / {String(games.length).padStart(2, '0')}
            </span>
          </div>

          {onToggleFavorite && (
            <button
              type="button"
              aria-label={isFavorite ? "Sevimlilardan o'chirish" : "Sevimlilarga qo'shish"}
              onClick={() => onToggleFavorite(activeGame.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                  : 'bg-[#050811]/65 border-white/[0.14] text-slate-300 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Slide Content */}
        <div className="relative z-10 mt-auto px-5 sm:px-8 pb-6 sm:pb-8 pt-10 max-w-2xl">
          <motion.div
            key={activeGame.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-cyan-300">{activeGame.category}</span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span>{pkgType}</span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="tabular-nums">{Number(activeGame.plays || 0)} start</span>
            </div>

            <h3
              data-testid="carousel-active-title"
              className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white leading-tight text-balance"
            >
              {activeGame.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2 max-w-xl">
              {activeGame.shortDescription ||
                activeGame.description ||
                "Brauzerda tezkor ishga tushuvchi HTML5 o'yin."}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                id="carousel-play-btn"
                onClick={() => onPlay(activeGame.id)}
                className="nx-btn-primary nx-btn-gaming px-5 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Sandboxda o'ynash</span>
              </button>
              <button
                type="button"
                id="carousel-details-btn"
                onClick={() => onDetails(activeGame.id)}
                className="nx-btn-secondary px-4 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Info className="w-4 h-4" />
                <span>Batafsil</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Carousel Footer Strip: Slide Selectors + Previous / Next Navigation */}
      {games.length > 1 && (
        <div className="relative z-10 border-t border-white/[0.08] bg-[#070b15]/85 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0">
            {games.map((g, idx) => {
              const isCurrent = idx === safeIndex;
              return (
                <button
                  key={g.id}
                  id={`carousel-dot-${idx}`}
                  type="button"
                  aria-label={`${g.title} slaydiga o'tish`}
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => goToIndex(idx)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? 'bg-white/[0.1] text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="font-mono-tabular text-[11px] opacity-75 mr-1.5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="hidden sm:inline">{g.title}</span>
                  {isCurrent && (
                    <motion.span
                      layoutId="carousel-active-underline"
                      className="absolute left-2 right-2 bottom-0.5 h-[2px] rounded-full"
                      style={{ backgroundColor: tone.line }}
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="carousel-prev-btn"
              type="button"
              aria-label="Oldingi o'yin"
              onClick={() => goStep(-1)}
              className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] border border-white/[0.1] text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="carousel-next-btn"
              type="button"
              aria-label="Keyingi o'yin"
              onClick={() => goStep(1)}
              className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.11] border border-white/[0.1] text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
