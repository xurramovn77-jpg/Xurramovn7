import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Award,
  CheckCircle2,
  Crown,
  Download,
  Edit3,
  FileArchive,
  FileSpreadsheet,
  Flame,
  FolderPlus,
  Gamepad2,
  LayoutDashboard,
  Layers,
  Megaphone,
  Menu,
  MessageSquare,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  RotateCcw,
  ScrollText,
  Shield,
  Sliders,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { COSMOS_SCENES, RGB_PRESETS } from '../../constants/nexplay';
import type {
  AdminSectionKey,
  BgMediaConfig,
  NexplayCms,
  NexplayGame,
  NexplayModules,
  NexplayPackageRecord,
  NexplayState,
  NexplayTournament,
  NexplayUser,
  RgbConfig,
  RgbMode,
} from '../../types/nexplay';
import { calcAverageRating, formatSize, isOwnerUser, isSafeMedia } from '../../utils/nexplayLogic';
import { idbDeletePackage, idbPutPackage } from '../../utils/packageIdb';
import { buildPackageSrcdoc, parseGamePackageFile, revokeBlobList } from '../../utils/zipProcessor';

interface AdminViewProps {
  state: NexplayState;
  currentUser: NexplayUser | null;
  section: AdminSectionKey;
  cosmosSceneIdx: number;
  onChangeSection: (sec: AdminSectionKey) => void;
  onSelectCosmosScene: (idx: number) => void;
  onPublishOrUpdateGame: (game: NexplayGame, isEdit: boolean) => void;
  onTogglePublishGame: (gameId: string) => void;
  onToggleFeaturedGame: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
  onPlayGame: (gameId: string) => void;
  onAddCategory: (cat: string) => void;
  onDeleteCategory: (cat: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleBlockUser: (userId: string) => void;
  onToggleUserPremium: (userId: string) => void;
  onUpdateTournamentStatus: (tId: string, status: NexplayTournament['status']) => void;
  onDeleteTournament: (tId: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onDeleteCommunityPost: (postId: string) => void;
  onToggleModule: (key: keyof NexplayModules) => void;
  onUpdateCms: (cms: NexplayCms) => void;
  onUpdateBgMedia: (bgMedia: BgMediaConfig) => void;
  onUpdateRgb: (rgb: RgbConfig) => void;
  onImportStateJson: (jsonText: string) => Promise<void>;
  onAddAudit: (action: string) => void;
  onNotify: (msg: string, tone?: 'info' | 'success' | 'error') => void;
  onBackHome: () => void;
}

const ADMIN_NAV: Array<{ key: AdminSectionKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'dashboard', label: 'Umumiy statistika', icon: LayoutDashboard },
  { key: 'add-game', label: "O'yin qo'shish (Studio)", icon: Plus },
  { key: 'games-list', label: "O'yinlar ro'yxati", icon: Gamepad2 },
  { key: 'categories', label: 'Kategoriyalar', icon: Layers },
  { key: 'comments', label: 'Izohlar moderatsiyasi', icon: MessageSquare },
  { key: 'users', label: 'Foydalanuvchilar', icon: Users },
  { key: 'operations', label: 'Turnir va Xonalar', icon: Trophy },
  { key: 'modules', label: 'Modullar', icon: Sliders },
  { key: 'audit', label: 'Audit jurnali', icon: ScrollText },
  { key: 'settings', label: 'CMS, RGB va Fon', icon: Palette },
];

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export const AdminView: React.FC<AdminViewProps> = ({
  state,
  currentUser,
  section,
  cosmosSceneIdx,
  onChangeSection,
  onSelectCosmosScene,
  onPublishOrUpdateGame,
  onTogglePublishGame,
  onToggleFeaturedGame,
  onDeleteGame,
  onPlayGame,
  onAddCategory,
  onDeleteCategory,
  onDeleteComment,
  onToggleBlockUser,
  onToggleUserPremium,
  onUpdateTournamentStatus,
  onDeleteTournament,
  onDeleteRoom,
  onDeleteCommunityPost,
  onToggleModule,
  onUpdateCms,
  onUpdateBgMedia,
  onUpdateRgb,
  onImportStateJson,
  onAddAudit,
  onNotify,
  onBackHome,
}) => {
  const owner = isOwnerUser(currentUser);

  // Studio upload state
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(state.categories[0] || 'Arkada');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [accentTone, setAccentTone] = useState<'blue' | 'cyan' | 'violet'>('blue');
  const [featured, setFeatured] = useState(false);

  const [pendingPkg, setPendingPkg] = useState<NexplayPackageRecord | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewSrcdoc, setPreviewSrcdoc] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const lastFileRef = useRef<File | null>(null);
  const previewBlobsRef = useRef<string[]>([]);

  // Filters
  const [listSearch, setListSearch] = useState('');
  const [listStatus, setListStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [commentSearch, setCommentSearch] = useState('');

  // Categories input
  const [newCategory, setNewCategory] = useState('');

  // CMS & Bg local drafts
  const [cmsDraft, setCmsDraft] = useState<NexplayCms>(state.cms);
  const [bgDraft, setBgDraft] = useState<BgMediaConfig>(state.bgMedia);
  const [quickAnnouncement, setQuickAnnouncement] = useState(state.cms.announcement);

  // Slidebar & mobile drawer states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setCmsDraft(state.cms);
    setQuickAnnouncement(state.cms.announcement);
  }, [state.cms]);

  useEffect(() => {
    setBgDraft(state.bgMedia);
  }, [state.bgMedia]);

  useEffect(() => {
    return () => {
      revokeBlobList(previewBlobsRef.current);
      previewBlobsRef.current = [];
    };
  }, []);

  const commentStats = useMemo(() => calcAverageRating(state.comments || []), [state.comments]);

  const totalGamePlays = useMemo(
    () => state.games.reduce((acc, g) => acc + Number(g.plays || 0), 0),
    [state.games]
  );

  const categoryBreakdown = useMemo(() => {
    const maxGames = Math.max(1, state.games.length);
    return state.categories.map((cat) => {
      const catGames = state.games.filter((g) => g.category === cat);
      const plays = catGames.reduce((acc, g) => acc + Number(g.plays || 0), 0);
      return {
        cat,
        count: catGames.length,
        plays,
        pct: Math.round((catGames.length / maxGames) * 100),
      };
    });
  }, [state.categories, state.games]);

  const topGames = useMemo(() => {
    return state.games
      .slice()
      .sort((a, b) => Number(b.plays || 0) - Number(a.plays || 0))
      .slice(0, 5);
  }, [state.games]);

  if (!owner) {
    return (
      <div className="nx-surface rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto mt-8">
        <Shield className="w-10 h-10 text-rose-400 mx-auto" />
        <h1 className="font-heading font-bold text-xl text-white">Ruxsat cheklangan</h1>
        <p className="text-xs text-slate-400">
          Boshqaruv paneli faqat tizim egasi (OWNER) hisobi uchun ochiq.
        </p>
        <button
          type="button"
          onClick={onBackHome}
          className="nx-btn-secondary px-5 py-2.5 rounded-xl text-xs cursor-pointer"
        >
          Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  const processPackageFile = async (file: File) => {
    lastFileRef.current = file;
    setUploadError('');
    setUploadStatus('Paket tekshirilmoqda...');
    setUploadProgress(25);
    setShowPreview(false);
    setPreviewSrcdoc('');

    const res = await parseGamePackageFile(file, (pct, label) => {
      setUploadProgress(pct);
      setUploadStatus(label);
    });

    if (!res.ok) {
      setUploadProgress(0);
      setUploadStatus('');
      setUploadError(res.error);
      onNotify(res.error, 'error');
      return;
    }

    await idbPutPackage(res.record);
    setPendingPkg(res.record);
    if (!title.trim()) setTitle(res.suggestedTitle);
    setUploadProgress(100);
    setUploadStatus(`Tayyor: ${res.record.fileName} (${formatSize(res.record.totalSize)})`);
    onNotify("O'yin paketi muvaffaqiyatli yuklandi.", 'success');
  };

  const handleTogglePreview = async () => {
    if (!pendingPkg) return;
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    revokeBlobList(previewBlobsRef.current);
    const built = await buildPackageSrcdoc(pendingPkg);
    if (built) {
      previewBlobsRef.current = built.urls;
      setPreviewSrcdoc(built.srcdoc);
      setShowPreview(true);
    }
  };

  const resetStudioForm = () => {
    setEditingGameId(null);
    setTitle('');
    setCategory(state.categories[0] || 'Arkada');
    setShortDesc('');
    setFullDesc('');
    setCoverUrl('');
    setAccentTone('blue');
    setFeatured(false);
    setPendingPkg(null);
    setUploadProgress(0);
    setUploadStatus('');
    setUploadError('');
    setShowPreview(false);
    setPreviewSrcdoc('');
  };

  const handleSaveGame = async (publish: boolean) => {
    if (!title.trim()) {
      onNotify("O'yin nomini kiriting.", 'error');
      return;
    }
    const existing = editingGameId ? state.games.find((g) => g.id === editingGameId) : null;
    const pkgId = pendingPkg?.packageId || existing?.packageId;
    if (!pkgId) {
      onNotify("Avval HTML yoki ZIP o'yin paketini yuklang.", 'error');
      return;
    }

    if (pendingPkg) {
      await idbPutPackage(pendingPkg);
    }

    const nextGame: NexplayGame = {
      id: existing?.id || `game-${Date.now()}`,
      title: title.trim(),
      category: category || state.categories[0] || 'Arkada',
      coverUrl: coverUrl.trim(),
      shortDescription: shortDesc.trim(),
      description: fullDesc.trim(),
      featured,
      status: publish ? 'published' : 'draft',
      published: publish,
      plays: existing?.plays || 0,
      packageId: pkgId,
      packageMeta: pendingPkg
        ? {
            packageType: pendingPkg.packageType,
            fileName: pendingPkg.fileName,
            totalSize: pendingPkg.totalSize,
            fileCount: pendingPkg.fileCount,
            entryPath: pendingPkg.entryPath,
          }
        : existing?.packageMeta || null,
      createdAt: existing?.createdAt || new Date().toISOString(),
      accentTone,
    };

    onPublishOrUpdateGame(nextGame, Boolean(existing));
    resetStudioForm();
    onChangeSection('games-list');
  };

  const startEditGame = (g: NexplayGame) => {
    setEditingGameId(g.id);
    setTitle(g.title);
    setCategory(g.category);
    setShortDesc(g.shortDescription);
    setFullDesc(g.description);
    setCoverUrl(g.coverUrl);
    setAccentTone(g.accentTone || 'blue');
    setFeatured(g.featured);
    setPendingPkg(null);
    setUploadStatus(g.packageMeta ? `Joriy paket: ${g.packageMeta.fileName}` : '');
    onChangeSection('add-game');
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.2 * 1024 * 1024) {
      onNotify("Rasm hajmi 2.2 MB dan oshmasin.", 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && isSafeMedia(reader.result)) {
        setCoverUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      onNotify("Fon fayli hajmi 3.5 MB dan kichik bo'lishi kerak.", 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && isSafeMedia(reader.result)) {
        const nextBg: BgMediaConfig = {
          ...bgDraft,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: reader.result,
        };
        setBgDraft(nextBg);
        onUpdateBgMedia(nextBg);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateBgImmediate = (patch: Partial<BgMediaConfig>) => {
    const next = { ...bgDraft, ...patch };
    setBgDraft(next);
    onUpdateBgMedia(next);
  };

  const handleResetBgDefaults = () => {
    const defaults: BgMediaConfig = {
      type: 'none',
      url: '',
      opacity: 0.28,
      blur: 0,
      dim: 0.84,
      parallaxEnabled: true,
      gridEnabled: true,
      particlesEnabled: true,
      streaksEnabled: true,
      motionIntensity: 1,
    };
    setBgDraft(defaults);
    onUpdateBgMedia(defaults);
    onSelectCosmosScene(0);
    onUpdateRgb({ ...RGB_PRESETS["Kiber ko'k"] });
    onNotify('Fon va atmosfera standart holatga qaytarildi.', 'info');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexplay-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onAddAudit('JSON zaxira nusxasi yuklab olindi');
    onNotify('JSON zaxira yuklandi.', 'success');
  };

  const handleExportHtmlSnapshot = () => {
    const safeTitle = state.cms.heroTitle.replace(/</g, '&lt;');
    const gamesRows = state.games
      .map(
        (g) =>
          `<li><strong>${g.title.replace(/</g, '&lt;')}</strong> (${g.category}) — ${g.plays} start [${g.status}]</li>`
      )
      .join('');
    const doc = `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>NEXPLAY Snapshot</title><style>body{font-family:system-ui,sans-serif;background:#050811;color:#f8fafc;padding:32px;line-height:1.6}h1{color:#60a5fa}ul{padding-left:20px}</style></head><body><h1>NEXPLAY Platforma Hisoboti</h1><p>${safeTitle}</p><h2>O'yinlar (${state.games.length})</h2><ul>${gamesRows}</ul></body></html>`;
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexplay-hisobot-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    onAddAudit('Standalone HTML hisoboti eksport qilindi');
    onNotify('HTML hisobot fayli yaratildi.', 'success');
  };

  const handleExportCsv = () => {
    const escapeCsv = (val: string | number | boolean) =>
      `"${String(val).replace(/"/g, '""')}"`;
    const header = ['ID', 'Nomi', 'Kategoriya', 'Holati', 'Vitrina', 'Startlar', 'Sharhlar'].join(',');
    const rows = state.games.map((g) => {
      const cCount = (state.comments || []).filter((c) => c.gameId === g.id).length;
      return [
        escapeCsv(g.id),
        escapeCsv(g.title),
        escapeCsv(g.category),
        escapeCsv(g.status),
        escapeCsv(g.featured ? 'Ha' : "Yo'q"),
        escapeCsv(g.plays),
        escapeCsv(cCount),
      ].join(',');
    });
    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexplay-katalog-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onAddAudit("O'yinlar statistikasi CSV formatida eksport qilindi");
    onNotify('CSV hisobot yuklandi.', 'success');
  };

  const filteredGames = state.games.filter((g) => {
    const q = listSearch.trim().toLowerCase();
    const okQ =
      !q ||
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q);
    const okS = listStatus === 'all' || g.status === listStatus;
    return okQ && okS;
  });

  const filteredUsers = state.users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    return (
      !q ||
      u.username.toLowerCase().includes(q) ||
      (u.displayName || '').toLowerCase().includes(q)
    );
  });

  const filteredComments = (state.comments || []).filter((c) => {
    const q = commentSearch.trim().toLowerCase();
    return (
      !q ||
      c.text.toLowerCase().includes(q) ||
      c.author.toLowerCase().includes(q) ||
      c.authorUsername.toLowerCase().includes(q)
    );
  });

  const navCounts: Partial<Record<AdminSectionKey, number>> = {
    'games-list': state.games.length,
    categories: state.categories.length,
    comments: (state.comments || []).length,
    users: state.users.length,
    operations: state.tournaments.length + state.rooms.length,
    audit: state.auditLogs.length,
  };

  const activeScene = COSMOS_SCENES[cosmosSceneIdx % COSMOS_SCENES.length] || COSMOS_SCENES[0];
  const primaryHex = rgbToHex(state.rgb.r, state.rgb.g, state.rgb.b);

  return (
    <div className="space-y-6">
      <div className="nx-surface rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="admin-slidebar-open-btn"
            aria-label="Admin slidebar menyusini ochish"
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-slate-200 flex items-center justify-center cursor-pointer shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs font-semibold text-cyan-300">OWNER Boshqaruv Markazi</div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-white">
              NEXPLAY Admin Panel
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeSection('add-game')}
            className="nx-btn-primary px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>O'yin qo'shish</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeSection('settings')}
            className="nx-btn-secondary px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Fon va RGB</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="nx-btn-secondary px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV hisobot</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="nx-btn-secondary px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON zaxira</span>
          </button>
          <button
            type="button"
            onClick={handleExportHtmlSnapshot}
            className="nx-btn-secondary px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>HTML hisobot</span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Slidebar Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setMobileDrawerOpen(false);
            }}
            className="fixed inset-0 z-[850] lg:hidden bg-[#03060E]/80 backdrop-blur-sm flex"
          >
            <motion.aside
              id="admin-slidebar-drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="w-72 max-w-[85vw] h-full nx-elevated p-4 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <span className="font-heading font-bold text-sm text-white">Boshqaruv bo'limlari</span>
                  <button
                    type="button"
                    aria-label="Slidebarni yopish"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-8 h-8 rounded-lg bg-white/[0.06] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {ADMIN_NAV.map((item) => {
                    const Icon = item.icon;
                    const active = section === item.key;
                    const count = navCounts[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          onChangeSection(item.key);
                          setMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-white/[0.12] text-white font-semibold'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {typeof count === 'number' && (
                          <span className="font-mono-tabular text-[11px] text-slate-400 shrink-0">{count}</span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onBackHome();
                }}
                className="nx-btn-secondary w-full py-2.5 rounded-xl text-xs cursor-pointer mt-4"
              >
                Saytga qaytish
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Collapsible Sliding Desktop Sidebar (Slidebar) */}
        <aside
          id="admin-slidebar-desktop"
          data-collapsed={sidebarCollapsed ? 'true' : 'false'}
          style={{ width: sidebarCollapsed ? 72 : 256 }}
          className="hidden lg:flex flex-col shrink-0 overflow-hidden nx-surface rounded-2xl p-2.5 space-y-1.5 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-2'} py-1.5 border-b border-white/[0.06] mb-1`}>
            {!sidebarCollapsed && (
              <span className="text-[11px] font-semibold tracking-wide text-slate-400 truncate">
                Bo'limlar
              </span>
            )}
            <button
              type="button"
              id="admin-sidebar-collapse-btn"
              aria-label={sidebarCollapsed ? 'Slidebarni kengaytirish' : "Slidebarni yig'ish"}
              title={sidebarCollapsed ? 'Slidebarni kengaytirish' : "Slidebarni yig'ish"}
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.key;
            const count = navCounts[item.key];
            return (
              <button
                key={item.key}
                type="button"
                id={`admin-nav-${item.key}`}
                title={item.label}
                aria-label={item.label}
                onClick={() => onChangeSection(item.key)}
                className={`relative w-full flex items-center ${
                  sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                } gap-2 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                  active ? 'text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="admin-nav-active-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-xl bg-white/[0.1] border border-white/[0.1] pointer-events-none"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-cyan-300' : ''}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!sidebarCollapsed && typeof count === 'number' && (
                  <span className="relative z-10 font-mono-tabular text-[11px] text-slate-400 shrink-0">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main Admin Content */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {section === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Jami o'yinlar", val: state.games.length, sub: `${state.games.filter((g) => g.published).length} nashr etilgan`, icon: Gamepad2 },
                  { label: 'Foydalanuvchilar', val: state.users.length, sub: `${state.users.filter((u) => u.premium).length} PRO hisob`, icon: Users },
                  { label: 'Umumiy startlar', val: totalGamePlays, sub: `${state.games.filter((g) => g.featured).length} tanlangan · ${state.stats.totalLaunches} sessiya`, icon: Activity },
                  { label: 'Sharh va baho', val: commentStats.count, sub: commentStats.count > 0 ? `O'rtacha ${commentStats.avg} / 5` : 'Hali baho yo‘q', icon: MessageSquare },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="nx-surface rounded-2xl p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{m.label}</span>
                        <Icon className="w-3.5 h-3.5 text-cyan-300" />
                      </div>
                      <div className="font-heading font-bold text-2xl text-white tabular-nums">
                        {m.val}
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums">{m.sub}</div>
                    </div>
                  );
                })}
              </div>

              {/* Category Analytics & Top Games Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="nx-surface rounded-2xl p-5 space-y-4">
                  <h2 className="font-heading font-bold text-sm text-white">Kategoriyalar taqsimoti</h2>
                  <div className="space-y-3">
                    {categoryBreakdown.map((item) => (
                      <div key={item.cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200">{item.cat}</span>
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            {item.count} o'yin · {item.plays} start
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(8, item.pct)}%`,
                              background: 'linear-gradient(90deg, var(--rgb-primary), var(--rgb-secondary))',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="nx-surface rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading font-bold text-sm text-white">Eng faol o'yinlar</h2>
                    <button
                      type="button"
                      onClick={() => onChangeSection('games-list')}
                      className="text-[11px] text-cyan-300 hover:underline cursor-pointer"
                    >
                      Barchasi
                    </button>
                  </div>
                  <div className="divide-y divide-white/[0.06]">
                    {topGames.map((g) => (
                      <div key={g.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{g.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {g.category} · <span className="tabular-nums">{g.plays}</span> start
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditGame(g)}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-slate-200 cursor-pointer"
                          >
                            Tahrirlash
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div id="admin-quick-announcement" className="nx-surface rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-cyan-300" />
                      <span>Tezkor e'lon paneli</span>
                    </h2>
                    <span className="text-[11px] text-slate-400">Yuqori satr</span>
                  </div>
                  <input
                    id="admin-quick-announcement-input"
                    type="text"
                    value={quickAnnouncement}
                    onChange={(e) => setQuickAnnouncement(e.target.value)}
                    placeholder="Saytning eng yuqorisida ko'rinadigan e'lon matni..."
                    className="nx-input w-full rounded-xl px-3.5 py-2 text-xs"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickAnnouncement('');
                        onUpdateCms({ ...state.cms, announcement: '' });
                        onNotify("E'lon matni tozalandi.", 'info');
                      }}
                      className="nx-btn-secondary px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      Tozalash
                    </button>
                    <button
                      type="button"
                      id="admin-quick-announcement-save"
                      onClick={() => {
                        onUpdateCms({ ...state.cms, announcement: quickAnnouncement.trim() });
                        onAddAudit("Tezkor e'lon matni yangilandi");
                        onNotify("E'lon satri yangilandi.", 'success');
                      }}
                      className="nx-btn-primary px-3.5 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      E'lonni saqlash
                    </button>
                  </div>
                </div>

                <div className="nx-surface rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading font-bold text-sm text-white">So'nggi audit yozuvlari</h2>
                    <button
                      type="button"
                      onClick={() => onChangeSection('audit')}
                      className="text-[11px] text-cyan-300 hover:underline cursor-pointer"
                    >
                      To'liq jurnal
                    </button>
                  </div>
                  {state.auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-400">Hali amaliyotlar yozilmagan.</p>
                  ) : (
                    <div className="divide-y divide-white/[0.06] text-xs">
                      {state.auditLogs.slice(0, 4).map((log) => (
                        <div key={log.id} className="py-2 flex items-center justify-between gap-2">
                          <span className="text-slate-200 truncate">{log.action}</span>
                          <span className="text-slate-400 text-[11px] shrink-0">{log.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {section === 'add-game' && (
            <div className="nx-surface rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading font-bold text-lg text-white">
                  {editingGameId ? "O'yinni tahrirlash" : "HTML5 / ZIP O'yin Yuklash Studiyasi"}
                </h2>
                {editingGameId && (
                  <button
                    type="button"
                    onClick={resetStudioForm}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Yangi yuklashga o'tish
                  </button>
                )}
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void processPackageFile(f);
                }}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-white/[0.14] bg-[#050811]/60'
                }`}
              >
                <FileArchive className="w-8 h-8 text-cyan-300 mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-white">
                  .html, .htm yoki .zip o'yin paketini bu yerga tashlang
                </p>
                <p className="text-[11px] text-slate-400 mt-1 mb-4">
                  Maksimal hajm: HTML 5MB · ZIP 18MB (avtomatik xavfsizlik tekshiruvi bilan)
                </p>
                <label className="nx-btn-primary px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Fayl tanlash</span>
                  <input
                    id="admin-game-file-input"
                    type="file"
                    accept=".html,.htm,.zip"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void processPackageFile(f);
                    }}
                    className="hidden"
                  />
                </label>

                {uploadStatus && (
                  <div className="mt-4 text-xs text-emerald-300 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{uploadStatus}</span>
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-3 max-w-xs mx-auto h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                {uploadError && <div className="mt-3 text-xs text-rose-400">{uploadError}</div>}
              </div>

              {pendingPkg && pendingPkg.htmlCandidates.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300">Kirish HTML fayli</label>
                  <select
                    value={pendingPkg.entryPath}
                    onChange={(e) =>
                      setPendingPkg({ ...pendingPkg, entryPath: e.target.value })
                    }
                    className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs cursor-pointer"
                  >
                    {pendingPkg.htmlCandidates.map((cand) => (
                      <option key={cand} value={cand}>
                        {cand}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300" htmlFor="studio-title">
                    O'yin nomi
                  </label>
                  <input
                    id="studio-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masalan: Neon Drift"
                    className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300" htmlFor="studio-category">
                    Kategoriya
                  </label>
                  <select
                    id="studio-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs cursor-pointer"
                  >
                    {state.categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300" htmlFor="studio-tone">
                    Atmosfera rangi
                  </label>
                  <select
                    id="studio-tone"
                    value={accentTone}
                    onChange={(e) => setAccentTone(e.target.value as 'blue' | 'cyan' | 'violet')}
                    className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs cursor-pointer"
                  >
                    <option value="blue">Elektr ko'k</option>
                    <option value="cyan">Firuza (Cyan)</option>
                    <option value="violet">Binafsha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300" htmlFor="studio-short">
                    Qisqa tavsif
                  </label>
                  <input
                    id="studio-short"
                    type="text"
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    placeholder="Katalog kartasi uchun qisqa matn"
                    className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300" htmlFor="studio-cover">
                    Muqova rasm URL yoki yuklash (ixtiyoriy)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="studio-cover"
                      type="text"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://... (bo'sh = SVG fon)"
                      className="nx-input flex-1 rounded-xl px-3.5 py-2.5 text-xs"
                    />
                    <label className="nx-btn-secondary px-3 py-2.5 rounded-xl text-xs inline-flex items-center gap-1 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Yuklash</span>
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300" htmlFor="studio-desc">
                  To'liq tavsif
                </label>
                <textarea
                  id="studio-desc"
                  rows={3}
                  value={fullDesc}
                  onChange={(e) => setFullDesc(e.target.value)}
                  placeholder="Boshqaruv tugmalari va o'yin qoidalari haqida yozing..."
                  className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded accent-blue-500"
                />
                <span>Bosh sahifada "Tanlangan o'yinlar" karuselida ko'rsatish</span>
              </label>

              {showPreview && previewSrcdoc && (
                <div className="rounded-2xl overflow-hidden border border-white/[0.12] h-72 bg-[#04070f]">
                  <iframe
                    title="Paket jonli ko'rigi"
                    srcDoc={previewSrcdoc}
                    sandbox="allow-scripts allow-forms allow-pointer-lock"
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
                {pendingPkg && (
                  <button
                    type="button"
                    onClick={handleTogglePreview}
                    className="nx-btn-secondary px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    {showPreview ? "Ko'rikni yopish" : "Sandbox ko'rik"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleSaveGame(false)}
                  className="nx-btn-secondary px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Qoralama saqlash
                </button>
                <button
                  type="button"
                  id="studio-publish-btn"
                  onClick={() => void handleSaveGame(true)}
                  className="nx-btn-primary px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Nashr qilish
                </button>
              </div>
            </div>
          )}

          {section === 'games-list' && (
            <div className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-heading font-bold text-lg text-white">O'yinlar boshqaruvi</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Qidirish..."
                    className="nx-input rounded-xl px-3 py-2 text-xs"
                  />
                  <select
                    value={listStatus}
                    onChange={(e) => setListStatus(e.target.value as 'all' | 'published' | 'draft')}
                    className="nx-input rounded-xl px-3 py-2 text-xs cursor-pointer"
                  >
                    <option value="all">Barchasi</option>
                    <option value="published">Nashr etilgan</option>
                    <option value="draft">Qoralama</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {filteredGames.map((g) => (
                  <div
                    key={g.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-white truncate">{g.title}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            g.published
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {g.published ? 'Nashr' : 'Qoralama'}
                        </span>
                        {g.featured && (
                          <span className="text-[10px] font-semibold text-cyan-300">Tanlangan</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {g.category} · <span className="tabular-nums">{g.plays}</span> start
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleFeaturedGame(g.id)}
                        title="Tanlangan vitrina holati"
                        className={`px-2.5 py-1.5 rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer border ${
                          g.featured
                            ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300'
                            : 'border-white/[0.1] bg-white/[0.04] text-slate-300'
                        }`}
                      >
                        <Star className={`w-3 h-3 ${g.featured ? 'fill-current' : ''}`} />
                        <span>Vitrina</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onPlayGame(g.id)}
                        className="nx-btn-secondary px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Sinash</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditGame(g)}
                        className="nx-btn-secondary px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Tahrirlash</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onTogglePublishGame(g.id)}
                        className="nx-btn-secondary px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                      >
                        {g.published ? 'Yashirish' : 'Nashr'}
                      </button>
                      <button
                        type="button"
                        aria-label="O'yinni o'chirish"
                        onClick={() => {
                          void idbDeletePackage(g.packageId);
                          onDeleteGame(g.id);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'categories' && (
            <div className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="font-heading font-bold text-lg text-white">Kategoriyalar</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCategory.trim()) return;
                  onAddCategory(newCategory.trim());
                  setNewCategory('');
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Yangi janr nomi..."
                  className="nx-input flex-1 rounded-xl px-3.5 py-2.5 text-xs"
                />
                <button type="submit" className="nx-btn-primary px-4 py-2.5 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer">
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Qo'shish</span>
                </button>
              </form>
              <div className="divide-y divide-white/[0.06]">
                {state.categories.map((c) => (
                  <div key={c} className="py-3 flex items-center justify-between text-xs">
                    <span className="font-medium text-white">{c}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(c)}
                      className="text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      O'chirish
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'comments' && (
            <div className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-bold text-lg text-white">
                    Izohlar moderatsiyasi (<span className="tabular-nums">{filteredComments.length}</span>)
                  </h2>
                  <p className="text-xs text-slate-400">
                    O'yin tafsilotlari sahifasiga yozilgan barcha sharhlar va baholar.
                  </p>
                </div>
                <input
                  type="text"
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                  placeholder="Muallif yoki matn bo'yicha qidirish..."
                  className="nx-input rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              {filteredComments.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">Mos izohlar topilmadi.</p>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {filteredComments.map((c) => {
                    const gameTitle = state.games.find((g) => g.id === c.gameId)?.title || c.gameId;
                    return (
                      <div key={c.id} className="py-3.5 flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-white">{c.author}</span>
                            <span className="text-slate-500">@{c.authorUsername}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-cyan-300 font-medium">{gameTitle}</span>
                            <span className="text-amber-400 inline-flex items-center gap-0.5 tabular-nums">
                              <Star className="w-3 h-3 fill-current" />
                              {c.rating}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                        </div>
                        <button
                          type="button"
                          aria-label="Izohni o'chirish"
                          onClick={() => onDeleteComment(c.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {section === 'users' && (
            <div className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-heading font-bold text-lg text-white">
                  Foydalanuvchilar (<span className="tabular-nums">{filteredUsers.length}</span>)
                </h2>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Login yoki ism qidirish..."
                  className="nx-input rounded-xl px-3.5 py-2 text-xs"
                />
              </div>
              <div className="divide-y divide-white/[0.06]">
                {filteredUsers.map((u) => {
                  const isSelfOwner = u.role === 'OWNER';
                  return (
                    <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2 font-semibold text-white">
                          <span>{u.displayName || u.username}</span>
                          <span className="text-slate-400 font-normal">@{u.username}</span>
                          {u.premium && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-300">
                              <Crown className="w-3 h-3" />
                              PRO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                          <span>{u.role}</span>
                          <span>·</span>
                          <span>{u.blocked ? 'Bloklangan' : 'Faol'}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-orange-300/90 tabular-nums">
                            <Flame className="w-3 h-3" />
                            {Math.max(1, u.loginStreak || 1)} kun seriya
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Award className="w-3 h-3 text-cyan-300" />
                            {(u.badges || []).length} nishon
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleUserPremium(u.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                            u.premium
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-white/[0.05] text-slate-300 hover:text-white'
                          }`}
                        >
                          {u.premium ? 'PRO yechish' : 'PRO berish'}
                        </button>
                        {!isSelfOwner && (
                          <button
                            type="button"
                            onClick={() => onToggleBlockUser(u.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                              u.blocked
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {u.blocked ? 'Blokdan yechish' : 'Bloklash'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {section === 'operations' && (
            <div className="space-y-6">
              <div className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
                <h2 className="font-heading font-bold text-lg text-white">Turnirlar boshqaruvi</h2>
                {state.tournaments.length === 0 ? (
                  <p className="text-xs text-slate-400">Hozircha turnirlar yaratilmagan.</p>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {state.tournaments.map((t) => (
                      <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-white">{t.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {t.gameTitle} · {t.prize} · {t.participants.length} ishtirokchi
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={t.status}
                            onChange={(e) =>
                              onUpdateTournamentStatus(t.id, e.target.value as NexplayTournament['status'])
                            }
                            className="nx-input rounded-lg px-2.5 py-1.5 text-xs cursor-pointer"
                          >
                            <option value="upcoming">Tez kunda</option>
                            <option value="live">Jonli</option>
                            <option value="finished">Yakunlangan</option>
                          </select>
                          <button
                            type="button"
                            aria-label="Turnirni o'chirish"
                            onClick={() => onDeleteTournament(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="nx-surface rounded-2xl p-5 space-y-3">
                  <h3 className="font-heading font-bold text-sm text-white">Multiplayer xonalar</h3>
                  {state.rooms.length === 0 ? (
                    <p className="text-xs text-slate-400">Faol xonalar yo'q.</p>
                  ) : (
                    <div className="divide-y divide-white/[0.06]">
                      {state.rooms.map((r) => (
                        <div key={r.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="font-medium text-white truncate">{r.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {r.gameTitle} · {r.players}/{r.maxPlayers}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteRoom(r.id)}
                            className="text-slate-400 hover:text-rose-400 text-[11px] cursor-pointer"
                          >
                            Yopish
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="nx-surface rounded-2xl p-5 space-y-3">
                  <h3 className="font-heading font-bold text-sm text-white">Hamjamiyat xabarlari</h3>
                  {state.communityPosts.length === 0 ? (
                    <p className="text-xs text-slate-400">Xabarlar yo'q.</p>
                  ) : (
                    <div className="divide-y divide-white/[0.06]">
                      {state.communityPosts.slice(0, 8).map((p) => (
                        <div key={p.id} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="font-medium text-white">{p.author}</div>
                            <p className="text-[11px] text-slate-300 line-clamp-2">{p.text}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteCommunityPost(p.id)}
                            className="text-slate-400 hover:text-rose-400 text-[11px] shrink-0 cursor-pointer"
                          >
                            O'chirish
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {section === 'modules' && (
            <div className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="font-heading font-bold text-lg text-white">Ekotizim modullari</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(state.modules) as Array<keyof NexplayModules>).map((key) => {
                  const enabled = state.modules[key];
                  return (
                    <div
                      key={key}
                      className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-white capitalize">{key}</span>
                      <button
                        type="button"
                        onClick={() => onToggleModule(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          enabled
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-white/[0.06] text-slate-400'
                        }`}
                      >
                        {enabled ? 'Yoqilgan' : "O'chirilgan"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {section === 'audit' && (
            <div className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="font-heading font-bold text-lg text-white">Audit jurnali</h2>
              {state.auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400">Jurnal hozircha bo'sh.</p>
              ) : (
                <div className="divide-y divide-white/[0.06] text-xs">
                  {state.auditLogs.map((log) => (
                    <div key={log.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-medium">{log.action}</div>
                        <div className="text-[11px] text-slate-400">@{log.actor}</div>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">{log.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === 'settings' && (
            <div className="space-y-6">
              {/* Complete Background & Gaming Atmosphere Studio */}
              <div id="admin-bg-studio" className="nx-surface rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading font-bold text-base sm:text-lg text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                      <span>Orqa Fon va Atmosfera Studiyasi</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kosmos sahnasi, harakatlanuvchi gaming qatlamlar, shaffoflik va maxsus fon mediasini boshqaring.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="admin-bg-reset-btn"
                    onClick={handleResetBgDefaults}
                    className="nx-btn-secondary px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Standart holat</span>
                  </button>
                </div>

                {/* Live Mini Atmosphere Preview */}
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.12] h-44 bg-[#04070f]">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 26% 24%, ${activeScene.accent}35 0%, transparent 50%), radial-gradient(circle at 78% 72%, ${activeScene.sec}2a 0%, transparent 55%), linear-gradient(155deg, ${activeScene.c1} 0%, ${activeScene.c0} 100%)`,
                    }}
                  />
                  {bgDraft.type === 'image' && isSafeMedia(bgDraft.url) && (
                    <img
                      src={bgDraft.url}
                      alt="Orqa fon ko'rigi"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        opacity: bgDraft.opacity,
                        filter: `blur(${bgDraft.blur}px)`,
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: `rgba(5, 8, 17, ${Math.min(0.92, Math.max(0.25, bgDraft.dim * 0.72))})` }}
                  />
                  {bgDraft.gridEnabled !== false && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-35 pointer-events-none"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${activeScene.accent}28 1px, transparent 1px), linear-gradient(to bottom, ${activeScene.accent}28 1px, transparent 1px)`,
                        backgroundSize: '28px 28px',
                      }}
                    />
                  )}
                  {bgDraft.particlesEnabled !== false && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 400 160"
                      className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
                      preserveAspectRatio="xMidYMid slice"
                    >
                      <circle cx="54" cy="42" r="2" fill={activeScene.accent} />
                      <circle cx="145" cy="94" r="1.5" fill={activeScene.sec} />
                      <circle cx="240" cy="48" r="2.2" fill="#e2e8f0" />
                      <circle cx="328" cy="76" r="1.8" fill={activeScene.accent} />
                      <circle cx="364" cy="36" r="1.4" fill={activeScene.sec} />
                      <line x1="54" y1="42" x2="145" y2="94" stroke={activeScene.accent} strokeOpacity="0.22" strokeWidth="1" />
                      <line x1="145" y1="94" x2="240" y2="48" stroke={activeScene.sec} strokeOpacity="0.22" strokeWidth="1" />
                    </svg>
                  )}
                  {bgDraft.streaksEnabled !== false && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-1/2 h-px pointer-events-none"
                      style={{
                        background: `linear-gradient(90deg, transparent 5%, ${activeScene.accent}99 45%, ${activeScene.sec}aa 65%, transparent 95%)`,
                        boxShadow: `0 0 12px ${activeScene.accent}`,
                      }}
                    />
                  )}
                  <div className="relative z-10 h-full p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="font-semibold text-cyan-300">Jonli fon ko'rigi · {activeScene.name}</span>
                      <span className="font-mono-tabular">
                        Tezlik: {Number(bgDraft.motionIntensity ?? 1).toFixed(1)}x
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 flex flex-wrap gap-3">
                      <span>Setka: {bgDraft.gridEnabled !== false ? 'Yoqilgan' : 'O‘chiq'}</span>
                      <span>·</span>
                      <span>Zarralar: {bgDraft.particlesEnabled !== false ? 'Yoqilgan' : 'O‘chiq'}</span>
                      <span>·</span>
                      <span>Parallaks: {bgDraft.parallaxEnabled !== false ? 'Yoqilgan' : 'O‘chiq'}</span>
                    </div>
                  </div>
                </div>

                {/* Cosmos Scene Switcher */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-300">Koinot sahnasi</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {COSMOS_SCENES.map((sc, idx) => {
                      const selected = cosmosSceneIdx % COSMOS_SCENES.length === idx;
                      return (
                        <button
                          key={sc.name}
                          type="button"
                          onClick={() => onSelectCosmosScene(idx)}
                          className={`rounded-xl p-3 text-left border transition-colors cursor-pointer ${
                            selected
                              ? 'border-cyan-400/55 bg-white/[0.08] text-white'
                              : 'border-white/[0.08] bg-white/[0.025] text-slate-300 hover:border-white/[0.2]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ background: `linear-gradient(135deg, ${sc.accent}, ${sc.sec})` }}
                            />
                            <span className="text-xs font-semibold truncate">{sc.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Animated Gaming Layer Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'bg-toggle-grid',
                      label: 'Perspektiv gaming setkasi',
                      checked: bgDraft.gridEnabled !== false,
                      onChange: (val: boolean) => updateBgImmediate({ gridEnabled: val }),
                    },
                    {
                      id: 'bg-toggle-particles',
                      label: 'Konstellatsiya zarralari',
                      checked: bgDraft.particlesEnabled !== false,
                      onChange: (val: boolean) => updateBgImmediate({ particlesEnabled: val }),
                    },
                    {
                      id: 'bg-toggle-streaks',
                      label: 'Energiya nurlari va skan',
                      checked: bgDraft.streaksEnabled !== false,
                      onChange: (val: boolean) => updateBgImmediate({ streaksEnabled: val }),
                    },
                    {
                      id: 'bg-toggle-parallax',
                      label: 'Kursor parallaks effekti',
                      checked: bgDraft.parallaxEnabled !== false,
                      onChange: (val: boolean) => updateBgImmediate({ parallaxEnabled: val }),
                    },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="text-xs text-slate-200 flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-2.5 border border-white/[0.06] cursor-pointer"
                    >
                      <span>{item.label}</span>
                      <input
                        id={item.id}
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.onChange(e.target.checked)}
                        className="accent-cyan-400"
                      />
                    </label>
                  ))}
                </div>

                {/* Custom Background Media & Fine-Tune Sliders */}
                <div className="space-y-4 pt-2 border-t border-white/[0.08]">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <select
                      value={bgDraft.type}
                      onChange={(e) =>
                        updateBgImmediate({
                          type: e.target.value as 'none' | 'image' | 'video',
                        })
                      }
                      className="nx-input rounded-xl px-3.5 py-2.5 text-xs cursor-pointer"
                    >
                      <option value="none">Maxsus fon o'chirilgan</option>
                      <option value="image">Rasm (URL / Fayl)</option>
                      <option value="video">Video (MP4/WebM URL)</option>
                    </select>
                    <input
                      type="text"
                      value={bgDraft.url}
                      onChange={(e) => setBgDraft({ ...bgDraft, url: e.target.value })}
                      placeholder="https://... yoki o'ngdan rasm yuklang"
                      className="nx-input sm:col-span-2 rounded-xl px-3.5 py-2.5 text-xs"
                    />
                    <label className="nx-btn-secondary px-3.5 py-2.5 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fayl yuklash</span>
                      <input
                        type="file"
                        accept="image/*,video/mp4,video/webm"
                        onChange={handleBgImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="text-xs text-slate-300 space-y-1.5">
                      <span>Media shaffofligi ({Math.round(Number(bgDraft.opacity ?? 0.28) * 100)}%)</span>
                      <input
                        id="admin-bg-opacity"
                        type="range"
                        min="0.05"
                        max="0.85"
                        step="0.05"
                        value={bgDraft.opacity}
                        onChange={(e) => updateBgImmediate({ opacity: Number(e.target.value) })}
                        className="w-full accent-cyan-400"
                      />
                    </label>
                    <label className="text-xs text-slate-300 space-y-1.5">
                      <span>Xiralashtirish ({Number(bgDraft.blur ?? 0)}px)</span>
                      <input
                        id="admin-bg-blur"
                        type="range"
                        min="0"
                        max="16"
                        step="1"
                        value={bgDraft.blur}
                        onChange={(e) => updateBgImmediate({ blur: Number(e.target.value) })}
                        className="w-full accent-cyan-400"
                      />
                    </label>
                    <label className="text-xs text-slate-300 space-y-1.5">
                      <span>Kontrast qoraytirish ({Math.round(Number(bgDraft.dim ?? 0.84) * 100)}%)</span>
                      <input
                        id="admin-bg-dim"
                        type="range"
                        min="0.35"
                        max="0.95"
                        step="0.03"
                        value={bgDraft.dim}
                        onChange={(e) => updateBgImmediate({ dim: Number(e.target.value) })}
                        className="w-full accent-blue-500"
                      />
                    </label>
                    <label className="text-xs text-slate-300 space-y-1.5">
                      <span>Harakat intensivligi ({Number(bgDraft.motionIntensity ?? 1).toFixed(1)}x)</span>
                      <input
                        id="admin-bg-motion"
                        type="range"
                        min="0.3"
                        max="1.8"
                        step="0.1"
                        value={bgDraft.motionIntensity ?? 1}
                        onChange={(e) => updateBgImmediate({ motionIntensity: Number(e.target.value) })}
                        className="w-full accent-violet-400"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <label className="nx-btn-secondary px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>JSON zaxiradan tiklash</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          void f.text().then((txt) => onImportStateJson(txt));
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      id="admin-bg-apply-btn"
                      onClick={() => {
                        if (bgDraft.type !== 'none' && bgDraft.url && !isSafeMedia(bgDraft.url)) {
                          onNotify("Faqat xavfsiz http/https yoki media data manzillari ruxsat etiladi.", 'error');
                          return;
                        }
                        onUpdateBgMedia(bgDraft);
                      }}
                      className="nx-btn-primary px-5 py-2 rounded-xl text-xs cursor-pointer"
                    >
                      Fon sozlamasini saqlash
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic RGB Controls */}
              <div className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-heading font-bold text-base text-white">
                    Dinamik RGB Tizimi
                  </h2>
                  <div className="flex items-center gap-2">
                    {(['static', 'cycle', 'pulse'] as RgbMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onUpdateRgb({ ...state.rgb, mode })}
                        className={`px-3 py-1 rounded-lg text-xs cursor-pointer ${
                          state.rgb.mode === mode
                            ? 'bg-white/[0.12] text-white font-semibold'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(RGB_PRESETS).map(([name, cfg]) => (
                    <button
                      key={name}
                      type="button"
                      id={`admin-rgb-${name}`}
                      onClick={() => onUpdateRgb({ ...cfg })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border cursor-pointer ${
                        state.rgb.preset === name
                          ? 'bg-white/[0.12] border-white/[0.25] text-white font-semibold'
                          : 'bg-white/[0.03] border-white/[0.08] text-slate-300'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: `rgb(${cfg.r}, ${cfg.g}, ${cfg.b})` }}
                      />
                      <span>{name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <label className="text-xs text-slate-300 space-y-1">
                    <span>Yorqinlik ({state.rgb.glow.toFixed(2)})</span>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={state.rgb.glow}
                      onChange={(e) => onUpdateRgb({ ...state.rgb, glow: Number(e.target.value) })}
                      className="w-full accent-blue-500"
                    />
                  </label>
                  <label className="text-xs text-slate-300 space-y-1">
                    <span>Sikl tezligi ({state.rgb.speed}s)</span>
                    <input
                      type="range"
                      min="4"
                      max="24"
                      step="1"
                      value={state.rgb.speed}
                      onChange={(e) => onUpdateRgb({ ...state.rgb, speed: Number(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </label>
                  <label className="text-xs text-slate-300 flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2 border border-white/[0.06] cursor-pointer">
                    <span>Maxsus asosiy rang</span>
                    <input
                      type="color"
                      value={primaryHex}
                      onChange={(e) => {
                        const parsed = hexToRgb(e.target.value);
                        if (parsed) {
                          onUpdateRgb({ ...state.rgb, ...parsed, preset: 'Maxsus' });
                        }
                      }}
                      className="w-8 h-6 rounded border-0 bg-transparent cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* CMS Editor */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onUpdateCms(cmsDraft);
                }}
                className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4"
              >
                <h2 className="font-heading font-bold text-base text-white">CMS va E'lon paneli</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1" htmlFor="cms-hero-title">
                      Bosh sarlavha
                    </label>
                    <input
                      id="cms-hero-title"
                      type="text"
                      value={cmsDraft.heroTitle}
                      onChange={(e) => setCmsDraft({ ...cmsDraft, heroTitle: e.target.value })}
                      className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1" htmlFor="cms-hero-sub">
                      Tavsif matni
                    </label>
                    <input
                      id="cms-hero-sub"
                      type="text"
                      value={cmsDraft.heroSubtitle}
                      onChange={(e) => setCmsDraft({ ...cmsDraft, heroSubtitle: e.target.value })}
                      className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1" htmlFor="cms-hero-cta">
                        Asosiy tugma matni
                      </label>
                      <input
                        id="cms-hero-cta"
                        type="text"
                        value={cmsDraft.heroCta}
                        onChange={(e) => setCmsDraft({ ...cmsDraft, heroCta: e.target.value })}
                        className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1" htmlFor="cms-announcement">
                        Yuqori e'lon matni (bo'sh = yashirin)
                      </label>
                      <input
                        id="cms-announcement"
                        type="text"
                        value={cmsDraft.announcement}
                        onChange={(e) => setCmsDraft({ ...cmsDraft, announcement: e.target.value })}
                        placeholder="Masalan: Yangi turnir boshlandi!"
                        className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    id="cms-save-btn"
                    className="nx-btn-primary px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    CMS ni saqlash
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
