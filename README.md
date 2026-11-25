# Dapur Senja — Warung Cepat Saji

[![Competition](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/mekzibnn/best-cooking-game-v1/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/mekzibnn/best-cooking-game-v1/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

Game masak orisinal yang dimainkan offline di browser desktop, keyboard + mouse.
Kamu juru masak di warung senja: ambil bahan, cincang, masak, rakit di piring,
dan sajikan pesanan sebelum pelanggan kehabisan sabar.

## Cara main

1. **Gerak** — WASD / tombol panah, atau klik lantai / stasiun untuk jalan ke sana.
2. **Ambil bahan** — dekati peti bahan (Nasi, Mie, Ayam, Telur, Sayur, Sambal), tekan **E**.
3. **Olah** — Ayam & Sayur dicincang di **Talenan** (tekan E 3x). Nasi, Mie, Telur,
   dan Ayam cincang dimasak di **Kompor** (matang otomatis ~2 detik).
4. **Rakit** — ambil **Piring**, tambahkan bahan siap saji di **Piring Saji**
   sampai jadi hidangan lengkap.
5. **Sajikan** — bawa piring ke **Jendela Sajian**. Hidangan yang cocok dengan
   pesanan dibayar penuh + tip dari sisa kesabaran pelanggan.

## Resep

| Hidangan | Bahan | Harga |
| --- | --- | --- |
| Nasi Goreng | Nasi + Telur + Ayam | Rp100 |
| Mie Ayam | Mie + Ayam + Sayur | Rp90 |
| Soto Senja | Nasi + Ayam + Sayur + Sambal | Rp110 |
| Telur Dadar | Telur + Sayur | Rp70 |

Tekan **H** kapan saja untuk membuka Buku Resep di dalam game.

## Aturan main

- Satu hari = **120 detik**. Pesanan baru datang makin cepat dan kesabaran
  pelanggan makin pendek seiring level naik.
- Pesanan yang hangus memotong skor dan memutus kombo. Sajian beruntun
  menaikkan kombo dan bonus koin.
- Di 60 detik terakhir muncul **RUSH** — pesanan datang lebih deras.
- **P** jeda, **M** suara, **R** main lagi setelah hari selesai.

## Teknologi

- Canvas 2D murni, tanpa library dan tanpa request jaringan — semua gambar
  digambar di canvas, semua suara disintesis WebAudio.
- File game di `game/` (`index.html` + modul ES di `game/src/`):
  `config.js` (resep & stasiun), `audio.js` (suara), `orders.js` (pesanan),
  `kitchen.js` (koki & stasiun), `render.js` (gambar), `input.js` (keyboard
  & mouse), `main.js` (loop & state).
- `main.ts` menyalin `game/` dan `screenshots/` ke output dan menulis
  `dossier.json` lewat `vendor/makefun-game.ts`.

## Jalankan lokal

```sh
node serve.ts
# buka http://localhost:8080
```

## Tangkapan layar

`?shot=cover|start|chop|serve` menampilkan adegan panggung dari kode game
yang sama (timer dibekukan) untuk pengambilan screenshot.
