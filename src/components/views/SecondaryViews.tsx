import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Crown,
  Lock,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { ACHIEVEMENTS_LIST } from '../../constants/nexplay';
import type { NexplayState, NexplayUser, ViewName } from '../../types/nexplay';
import { getPublishedGames, getRankedUsers, isOwnerUser } from '../../utils/nexplayLogic';
import { SectionHero } from '../SectionHero';

interface BaseSecondaryProps {
  state: NexplayState;
  currentUser: NexplayUser | null;
  onNavigate: (view: ViewName) => void;
}

export const CategoriesView: React.FC<
  BaseSecondaryProps & { onSelectCategory: (cat: string) => void }
> = ({ state, onNavigate, onSelectCategory }) => {
  const published = getPublishedGames(state.games);

  return (
    <div className="space-y-6">
      <SectionHero
        view="categories"
        override={state.sectionHeroes.categories}
        publishedCount={published.length}
        usersCount={state.users.length}
        onNavigate={onNavigate}
      />

      {state.categories.length === 0 ? (
        <div className="nx-surface rounded-2xl p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-white">Kategoriyalar topilmadi</p>
          <p className="text-xs text-slate-400">Admin panelidan yangi kategoriya qo'shishingiz mumkin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.categories.map((cat) => {
            const catGames = published.filter((g) => g.category === cat);
            const totalPlays = catGames.reduce((sum, g) => sum + Number(g.plays || 0), 0);
            return (
              <div
                key={cat}
                className="nx-surface nx-card-hover rounded-2xl p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-cyan-300">Janr</span>
                    <span className="tabular-nums">{totalPlays} umumiy start</span>
                  </div>
                  <h2 className="font-heading font-bold text-xl text-white">{cat}</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ushbu yo'nalishda <strong className="text-white tabular-nums">{catGames.length}</strong> ta nashr etilgan HTML5 o'yin mavjud.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className="nx-btn-secondary w-full py-2.5 px-4 rounded-xl text-xs inline-flex items-center justify-between cursor-pointer"
                >
                  <span>O'yinlarni ko'rish</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const TournamentsView: React.FC<
  BaseSecondaryProps & {
    onCreateTournament: (title: string, gameTitle: string, prize: string, startsAt: string) => void;
    onJoinTournament: (id: string) => void;
  }
> = ({ state, currentUser, onNavigate, onCreateTournament, onJoinTournament }) => {
  const published = getPublishedGames(state.games);
  const owner = isOwnerUser(currentUser);
  const [title, setTitle] = useState('');
  const [gameTitle, setGameTitle] = useState(published[0]?.title || 'Orbital Pulse');
  const [prize, setPrize] = useState('');
  const [startsAt, setStartsAt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prize.trim()) return;
    onCreateTournament(title.trim(), gameTitle.trim() || 'Orbital Pulse', prize.trim(), startsAt.trim() || 'Tez kunda');
    setTitle('');
    setPrize('');
    setStartsAt('');
  };

  return (
    <div className="space-y-6">
      <SectionHero
        view="tournaments"
        override={state.sectionHeroes.tournaments}
        publishedCount={published.length}
        usersCount={state.users.length}
        onNavigate={onNavigate}
      />

      {owner && (
        <form onSubmit={handleSubmit} className="nx-surface rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-heading font-bold text-white">
            <Plus className="w-4 h-4 text-cyan-300" />
            <span>Yangi turnir e'lon qilish</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Turnir nomi (masalan: Kuzgi Kubok)"
              required
              className="nx-input rounded-xl px-3.5 py-2.5 text-xs"
            />
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="O'yin nomi"
              className="nx-input rounded-xl px-3.5 py-2.5 text-xs"
            />
            <input
              type="text"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              placeholder="Mukofot (masalan: PRO + 500 ball)"
              required
              className="nx-input rounded-xl px-3.5 py-2.5 text-xs"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                placeholder="Sana (masalan: 25-noyabr)"
                className="nx-input flex-1 rounded-xl px-3.5 py-2.5 text-xs"
              />
              <button type="submit" className="nx-btn-primary px-4 py-2.5 rounded-xl text-xs shrink-0 cursor-pointer">
                Yaratish
              </button>
            </div>
          </div>
        </form>
      )}

      {state.tournaments.length === 0 ? (
        <div className="nx-surface rounded-2xl p-10 text-center space-y-2">
          <Trophy className="w-8 h-8 text-amber-300 mx-auto opacity-80" />
          <p className="text-sm font-semibold text-white">Hozircha faol turnirlar e'lon qilinmagan</p>
          <p className="text-xs text-slate-400">
            Yangi turnirlar ochilganda bu yerda ro'yxatdan o'tish va jadvalni kuzatish mumkin bo'ladi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.tournaments.map((tr) => {
            const joined = currentUser ? tr.participants.includes(currentUser.username) : false;
            return (
              <div key={tr.id} className="nx-surface rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-cyan-300 font-medium">{tr.gameTitle}</div>
                    <h3 className="font-heading font-bold text-lg text-white mt-0.5">{tr.title}</h3>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-200">
                    {tr.status === 'live' ? 'Jonli' : tr.status === 'finished' ? 'Yakunlangan' : 'Yaqinlashmoqda'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/[0.03] rounded-xl p-2.5">
                    <div className="text-slate-400 text-[11px]">Mukofot</div>
                    <div className="text-white font-semibold truncate">{tr.prize}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-2.5">
                    <div className="text-slate-400 text-[11px]">Sana</div>
                    <div className="text-white font-semibold truncate">{tr.startsAt}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-2.5">
                    <div className="text-slate-400 text-[11px]">Ishtirokchilar</div>
                    <div className="text-white font-semibold tabular-nums">{tr.participants.length}</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={joined}
                  onClick={() => onJoinTournament(tr.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    joined ? 'nx-btn-secondary opacity-70 cursor-default' : 'nx-btn-primary'
                  }`}
                >
                  {joined ? "Ro'yxatdan o'tilgan" : 'Ishtirok etish'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const RankingsView: React.FC<BaseSecondaryProps> = ({ state, currentUser, onNavigate }) => {
  const published = getPublishedGames(state.games);
  const ranked = getRankedUsers(state.users);
  const top3 = ranked.slice(0, 3);

  return (
    <div className="space-y-6">
      <SectionHero
        view="rankings"
        override={state.sectionHeroes.rankings}
        publishedCount={published.length}
        usersCount={state.users.length}
        onNavigate={onNavigate}
      />

      {/* Top-3 Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((u, idx) => (
            <div
              key={u.id}
              className="nx-surface rounded-2xl p-5 flex items-center justify-between gap-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="text-xs font-semibold text-cyan-300">#{idx + 1} O'rin</div>
                <div className="font-heading font-bold text-base text-white truncate">
                  {u.displayName || u.username}
                </div>
                <div className="text-[11px] text-slate-400">
                  @{u.username} · {u.sessions} sessiya · {u.achs} yutuq
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono-tabular font-bold text-xl text-white">{u.points}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">ball</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="nx-surface rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="font-heading font-bold text-sm sm:text-base text-white">
            Umumiy reyting jadvali
          </h2>
          <span className="text-xs text-slate-400 tabular-nums">{ranked.length} ishtirokchi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400">
                <th className="py-3 px-5 font-medium">#</th>
                <th className="py-3 px-5 font-medium">O'yinchi</th>
                <th className="py-3 px-5 font-medium">Sessiyalar</th>
                <th className="py-3 px-5 font-medium">Yutuqlar</th>
                <th className="py-3 px-5 font-medium text-right">Ball</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {ranked.map((u, idx) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className={isSelf ? 'bg-white/[0.04]' : ''}>
                    <td className="py-3.5 px-5 font-mono-tabular text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-white">
                        {u.displayName || u.username}
                        {isSelf && <span className="ml-2 text-[11px] text-cyan-300">(Siz)</span>}
                      </div>
                      <div className="text-[11px] text-slate-400">@{u.username}</div>
                    </td>
                    <td className="py-3.5 px-5 tabular-nums text-slate-300">{u.sessions}</td>
                    <td className="py-3.5 px-5 tabular-nums text-slate-300">{u.achs}</td>
                    <td className="py-3.5 px-5 text-right font-mono-tabular font-bold text-cyan-300">
                      {u.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const CommunityView: React.FC<
  BaseSecondaryProps & {
    onAddPost: (text: string) => void;
    onDeletePost: (postId: string) => void;
    onRequireAuth: () => void;
  }
> = ({ state, currentUser, onNavigate, onAddPost, onDeletePost, onRequireAuth }) => {
  const published = getPublishedGames(state.games);
  const [postText, setPostText] = useState('');
  const owner = isOwnerUser(currentUser);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!postText.trim()) return;
    onAddPost(postText.trim());
    setPostText('');
  };

  return (
    <div className="space-y-6">
      <SectionHero
        view="community"
        override={state.sectionHeroes.community}
        publishedCount={published.length}
        usersCount={state.users.length}
        onNavigate={onNavigate}
      />

      <form onSubmit={handleSubmit} className="nx-surface rounded-2xl p-5 space-y-3">
        <label htmlFor="community-post-input" className="block text-xs font-semibold text-white">
          Fikringizni hamjamiyat bilan bo'lishing
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="community-post-input"
            type="text"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder={
              currentUser
                ? "O'yin taassurotingiz yoki taklifingizni yozing..."
                : "Xabar qoldirish uchun avval hisobingizga kiring..."
            }
            className="nx-input flex-1 rounded-xl px-4 py-2.5 text-xs sm:text-sm"
          />
          <button
            type="submit"
            className="nx-btn-primary px-5 py-2.5 rounded-xl text-xs inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Yuborish</span>
          </button>
        </div>
      </form>

      {state.communityPosts.length === 0 ? (
        <div className="nx-surface rounded-2xl p-10 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-blue-300 mx-auto opacity-80" />
          <p className="text-sm font-semibold text-white">Hozircha hamjamiyat xabarlari yo'q</p>
          <p className="text-xs text-slate-400">Birinchi bo'lib fikr qoldiring.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.communityPosts.map((post) => {
            const canDelete =
              owner || (currentUser && post.authorUsername === currentUser.username);
            return (
              <article
                key={post.id}
                className="nx-surface rounded-2xl p-5 flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-white">{post.author}</span>
                    {post.authorUsername && (
                      <span className="text-slate-400">@{post.authorUsername}</span>
                    )}
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 text-[11px]">{post.time}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed break-words">
                    {post.text}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    aria-label="Xabarni o'chirish"
                    onClick={() => onDeletePost(post.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AchievementsView: React.FC<BaseSecondaryProps> = ({
  state,
  currentUser,
  onNavigate,
}) => {
  const published = getPublishedGames(state.games);
  const unlockedIds = new Set(currentUser?.achievements || []);

  return (
    <div className="space-y-6">
      <SectionHero
        view="achievements"
        override={state.sectionHeroes.achievements}
        publishedCount={published.length}
        usersCount={state.users.length}
        onNavigate={onNavigate}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ACHIEVEMENTS_LIST.map((ach) => {
          const unlocked = unlockedIds.has(ach.id);
          return (
            <div
              key={ach.id}
              className={`nx-surface rounded-2xl p-6 space-y-4 border ${
                unlocked ? 'border-emerald-400/35' : 'border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    unlocked
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-white/[0.04] text-slate-400'
                  }`}
                >
                  {unlocked ? <Award className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <span className="font-mono-tabular text-xs font-semibold text-cyan-300">
                  +{ach.points} ball
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="font-heading font-bold text-base text-white">{ach.title}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">{ach.desc}</p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold pt-1">
                {unlocked ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Ochilgan</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400">Hali ochilmagan</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PremiumView: React.FC<
  BaseSecondaryProps & { onTogglePremium: () => void; onRequireAuth: () => void }
> = ({ state, currentUser, onNavigate, onTogglePremium, onRequireAuth }) => {
  const published = getPublishedGames(state.games);
  const isPro = Boolean(currentUser?.premium);

  return (
    <div className="space-y-6">
      <SectionHero
        view="premium"
        override={state.sectionHeroes.premium}
        publishedCount={published.length}
        usersCount={state.users.length}
        onNavigate={onNavigate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="nx-surface rounded-2xl p-6 space-y-5">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-400">Standart tarif</div>
            <h2 className="font-heading font-bold text-xl text-white">Asosiy Ekotizim</h2>
            <p className="text-xs text-slate-400">Barcha nashr etilgan HTML5 o'yinlarga ochiq kirish.</p>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Sandbox muhitida cheksiz o'yin sessiyalari</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Sevimlilar ro'yxati va sessiyalar tarixi</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Reyting va yutuqlar tizimi</span>
            </li>
          </ul>
        </div>

        <div className="nx-surface rounded-2xl p-6 space-y-5 border border-amber-400/30">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <Crown className="w-3.5 h-3.5" />
                <span>NEXPLAY PRO</span>
              </div>
              <h2 className="font-heading font-bold text-xl text-white">Kengaytirilgan Profil</h2>
              <p className="text-xs text-slate-300">
                Profil va reyting jadvalida PRO maqomi hamda ustuvor hamjamiyat belgisi.
              </p>
            </div>
            {isPro && (
              <span className="text-[11px] font-semibold text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/15">
                Faol
              </span>
            )}
          </div>

          <ul className="space-y-2.5 text-xs text-slate-200">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Standart tarifning barcha imkoniyatlari</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Shaxsiy kabinetda PRO statusi va nishoni</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Turnirlar va multiplayer xonalarda ustuvor belgilanish</span>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => (currentUser ? onTogglePremium() : onRequireAuth())}
            className="nx-btn-primary w-full py-3 rounded-xl text-xs font-semibold cursor-pointer"
          >
            {!currentUser
              ? 'Faollashtirish uchun hisobga kiring'
              : isPro
                ? 'PRO holatini bekor qilish'
                : 'NEXPLAY PRO ni faollashtirish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const MultiplayerView: React.FC<
  BaseSecondaryProps & {
    onCreateRoom: (name: string, gameTitle: string) => void;
    onJoinRoom: (roomId: string) => void;
    onRequireAuth: () => void;
  }
> = ({ state, currentUser, onNavigate, onCreateRoom, onJoinRoom, onRequireAuth }) => {
  const published = getPublishedGames(state.games);
  const [roomName, setRoomName] = useState('');
  const [gameTitle, setGameTitle] = useState(published[0]?.title || 'Orbital Pulse');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!roomName.trim()) return;
    onCreateRoom(roomName.trim(), gameTitle.trim() || 'Orbital Pulse');
    setRoomName('');
  };

  return (
    <div className="space-y-6">
      <SectionHero
        view="multiplayer"
        override={state.sectionHeroes.multiplayer}
        publishedCount={published.length}
        usersCount={state.users.length}
        onNavigate={onNavigate}
      />

      <form onSubmit={handleSubmit} className="nx-surface rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="text-xs font-semibold text-white">Yangi multiplayer xona ochish</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Xona nomi (masalan: Arena #1)"
            className="nx-input rounded-xl px-3.5 py-2.5 text-xs"
          />
          <input
            type="text"
            value={gameTitle}
            onChange={(e) => setGameTitle(e.target.value)}
            placeholder="O'yin nomi"
            className="nx-input rounded-xl px-3.5 py-2.5 text-xs"
          />
          <button type="submit" className="nx-btn-primary px-4 py-2.5 rounded-xl text-xs cursor-pointer">
            Xona yaratish
          </button>
        </div>
      </form>

      {state.rooms.length === 0 ? (
        <div className="nx-surface rounded-2xl p-10 text-center space-y-2">
          <Users className="w-8 h-8 text-cyan-300 mx-auto opacity-80" />
          <p className="text-sm font-semibold text-white">Faol multiplayer xonalar yo'q</p>
          <p className="text-xs text-slate-400">
            Yuqoridagi shakl orqali birinchi multiplayer xonasini yarating.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.rooms.map((room) => (
            <div key={room.id} className="nx-surface rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] text-cyan-300 font-medium">{room.gameTitle}</div>
                  <h3 className="font-heading font-bold text-base text-white">{room.name}</h3>
                </div>
                <span className="text-[11px] text-slate-300 tabular-nums">
                  {room.players}/{room.maxPlayers}
                </span>
              </div>
              <div className="text-xs text-slate-400">Mezbon: @{room.host}</div>
              <button
                type="button"
                disabled={room.players >= room.maxPlayers}
                onClick={() => onJoinRoom(room.id)}
                className="nx-btn-secondary w-full py-2 rounded-xl text-xs cursor-pointer disabled:opacity-50"
              >
                {room.players >= room.maxPlayers ? "Xona to'lgan" : "Xonaga qo'shilish"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
