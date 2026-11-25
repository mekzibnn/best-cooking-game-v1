// Dapur Senja — render: every pixel the player sees, drawn on one canvas.
// One clear job: drawKitchen, drawChef, drawOrderBoard, drawTimer, drawFood.

import { COLORS, CANVAS_W, CANVAS_H, INGREDIENTS, RECIPES, STATIONS } from './config.js';
import { itemLabel } from './kitchen.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawFoodIcon(ctx, id, x, y, size) {
  const ing = INGREDIENTS[id];
  if (!ing) return;
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (ing.icon === 'bowl') {
    ctx.fillStyle = '#FFF8E7';
    ctx.beginPath(); ctx.arc(0, 2, s * 0.42, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#3E7CB1';
    ctx.fillRect(-s * 0.42, 0, s * 0.84, s * 0.16);
    ctx.fillStyle = '#F2C14E';
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * s * 0.14, -s * 0.08, s * 0.07, 0, Math.PI * 2); ctx.fill(); }
  } else if (ing.icon === 'noodle') {
    ctx.strokeStyle = '#F2C14E'; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { ctx.moveTo(-s * 0.3, -s * 0.2 + i * s * 0.2); ctx.quadraticCurveTo(0, -s * 0.32 + i * s * 0.2, s * 0.3, -s * 0.2 + i * s * 0.2); }
    ctx.stroke();
  } else if (ing.icon === 'drumstick') {
    ctx.fillStyle = '#E8A87C';
    ctx.beginPath(); ctx.ellipse(0, -s * 0.05, s * 0.32, s * 0.26, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#FFFDF6'; ctx.lineWidth = s * 0.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s * 0.2, s * 0.15); ctx.lineTo(s * 0.42, s * 0.38); ctx.stroke();
  } else if (ing.icon === 'egg') {
    ctx.fillStyle = '#F7E8A0';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F2B705';
    ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.14, 0, Math.PI * 2); ctx.fill();
  } else if (ing.icon === 'leaf') {
    ctx.fillStyle = '#6FBF44';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.34, s * 0.22, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2F7A2A'; ctx.lineWidth = s * 0.05;
    ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.15); ctx.lineTo(s * 0.3, -s * 0.15); ctx.stroke();
  } else if (ing.icon === 'chili') {
    ctx.fillStyle = '#D64541';
    ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.36, s * 0.16, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4C9A3F'; ctx.lineWidth = s * 0.07;
    ctx.beginPath(); ctx.moveTo(s * 0.3, -s * 0.1); ctx.quadraticCurveTo(s * 0.45, -s * 0.3, s * 0.3, -s * 0.35); ctx.stroke();
  }
  ctx.restore();
}

export function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color || COLORS.green;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
  ctx.restore();
}

export function drawProgressBar(ctx, x, y, w, h, frac, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = color || COLORS.green;
    roundRect(ctx, x, y, Math.max(h, w * frac), h, h / 2); ctx.fill();
  }
  ctx.restore();
}

function drawStationBase(ctx, st, fill, label, sub) {
  ctx.save();
  ctx.fillStyle = COLORS.woodDark;
  roundRect(ctx, st.x - 3, st.y - 3, st.w + 6, st.h + 6, 10); ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, st.x, st.y, st.w, st.h, 8); ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, st.x, st.y, st.w, 14, 7); ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, st.x + st.w / 2, st.y + st.h - 8);
  ctx.restore();
}

export function drawKitchen(ctx, kitchen, orders, timeLeft, score, served, combo, level, showBook) {
  // Wall + floor
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS_W, 210);
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 210, CANVAS_W, CANVAS_H - 210);
  ctx.fillStyle = COLORS.floorDark;
  for (let y = 240; y < CANVAS_H; y += 64) ctx.fillRect(0, y, CANVAS_W, 3);
  for (let x = 0; x < CANVAS_W; x += 96) ctx.fillRect(x, 210, 3, CANVAS_H - 210);
  // Wall tiles + hanging lamps
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let x = 20; x < CANVAS_W; x += 120) ctx.fillRect(x, 196, 80, 6);
  for (const lx of [200, 640, 1080]) {
    ctx.strokeStyle = COLORS.woodDark; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 26); ctx.stroke();
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath(); ctx.arc(lx, 40, 16, 0, Math.PI * 2); ctx.fill();
  }

  drawOrderBoard(ctx, orders);
  drawTimer(ctx, timeLeft, score, served, combo, level);

  // Ingredient crates
  for (const crate of STATIONS.crates) {
    drawStationBase(ctx, crate, COLORS.counter, crate.label, INGREDIENTS[crate.ingredient].prepLabel);
    drawFoodIcon(ctx, crate.ingredient, crate.x + crate.w / 2, crate.y + 46, 44);
  }
  // Chopping board
  drawStationBase(ctx, STATIONS.board, '#C9A06A', 'TALENAN', 'Tekan E 3x');
  ctx.fillStyle = '#F5E3C0';
  roundRect(ctx, STATIONS.board.x + 18, STATIONS.board.y + 16, 164, 40, 6); ctx.fill();
  if (kitchen.board.item) {
    drawFoodIcon(ctx, kitchen.board.item.id, STATIONS.board.x + 100, STATIONS.board.y + 36, 36);
    drawProgressBar(ctx, STATIONS.board.x + 30, STATIONS.board.y + 60, 140, 8, kitchen.board.progress, COLORS.terracotta);
  }
  // Stove
  drawStationBase(ctx, STATIONS.stove, '#5A5A5A', 'KOMPOR', 'Masak otomatis');
  kitchen.stove.forEach((slot, i) => {
    const cx = STATIONS.stove.x + 62 + i * 124;
    const cy = STATIONS.stove.y + 44;
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = slot.item ? '#E25822' : '#444';
    ctx.beginPath(); ctx.arc(cx, cy, 23, 0, Math.PI * 2); ctx.fill();
    if (slot.item) {
      drawFoodIcon(ctx, slot.item.id, cx, cy - 4, 30);
      drawProgressRing(ctx, cx, cy, 33, slot.progress, COLORS.gold);
    }
  });
  // Plating counter
  drawStationBase(ctx, STATIONS.plating, COLORS.counter, 'PIRING SAJI', 'Rakit hidangan di sini');
  drawPlate(ctx, kitchen.plate.contents, STATIONS.plating.x + 110, STATIONS.plating.y + 50, 1);
  const dish = kitchen.plateDish();
  if (dish) {
    ctx.fillStyle = COLORS.green;
    roundRect(ctx, STATIONS.plating.x + 45, STATIONS.plating.y + 2, 130, 18, 9); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`SIAP: ${dish.name.toUpperCase()}`, STATIONS.plating.x + 110, STATIONS.plating.y + 15);
  }
  // Serving window
  drawStationBase(ctx, STATIONS.serving, COLORS.teal, 'JENDELA SAJIAN', 'Antar piring ke sini');
  ctx.fillStyle = COLORS.white;
  roundRect(ctx, STATIONS.serving.x + 16, STATIONS.serving.y + 20, 196, 44, 8); ctx.fill();
  ctx.fillStyle = COLORS.tealDark; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('PELANGGAN MENUNGGU', STATIONS.serving.x + 114, STATIONS.serving.y + 40);
  ctx.font = '12px sans-serif'; ctx.fillStyle = COLORS.muted;
  ctx.fillText('Sajikan hidangan yang benar', STATIONS.serving.x + 114, STATIONS.serving.y + 58);
  // Ready plate parked at the window (shot mode / served feedback)
  if (kitchen.serveReady) {
    drawPlate(ctx, kitchen.serveReady, STATIONS.serving.x + 114, STATIONS.serving.y + 66, 0.7);
  }
  // Trash / plates / book
  drawStationBase(ctx, STATIONS.trash, '#777', 'BUANG', '');
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('×', STATIONS.trash.x + 55, STATIONS.trash.y + 52);
  drawStationBase(ctx, STATIONS.plates, COLORS.counter, 'PIRING', 'Ambil piring');
  ctx.fillStyle = '#FFFDF6';
  ctx.beginPath(); ctx.ellipse(STATIONS.plates.x + 55, STATIONS.plates.y + 46, 34, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(STATIONS.plates.x + 55, STATIONS.plates.y + 46, 24, 8, 0, 0, Math.PI * 2); ctx.stroke();
  drawStationBase(ctx, STATIONS.book, '#F2E3B3', 'BUKU RESEP', 'Tekan H');
  ctx.fillStyle = COLORS.terracotta; ctx.font = 'bold 24px sans-serif';
  ctx.fillText('?', STATIONS.book.x + 75, STATIONS.book.y + 56);

  drawChef(ctx, kitchen.player, kitchen.carried);

  // Carried-item label + message
  if (kitchen.carried) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(ctx, kitchen.player.x - 70, kitchen.player.y - 78, 140, 24, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(itemLabel(kitchen.carried), kitchen.player.x, kitchen.player.y - 61);
  }
  if (kitchen.message && kitchen.messageTimer > 0) {
    ctx.fillStyle = 'rgba(59,36,22,0.88)';
    roundRect(ctx, 380, 668, 520, 34, 17); ctx.fill();
    ctx.fillStyle = '#FFF3D6'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(kitchen.message, 640, 690);
  }
  if (kitchen.flash) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, kitchen.flash.t);
    ctx.fillStyle = kitchen.flash.color || COLORS.gold;
    ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(kitchen.flash.text, kitchen.flash.x, kitchen.flash.y);
    ctx.restore();
  }
  if (showBook) drawRecipeBook(ctx);
}

export function drawPlate(ctx, contents, x, y, scale) {
  const s = scale || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#FFFDF6';
  ctx.beginPath(); ctx.ellipse(0, 0, 52, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 52, 20, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 36, 13, 0, 0, Math.PI * 2); ctx.stroke();
  contents.forEach((id, i) => {
    drawFoodIcon(ctx, id, -30 + i * 30, -6, 26);
  });
  ctx.restore();
}

export function drawChef(ctx, player, carried) {
  const { x, y } = player;
  const bob = player.moving ? Math.sin(Date.now() / 90) * 3 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(0, 22, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  // body / apron
  ctx.fillStyle = '#FFFDF6';
  roundRect(ctx, -18, -6, 36, 28, 10); ctx.fill();
  ctx.fillStyle = COLORS.teal;
  roundRect(ctx, -18, 8, 36, 14, 6); ctx.fill();
  // arms
  ctx.fillStyle = '#F2C89B';
  ctx.beginPath(); ctx.arc(-20, 4, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, 4, 7, 0, Math.PI * 2); ctx.fill();
  // head
  ctx.fillStyle = '#F2C89B';
  ctx.beginPath(); ctx.arc(0, -18, 14, 0, Math.PI * 2); ctx.fill();
  // chef hat
  ctx.fillStyle = '#FFFDF6';
  ctx.beginPath(); ctx.arc(-8, -30, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -34, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -30, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-13, -32, 26, 8);
  // eyes
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-5 + player.dir * 2, -18, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 + player.dir * 2, -18, 2, 0, Math.PI * 2); ctx.fill();
  // carried item above head
  if (carried) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(0, -52, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -52, 18, 0, Math.PI * 2); ctx.stroke();
    if (carried.kind === 'plate') {
      drawPlate(ctx, carried.contents, 0, -52, 0.32);
    } else {
      drawFoodIcon(ctx, carried.id, 0, -52, 24);
    }
  }
  ctx.restore();
}

export function drawOrderBoard(ctx, orders) {
  ctx.save();
  ctx.fillStyle = 'rgba(31,122,109,0.95)';
  roundRect(ctx, 16, 8, 700, 92, 12); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('PAPAN PESANAN', 32, 28);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#CFE8E2';
  ctx.fillText('Sajikan sebelum kesabaran habis!', 150, 28);
  if (orders.length === 0) {
    ctx.fillStyle = '#CFE8E2'; ctx.font = 'italic 13px sans-serif';
    ctx.fillText('Belum ada pesanan — pelanggan segera datang…', 32, 62);
  }
  orders.forEach((o, i) => {
    const x = 32 + i * 224;
    const y = 36;
    ctx.fillStyle = COLORS.white;
    roundRect(ctx, x, y, 208, 56, 8); ctx.fill();
    ctx.fillStyle = o.color;
    roundRect(ctx, x, y, 8, 56, 4); ctx.fill();
    ctx.fillStyle = COLORS.ink; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(o.name, x + 16, y + 18);
    ctx.font = '11px sans-serif'; ctx.fillStyle = COLORS.muted;
    ctx.fillText(`Rp${o.price}  •  tip Rp${Math.round(50 * Math.max(0, o.patience / o.maxPatience))}`, x + 16, y + 34);
    drawProgressBar(ctx, x + 16, y + 42, 176, 8, Math.max(0, o.patience / o.maxPatience), o.patience / o.maxPatience > 0.35 ? COLORS.green : COLORS.red);
    o.ingredients.forEach((id, j) => drawFoodIcon(ctx, id, x + 178 - j * 22, y + 16, 18));
  });
  ctx.restore();
}

export function drawTimer(ctx, timeLeft, score, served, combo, level) {
  const mins = Math.floor(Math.max(0, timeLeft) / 60);
  const secs = Math.floor(Math.max(0, timeLeft) % 60);
  const urgent = timeLeft <= 20;
  ctx.save();
  ctx.fillStyle = 'rgba(59,36,22,0.92)';
  roundRect(ctx, 736, 8, 528, 92, 12); ctx.fill();
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('DAPUR SENJA', 756, 30);
  ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif';
  ctx.fillText(`Level ${level}  •  Warung Cepat Saji`, 756, 50);
  ctx.fillStyle = urgent ? COLORS.red : '#fff';
  ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, 1244, 48);
  ctx.fillStyle = '#FFEFC2'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`Skor ${score}`, 756, 76);
  ctx.fillText(`Disajikan ${served}`, 880, 76);
  ctx.fillStyle = combo >= 2 ? COLORS.gold : '#CFE8E2';
  ctx.fillText(combo >= 2 ? `Kombo x${combo}` : 'Kombo —', 1020, 76);
  ctx.fillStyle = '#CFE8E2'; ctx.font = '11px sans-serif';
  ctx.fillText('P: jeda   M: suara   H: resep', 756, 92 - 0);
  ctx.restore();
}

export function drawRushBanner(ctx) {
  ctx.save();
  ctx.fillStyle = COLORS.terracotta;
  roundRect(ctx, 490, 108, 300, 36, 18); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('RUSH! Pesanan makin cepat!', 640, 131);
  ctx.restore();
}

export function drawRecipeBook(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = COLORS.paper;
  roundRect(ctx, 340, 110, 600, 440, 16); ctx.fill();
  ctx.strokeStyle = COLORS.woodDark; ctx.lineWidth = 4;
  roundRect(ctx, 340, 110, 600, 440, 16); ctx.stroke();
  ctx.fillStyle = COLORS.ink; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('BUKU RESEP', 640, 160);
  ctx.font = '14px sans-serif'; ctx.fillStyle = COLORS.muted;
  ctx.fillText('Tekan H atau klik untuk menutup', 640, 186);
  RECIPES.forEach((r, i) => {
    const y = 220 + i * 78;
    ctx.fillStyle = '#fff';
    roundRect(ctx, 380, y, 520, 62, 10); ctx.fill();
    ctx.fillStyle = r.color;
    roundRect(ctx, 380, y, 10, 62, 5); ctx.fill();
    ctx.fillStyle = COLORS.ink; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${r.name}  —  Rp${r.price}`, 404, y + 26);
    ctx.font = '13px sans-serif'; ctx.fillStyle = COLORS.muted;
    ctx.fillText(r.blurb, 404, y + 48);
    r.ingredients.forEach((id, j) => drawFoodIcon(ctx, id, 850 + j * 34, y + 30, 26));
  });
  ctx.restore();
}

export function drawTitle(ctx, best) {
  ctx.save();
  ctx.fillStyle = 'rgba(59,36,22,0.45)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = COLORS.paper;
  roundRect(ctx, 290, 120, 700, 460, 20); ctx.fill();
  ctx.strokeStyle = COLORS.terracotta; ctx.lineWidth = 5;
  roundRect(ctx, 290, 120, 700, 460, 20); ctx.stroke();
  ctx.fillStyle = COLORS.terracotta; ctx.font = 'bold 52px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('DAPUR SENJA', 640, 200);
  ctx.fillStyle = COLORS.teal; ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Warung Cepat Saji', 640, 236);
  ctx.fillStyle = COLORS.ink; ctx.font = '16px sans-serif';
  ctx.fillText('Masak, rakit, dan sajikan pesanan sebelum pelanggan kehabisan sabar!', 640, 276);
  ctx.fillText('Ambil bahan → cincang / masak → rakit di piring → antar ke jendela.', 640, 302);
  ctx.fillStyle = COLORS.muted; ctx.font = '14px sans-serif';
  ctx.fillText('Gerak: WASD / panah  •  Interaksi: E / Spasi / klik  •  P: jeda  •  H: resep  •  M: suara', 640, 336);
  ctx.fillText('4 resep: Nasi Goreng, Mie Ayam, Soto Senja, Telur Dadar', 640, 360);
  ctx.fillStyle = COLORS.teal;
  roundRect(ctx, 520, 390, 240, 56, 28); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif';
  ctx.fillText('MULAI MASAK  ▶', 640, 426);
  ctx.fillStyle = COLORS.muted; ctx.font = '13px sans-serif';
  ctx.fillText('atau tekan Enter', 640, 474);
  if (best > 0) {
    ctx.fillStyle = COLORS.ink; ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Skor terbaik: ${best}`, 640, 512);
  }
  ctx.fillStyle = COLORS.muted; ctx.font = '12px sans-serif';
  ctx.fillText('Game masak orisinal — dimainkan offline di browser, keyboard + mouse.', 640, 548);
  ctx.restore();
}

export function drawGameOver(ctx, stats) {
  ctx.save();
  ctx.fillStyle = 'rgba(59,36,22,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = COLORS.paper;
  roundRect(ctx, 330, 130, 620, 440, 20); ctx.fill();
  ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 5;
  roundRect(ctx, 330, 130, 620, 440, 20); ctx.stroke();
  ctx.fillStyle = COLORS.terracotta; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('HARI SELESAI!', 640, 200);
  ctx.fillStyle = COLORS.ink; ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`Skor akhir: ${stats.score}`, 640, 252);
  ctx.font = '17px sans-serif';
  ctx.fillText(`Hidangan disajikan: ${stats.served}`, 640, 290);
  ctx.fillText(`Pesanan hangus: ${stats.expired}`, 640, 318);
  ctx.fillText(`Kombo terbaik: x${stats.bestCombo}`, 640, 346);
  ctx.fillText(`Akurasi sajian: ${stats.accuracy}%`, 640, 374);
  ctx.fillStyle = COLORS.teal;
  roundRect(ctx, 500, 410, 280, 52, 26); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif';
  ctx.fillText('MAIN LAGI  (R)', 640, 443);
  ctx.fillStyle = COLORS.muted; ctx.font = '13px sans-serif';
  ctx.fillText('T — kembali ke judul', 640, 500);
  ctx.restore();
}

export function drawPaused(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('JEDA', 640, 340);
  ctx.font = '16px sans-serif';
  ctx.fillText('Tekan P / Esc untuk lanjut', 640, 376);
  ctx.restore();
}
