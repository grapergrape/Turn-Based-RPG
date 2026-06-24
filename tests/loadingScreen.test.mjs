import assert from 'node:assert/strict';

import {
  clampLoadingProgress,
  loadingPercent,
  mapLoadingProgress,
  normalizeLoadingState
} from '../src/core/LoadingProgress.js';
import { drawLoadingScreen } from '../src/render/ui/LoadingRenderer.js';

function mockCtx() {
  return {
    canvas: { width: 640, height: 480 },
    imageSmoothingEnabled: true,
    fillCount: 0,
    fillRect() { this.fillCount += 1; },
    set fillStyle(value) { this._fillStyle = value; },
    get fillStyle() { return this._fillStyle; }
  };
}

assert.equal(clampLoadingProgress(-1), 0);
assert.equal(clampLoadingProgress(2), 1);
assert.equal(mapLoadingProgress(0.5, 0.2, 0.8), 0.5);
assert.equal(loadingPercent(0.337), '34%');
assert.deepEqual(normalizeLoadingState({
  progress: 1.5,
  message: '  Loading gear records  ',
  detail: '  3 of 7  '
}), {
  progress: 1,
  message: 'Loading gear records',
  detail: '3 of 7'
});

const ctx = mockCtx();
drawLoadingScreen(ctx, {
  progress: 0.64,
  message: 'Loading dialogue',
  detail: '12 of 18'
});

assert.equal(ctx.imageSmoothingEnabled, false);
assert.ok(ctx.fillCount > 0);
