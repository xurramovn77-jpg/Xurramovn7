import type { RgbConfig, SectionHeroMeta } from '../types/nexplay';

export const STORAGE_KEY = 'nexplay_state_v10';
export const SESSION_KEY = 'nexplay_session_v10';
export const COSMOS_VISIT_KEY = 'nexplay_cosmos_visit_idx_v1';
export const IDB_NAME = 'nexplay_packages_idb_v10';
export const IDB_STORE = 'packages';

export const OWNER_USERNAME = 'alpha';
export const OWNER_SEED_SECRET = 'singlimm';

export const MAX_HTML_BYTES = 5 * 1024 * 1024;
export const MAX_ZIP_BYTES = 18 * 1024 * 1024;
export const MAX_ZIP_ENTRIES = 220;
export const MAX_EXTRACTED_BYTES = 32 * 1024 * 1024;

export const BLOCKED_EXTS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.ps1',
  '.vbs',
  '.dll',
  '.msi',
  '.scr',
  '.pif',
  '.com',
  '.php',
  '.asp',
  '.aspx',
  '.jsp',
  '.py',
  '.rb',
  '.pl',
  '.jar',
];

export const RGB_PRESETS: Record<string, RgbConfig> = {
  "Kiber ko'k": {
    mode: 'static',
    r: 59,
    g: 130,
    b: 246,
    secR: 6,
    secG: 182,
    secB: 212,
    accR: 139,
    accG: 92,
    accB: 246,
    glow: 0.35,
    speed: 12,
    deg: 135,
    preset: "Kiber ko'k",
  },
  Zumrad: {
    mode: 'static',
    r: 16,
    g: 185,
    b: 129,
    secR: 6,
    secG: 182,
    secB: 212,
    accR: 59,
    accG: 130,
    accB: 246,
    glow: 0.34,
    speed: 12,
    deg: 135,
    preset: 'Zumrad',
  },
  Binafsha: {
    mode: 'static',
    r: 139,
    g: 92,
    b: 246,
    secR: 99,
    secG: 102,
    secB: 241,
    accR: 59,
    accG: 130,
    accB: 246,
    glow: 0.36,
    speed: 12,
    deg: 135,
    preset: 'Binafsha',
  },
  Olovrang: {
    mode: 'static',
    r: 249,
    g: 115,
    b: 22,
    secR: 245,
    secG: 158,
    secB: 11,
    accR: 59,
    accG: 130,
    accB: 246,
    glow: 0.34,
    speed: 12,
    deg: 135,
    preset: 'Olovrang',
  },
  Koinot: {
    mode: 'cycle',
    r: 6,
    g: 182,
    b: 212,
    secR: 59,
    secG: 130,
    secB: 246,
    accR: 139,
    accG: 92,
    accB: 246,
    glow: 0.38,
    speed: 14,
    deg: 135,
    preset: 'Koinot',
  },
  Qizil: {
    mode: 'static',
    r: 244,
    g: 63,
    b: 94,
    secR: 239,
    secG: 68,
    secB: 68,
    accR: 249,
    accG: 115,
    accB: 22,
    glow: 0.34,
    speed: 12,
    deg: 135,
    preset: 'Qizil',
  },
  Oltin: {
    mode: 'static',
    r: 234,
    g: 179,
    b: 8,
    secR: 245,
    secG: 158,
    secB: 11,
    accR: 59,
    accG: 130,
    accB: 246,
    glow: 0.34,
    speed: 12,
    deg: 135,
    preset: 'Oltin',
  },
};

export const ACHIEVEMENTS_LIST = [
  {
    id: 'first-play',
    title: 'Birinchi start',
    desc: "Katalogdagi o'yinni birinchi marta ishga tushiring.",
    points: 25,
  },
  {
    id: 'favorite-pick',
    title: 'Sevimli tanlov',
    desc: "O'yinni sevimlilar ro'yxatiga saqlang.",
    points: 25,
  },
  {
    id: 'profile-ready',
    title: 'Profil tayyor',
    desc: "Shaxsiy profil ma'lumotlaringizni yangilang.",
    points: 25,
  },
];

export const MISSION_BADGES: Record<string, { id: string; title: string; desc: string; tone: string }> = {
  'gamer-spark': {
    id: 'gamer-spark',
    title: "Faol O'yinchi",
    desc: "Bir kunda 3 ta o'yin sessiyasini ishga tushirganlik uchun nishon.",
    tone: 'text-cyan-300 border-cyan-400/35 bg-cyan-500/10',
  },
  'streak-legend': {
    id: 'streak-legend',
    title: '5 Kunlik Intizom',
    desc: 'Platformaga ketma-ket 5 kun tashrif buyurganlik uchun faxriy nishon.',
    tone: 'text-amber-300 border-amber-400/35 bg-amber-500/10',
  },
  'curator-heart': {
    id: 'curator-heart',
    title: 'Kolleksioner',
    desc: "Sevimlilar ro'yxatiga kamida 2 ta o'yin qo'shganlik uchun nishon.",
    tone: 'text-rose-300 border-rose-400/35 bg-rose-500/10',
  },
  'critic-voice': {
    id: 'critic-voice',
    title: 'Sharhlovchi',
    desc: "O'yinlar sahifasida fikr va baho qoldirganlik uchun nishon.",
    tone: 'text-violet-300 border-violet-400/35 bg-violet-500/10',
  },
};

export interface CosmeticThemeMeta {
  id: string;
  name: string;
  desc: string;
  borderClass: string;
  accentGradient: string;
  swatch: string;
}

export const COSMETIC_THEMES: Record<string, CosmeticThemeMeta> = {
  default: {
    id: 'default',
    name: 'Standart Kiber',
    desc: 'Asosiy midnight-navy va elektr ko‘k interfeys ko‘rinishi.',
    borderClass: 'border-white/[0.12]',
    accentGradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    swatch: '#3b82f6',
  },
  'cyber-pulse': {
    id: 'cyber-pulse',
    name: 'Kiber Impuls',
    desc: 'Yorqin moviy-firuza energiya hoshiyasi bilan bezatilgan profil.',
    borderClass: 'border-cyan-400/45 shadow-[0_0_28px_-12px_rgba(34,211,238,0.55)]',
    accentGradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    swatch: '#06b6d4',
  },
  'solar-crown': {
    id: 'solar-crown',
    name: 'Oltin Toj',
    desc: '5 kunlik faollik uchun oltin va kahrabo tusli premium profil ramkasi.',
    borderClass: 'border-amber-400/45 shadow-[0_0_28px_-12px_rgba(245,158,11,0.55)]',
    accentGradient: 'linear-gradient(135deg, #f59e0b, #eab308)',
    swatch: '#f59e0b',
  },
  'phantom-violet': {
    id: 'phantom-violet',
    name: 'Fantom Binafsha',
    desc: 'Faol sharhlovchilar uchun binafsha-indigo nurli kosmetik bezak.',
    borderClass: 'border-violet-400/45 shadow-[0_0_28px_-12px_rgba(139,92,246,0.55)]',
    accentGradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    swatch: '#8b5cf6',
  },
};

export interface MissionCatalogDef {
  id: string;
  title: string;
  desc: string;
  target: number;
  rewardType: 'badge' | 'theme';
  rewardId: string;
  rewardLabel: string;
}

export const DAILY_MISSIONS_CATALOG: MissionCatalogDef[] = [
  {
    id: 'play-3',
    title: "3 ta o'yin o'ynash",
    desc: "Bugun kamida 3 ta o'yin sessiyasini sandboxda ishga tushiring.",
    target: 3,
    rewardType: 'theme',
    rewardId: 'cyber-pulse',
    rewardLabel: 'Mavzu: Kiber Impuls + Nishon',
  },
  {
    id: 'streak-5',
    title: '5 kun ketma-ket kirish',
    desc: 'Platformaga ketma-ket 5 kun davomida tizimga kiring.',
    target: 5,
    rewardType: 'theme',
    rewardId: 'solar-crown',
    rewardLabel: 'Mavzu: Oltin Toj + Nishon',
  },
  {
    id: 'favorite-2',
    title: "2 ta sevimli o'yin tanlash",
    desc: "Yoqtirgan 2 ta o'yiningizni sevimlilar ro'yxatiga qo'shing.",
    target: 2,
    rewardType: 'badge',
    rewardId: 'curator-heart',
    rewardLabel: 'Nishon: Kolleksioner',
  },
  {
    id: 'comment-2',
    title: "2 ta o'yin sharhi yozish",
    desc: "O'yin tafsilotlari sahifasida kamida 2 ta fikr va baho qoldiring.",
    target: 2,
    rewardType: 'theme',
    rewardId: 'phantom-violet',
    rewardLabel: 'Mavzu: Fantom Binafsha + Nishon',
  },
];

export const SECTION_HERO_CONFIG: Record<string, SectionHeroMeta> = {
  home: {
    badge: 'NEXPLAY Ekotizim',
    title: "HTML5 o'yinlar, turnirlar va raqobat muhiti",
    desc: "Xavfsiz sandbox oynasi, tekshirilgan HTML va ZIP paketlar, shaffof reyting va foydalanuvchi profili yagona tizimda.",
    primaryLabel: 'Katalogni ochish',
    secondaryLabel: "Turnirlarni ko'rish",
    primaryTarget: 'catalog',
    secondaryTarget: 'tournaments',
    accent: 'rgba(59, 130, 246, 0.22)',
  },
  catalog: {
    badge: "O'yinlar katalogi",
    title: "Nashr etilgan o'yinlar to'plami",
    desc: "Janr bo'yicha filtrlang, qidiring va brauzer ichidagi izolyatsiyalangan oynada darhol o'ynang.",
    primaryLabel: 'Kategoriyalar',
    secondaryLabel: 'Reyting jadvali',
    primaryTarget: 'categories',
    secondaryTarget: 'rankings',
    accent: 'rgba(6, 182, 212, 0.22)',
  },
  categories: {
    badge: 'Janrlar',
    title: "O'yin kategoriyalari",
    desc: "Yo'nalishlar bo'yicha saralangan o'yinlar va tezkor o'tish imkoniyati.",
    primaryLabel: "Katalogga o'tish",
    secondaryLabel: 'Bosh sahifa',
    primaryTarget: 'catalog',
    secondaryTarget: 'home',
    accent: 'rgba(139, 92, 246, 0.22)',
  },
  tournaments: {
    badge: 'Musobaqalar',
    title: 'Turnirlar va chempionatlar',
    desc: "Rasmiy turnirlar jadvali va ishtirok etish ma'lumotlari.",
    primaryLabel: "Reytingni ko'rish",
    secondaryLabel: 'Katalog',
    primaryTarget: 'rankings',
    secondaryTarget: 'catalog',
    accent: 'rgba(234, 179, 8, 0.20)',
  },
  rankings: {
    badge: 'Peshqadamlar',
    title: 'Reyting jadvali',
    desc: "Real o'yin sessiyalari va ochilgan yutuqlar asosida shakllangan reyting.",
    primaryLabel: 'Yutuqlar',
    secondaryLabel: 'Katalog',
    primaryTarget: 'achievements',
    secondaryTarget: 'catalog',
    accent: 'rgba(16, 185, 129, 0.20)',
  },
  community: {
    badge: 'Hamjamiyat',
    title: "O'yinchilar hamjamiyati",
    desc: 'Fikr almashish, yangiliklar va ochiq muhokamalar maydoni.',
    primaryLabel: 'Reyting',
    secondaryLabel: 'Katalog',
    primaryTarget: 'rankings',
    secondaryTarget: 'catalog',
    accent: 'rgba(59, 130, 246, 0.20)',
  },
  achievements: {
    badge: 'Yutuqlar',
    title: 'Shaxsiy yutuqlar vitrinasi',
    desc: 'Faolligingizga qarab ochiladigan nishonlar va natijalar.',
    primaryLabel: 'Profilim',
    secondaryLabel: 'Katalog',
    primaryTarget: 'profile',
    secondaryTarget: 'catalog',
    accent: 'rgba(139, 92, 246, 0.20)',
  },
  premium: {
    badge: 'NEXPLAY PRO',
    title: "Premium a'zolik imkoniyatlari",
    desc: 'Standart va PRO hisob tafsilotlari hamda profil belgisi.',
    primaryLabel: 'Profilim',
    secondaryLabel: 'Katalog',
    primaryTarget: 'profile',
    secondaryTarget: 'catalog',
    accent: 'rgba(245, 158, 11, 0.20)',
  },
  multiplayer: {
    badge: 'Tarmoq rejimi',
    title: 'Multiplayer xonalar',
    desc: "Jonli ko'p o'yinchili xonalar holati va ulanish ma'lumotlari.",
    primaryLabel: 'Turnirlar',
    secondaryLabel: 'Katalog',
    primaryTarget: 'tournaments',
    secondaryTarget: 'catalog',
    accent: 'rgba(6, 182, 212, 0.20)',
  },
  profile: {
    badge: 'Shaxsiy kabinet',
    title: 'Mening profilim va sozlamalar',
    desc: 'Ism, familiya, taxallus, avatar, sevimlilar, tarix va xavfsizlikni boshqaring.',
    primaryLabel: 'Katalog',
    secondaryLabel: 'Yutuqlar',
    primaryTarget: 'catalog',
    secondaryTarget: 'achievements',
    accent: 'rgba(59, 130, 246, 0.20)',
  },
};

export const COSMOS_SCENES = [
  {
    name: 'Midnight Nebula',
    c0: '#04070f',
    c1: '#0a1428',
    accent: '#3b82f6',
    sec: '#06b6d4',
    acc2: '#8b5cf6',
  },
  {
    name: 'Deep Indigo Drift',
    c0: '#050712',
    c1: '#0f172a',
    accent: '#6366f1',
    sec: '#0ea5e9',
    acc2: '#8b5cf6',
  },
  {
    name: 'Cobalt Horizon',
    c0: '#030812',
    c1: '#081b2e',
    accent: '#06b6d4',
    sec: '#3b82f6',
    acc2: '#6366f1',
  },
  {
    name: 'Obsidian Orbit',
    c0: '#050811',
    c1: '#111827',
    accent: '#3b82f6',
    sec: '#22d3ee',
    acc2: '#7c3aed',
  },
];
