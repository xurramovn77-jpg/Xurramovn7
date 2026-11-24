export type ViewName =
  | 'home'
  | 'catalog'
  | 'categories'
  | 'game-details'
  | 'player'
  | 'tournaments'
  | 'rankings'
  | 'community'
  | 'achievements'
  | 'premium'
  | 'multiplayer'
  | 'profile'
  | 'admin';

export type ProfileTabKey = 'overview' | 'missions' | 'edit' | 'settings' | 'security';

export type AdminSectionKey =
  | 'dashboard'
  | 'add-game'
  | 'games-list'
  | 'categories'
  | 'comments'
  | 'users'
  | 'operations'
  | 'modules'
  | 'audit'
  | 'settings';

export type AuthTab = 'login' | 'register';

export type CatalogSortOrder = 'newest' | 'popular' | 'title';

export type GlobalShortcutAction =
  | { type: 'navigate'; view: ViewName }
  | { type: 'toggle-search' }
  | { type: 'toggle-announcement' }
  | { type: 'toggle-shortcuts' }
  | { type: 'escape' };

export type RgbMode = 'static' | 'cycle' | 'pulse';

export interface RgbConfig {
  mode: RgbMode;
  r: number;
  g: number;
  b: number;
  secR: number;
  secG: number;
  secB: number;
  accR: number;
  accG: number;
  accB: number;
  glow: number;
  speed: number;
  deg: number;
  preset: string;
}

export interface BgMediaConfig {
  type: 'none' | 'image' | 'video';
  url: string;
  opacity: number;
  blur: number;
  dim: number;
  parallaxEnabled?: boolean;
  gridEnabled?: boolean;
  particlesEnabled?: boolean;
  streaksEnabled?: boolean;
  motionIntensity?: number;
}

export interface UserHistoryItem {
  gameId: string;
  title: string;
  at: string;
}

export interface NexplayUser {
  id: string;
  username: string;
  salt: string;
  passwordHash: string;
  role: 'OWNER' | 'USER';
  blocked: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  nickname: string;
  favoriteGenre: string;
  region: string;
  bio: string;
  avatarData: string;
  premium: boolean;
  favorites: string[];
  history: UserHistoryItem[];
  achievements: string[];
  loginStreak?: number;
  lastLoginDate?: string;
  dailyPlaysDate?: string;
  dailyPlaysCount?: number;
  claimedMissions?: string[];
  badges?: string[];
  unlockedThemes?: string[];
  activeTheme?: string;
  createdAt: string;
}

export interface PackageMeta {
  packageType: 'html' | 'zip';
  fileName: string;
  totalSize: number;
  fileCount: number;
  entryPath: string;
}

export interface NexplayGame {
  id: string;
  title: string;
  category: string;
  coverUrl: string;
  shortDescription: string;
  description: string;
  featured: boolean;
  status: 'published' | 'draft';
  published: boolean;
  plays: number;
  packageId: string;
  packageMeta: PackageMeta | null;
  createdAt: string;
  accentTone?: 'blue' | 'cyan' | 'violet';
  dailyPlayHistory?: Record<string, number>;
}

export interface DailyEngagementPoint {
  dateKey: string;
  label: string;
  fullDate: string;
  plays: number;
}

export interface ZipFileEntry {
  mime: string;
  size: number;
  b64: string;
}

export interface NexplayPackageRecord {
  packageId: string;
  packageType: 'html' | 'zip';
  fileName: string;
  totalSize: number;
  fileCount: number;
  entryPath: string;
  htmlCandidates: string[];
  htmlContent?: string;
  files?: Record<string, ZipFileEntry>;
}

export interface NexplayTournament {
  id: string;
  title: string;
  gameTitle: string;
  prize: string;
  startsAt: string;
  status: 'upcoming' | 'live' | 'finished';
  participants: string[];
}

export interface NexplayRoom {
  id: string;
  name: string;
  gameTitle: string;
  host: string;
  players: number;
  maxPlayers: number;
  status: 'open' | 'playing';
}

export interface NexplayCommunityPost {
  id: string;
  author: string;
  authorUsername?: string;
  text: string;
  time: string;
}

export interface NexplayComment {
  id: string;
  gameId: string;
  userId: string;
  author: string;
  authorUsername: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface MissionProgress {
  id: string;
  title: string;
  desc: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  rewardType: 'badge' | 'theme';
  rewardId: string;
  rewardLabel: string;
}

export interface NexplayAuditLog {
  id: string;
  actor: string;
  action: string;
  time: string;
}

export interface NexplayCms {
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  announcement: string;
}

export interface NexplayModules {
  catalog: boolean;
  categories: boolean;
  tournaments: boolean;
  rankings: boolean;
  community: boolean;
  achievements: boolean;
  premium: boolean;
  multiplayer: boolean;
}

export interface NexplayState {
  users: NexplayUser[];
  games: NexplayGame[];
  categories: string[];
  tournaments: NexplayTournament[];
  rooms: NexplayRoom[];
  communityPosts: NexplayCommunityPost[];
  comments: NexplayComment[];
  modules: NexplayModules;
  sectionHeroes: Record<string, Partial<SectionHeroMeta>>;
  stats: { totalLaunches: number };
  cms: NexplayCms;
  bgMedia: BgMediaConfig;
  rgb: RgbConfig;
  auditLogs: NexplayAuditLog[];
}

export interface SectionHeroMeta {
  badge: string;
  title: string;
  desc: string;
  primaryLabel: string;
  secondaryLabel: string;
  primaryTarget: ViewName;
  secondaryTarget: ViewName;
  accent: string;
}

export interface RankedUser extends NexplayUser {
  sessions: number;
  achs: number;
  points: number;
}
