import React, { useMemo, useState } from 'react';
import { LayoutGrid, Rows3, Search, X } from 'lucide-react';
import type { CatalogSortOrder, NexplayState, NexplayUser, ViewName } from '../../types/nexplay';
import { filterAndSortGames, getPublishedGames } from '../../utils/nexplayLogic';
import { SectionHero } from '../SectionHero';
import { GameCard } from '../GameCard';
import { SortDropdown } from '../SortDropdown';

interface CatalogViewProps {
  state: NexplayState;
  currentUser: NexplayUser | null;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  onNavigate: (view: ViewName) => void;
  onPlayGame: (gameId: string) => void;
  onDetailsGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  state,
  currentUser,
  categoryFilter,
  onCategoryChange,
  onNavigate,
  onPlayGame,
  onDetailsGame,
  onToggleFavorite,
}) => {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CatalogSortOrder>('newest');
  const [dense, setDense] = useState(false);

  const publishedCount = useMemo(() => getPublishedGames(state.games).length, [state.games]);
  const filtered = useMemo(
    () => filterAndSortGames(state.games, query, categoryFilter, sort),
    [state.games, query, categoryFilter, sort]
  );

  return (
    <div className="space-y-6">
      <SectionHero
        view="catalog"
        override={state.sectionHeroes.catalog}
        publishedCount={publishedCount}
        usersCount={state.users.length}
        onNavigate={onNavigate}
      />

      {/* Filter & Search Toolbar */}
      <div className="relative z-30 nx-surface rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="catalog-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O'yin nomi, tavsifi yoki janr bo'yicha qidiring..."
              aria-label="O'yinlarni qidirish"
              className="nx-input w-full rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm"
            />
            {query && (
              <button
                type="button"
                aria-label="Qidiruvni tozalash"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2.5">
            <SortDropdown value={sort} onChange={setSort} />

            <div className="flex items-center p-1 rounded-xl bg-[#050811] border border-white/[0.08]">
              <button
                type="button"
                aria-label="Keng ko'rinish"
                onClick={() => setDense(false)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  !dense ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Ixcham ko'rinish"
                onClick={() => setDense(true)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  dense ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Rows3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onCategoryChange('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                !categoryFilter
                  ? 'bg-white/[0.12] text-white border border-white/[0.2]'
                  : 'text-slate-400 hover:text-white bg-white/[0.03] border border-white/[0.06]'
              }`}
            >
              Barchasi
            </button>
            {state.categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-white/[0.12] text-white border border-white/[0.2]'
                    : 'text-slate-400 hover:text-white bg-white/[0.03] border border-white/[0.06]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 tabular-nums">
            Topildi: <strong className="text-white">{filtered.length}</strong> ta o'yin
          </span>
        </div>
      </div>

      {/* Results Grid */}
      {filtered.length === 0 ? (
        <div className="nx-surface rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-white">Mos o'yinlar topilmadi</p>
          <p className="text-xs text-slate-400">
            Qidiruv so'zini o'zgartiring yoki barcha kategoriyalar filtringa qayting.
          </p>
          {(query || categoryFilter) && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onCategoryChange('');
              }}
              className="nx-btn-secondary px-4 py-2 rounded-xl text-xs cursor-pointer"
            >
              Filtrni tozalash
            </button>
          )}
        </div>
      ) : (
        <div
          className={`grid gap-5 ${
            dense
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          }`}
        >
          {filtered.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              compact={dense}
              isFavorite={Boolean(currentUser?.favorites.includes(g.id))}
              onPlay={onPlayGame}
              onDetails={onDetailsGame}
              onToggleFavorite={currentUser ? onToggleFavorite : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
