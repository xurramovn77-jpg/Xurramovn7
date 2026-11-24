import {
  BLOCKED_EXTS,
  COSMETIC_THEMES,
  DAILY_MISSIONS_CATALOG,
  OWNER_USERNAME,
  RGB_PRESETS,
} from '../constants/nexplay';
import type {
  CatalogSortOrder,
  DailyEngagementPoint,
  GlobalShortcutAction,
  MissionProgress,
  NexplayComment,
  NexplayGame,
  NexplayState,
  NexplayUser,
  RankedUser,
} from '../types/nexplay';

export function fastFallbackHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

export async function computePasswordHash(password: string, salt: string): Promise<string> {
  const text = `${salt}::${password}`;
  try {
    if (globalThis.crypto && globalThis.crypto.subtle && typeof TextEncoder !== 'undefined') {
      const buf = new TextEncoder().encode(text);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback below when SubtleCrypto is unavailable
  }
  return fastFallbackHash(text);
}

export function formatSize(bytes: number): string {
  const n = Number(bytes || 0);
  if (n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, idx)).toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export function isSafeMedia(url: string): boolean {
  const clean = String(url || '').trim();
  if (!clean) return false;
  if (clean.startsWith('data:image/') || clean.startsWith('data:video/')) {
    return !clean.toLowerCase().includes('svg+xml');
  }
  if (clean.startsWith('/') && !clean.startsWith('//')) return true;
  if (clean.startsWith('./') || clean.startsWith('../')) return true;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://nexplay.local';
    const u = new URL(clean, base);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getMimeType(filename: string): string {
  const low = String(filename || '').toLowerCase();
  if (low.endsWith('.html') || low.endsWith('.htm')) return 'text/html; charset=utf-8';
  if (low.endsWith('.js') || low.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
  if (low.endsWith('.css')) return 'text/css; charset=utf-8';
  if (low.endsWith('.json')) return 'application/json; charset=utf-8';
  if (low.endsWith('.png')) return 'image/png';
  if (low.endsWith('.jpg') || low.endsWith('.jpeg')) return 'image/jpeg';
  if (low.endsWith('.gif')) return 'image/gif';
  if (low.endsWith('.webp')) return 'image/webp';
  if (low.endsWith('.mp3')) return 'audio/mpeg';
  if (low.endsWith('.ogg')) return 'audio/ogg';
  if (low.endsWith('.wav')) return 'audio/wav';
  if (low.endsWith('.mp4')) return 'video/mp4';
  if (low.endsWith('.webm')) return 'video/webm';
  return 'application/octet-stream';
}

export function validateEntryPath(rawPath: string): { ok: true; path: string } | { ok: false; reason: string } {
  if (typeof rawPath !== 'string') {
    return { ok: false, reason: "Noto'g'ri fayl yo'li" };
  }
  if (rawPath.includes('\\') || rawPath.includes('\0')) {
    return { ok: false, reason: "Ruxsat etilmagan belgi yoki `\\` aniqlandi" };
  }
  if (rawPath.startsWith('/') || /^[a-zA-Z]:/.test(rawPath)) {
    return { ok: false, reason: "Absolyut yo'l taqiqlangan" };
  }
  const parts = rawPath.split('/').filter((p) => p.length > 0 && p !== '.');
  if (parts.some((p) => p === '..')) {
    return { ok: false, reason: "Katalogdan chiqish (`../`) urinishi bloklandi" };
  }
  return { ok: true, path: parts.join('/') };
}

export function findBlockedExt(pathStr: string): string {
  const low = String(pathStr || '').toLowerCase();
  for (const ext of BLOCKED_EXTS) {
    if (low.endsWith(ext)) return ext;
  }
  return '';
}

export function wrapSandboxedHtml(htmlText: string, assetMap: Record<string, string> = {}): string {
  let out = String(htmlText || '');
  out = out.replace(/((?:src|href)=["'])([^"']+)(["'])/gi, (full, pre, rel, suf) => {
    const clean = String(rel || '').trim();
    if (
      !clean ||
      clean.startsWith('#') ||
      clean.startsWith('http://') ||
      clean.startsWith('https://') ||
      clean.startsWith('data:') ||
      clean.startsWith('blob:') ||
      clean.startsWith('javascript:')
    ) {
      return full;
    }
    const norm = clean.replace(/^\.\/+/, '');
    if (assetMap[norm]) return `${pre}${assetMap[norm]}${suf}`;
    return full;
  });

  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https: http:; img-src * blob: data:; media-src * blob: data:; font-src * blob: data:;">`;
  const lockStorage = `<script>(function(){try{Object.defineProperty(window,'localStorage',{value:null});Object.defineProperty(window,'sessionStorage',{value:null});}catch(_){}})();</script>`;

  if (/<head[^>]*>/i.test(out)) {
    return out.replace(/<head([^>]*)>/i, `<head$1>${csp}${lockStorage}`);
  }
  return `${csp}${lockStorage}${out}`;
}

export function isOwnerUser(user: NexplayUser | null | undefined): boolean {
  return Boolean(user && user.username === OWNER_USERNAME && user.role === 'OWNER' && !user.blocked);
}

export function calcProfileCompletion(user: NexplayUser | null | undefined): number {
  if (!user) return 0;
  let pct = 20;
  if (user.displayName && user.displayName.trim()) pct += 20;
  if (user.nickname && user.nickname.trim()) pct += 15;
  if (user.bio && user.bio.trim()) pct += 15;
  if (user.favoriteGenre && user.favoriteGenre.trim()) pct += 15;
  if (user.avatarData && isSafeMedia(user.avatarData)) pct += 15;
  return Math.min(100, pct);
}

export function getRankedUsers(users: NexplayUser[]): RankedUser[] {
  return (users || [])
    .map((u) => {
      const sessions = Array.isArray(u.history) ? u.history.length : 0;
      const achs = Array.isArray(u.achievements) ? u.achievements.length : 0;
      return { ...u, sessions, achs, points: sessions * 10 + achs * 25 };
    })
    .sort((a, b) => b.points - a.points);
}

export function getPublishedGames(games: NexplayGame[]): NexplayGame[] {
  return (games || []).filter((g) => (g.status ? g.status === 'published' : Boolean(g.published)));
}

export function filterAndSortGames(
  games: NexplayGame[],
  query: string,
  category: string,
  sort: CatalogSortOrder
): NexplayGame[] {
  const q = query.trim().toLowerCase();
  const filtered = getPublishedGames(games).filter((g) => {
    const okQ =
      !q ||
      String(g.title || '').toLowerCase().includes(q) ||
      String(g.description || '').toLowerCase().includes(q) ||
      String(g.shortDescription || '').toLowerCase().includes(q) ||
      String(g.category || '').toLowerCase().includes(q);
    const okC = !category || g.category === category;
    return okQ && okC;
  });

  if (sort === 'popular') {
    return filtered.slice().sort((a, b) => Number(b.plays || 0) - Number(a.plays || 0));
  }
  if (sort === 'title') {
    return filtered.slice().sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
  }
  return filtered.slice().sort((a, b) => {
    const tA = Date.parse(String(a.createdAt || '')) || 0;
    const tB = Date.parse(String(b.createdAt || '')) || 0;
    return tB - tA;
  });
}

export function wrapCarouselIndex(current: number, delta: number, length: number): number {
  if (!Number.isFinite(length) || length <= 0) return 0;
  const safeCurrent = Number.isFinite(current) ? Math.trunc(current) : 0;
  const safeDelta = Number.isFinite(delta) ? Math.trunc(delta) : 0;
  return (((safeCurrent + safeDelta) % length) + length) % length;
}

export function hydrateSeedCovers(games: NexplayGame[], seedGames: NexplayGame[]): NexplayGame[] {
  if (!Array.isArray(games) || !Array.isArray(seedGames)) return games || [];
  const seedCoverById = new Map<string, string>();
  for (const sg of seedGames) {
    if (sg.id && sg.coverUrl) {
      seedCoverById.set(sg.id, sg.coverUrl);
    }
  }
  let changed = false;
  const next = games.map((g) => {
    if (g.coverUrl && g.coverUrl.trim()) return g;
    const seedCover = seedCoverById.get(g.id);
    if (!seedCover) return g;
    changed = true;
    return { ...g, coverUrl: seedCover };
  });
  return changed ? next : games;
}

export function resolveGlobalShortcut(params: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  targetTagName?: string;
  isContentEditable?: boolean;
  isOwner?: boolean;
}): GlobalShortcutAction | null {
  const rawKey = String(params.key || '');
  const lower = rawKey.toLowerCase();
  const tag = String(params.targetTagName || '').toUpperCase();
  const inEditable =
    Boolean(params.isContentEditable) ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT';

  if (rawKey === 'Escape') {
    return { type: 'escape' };
  }

  // Allow Ctrl+K / Cmd+K to toggle Search even inside editable elements
  if ((params.ctrlKey || params.metaKey) && !params.altKey && lower === 'k') {
    return { type: 'toggle-search' };
  }

  if (inEditable || params.ctrlKey || params.metaKey || params.altKey) {
    return null;
  }

  if (rawKey === '?' || (rawKey === '/' && params.shiftKey)) {
    return { type: 'toggle-shortcuts' };
  }
  if (rawKey === '/' || lower === 's') {
    return { type: 'toggle-search' };
  }
  if (lower === 'a') {
    return { type: 'toggle-announcement' };
  }
  if (lower === 'h') {
    return { type: 'navigate', view: 'home' };
  }
  if (lower === 'c') {
    return { type: 'navigate', view: 'catalog' };
  }
  if (lower === 'k') {
    return { type: 'navigate', view: 'categories' };
  }
  if (lower === 't') {
    return { type: 'navigate', view: 'tournaments' };
  }
  if (lower === 'r') {
    return { type: 'navigate', view: 'rankings' };
  }
  if (lower === 'j') {
    return { type: 'navigate', view: 'community' };
  }
  if (lower === 'p') {
    return { type: 'navigate', view: 'profile' };
  }
  if (lower === 'g' && params.isOwner) {
    return { type: 'navigate', view: 'admin' };
  }

  return null;
}

export function validateRegistrationInput(params: {
  username: string;
  password: string;
  confirm: string;
  existingUsers: NexplayUser[];
}): string | null {
  const username = params.username.trim();
  if (!/^[a-zA-Z0-9._-]{3,24}$/.test(username)) {
    return "Login 3–24 belgidan iborat bo'lsin (harf, raqam, . _ -).";
  }
  if (params.password.length < 6) {
    return "Parol kamida 6 ta belgidan iborat bo'lsin.";
  }
  if (params.password !== params.confirm) {
    return "Parollar mos kelmadi.";
  }
  if (params.existingUsers.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return "Bu login allaqachon ro'yxatdan o'tgan.";
  }
  return null;
}

export function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function diffDaysBetweenKeys(prevKey: string, nextKey: string): number {
  const t1 = Date.parse(`${prevKey}T00:00:00Z`);
  const t2 = Date.parse(`${nextKey}T00:00:00Z`);
  if (!Number.isFinite(t1) || !Number.isFinite(t2)) return 999;
  return Math.round((t2 - t1) / 86400000);
}

export function recordDailyLogin(user: NexplayUser, todayKey: string): NexplayUser {
  const last = user.lastLoginDate || '';
  const curStreak = Math.max(0, Number(user.loginStreak || 0));
  if (last === todayKey && curStreak >= 1) {
    return user;
  }
  const diff = last ? diffDaysBetweenKeys(last, todayKey) : 999;
  const nextStreak = diff === 1 ? curStreak + 1 : 1;
  return {
    ...user,
    lastLoginDate: todayKey,
    loginStreak: nextStreak,
  };
}

export function recordDailyPlay(user: NexplayUser, todayKey: string): NexplayUser {
  const sameDay = user.dailyPlaysDate === todayKey;
  const nextCount = sameDay ? Number(user.dailyPlaysCount || 0) + 1 : 1;
  return {
    ...user,
    dailyPlaysDate: todayKey,
    dailyPlaysCount: nextCount,
  };
}

export function evaluateMissions(
  user: NexplayUser,
  userCommentCount: number,
  todayKey: string
): MissionProgress[] {
  const playsToday = user.dailyPlaysDate === todayKey ? Number(user.dailyPlaysCount || 0) : 0;
  const streak = Math.max(1, Number(user.loginStreak || 0));
  const favCount = Array.isArray(user.favorites) ? user.favorites.length : 0;
  const claimedSet = new Set(user.claimedMissions || []);

  return DAILY_MISSIONS_CATALOG.map((def) => {
    let raw = 0;
    if (def.id === 'play-3') raw = playsToday;
    else if (def.id === 'streak-5') raw = streak;
    else if (def.id === 'favorite-2') raw = favCount;
    else if (def.id === 'comment-2') raw = userCommentCount;

    const progress = Math.min(def.target, Math.max(0, raw));
    return {
      ...def,
      progress,
      completed: progress >= def.target,
      claimed: claimedSet.has(def.id),
    };
  });
}

const MISSION_COMPANION_BADGE: Record<string, string> = {
  'play-3': 'gamer-spark',
  'streak-5': 'streak-legend',
  'favorite-2': 'curator-heart',
  'comment-2': 'critic-voice',
};

export function claimMissionReward(
  user: NexplayUser,
  missionId: string,
  userCommentCount: number,
  todayKey: string
): { ok: true; user: NexplayUser; mission: MissionProgress } | { ok: false; reason: string } {
  const evaluated = evaluateMissions(user, userCommentCount, todayKey);
  const mission = evaluated.find((m) => m.id === missionId);
  if (!mission) {
    return { ok: false, reason: 'Topshiriq topilmadi.' };
  }
  if (!mission.completed) {
    return { ok: false, reason: 'Topshiriq hali bajarilmagan.' };
  }
  if (mission.claimed) {
    return { ok: false, reason: 'Bu mukofot allaqachon olingan.' };
  }

  const nextClaimed = Array.from(new Set([...(user.claimedMissions || []), missionId]));
  const companionBadge = MISSION_COMPANION_BADGE[missionId];
  const nextBadges = Array.from(
    new Set([
      ...(user.badges || []),
      ...(mission.rewardType === 'badge' ? [mission.rewardId] : []),
      ...(companionBadge ? [companionBadge] : []),
    ])
  );
  const nextThemes = Array.from(
    new Set([
      ...(user.unlockedThemes || ['default']),
      ...(mission.rewardType === 'theme' && COSMETIC_THEMES[mission.rewardId] ? [mission.rewardId] : []),
    ])
  );

  return {
    ok: true,
    mission: { ...mission, claimed: true },
    user: {
      ...user,
      claimedMissions: nextClaimed,
      badges: nextBadges,
      unlockedThemes: nextThemes,
    },
  };
}

export function calcAverageRating(comments: NexplayComment[]): { avg: number; count: number } {
  if (!Array.isArray(comments) || comments.length === 0) return { avg: 0, count: 0 };
  const sum = comments.reduce((acc, c) => acc + Math.min(5, Math.max(1, Number(c.rating || 5))), 0);
  return { avg: Number((sum / comments.length).toFixed(1)), count: comments.length };
}

export function recordGameDailyPlay(game: NexplayGame, todayKey: string): NexplayGame {
  const prevHistory = game.dailyPlayHistory || {};
  const nextCount = Number(prevHistory[todayKey] || 0) + 1;
  return {
    ...game,
    plays: Number(game.plays || 0) + 1,
    dailyPlayHistory: {
      ...prevHistory,
      [todayKey]: nextCount,
    },
  };
}

const UZ_WEEKDAYS_SHORT = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

export function buildGame7DayEngagement(
  game: NexplayGame,
  referenceDate: Date = new Date()
): DailyEngagementPoint[] {
  const history = game.dailyPlayHistory || {};
  const dayKeys: Array<{ dateKey: string; label: string; fullDate: string }> = [];

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - offset);
    const key = getLocalDateKey(d);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    dayKeys.push({
      dateKey: key,
      label: offset === 0 ? 'Bugun' : `${UZ_WEEKDAYS_SHORT[d.getDay()]} ${dd}.${mm}`,
      fullDate: key,
    });
  }

  // Sum plays already recorded inside the 7-day window
  let recordedInWindow = 0;
  for (const item of dayKeys) {
    if (typeof history[item.dateKey] === 'number') {
      recordedInWindow += Math.max(0, history[item.dateKey]);
    }
  }

  const remainingPlays = Math.max(0, Number(game.plays || 0) - recordedInWindow);
  // Distribute unallocated historical plays smoothly across prior days without recorded entries
  const unrecordedPriorIndices = dayKeys
    .map((item, idx) => ({ item, idx }))
    .filter(({ item, idx }) => idx < 6 && typeof history[item.dateKey] !== 'number')
    .map(({ idx }) => idx);

  const weights = [0.12, 0.14, 0.16, 0.13, 0.21, 0.24];
  let hashShift = 0;
  for (let i = 0; i < game.id.length; i++) {
    hashShift += game.id.charCodeAt(i);
  }

  const allocated = new Array<number>(7).fill(0);
  if (remainingPlays > 0 && unrecordedPriorIndices.length > 0) {
    const pickedWeights = unrecordedPriorIndices.map(
      (idx) => weights[(idx + hashShift) % weights.length]
    );
    const weightSum = pickedWeights.reduce((a, b) => a + b, 0) || 1;
    let distributed = 0;
    unrecordedPriorIndices.forEach((dayIdx, pos) => {
      if (pos === unrecordedPriorIndices.length - 1) {
        allocated[dayIdx] = Math.max(0, remainingPlays - distributed);
      } else {
        const chunk = Math.round((remainingPlays * pickedWeights[pos]) / weightSum);
        const clamped = Math.min(chunk, remainingPlays - distributed);
        allocated[dayIdx] = Math.max(0, clamped);
        distributed += allocated[dayIdx];
      }
    });
  }

  return dayKeys.map((item, idx) => {
    const explicit = history[item.dateKey];
    const plays = typeof explicit === 'number' ? Math.max(0, explicit) : allocated[idx];
    return {
      ...item,
      plays,
    };
  });
}

export function evaluatePasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3;
  label: string;
} {
  if (!password) return { score: 0, label: 'Kiritilmagan' };
  let pts = 0;
  if (password.length >= 6) pts += 1;
  if (password.length >= 9) pts += 1;
  if (/[A-Z]/.test(password) || /\d/.test(password) || /[^a-zA-Z0-9]/.test(password)) pts += 1;
  if (pts <= 1) return { score: 1, label: 'Zaif' };
  if (pts === 2) return { score: 2, label: "O'rtacha" };
  return { score: 3, label: 'Kuchli' };
}

export function createSeedComments(): NexplayComment[] {
  return [
    {
      id: 'cmt-seed-1',
      gameId: 'game-seed-orbital',
      userId: 'usr-alpha-owner',
      author: 'Alpha',
      authorUsername: 'alpha',
      rating: 5,
      text: "Boshqaruv juda yumshoq va tezkor. Energiya sharlarini yig'ish dinamikasi a'lo darajada!",
      createdAt: '2026-11-22T15:30:00.000Z',
    },
    {
      id: 'cmt-seed-2',
      gameId: 'game-seed-kvant',
      userId: 'usr-alpha-owner',
      author: 'Alpha',
      authorUsername: 'alpha',
      rating: 5,
      text: "Klassik 15-lik boshqotirma uchun zamonaviy va toza interfeys.",
      createdAt: '2026-11-22T17:10:00.000Z',
    },
  ];
}

export function hydrateStateDefaults(parsed: NexplayState, seedGames: NexplayGame[] = []): NexplayState {
  const hydratedGames = hydrateSeedCovers(parsed.games, seedGames);
  const today = getLocalDateKey();
  const nextUsers = parsed.users.map((u) => ({
    ...u,
    loginStreak: Math.max(1, Number(u.loginStreak || 1)),
    lastLoginDate: u.lastLoginDate || today,
    dailyPlaysDate: u.dailyPlaysDate || today,
    dailyPlaysCount: Number(u.dailyPlaysCount || 0),
    claimedMissions: Array.isArray(u.claimedMissions) ? u.claimedMissions : [],
    badges: Array.isArray(u.badges) ? u.badges : [],
    unlockedThemes: Array.isArray(u.unlockedThemes) && u.unlockedThemes.length > 0 ? u.unlockedThemes : ['default'],
    activeTheme: u.activeTheme || 'default',
  }));
  const nextComments = Array.isArray(parsed.comments) ? parsed.comments : createSeedComments();
  const nextBgMedia = {
    parallaxEnabled: true,
    gridEnabled: true,
    particlesEnabled: true,
    streaksEnabled: true,
    motionIntensity: 1,
    ...(parsed.bgMedia || { type: 'none', url: '', opacity: 0.28, blur: 0, dim: 0.84 }),
  };

  return {
    ...parsed,
    games: hydratedGames,
    users: nextUsers,
    comments: nextComments,
    bgMedia: nextBgMedia,
  };
}

export function createBaseState(ownerPasswordHash: string, seedGames: NexplayGame[] = [], seedCategories: string[] = []): NexplayState {
  const today = getLocalDateKey();
  return {
    users: [
      {
        id: 'usr-alpha-owner',
        username: OWNER_USERNAME,
        salt: 'nx_alpha_salt_v10',
        passwordHash: ownerPasswordHash,
        role: 'OWNER',
        blocked: false,
        firstName: 'Alpha',
        lastName: '',
        displayName: 'Alpha',
        nickname: '@alpha',
        favoriteGenre: 'Strategiya',
        region: "O'zbekiston",
        bio: 'NEXPLAY platformasi boshqaruvchisi.',
        avatarData: '',
        premium: true,
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
      },
    ],
    games: seedGames,
    categories: seedCategories,
    tournaments: [],
    rooms: [],
    communityPosts: [],
    comments: createSeedComments(),
    modules: {
      catalog: true,
      categories: true,
      tournaments: true,
      rankings: true,
      community: true,
      achievements: true,
      premium: true,
      multiplayer: true,
    },
    sectionHeroes: {},
    stats: { totalLaunches: 0 },
    cms: {
      heroTitle: "HTML5 o'yinlar, turnirlar va raqobat muhiti",
      heroSubtitle:
        "Xavfsiz sandbox oynasi, tekshirilgan HTML va ZIP paketlar, shaffof reyting va foydalanuvchi profili yagona tizimda.",
      heroCta: 'Katalogni ochish',
      announcement:
        "Tezkor navigatsiya: H — Bosh sahifa, C — Katalog, P — Profil, / — Qidiruv, A — E'lon paneli, ? — Barcha yorliqlar.",
    },
    bgMedia: {
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
    },
    rgb: { ...RGB_PRESETS["Kiber ko'k"], preset: "Kiber ko'k" },
    auditLogs: [],
  };
}
