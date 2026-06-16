import { TurnManager } from '../combat/TurnManager.js';
import { Entity } from '../entities/Entity.js';
import { CanvasRenderer } from '../render/CanvasRenderer.js';
import { Grid } from '../world/Grid.js';
import { Input } from './Input.js';
import { GameLoop } from './GameLoop.js';

export class Game {
  constructor({ canvas, mapData, playerData, enemyData, statusElement }) {
    this.canvas = canvas;
    this.statusElement = statusElement;
    this.grid = new Grid(mapData);
    this.input = new Input();
    this.renderer = new CanvasRenderer(canvas);
    this.turnManager = new TurnManager();

    this.player = new Entity({
      ...playerData,
      position: mapData.spawns.player
    });

    this.enemies = mapData.spawns.enemies.map((spawn) => {
      const data = enemyData.find((enemy) => enemy.id === spawn.id);
      if (!data) {
        throw new Error(`Missing enemy data for spawn id: ${spawn.id}`);
      }

      return new Entity({
        ...data,
        position: { x: spawn.x, y: spawn.y }
      });
    });

    this.loop = new GameLoop({
      update: (deltaSeconds) => this.update(deltaSeconds),
      render: () => this.render()
    });
  }

  start() {
    this.#setStatus('Demo loaded. Move with arrows or WASD.');
    this.loop.start();
  }

  update() {
    const direction = this.input.consumeDirection();
    if (!direction) return;

    if (!this.turnManager.isPlayerTurn()) return;

    const next = {
      x: this.player.position.x + direction.x,
      y: this.player.position.y + direction.y
    };

    if (!this.grid.isWalkable(next.x, next.y)) {
      this.#setStatus('Blocked. The ruins do not give way.');
      return;
    }

    if (this.#isEnemyAt(next.x, next.y)) {
      this.#setStatus('Enemy contact. Combat actions come in the next slice.');
      return;
    }

    this.player.moveBy(direction);
    this.#setStatus(`Player position: ${this.player.position.x}, ${this.player.position.y}`);
  }

  render() {
    this.renderer.draw({
      grid: this.grid,
      player: this.player,
      enemies: this.enemies,
      turnManager: this.turnManager
    });
  }

  #isEnemyAt(x, y) {
    return this.enemies.some((enemy) => enemy.position.x === x && enemy.position.y === y);
  }

  #setStatus(message) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
  }
}
