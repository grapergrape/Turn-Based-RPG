// Entry point: build the sprite atlas, size the canvas for crisp integer
// upscaling, create the Game, load the level, and start the loop.

import { Game } from './core/Game.js';
import { resolveDevStart } from './core/DevStart.js';
import { buildSpriteAtlas } from './render/SpriteAtlas.js';
import { INTERNAL_WIDTH, INTERNAL_HEIGHT } from './render/renderConfig.js';
import { drawLoadingScreen } from './render/ui/LoadingRenderer.js';

const MIN_STARTUP_LOADING_MS = 450;

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

function nowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, Math.max(0, ms)));
}

function nextFrame() {
  if (typeof window.requestAnimationFrame !== 'function') return Promise.resolve();
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

function renderLoading(canvas, state) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  drawLoadingScreen(ctx, state);
}

async function start() {
  const startedAt = nowMs();
  const canvas = document.querySelector('#game');
  const statusElement = document.querySelector('#status');
  if (!canvas) {
    throw new Error('Missing #game canvas element.');
  }

  fitCanvas(canvas);
  window.addEventListener('resize', () => fitCanvas(canvas));
  if (statusElement) statusElement.textContent = '';

  renderLoading(canvas, { progress: 0.02, message: 'Preparing field load' });
  await nextFrame();
  renderLoading(canvas, { progress: 0.08, message: 'Baking sprites' });
  await nextFrame();
  const atlas = buildSpriteAtlas();
  renderLoading(canvas, { progress: 0.2, message: 'Opening game shell' });
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
  const remaining = MIN_STARTUP_LOADING_MS - (nowMs() - startedAt);
  if (remaining > 0) await delay(remaining);
  game.start();
}

start().catch((error) => {
  console.error(error);
  const statusElement = document.querySelector('#status');
  if (statusElement) {
    statusElement.textContent = `Startup failed: ${error.message}`;
  }
});
