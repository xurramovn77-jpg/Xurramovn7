import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { Megaphone, X } from 'lucide-react';
import {
  COSMOS_SCENES,
  COSMOS_VISIT_KEY,
  OWNER_SEED_SECRET,
  RGB_PRESETS,
  SESSION_KEY,
  STORAGE_KEY,
} from './constants/nexplay';
import { SEED_CATEGORIES, SEED_GAMES, SEED_PACKAGES } from './constants/seedGames';
import type {
  AdminSectionKey,
  AuthTab,
  BgMediaConfig,
  NexplayCms,
  NexplayGame,
  NexplayModules,
  NexplayState,
  NexplayUser,
  ProfileTabKey,
  RgbConfig,
  ViewName,
} from './types/nexplay';
import {
  claimMissionReward,
  computePasswordHash,
  createBaseState,
  getLocalDateKey,
  hydrateStateDefaults,
  isOwnerUser,
  recordDailyLogin,
  recordDailyPlay,
  recordGameDailyPlay,
  resolveGlobalShortcut,
  validateRegistrationInput,
} from './utils/nexplayLogic';
import { idbPutPackage } from './utils/packageIdb';
import { sessionGet, sessionSet, storageGet, storageSet } from './utils/storage';
import { GlobalAtmosphere } from './components/GlobalAtmosphere';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SearchModal } from './components/SearchModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ToastContainer, type ToastItem, type ToastTone } from './components/Toast';
import { HomeView } from './components/views/HomeView';
import { CatalogView } from './components/views/CatalogView';
import { GameDetailsView } from './components/views/GameDetailsView';
import { PlayerView } from './components/views/PlayerView';
import {
  AchievementsView,
  CategoriesView,
  CommunityView,
  MultiplayerView,
  PremiumView,
  RankingsView,
  TournamentsView,
} from './components/views/SecondaryViews';
import { ProfileView } from './components/views/ProfileView';
import { AdminView } from './components/views/AdminView';

function nowFormatted(): string {
  return new Date().toLocaleString('uz-UZ', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function App() {
  const [state, setState] = useState<NexplayState | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string>('');
  const [activeView, setActiveView] = useState<ViewName>('home');
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('');
  const [profileTab, setProfileTab] = useState<ProfileTabKey>('overview');
  const [adminSection, setAdminSection] = useState<AdminSectionKey>('dashboard');

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [cosmosIdx, setCosmosIdx] = useState<number>(() => {
    const saved = Number(storageGet(COSMOS_VISIT_KEY) ?? '0');
    const next = Number.isFinite(saved) ? (saved + 1) % COSMOS_SCENES.length : 0;
    storageSet(COSMOS_VISIT_KEY, String(next));
    return next;
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  // Initialize state from localStorage + seed IndexedDB packages
  useEffect(() => {
    let active = true;
    const init = async () => {
      // Always ensure seed packages exist in IndexedDB so default games launch cleanly
      for (const pkg of SEED_PACKAGES) {
        await idbPutPackage(pkg);
      }

      const raw = storageGet(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as NexplayState;
          if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.games)) {
            const today = getLocalDateKey();
            const savedSess = sessionGet(SESSION_KEY) || '';
            let hydratedState = hydrateStateDefaults(parsed, SEED_GAMES);
            if (savedSess) {
              hydratedState = {
                ...hydratedState,
                users: hydratedState.users.map((u) =>
                  u.id === savedSess ? recordDailyLogin(u, today) : u
                ),
              };
            }
            if (active) {
              setState(hydratedState);
              if (savedSess) setSessionUserId(savedSess);
            }
            return;
          }
        } catch {
          // Fall through to fresh initialization if storage was corrupted
        }
      }

      const ownerHash = await computePasswordHash(OWNER_SEED_SECRET, 'nx_alpha_salt_v10');
      const fresh = createBaseState(ownerHash, SEED_GAMES, SEED_CATEGORIES);
      storageSet(STORAGE_KEY, JSON.stringify(fresh));
      if (active) {
        setState(fresh);
        const savedSess = sessionGet(SESSION_KEY) || '';
        if (savedSess) setSessionUserId(savedSess);
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    if (!state) return;
    storageSet(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Sync dynamic RGB CSS variables and body mode classes
  useEffect(() => {
    if (!state) return;
    const rgb = state.rgb;
    const root = document.documentElement;
    root.style.setProperty('--rgb-r', String(rgb.r));
    root.style.setProperty('--rgb-g', String(rgb.g));
    root.style.setProperty('--rgb-b', String(rgb.b));
    root.style.setProperty('--rgb-sec-r', String(rgb.secR));
    root.style.setProperty('--rgb-sec-g', String(rgb.secG));
    root.style.setProperty('--rgb-sec-b', String(rgb.secB));
    root.style.setProperty('--rgb-acc-r', String(rgb.accR));
    root.style.setProperty('--rgb-acc-g', String(rgb.accG));
    root.style.setProperty('--rgb-acc-b', String(rgb.accB));
    root.style.setProperty('--rgb-glow', String(rgb.glow));
    root.style.setProperty('--rgb-speed', `${rgb.speed}s`);
    root.style.setProperty('--rgb-grad-deg', `${rgb.deg}deg`);
    root.style.setProperty('--rgb-bg-dim', String(state.bgMedia?.dim ?? 0.84));

    document.body.classList.remove('nx-rgb-mode-cycle', 'nx-rgb-mode-pulse');
    if (rgb.mode === 'cycle') document.body.classList.add('nx-rgb-mode-cycle');
    if (rgb.mode === 'pulse') document.body.classList.add('nx-rgb-mode-pulse');
  }, [state?.rgb, state?.bgMedia?.dim]);

  // Subtle depth-aware pointer parallax via relative percentage --px-x / --px-y CSS variables
  const parallaxEnabled = state?.bgMedia?.parallaxEnabled !== false;
  useEffect(() => {
    const root = document.documentElement;
    const reducedMq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const resetParallax = () => {
      root.style.setProperty('--px-x', '0%');
      root.style.setProperty('--px-y', '0%');
    };

    if (!parallaxEnabled || reducedMq?.matches || isTouchDevice) {
      resetParallax();
      return;
    }

    let rafId = 0;
    let latestXPct = 0;
    let latestYPct = 0;

    const applyParallax = () => {
      root.style.setProperty('--px-x', `${latestXPct.toFixed(2)}%`);
      root.style.setProperty('--px-y', `${latestYPct.toFixed(2)}%`);
      rafId = 0;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (reducedMq?.matches) return;
      latestXPct = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 100;
      latestYPct = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 100;
      if (!rafId) {
        rafId = window.requestAnimationFrame(applyParallax);
      }
    };

    const handleMouseLeave = () => {
      latestXPct = 0;
      latestYPct = 0;
      if (!rafId) {
        rafId = window.requestAnimationFrame(applyParallax);
      }
    };

    const handleReducedMotionChange = () => {
      if (reducedMq?.matches) {
        resetParallax();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('blur', handleMouseLeave);
    reducedMq?.addEventListener?.('change', handleReducedMotionChange);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('blur', handleMouseLeave);
      reducedMq?.removeEventListener?.('change', handleReducedMotionChange);
      if (rafId) window.cancelAnimationFrame(rafId);
      resetParallax();
    };
  }, [parallaxEnabled]);

  const currentUser = useMemo<NexplayUser | null>(() => {
    if (!state || !sessionUserId) return null;
    const found = state.users.find((u) => u.id === sessionUserId);
    if (!found || found.blocked) return null;
    return found;
  }, [state, sessionUserId]);

  const mutateState = useCallback((updater: (prev: NexplayState) => NexplayState) => {
    setState((prev) => (prev ? updater(prev) : prev));
  }, []);

  const appendAudit = useCallback(
    (prev: NexplayState, action: string, actor?: string): NexplayState['auditLogs'] => {
      const log = {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actor: actor || currentUser?.username || 'tizim',
        action,
        time: nowFormatted(),
      };
      return [log, ...prev.auditLogs].slice(0, 60);
    },
    [currentUser?.username]
  );

  const navigate = useCallback((view: ViewName) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenAuth = useCallback((tab: AuthTab) => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  }, []);

  const handleLogin = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      if (!state) return 'Tizim yuklanmoqda...';
      const user = state.users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (!user) return "Foydalanuvchi topilmadi.";
      if (user.blocked) return "Bu hisob administrator tomonidan bloklangan.";
      const computed = await computePasswordHash(password, user.salt);
      if (computed !== user.passwordHash) return "Parol noto'g'ri.";

      const today = getLocalDateKey();
      mutateState((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === user.id ? recordDailyLogin(u, today) : u)),
      }));

      setSessionUserId(user.id);
      sessionSet(SESSION_KEY, user.id);
      setAuthModalOpen(false);
      notify(`Xush kelibsiz, ${user.displayName || user.username}!`, 'success');
      if (isOwnerUser(user)) {
        setAdminSection('dashboard');
        navigate('admin');
      }
      return null;
    },
    [state, mutateState, navigate, notify]
  );

  const handleRegister = useCallback(
    async (username: string, password: string, confirm: string): Promise<string | null> => {
      if (!state) return 'Tizim yuklanmoqda...';
      const cleanName = username.trim();
      const validationErr = validateRegistrationInput({
        username: cleanName,
        password,
        confirm,
        existingUsers: state.users,
      });
      if (validationErr) return validationErr;

      const salt = `nx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const hash = await computePasswordHash(password, salt);
      const today = getLocalDateKey();
      const newUser: NexplayUser = {
        id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        username: cleanName,
        salt,
        passwordHash: hash,
        role: 'USER',
        blocked: false,
        firstName: cleanName,
        lastName: '',
        displayName: cleanName,
        nickname: `@${cleanName.toLowerCase()}`,
        favoriteGenre: '',
        region: "O'zbekiston",
        bio: '',
        avatarData: '',
        premium: false,
        favorites: [],
        history: [],
        achievements: [],
        loginStreak: 1,
        lastLoginDate: today,
        dailyPlaysDate: today,
        dailyPlaysCount: 0,
        claimedMissions: [],
        badges: [],
        unlockedThemes: ['default'],
        activeTheme: 'default',
        createdAt: new Date().toISOString(),
      };

      mutateState((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        auditLogs: appendAudit(prev, `Yangi hisob yaratildi: @${newUser.username}`, newUser.username),
      }));

      setSessionUserId(newUser.id);
      sessionSet(SESSION_KEY, newUser.id);
      setAuthModalOpen(false);
      notify("Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!", 'success');
      return null;
    },
    [state, mutateState, appendAudit, notify]
  );

  const handleLogout = useCallback(() => {
    setSessionUserId('');
    sessionSet(SESSION_KEY, '');
    if (activeView === 'admin' || activeView === 'profile') {
      navigate('home');
    }
    notify('Tizimdan chiqdingiz.', 'info');
  }, [activeView, navigate, notify]);

  const handlePlayGame = useCallback(
    (gameId: string) => {
      setSelectedGameId(gameId);
      setActiveView('player');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const today = getLocalDateKey();
      mutateState((prev) => {
        const game = prev.games.find((g) => g.id === gameId);
        if (!game) return prev;
        const nextGames = prev.games.map((g) =>
          g.id === gameId ? recordGameDailyPlay(g, today) : g
        );
        const nextUsers = sessionUserId
          ? prev.users.map((u) => {
              if (u.id !== sessionUserId) return u;
              const nextHistory = [
                { gameId: game.id, title: game.title, at: nowFormatted() },
                ...u.history,
              ].slice(0, 20);
              const nextAch = u.achievements.includes('first-play')
                ? u.achievements
                : [...u.achievements, 'first-play'];
              const updatedPlay = recordDailyPlay(u, today);
              return { ...updatedPlay, history: nextHistory, achievements: nextAch };
            })
          : prev.users;

        return {
          ...prev,
          games: nextGames,
          users: nextUsers,
          stats: { ...prev.stats, totalLaunches: Number(prev.stats.totalLaunches || 0) + 1 },
        };
      });
    },
    [mutateState, sessionUserId]
  );

  const handleDetailsGame = useCallback((gameId: string) => {
    setSelectedGameId(gameId);
    setActiveView('game-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleToggleFavorite = useCallback(
    (gameId: string) => {
      if (!currentUser) {
        handleOpenAuth('login');
        notify("Sevimlilarga saqlash uchun tizimga kiring.", 'info');
        return;
      }
      const already = currentUser.favorites.includes(gameId);
      mutateState((prev) => ({
        ...prev,
        users: prev.users.map((u) => {
          if (u.id !== currentUser.id) return u;
          const favs = already
            ? u.favorites.filter((id) => id !== gameId)
            : [...u.favorites, gameId];
          const achs =
            !already && !u.achievements.includes('favorite-pick')
              ? [...u.achievements, 'favorite-pick']
              : u.achievements;
          return { ...u, favorites: favs, achievements: achs };
        }),
      }));
      notify(already ? "Sevimlilardan olib tashlandi." : "Sevimlilarga qo'shildi.", 'success');
    },
    [currentUser, handleOpenAuth, mutateState, notify]
  );

  const handleSelectRgbPreset = useCallback(
    (presetName: string) => {
      const preset = RGB_PRESETS[presetName];
      if (!preset) return;
      mutateState((prev) => ({ ...prev, rgb: { ...preset } }));
      notify(`Muhit rangi: ${presetName}`, 'info');
    },
    [mutateState, notify]
  );

  const handleToggleAnnouncement = useCallback(() => {
    setAnnouncementVisible((prev) => {
      const next = !prev;
      notify(next ? "E'lon paneli ko'rsatildi." : "E'lon paneli yopildi.", 'info');
      return next;
    });
  }, [notify]);

  // Global keyboard shortcut handler for rapid navigation & accessibility controls
  useEffect(() => {
    if (!state) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || authModalOpen || confirmState.open) return;

      const target = e.target as HTMLElement | null;
      const action = resolveGlobalShortcut({
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        targetTagName: target?.tagName,
        isContentEditable: Boolean(target?.isContentEditable),
        isOwner: isOwnerUser(currentUser),
      });

      if (!action) return;

      if (action.type === 'escape') {
        if (searchModalOpen) {
          e.preventDefault();
          setSearchModalOpen(false);
          return;
        }
        if (shortcutsModalOpen) {
          e.preventDefault();
          setShortcutsModalOpen(false);
        }
        return;
      }

      if (action.type === 'toggle-search') {
        e.preventDefault();
        setShortcutsModalOpen(false);
        setSearchModalOpen((prev) => !prev);
        return;
      }

      if (searchModalOpen) return;

      if (action.type === 'toggle-shortcuts') {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      if (shortcutsModalOpen) return;

      if (action.type === 'toggle-announcement') {
        e.preventDefault();
        handleToggleAnnouncement();
        return;
      }

      if (action.type === 'navigate') {
        const modKey = action.view as keyof NexplayModules;
        if (modKey in state.modules && !state.modules[modKey]) return;
        e.preventDefault();
        navigate(action.view);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    state,
    authModalOpen,
    confirmState.open,
    searchModalOpen,
    shortcutsModalOpen,
    currentUser,
    navigate,
    handleToggleAnnouncement,
  ]);

  if (!state) {
    return (
      <div className="min-h-screen bg-[#050811] text-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
      </div>
    );
  }

  const activeGame =
    state.games.find((g) => g.id === selectedGameId) || state.games[0] || null;
  const relatedGames = activeGame
    ? state.games
        .filter((g) => g.published && g.id !== activeGame.id && g.category === activeGame.category)
        .slice(0, 3)
    : [];

  const cosmosScene =
    COSMOS_SCENES[((cosmosIdx % COSMOS_SCENES.length) + COSMOS_SCENES.length) % COSMOS_SCENES.length];

  const announcementText =
    state.cms.announcement.trim() ||
    "Tezkor navigatsiya: H — Bosh sahifa, C — Katalog, P — Profil, / — Qidiruv, A — E'lon paneli, ? — Barcha yorliqlar.";
  const showAnnouncement = announcementVisible;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen flex flex-col text-slate-100">
        <GlobalAtmosphere
          activeView={activeView}
          authBoostActive={authModalOpen}
          cosmosSceneIdx={cosmosIdx}
          bgMedia={state.bgMedia}
        />

        <div className="relative z-10 flex-1 flex flex-col">
          {showAnnouncement && (
            <div
              id="cms-announcement-bar"
              className="border-b border-cyan-400/20 bg-cyan-950/50 backdrop-blur-md px-4 py-2 text-xs text-cyan-100"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Megaphone className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  <span className="truncate">{announcementText}</span>
                </div>
                <button
                  type="button"
                  id="cms-announcement-close"
                  aria-label="E'lonni yopish"
                  onClick={() => setAnnouncementVisible(false)}
                  className="text-cyan-300 hover:text-white cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <Navbar
            activeView={activeView}
            currentUser={currentUser}
            modules={state.modules}
            onNavigate={navigate}
            onOpenAuth={handleOpenAuth}
            onOpenProfileTab={(tab) => {
              setProfileTab(tab);
              navigate('profile');
            }}
            onOpenSearch={() => setSearchModalOpen(true)}
            onLogout={handleLogout}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-7">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeView === 'home' && (
                  <HomeView
                    state={state}
                    currentUser={currentUser}
                    onNavigate={navigate}
                    onSelectCategory={(cat) => {
                      setCatalogCategory(cat);
                      navigate('catalog');
                    }}
                    onPlayGame={handlePlayGame}
                    onDetailsGame={handleDetailsGame}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}

                {activeView === 'catalog' && (
                  <CatalogView
                    state={state}
                    currentUser={currentUser}
                    categoryFilter={catalogCategory}
                    onCategoryChange={setCatalogCategory}
                    onNavigate={navigate}
                    onPlayGame={handlePlayGame}
                    onDetailsGame={handleDetailsGame}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}

                {activeView === 'game-details' && (
                  <GameDetailsView
                    game={activeGame}
                    relatedGames={relatedGames}
                    comments={state.comments || []}
                    currentUser={currentUser}
                    onBack={() => navigate('catalog')}
                    onPlay={handlePlayGame}
                    onDetails={handleDetailsGame}
                    onToggleFavorite={handleToggleFavorite}
                    onRequireAuth={() => handleOpenAuth('login')}
                    onAddComment={(gameId, rating, text) => {
                      if (!currentUser) {
                        handleOpenAuth('login');
                        return 'Sharh qoldirish uchun tizimga kiring.';
                      }
                      const cleanText = text.trim();
                      if (cleanText.length < 3) {
                        return "Sharh kamida 3 ta belgidan iborat bo'lishi kerak.";
                      }
                      mutateState((prev) => ({
                        ...prev,
                        comments: [
                          {
                            id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                            gameId,
                            userId: currentUser.id,
                            author: currentUser.displayName || currentUser.username,
                            authorUsername: currentUser.username,
                            rating: Math.min(5, Math.max(1, Math.round(rating))),
                            text: cleanText,
                            createdAt: new Date().toISOString(),
                          },
                          ...(prev.comments || []),
                        ],
                      }));
                      notify("Sharhingiz muvaffaqiyatli qo'shildi!", 'success');
                      return null;
                    }}
                    onDeleteComment={(commentId) => {
                      mutateState((prev) => ({
                        ...prev,
                        comments: (prev.comments || []).filter((c) => c.id !== commentId),
                      }));
                      notify("Sharh o'chirildi.", 'info');
                    }}
                  />
                )}

                {activeView === 'player' && (
                  <PlayerView
                    game={activeGame}
                    currentUser={currentUser}
                    onBack={() => navigate('catalog')}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}

                {activeView === 'categories' && (
                  <CategoriesView
                    state={state}
                    currentUser={currentUser}
                    onNavigate={navigate}
                    onSelectCategory={(cat) => {
                      setCatalogCategory(cat);
                      navigate('catalog');
                    }}
                  />
                )}

                {activeView === 'tournaments' && (
                  <TournamentsView
                    state={state}
                    currentUser={currentUser}
                    onNavigate={navigate}
                    onCreateTournament={(tTitle, gTitle, prize, startsAt) => {
                      mutateState((prev) => ({
                        ...prev,
                        tournaments: [
                          {
                            id: `trn-${Date.now()}`,
                            title: tTitle,
                            gameTitle: gTitle,
                            prize,
                            startsAt,
                            status: 'upcoming',
                            participants: [],
                          },
                          ...prev.tournaments,
                        ],
                        auditLogs: appendAudit(prev, `Turnir yaratildi: ${tTitle}`),
                      }));
                      notify('Yangi turnir yaratildi.', 'success');
                    }}
                    onJoinTournament={(tId) => {
                      if (!currentUser) {
                        handleOpenAuth('login');
                        return;
                      }
                      mutateState((prev) => ({
                        ...prev,
                        tournaments: prev.tournaments.map((tr) =>
                          tr.id === tId && !tr.participants.includes(currentUser.username)
                            ? { ...tr, participants: [...tr.participants, currentUser.username] }
                            : tr
                        ),
                      }));
                      notify("Turnirga muvaffaqiyatli qo'shildingiz.", 'success');
                    }}
                  />
                )}

                {activeView === 'rankings' && (
                  <RankingsView state={state} currentUser={currentUser} onNavigate={navigate} />
                )}

                {activeView === 'community' && (
                  <CommunityView
                    state={state}
                    currentUser={currentUser}
                    onNavigate={navigate}
                    onRequireAuth={() => handleOpenAuth('login')}
                    onAddPost={(text) => {
                      if (!currentUser) return;
                      mutateState((prev) => ({
                        ...prev,
                        communityPosts: [
                          {
                            id: `post-${Date.now()}`,
                            author: currentUser.displayName || currentUser.username,
                            authorUsername: currentUser.username,
                            text,
                            time: nowFormatted(),
                          },
                          ...prev.communityPosts,
                        ],
                      }));
                      notify('Xabar hamjamiyatga joylandi.', 'success');
                    }}
                    onDeletePost={(postId) => {
                      mutateState((prev) => ({
                        ...prev,
                        communityPosts: prev.communityPosts.filter((p) => p.id !== postId),
                      }));
                      notify("Xabar o'chirildi.", 'info');
                    }}
                  />
                )}

                {activeView === 'achievements' && (
                  <AchievementsView state={state} currentUser={currentUser} onNavigate={navigate} />
                )}

                {activeView === 'premium' && (
                  <PremiumView
                    state={state}
                    currentUser={currentUser}
                    onNavigate={navigate}
                    onRequireAuth={() => handleOpenAuth('login')}
                    onTogglePremium={() => {
                      if (!currentUser) return;
                      const nextPro = !currentUser.premium;
                      mutateState((prev) => ({
                        ...prev,
                        users: prev.users.map((u) =>
                          u.id === currentUser.id ? { ...u, premium: nextPro } : u
                        ),
                      }));
                      notify(nextPro ? 'NEXPLAY PRO faollashtirildi!' : 'PRO holati bekor qilindi.', 'success');
                    }}
                  />
                )}

                {activeView === 'multiplayer' && (
                  <MultiplayerView
                    state={state}
                    currentUser={currentUser}
                    onNavigate={navigate}
                    onRequireAuth={() => handleOpenAuth('login')}
                    onCreateRoom={(name, gameTitle) => {
                      if (!currentUser) return;
                      mutateState((prev) => ({
                        ...prev,
                        rooms: [
                          {
                            id: `room-${Date.now()}`,
                            name,
                            gameTitle,
                            host: currentUser.username,
                            players: 1,
                            maxPlayers: 8,
                            status: 'open',
                          },
                          ...prev.rooms,
                        ],
                      }));
                      notify('Multiplayer xona yaratildi.', 'success');
                    }}
                    onJoinRoom={(roomId) => {
                      if (!currentUser) {
                        handleOpenAuth('login');
                        return;
                      }
                      mutateState((prev) => ({
                        ...prev,
                        rooms: prev.rooms.map((r) =>
                          r.id === roomId && r.players < r.maxPlayers
                            ? { ...r, players: r.players + 1 }
                            : r
                        ),
                      }));
                      notify("Xonaga qo'shildingiz.", 'success');
                    }}
                  />
                )}

                {activeView === 'profile' && (
                  <ProfileView
                    state={state}
                    currentUser={currentUser}
                    activeTab={profileTab}
                    onChangeTab={setProfileTab}
                    onNavigate={navigate}
                    onOpenAuth={() => handleOpenAuth('login')}
                    onPlayGame={handlePlayGame}
                    onToggleFavorite={handleToggleFavorite}
                    onClaimMission={(missionId) => {
                      if (!currentUser) return;
                      const commentCount = (state.comments || []).filter(
                        (c) => c.userId === currentUser.id
                      ).length;
                      const res = claimMissionReward(
                        currentUser,
                        missionId,
                        commentCount,
                        getLocalDateKey()
                      );
                      if (!res.ok) {
                        notify(res.reason, 'error');
                        return;
                      }
                      mutateState((prev) => ({
                        ...prev,
                        users: prev.users.map((u) =>
                          u.id === currentUser.id ? res.user : u
                        ),
                      }));
                      notify(`Mukofot ochildi: ${res.mission.rewardLabel}!`, 'success');
                    }}
                    onSelectCosmeticTheme={(themeId) => {
                      if (!currentUser) return;
                      mutateState((prev) => ({
                        ...prev,
                        users: prev.users.map((u) =>
                          u.id === currentUser.id ? { ...u, activeTheme: themeId } : u
                        ),
                      }));
                      notify('Kosmetik mavzu profilga qo‘llandi.', 'success');
                    }}
                    onUpdateProfile={(patch) => {
                      if (!currentUser) return;
                      mutateState((prev) => ({
                        ...prev,
                        users: prev.users.map((u) => {
                          if (u.id !== currentUser.id) return u;
                          const achs = u.achievements.includes('profile-ready')
                            ? u.achievements
                            : [...u.achievements, 'profile-ready'];
                          return { ...u, ...patch, achievements: achs };
                        }),
                      }));
                      notify("Profil ma'lumotlari saqlandi.", 'success');
                    }}
                    onUpdatePassword={async (oldPass, newPass, confirmPass) => {
                      if (!currentUser) return 'Sessiya topilmadi.';
                      const oldHash = await computePasswordHash(oldPass, currentUser.salt);
                      if (oldHash !== currentUser.passwordHash) return "Joriy parol noto'g'ri.";
                      if (newPass.length < 6) return "Yangi parol kamida 6 belgidan iborat bo'lsin.";
                      if (newPass !== confirmPass) return 'Yangi parollar mos kelmadi.';
                      const nextHash = await computePasswordHash(newPass, currentUser.salt);
                      mutateState((prev) => ({
                        ...prev,
                        users: prev.users.map((u) =>
                          u.id === currentUser.id ? { ...u, passwordHash: nextHash } : u
                        ),
                      }));
                      notify('Parol yangilandi.', 'success');
                      return null;
                    }}
                  />
                )}

                {activeView === 'admin' && (
                  <AdminView
                    state={state}
                    currentUser={currentUser}
                    section={adminSection}
                    cosmosSceneIdx={cosmosIdx}
                    onChangeSection={setAdminSection}
                    onSelectCosmosScene={(idx) => {
                      setCosmosIdx(idx);
                      storageSet(COSMOS_VISIT_KEY, String(idx));
                      notify(`Koinot foni: ${COSMOS_SCENES[idx]?.name || ''}`, 'info');
                    }}
                    onBackHome={() => navigate('home')}
                    onPlayGame={handlePlayGame}
                    onNotify={notify}
                    onAddAudit={(action) => {
                      mutateState((prev) => ({
                        ...prev,
                        auditLogs: appendAudit(prev, action),
                      }));
                    }}
                    onPublishOrUpdateGame={(game: NexplayGame, isEdit: boolean) => {
                      mutateState((prev) => ({
                        ...prev,
                        games: isEdit
                          ? prev.games.map((g) => (g.id === game.id ? game : g))
                          : [game, ...prev.games],
                        auditLogs: appendAudit(
                          prev,
                          `${isEdit ? "O'yin yangilandi" : "Yangi o'yin qo'shildi"}: ${game.title}`
                        ),
                      }));
                      notify(isEdit ? "O'yin yangilandi." : "O'yin saqlandi!", 'success');
                    }}
                    onTogglePublishGame={(gameId) => {
                      mutateState((prev) => ({
                        ...prev,
                        games: prev.games.map((g) => {
                          if (g.id !== gameId) return g;
                          const nextPub = !g.published;
                          return {
                            ...g,
                            published: nextPub,
                            status: nextPub ? 'published' : 'draft',
                          };
                        }),
                        auditLogs: appendAudit(prev, `O'yin nashr holati o'zgartirildi (${gameId})`),
                      }));
                    }}
                    onToggleFeaturedGame={(gameId) => {
                      mutateState((prev) => ({
                        ...prev,
                        games: prev.games.map((g) =>
                          g.id === gameId ? { ...g, featured: !g.featured } : g
                        ),
                        auditLogs: appendAudit(prev, `Vitrina holati o'zgartirildi (${gameId})`),
                      }));
                    }}
                    onDeleteGame={(gameId) => {
                      setConfirmState({
                        open: true,
                        title: "O'yinni o'chirish",
                        message: "Ushbu o'yin katalogdan butunlay o'chiriladi. Davom etasizmi?",
                        onConfirm: () => {
                          setConfirmState((c) => ({ ...c, open: false }));
                          mutateState((prev) => ({
                            ...prev,
                            games: prev.games.filter((g) => g.id !== gameId),
                            comments: (prev.comments || []).filter((c) => c.gameId !== gameId),
                            auditLogs: appendAudit(prev, `O'yin o'chirildi (${gameId})`),
                          }));
                          notify("O'yin o'chirildi.", 'info');
                        },
                      });
                    }}
                    onAddCategory={(cat) => {
                      mutateState((prev) => {
                        if (prev.categories.includes(cat)) return prev;
                        return {
                          ...prev,
                          categories: [...prev.categories, cat],
                          auditLogs: appendAudit(prev, `Kategoriya qo'shildi: ${cat}`),
                        };
                      });
                      notify(`"${cat}" kategoriyasi qo'shildi.`, 'success');
                    }}
                    onDeleteCategory={(cat) => {
                      mutateState((prev) => ({
                        ...prev,
                        categories: prev.categories.filter((c) => c !== cat),
                        auditLogs: appendAudit(prev, `Kategoriya o'chirildi: ${cat}`),
                      }));
                      notify(`"${cat}" o'chirildi.`, 'info');
                    }}
                    onDeleteComment={(commentId) => {
                      mutateState((prev) => ({
                        ...prev,
                        comments: (prev.comments || []).filter((c) => c.id !== commentId),
                        auditLogs: appendAudit(prev, `Izoh o'chirildi (${commentId})`),
                      }));
                      notify("Izoh o'chirildi.", 'info');
                    }}
                    onToggleBlockUser={(userId) => {
                      mutateState((prev) => ({
                        ...prev,
                        users: prev.users.map((u) =>
                          u.id === userId ? { ...u, blocked: !u.blocked } : u
                        ),
                        auditLogs: appendAudit(prev, `Foydalanuvchi holati o'zgartirildi (${userId})`),
                      }));
                    }}
                    onToggleUserPremium={(userId) => {
                      mutateState((prev) => ({
                        ...prev,
                        users: prev.users.map((u) =>
                          u.id === userId ? { ...u, premium: !u.premium } : u
                        ),
                        auditLogs: appendAudit(prev, `PRO holati o'zgartirildi (${userId})`),
                      }));
                    }}
                    onUpdateTournamentStatus={(tId, status) => {
                      mutateState((prev) => ({
                        ...prev,
                        tournaments: prev.tournaments.map((t) =>
                          t.id === tId ? { ...t, status } : t
                        ),
                        auditLogs: appendAudit(prev, `Turnir holati o'zgartirildi (${tId}: ${status})`),
                      }));
                    }}
                    onDeleteTournament={(tId) => {
                      mutateState((prev) => ({
                        ...prev,
                        tournaments: prev.tournaments.filter((t) => t.id !== tId),
                        auditLogs: appendAudit(prev, `Turnir o'chirildi (${tId})`),
                      }));
                      notify("Turnir o'chirildi.", 'info');
                    }}
                    onDeleteRoom={(roomId) => {
                      mutateState((prev) => ({
                        ...prev,
                        rooms: prev.rooms.filter((r) => r.id !== roomId),
                        auditLogs: appendAudit(prev, `Multiplayer xona yopildi (${roomId})`),
                      }));
                      notify('Xona yopildi.', 'info');
                    }}
                    onDeleteCommunityPost={(postId) => {
                      mutateState((prev) => ({
                        ...prev,
                        communityPosts: prev.communityPosts.filter((p) => p.id !== postId),
                        auditLogs: appendAudit(prev, `Hamjamiyat xabari o'chirildi (${postId})`),
                      }));
                      notify("Xabar o'chirildi.", 'info');
                    }}
                    onToggleModule={(key: keyof NexplayModules) => {
                      mutateState((prev) => ({
                        ...prev,
                        modules: { ...prev.modules, [key]: !prev.modules[key] },
                        auditLogs: appendAudit(prev, `Modul o'zgartirildi: ${key}`),
                      }));
                    }}
                    onUpdateCms={(cms: NexplayCms) => {
                      mutateState((prev) => ({
                        ...prev,
                        cms,
                        auditLogs: appendAudit(prev, 'CMS matnlari yangilandi'),
                      }));
                      if (cms.announcement.trim()) setAnnouncementVisible(true);
                      notify('CMS saqlandi.', 'success');
                    }}
                    onUpdateBgMedia={(bgMedia: BgMediaConfig) => {
                      mutateState((prev) => ({
                        ...prev,
                        bgMedia,
                        auditLogs: appendAudit(prev, 'Fon/atmosfera sozlamalari yangilandi'),
                      }));
                    }}
                    onUpdateRgb={(rgb: RgbConfig) => {
                      mutateState((prev) => ({ ...prev, rgb }));
                    }}
                    onImportStateJson={async (jsonText) => {
                      try {
                        const parsed = JSON.parse(jsonText) as NexplayState;
                        if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.games)) {
                          notify("Noto'g'ri JSON zaxira formati.", 'error');
                          return;
                        }
                        setState(hydrateStateDefaults(parsed, SEED_GAMES));
                        notify('Zaxira muvaffaqiyatli tiklandi.', 'success');
                      } catch {
                        notify("JSON faylini o'qib bo'lmadi.", 'error');
                      }
                    }}
                  />
                )}
              </motion.div>
          </main>

          <Footer
            activePreset={state.rgb.preset}
            cosmosName={cosmosScene.name}
            onSelectRgbPreset={handleSelectRgbPreset}
            onCycleCosmos={() => {
              const next = (cosmosIdx + 1) % COSMOS_SCENES.length;
              setCosmosIdx(next);
              storageSet(COSMOS_VISIT_KEY, String(next));
              notify(`Koinot foni: ${COSMOS_SCENES[next].name}`, 'info');
            }}
            onOpenSearch={() => setSearchModalOpen(true)}
            onOpenShortcuts={() => setShortcutsModalOpen(true)}
            onToggleAnnouncement={handleToggleAnnouncement}
            onNavigate={navigate}
          />
        </div>

        <SearchModal
          open={searchModalOpen}
          state={state}
          currentUser={currentUser}
          onClose={() => setSearchModalOpen(false)}
          onNavigate={navigate}
          onSelectCategory={(cat) => {
            setCatalogCategory(cat);
            navigate('catalog');
          }}
          onPlayGame={handlePlayGame}
          onDetailsGame={handleDetailsGame}
          onToggleAnnouncement={handleToggleAnnouncement}
          onOpenShortcuts={() => setShortcutsModalOpen(true)}
          onCycleCosmos={() => {
            const next = (cosmosIdx + 1) % COSMOS_SCENES.length;
            setCosmosIdx(next);
            storageSet(COSMOS_VISIT_KEY, String(next));
            notify(`Koinot foni: ${COSMOS_SCENES[next].name}`, 'info');
          }}
        />

        <ShortcutsModal
          open={shortcutsModalOpen}
          isOwner={isOwnerUser(currentUser)}
          onClose={() => setShortcutsModalOpen(false)}
        />

        <AuthModal
          open={authModalOpen}
          initialTab={authTab}
          onClose={() => setAuthModalOpen(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />

        <ConfirmModal
          open={confirmState.open}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState((c) => ({ ...c, open: false }))}
        />

        <ToastContainer
          toasts={toasts}
          onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        />
      </div>
    </MotionConfig>
  );
}
