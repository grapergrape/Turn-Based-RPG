// Bounded native-resolution cache for floor cells and flat ground decals.
//
// Large maps are several thousand logical pixels wide. Baking one full scene at
// the native 2x scale would retain hundreds of MiB, so this cache follows the
// camera with a buffered window. All coordinates exposed to the renderer stay
// on the 640x480 logical design grid; only this canvas backing store is 2x.

import { PALETTE } from './palette.js';
import { getSoftwareCanvasContext2D } from './canvasContext.js';
import {
  NATIVE_SCALE,
  TILE_HEIGHT,
  TILE_WIDTH,
  toNativePixels
} from './renderConfig.js';
import { computeSceneBounds, gridToScreen } from './isoMath.js';
import * as P from './PixelPrimitives.js';
import { getSprite, FLAT_KINDS } from './spriteCatalog.js';

const CACHE_MARGIN_X = 192;
const CACHE_MARGIN_Y = 160;
const FLOOR_CULL_PAD = 8;
const DECAL_CULL_PAD = 128;

function isCatalogBlock(kind) {
  return Boolean(getSprite(kind)?.block);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class StaticSceneCache {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = getSoftwareCanvasContext2D(this.canvas);
    this.bounds = null;
    this.grid = null;
    this.props = [];
    this.flatProps = [];
    this.hiddenTiles = new Set();
    this.mood = null;
    this.window = null;
    this.buildCount = 0;
    this.contextLost = false;
    this.recoveryPending = false;

    this.canvas.addEventListener?.('contextlost', (event) => {
      event.preventDefault?.();
      this.contextLost = true;
      this.window = null;
      this.recoveryPending = true;
    });
    this.canvas.addEventListener?.('contextrestored', () => {
      this.ctx = getSoftwareCanvasContext2D(this.canvas);
      this.contextLost = false;
      this.window = null;
      this.recoveryPending = true;
    });
  }

  setLevel(level) {
    this.grid = level.grid;
    this.props = level.props ?? [];
    this.flatProps = this.props.filter((prop) => FLAT_KINDS.has(prop.kind));
    this.hiddenTiles = level.hiddenTiles instanceof Set
      ? new Set(level.hiddenTiles)
      : new Set(level.hiddenTiles ?? []);
    this.mood = level.mood ?? null;
    this.bounds = computeSceneBounds(this.grid.width, this.grid.height);
    this.window = null;
    this.recoveryPending = false;
    return this.bounds;
  }

  invalidate() {
    this.window = null;
  }

  consumeRecovery() {
    const pending = this.recoveryPending;
    this.recoveryPending = false;
    return pending;
  }

  ensure(camera, viewport) {
    if (!this.grid || !this.bounds) return false;
    if (this.#contextUnavailable()) return false;
    const visible = this.#visibleSceneRect(camera, viewport);
    if (this.window && this.#contains(this.window, visible)) return false;
    return this.#rebuildWindow(camera, viewport);
  }

  draw(ctx, camera, viewport) {
    if (!this.grid || !this.bounds) return;
    this.ensure(camera, viewport);
    if (!this.window) return;

    const visible = this.#visibleSceneRect(camera, viewport);
    if (visible.width <= 0 || visible.height <= 0) return;

    const sourceX = toNativePixels(visible.x - this.window.x);
    const sourceY = toNativePixels(visible.y - this.window.y);
    const sourceWidth = toNativePixels(visible.width);
    const sourceHeight = toNativePixels(visible.height);
    const destinationX = visible.x - camera.x;
    const destinationY = visible.y - camera.y;

    ctx.drawImage(
      this.canvas,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      destinationX,
      destinationY,
      visible.width,
      visible.height
    );
  }

  #visibleSceneRect(camera, viewport) {
    const left = clamp(camera.x, 0, this.bounds.width);
    const top = clamp(camera.y, 0, this.bounds.height);
    const right = clamp(camera.x + viewport.width, 0, this.bounds.width);
    const bottom = clamp(camera.y + viewport.height, 0, this.bounds.height);
    return {
      x: Math.min(left, right),
      y: Math.min(top, bottom),
      width: Math.abs(right - left),
      height: Math.abs(bottom - top)
    };
  }

  #contains(windowRect, visibleRect) {
    return (
      visibleRect.x >= windowRect.x &&
      visibleRect.y >= windowRect.y &&
      visibleRect.x + visibleRect.width <= windowRect.x + windowRect.width &&
      visibleRect.y + visibleRect.height <= windowRect.y + windowRect.height
    );
  }

  #contextUnavailable() {
    if (this.contextLost) return true;
    if (this.ctx?.isContextLost?.()) {
      this.contextLost = true;
      this.window = null;
      this.recoveryPending = true;
      return true;
    }
    return false;
  }

  #rebuildWindow(camera, viewport) {
    if (this.#contextUnavailable()) return false;
    const targetWidth = Math.min(this.bounds.width, viewport.width + CACHE_MARGIN_X * 2);
    const targetHeight = Math.min(this.bounds.height, viewport.height + CACHE_MARGIN_Y * 2);
    const maxX = Math.max(0, this.bounds.width - targetWidth);
    const maxY = Math.max(0, this.bounds.height - targetHeight);
    const x = Math.round(clamp(camera.x - CACHE_MARGIN_X, 0, maxX));
    const y = Math.round(clamp(camera.y - CACHE_MARGIN_Y, 0, maxY));
    this.window = { x, y, width: targetWidth, height: targetHeight };

    this.canvas.width = Math.max(1, toNativePixels(targetWidth));
    this.canvas.height = Math.max(1, toNativePixels(targetHeight));
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(
      NATIVE_SCALE,
      0,
      0,
      NATIVE_SCALE,
      -x * NATIVE_SCALE,
      -y * NATIVE_SCALE
    );

    this.#drawFloorCells(ctx);
    this.#drawFlatProps(ctx);
    this.#drawMood(ctx);
    this.buildCount += 1;
    return true;
  }

  #drawFloorCells(ctx) {
    for (let y = 0; y < this.grid.height; y += 1) {
      for (let x = 0; x < this.grid.width; x += 1) {
        const def = this.grid.getTileDef(x, y);
        if (!def || isCatalogBlock(def.kind) || this.#isHiddenCell(x, y)) continue;
        const screen = gridToScreen(x, y, 0, this.bounds.origin);
        if (!this.#floorIntersectsWindow(screen)) continue;
        P.drawStyledFloorCell(ctx, screen.x, screen.y, x, y, def.floor ?? 'stone');
        const wallPressure = this.#wallPressure(x, y);
        if (wallPressure > 0) {
          P.drawFloorGrime(
            ctx,
            screen.x,
            screen.y,
            P.hash2D(x + 33, y + 41),
            Math.min(1.35, 0.55 + wallPressure * 0.22)
          );
        }
      }
    }
  }

  #drawFlatProps(ctx) {
    for (const prop of this.flatProps) {
      if (this.#isPropConcealed(prop) || this.#isHiddenCell(prop.x, prop.y)) continue;
      const screen = gridToScreen(prop.x, prop.y, 0, this.bounds.origin);
      if (!this.#anchorIntersectsWindow(screen, DECAL_CULL_PAD)) continue;
      const seed = prop.seed ?? P.hash2D(prop.x + 5, prop.y + 5);
      const entry = getSprite(prop.kind);
      if (entry?.flat) {
        entry.draw(ctx, screen.x, screen.y, seed, { prop });
      } else {
        P.drawNoisePixels(ctx, screen.x - 22, screen.y - 9, 44, 18, [PALETTE.stoneDust], 0.05, seed);
      }
    }
  }

  #drawMood(ctx) {
    if (!this.mood?.floorShade) return;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = this.mood.floorShadeAlpha ?? 0.5;
    ctx.fillStyle = this.mood.floorShade;
    ctx.fillRect(this.window.x, this.window.y, this.window.width, this.window.height);
    ctx.restore();
  }

  #floorIntersectsWindow(screen) {
    const halfWidth = TILE_WIDTH / 2 + FLOOR_CULL_PAD;
    const halfHeight = TILE_HEIGHT / 2 + FLOOR_CULL_PAD;
    return (
      screen.x + halfWidth >= this.window.x &&
      screen.x - halfWidth <= this.window.x + this.window.width &&
      screen.y + halfHeight >= this.window.y &&
      screen.y - halfHeight <= this.window.y + this.window.height
    );
  }

  #anchorIntersectsWindow(screen, pad) {
    return (
      screen.x + pad >= this.window.x &&
      screen.x - pad <= this.window.x + this.window.width &&
      screen.y + pad >= this.window.y &&
      screen.y - pad <= this.window.y + this.window.height
    );
  }

  #wallPressure(x, y) {
    let count = 0;
    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 }
    ];
    for (const direction of directions) {
      const nx = x + direction.x;
      const ny = y + direction.y;
      if (!this.grid.isInside(nx, ny) || isCatalogBlock(this.grid.getTileDef(nx, ny)?.kind)) {
        count += 1;
      }
    }
    return count;
  }

  #isHiddenCell(x, y) {
    return this.hiddenTiles.has(`${x},${y}`);
  }

  #isPropConcealed(prop) {
    return Boolean(
      prop?.hiddenByFlag ||
      (prop?.hiddenUntilOpened && !prop.opened && !prop.consumed)
    );
  }
}
