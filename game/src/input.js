// Dapur Senja — input: keyboard + mouse, click-to-move and button clicks.
// One clear job: turn raw events into game intents, nothing else.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.click = null; // {x, y} in canvas coords, consumed by main.js
    this.onKey = null; // (code) => void, set by main.js
    this.onClick = null; // (x, y) => void
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      const code = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(code)) e.preventDefault();
      if (!e.repeat) {
        this.keys[code] = true;
        if (this.onKey) this.onKey(code);
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
      this.click = { x, y };
      if (this.onClick) this.onClick(x, y);
    });
    window.addEventListener('blur', () => { this.keys = {}; });
  }

  consumeClick() {
    const c = this.click;
    this.click = null;
    return c;
  }
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
