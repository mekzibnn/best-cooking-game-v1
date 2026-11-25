// Dapur Senja — main: game loop, state machine, shot mode, wiring.
// One clear job: own the frame, the state (title/play/pause/over) and the score.

import { CANVAS_W, CANVAS_H, DAY_SECONDS, STATIONS } from './config.js';
import { SoundEngine } from './audio.js';
import { OrderBoard } from './orders.js';
import { Kitchen } from './kitchen.js';
import { Input, pointInRect } from './input.js';
import {
  drawKitchen, drawTitle, drawGameOver, drawPaused, drawRushBanner,
} from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const sound = new SoundEngine();
const orders = new OrderBoard();
const kitchen = new Kitchen(sound);
const input = new Input(canvas);

const game = {
  state: 'title', // title | play | pause | over
  timeLeft: DAY_SECONDS,
  score: 0,
  combo: 0,
  bestCombo: 0,
  best: 0,
  showBook: false,
  rushShown: false,
  rushTimer: 0,
  serves: 0,
  wrongServes: 0,
  shot: null,
  shotReady: false,
};

try {
  game.best = Number(window.localStorage.getItem('dapur-senja-best') || 0) || 0;
} catch (e) { game.best = 0; }

function level() {
  return 1 + Math.floor(game.score / 400);
}

function startDay() {
  orders.reset();
  kitchen.reset();
  kitchen.serveReady = null;
  game.timeLeft = DAY_SECONDS;
  game.score = 0;
  game.combo = 0;
  game.bestCombo = 0;
  game.serves = 0;
  game.wrongServes = 0;
  game.showBook = false;
  game.rushShown = false;
  game.state = 'play';
  sound.ensure();
  sound.startMusic();
  sound.playOrder();
}

function endDay() {
  game.state = 'over';
  sound.stopMusic();
  sound.playRush();
  if (game.score > game.best) {
    game.best = game.score;
    try { window.localStorage.setItem('dapur-senja-best', String(game.best)); } catch (e) {}
  }
}

function serveDish(recipeId) {
  const result = orders.completeOrder(recipeId, game.combo);
  if (result) {
    game.score += result.total;
    game.combo += 1;
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    game.serves += 1;
    kitchen.serveReady = [...kitchen.plate.contents];
    kitchen.showFlash(1120, 430, `+Rp${result.total}`, '#F2B705');
    sound.playServe();
  } else {
    const walkIn = orders.walkInPrice(recipeId);
    game.score += walkIn;
    game.combo = 0;
    game.serves += 1;
    kitchen.setMessage(`Tidak ada pesanan itu — terjual Rp${walkIn} ke pembeli lewat`);
    sound.playServe();
  }
}

function doInteract() {
  if (game.state !== 'play') return;
  const out = kitchen.interact();
  if (out === 'book') {
    game.showBook = !game.showBook;
    sound.playClick();
    return;
  }
  if (out && typeof out === 'object' && out.action === 'serve') {
    serveDish(out.recipeId);
    return;
  }
  if (out === 'error') sound.playError();
}

function update(dt) {
  if (game.state !== 'play') return;
  game.timeLeft -= dt;
  if (game.timeLeft <= 60 && !game.rushShown) {
    game.rushShown = true;
    game.rushTimer = 3;
    sound.playRush();
  }
  if (game.rushTimer > 0) game.rushTimer -= dt;
  kitchen.movePlayer(dt, input.keys, null);
  kitchen.tick(dt);
  const lost = orders.tick(dt, level(), () => sound.playOrder());
  if (lost.length) {
    game.combo = 0;
    game.score = Math.max(0, game.score - 20 * lost.length);
    kitchen.setMessage(`Pesanan hangus! -Rp${20 * lost.length}`);
    sound.playError();
  }
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    endDay();
  }
}

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (game.state === 'title') {
    drawKitchen(ctx, kitchen, orders.orders, DAY_SECONDS, 0, 0, 0, 1, false);
    drawTitle(ctx, game.best);
    return;
  }
  drawKitchen(ctx, kitchen, orders.orders, game.timeLeft, game.score, game.serves, game.combo, level(), game.showBook);
  if (game.rushTimer > 0) drawRushBanner(ctx);
  if (game.state === 'pause') drawPaused(ctx);
  if (game.state === 'over') {
    const total = game.serves + game.wrongServes;
    drawGameOver(ctx, {
      score: game.score,
      served: game.serves,
      expired: orders.expired,
      bestCombo: game.bestCombo,
      accuracy: total ? Math.round((game.serves / total) * 100) : 100,
    });
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.shot) update(dt);
  render();
  requestAnimationFrame(loop);
}

// Keyboard intents
input.onKey = (code) => {
  sound.ensure();
  if (code === 'm') {
    const muted = sound.toggleMute();
    kitchen.setMessage(muted ? 'Suara mati' : 'Suara nyala');
    return;
  }
  if (game.state === 'title') {
    if (code === 'enter' || code === ' ') startDay();
    return;
  }
  if (game.state === 'over') {
    if (code === 'r') startDay();
    if (code === 't') { game.state = 'title'; }
    return;
  }
  if (code === 'p' || code === 'escape') {
    if (game.state === 'play') { game.state = 'pause'; sound.stopMusic(); }
    else if (game.state === 'pause') { game.state = 'play'; sound.startMusic(); }
    return;
  }
  if (game.state === 'pause') return;
  if (code === 'h') { game.showBook = !game.showBook; sound.playClick(); return; }
  if (code === 'e' || code === ' ') doInteract();
};

// Mouse intents: buttons first, then click-to-move / station interact.
input.onClick = (x, y) => {
  sound.ensure();
  if (game.shot) return;
  if (game.showBook) { game.showBook = false; return; }
  if (game.state === 'title') {
    if (pointInRect(x, y, { x: 520, y: 390, w: 240, h: 56 })) startDay();
    return;
  }
  if (game.state === 'over') {
    if (pointInRect(x, y, { x: 500, y: 410, w: 280, h: 52 })) startDay();
    return;
  }
  if (game.state !== 'play') return;
  // Clicking a station walks there and interacts when close.
  const all = [...STATIONS.crates, STATIONS.board, STATIONS.stove, STATIONS.plating, STATIONS.serving, STATIONS.trash, STATIONS.plates, STATIONS.book];
  const hit = all.find((st) => pointInRect(x, y, st));
  if (hit) {
    kitchen.player.target = { x: hit.x + hit.w / 2, y: hit.y + hit.h + 70 };
    // Interact at once if already near, otherwise the arrival does it.
    const d = Math.hypot(kitchen.player.x - (hit.x + hit.w / 2), kitchen.player.y - (hit.y + hit.h + 70));
    if (d < 130) doInteract();
    else kitchen.pendingInteract = hit;
    return;
  }
  kitchen.player.target = { x, y: Math.max(340, y) };
};

// Arrive-and-interact: when a click target was a station, act on arrival.
const origMove = kitchen.movePlayer.bind(kitchen);
kitchen.movePlayer = (dt, keys, clickTarget) => {
  const hadTarget = !!kitchen.player.target;
  origMove(dt, keys, clickTarget);
  if (hadTarget && !kitchen.player.target && kitchen.pendingInteract) {
    kitchen.pendingInteract = null;
    doInteract();
  }
};

// ---- Screenshot shot mode: deterministic staged scenes, timers frozen ----
function stageShot(kind) {
  game.shot = kind;
  game.state = 'play';
  game.showBook = false;
  kitchen.stageShot(kind);
  if (kind === 'cover') {
    orders.addSeedOrders(['nasi-goreng', 'mie-ayam', 'soto-senja'], 0.7);
    orders.orders[0].patience = orders.orders[0].maxPatience * 0.55;
    orders.orders[1].patience = orders.orders[1].maxPatience * 0.8;
    orders.orders[2].patience = orders.orders[2].maxPatience * 0.35;
    game.timeLeft = 92;
    game.score = 340;
    game.serves = 4;
    game.combo = 2;
    kitchen.serveReady = ['telur', 'sayur'];
  } else if (kind === 'start') {
    game.state = 'title';
    orders.addSeedOrders(['nasi-goreng', 'mie-ayam'], 0.8);
  } else if (kind === 'chop') {
    orders.addSeedOrders(['mie-ayam'], 0.6);
    game.timeLeft = 105;
    game.score = 120;
    game.serves = 1;
    game.combo = 1;
  } else if (kind === 'serve') {
    orders.addSeedOrders(['nasi-goreng'], 0.5);
    game.timeLeft = 48;
    game.score = 560;
    game.serves = 6;
    game.combo = 3;
    kitchen.showFlash(1120, 400, '+Rp165', '#F2B705');
  }
  game.shotReady = true;
  document.title = `Dapur Senja — shot ${kind} ready`;
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) stageShot(shot);

window.__dapurSenja = { game, orders, kitchen, startDay, stageShot };
requestAnimationFrame(loop);
