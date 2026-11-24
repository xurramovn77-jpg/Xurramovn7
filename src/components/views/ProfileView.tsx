import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Crown,
  Flame,
  Gift,
  Heart,
  History,
  Lock,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  UserPen,
} from 'lucide-react';
import { COSMETIC_THEMES, MISSION_BADGES } from '../../constants/nexplay';
import type { NexplayState, NexplayUser, ProfileTabKey, ViewName } from '../../types/nexplay';
import {
  calcProfileCompletion,
  evaluateMissions,
  getLocalDateKey,
  isOwnerUser,
  isSafeMedia,
} from '../../utils/nexplayLogic';
import { SectionHero } from '../SectionHero';

interface ProfileViewProps {
  state: NexplayState;
  currentUser: NexplayUser | null;
  activeTab: ProfileTabKey;
  onChangeTab: (tab: ProfileTabKey) => void;
  onNavigate: (view: ViewName) => void;
  onOpenAuth: () => void;
  onPlayGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  onClaimMission: (missionId: string) => void;
  onSelectCosmeticTheme: (themeId: string) => void;
  onUpdateProfile: (patch: {
    firstName: string;
    lastName: string;
    displayName: string;
    nickname: string;
    favoriteGenre: string;
    region: string;
    bio: string;
    avatarData: string;
  }) => void;
  onUpdatePassword: (oldPass: string, newPass: string, confirmPass: string) => Promise<string | null>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  state,
  currentUser,
  activeTab,
  onChangeTab,
  onNavigate,
  onOpenAuth,
  onPlayGame,
  onToggleFavorite,
  onClaimMission,
  onSelectCosmeticTheme,
  onUpdateProfile,
  onUpdatePassword,
}) => {
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [favoriteGenre, setFavoriteGenre] = useState(currentUser?.favoriteGenre || '');
  const [region, setRegion] = useState(currentUser?.region || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarData, setAvatarData] = useState(currentUser?.avatarData || '');

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setFirstName(currentUser.firstName || '');
    setLastName(currentUser.lastName || '');
    setDisplayName(currentUser.displayName || '');
    setNickname(currentUser.nickname || '');
    setFavoriteGenre(currentUser.favoriteGenre || '');
    setRegion(currentUser.region || '');
    setBio(currentUser.bio || '');
    setAvatarData(currentUser.avatarData || '');
  }, [currentUser?.id, currentUser?.displayName, currentUser?.avatarData]);

  const userCommentCount = useMemo(() => {
    if (!currentUser) return 0;
    return (state.comments || []).filter((c) => c.userId === currentUser.id).length;
  }, [state.comments, currentUser]);

  const missions = useMemo(() => {
    if (!currentUser) return [];
    return evaluateMissions(currentUser, userCommentCount, getLocalDateKey());
  }, [currentUser, userCommentCount]);

  if (!currentUser) {
    return (
      <div className="nx-surface rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto mt-8">
        <h1 className="font-heading font-bold text-2xl text-white">Shaxsiy kabinet</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Profil ma'lumotlari, kundalik topshiriqlar, sevimli o'yinlar va sessiyalar tarixini ko'rish uchun tizimga kiring.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="nx-btn-primary px-6 py-2.5 rounded-xl text-xs cursor-pointer"
        >
          Hisobga kirish
        </button>
      </div>
    );
  }

  const isDirty =
    firstName !== (currentUser.firstName || '') ||
    lastName !== (currentUser.lastName || '') ||
    displayName !== (currentUser.displayName || '') ||
    nickname !== (currentUser.nickname || '') ||
    favoriteGenre !== (currentUser.favoriteGenre || '') ||
    region !== (currentUser.region || '') ||
    bio !== (currentUser.bio || '') ||
    avatarData !== (currentUser.avatarData || '');

  const completion = calcProfileCompletion({
    ...currentUser,
    displayName,
    nickname,
    favoriteGenre,
    bio,
    avatarData,
  });

  const shownName = displayName.trim() || firstName.trim() || currentUser.username;
  const hasAvatar = isSafeMedia(avatarData);
  const initials = shownName.charAt(0).toUpperCase() || 'U';
  const favGames = state.games.filter((g) => currentUser.favorites.includes(g.id));

  const activeThemeId = currentUser.activeTheme || 'default';
  const activeThemeMeta = COSMETIC_THEMES[activeThemeId] || COSMETIC_THEMES.default;
  const unlockedThemeSet = new Set(
    currentUser.unlockedThemes && currentUser.unlockedThemes.length > 0
      ? currentUser.unlockedThemes
      : ['default']
  );
  const userBadges = (currentUser.badges || [])
    .map((id) => MISSION_BADGES[id])
    .filter(Boolean);
  const claimableCount = missions.filter((m) => m.completed && !m.claimed).length;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && isSafeMedia(reader.result)) {
        setAvatarData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: displayName.trim(),
      nickname: nickname.trim(),
      favoriteGenre: favoriteGenre.trim(),
      region: region.trim(),
      bio: bio.trim(),
      avatarData: avatarData.trim(),
    });
  };

  const handlePassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    const err = await onUpdatePassword(oldPass, newPass, confirmPass);
    if (err) {
      setPassMsg({ tone: 'error', text: err });
    } else {
      setPassMsg({ tone: 'ok', text: 'Parol muvaffaqiyatli yangilandi.' });
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHero
        view="profile"
        override={state.sectionHeroes.profile}
        publishedCount={state.games.filter((g) => g.published).length}
        usersCount={state.users.length}
        onNavigate={onNavigate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Live Identity Card styled with Active Cosmetic Theme */}
        <aside className={`lg:col-span-4 nx-surface rounded-2xl p-6 space-y-5 border transition-all ${activeThemeMeta.borderClass}`}>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center font-heading font-bold text-xl text-white shrink-0"
              style={{
                background: hasAvatar ? 'transparent' : activeThemeMeta.accentGradient,
              }}
            >
              {hasAvatar ? (
                <img src={avatarData} alt={shownName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="font-heading font-bold text-lg text-white truncate">{shownName}</div>
              <div className="text-xs text-slate-400 truncate">
                {nickname || `@${currentUser.username}`}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                {isOwnerUser(currentUser) && (
                  <span className="inline-flex items-center gap-1 text-cyan-300 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>OWNER</span>
                  </span>
                )}
                {currentUser.premium && (
                  <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                    <Crown className="w-3.5 h-3.5" />
                    <span>PRO</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-orange-300 font-medium tabular-nums">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{Math.max(1, currentUser.loginStreak || 1)} kun seriya</span>
                </span>
              </div>
            </div>
          </div>

          {/* Unlocked Mission Badges on Identity Card */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Kosmetik mavzu</span>
              <span className="font-medium text-white">{activeThemeMeta.name}</span>
            </div>
            {userBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {userBadges.map((b) => (
                  <span
                    key={b.id}
                    title={b.desc}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${b.tone}`}
                  >
                    <Award className="w-3 h-3" />
                    <span>{b.title}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Profil to'ldirilganligi</span>
              <span className="font-mono-tabular font-semibold text-white">{completion}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${completion}%`,
                  background: activeThemeMeta.accentGradient,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="rounded-xl bg-white/[0.03] p-2.5">
              <div className="font-mono-tabular font-bold text-sm text-white">
                {currentUser.favorites.length}
              </div>
              <div className="text-[10px] text-slate-400">Sevimli</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-2.5">
              <div className="font-mono-tabular font-bold text-sm text-white">
                {currentUser.history.length}
              </div>
              <div className="text-[10px] text-slate-400">Sessiya</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-2.5">
              <div className="font-mono-tabular font-bold text-sm text-white">
                {userBadges.length}
              </div>
              <div className="text-[10px] text-slate-400">Nishon</div>
            </div>
          </div>
        </aside>

        {/* Right Tabs Workspace */}
        <div className="lg:col-span-8 nx-surface rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.08] pb-3">
            {(
              [
                { id: 'overview', label: 'Profilim' },
                { id: 'missions', label: claimableCount > 0 ? `Topshiriqlar (${claimableCount})` : 'Topshiriqlar' },
                { id: 'edit', label: 'Profilni tahrirlash' },
                { id: 'settings', label: 'Akkaunt sozlamalari' },
                { id: 'security', label: 'Xavfsizlik' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                id={`profile-tab-${tab.id}`}
                onClick={() => onChangeTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white/[0.1] text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Daily Missions Snapshot Banner inside Overview */}
              <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Target className="w-5 h-5 text-cyan-300 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white">
                      Kundalik topshiriqlar ·{' '}
                      <span className="text-cyan-300 tabular-nums">
                        {missions.filter((m) => m.completed).length} / {missions.length} bajarildi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Topshiriqlarni bajarib profil nishonlari va kosmetik mavzularni oching.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeTab('missions')}
                  className="nx-btn-secondary px-3.5 py-2 rounded-xl text-xs cursor-pointer shrink-0"
                >
                  Topshiriqlarni ochish
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-heading font-bold text-white">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Sevimli o'yinlar</span>
                </div>
                {favGames.length === 0 ? (
                  <p className="text-xs text-slate-400">Hozircha sevimli o'yinlar saqlanmagan.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {favGames.map((g) => (
                      <div
                        key={g.id}
                        className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{g.title}</div>
                          <div className="text-[11px] text-slate-400">{g.category}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onPlayGame(g.id)}
                            className="nx-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start</span>
                          </button>
                          <button
                            type="button"
                            aria-label="Sevimlilardan o'chirish"
                            onClick={() => onToggleFavorite(g.id)}
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

              <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 text-sm font-heading font-bold text-white">
                  <History className="w-4 h-4 text-cyan-300" />
                  <span>So'nggi sessiyalar tarixi</span>
                </div>
                {currentUser.history.length === 0 ? (
                  <p className="text-xs text-slate-400">Hali o'yin sessiyasi boshlanmagan.</p>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {currentUser.history.slice(0, 8).map((item, i) => (
                      <div key={`${item.gameId}-${i}`} className="py-2.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-white">{item.title}</span>
                        <span className="text-slate-400 text-[11px]">{item.at}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'missions' && (
            <div id="daily-missions-panel" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-bold text-base sm:text-lg text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-300" />
                    <span>Kundalik topshiriqlar va mukofotlar</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Topshiriqlarni bajaring va yangi nishonlar hamda kosmetik profil mavzularini qo'lga kiriting.
                  </p>
                </div>
                <div className="text-xs font-mono-tabular text-orange-300 font-semibold">
                  Joriy seriya: {Math.max(1, currentUser.loginStreak || 1)} kun
                </div>
              </div>

              {/* Missions Grid */}
              <div className="space-y-3">
                {missions.map((m) => {
                  const pct = Math.round((m.progress / Math.max(1, m.target)) * 100);
                  return (
                    <div
                      key={m.id}
                      data-testid={`mission-card-${m.id}`}
                      className={`rounded-2xl border p-4 space-y-3 transition-colors ${
                        m.claimed
                          ? 'bg-emerald-500/[0.05] border-emerald-400/25'
                          : m.completed
                            ? 'bg-cyan-500/[0.06] border-cyan-400/35'
                            : 'bg-white/[0.025] border-white/[0.07]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-heading font-semibold text-sm text-white">{m.title}</span>
                            <span className="text-[11px] font-mono-tabular text-cyan-300">
                              {m.progress} / {m.target}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{m.desc}</p>
                          <div className="text-[11px] text-amber-300/90 inline-flex items-center gap-1.5 pt-0.5">
                            <Gift className="w-3.5 h-3.5" />
                            <span>Mukofot: {m.rewardLabel}</span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {m.claimed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Olingan</span>
                            </span>
                          ) : m.completed ? (
                            <button
                              type="button"
                              id={`claim-mission-${m.id}`}
                              onClick={() => onClaimMission(m.id)}
                              className="nx-btn-primary nx-btn-gaming px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Mukofotni olish</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-3 py-2 rounded-xl bg-white/[0.04] text-slate-400 text-xs">
                              Jarayonda
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            background: m.completed
                              ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                              : 'linear-gradient(90deg, var(--rgb-primary), var(--rgb-secondary))',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cosmetic Themes Selector */}
              <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-300" />
                    <span>Kosmetik profil mavzulari</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {unlockedThemeSet.size} / {Object.keys(COSMETIC_THEMES).length} ochilgan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.values(COSMETIC_THEMES).map((th) => {
                    const unlocked = unlockedThemeSet.has(th.id);
                    const isEquipped = activeThemeId === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => unlocked && onSelectCosmeticTheme(th.id)}
                        className={`rounded-2xl border p-4 text-left transition-all flex items-start justify-between gap-3 ${
                          isEquipped
                            ? 'bg-white/[0.08] border-cyan-400/55 cursor-default'
                            : unlocked
                              ? 'bg-white/[0.025] border-white/[0.08] hover:border-white/[0.22] cursor-pointer'
                              : 'bg-white/[0.015] border-white/[0.05] opacity-55 cursor-not-allowed'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ background: th.accentGradient }}
                            />
                            <span className="text-xs font-semibold text-white">{th.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{th.desc}</p>
                        </div>
                        <span className="text-[10px] font-semibold shrink-0 mt-0.5">
                          {isEquipped ? (
                            <span className="text-cyan-300">Faol</span>
                          ) : unlocked ? (
                            <span className="text-slate-300">Tanlash</span>
                          ) : (
                            <span className="text-slate-500">Yopiq</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'edit' || activeTab === 'settings') && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {isDirty && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-400/25 px-3.5 py-2 text-xs text-amber-200">
                  Saqlanmagan o'zgarishlar mavjud.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300" htmlFor="prof-firstName">
                    Ism
                  </label>
                  <input
                    id="prof-firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ismingiz"
                    className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300" htmlFor="prof-lastName">
                    Familiya
                  </label>
                  <input
                    id="prof-lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Familiyangiz"
                    className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300" htmlFor="prof-displayName">
                    Ko'rinadigan ism
                  </label>
                  <input
                    id="prof-displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Saytda ko'rinadigan nom"
                    className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300" htmlFor="prof-nickname">
                    Taxallus (@nickname)
                  </label>
                  <input
                    id="prof-nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="@taxallus"
                    className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300" htmlFor="prof-genre">
                    Sevimli janr
                  </label>
                  <select
                    id="prof-genre"
                    value={favoriteGenre}
                    onChange={(e) => setFavoriteGenre(e.target.value)}
                    className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs cursor-pointer"
                  >
                    <option value="">Tanlanmagan</option>
                    {state.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300" htmlFor="prof-region">
                    Hudud
                  </label>
                  <input
                    id="prof-region"
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Masalan: Toshkent"
                    className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300" htmlFor="prof-avatar-url">
                  Avatar URL yoki rasm yuklash
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="prof-avatar-url"
                    type="text"
                    value={avatarData}
                    onChange={(e) => setAvatarData(e.target.value)}
                    placeholder="https://... yoki quyidan fayl tanlang"
                    className="nx-input flex-1 rounded-xl px-3.5 py-2.5 text-xs"
                  />
                  <label className="nx-btn-secondary px-3.5 py-2.5 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Rasm yuklash</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300" htmlFor="prof-bio">
                  Qisqa bio
                </label>
                <textarea
                  id="prof-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="O'zingiz haqingizda qisqacha yozing..."
                  className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="submit" className="nx-btn-primary px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer">
                  <UserPen className="w-3.5 h-3.5" />
                  <span>O'zgarishlarni saqlash</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePassSubmit} className="space-y-4 max-w-md">
              <div className="flex items-center gap-2 text-sm font-heading font-bold text-white">
                <Lock className="w-4 h-4 text-cyan-300" />
                <span>Parolni yangilash</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300" htmlFor="sec-old-pass">
                  Joriy parol
                </label>
                <input
                  id="sec-old-pass"
                  type="password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  placeholder="Joriy parolni kiriting"
                  className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300" htmlFor="sec-new-pass">
                  Yangi parol (kamida 6 belgi)
                </label>
                <input
                  id="sec-new-pass"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Yangi parol"
                  className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300" htmlFor="sec-confirm-pass">
                  Yangi parolni tasdiqlang
                </label>
                <input
                  id="sec-confirm-pass"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Parolni takrorlang"
                  className="nx-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>
              {passMsg && (
                <div
                  className={`text-xs ${
                    passMsg.tone === 'error' ? 'text-rose-400' : 'text-emerald-300'
                  }`}
                >
                  {passMsg.text}
                </div>
              )}
              <button type="submit" className="nx-btn-primary px-5 py-2.5 rounded-xl text-xs cursor-pointer">
                Parolni saqlash
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Achievement summary banner */}
      <div className="nx-surface rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <Award className="w-5 h-5 text-cyan-300 shrink-0" />
          <span>
            Ochilgan yutuqlar: <strong className="text-white tabular-nums">{currentUser.achievements.length}</strong> / 3 ·{' '}
            Topshiriq nishonlari: <strong className="text-white tabular-nums">{userBadges.length}</strong> / 4
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('achievements')}
          className="text-xs font-semibold nx-accent-text hover:underline cursor-pointer"
        >
          Yutuqlar vitrinasi
        </button>
      </div>
    </div>
  );
};
