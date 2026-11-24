import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Award, Crown, Flame, Gamepad2, MessageSquare, Play, Sparkles, Trophy, Users } from 'lucide-react';
import type { NexplayState, NexplayUser, ViewName } from '../../types/nexplay';
import { filterAndSortGames, getPublishedGames, getRankedUsers } from '../../utils/nexplayLogic';
import { GameCard } from '../GameCard';
import { FeaturedGamesCarousel } from '../FeaturedGamesCarousel';

interface HomeViewProps {
  state: NexplayState;
  currentUser: NexplayUser | null;
  onNavigate: (view: ViewName) => void;
  onSelectCategory: (cat: string) => void;
  onPlayGame: (gameId: string) => void;
  onDetailsGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  state,
  currentUser,
  onNavigate,
  onSelectCategory,
  onPlayGame,
  onDetailsGame,
  onToggleFavorite,
}) => {
  const published = getPublishedGames(state.games);
  const featured = published.filter((g) => g.featured);
  const showcase = (featured.length > 0 ? featured : published).slice(0, 6);
  const popular = filterAndSortGames(state.games, '', '', 'popular').slice(0, 5);
  const recent = filterAndSortGames(state.games, '', '', 'newest').slice(0, 5);
  const leaderboard = getRankedUsers(state.users).slice(0, 5);

  const favGenre = currentUser?.favoriteGenre || '';
  const recs = currentUser
    ? published
        .filter((g) => !favGenre || g.category === favGenre || g.featured)
        .slice(0, 3)
    : [];

  return (
    <div className="space-y-6">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden rounded-3xl nx-surface p-6 sm:p-8 lg:p-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-20 w-96 h-96 rounded-full blur-3xl opacity-35"
          style={{
            background:
              'radial-gradient(circle, rgba(var(--rgb-r), var(--rgb-g), var(--rgb-b), 0.48), transparent 70%)',
          }}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 360 320"
          className="pointer-events-none hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-64 h-56 opacity-30"
          fill="none"
        >
          <g className="nx-orbit-spin-slow">
            <circle cx="190" cy="160" r="120" stroke="rgba(148,163,184,0.32)" strokeWidth="1" />
            <circle
              cx="190"
              cy="160"
              r="86"
              stroke="rgba(59,130,246,0.65)"
              strokeWidth="1.2"
              strokeDasharray="6 6"
            />
          </g>
          <g className="nx-orbit-spin-reverse">
            <polygon
              points="190,62 275,111 275,209 190,258 105,209 105,111"
              stroke="rgba(6,182,212,0.55)"
              strokeWidth="1"
            />
          </g>
        </svg>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NEXPLAY Ekotizim</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-[42px] text-white leading-[1.12] text-balance">
            {state.cms.heroTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            {state.cms.heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="nx-btn-primary nx-btn-gaming px-5 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{state.cms.heroCta || 'Katalogni ochish'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('tournaments')}
              className="nx-btn-secondary px-5 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer"
            >
              Turnirlarni ko'rish
            </button>
          </div>
        </div>
      </section>

      {/* 4-Column Tabular KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Nashr etilgan o'yinlar",
            value: published.length,
            icon: Gamepad2,
            accent: 'text-blue-400',
          },
          {
            label: "Ro'yxatdan o'tganlar",
            value: state.users.length,
            icon: Users,
            accent: 'text-cyan-400',
          },
          {
            label: 'Faol turnirlar',
            value: state.tournaments.length,
            icon: Trophy,
            accent: 'text-amber-400',
          },
          {
            label: 'Multiplayer xonalar',
            value: state.rooms.length,
            icon: Flame,
            accent: 'text-violet-400',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              className="nx-surface rounded-2xl p-3.5 sm:p-5 flex items-center justify-between gap-2.5 sm:gap-3 transition-colors hover:border-white/[0.16]"
            >
              <div className="space-y-1 min-w-0">
                <div className="text-[11px] font-medium text-slate-400 leading-tight">{kpi.label}</div>
                <div className="font-heading font-bold text-2xl text-white tabular-nums">
                  {kpi.value}
                </div>
              </div>
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 ${kpi.accent}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Personalized Member Strip */}
      {currentUser && recs.length > 0 && (
        <section className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-white">
                {currentUser.displayName || currentUser.username} uchun tavsiyalar
              </h2>
              <p className="text-xs text-slate-400">
                {favGenre
                  ? `Tanlangan janringiz (${favGenre}) va mashhur HTML5 o'yinlar asosida.`
                  : "So'nggi qo'shilgan va tanlangan o'yinlar."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="text-xs font-semibold nx-accent-text hover:underline cursor-pointer"
            >
              Barchasini ko'rish
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                compact
                isFavorite={currentUser.favorites.includes(g.id)}
                onPlay={onPlayGame}
                onDetails={onDetailsGame}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured Games Showcase */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">
              Tanlangan o'yinlar
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Brauzerda darhol ishga tushadigan HTML5 va ZIP o'yin paketlari
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="text-xs font-semibold nx-accent-text hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Katalogga o'tish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {showcase.length === 0 ? (
          <div className="nx-surface rounded-2xl p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-white">Hozircha nashr etilgan o'yinlar yo'q</p>
            <p className="text-xs text-slate-400">
              Administrator paneli orqali yangi HTML5 yoki ZIP o'yin yuklang.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <FeaturedGamesCarousel
              games={showcase}
              favoriteIds={currentUser?.favorites}
              onPlay={onPlayGame}
              onDetails={onDetailsGame}
              onToggleFavorite={currentUser ? onToggleFavorite : undefined}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {showcase.map((g) => (
                <GameCard
                  key={g.id}
                  game={g}
                  isFavorite={Boolean(currentUser?.favorites.includes(g.id))}
                  onPlay={onPlayGame}
                  onDetails={onDetailsGame}
                  onToggleFavorite={currentUser ? onToggleFavorite : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Popular & Recent Dual Ranked Strip */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base sm:text-lg text-white">
              Eng ommabop o'yinlar
            </h2>
            <span className="text-xs text-slate-400 tabular-nums">Top {popular.length}</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {popular.map((g, idx) => (
              <div key={g.id} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-xs font-mono-tabular text-slate-400">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{g.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {g.category} · <span className="tabular-nums">{g.plays}</span> start
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onPlayGame(g.id)}
                  className="nx-btn-secondary px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>O'ynash</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base sm:text-lg text-white">
              So'nggi qo'shilganlar
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="text-xs text-cyan-300 hover:underline cursor-pointer"
            >
              Katalog
            </button>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {recent.map((g) => (
              <div key={g.id} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{g.title}</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {g.category} · {g.packageMeta?.packageType?.toUpperCase() || 'HTML5'}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onDetailsGame(g.id)}
                    className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer"
                  >
                    Batafsil
                  </button>
                  <button
                    type="button"
                    onClick={() => onPlayGame(g.id)}
                    className="nx-btn-primary px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories & Leaderboard Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base sm:text-lg text-white">
              Kategoriyalar
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('categories')}
              className="text-xs text-cyan-300 hover:underline cursor-pointer"
            >
              Barchasi
            </button>
          </div>
          <div className="space-y-2">
            {state.categories.map((cat) => {
              const count = published.filter((g) => g.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-colors text-left cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-medium text-white">{cat}</span>
                  <span className="text-xs text-slate-400 tabular-nums">{count} o'yin</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7 nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base sm:text-lg text-white">
              Peshqadamlar jadvali
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('rankings')}
              className="text-xs text-cyan-300 hover:underline cursor-pointer"
            >
              To'liq reyting
            </button>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {leaderboard.map((u, idx) => (
              <div key={u.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-xs font-mono-tabular text-slate-400">#{idx + 1}</span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-white truncate">
                      {u.displayName || u.username}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      @{u.username} · {u.sessions} sessiya · {u.achs} yutuq
                    </div>
                  </div>
                </div>
                <span className="font-mono-tabular text-xs font-bold text-cyan-300 shrink-0">
                  {u.points} ball
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Ecosystem Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            view: 'community' as ViewName,
            icon: MessageSquare,
            title: 'Hamjamiyat maydoni',
            desc: "O'yinchilar fikrlari, takliflar va ochiq muhokamalar.",
            count: `${state.communityPosts.length} xabar`,
          },
          {
            view: 'achievements' as ViewName,
            icon: Award,
            title: 'Yutuqlar vitrinasi',
            desc: "Faollik va o'yin sessiyalari uchun maxsus nishonlar.",
            count: `${currentUser?.achievements.length || 0} ochilgan`,
          },
          {
            view: 'premium' as ViewName,
            icon: Crown,
            title: 'NEXPLAY PRO',
            desc: 'Kengaytirilgan profil statusi va ustuvor ekotizim imkoniyatlari.',
            count: currentUser?.premium ? 'PRO faol' : 'Standart hisob',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.view}
              type="button"
              onClick={() => onNavigate(card.view)}
              className="nx-surface nx-card-hover rounded-2xl p-5 text-left flex flex-col justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-cyan-300" />
                <span className="text-[11px] text-slate-400 tabular-nums">{card.count}</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-semibold text-sm text-white">{card.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
};
