import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGame7DayEngagement,
  calcAverageRating,
  calcProfileCompletion,
  claimMissionReward,
  computePasswordHash,
  evaluateMissions,
  evaluatePasswordStrength,
  filterAndSortGames,
  findBlockedExt,
  formatSize,
  getRankedUsers,
  hydrateSeedCovers,
  isOwnerUser,
  isSafeMedia,
  recordDailyLogin,
  recordDailyPlay,
  recordGameDailyPlay,
  resolveGlobalShortcut,
  validateEntryPath,
  validateRegistrationInput,
  wrapCarouselIndex,
  wrapSandboxedHtml,
} from './nexplayLogic';
import type { NexplayGame, NexplayUser } from '../types/nexplay';

test('password hashing is deterministic and salt-sensitive', async () => {
  const h1 = await computePasswordHash('singlimm', 'nx_alpha_salt_v10');
  const h2 = await computePasswordHash('singlimm', 'nx_alpha_salt_v10');
  const h3 = await computePasswordHash('singlimm', 'other_salt');
  assert.equal(h1, h2);
  assert.notEqual(h1, h3);
  assert.ok(h1.length >= 16);
});

test('zip entry path validator blocks traversal and unsafe paths', () => {
  assert.deepEqual(validateEntryPath('assets/sprite.png'), { ok: true, path: 'assets/sprite.png' });
  assert.equal(validateEntryPath('../secret.txt').ok, false);
  assert.equal(validateEntryPath('/etc/passwd').ok, false);
  assert.equal(validateEntryPath('C:\\windows\\cmd.exe').ok, false);
  assert.equal(validateEntryPath('foo\\bar.html').ok, false);
});

test('blocked executable extensions are detected', () => {
  assert.equal(findBlockedExt('game/launcher.exe'), '.exe');
  assert.equal(findBlockedExt('script/run.sh'), '.sh');
  assert.equal(findBlockedExt('index.html'), '');
});

test('isSafeMedia rejects svg+xml data URIs and javascript URLs', () => {
  assert.equal(isSafeMedia('data:image/svg+xml;utf8,<svg/>'), false);
  assert.equal(isSafeMedia('javascript:alert(1)'), false);
  assert.equal(isSafeMedia('https://example.com/cover.jpg'), true);
  assert.equal(isSafeMedia('data:image/png;base64,iVBORw0KGgo='), true);
});

test('wrapSandboxedHtml rewrites local asset references and locks storage', () => {
  const wrapped = wrapSandboxedHtml(
    '<html><head><link href="styles.css"></head><body><script src="./game.js"></script></body></html>',
    { 'styles.css': 'blob:css', 'game.js': 'blob:js' }
  );
  assert.ok(wrapped.includes('blob:css'));
  assert.ok(wrapped.includes('blob:js'));
  assert.ok(wrapped.includes('Content-Security-Policy'));
  assert.ok(wrapped.includes('localStorage'));
});

test('registration validation enforces username, password length, confirmation, and uniqueness', () => {
  const existing: NexplayUser[] = [
    {
      id: '1',
      username: 'alpha',
      salt: 's',
      passwordHash: 'h',
      role: 'OWNER',
      blocked: false,
      firstName: 'Alpha',
      lastName: '',
      displayName: 'Alpha',
      nickname: '@alpha',
      favoriteGenre: '',
      region: '',
      bio: '',
      avatarData: '',
      premium: true,
      favorites: [],
      history: [],
      achievements: [],
      createdAt: '',
    },
  ];

  assert.ok(validateRegistrationInput({ username: 'ab', password: 'password', confirm: 'password', existingUsers: existing }));
  assert.ok(validateRegistrationInput({ username: 'player1', password: '123', confirm: '123', existingUsers: existing }));
  assert.ok(validateRegistrationInput({ username: 'player1', password: 'password', confirm: 'mismatch', existingUsers: existing }));
  assert.ok(validateRegistrationInput({ username: 'ALPHA', password: 'password', confirm: 'password', existingUsers: existing }));
  assert.equal(validateRegistrationInput({ username: 'player1', password: 'password', confirm: 'password', existingUsers: existing }), null);
});

test('ranking, filtering, profile completion, and size formatting behave deterministically', () => {
  const u1: NexplayUser = {
    id: 'u1',
    username: 'alpha',
    salt: 's',
    passwordHash: 'h',
    role: 'OWNER',
    blocked: false,
    firstName: 'Alpha',
    lastName: '',
    displayName: 'Alpha',
    nickname: '@alpha',
    favoriteGenre: 'Arkada',
    region: 'UZ',
    bio: 'Bio text',
    avatarData: '',
    premium: true,
    favorites: [],
    history: [{ gameId: 'g1', title: 'Orbital', at: '12:00' }],
    achievements: ['first-play'],
    createdAt: '',
  };
  assert.equal(isOwnerUser(u1), true);
  assert.equal(calcProfileCompletion(u1), 85);
  assert.equal(getRankedUsers([u1])[0].points, 35);

  const games: NexplayGame[] = [
    {
      id: 'g1',
      title: 'Beta',
      category: 'Arkada',
      coverUrl: '',
      shortDescription: 'Fast game',
      description: 'Fast game',
      featured: true,
      status: 'published',
      published: true,
      plays: 12,
      packageId: 'p1',
      packageMeta: null,
      createdAt: '2026-11-20T10:00:00.000Z',
    },
    {
      id: 'g2',
      title: 'Alpha',
      category: 'Strategiya',
      coverUrl: '',
      shortDescription: 'Tactical',
      description: 'Tactical',
      featured: false,
      status: 'published',
      published: true,
      plays: 30,
      packageId: 'p2',
      packageMeta: null,
      createdAt: '2026-11-22T10:00:00.000Z',
    },
    {
      id: 'g3',
      title: 'Hidden Draft',
      category: 'Arkada',
      coverUrl: '',
      shortDescription: '',
      description: '',
      featured: false,
      status: 'draft',
      published: false,
      plays: 99,
      packageId: 'p3',
      packageMeta: null,
      createdAt: '2026-11-23T10:00:00.000Z',
    },
  ];

  assert.equal(filterAndSortGames(games, '', '', 'newest').map((g) => g.id).join(','), 'g2,g1');
  assert.equal(filterAndSortGames(games, '', '', 'popular').map((g) => g.id).join(','), 'g2,g1');
  assert.equal(filterAndSortGames(games, '', '', 'title').map((g) => g.id).join(','), 'g2,g1');
  assert.equal(filterAndSortGames(games, '', 'Arkada', 'title').map((g) => g.id).join(','), 'g1');
  assert.equal(formatSize(2048), '2.0 KB');
});

test('global keyboard shortcut resolver maps navigation and accessibility toggles safely', () => {
  assert.deepEqual(resolveGlobalShortcut({ key: 'h' }), { type: 'navigate', view: 'home' });
  assert.deepEqual(resolveGlobalShortcut({ key: 'C' }), { type: 'navigate', view: 'catalog' });
  assert.deepEqual(resolveGlobalShortcut({ key: 'p' }), { type: 'navigate', view: 'profile' });
  assert.deepEqual(resolveGlobalShortcut({ key: '/' }), { type: 'toggle-search' });
  assert.deepEqual(resolveGlobalShortcut({ key: 's' }), { type: 'toggle-search' });
  assert.deepEqual(resolveGlobalShortcut({ key: 'k', ctrlKey: true, targetTagName: 'INPUT' }), { type: 'toggle-search' });
  assert.deepEqual(resolveGlobalShortcut({ key: 'a' }), { type: 'toggle-announcement' });
  assert.deepEqual(resolveGlobalShortcut({ key: '?' }), { type: 'toggle-shortcuts' });
  assert.deepEqual(resolveGlobalShortcut({ key: 'Escape', targetTagName: 'INPUT' }), { type: 'escape' });

  // Single-letter shortcuts are suppressed when typing in inputs or holding modifiers
  assert.equal(resolveGlobalShortcut({ key: 'h', targetTagName: 'INPUT' }), null);
  assert.equal(resolveGlobalShortcut({ key: 'c', targetTagName: 'TEXTAREA' }), null);
  assert.equal(resolveGlobalShortcut({ key: 'p', isContentEditable: true }), null);
  assert.equal(resolveGlobalShortcut({ key: 'h', ctrlKey: true }), null);

  // Admin shortcut only resolves for OWNER
  assert.equal(resolveGlobalShortcut({ key: 'g', isOwner: false }), null);
  assert.deepEqual(resolveGlobalShortcut({ key: 'g', isOwner: true }), { type: 'navigate', view: 'admin' });
});

test('carousel wrap index and seed cover hydration work deterministically', () => {
  assert.equal(wrapCarouselIndex(0, -1, 3), 2);
  assert.equal(wrapCarouselIndex(2, 1, 3), 0);
  assert.equal(wrapCarouselIndex(1, 5, 3), 0);
  assert.equal(wrapCarouselIndex(0, 1, 0), 0);

  const seed: NexplayGame[] = [
    {
      id: 'g-seed',
      title: 'Seed',
      category: 'Arkada',
      coverUrl: '/src/assets/images/orbital_pulse_hero_1795430983268.jpg',
      shortDescription: '',
      description: '',
      featured: true,
      status: 'published',
      published: true,
      plays: 1,
      packageId: 'p1',
      packageMeta: null,
      createdAt: '',
    },
  ];
  const stored: NexplayGame[] = [
    { ...seed[0], coverUrl: '' },
    { ...seed[0], id: 'g-custom', coverUrl: 'https://example.com/custom.jpg' },
  ];
  const hydrated = hydrateSeedCovers(stored, seed);
  assert.equal(hydrated[0].coverUrl, '/src/assets/images/orbital_pulse_hero_1795430983268.jpg');
  assert.equal(hydrated[1].coverUrl, 'https://example.com/custom.jpg');
});

test('daily missions, login streak, reward claiming, and average ratings work deterministically', () => {
  const baseUser: NexplayUser = {
    id: 'u-m1',
    username: 'player',
    salt: 's',
    passwordHash: 'h',
    role: 'USER',
    blocked: false,
    firstName: 'Player',
    lastName: '',
    displayName: 'Player',
    nickname: '@player',
    favoriteGenre: '',
    region: 'UZ',
    bio: '',
    avatarData: '',
    premium: false,
    favorites: ['g1', 'g2'],
    history: [],
    achievements: [],
    loginStreak: 4,
    lastLoginDate: '2026-11-22',
    dailyPlaysDate: '2026-11-22',
    dailyPlaysCount: 2,
    claimedMissions: [],
    badges: [],
    unlockedThemes: ['default'],
    activeTheme: 'default',
    createdAt: '',
  };

  // Consecutive day increments streak; non-consecutive resets to 1
  const uDay5 = recordDailyLogin(baseUser, '2026-11-23');
  assert.equal(uDay5.loginStreak, 5);
  const uGap = recordDailyLogin(baseUser, '2026-11-26');
  assert.equal(uGap.loginStreak, 1);

  // Playing 3 games on a new day
  let uPlay = recordDailyPlay(uDay5, '2026-11-23');
  uPlay = recordDailyPlay(uPlay, '2026-11-23');
  uPlay = recordDailyPlay(uPlay, '2026-11-23');
  assert.equal(uPlay.dailyPlaysCount, 3);

  const missions = evaluateMissions(uPlay, 1, '2026-11-23');
  assert.equal(missions.find((m) => m.id === 'play-3')?.completed, true);
  assert.equal(missions.find((m) => m.id === 'streak-5')?.completed, true);
  assert.equal(missions.find((m) => m.id === 'favorite-2')?.completed, true);
  assert.equal(missions.find((m) => m.id === 'comment-2')?.completed, false);

  // Claim play-3 unlocks cyber-pulse theme and gamer-spark badge
  const claimOk = claimMissionReward(uPlay, 'play-3', 1, '2026-11-23');
  assert.equal(claimOk.ok, true);
  if (claimOk.ok) {
    assert.ok(claimOk.user.unlockedThemes?.includes('cyber-pulse'));
    assert.ok(claimOk.user.badges?.includes('gamer-spark'));
  }

  // Cannot claim uncompleted mission
  const claimFail = claimMissionReward(uPlay, 'comment-2', 1, '2026-11-23');
  assert.equal(claimFail.ok, false);

  assert.deepEqual(
    calcAverageRating([
      { id: 'c1', gameId: 'g1', userId: 'u1', author: 'A', authorUsername: 'a', rating: 5, text: 'Great', createdAt: '' },
      { id: 'c2', gameId: 'g1', userId: 'u2', author: 'B', authorUsername: 'b', rating: 4, text: 'Good', createdAt: '' },
    ]),
    { avg: 4.5, count: 2 }
  );
});

test('game 7-day engagement tracking and password strength evaluation work deterministically', () => {
  const refDate = new Date('2026-11-23T12:00:00');
  let game: NexplayGame = {
    id: 'game-seed-orbital',
    title: 'Orbital Pulse',
    category: 'Arkada',
    coverUrl: '',
    shortDescription: '',
    description: '',
    featured: true,
    status: 'published',
    published: true,
    plays: 14,
    packageId: 'pkg-1',
    packageMeta: null,
    createdAt: '',
  };

  const initialSeries = buildGame7DayEngagement(game, refDate);
  assert.equal(initialSeries.length, 7);
  assert.equal(initialSeries[6].label, 'Bugun');
  assert.equal(initialSeries.reduce((s, d) => s + d.plays, 0), 14);

  game = recordGameDailyPlay(game, '2026-11-23');
  game = recordGameDailyPlay(game, '2026-11-23');
  assert.equal(game.plays, 16);
  const updatedSeries = buildGame7DayEngagement(game, refDate);
  assert.equal(updatedSeries[6].plays, 2);
  assert.equal(updatedSeries.reduce((s, d) => s + d.plays, 0), 16);

  assert.equal(evaluatePasswordStrength('').score, 0);
  assert.equal(evaluatePasswordStrength('abc1').score, 1);
  assert.equal(evaluatePasswordStrength('abcdef').score, 1);
  assert.equal(evaluatePasswordStrength('abcdef1').score, 2);
  assert.equal(evaluatePasswordStrength('Abcdef123').score, 3);
});
