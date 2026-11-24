import type { NexplayGame, NexplayPackageRecord } from '../types/nexplay';

const ORBITAL_PULSE_HTML = `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #04070f; color: #f8fafc; font-family: system-ui, sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(11,16,27,0.85); font-size: 13px; }
  canvas { flex: 1; width: 100%; height: 100%; display: block; }
  .btn { background: #2563eb; color: #fff; border: 0; border-radius: 8px; padding: 6px 14px; font-weight: 600; cursor: pointer; }
</style>
</head>
<body>
<header>
  <div><strong>Orbital Pulse</strong> · Ochko: <span id="score">0</span> · Qalqon: <span id="hp">3</span></div>
  <button class="btn" id="resetBtn">Qayta boshlash</button>
</header>
<canvas id="c"></canvas>
<script>
  const c = document.getElementById('c');
  const ctx = c.getContext('2d');
  let w = 0, h = 0, px = 0, py = 0, tx = 0, ty = 0, score = 0, hp = 3, over = false;
  const orbs = [], hazards = [];
  function resize() { w = c.width = c.clientWidth; h = c.height = c.clientHeight; if (!px) { px = tx = w / 2; py = ty = h / 2; } }
  resize(); window.addEventListener('resize', resize);
  function spawnOrb() { orbs.push({ x: 30 + Math.random() * (w - 60), y: -20, r: 8, vy: 1.5 + Math.random() * 1.3 }); }
  function spawnHazard() { hazards.push({ x: 30 + Math.random() * (w - 60), y: -24, r: 12, vy: 2.1 + Math.random() * 1.6 }); }
  function reset() { score = 0; hp = 3; over = false; orbs.length = 0; hazards.length = 0; px = tx = w / 2; py = ty = h * 0.72; document.getElementById('score').textContent = '0'; document.getElementById('hp').textContent = '3'; }
  document.getElementById('resetBtn').onclick = reset;
  window.addEventListener('pointermove', (e) => { const rect = c.getBoundingClientRect(); tx = e.clientX - rect.left; ty = e.clientY - rect.top; });
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });
  let frame = 0;
  function loop() {
    frame++;
    ctx.fillStyle = '#04070f'; ctx.fillRect(0, 0, w, h);
    if (!over) {
      if (keys['ArrowLeft'] || keys['a']) tx -= 7;
      if (keys['ArrowRight'] || keys['d']) tx += 7;
      if (keys['ArrowUp'] || keys['w']) ty -= 7;
      if (keys['ArrowDown'] || keys['s']) ty += 7;
      tx = Math.max(20, Math.min(w - 20, tx)); ty = Math.max(20, Math.min(h - 20, ty));
      px += (tx - px) * 0.14; py += (ty - py) * 0.14;
      if (frame % 48 === 0) spawnOrb();
      if (frame % 68 === 0 && frame > 120) spawnHazard();
      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i]; o.y += o.vy;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fillStyle = '#38bdf8'; ctx.fill();
        if (Math.hypot(o.x - px, o.y - py) < o.r + 14) { orbs.splice(i, 1); score += 10; document.getElementById('score').textContent = String(score); }
        else if (o.y > h + 20) orbs.splice(i, 1);
      }
      for (let i = hazards.length - 1; i >= 0; i--) {
        const hz = hazards[i]; hz.y += hz.vy;
        ctx.beginPath(); ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2); ctx.fillStyle = '#f43f5e'; ctx.fill();
        if (Math.hypot(hz.x - px, hz.y - py) < hz.r + 12) { hazards.splice(i, 1); hp--; document.getElementById('hp').textContent = String(Math.max(0, hp)); if (hp <= 0) over = true; }
        else if (hz.y > h + 25) hazards.splice(i, 1);
      }
    }
    ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fillStyle = '#3b82f6'; ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, 20, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(59,130,246,0.45)'; ctx.lineWidth = 2; ctx.stroke();
    if (over) {
      ctx.fillStyle = 'rgba(4,7,15,0.75)'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 24px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('O\\'yin tugadi · Natija: ' + score, w / 2, h / 2);
    }
    requestAnimationFrame(loop);
  }
  loop();
</script>
</body>
</html>`;

const KVANT_LABIRINT_HTML = `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #050811; color: #f8fafc; font-family: system-ui, sans-serif; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 16px; }
  .hud { display: flex; align-items: center; gap: 18px; font-size: 14px; color: #cbd5e1; }
  .grid { display: grid; grid-template-columns: repeat(4, 66px); gap: 10px; }
  .tile { width: 66px; height: 66px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background: #0b101b; color: #fff; font-size: 20px; font-weight: 700; cursor: pointer; transition: transform 0.12s, background 0.15s; }
  .tile:hover { border-color: #3b82f6; transform: translateY(-2px); }
  .tile.empty { background: rgba(255,255,255,0.03); border-style: dashed; cursor: default; transform: none; }
  .btn { background: #06b6d4; color: #04070f; border: 0; border-radius: 10px; padding: 8px 16px; font-weight: 700; cursor: pointer; }
</style>
</head>
<body>
  <div class="hud"><strong>Kvant Labirint 15</strong> · Yurishlar: <span id="moves">0</span> <button class="btn" id="shuffle">Aralashtirish</button></div>
  <div class="grid" id="grid"></div>
  <div id="status" style="font-size:13px;color:#38bdf8;min-height:20px;"></div>
<script>
  let board = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0];
  let moves = 0;
  function scramble() {
    board = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0];
    let empty = 15;
    for (let i = 0; i < 60; i++) {
      const nbs = [empty-1, empty+1, empty-4, empty+4].filter(n => n >= 0 && n < 16 && (Math.floor(n/4) === Math.floor(empty/4) || n%4 === empty%4));
      const pick = nbs[Math.floor(Math.random() * nbs.length)];
      [board[empty], board[pick]] = [board[pick], board[empty]];
      empty = pick;
    }
    moves = 0; document.getElementById('moves').textContent = '0'; document.getElementById('status').textContent = ''; render();
  }
  function render() {
    const g = document.getElementById('grid'); g.innerHTML = '';
    const empty = board.indexOf(0);
    board.forEach((v, idx) => {
      const b = document.createElement('button');
      b.className = 'tile' + (v === 0 ? ' empty' : '');
      b.textContent = v === 0 ? '' : String(v);
      b.onclick = () => {
        const adj = Math.abs(Math.floor(idx/4)-Math.floor(empty/4)) + Math.abs((idx%4)-(empty%4)) === 1;
        if (!adj) return;
        [board[idx], board[empty]] = [board[empty], board[idx]];
        moves++; document.getElementById('moves').textContent = String(moves);
        if (board.slice(0,15).every((n, i) => n === i + 1)) document.getElementById('status').textContent = 'Tabriklaymiz! ' + moves + ' yurishda yechdingiz.';
        render();
      };
      g.appendChild(b);
    });
  }
  document.getElementById('shuffle').onclick = scramble;
  scramble();
</script>
</body>
</html>`;

const VEKTOR_REAKSIYA_HTML = `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #04070f; color: #f8fafc; font-family: system-ui, sans-serif; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
  header { padding: 12px 18px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(11,16,27,0.85); font-size: 13px; }
  #arena { position: relative; flex: 1; overflow: hidden; }
  #target { position: absolute; width: 54px; height: 54px; border-radius: 999px; background: radial-gradient(circle, #8b5cf6, #3b82f6); border: 2px solid #93c5fd; cursor: pointer; transition: transform 0.1s; }
  #target:active { transform: scale(0.9); }
</style>
</head>
<body>
<header>
  <div><strong>Vektor Reaksiya</strong> · Aniqlik: <span id="hits">0</span> · Rekord reaksiya: <span id="best">—</span></div>
  <div>Bosish orqali nishonni tuting</div>
</header>
<div id="arena"><button id="target" aria-label="Nishon"></button></div>
<script>
  const arena = document.getElementById('arena');
  const tgt = document.getElementById('target');
  let hits = 0, best = null, appeared = performance.now();
  function place() {
    const r = arena.getBoundingClientRect();
    const x = Math.max(16, Math.random() * Math.max(40, r.width - 76));
    const y = Math.max(16, Math.random() * Math.max(40, r.height - 76));
    tgt.style.left = x + 'px'; tgt.style.top = y + 'px';
    appeared = performance.now();
  }
  tgt.onclick = () => {
    const ms = Math.round(performance.now() - appeared);
    hits++; document.getElementById('hits').textContent = String(hits);
    if (best === null || ms < best) { best = ms; document.getElementById('best').textContent = ms + ' ms'; }
    place();
  };
  setTimeout(place, 40);
</script>
</body>
</html>`;

export const SEED_CATEGORIES = ['Arkada', 'Boshqotirma', 'Strategiya'];

export const SEED_PACKAGES: NexplayPackageRecord[] = [
  {
    packageId: 'pkg-seed-orbital',
    packageType: 'html',
    fileName: 'orbital-pulse.html',
    totalSize: ORBITAL_PULSE_HTML.length,
    fileCount: 1,
    entryPath: 'orbital-pulse.html',
    htmlCandidates: ['orbital-pulse.html'],
    htmlContent: ORBITAL_PULSE_HTML,
  },
  {
    packageId: 'pkg-seed-kvant',
    packageType: 'html',
    fileName: 'kvant-labirint.html',
    totalSize: KVANT_LABIRINT_HTML.length,
    fileCount: 1,
    entryPath: 'kvant-labirint.html',
    htmlCandidates: ['kvant-labirint.html'],
    htmlContent: KVANT_LABIRINT_HTML,
  },
  {
    packageId: 'pkg-seed-vektor',
    packageType: 'html',
    fileName: 'vektor-reaksiya.html',
    totalSize: VEKTOR_REAKSIYA_HTML.length,
    fileCount: 1,
    entryPath: 'vektor-reaksiya.html',
    htmlCandidates: ['vektor-reaksiya.html'],
    htmlContent: VEKTOR_REAKSIYA_HTML,
  },
];

export const SEED_GAMES: NexplayGame[] = [
  {
    id: 'game-seed-orbital',
    title: 'Orbital Pulse',
    category: 'Arkada',
    coverUrl: '/src/assets/images/orbital_pulse_hero_1795430983268.jpg',
    shortDescription:
      "Koinot maydonida energiya sharlarini to'plang va xavfli asteroidlardan chap bering.",
    description:
      "Orbital Pulse — sichqoncha, sensor va klaviatura boshqaruvi bilan ishlaydigan tezkor HTML5 arkada o'yini.",
    featured: true,
    status: 'published',
    published: true,
    plays: 14,
    packageId: 'pkg-seed-orbital',
    packageMeta: {
      packageType: 'html',
      fileName: 'orbital-pulse.html',
      totalSize: ORBITAL_PULSE_HTML.length,
      fileCount: 1,
      entryPath: 'orbital-pulse.html',
    },
    createdAt: '2026-11-20T10:00:00.000Z',
    accentTone: 'blue',
  },
  {
    id: 'game-seed-kvant',
    title: 'Kvant Labirint',
    category: 'Boshqotirma',
    coverUrl: '/src/assets/images/kvant_labirint_hero_1795430982803.jpg',
    shortDescription:
      "1 dan 15 gacha bo'lgan kvant plitalarini eng kam yurishda tartibga keltiring.",
    description:
      "Kvant Labirint — mantiqiy fikrlash va tezkor kombinatsiyalarni sinovdan o'tkazuvchi klassik boshqotirma.",
    featured: true,
    status: 'published',
    published: true,
    plays: 9,
    packageId: 'pkg-seed-kvant',
    packageMeta: {
      packageType: 'html',
      fileName: 'kvant-labirint.html',
      totalSize: KVANT_LABIRINT_HTML.length,
      fileCount: 1,
      entryPath: 'kvant-labirint.html',
    },
    createdAt: '2026-11-21T12:00:00.000Z',
    accentTone: 'cyan',
  },
  {
    id: 'game-seed-vektor',
    title: 'Vektor Reaksiya',
    category: 'Strategiya',
    coverUrl: '/src/assets/images/vektor_reaksiya_hero_1795430982965.jpg',
    shortDescription:
      "Harakatlanuvchi vektor nishonlarini millisekund aniqligida tutib, reaksiya rekordini o'rnating.",
    description:
      "Vektor Reaksiya — diqqat va tezkor qaror qabul qilish qobiliyatini o'lchovchi brauzer mashg'uloti.",
    featured: true,
    status: 'published',
    published: true,
    plays: 11,
    packageId: 'pkg-seed-vektor',
    packageMeta: {
      packageType: 'html',
      fileName: 'vektor-reaksiya.html',
      totalSize: VEKTOR_REAKSIYA_HTML.length,
      fileCount: 1,
      entryPath: 'vektor-reaksiya.html',
    },
    createdAt: '2026-11-22T14:00:00.000Z',
    accentTone: 'violet',
  },
];
