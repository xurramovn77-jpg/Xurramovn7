import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Heart, Info, Maximize2, RotateCw, ShieldAlert } from 'lucide-react';
import type { NexplayGame, NexplayPackageRecord, NexplayUser } from '../../types/nexplay';
import { formatSize } from '../../utils/nexplayLogic';
import { idbGetPackage } from '../../utils/packageIdb';
import { buildPackageSrcdoc, revokeBlobList } from '../../utils/zipProcessor';

interface PlayerViewProps {
  game: NexplayGame | null;
  currentUser: NexplayUser | null;
  onBack: () => void;
  onToggleFavorite: (gameId: string) => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  game,
  currentUser,
  onBack,
  onToggleFavorite,
}) => {
  const [srcdoc, setSrcdoc] = useState<string>('');
  const [pkgRecord, setPkgRecord] = useState<NexplayPackageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const activeBlobsRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    revokeBlobList(activeBlobsRef.current);
    activeBlobsRef.current = [];

    if (!game) {
      setLoading(false);
      setError("O'yin topilmadi.");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      setSrcdoc('');
      try {
        const pkg = await idbGetPackage(game.packageId);
        if (cancelled) return;
        if (!pkg) {
          setError("O'yin paketi IndexedDB xotirasida topilmadi. Admin panel orqali qayta yuklang.");
          setLoading(false);
          return;
        }
        setPkgRecord(pkg);
        const built = await buildPackageSrcdoc(pkg);
        if (cancelled) {
          if (built) revokeBlobList(built.urls);
          return;
        }
        if (!built || !built.srcdoc) {
          setError("Paket HTML tarkibini yig'ib bo'lmadi.");
          setLoading(false);
          return;
        }
        activeBlobsRef.current = built.urls;
        setSrcdoc(built.srcdoc);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("O'yinni sandbox oynasida ishga tushirishda xatolik yuz berdi.");
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      revokeBlobList(activeBlobsRef.current);
      activeBlobsRef.current = [];
    };
  }, [game?.id, game?.packageId, reloadNonce]);

  const handleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      void el.requestFullscreen().catch(() => {});
    }
  };

  if (!game) {
    return (
      <div className="nx-surface rounded-2xl p-10 text-center space-y-4">
        <p className="text-base font-semibold text-white">Faol o'yin tanlanmagan</p>
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

  const isFav = Boolean(currentUser?.favorites.includes(game.id));

  return (
    <div className="space-y-4">
      {/* Player Toolbar */}
      <div className="nx-surface rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="nx-btn-secondary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Chiqish</span>
          </button>
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-sm sm:text-base text-white truncate">
              {game.title}
            </h1>
            <div className="text-[11px] text-slate-400">
              {game.category} · <span className="tabular-nums">{game.plays}</span> start
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(game.id)}
            aria-label={isFav ? "Sevimlilardan o'chirish" : "Sevimlilarga qo'shish"}
            className={`nx-btn-secondary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer ${
              isFav ? 'border-rose-400/50 text-rose-300' : ''
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{isFav ? 'Sevimli' : "Saqlash"}</span>
          </button>

          <button
            type="button"
            onClick={() => setReloadNonce((n) => n + 1)}
            aria-label="O'yinni qayta yuklash"
            className="nx-btn-secondary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Qayta yuklash</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInfo((prev) => !prev)}
            aria-label="Paket ma'lumotlari"
            className={`nx-btn-secondary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer ${
              showInfo ? 'border-cyan-400/50 text-cyan-300' : ''
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tafsilot</span>
          </button>

          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="To'liq ekran"
            className="nx-btn-primary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">To'liq ekran</span>
          </button>
        </div>
      </div>

      {/* Collapsible Info Panel */}
      {showInfo && (
        <div className="nx-surface rounded-2xl p-4 sm:p-5 text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-slate-400">Paket turi</div>
            <div className="font-semibold text-white mt-0.5">
              {pkgRecord?.packageType?.toUpperCase() || game.packageMeta?.packageType?.toUpperCase() || 'HTML'}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Kirish fayli</div>
            <div className="font-semibold text-white mt-0.5 truncate">
              {pkgRecord?.entryPath || game.packageMeta?.entryPath || 'index.html'}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Fayllar soni</div>
            <div className="font-semibold text-white mt-0.5 tabular-nums">
              {pkgRecord?.fileCount || game.packageMeta?.fileCount || 1}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Umumiy hajm</div>
            <div className="font-semibold text-white mt-0.5 tabular-nums">
              {formatSize(pkgRecord?.totalSize || game.packageMeta?.totalSize || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Sandboxed Viewport */}
      <div
        ref={stageRef}
        className="relative rounded-2xl overflow-hidden border border-white/[0.1] bg-[#04070f] h-[68vh] min-h-[420px] max-h-[820px]"
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
            <span className="text-xs">Sandbox muhiti tayyorlanmoqda...</span>
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
            <p className="text-sm font-semibold text-white max-w-md">{error}</p>
            <button
              type="button"
              onClick={() => setReloadNonce((n) => n + 1)}
              className="nx-btn-secondary px-4 py-2 rounded-xl text-xs cursor-pointer"
            >
              Qayta urinish
            </button>
          </div>
        )}

        {!loading && !error && srcdoc && (
          <iframe
            id="game-sandbox-iframe"
            title={game.title}
            srcDoc={srcdoc}
            sandbox="allow-scripts allow-forms allow-pointer-lock"
            referrerPolicy="no-referrer"
            className="w-full h-full border-0 bg-[#04070f]"
          />
        )}
      </div>
    </div>
  );
};
