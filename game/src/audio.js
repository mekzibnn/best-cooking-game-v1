// Dapur Senja — SoundEngine: every sound is synthesized with WebAudio.
// No audio files, no network. Created on first user gesture.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicOn = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopMusic();
    return this.muted;
  }

  blip(freq, dur, type, vol, when = 0) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  playClick() { this.blip(660, 0.07, 'triangle', 0.1); }
  playPickup() { this.blip(520, 0.08, 'sine', 0.12); this.blip(780, 0.09, 'sine', 0.1, 0.06); }
  playChop() {
    this.blip(180, 0.05, 'square', 0.14);
    this.blip(140, 0.05, 'square', 0.1, 0.05);
  }
  playSizzle() {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const dur = 0.5;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.25;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    src.connect(filter).connect(ctx.destination);
    src.start();
  }
  playServe() {
    this.blip(523, 0.12, 'triangle', 0.14);
    this.blip(659, 0.12, 'triangle', 0.14, 0.09);
    this.blip(784, 0.2, 'triangle', 0.16, 0.18);
  }
  playError() { this.blip(160, 0.18, 'sawtooth', 0.1); }
  playOrder() { this.blip(880, 0.1, 'sine', 0.1); this.blip(1174, 0.14, 'sine', 0.1, 0.1); }
  playTick() { this.blip(980, 0.05, 'square', 0.06); }
  playRush() {
    this.blip(440, 0.12, 'square', 0.12);
    this.blip(440, 0.12, 'square', 0.12, 0.16);
    this.blip(660, 0.2, 'square', 0.12, 0.32);
  }

  startMusic() {
    if (this.muted || this.musicOn) return;
    this.musicOn = true;
    const notes = [262, 330, 392, 330, 294, 330, 392, 494];
    this.musicTimer = setInterval(() => {
      if (this.muted) return;
      const n = notes[this.musicStep % notes.length];
      this.musicStep += 1;
      this.blip(n, 0.28, 'triangle', 0.045);
    }, 320);
  }

  stopMusic() {
    this.musicOn = false;
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
}
