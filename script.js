/* ═══════════════════════════════════════════════
   Pixel RPG Personal Homepage — Weijian Shi
   ═══════════════════════════════════════════════ */

(() => {
"use strict";

const TILE = 16;
const SCALE = 3;
const PLAYER_SPEED = 2;
const MAP_W = 30;
const MAP_H = 22;
const INTERACT_RADIUS = 2.8; // tiles

// Palette
const PAL = {
  grass1:'#5a8c2a', grass2:'#4a7a22',
  path:'#c8b878', pathEdge:'#a89858',
  water:'#3070b0', waterLight:'#4090d0',
  wall:'#8b6848', wallDark:'#6a4830',
  door:'#5a3a20', window:'#70b8e8',
  wood:'#a08060',
  tree1:'#2a6a18', tree2:'#3a8a28', trunk:'#6a4828',
  flower1:'#e04060', flower2:'#e8d040', flower3:'#6080e0',
  skin:'#f0c8a0', hair:'#4a3020',
  shirt:'#3060c0', pants:'#2a2a5a',
  labelBg:'rgba(0,0,0,0.75)', labelText:'#f0c040',
};

const T = { GRASS:0, PATH:1, WATER:2, WALL:3, DOOR:4, TREE:5, FLOWER:6, FENCE:7 };
const SOLID = new Set([T.WALL, T.WATER, T.TREE, T.FENCE]);
const DIR = { down:0, left:1, right:2, up:3 };

// ─── Map ───
const map = Array.from({length:MAP_H}, ()=> new Uint8Array(MAP_W).fill(T.GRASS));

function buildMap() {
  for (let x=0;x<MAP_W;x++) { map[11][x]=T.PATH; map[12][x]=T.PATH; }
  for (let y=0;y<MAP_H;y++) { map[y][14]=T.PATH; map[y][15]=T.PATH; }
  [[3,5,8,9],[9,11,8,9],[19,21,8,9],[24,26,8,9],
   [3,5,14,15],[9,11,14,15],[24,26,14,15]].forEach(([x0,x1,y0,y1])=>{
    for(let x=x0;x<=x1;x++) for(let y=y0;y<=y1;y++) map[y][x]=T.PATH;
  });
  for(let y=17;y<=19;y++) for(let x=21;x<=25;x++) map[y][x]=T.WATER;
  for(let x=0;x<MAP_W;x++){map[0][x]=T.TREE;map[MAP_H-1][x]=T.TREE;}
  for(let y=0;y<MAP_H;y++){map[y][0]=T.TREE;map[y][MAP_W-1]=T.TREE;}
  [[2,2],[7,2],[13,2],[17,2],[22,2],[27,2],[2,20],[7,20],[12,20],[17,17],[27,17],[27,20],[7,5],[22,5],[7,16],[12,16]]
    .forEach(([x,y])=>{if(map[y])map[y][x]=T.TREE;});
  [[3,3],[10,3],[20,3],[26,3],[3,19],[10,19],[18,18]]
    .forEach(([x,y])=>{if(map[y])map[y][x]=T.FLOWER;});
  for(let x=20;x<=26;x++) if(map[16][x]===T.GRASS) map[16][x]=T.FENCE;
  map[17][20]=T.FENCE; map[17][26]=T.FENCE;
}

// ─── Buildings ───
const buildings = [
  { id:'profile',  label:'HOME',    desc:'About Me',        x:3,  y:4, w:4, h:4, color:'#c03030', emoji:'🏠' },
  { id:'research', label:'LAB',     desc:'Research',         x:9,  y:4, w:4, h:4, color:'#6060a0', emoji:'🔬' },
  { id:'projects', label:'ARCADE',  desc:'Projects',         x:19, y:4, w:4, h:4, color:'#a04080', emoji:'🕹️' },
  { id:'awards',   label:'TROPHY',  desc:'Awards',           x:24, y:4, w:4, h:4, color:'#c0a020', emoji:'🏆' },
  { id:'gallery',  label:'GALLERY', desc:'Gallery',          x:3,  y:14,w:4, h:3, color:'#4080a0', emoji:'🖼️' },
  { id:'blog',     label:'BOARD',   desc:'Blog & Notes',     x:9,  y:14,w:4, h:3, color:'#608040', emoji:'📋' },
  { id:'contact',  label:'MAILBOX', desc:'Contact',          x:24, y:14,w:3, h:3, color:'#a06040', emoji:'📮' },
];

const visited = new Set();

function placeBuildings() {
  buildings.forEach(b => {
    for(let dy=0;dy<b.h;dy++) for(let dx=0;dx<b.w;dx++) {
      const my=b.y+dy, mx=b.x+dx;
      if(map[my]) map[my][mx]=T.WALL;
    }
    const doorX=b.x+Math.floor(b.w/2), doorY=b.y+b.h-1;
    if(map[doorY]) map[doorY][doorX]=T.DOOR;
  });
}

// ─── Tile drawing ───
function drawTile(ctx, type, x, y) {
  const px=x*TILE, py=y*TILE;
  switch(type) {
    case T.GRASS:
      ctx.fillStyle=(x+y)%2===0?PAL.grass1:PAL.grass2;
      ctx.fillRect(px,py,TILE,TILE);
      if((x*7+y*13)%11===0){ctx.fillStyle=PAL.tree1;ctx.fillRect(px+6,py+10,1,3);ctx.fillRect(px+9,py+11,1,2);}
      break;
    case T.PATH:
      ctx.fillStyle=PAL.path; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle=PAL.pathEdge; ctx.fillRect(px,py,TILE,1);
      if((x*3+y*7)%9===0){ctx.fillRect(px+4,py+6,2,2);}
      break;
    case T.WATER:
      ctx.fillStyle=PAL.water; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle=PAL.waterLight;
      const w=(Date.now()/500+x)%4;
      ctx.fillRect(px+((w*3)|0),py+4,4,1);
      ctx.fillRect(px+(((w+2)*3)|0)%12,py+10,3,1);
      break;
    case T.TREE:
      ctx.fillStyle=(x+y)%2===0?PAL.grass1:PAL.grass2; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle=PAL.trunk; ctx.fillRect(px+6,py+10,4,6);
      ctx.fillStyle=PAL.tree1; ctx.fillRect(px+2,py+2,12,9);
      ctx.fillStyle=PAL.tree2; ctx.fillRect(px+4,py+1,8,4); ctx.fillRect(px+3,py+4,10,3);
      break;
    case T.FLOWER:
      ctx.fillStyle=(x+y)%2===0?PAL.grass1:PAL.grass2; ctx.fillRect(px,py,TILE,TILE);
      const fc=[PAL.flower1,PAL.flower2,PAL.flower3][(x+y)%3];
      ctx.fillStyle=PAL.tree1; ctx.fillRect(px+7,py+8,1,5);
      ctx.fillStyle=fc; ctx.fillRect(px+5,py+5,5,5);
      ctx.fillStyle='#fff'; ctx.fillRect(px+7,py+7,1,1);
      break;
    case T.FENCE:
      ctx.fillStyle=(x+y)%2===0?PAL.grass1:PAL.grass2; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle=PAL.wood;
      ctx.fillRect(px+1,py+4,14,2); ctx.fillRect(px+1,py+10,14,2);
      ctx.fillRect(px+2,py+2,2,12); ctx.fillRect(px+12,py+2,2,12);
      break;
    case T.WALL:
      ctx.fillStyle=PAL.wall; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle=PAL.wallDark; ctx.fillRect(px,py+TILE-1,TILE,1);
      ctx.fillRect(px+(y%2?8:0),py,1,TILE);
      break;
    case T.DOOR:
      ctx.fillStyle=PAL.wall; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle=PAL.door; ctx.fillRect(px+4,py+2,8,14);
      ctx.fillStyle=PAL.window; ctx.fillRect(px+10,py+6,1,1);
      break;
  }
}

function drawBuildingOverlay(ctx, b) {
  const px=b.x*TILE, py=b.y*TILE, pw=b.w*TILE;
  // Roof
  ctx.fillStyle=b.color;
  ctx.fillRect(px+2,py-6,pw-4,8);
  // Darker top
  ctx.globalAlpha=0.4; ctx.fillStyle='#000';
  ctx.fillRect(px+4,py-8,pw-8,3);
  ctx.globalAlpha=1;
  ctx.fillStyle=b.color;
  ctx.fillRect(px+4,py-8,pw-8,3);
  // Windows
  const winY=b.y*TILE+Math.floor(b.h/2)*TILE+2;
  ctx.fillStyle=PAL.window;
  ctx.fillRect(px+4,winY,4,4);
  if(b.w>=4) ctx.fillRect(px+pw-8,winY,4,4);
}

// Draw floating label above building (in screen space, not world)
function drawBuildingLabels(ctx) {
  ctx.save();
  // Labels are drawn in screen space for crisp text
  buildings.forEach(b => {
    const worldX = (b.x + b.w/2) * TILE;
    const worldY = b.y * TILE - 16;
    const screenX = (worldX - camera.x) * SCALE;
    const screenY = (worldY - camera.y) * SCALE;

    // Off screen? skip
    if (screenX < -100 || screenX > canvas.width+100 || screenY < -50 || screenY > canvas.height+50) return;

    const isVisited = visited.has(b.id);

    // Floating "!" for unvisited
    if (!isVisited) {
      const bounce = Math.sin(Date.now()/300 + b.x) * 3;
      ctx.fillStyle = '#f0c040';
      ctx.font = 'bold 14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', screenX, screenY - 8 + bounce);
    }

    // Label background
    const label = b.label;
    ctx.font = '8px "Press Start 2P", monospace';
    const tw = ctx.measureText(label).width;
    const pad = 6;
    ctx.fillStyle = isVisited ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.85)';
    ctx.fillRect(screenX - tw/2 - pad, screenY - 4, tw + pad*2, 16);

    // Label border
    ctx.strokeStyle = isVisited ? 'rgba(224,216,176,0.3)' : '#f0c040';
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX - tw/2 - pad, screenY - 4, tw + pad*2, 16);

    // Label text
    ctx.fillStyle = isVisited ? 'rgba(224,216,176,0.6)' : '#f0c040';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, screenX, screenY);

    // Checkmark for visited
    if (isVisited) {
      ctx.fillStyle = '#5a5';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText('✓', screenX + tw/2 + pad + 6, screenY + 1);
    }
  });
  ctx.restore();
}

// ─── Arrow pointing to nearest unvisited building ───
function drawGuideArrow(ctx) {
  const unvisited = buildings.filter(b => !visited.has(b.id));
  if (unvisited.length === 0) return;

  const pcx = player.x + TILE/2;
  const pcy = player.y + TILE/2;
  let nearest = unvisited[0], minDist = Infinity;
  unvisited.forEach(b => {
    const bx = (b.x + b.w/2)*TILE, by = (b.y + b.h/2)*TILE;
    const d = Math.hypot(pcx-bx, pcy-by);
    if (d < minDist) { minDist = d; nearest = b; }
  });

  // Only show arrow if not too close
  if (minDist < TILE * 3) return;

  const bx = (nearest.x + nearest.w/2)*TILE;
  const by = (nearest.y + nearest.h/2)*TILE;
  const angle = Math.atan2(by - pcy, bx - pcx);

  const arrowDist = 28;
  const sx = (pcx - camera.x) * SCALE + Math.cos(angle) * arrowDist;
  const sy = (pcy - camera.y) * SCALE + Math.sin(angle) * arrowDist;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);

  const pulse = 0.7 + Math.sin(Date.now()/200) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#f0c040';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-4, -5);
  ctx.lineTo(-4, 5);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Player sprite ───
function drawPlayer(ctx, px, py, dir, frame) {
  ctx.fillStyle=PAL.shirt; ctx.fillRect(px+4,py+6,8,6);
  ctx.fillStyle=PAL.skin; ctx.fillRect(px+5,py+1,6,5);
  ctx.fillStyle=PAL.hair; ctx.fillRect(px+5,py+0,6,2);
  if(dir!==DIR.up){
    ctx.fillStyle='#222';
    if(dir===DIR.left) ctx.fillRect(px+5,py+3,1,1);
    else if(dir===DIR.right) ctx.fillRect(px+10,py+3,1,1);
    else { ctx.fillRect(px+6,py+3,1,1); ctx.fillRect(px+9,py+3,1,1); }
  }
  ctx.fillStyle=PAL.pants;
  ctx.fillRect(px+5,py+12,3,3); ctx.fillRect(px+9,py+12,3,3);
  const legOff = frame%2===0?0:1;
  ctx.fillRect(px+5,py+14+legOff,3,1); ctx.fillRect(px+9,py+14-legOff,3,1);
}

// ─── Game State ───
let gameData = null;
let state = 'boot';
let canvas, ctx;
const player = { x:14.5*TILE, y:11*TILE, dir:DIR.down, frame:0, frameTick:0, moving:false };
const keys = {};
const camera = { x:0, y:0 };
let nearBuilding = null;
let dialogOpen = false;
let tutorialShown = false;

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
    await typeLine(bootText, line, 25);
    bootText.textContent += '\n';
    await sleep(80);
  }
  bootMenu.classList.remove('hidden');
  state = 'menu';
  initMenuControls();
}

function typeLine(el, text, speed) {
  return new Promise(resolve => {
    if (!text.length) return resolve();
    let i = 0;
    const iv = setInterval(() => {
      el.textContent += text[i]; i++;
      if (i >= text.length) { clearInterval(iv); resolve(); }
    }, speed);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Menu ───
let menuIndex = 0;

function initMenuControls() {
  const items = document.querySelectorAll('.menu-item');
  function updateMenu() {
    items.forEach((el, i) => {
      el.classList.toggle('selected', i === menuIndex);
      el.textContent = (i===menuIndex?'▶ ':'  ') + ['NEW GAME','ABOUT'][i];
    });
  }
  function selectMenu() {
    if (menuIndex === 0) {
      startGame();
    } else {
      const bt = document.getElementById('boot-text');
      bt.textContent += '\n── ABOUT ──\nA pixel RPG homepage by Weijian Shi.\nWASD/Arrows to move, SPACE to interact.\nVisit buildings to learn more!\n\nPress any key to continue...\n';
      document.getElementById('boot-menu').classList.add('hidden');
      const h = () => { document.removeEventListener('keydown',h); bt.textContent=''; document.getElementById('boot-menu').classList.remove('hidden'); };
      document.addEventListener('keydown', h);
    }
  }
  document.addEventListener('keydown', e => {
    if (state!=='menu') return;
    if (e.key==='ArrowUp'||e.key==='w') { menuIndex=0; updateMenu(); }
    if (e.key==='ArrowDown'||e.key==='s') { menuIndex=1; updateMenu(); }
    if (e.key==='Enter'||e.key===' ') { e.preventDefault(); selectMenu(); }
  });
  items.forEach((el,i) => el.addEventListener('click', ()=>{ menuIndex=i; updateMenu(); selectMenu(); }));
}

// ─── Start Game ───
function startGame() {
  state = 'game';
  const bootScreen = document.getElementById('boot-screen');
  bootScreen.classList.add('fade-out');
  setTimeout(() => {
    bootScreen.classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
  }, 800);

  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  buildMap();
  placeBuildings();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  initInput();
  buildHUD();
  requestAnimationFrame(gameLoop);

  // Show welcome tutorial after a short delay
  setTimeout(() => {
    if (!tutorialShown) {
      tutorialShown = true;
      showTutorial();
    }
  }, 1000);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (ctx) ctx.imageSmoothingEnabled = false;
}

// ─── HUD ───
function buildHUD() {
  const list = document.getElementById('hud-list');
  list.innerHTML = buildings.map(b =>
    `<div class="hud-item" data-id="${b.id}"><span class="check">·</span><span>${b.label}</span></div>`
  ).join('');
  updateHUD();
}

function updateHUD() {
  buildings.forEach(b => {
    const el = document.querySelector(`.hud-item[data-id="${b.id}"]`);
    if (!el) return;
    const v = visited.has(b.id);
    el.classList.toggle('visited', v);
    el.querySelector('.check').textContent = v ? '★' : '·';
  });
  document.getElementById('hud-count').textContent = visited.size;
}

// ─── Tutorial ───
function showTutorial() {
  const lines = [
    "Welcome to Weijian Shi's world!",
    "",
    "I'm a student at Fudan University",
    "studying Aerospace Engineering",
    "and Computational Science.",
    "",
    "Walk around and visit buildings",
    "to learn about my work!",
    "",
    "─── CONTROLS ───",
    "WASD / Arrows : Move",
    "SPACE : Interact with buildings",
    "ESC : Close dialogs",
    "",
    "Look for the [!] markers above",
    "buildings — those are places",
    "you haven't explored yet.",
    "",
    "The arrow points to the nearest",
    "unvisited building. Have fun!",
  ];
  openDialogRaw('WELCOME', lines.join('\n'), true);
}

// ─── Input ───
function initInput() {
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ' && !dialogOpen && nearBuilding) {
      e.preventDefault();
      openDialog(nearBuilding.id);
    }
    if ((e.key === ' ' || e.key === 'Enter') && dialogOpen) {
      // If typewriter still going, skip to end
      if (typewriterActive) { finishTypewriter(); e.preventDefault(); return; }
    }
    if (e.key === 'Escape' && dialogOpen) closeDialog();
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  // Mobile d-pad
  document.querySelectorAll('.dpad-btn').forEach(btn => {
    const dir = btn.dataset.dir;
    const km = {up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
    const start = e => { e.preventDefault(); keys[km[dir]]=true; };
    const end   = e => { e.preventDefault(); keys[km[dir]]=false; };
    btn.addEventListener('touchstart', start, {passive:false});
    btn.addEventListener('touchend', end, {passive:false});
    btn.addEventListener('touchcancel', end, {passive:false});
  });

  document.getElementById('action-a').addEventListener('touchstart', e => {
    e.preventDefault();
    if (dialogOpen) {
      if (typewriterActive) finishTypewriter();
      else closeDialog();
    }
    else if (nearBuilding) openDialog(nearBuilding.id);
  }, {passive:false});

  document.getElementById('dialog-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('dialog-overlay')) {
      if (typewriterActive) finishTypewriter();
      else closeDialog();
    }
  });
}

// ─── Game Loop ───
let lastTime = 0;

function gameLoop(time) {
  const dt = Math.min(time - lastTime, 50);
  lastTime = time;
  if (state === 'game' && !dialogOpen) {
    updatePlayer();
    updateCamera();
    checkNearBuilding();
  }
  render();
  requestAnimationFrame(gameLoop);
}

function updatePlayer() {
  let dx=0, dy=0;
  if(keys['ArrowUp']||keys['w']||keys['W']) dy=-1;
  if(keys['ArrowDown']||keys['s']||keys['S']) dy=1;
  if(keys['ArrowLeft']||keys['a']||keys['A']) dx=-1;
  if(keys['ArrowRight']||keys['d']||keys['D']) dx=1;
  player.moving = dx!==0||dy!==0;
  if (!player.moving) { player.frameTick=0; return; }

  if(dy<0) player.dir=DIR.up; else if(dy>0) player.dir=DIR.down;
  if(dx<0) player.dir=DIR.left; else if(dx>0) player.dir=DIR.right;
  if(dx!==0&&dy!==0){dx*=0.707;dy*=0.707;}

  const nx=player.x+dx*PLAYER_SPEED, ny=player.y+dy*PLAYER_SPEED;
  const m=4;
  if(!isSolid(nx+m,player.y+m)&&!isSolid(nx+TILE-m,player.y+m)&&!isSolid(nx+m,player.y+TILE-1)&&!isSolid(nx+TILE-m,player.y+TILE-1))
    player.x=nx;
  if(!isSolid(player.x+m,ny+m)&&!isSolid(player.x+TILE-m,ny+m)&&!isSolid(player.x+m,ny+TILE-1)&&!isSolid(player.x+TILE-m,ny+TILE-1))
    player.y=ny;

  player.x=Math.max(TILE,Math.min((MAP_W-2)*TILE,player.x));
  player.y=Math.max(TILE,Math.min((MAP_H-2)*TILE,player.y));
  player.frameTick++;
  if(player.frameTick>=10){player.frameTick=0;player.frame++;}
}

function isSolid(px,py) {
  const tx=Math.floor(px/TILE), ty=Math.floor(py/TILE);
  if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H) return true;
  return SOLID.has(map[ty][tx]);
}

function updateCamera() {
  const tx=player.x-canvas.width/SCALE/2+TILE/2;
  const ty=player.y-canvas.height/SCALE/2+TILE/2;
  camera.x+=(tx-camera.x)*0.1;
  camera.y+=(ty-camera.y)*0.1;
  camera.x=Math.max(0,Math.min(MAP_W*TILE-canvas.width/SCALE,camera.x));
  camera.y=Math.max(0,Math.min(MAP_H*TILE-canvas.height/SCALE,camera.y));
}

function checkNearBuilding() {
  const pcx=player.x+TILE/2, pcy=player.y+TILE/2;
  const prompt=document.getElementById('interact-prompt');
  nearBuilding=null;
  for(const b of buildings){
    const bx=(b.x+b.w/2)*TILE, by=(b.y+b.h)*TILE;
    if(Math.hypot(pcx-bx,pcy-by)<TILE*INTERACT_RADIUS){nearBuilding=b;break;}
  }
  prompt.classList.toggle('hidden',!nearBuilding);
  if(nearBuilding){
    prompt.innerHTML = `<span class="prompt-key">SPACE</span> ${nearBuilding.label} — ${nearBuilding.desc}`;
  }
}

// ─── Rendering ───
function render() {
  if(!ctx) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.scale(SCALE,SCALE);
  ctx.translate(-Math.round(camera.x),-Math.round(camera.y));

  const sx=Math.max(0,Math.floor(camera.x/TILE));
  const sy=Math.max(0,Math.floor(camera.y/TILE));
  const ex=Math.min(MAP_W,Math.ceil((camera.x+canvas.width/SCALE)/TILE)+1);
  const ey=Math.min(MAP_H,Math.ceil((camera.y+canvas.height/SCALE)/TILE)+1);
  for(let y=sy;y<ey;y++) for(let x=sx;x<ex;x++) drawTile(ctx,map[y][x],x,y);
  for(const b of buildings) drawBuildingOverlay(ctx,b);
  drawPlayer(ctx,Math.round(player.x),Math.round(player.y),player.dir,player.frame);

  ctx.restore();

  // Screen-space overlays
  drawBuildingLabels(ctx);
  if (!dialogOpen) drawGuideArrow(ctx);
}

// ─── Dialog System with Typewriter ───
let typewriterActive = false;
let typewriterInterval = null;
let typewriterFullHTML = '';

function openDialog(sectionId) {
  if (!gameData) return;
  visited.add(sectionId);
  updateHUD();
  dialogOpen = true;
  const overlay = document.getElementById('dialog-overlay');
  const title = document.getElementById('dialog-title');
  const content = document.getElementById('dialog-content');
  overlay.classList.remove('hidden');
  const building = buildings.find(b => b.id === sectionId);
  title.textContent = building ? `${building.emoji} ${building.label} — ${building.desc}` : sectionId;
  const html = renderSection(sectionId);
  startTypewriter(content, html);
}

function openDialogRaw(titleText, bodyText, isPlain) {
  dialogOpen = true;
  const overlay = document.getElementById('dialog-overlay');
  const title = document.getElementById('dialog-title');
  const content = document.getElementById('dialog-content');
  overlay.classList.remove('hidden');
  title.textContent = titleText;
  if (isPlain) {
    const html = bodyText.replace(/\n/g, '<br>');
    startTypewriter(content, html);
  } else {
    content.innerHTML = bodyText;
  }
}

function startTypewriter(el, html) {
  typewriterFullHTML = html;
  typewriterActive = true;

  // Strip tags to get plain text for typewriter, then reveal progressively
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const plainText = tmp.textContent || tmp.innerText || '';

  let i = 0;
  el.innerHTML = '';
  const speed = 15;
  const cursor = '<span class="tw-cursor">&nbsp;</span>';

  // For typewriter we reveal characters of the full HTML
  // Simple approach: show progressively more of the plain text
  typewriterInterval = setInterval(() => {
    i += 2; // 2 chars at a time for speed
    if (i >= plainText.length) {
      el.innerHTML = html;
      finishTypewriter();
      return;
    }
    // Show partial text with cursor
    el.textContent = plainText.substring(0, i);
    el.innerHTML += cursor;
  }, speed);
}

function finishTypewriter() {
  if (typewriterInterval) clearInterval(typewriterInterval);
  typewriterInterval = null;
  typewriterActive = false;
  const content = document.getElementById('dialog-content');
  content.innerHTML = typewriterFullHTML;
}

function closeDialog() {
  if (typewriterInterval) clearInterval(typewriterInterval);
  typewriterInterval = null;
  typewriterActive = false;
  dialogOpen = false;
  document.getElementById('dialog-overlay').classList.add('hidden');
}

// ─── Content Renderers ───
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
    default: return 'No data found.';
  }
}

function renderProfile(p) {
  if (!p) return '';
  let h = `<span class="section-label">★ ${p.name} (${p.name_cn})</span>`;
  h += `<br>${p.title}<br>${p.subtitle}<br><br>`;
  p.bio.forEach(b => { h += b.replace(/<\/?strong>/g,'') + '<br><br>'; });
  h += `<span class="section-label">SKILLS:</span><br>${p.skills.join(' · ')}<br><br>`;
  h += `<span class="section-label">HIGHLIGHTS:</span><br>`;
  p.highlights.forEach(x => { h += `${x.label}: ${x.value}<br>`; });
  if (p.education?.length) {
    h += `<br><span class="section-label">EDUCATION:</span><br>`;
    p.education.forEach(e => { h += `${e.date} — ${e.school}<br>${e.degree.replace(/\n/g,'<br>')}<br>`; });
  }
  if (p.focus?.length) {
    h += `<br><span class="section-label">FOCUS:</span><br>`;
    p.focus.forEach(f => { h += `[${f.label}] ${f.text}<br><br>`; });
  }
  return h;
}

function renderResearch(items) {
  if (!items?.length) return 'No research data.';
  return items.map(r =>
    `<div class="item-block"><span class="section-label">${r.title}</span><br>${r.desc}</div>`
  ).join('');
}

function renderProjects(items) {
  if (!items?.length) return 'No projects yet.';
  return items.map(p => {
    let h = `<div class="item-block"><span class="section-label">${p.title}</span><br>`;
    h += `<span class="meta-row">${p.year} · ${p.category}</span><br><br>${p.detail}<br>`;
    if (p.aside) p.aside.forEach(a => { h += `<br>${a.label}: ${a.value}`; });
    if (p.links?.length) { h += '<br>'; p.links.forEach(l => { h += `<br><a href="${l.url}" target="_blank">[${l.label}]</a>`; }); }
    return h + '</div>';
  }).join('');
}

function renderAwards(items) {
  if (!items?.length) return 'No awards yet.';
  return items.map(a => {
    let h = `<div class="item-block"><span class="section-label">${a.title}</span><br>`;
    h += `<span class="meta-row">${a.year} · ${a.category}</span><br><br>${a.detail}<br>`;
    if (a.aside) a.aside.forEach(s => { h += `<br>${s.label}: ${s.value}`; });
    if (a.links?.length) { h += '<br>'; a.links.forEach(l => { h += `<br><a href="${l.url}" target="_blank">[${l.label}]</a>`; }); }
    return h + '</div>';
  }).join('');
}

function renderGallery(items) {
  if (!items?.length) return 'No gallery items.';
  return items.map(g =>
    `<div class="item-block"><span class="section-label">${g.caption}</span><br><span class="meta-row">${g.date}</span><br><img class="gallery-img" src="${g.image}" alt="${g.caption}" onerror="this.style.display='none'"></div>`
  ).join('');
}

function renderBlog(items) {
  if (!items?.length) return 'No blog posts.';
  return items.map(b => {
    let h = `<div class="item-block"><span class="section-label">${b.title}</span><br>`;
    h += `<span class="meta-row">${b.date} · ${b.tags.join(', ')}</span><br><br>${b.desc}`;
    if (b.url && b.url !== '#') h += `<br><br><a href="${b.url}" target="_blank">[Read more]</a>`;
    return h + '</div>';
  }).join('');
}

function renderContact(c) {
  if (!c) return '';
  let h = '';
  if (c.location) h += `Location: ${c.location.replace(/\n/g,', ')}<br><br>`;
  if (c.github) h += `GitHub: <a href="${c.github}" target="_blank">${c.github}</a><br>`;
  if (c.email) h += `Email: ${c.email}<br>`;
  h += '<br>Thanks for visiting my pixel world!';
  return h;
}

// ─── Init ───
async function init() {
  try {
    const resp = await fetch('data.json');
    gameData = await resp.json();
  } catch(e) {
    console.warn('Could not load data.json');
    gameData = {};
  }
  runBoot();
}

init();

})();
