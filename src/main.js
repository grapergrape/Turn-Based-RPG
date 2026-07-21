// Entry point: build the sprite atlas, size the canvas for crisp integer
// upscaling, create the Game, load the level, and start the loop.

import { Game } from './core/Game.js';
import { devConsoleEnabled, installDevConsole } from './core/DevConsole.js';
import { resolveDevStart } from './core/DevStart.js';
import { loadPlaytestSeed } from './core/PlaytestProfile.js';
import { buildSpriteAtlas } from './render/SpriteAtlas.js';
import { PALETTE } from './render/palette.js';
import { INTERNAL_WIDTH, INTERNAL_HEIGHT, NATIVE_SCALE } from './render/renderConfig.js';
import { getSoftwareCanvasContext2D } from './render/canvasContext.js';
import { drawLoadingScreen } from './render/ui/LoadingRenderer.js';
import { loadGameVersion } from './core/GameVersion.js';
import { IndexedDbSaveRepository } from './core/save/SaveRepository.js';
import { SaveCoordinator } from './core/save/SaveCoordinator.js';

const MIN_STARTUP_LOADING_MS = 450;

// Keep the backing store at the fixed native resolution and scale via CSS using
// whole-number factors so every pixel stays square. Reassigning width or height
// clears a canvas even when the value is unchanged, so only resize the backing
// store when its dimensions genuinely differ.
function fitCanvas(canvas) {
  if (canvas.width !== INTERNAL_WIDTH) canvas.width = INTERNAL_WIDTH;
  if (canvas.height !== INTERNAL_HEIGHT) canvas.height = INTERNAL_HEIGHT;
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
  const ctx = getSoftwareCanvasContext2D(canvas);
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PALETTE.void;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.setTransform(NATIVE_SCALE, 0, 0, NATIVE_SCALE, 0, 0);
  drawLoadingScreen(ctx, state);
  ctx.restore();
}

async function start() {
  const startedAt = nowMs();
  const canvas = document.querySelector('#game');
  const statusElement = document.querySelector('#status');
  if (!canvas) {
    throw new Error('Missing #game canvas element.');
  }

  fitCanvas(canvas);
  let game = null;
  let resizeRecoveryTimer = null;
  window.addEventListener('resize', () => {
    fitCanvas(canvas);
    if (resizeRecoveryTimer !== null) window.clearTimeout(resizeRecoveryTimer);
    resizeRecoveryTimer = window.setTimeout(() => {
      game?.renderer?.recoverVisualCaches();
      resizeRecoveryTimer = null;
    }, 100);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) game?.renderer?.recoverVisualCaches();
    else void game?._requestAutosave?.('visibility change');
  });
  window.addEventListener('pageshow', () => game?.renderer?.recoverVisualCaches());
  if (statusElement) statusElement.textContent = '';

  renderLoading(canvas, { progress: 0.02, message: 'Preparing field load' });
  await nextFrame();
  renderLoading(canvas, { progress: 0.08, message: 'Baking sprites' });
  await nextFrame();
  const atlas = buildSpriteAtlas();
  renderLoading(canvas, { progress: 0.2, message: 'Opening game shell' });
  const devStart = resolveDevStart(window.location);
  const playtestSeed = devStart.playtestProfile
    ? await loadPlaytestSeed(devStart.playtestProfile, { levelPath: devStart.levelPath })
    : null;
  const gameVersion = await loadGameVersion();
  const saveCoordinator = new SaveCoordinator({
    repository: new IndexedDbSaveRepository(),
    gameVersion
  });
  game = new Game({
    canvas,
    levelPath: devStart.levelPath,
    atlas,
    statusElement,
    bootOptions: {
      ...devStart.bootOptions,
      ...(playtestSeed ? { playtestSeed } : {})
    },
    debugGrid: devStart.debugGrid,
    saveCoordinator: devStart.enabled ? null : saveCoordinator,
    gameVersion
  });
  if (devStart.enabled) await game.boot();
  else await game.openTitle();
  installDevConsole(game, { enabled: devConsoleEnabled(window.location), target: window });
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
