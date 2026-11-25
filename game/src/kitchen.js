// Dapur Senja — Kitchen: player movement, stations, chopping, cooking, plating.
// One clear job: the state of the chef's hands and every station on the floor.

import {
  STATIONS, PLAYER_START, PLAYER_SPEED, CHOP_SECONDS, COOK_SECONDS,
  INGREDIENTS, findRecipeByIngredients, CANVAS_W, CANVAS_H,
} from './config.js';

export function makeItem(ingredientId) {
  const ing = INGREDIENTS[ingredientId];
  return {
    kind: 'ing',
    id: ingredientId,
    name: ing.name,
    color: ing.color,
    prep: ing.prep,
    stage: ing.prep === 'ready' ? 2 : 0, // 0 raw, 1 chopped, 2 ready
  };
}

export function itemIsReady(item) {
  return item && item.kind === 'ing' && item.stage >= 2;
}

export function itemLabel(item) {
  if (!item) return '';
  if (item.kind === 'plate') {
    const dish = findRecipeByIngredients(item.contents);
    return dish ? dish.name : `Piring (${item.contents.length})`;
  }
  const ing = INGREDIENTS[item.id];
  if (item.stage === 0) return ing.name;
  if (item.stage === 1) return `${ing.name} cincang`;
  return `${ing.name} siap`;
}

export class Kitchen {
  constructor(sound) {
    this.sound = sound;
    this.reset();
  }

  reset() {
    this.player = { x: PLAYER_START.x, y: PLAYER_START.y, dir: 1, moving: false, target: null };
    this.carried = null;
    this.board = { item: null, progress: 0 };
    this.stove = [{ item: null, progress: 0 }, { item: null, progress: 0 }];
    this.plate = { contents: [], onCounter: true };
    this.plateCarried = false;
    this.message = '';
    this.messageTimer = 0;
    this.flash = null; // {x, y, text, color, t}
  }

  setMessage(text) {
    this.message = text;
    this.messageTimer = 2.2;
  }

  showFlash(x, y, text, color) {
    this.flash = { x, y, text, color, t: 1.2 };
  }

  stationCenter(st) {
    return { x: st.x + st.w / 2, y: st.y + st.h / 2 };
  }

  nearestStation(px, py) {
    let best = null;
    let bestD = 110;
    const all = [
      ...STATIONS.crates,
      STATIONS.board, STATIONS.stove, STATIONS.plating,
      STATIONS.serving, STATIONS.trash, STATIONS.plates, STATIONS.book,
    ];
    for (const st of all) {
      const c = this.stationCenter(st);
      const d = Math.hypot(px - c.x, py - (c.y + 60));
      if (d < bestD) { bestD = d; best = st; }
    }
    return best;
  }

  movePlayer(dt, keys, clickTarget) {
    const p = this.player;
    if (clickTarget) p.target = { x: clickTarget.x, y: clickTarget.y };
    let vx = 0;
    let vy = 0;
    if (keys['arrowleft'] || keys['a']) vx -= 1;
    if (keys['arrowright'] || keys['d']) vx += 1;
    if (keys['arrowup'] || keys['w']) vy -= 1;
    if (keys['arrowdown'] || keys['s']) vy += 1;
    if (vx !== 0 || vy !== 0) {
      p.target = null;
      const len = Math.hypot(vx, vy);
      p.x += (vx / len) * PLAYER_SPEED * dt;
      p.y += (vy / len) * PLAYER_SPEED * dt;
      p.dir = vx !== 0 ? Math.sign(vx) : p.dir;
      p.moving = true;
    } else if (p.target) {
      const dx = p.target.x - p.x;
      const dy = p.target.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 8) {
        p.target = null;
        p.moving = false;
      } else {
        p.x += (dx / d) * PLAYER_SPEED * dt;
        p.y += (dy / d) * PLAYER_SPEED * dt;
        p.dir = dx !== 0 ? Math.sign(dx) : p.dir;
        p.moving = true;
      }
    } else {
      p.moving = false;
    }
    p.x = Math.max(30, Math.min(CANVAS_W - 30, p.x));
    p.y = Math.max(330, Math.min(CANVAS_H - 26, p.y));
  }

  tick(dt) {
    if (this.messageTimer > 0) this.messageTimer -= dt;
    if (this.flash && (this.flash.t -= dt) <= 0) this.flash = null;
    // Cooking runs on its own once food is on the stove.
    for (const slot of this.stove) {
      if (slot.item && slot.item.stage < 2 && slot.progress < 1) {
        slot.progress += dt / COOK_SECONDS;
        if (slot.progress >= 1) {
          slot.progress = 1;
          slot.item.stage = 2;
          if (this.sound) this.sound.playTick();
        }
      }
    }
  }

  // One press of E / Space / click on a station. Returns an action tag for main.js.
  interact() {
    const st = this.nearestStation(this.player.x, this.player.y);
    if (!st) { this.setMessage('Dekati meja dulu — jalan ke stasiun lalu tekan E'); return 'none'; }
    if (st.kind === 'book') return 'book';
    if (st.kind === 'crate') return this.takeIngredient(st);
    if (st.kind === 'board') return this.useBoard();
    if (st.kind === 'stove') return this.useStove();
    if (st.kind === 'plating') return this.usePlating();
    if (st.kind === 'serving') return this.useServing();
    if (st.kind === 'trash') return this.useTrash();
    if (st.kind === 'plates') return this.takePlate();
    return 'none';
  }

  takeIngredient(st) {
    if (this.carried) { this.setMessage('Tangan penuh — sajikan atau buang dulu'); return 'error'; }
    this.carried = makeItem(st.ingredient);
    if (this.sound) this.sound.playPickup();
    return 'pickup';
  }

  takePlate() {
    if (this.carried) { this.setMessage('Tangan penuh'); return 'error'; }
    if (this.plate.onCounter && this.plate.contents.length > 0) {
      this.carried = { kind: 'plate', contents: [...this.plate.contents] };
      this.plate.contents = [];
      this.plate.onCounter = false;
      if (this.sound) this.sound.playPickup();
      return 'pickup-plate';
    }
    this.carried = { kind: 'plate', contents: [] };
    if (this.sound) this.sound.playPickup();
    return 'pickup-plate';
  }

  useBoard() {
    const b = this.board;
    if (b.item) {
      if (b.progress >= 1) {
        if (this.carried) { this.setMessage('Tangan penuh'); return 'error'; }
        this.carried = b.item;
        this.board = { item: null, progress: 0 };
        if (this.sound) this.sound.playPickup();
        return 'pickup';
      }
      // Chop: each press adds a third of the work.
      b.progress = Math.min(1, b.progress + 1 / 3);
      if (this.sound) this.sound.playChop();
      if (b.progress >= 1) {
        b.item.stage = 1;
        if (b.item.prep === 'chop') b.item.stage = 2;
        this.setMessage(`${b.item.name} selesai dicincang!`);
      }
      return 'chop';
    }
    if (!this.carried || this.carried.kind !== 'ing') {
      this.setMessage('Bawa bahan mentah ke talenan dulu');
      return 'error';
    }
    const item = this.carried;
    if (item.prep === 'cook' || item.prep === 'ready') {
      this.setMessage(`${item.name} tidak perlu dicincang — langsung ke kompor`);
      return 'error';
    }
    this.board = { item, progress: 0 };
    this.carried = null;
    if (this.sound) this.sound.playClick();
    return 'place-board';
  }

  useStove() {
    // A finished dish comes off first, whichever burner it is on.
    const done = this.stove.find((s) => s.item && s.progress >= 1);
    if (done) {
      if (this.carried) { this.setMessage('Tangan penuh'); return 'error'; }
      this.carried = done.item;
      done.item = null;
      done.progress = 0;
      if (this.sound) this.sound.playPickup();
      return 'pickup';
    }
    if (!this.carried || this.carried.kind !== 'ing') {
      this.setMessage('Bawa bahan ke kompor untuk dimasak');
      return 'error';
    }
    const item = this.carried;
    if (item.prep === 'ready') { this.setMessage(`${item.name} sudah siap — langsung ke piring`); return 'error'; }
    if (item.prep === 'chopcook' && item.stage < 1) {
      this.setMessage(`${item.name} harus dicincang dulu di talenan`);
      return 'error';
    }
    const slot = this.stove.find((s) => !s.item);
    if (!slot) { this.setMessage('Kompor penuh — tunggu matang'); return 'error'; }
    slot.item = item;
    slot.progress = 0;
    this.carried = null;
    if (this.sound) this.sound.playSizzle();
    return 'place-stove';
  }

  usePlating() {
    if (this.carried && this.carried.kind === 'ing') {
      if (!itemIsReady(this.carried)) {
        this.setMessage(`${this.carried.name} belum siap — olah dulu!`);
        return 'error';
      }
      this.plate.contents.push(this.carried.id);
      this.carried = null;
      if (this.sound) this.sound.playClick();
      const dish = findRecipeByIngredients(this.plate.contents);
      if (dish) this.setMessage(`${dish.name} selesai dirakit — antar ke jendela!`);
      return 'plate-add';
    }
    if (this.carried && this.carried.kind === 'plate') {
      if (this.carried.contents.length > 0) {
        this.plate.contents = [...this.carried.contents];
        this.plate.onCounter = true;
        this.carried = null;
        if (this.sound) this.sound.playClick();
        return 'plate-down';
      }
      this.setMessage('Piring kosong — isi dengan bahan siap saji');
      return 'error';
    }
    // Empty hands: pick the plate up from the counter.
    if (this.plate.contents.length > 0) return this.takePlate();
    this.setMessage('Ambil piring kosong di rak PIRING, lalu isi bahannya');
    return 'error';
  }

  useServing() {
    if (!this.carried || this.carried.kind !== 'plate') {
      this.setMessage('Bawa piring hidangan ke jendela sajian');
      return 'error';
    }
    const dish = findRecipeByIngredients(this.carried.contents);
    if (!dish) {
      this.setMessage('Piring belum jadi hidangan lengkap — cek Buku Resep (H)');
      return 'error';
    }
    const plate = this.carried;
    this.carried = null;
    return { action: 'serve', recipeId: dish.id, plate };
  }

  useTrash() {
    if (this.carried) { this.carried = null; this.setMessage('Dibuang.'); return 'trash'; }
    if (this.plate.contents.length > 0) {
      this.plate.contents = [];
      this.setMessage('Piring dikosongkan.');
      return 'trash';
    }
    this.setMessage('Tidak ada yang dibuang');
    return 'none';
  }

  plateDish() {
    return findRecipeByIngredients(this.plate.contents);
  }

  // Staged demo state for screenshots: ?shot=cover|chop|serve
  stageShot(kind) {
    this.reset();
    if (kind === 'cover') {
      this.player.x = 620; this.player.y = 560;
      this.carried = makeItem('telur');
      this.carried.stage = 2;
      this.plate.contents = ['nasi', 'ayam'];
      this.plate.onCounter = true;
      this.board.item = makeItem('sayur');
      this.board.progress = 0.55;
      this.stove[0].item = makeItem('ayam');
      this.stove[0].item.stage = 1;
      this.stove[0].progress = 0.6;
      this.stove[1].item = makeItem('mie');
      this.stove[1].progress = 0.8;
    } else if (kind === 'chop') {
      this.player.x = 850; this.player.y = 380;
      this.board.item = makeItem('ayam');
      this.board.progress = 0.66;
      this.plate.contents = ['nasi'];
      this.plate.onCounter = true;
    } else if (kind === 'serve') {
      this.player.x = 1120; this.player.y = 600;
      this.carried = { kind: 'plate', contents: ['nasi', 'telur', 'ayam'] };
    }
  }
}
