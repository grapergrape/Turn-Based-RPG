// Entry point: build the sprite atlas, size the canvas for crisp integer
// upscaling, create the Game, load the level, and start the loop.

import { Game } from './core/Game.js';
import { resolveDevStart } from './core/DevStart.js';
import { buildSpriteAtlas } from './render/SpriteAtlas.js';
import { INTERNAL_WIDTH, INTERNAL_HEIGHT } from './render/renderConfig.js';

// Keep the backing store at the fixed internal resolution and scale up via CSS
// using whole-number factors so every pixel stays square.
function fitCanvas(canvas) {
  canvas.width = INTERNAL_WIDTH;
  canvas.height = INTERNAL_HEIGHT;
  const scale = Math.max(
    1,
    Math.floor(Math.min(window.innerWidth / INTERNAL_WIDTH, (window.innerHeight - 24) / INTERNAL_HEIGHT))
  );
  canvas.style.width = `${INTERNAL_WIDTH * scale}px`;
  canvas.style.height = `${INTERNAL_HEIGHT * scale}px`;
}

async function start() {
  const canvas = document.querySelector('#game');
  const statusElement = document.querySelector('#status');
  if (!canvas) {
    throw new Error('Missing #game canvas element.');
  }

  fitCanvas(canvas);
  window.addEventListener('resize', () => fitCanvas(canvas));

  const atlas = buildSpriteAtlas();
  const devStart = resolveDevStart(window.location);
  const game = new Game({
    canvas,
    levelPath: devStart.levelPath,
    atlas,
    statusElement,
    bootOptions: devStart.bootOptions,
    debugGrid: devStart.debugGrid
  });
  await game.boot();
  game.start();
}

start().catch((error) => {
  console.error(error);
  const statusElement = document.querySelector('#status');
  if (statusElement) {
    statusElement.textContent = `Startup failed: ${error.message}`;
  }
});
