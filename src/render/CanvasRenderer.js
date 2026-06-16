export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;
  }

  draw({ grid, player, enemies, turnManager }) {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.#drawMap(grid);
    this.#drawEntity(player, '#d8d2c4');

    for (const enemy of enemies) {
      this.#drawEntity(enemy, '#9a2f2f');
    }

    this.#drawOverlay(grid, turnManager);
  }

  #drawMap(grid) {
    const ctx = this.context;

    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const tile = grid.getTileDef(x, y);
        const px = x * grid.tileSize;
        const py = y * grid.tileSize;

        ctx.fillStyle = tile?.walkable ? '#1d1b1a' : '#3b3833';
        ctx.fillRect(px, py, grid.tileSize, grid.tileSize);

        ctx.strokeStyle = '#2a2622';
        ctx.strokeRect(px, py, grid.tileSize, grid.tileSize);
      }
    }
  }

  #drawEntity(entity, color) {
    const ctx = this.context;
    const size = 32;
    const inset = 7;
    const px = entity.position.x * size;
    const py = entity.position.y * size;

    ctx.fillStyle = color;
    ctx.fillRect(px + inset, py + inset, size - inset * 2, size - inset * 2);

    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(px + 13, py + 13, 3, 3);
    ctx.fillRect(px + 18, py + 13, 3, 3);
  }

  #drawOverlay(grid, turnManager) {
    const ctx = this.context;
    const y = grid.height * grid.tileSize + 4;

    ctx.fillStyle = '#e8e1d4';
    ctx.font = '10px monospace';
    ctx.fillText(`Turn ${turnManager.turnNumber} | Active: ${turnManager.activeSide}`, 4, Math.min(y, this.canvas.height - 8));
  }
}
