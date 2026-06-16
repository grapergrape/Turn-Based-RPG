export class GameLoop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.lastTime = 0;
    this.frameHandle = null;
  }

  start() {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.frameHandle = requestAnimationFrame((time) => this.#tick(time));
  }

  stop() {
    this.running = false;

    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  #tick(time) {
    if (!this.running) return;

    const deltaSeconds = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(deltaSeconds);
    this.render();

    this.frameHandle = requestAnimationFrame((nextTime) => this.#tick(nextTime));
  }
}
