/* ═══════════════════════════════════════════════
   Pixel RPG Personal Homepage — Weijian Shi
   ═══════════════════════════════════════════════ */

(() => {
"use strict";

// ─── Constants ───
const TILE = 16;
const SCALE = 3;
const PLAYER_SPEED = 2;
const MAP_W = 30;
const MAP_H = 22;

// Palette (GB-inspired)
const PAL = {
  grass1: '#5a8c2a', grass2: '#4a7a22',
  path:   '#c8b878', pathEdge: '#a89858',
  water:  '#3070b0', waterLight: '#4090d0',
  wall:   '#8b6848', wallDark: '#6a4830',
  roof:   '#c03030', roofDark: '#902020',
  door:   '#5a3a20', window: '#70b8e8',
  wood:   '#a08060', sign: '#d0b878',
  tree1:  '#2a6a18', tree2: '#3a8a28', trunk: '#6a4828',
  flower1:'#e04060', flower2:'#e8d040', flower3:'#6080e0',
  npc:    '#e0a060',
  skin:   '#f0c8a0', hair: '#4a3020',
  shirt:  '#3060c0', pants: '#2a2a5a',
};

// ─── Tile types ───
const T = {
  GRASS: 0, PATH: 1, WATER: 2, WALL: 3,
  DOOR: 4, TREE: 5, FLOWER: 6, FENCE: 7,
  BUILDING_FLOOR: 8,
};

// Collision: which tiles block movement
const SOLID = new Set([T.WALL, T.WATER, T.TREE, T.FENCE]);

// ─── Map data (hand-crafted) ───
const map = Array.from({length: MAP_H}, () => new Uint8Array(MAP_W).fill(T.GRASS));

function buildMap() {
  // Paths (horizontal main road y=11, vertical road x=15)
  for (let x = 0; x < MAP_W; x++) { map[11][x] = T.PATH; map[12][x] = T.PATH; }
  for (let y = 0; y < MAP_H; y++) { map[y][14] = T.PATH; map[y][15] = T.PATH; }
  // Side paths to buildings
  for (let x = 3; x <= 5; x++) { map[8][x] = T.PATH; map[9][x] = T.PATH; }
  for (let x = 9; x <= 11; x++) { map[8][x] = T.PATH; map[9][x] = T.PATH; }
  for (let x = 19; x <= 21; x++) { map[8][x] = T.PATH; map[9][x] = T.PATH; }
  for (let x = 24; x <= 26; x++) { map[8][x] = T.PATH; map[9][x] = T.PATH; }
  for (let x = 3; x <= 5; x++) { map[14][x] = T.PATH; map[15][x] = T.PATH; }
  for (let x = 9; x <= 11; x++) { map[14][x] = T.PATH; map[15][x] = T.PATH; }
  for (let x = 24; x <= 26; x++) { map[14][x] = T.PATH; map[15][x] = T.PATH; }

  // Water pond (bottom-right area)
  for (let y = 17; y <= 19; y++)
    for (let x = 21; x <= 25; x++) map[y][x] = T.WATER;

  // Trees (border and scattered)
  for (let x = 0; x < MAP_W; x++) { map[0][x] = T.TREE; map[MAP_H-1][x] = T.TREE; }
  for (let y = 0; y < MAP_H; y++) { map[y][0] = T.TREE; map[y][MAP_W-1] = T.TREE; }
  // Scattered trees
  const treePts = [[2,2],[7,2],[13,2],[17,2],[22,2],[27,2],
                   [2,20],[7,20],[12,20],[17,17],[27,17],[27,20],
                   [7,5],[22,5],[7,16],[12,16]];
  treePts.forEach(([x,y]) => { if(map[y]&&map[y][x]!==undefined) map[y][x] = T.TREE; });

  // Flowers
  const flowerPts = [[3,3],[10,3],[20,3],[26,3],[3,19],[10,19],[18,18]];
  flowerPts.forEach(([x,y]) => { if(map[y]&&map[y][x]!==undefined) map[y][x] = T.FLOWER; });

  // Fences near pond
  for (let x = 20; x <= 26; x++) { if(map[16][x]===T.GRASS) map[16][x] = T.FENCE; }
  map[17][20] = T.FENCE; map[17][26] = T.FENCE;
}

// ─── Buildings ───
const buildings = [
  { id:'profile',  name:'HOME',    x:3,  y:4, w:4, h:4, color:PAL.roof,    label:'HOME' },
  { id:'research', name:'LAB',     x:9,  y:4, w:4, h:4, color:'#6060a0',   label:'LAB' },
  { id:'projects', name:'ARCADE',  x:19, y:4, w:4, h:4, color:'#a04080',   label:'ARCADE' },
  { id:'awards',   name:'TROPHY',  x:24, y:4, w:4, h:4, color:'#c0a020',   label:'TROPHY' },
  { id:'gallery',  name:'GALLERY', x:3,  y:14,w:4, h:3, color:'#4080a0',   label:'GALLERY' },
  { id:'blog',     name:'BOARD',   x:9,  y:14,w:4, h:3, color:'#608040',   label:'BOARD' },
  { id:'contact',  name:'MAILBOX', x:24, y:14,w:3, h:3, color:'#a06040',   label:'MAILBOX' },
];

// Place building footprints as walls on map
function placeBuildings() {
  buildings.forEach(b => {
    for (let dy = 0; dy < b.h; dy++)
      for (let dx = 0; dx < b.w; dx++) {
        const my = b.y + dy, mx = b.x + dx;
        if (map[my]) map[my][mx] = T.WALL;
      }
    // Door at bottom-center
    const doorX = b.x + Math.floor(b.w / 2);
    const doorY = b.y + b.h - 1;
    if (map[doorY]) map[doorY][doorX] = T.DOOR;
  });
}

// ─── Sprite Drawing (programmatic) ───
const spriteCache = {};

function drawTile(ctx, type, x, y) {
  const px = x * TILE, py = y * TILE;
  switch(type) {
    case T.GRASS:
      ctx.fillStyle = (x + y) % 2 === 0 ? PAL.grass1 : PAL.grass2;
      ctx.fillRect(px, py, TILE, TILE);
      // Occasional grass tuft
      if ((x * 7 + y * 13) % 11 === 0) {
        ctx.fillStyle = PAL.tree1;
        ctx.fillRect(px+6, py+10, 1, 3);
        ctx.fillRect(px+9, py+11, 1, 2);
      }
      break;
    case T.PATH:
      ctx.fillStyle = PAL.path;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PAL.pathEdge;
      ctx.fillRect(px, py, TILE, 1);
      // Pebbles
      if ((x * 3 + y * 7) % 9 === 0) {
        ctx.fillStyle = PAL.pathEdge;
        ctx.fillRect(px+4, py+6, 2, 2);
      }
      break;
    case T.WATER:
      ctx.fillStyle = PAL.water;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PAL.waterLight;
      const waveOff = (Date.now() / 500 + x) % 4;
      ctx.fillRect(px + ((waveOff*3)|0), py+4, 4, 1);
      ctx.fillRect(px + (((waveOff+2)*3)|0) % 12, py+10, 3, 1);
      break;
    case T.TREE:
      ctx.fillStyle = (x + y) % 2 === 0 ? PAL.grass1 : PAL.grass2;
      ctx.fillRect(px, py, TILE, TILE);
      // Trunk
      ctx.fillStyle = PAL.trunk;
      ctx.fillRect(px+6, py+10, 4, 6);
      // Canopy
      ctx.fillStyle = PAL.tree1;
      ctx.fillRect(px+2, py+2, 12, 9);
      ctx.fillStyle = PAL.tree2;
      ctx.fillRect(px+4, py+1, 8, 4);
      ctx.fillRect(px+3, py+4, 10, 3);
      break;
    case T.FLOWER:
      ctx.fillStyle = (x + y) % 2 === 0 ? PAL.grass1 : PAL.grass2;
      ctx.fillRect(px, py, TILE, TILE);
      const fc = [PAL.flower1, PAL.flower2, PAL.flower3][(x+y)%3];
      ctx.fillStyle = PAL.tree1;
      ctx.fillRect(px+7, py+8, 1, 5);
      ctx.fillStyle = fc;
      ctx.fillRect(px+5, py+5, 5, 5);
      ctx.fillStyle = '#fff';
      ctx.fillRect(px+7, py+7, 1, 1);
      break;
    case T.FENCE:
      ctx.fillStyle = (x + y) % 2 === 0 ? PAL.grass1 : PAL.grass2;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PAL.wood;
      ctx.fillRect(px+1, py+4, 14, 2);
      ctx.fillRect(px+1, py+10, 14, 2);
      ctx.fillRect(px+2, py+2, 2, 12);
      ctx.fillRect(px+12, py+2, 2, 12);
      break;
    case T.WALL:
      ctx.fillStyle = PAL.wall;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PAL.wallDark;
      ctx.fillRect(px, py+TILE-1, TILE, 1);
      // Brick pattern
      const brickRow = y % 2;
      ctx.fillRect(px + (brickRow ? 8 : 0), py, 1, TILE);
      break;
    case T.DOOR:
      ctx.fillStyle = PAL.wall;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = PAL.door;
      ctx.fillRect(px+4, py+2, 8, 14);
      ctx.fillStyle = PAL.window;
      ctx.fillRect(px+10, py+6, 1, 1);
      break;
    default:
      ctx.fillStyle = '#333';
      ctx.fillRect(px, py, TILE, TILE);
  }
}

function drawBuilding(ctx, b) {
  const px = b.x * TILE, py = b.y * TILE;
  const pw = b.w * TILE, ph = b.h * TILE;
  // Roof (triangle top)
  ctx.fillStyle = b.color;
  ctx.fillRect(px+2, py-6, pw-4, 8);
  ctx.fillStyle = b.color.replace(/[0-9a-f]{2}$/i, m => {
    const v = Math.max(0, parseInt(m,16)-0x30);
    return v.toString(16).padStart(2,'0');
  });
  ctx.fillRect(px+4, py-8, pw-8, 4);
  // Windows
  const winY = b.y * TILE + Math.floor(b.h/2) * TILE + 2;
  ctx.fillStyle = PAL.window;
  ctx.fillRect(px + 4, winY, 4, 4);
  if (b.w >= 4) ctx.fillRect(px + pw - 8, winY, 4, 4);
  // Sign
  ctx.fillStyle = '#000';
  ctx.font = '5px monospace';
  ctx.fillText(b.label, px + 2, py - 10);
}

// ─── Player sprite ───
const DIR = { down:0, left:1, right:2, up:3 };

function drawPlayer(ctx, px, py, dir, frame) {
  // Body
  ctx.fillStyle = PAL.shirt;
  ctx.fillRect(px+4, py+6, 8, 6);
  // Head
  ctx.fillStyle = PAL.skin;
  ctx.fillRect(px+5, py+1, 6, 5);
  // Hair
  ctx.fillStyle = PAL.hair;
  ctx.fillRect(px+5, py+0, 6, 2);
  // Eyes
  if (dir !== DIR.up) {
    ctx.fillStyle = '#222';
    if (dir === DIR.left) {
      ctx.fillRect(px+5, py+3, 1, 1);
    } else if (dir === DIR.right) {
      ctx.fillRect(px+10, py+3, 1, 1);
    } else {
      ctx.fillRect(px+6, py+3, 1, 1);
      ctx.fillRect(px+9, py+3, 1, 1);
    }
  }
  // Pants
  ctx.fillStyle = PAL.pants;
  ctx.fillRect(px+5, py+12, 3, 3);
  ctx.fillRect(px+9, py+12, 3, 3);
  // Walk animation
  const legOff = frame % 2 === 0 ? 0 : 1;
  ctx.fillRect(px+5, py+14+legOff, 3, 1);
  ctx.fillRect(px+9, py+14-legOff, 3, 1);
}

// ─── Game State ───
let gameData = null;
let state = 'boot'; // boot | menu | game
let canvas, ctx;

const player = {
  x: 14.5 * TILE, y: 11 * TILE,
  dir: DIR.down, frame: 0, frameTick: 0, moving: false,
};

const keys = {};
const camera = { x: 0, y: 0 };
let nearBuilding = null;
let dialogOpen = false;

// ─── Boot Screen ───
async function runBoot() {
  const bootLines = [
    'PIXEL BIOS v1.0 — Initializing...',
    'CPU: Creative Core i∞ @ ∞ MHz',
    'RAM: 640K ought to be enough',
    '',
    'Checking hardware............ OK',
    'Loading sprite engine........ OK',
    'Mounting tile filesystem..... OK',
    'Initializing NPCs........... OK',
    'Loading world data.......... OK',
    '',
    'All systems ready.',
    '',
    '> Starting Weijian Shi World v1.0...',
    '',
  ];

  const bootText = document.getElementById('boot-text');
  const bootMenu = document.getElementById('boot-menu');

  for (const line of bootLines) {
    await typeLineToEl(bootText, line, 25);
    bootText.textContent += '\n';
    await sleep(80);
  }

  bootMenu.classList.remove('hidden');
  state = 'menu';
  initMenuControls();
}

function typeLineToEl(el, text, speed) {
  return new Promise(resolve => {
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) { clearInterval(interval); resolve(); }
    }, speed);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Menu ───
let menuIndex = 0;
const menuActions = ['newgame', 'about'];

function initMenuControls() {
  const items = document.querySelectorAll('.menu-item');

  function updateMenu() {
    items.forEach((el, i) => {
      el.classList.toggle('selected', i === menuIndex);
      el.textContent = (i === menuIndex ? '▶ ' : '  ') + el.dataset.action.toUpperCase().replace('NEWGAME','NEW GAME');
    });
  }

  function selectMenu() {
    const action = menuActions[menuIndex];
    if (action === 'newgame') {
      startGame();
    } else if (action === 'about') {
      // Show about in boot-text
      const bt = document.getElementById('boot-text');
      bt.textContent += '\n── ABOUT ──\nA pixel RPG homepage by Weijian Shi.\nWASD/Arrows to move, SPACE to interact.\nVisit buildings to learn more!\n\nPress any key to continue...\n';
      const handler = () => {
        document.removeEventListener('keydown', handler);
        bt.textContent = '';
        document.getElementById('boot-menu').classList.remove('hidden');
      };
      document.getElementById('boot-menu').classList.add('hidden');
      document.addEventListener('keydown', handler);
    }
  }

  document.addEventListener('keydown', (e) => {
    if (state !== 'menu') return;
    if (e.key === 'ArrowUp' || e.key === 'w') { menuIndex = Math.max(0, menuIndex - 1); updateMenu(); }
    if (e.key === 'ArrowDown' || e.key === 's') { menuIndex = Math.min(menuActions.length - 1, menuIndex + 1); updateMenu(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectMenu(); }
  });

  items.forEach((el, i) => {
    el.addEventListener('click', () => { menuIndex = i; updateMenu(); selectMenu(); });
  });
}

// ─── Start Game ───
function startGame() {
  state = 'game';
  document.getElementById('boot-screen').classList.add('hidden');
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  buildMap();
  placeBuildings();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  initInput();
  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
}

// ─── Input ───
function initInput() {
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ' && !dialogOpen && nearBuilding) {
      e.preventDefault();
      openDialog(nearBuilding.id);
    }
    if (e.key === 'Escape' && dialogOpen) {
      closeDialog();
    }
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  // Mobile controls
  const dpadBtns = document.querySelectorAll('.dpad-btn');
  dpadBtns.forEach(btn => {
    const dir = btn.dataset.dir;
    const keyMap = { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight' };
    btn.addEventListener('touchstart', e => { e.preventDefault(); keys[keyMap[dir]] = true; }, {passive:false});
    btn.addEventListener('touchend', e => { e.preventDefault(); keys[keyMap[dir]] = false; }, {passive:false});
  });

  document.getElementById('action-a').addEventListener('touchstart', e => {
    e.preventDefault();
    if (dialogOpen) closeDialog();
    else if (nearBuilding) openDialog(nearBuilding.id);
  }, {passive:false});

  // Close dialog on overlay click
  document.getElementById('dialog-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('dialog-overlay')) closeDialog();
  });
}

// ─── Game Loop ───
let lastTime = 0;

function gameLoop(time) {
  const dt = Math.min(time - lastTime, 50);
  lastTime = time;

  if (state === 'game' && !dialogOpen) {
    updatePlayer(dt);
    updateCamera();
    checkNearBuilding();
  }

  render();
  requestAnimationFrame(gameLoop);
}

function updatePlayer(dt) {
  let dx = 0, dy = 0;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) dy = -1;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) dy = 1;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx = -1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx = 1;

  player.moving = dx !== 0 || dy !== 0;

  if (dx !== 0 || dy !== 0) {
    // Update direction
    if (dy < 0) player.dir = DIR.up;
    else if (dy > 0) player.dir = DIR.down;
    if (dx < 0) player.dir = DIR.left;
    else if (dx > 0) player.dir = DIR.right;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707; dy *= 0.707;
    }

    const newX = player.x + dx * PLAYER_SPEED;
    const newY = player.y + dy * PLAYER_SPEED;

    // Collision check (check player bounding box 6px inset)
    const margin = 4;
    if (!isSolid(newX + margin, player.y + margin) &&
        !isSolid(newX + TILE - margin, player.y + margin) &&
        !isSolid(newX + margin, player.y + TILE - 1) &&
        !isSolid(newX + TILE - margin, player.y + TILE - 1)) {
      player.x = newX;
    }
    if (!isSolid(player.x + margin, newY + margin) &&
        !isSolid(player.x + TILE - margin, newY + margin) &&
        !isSolid(player.x + margin, newY + TILE - 1) &&
        !isSolid(player.x + TILE - margin, newY + TILE - 1)) {
      player.y = newY;
    }

    // Clamp to map
    player.x = Math.max(TILE, Math.min((MAP_W - 2) * TILE, player.x));
    player.y = Math.max(TILE, Math.min((MAP_H - 2) * TILE, player.y));

    // Animation
    player.frameTick++;
    if (player.frameTick >= 10) { player.frameTick = 0; player.frame++; }
  } else {
    player.frameTick = 0;
  }
}

function isSolid(px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return true;
  return SOLID.has(map[ty][tx]);
}

function updateCamera() {
  const targetX = player.x - canvas.width / SCALE / 2 + TILE / 2;
  const targetY = player.y - canvas.height / SCALE / 2 + TILE / 2;
  camera.x += (targetX - camera.x) * 0.1;
  camera.y += (targetY - camera.y) * 0.1;
  // Clamp
  camera.x = Math.max(0, Math.min(MAP_W * TILE - canvas.width / SCALE, camera.x));
  camera.y = Math.max(0, Math.min(MAP_H * TILE - canvas.height / SCALE, camera.y));
}

function checkNearBuilding() {
  const pcx = player.x + TILE / 2;
  const pcy = player.y + TILE / 2;
  const prompt = document.getElementById('interact-prompt');

  nearBuilding = null;
  for (const b of buildings) {
    const bx = (b.x + b.w / 2) * TILE;
    const by = (b.y + b.h) * TILE;
    const dist = Math.hypot(pcx - bx, pcy - by);
    if (dist < TILE * 2.5) {
      nearBuilding = b;
      break;
    }
  }

  prompt.classList.toggle('hidden', !nearBuilding);
  if (nearBuilding) {
    prompt.textContent = `SPACE: ${nearBuilding.label}`;
  }
}

// ─── Rendering ───
function render() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(SCALE, SCALE);
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

  // Draw tiles
  const startTX = Math.max(0, Math.floor(camera.x / TILE));
  const startTY = Math.max(0, Math.floor(camera.y / TILE));
  const endTX = Math.min(MAP_W, Math.ceil((camera.x + canvas.width / SCALE) / TILE) + 1);
  const endTY = Math.min(MAP_H, Math.ceil((camera.y + canvas.height / SCALE) / TILE) + 1);

  for (let y = startTY; y < endTY; y++) {
    for (let x = startTX; x < endTX; x++) {
      drawTile(ctx, map[y][x], x, y);
    }
  }

  // Draw buildings (roofs + signs, over tiles)
  for (const b of buildings) {
    drawBuilding(ctx, b);
  }

  // Draw player
  drawPlayer(ctx, Math.round(player.x), Math.round(player.y), player.dir, player.frame);

  ctx.restore();
}

// ─── Dialog System ───
function openDialog(sectionId) {
  if (!gameData) return;
  dialogOpen = true;
  const overlay = document.getElementById('dialog-overlay');
  const title = document.getElementById('dialog-title');
  const content = document.getElementById('dialog-content');

  overlay.classList.remove('hidden');
  const building = buildings.find(b => b.id === sectionId);
  title.textContent = building ? `${building.label} — ${building.name}` : sectionId;

  content.innerHTML = renderSection(sectionId);
}

function closeDialog() {
  dialogOpen = false;
  document.getElementById('dialog-overlay').classList.add('hidden');
}

function renderSection(id) {
  const d = gameData;
  switch(id) {
    case 'profile': return renderProfile(d.profile);
    case 'research': return renderResearch(d.research);
    case 'projects': return renderProjects(d.projects);
    case 'awards': return renderAwards(d.awards);
    case 'gallery': return renderGallery(d.gallery);
    case 'blog': return renderBlog(d.blog);
    case 'contact': return renderContact(d.contact);
    default: return '<p>No data found.</p>';
  }
}

function renderProfile(p) {
  if (!p) return '';
  let html = `<span class="section-label">★ ${p.name} (${p.name_cn})</span>`;
  html += `<br>${p.title}<br>${p.subtitle}<br><br>`;
  p.bio.forEach(b => { html += b.replace(/<\/?strong>/g,'') + '<br><br>'; });
  html += `<span class="section-label">SKILLS:</span><br>`;
  html += p.skills.join(' · ') + '<br><br>';
  html += `<span class="section-label">HIGHLIGHTS:</span><br>`;
  p.highlights.forEach(h => { html += `${h.label}: ${h.value}<br>`; });
  if (p.education && p.education.length) {
    html += `<br><span class="section-label">EDUCATION:</span><br>`;
    p.education.forEach(e => {
      html += `${e.date} — ${e.school}<br>${e.degree.replace(/\n/g,'<br>')}<br>`;
    });
  }
  if (p.focus && p.focus.length) {
    html += `<br><span class="section-label">FOCUS:</span><br>`;
    p.focus.forEach(f => { html += `[${f.label}] ${f.text}<br><br>`; });
  }
  return html;
}

function renderResearch(items) {
  if (!items || !items.length) return 'No research data.';
  return items.map(r =>
    `<div class="item-block"><span class="section-label">${r.title}</span><br>${r.desc}</div>`
  ).join('');
}

function renderProjects(items) {
  if (!items || !items.length) return 'No projects yet.';
  return items.map(p => {
    let html = `<div class="item-block">`;
    html += `<span class="section-label">${p.title}</span><br>`;
    html += `<span class="meta-row">${p.year} · ${p.category}</span><br><br>`;
    html += p.detail + '<br>';
    if (p.aside) {
      p.aside.forEach(a => { html += `<br>${a.label}: ${a.value}`; });
    }
    if (p.links && p.links.length) {
      html += '<br>';
      p.links.forEach(l => { html += `<br><a href="${l.url}" target="_blank">[${l.label}]</a>`; });
    }
    html += '</div>';
    return html;
  }).join('');
}

function renderAwards(items) {
  if (!items || !items.length) return 'No awards yet.';
  return items.map(a => {
    let html = `<div class="item-block">`;
    html += `<span class="section-label">${a.title}</span><br>`;
    html += `<span class="meta-row">${a.year} · ${a.category}</span><br><br>`;
    html += a.detail + '<br>';
    if (a.aside) {
      a.aside.forEach(s => { html += `<br>${s.label}: ${s.value}`; });
    }
    if (a.links && a.links.length) {
      html += '<br>';
      a.links.forEach(l => { html += `<br><a href="${l.url}" target="_blank">[${l.label}]</a>`; });
    }
    html += '</div>';
    return html;
  }).join('');
}

function renderGallery(items) {
  if (!items || !items.length) return 'No gallery items.';
  return items.map(g =>
    `<div class="item-block"><span class="section-label">${g.caption}</span><br><span class="meta-row">${g.date}</span><br>Image: ${g.image}</div>`
  ).join('');
}

function renderBlog(items) {
  if (!items || !items.length) return 'No blog posts.';
  return items.map(b => {
    let html = `<div class="item-block">`;
    html += `<span class="section-label">${b.title}</span><br>`;
    html += `<span class="meta-row">${b.date} · ${b.tags.join(', ')}</span><br><br>`;
    html += b.desc;
    if (b.url && b.url !== '#') html += `<br><br><a href="${b.url}" target="_blank">[Read more]</a>`;
    html += '</div>';
    return html;
  }).join('');
}

function renderContact(c) {
  if (!c) return '';
  let html = '';
  if (c.location) html += `Location: ${c.location.replace(/\n/g,', ')}<br><br>`;
  if (c.github) html += `GitHub: <a href="${c.github}" target="_blank">${c.github}</a><br>`;
  if (c.email) html += `Email: ${c.email}<br>`;
  html += '<br>Thanks for visiting my pixel world!';
  return html;
}

// ─── Load data and start ───
async function init() {
  try {
    const resp = await fetch('data.json');
    gameData = await resp.json();
  } catch(e) {
    console.warn('Could not load data.json, using empty data');
    gameData = {};
  }
  runBoot();
}

init();

})();
