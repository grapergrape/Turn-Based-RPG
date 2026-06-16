export class Input {
  constructor() {
    this.pendingDirection = null;
    this.keys = new Set();
    this.enabled = true;

    window.addEventListener('keydown', (event) => this.#onKeyDown(event));
    window.addEventListener('keyup', (event) => this.#onKeyUp(event));
  }

  consumeDirection() {
    const direction = this.pendingDirection;
    this.pendingDirection = null;
    return direction;
  }

  #onKeyDown(event) {
    if (!this.enabled) return;

    this.keys.add(event.key.toLowerCase());

    const direction = keyToDirection(event.key);
    if (direction) {
      event.preventDefault();
      this.pendingDirection = direction;
    }
  }

  #onKeyUp(event) {
    this.keys.delete(event.key.toLowerCase());
  }
}

function keyToDirection(key) {
  switch (key.toLowerCase()) {
    case 'arrowup':
    case 'w':
      return { x: 0, y: -1 };
    case 'arrowdown':
    case 's':
      return { x: 0, y: 1 };
    case 'arrowleft':
    case 'a':
      return { x: -1, y: 0 };
    case 'arrowright':
    case 'd':
      return { x: 1, y: 0 };
    default:
      return null;
  }
}
