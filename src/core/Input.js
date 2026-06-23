// Keyboard + mouse input.
//
// Translates raw key events into mode-independent semantic tokens that the game
// interprets per mode (the same physical key can mean different things in
// explore vs combat). Tokens are queued and drained once per update so no input
// is lost between frames. Mouse position is tracked in internal-canvas pixels
// for the hover marker.

const KEY_TOKENS = {
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right',
  enter: 'confirm',
  ' ': 'space',
  spacebar: 'space',
  escape: 'cancel',
  c: 'toggle-sneak',
  e: 'interact',
  i: 'inventory',
  h: 'dressing',
  r: 'restart',
  1: 'melee',
  2: 'sidearm',
  3: 'choice3',
  4: 'choice4',
  5: 'choice5',
  tab: 'cycle',
  g: 'debug',
  j: 'journal'
};

const KEY_CODE_TOKENS = {
  KeyC: 'toggle-sneak',
  Space: 'space'
};

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.actions = [];
    this.keys = new Set();
    this.mouse = null;
    this.pendingClick = null;

    window.addEventListener('keydown', (event) => this.#onKeyDown(event));
    window.addEventListener('keyup', (event) => this.keys.delete(event.key.toLowerCase()));
    if (canvas) {
      canvas.style.cursor = 'none';
      canvas.addEventListener('mousemove', (event) => this.#onMouseMove(event));
      canvas.addEventListener('mouseleave', () => { this.mouse = null; });
      canvas.addEventListener('mousedown', (event) => this.#onMouseDown(event));
      canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    }
  }

  consume() {
    const actions = this.actions;
    this.actions = [];
    return actions;
  }

  consumeClick() {
    const click = this.pendingClick;
    this.pendingClick = null;
    return click;
  }

  isHeld(key) {
    return this.keys.has(String(key).toLowerCase());
  }

  #onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key === 'shift') {
      this.keys.add(key);
      return;
    }
    const token = KEY_TOKENS[key] ?? KEY_CODE_TOKENS[event.code];
    if (!token) return;
    event.preventDefault();
    if (token === 'toggle-sneak' && (event.repeat || this.keys.has(key))) return;
    this.keys.add(key);
    this.actions.push(token);
  }

  #onMouseMove(event) {
    this.mouse = this.#toInternal(event);
  }

  #onMouseDown(event) {
    event.preventDefault();
    const point = this.#toInternal(event);
    if (point) {
      this.pendingClick = {
        ...point,
        button: event.button,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey || event.metaKey
      };
    }
  }

  #toInternal(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: Math.round((event.clientX - rect.left) * (this.canvas.width / rect.width)),
      y: Math.round((event.clientY - rect.top) * (this.canvas.height / rect.height))
    };
  }
}
