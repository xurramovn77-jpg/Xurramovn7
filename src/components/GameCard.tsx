import React from 'react';
import { Gamepad2, Heart, Play } from 'lucide-react';
import type { NexplayGame } from '../types/nexplay';
import { isSafeMedia } from '../utils/nexplayLogic';

interface GameCoverProps {
  game: NexplayGame;
  className?: string;
}

const TONE_MAP: Record<'blue' | 'cyan' | 'violet', { a: string; b: string; stroke: string }> = {
  blue: { a: '#0f2347', b: '#091124', stroke: '#3b82f6' },
  cyan: { a: '#0a2b3c', b: '#07111e', stroke: '#06b6d4' },
  violet: { a: '#1f163b', b: '#090c1c', stroke: '#8b5cf6' },
};

export const GameCover: React.FC<GameCoverProps> = ({ game, className = '' }) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  React.useEffect(() => {
    setImgFailed(false);
  }, [game.coverUrl]);

  const hasImage = !imgFailed && isSafeMedia(game.coverUrl);
  const tone = TONE_MAP[game.accentTone || 'blue'] || TONE_MAP.blue;

  if (hasImage) {
    return (
      <img
        src={game.coverUrl}
        alt={game.title}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(circle at 28% 24%, ${tone.a} 0%, ${tone.b} 75%, #04070f 100%)`,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 320 180"
        className="absolute inset-0 w-full h-full opacity-50"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle cx="260" cy="40" r="68" stroke={tone.stroke} strokeOpacity="0.35" strokeWidth="1" />
        <circle cx="70" cy="150" r="52" stroke={tone.stroke} strokeOpacity="0.22" strokeWidth="1" strokeDasharray="4 6" />
        <line x1="0" y1="150" x2="320" y2="25" stroke={tone.stroke} strokeOpacity="0.16" strokeWidth="1" />
      </svg>
      <div className="relative z-10 flex flex-col items-center gap-2 text-center px-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.14] bg-white/[0.04]"
          style={{ boxShadow: `0 0 24px -6px ${tone.stroke}` }}
        >
          <Gamepad2 className="w-5 h-5 text-slate-200" />
        </div>
        <span className="text-[11px] font-medium tracking-wide text-slate-300/85">
          {game.category || "HTML5 O'yin"}
        </span>
      </div>
    </div>
  );
};

interface GameCardProps {
  game: NexplayGame;
  compact?: boolean;
  isFavorite?: boolean;
  onPlay: (gameId: string) => void;
  onDetails: (gameId: string) => void;
  onToggleFavorite?: (gameId: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  compact = false,
  isFavorite = false,
  onPlay,
  onDetails,
  onToggleFavorite,
}) => {
  return (
    <article className="group nx-surface nx-card-hover rounded-2xl overflow-hidden flex flex-col">
      <div className={`relative ${compact ? 'aspect-[16/9]' : 'aspect-video'} bg-[#060a14] overflow-hidden`}>
        <GameCover
          game={game}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.045]"
        />
        <div aria-hidden="true" className="nx-cover-sheen" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050811]/75 via-transparent to-transparent pointer-events-none" />
        {onToggleFavorite && (
          <button
            type="button"
            aria-label={isFavorite ? "Sevimlilardan o'chirish" : "Sevimlilarga qo'shish"}
            onClick={() => onToggleFavorite(game.id)}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md border transition-colors cursor-pointer ${
              isFavorite
                ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                : 'bg-[#050811]/65 border-white/[0.12] text-slate-300 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className={`${compact ? 'p-3.5' : 'p-4 sm:p-5'} flex flex-col flex-1 gap-3`}>
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <span className="font-medium text-cyan-300/90 truncate">
            {game.category} · {(game.packageMeta?.packageType?.toUpperCase() || 'HTML5').replace(/^HTML$/, 'HTML5')}
          </span>
          <span className="tabular-nums shrink-0">{Number(game.plays || 0)} start</span>
        </div>

        <div className="space-y-1 flex-1">
          <h3 className="font-heading font-semibold text-base text-white leading-snug line-clamp-1">
            {game.title}
          </h3>
          {!compact && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              {game.shortDescription || game.description || "Brauzerda tezkor ishga tushuvchi HTML5 o'yin."}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onPlay(game.id)}
            className="nx-btn-primary flex-1 py-2 px-3 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>O'ynash</span>
          </button>
          <button
            type="button"
            onClick={() => onDetails(game.id)}
            className="nx-btn-secondary py-2 px-3 rounded-xl text-xs cursor-pointer"
          >
            Batafsil
          </button>
        </div>
      </div>
    </article>
  );
};
