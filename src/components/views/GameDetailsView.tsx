import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  FileArchive,
  Heart,
  Layers,
  MessageSquare,
  Play,
  Send,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react';
import type { NexplayComment, NexplayGame, NexplayUser } from '../../types/nexplay';
import { calcAverageRating, formatSize, isOwnerUser } from '../../utils/nexplayLogic';
import { GameAnalytics } from '../GameAnalytics';
import { GameCard, GameCover } from '../GameCard';

interface GameDetailsViewProps {
  game: NexplayGame | null;
  relatedGames: NexplayGame[];
  comments: NexplayComment[];
  currentUser: NexplayUser | null;
  onBack: () => void;
  onPlay: (gameId: string) => void;
  onDetails: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onAddComment: (gameId: string, rating: number, text: string) => string | null;
  onDeleteComment: (commentId: string) => void;
  onRequireAuth: () => void;
}

export const GameDetailsView: React.FC<GameDetailsViewProps> = ({
  game,
  relatedGames,
  comments,
  currentUser,
  onBack,
  onPlay,
  onDetails,
  onToggleFavorite,
  onAddComment,
  onDeleteComment,
  onRequireAuth,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [commentText, setCommentText] = useState('');
  const [commentErr, setCommentErr] = useState<string | null>(null);

  const gameComments = useMemo(() => {
    if (!game) return [];
    return (comments || [])
      .filter((c) => c.gameId === game.id)
      .slice()
      .sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''));
  }, [comments, game]);

  const ratingStats = useMemo(() => calcAverageRating(gameComments), [gameComments]);

  if (!game) {
    return (
      <div className="nx-surface rounded-2xl p-10 text-center space-y-4">
        <p className="text-base font-semibold text-white">O'yin topilmadi</p>
        <button
          type="button"
          onClick={onBack}
          className="nx-btn-secondary px-4 py-2 rounded-xl text-xs cursor-pointer"
        >
          Katalogga qaytish
        </button>
      </div>
    );
  }

  const isFavorite = Boolean(currentUser?.favorites.includes(game.id));
  const pkgType = (game.packageMeta?.packageType?.toUpperCase() || 'HTML5').replace(/^HTML$/, 'HTML5');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    setCommentErr(null);
    const err = onAddComment(game.id, rating, commentText);
    if (err) {
      setCommentErr(err);
      return;
    }
    setCommentText('');
    setRating(5);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="nx-btn-secondary px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Katalogga qaytish</span>
        </button>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {ratingStats.count > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-300 font-medium tabular-nums">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{ratingStats.avg}</span>
              <span className="text-slate-400">({ratingStats.count})</span>
            </span>
          )}
          <span className="tabular-nums">{Number(game.plays || 0)} marta ishga tushirilgan</span>
        </div>
      </div>

      {/* Main Showcase Panel */}
      <section className="nx-surface rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-6 aspect-video lg:aspect-auto lg:min-h-[340px] bg-[#060a14] relative">
          <GameCover game={game} />
        </div>

        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold text-cyan-300">{game.category}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{pkgType} paket</span>
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
              {game.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {game.description ||
                game.shortDescription ||
                "Izolyatsiyalangan brauzer sandbox oynasida ishlovchi HTML5 o'yin."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <FileArchive className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Hajmi</span>
                </div>
                <div className="text-xs font-semibold text-white mt-1 tabular-nums">
                  {formatSize(game.packageMeta?.totalSize || 0)}
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-blue-300" />
                  <span>Fayllar</span>
                </div>
                <div className="text-xs font-semibold text-white mt-1 tabular-nums">
                  {game.packageMeta?.fileCount || 1} ta fayl
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Xavfsizlik</span>
                </div>
                <div className="text-xs font-semibold text-white mt-1">Sandbox faol</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              id="details-launch-btn"
              onClick={() => onPlay(game.id)}
              className="nx-btn-primary nx-btn-gaming px-6 py-3 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Sandboxda o'ynash</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(game.id)}
              className={`nx-btn-secondary px-4 py-3 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer ${
                isFavorite ? 'border-rose-400/50 text-rose-300' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'Sevimlilarda' : "Sevimlilarga qo'shish"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7-Day Daily Engagement Analytics */}
      <GameAnalytics game={game} />

      {/* Player Reviews & Comments Section */}
      <section id="game-comments-section" className="nx-surface rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-lg sm:text-xl text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-300" />
              <span>O'yinchi sharhlari va fikrlar</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {ratingStats.count > 0
                ? `O'rtacha baho ${ratingStats.avg} / 5 · ${ratingStats.count} ta fikr`
                : "Ushbu o'yin haqida birinchi bo'lib fikr bildiring."}
            </p>
          </div>
        </div>

        {currentUser ? (
          <form onSubmit={handleSubmitComment} className="space-y-3 rounded-2xl bg-white/[0.025] border border-white/[0.07] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-300">
                Sizning bahoyingiz ({currentUser.displayName || currentUser.username}):
              </span>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="O'yin bahosi">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} yulduz`}
                    onClick={() => setRating(star)}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      star <= rating ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${star <= rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              id="game-comment-input"
              rows={3}
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                if (commentErr) setCommentErr(null);
              }}
              placeholder="O'yin mexanikasi, tezligi va taassurotlaringiz haqida yozing..."
              className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm"
            />

            {commentErr && <p className="text-xs text-rose-400">{commentErr}</p>}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                id="game-comment-submit"
                className="nx-btn-primary px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Fikr qoldirish</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-300">
              Izoh va baho qoldirish uchun tizimga kiring.
            </p>
            <button
              type="button"
              onClick={onRequireAuth}
              className="nx-btn-primary px-4 py-2 rounded-xl text-xs cursor-pointer"
            >
              Kirish
            </button>
          </div>
        )}

        <div className="divide-y divide-white/[0.06]">
          {gameComments.length === 0 ? (
            <p className="py-4 text-xs text-slate-400">Hali sharhlar yo'q.</p>
          ) : (
            gameComments.map((c) => {
              const canDelete =
                Boolean(currentUser && (currentUser.id === c.userId || isOwnerUser(currentUser)));
              const formattedDate = c.createdAt
                ? new Date(c.createdAt).toLocaleDateString('uz-UZ', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';
              return (
                <article key={c.id} className="py-4 first:pt-1 last:pb-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-white">{c.author}</span>
                        <span className="text-slate-500">@{c.authorUsername}</span>
                        <span className="text-slate-600">·</span>
                        <span className="inline-flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3 h-3 ${
                                idx < c.rating ? 'fill-current' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums">{formattedDate}</div>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        aria-label="Sharhni o'chirish"
                        onClick={() => onDeleteComment(c.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{c.text}</p>
                </article>
              );
            })
          )}
        </div>
      </section>

      {relatedGames.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading font-bold text-lg text-white">O'xshash o'yinlar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedGames.map((rg) => (
              <GameCard
                key={rg.id}
                game={rg}
                compact
                isFavorite={Boolean(currentUser?.favorites.includes(rg.id))}
                onPlay={onPlay}
                onDetails={onDetails}
                onToggleFavorite={currentUser ? onToggleFavorite : undefined}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
