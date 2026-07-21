// Native-resolution prepared-raster cache for volumetric world props.
//
// Pixel primitives are deliberately detailed and can issue thousands of tiny
// hard-pixel fills for one chapel block. Replaying those commands every frame
// wastes CPU because most props do not animate. This cache draws each prop
// once into a reusable scratch surface, tracks the exact touched bounds, then
// stores only the tightly cropped native pixels. The prepared record is shared
// by visible compositing, shape-aware masks, and hover outlines. Animated art
// uses an animation-bearing signature, so every visible state is still exact.
// The compositor depth sorts every prop independently.

import {
  NATIVE_PIXEL,
  NATIVE_SCALE,
  toNativePixels
} from './renderConfig.js';
import { getSoftwareCanvasContext2D } from './canvasContext.js';

const DEFAULT_MAX_BYTES = 64 * 1024 * 1024;
const DEFAULT_MAX_ENTRIES = 1024;
const SCRATCH_WIDTH = 320;
const SCRATCH_HEIGHT = 256;
const SCRATCH_ORIGIN_X = 160;
const SCRATCH_ORIGIN_Y = 192;
const BOUNDS_PAD = 2;

export class PropSpriteCache {
  constructor({ maxBytes = DEFAULT_MAX_BYTES, maxEntries = DEFAULT_MAX_ENTRIES } = {}) {
    this.maxBytes = maxBytes;
    this.maxEntries = maxEntries;
    this.byProp = new WeakMap();
    this.live = new Set();
    this.bytes = 0;
    this.clock = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;

    this.scratch = document.createElement('canvas');
    this.scratch.width = toNativePixels(SCRATCH_WIDTH);
    this.scratch.height = toNativePixels(SCRATCH_HEIGHT);
    this.scratchCtx = getSoftwareCanvasContext2D(this.scratch);
    this.scratchLost = false;
    this.scratch.addEventListener?.('contextlost', (event) => {
      event.preventDefault?.();
      this.scratchLost = true;
      this.clear();
    });
    this.scratch.addEventListener?.('contextrestored', () => {
      this.scratchCtx = getSoftwareCanvasContext2D(this.scratch);
      this.scratchLost = false;
    });
  }

  get stats() {
    return {
      entries: this.live.size,
      bytes: this.bytes,
      hits: this.hitCount,
      misses: this.missCount,
      evictions: this.evictionCount
    };
  }

  clear() {
    for (const record of this.live) this.#discardSurface(record);
    this.byProp = new WeakMap();
    this.live.clear();
    this.bytes = 0;
    this.clock = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
  }

  prepare(entry, prop, seed, drawState) {
    if (!entry || typeof entry.draw !== 'function') return null;
    if (
      !prop ||
      typeof prop !== 'object' ||
      this.scratchLost ||
      this.scratchCtx?.isContextLost?.()
    ) {
      return null;
    }

    const signature = visualSignature(prop, entry, seed, drawState);
    let records = this.byProp.get(prop);
    if (!records) {
      records = new Map();
      this.byProp.set(prop, records);
    }
    const recordKey = entry.animated ? `${seed}|${signature}` : 'static';
    let record = records.get(recordKey);
    if (!record || record.entry !== entry || record.seed !== seed || record.signature !== signature) {
      if (record) this.#release(record);
      record = {
        entry,
        prop,
        seed,
        signature,
        surface: null,
        offsetX: 0,
        offsetY: 0,
        logicalWidth: 0,
        logicalHeight: 0,
        bytes: 0,
        lastUsed: 0,
        empty: false,
        invalid: false
      };
      records.set(recordKey, record);
    }

    const placement = entry.placementOffset?.(prop, seed, drawState) ?? null;
    record.anchorOffsetX = finiteNumber(placement?.x, 0);
    record.anchorOffsetY = finiteNumber(placement?.y, 0);

    if (record.invalid) {
      this.#release(record);
      record.invalid = false;
    }

    if (!record.surface && !record.empty) {
      this.#build(record, drawState);
      this.missCount += 1;
    } else {
      this.hitCount += 1;
    }
    record.lastUsed = ++this.clock;

    if (!record.empty && record.surface) {
      return record;
    }
    return record.empty ? record : null;
  }

  composite(ctx, prepared, x, y) {
    if (!prepared || prepared.empty || !prepared.surface) return false;
    ctx.drawImage(
      prepared.surface,
      0,
      0,
      prepared.surface.width,
      prepared.surface.height,
      x + (prepared.anchorOffsetX ?? 0) + prepared.offsetX,
      y + (prepared.anchorOffsetY ?? 0) + prepared.offsetY,
      prepared.logicalWidth,
      prepared.logicalHeight
    );
    return true;
  }

  draw(ctx, entry, prop, seed, drawState, x, y) {
    const prepared = this.prepare(entry, prop, seed, drawState);
    if (!prepared) {
      entry?.draw?.(ctx, x, y, seed, drawState);
      return false;
    }
    this.composite(ctx, prepared, x, y);
    return true;
  }

  #build(record, drawState) {
    let layout = {
      width: SCRATCH_WIDTH,
      height: SCRATCH_HEIGHT,
      originX: SCRATCH_ORIGIN_X,
      originY: SCRATCH_ORIGIN_Y
    };
    let bounds = this.#renderScratch(record, drawState, layout);
    if (!bounds) {
      record.empty = true;
      return;
    }

    let crop = paddedBounds(bounds);
    if (!containsBounds(layout, crop)) {
      const relative = {
        minX: crop.minX - layout.originX,
        minY: crop.minY - layout.originY,
        maxX: crop.maxX - layout.originX,
        maxY: crop.maxY - layout.originY
      };
      layout = {
        width: Math.max(1, relative.maxX - relative.minX + BOUNDS_PAD * 2),
        height: Math.max(1, relative.maxY - relative.minY + BOUNDS_PAD * 2),
        originX: -relative.minX + BOUNDS_PAD,
        originY: -relative.minY + BOUNDS_PAD
      };
      this.#resizeScratch(layout);
      bounds = this.#renderScratch(record, drawState, layout);
      crop = paddedBounds(bounds);
    }

    const sourceX = toNativePixels(crop.minX);
    const sourceY = toNativePixels(crop.minY);
    const sourceWidth = Math.max(1, toNativePixels(crop.maxX - crop.minX));
    const sourceHeight = Math.max(1, toNativePixels(crop.maxY - crop.minY));
    const surface = document.createElement('canvas');
    surface.width = sourceWidth;
    surface.height = sourceHeight;
    const surfaceCtx = getSoftwareCanvasContext2D(surface);
    surfaceCtx.drawImage(
      this.scratch,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight
    );

    record.surface = surface;
    record.offsetX = crop.minX - layout.originX;
    record.offsetY = crop.minY - layout.originY;
    record.logicalWidth = sourceWidth / NATIVE_SCALE;
    record.logicalHeight = sourceHeight / NATIVE_SCALE;
    record.bytes = sourceWidth * sourceHeight * 4;
    record.empty = false;
    surface.addEventListener?.('contextlost', (event) => {
      event.preventDefault?.();
      if (record.surface === surface) record.invalid = true;
    });
    surface.addEventListener?.('contextrestored', () => {
      if (record.surface === surface) record.invalid = true;
    });
    this.bytes += record.bytes;
    this.live.add(record);
    this.#trim(record);
  }

  #renderScratch(record, drawState, layout) {
    this.#resizeScratch(layout);
    const ctx = this.scratchCtx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, this.scratch.width, this.scratch.height);
    ctx.setTransform(
      NATIVE_SCALE,
      0,
      0,
      NATIVE_SCALE,
      0,
      0
    );
    ctx.imageSmoothingEnabled = false;

    const tracker = new DrawBounds();
    record.entry.draw(
      trackedContext(ctx, tracker),
      layout.originX,
      layout.originY,
      record.seed,
      drawState
    );
    return tracker.bounds;
  }

  #resizeScratch(layout) {
    const width = Math.max(1, toNativePixels(layout.width));
    const height = Math.max(1, toNativePixels(layout.height));
    if (this.scratch.width === width && this.scratch.height === height) return;
    this.scratch.width = width;
    this.scratch.height = height;
    this.scratchCtx = getSoftwareCanvasContext2D(this.scratch);
  }

  #trim(protectedRecord) {
    while (this.bytes > this.maxBytes || this.live.size > this.maxEntries) {
      let oldest = null;
      for (const record of this.live) {
        if (record === protectedRecord) continue;
        if (!oldest || record.lastUsed < oldest.lastUsed) oldest = record;
      }
      if (!oldest) break;
      this.#discardSurface(oldest);
      this.live.delete(oldest);
      this.evictionCount += 1;
    }
  }

  #release(record) {
    if (this.live.has(record)) {
      this.#discardSurface(record);
      this.live.delete(record);
    }
  }

  #discardSurface(record) {
    this.bytes = Math.max(0, this.bytes - (record.bytes ?? 0));
    if (record.surface) {
      record.surface.width = 1;
      record.surface.height = 1;
    }
    record.surface = null;
    record.bytes = 0;
    record.empty = false;
  }
}

class DrawBounds {
  constructor() {
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;
    this.path = null;
  }

  get bounds() {
    if (!Number.isFinite(this.minX)) return null;
    return { minX: this.minX, minY: this.minY, maxX: this.maxX, maxY: this.maxY };
  }

  rect(x, y, width, height, pad = 0) {
    const left = Math.min(x, x + width) - pad;
    const top = Math.min(y, y + height) - pad;
    const right = Math.max(x, x + width) + pad;
    const bottom = Math.max(y, y + height) + pad;
    this.#include(left, top, right, bottom);
  }

  beginPath() {
    this.path = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  }

  point(x, y) {
    if (!this.path) this.beginPath();
    this.path.minX = Math.min(this.path.minX, x);
    this.path.minY = Math.min(this.path.minY, y);
    this.path.maxX = Math.max(this.path.maxX, x);
    this.path.maxY = Math.max(this.path.maxY, y);
  }

  commitPath(pad = 0) {
    if (!this.path || !Number.isFinite(this.path.minX)) return;
    this.#include(
      this.path.minX - pad,
      this.path.minY - pad,
      this.path.maxX + pad,
      this.path.maxY + pad
    );
  }

  #include(minX, minY, maxX, maxY) {
    this.minX = Math.min(this.minX, minX);
    this.minY = Math.min(this.minY, minY);
    this.maxX = Math.max(this.maxX, maxX);
    this.maxY = Math.max(this.maxY, maxY);
  }
}

function trackedContext(ctx, tracker) {
  const methods = {
    fillRect(x, y, width, height) {
      tracker.rect(x, y, width, height);
      return ctx.fillRect(x, y, width, height);
    },
    strokeRect(x, y, width, height) {
      tracker.rect(x, y, width, height, Math.max(NATIVE_PIXEL, ctx.lineWidth / 2));
      return ctx.strokeRect(x, y, width, height);
    },
    beginPath() {
      tracker.beginPath();
      return ctx.beginPath();
    },
    moveTo(x, y) {
      tracker.point(x, y);
      return ctx.moveTo(x, y);
    },
    lineTo(x, y) {
      tracker.point(x, y);
      return ctx.lineTo(x, y);
    },
    rect(x, y, width, height) {
      tracker.point(x, y);
      tracker.point(x + width, y + height);
      return ctx.rect(x, y, width, height);
    },
    arc(x, y, radius, startAngle, endAngle, counterclockwise) {
      tracker.point(x - radius, y - radius);
      tracker.point(x + radius, y + radius);
      return ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    },
    fill(...args) {
      tracker.commitPath();
      return ctx.fill(...args);
    },
    stroke(...args) {
      tracker.commitPath(Math.max(NATIVE_PIXEL, ctx.lineWidth / 2));
      return ctx.stroke(...args);
    },
    drawImage(image, ...args) {
      if (args.length === 2) tracker.rect(args[0], args[1], image.width / NATIVE_SCALE, image.height / NATIVE_SCALE);
      if (args.length === 4) tracker.rect(args[0], args[1], args[2], args[3]);
      if (args.length === 8) tracker.rect(args[4], args[5], args[6], args[7]);
      return ctx.drawImage(image, ...args);
    },
    fillText(text, x, y, maxWidth) {
      const width = Math.min(maxWidth ?? Infinity, ctx.measureText(text).width);
      tracker.rect(x, y, width, 12);
      return ctx.fillText(text, x, y, maxWidth);
    }
  };

  return new Proxy(ctx, {
    get(target, property) {
      if (methods[property]) return methods[property];
      const value = target[property];
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    }
  });
}

function paddedBounds(bounds) {
  return {
    minX: snapDown(bounds.minX - BOUNDS_PAD),
    minY: snapDown(bounds.minY - BOUNDS_PAD),
    maxX: snapUp(bounds.maxX + BOUNDS_PAD),
    maxY: snapUp(bounds.maxY + BOUNDS_PAD)
  };
}

function containsBounds(layout, bounds) {
  return (
    bounds.minX >= 0 &&
    bounds.minY >= 0 &&
    bounds.maxX <= layout.width &&
    bounds.maxY <= layout.height
  );
}

function snapDown(value) {
  return Math.floor(value * NATIVE_SCALE) / NATIVE_SCALE;
}

function snapUp(value) {
  return Math.ceil(value * NATIVE_SCALE) / NATIVE_SCALE;
}

function visualSignature(prop, entry, seed, drawState) {
  const connected = prop.connected ?? {};
  const signature = [
    prop.orient,
    prop.height,
    prop.variant,
    prop.state,
    prop.wallPlane,
    prop.wallSide,
    prop.member,
    prop.model,
    prop.count,
    prop.density,
    Boolean(prop.opened),
    Boolean(prop.consumed),
    Boolean(prop.unlocked),
    Boolean(prop.revealed),
    Boolean(prop.locked),
    Boolean(prop.defiled),
    Boolean(prop.dry),
    Boolean(prop.dim),
    Boolean(prop.active),
    Boolean(prop.damaged),
    Boolean(prop.killed),
    Boolean(prop.dead),
    Boolean(prop.released),
    Boolean(prop.interact?.lock),
    prop.doorLeaf,
    Boolean(connected.xPlus),
    Boolean(connected.yPlus),
    Boolean(connected.xMinus),
    Boolean(connected.yMinus)
  ];
  if (entry?.animated) {
    const customKey = entry.animationKey?.(prop, seed, drawState);
    if (customKey != null) {
      signature.push('custom', customKey);
      return signature.join('|');
    }
    const timelineFrame = animatedTimelineFrame(prop, drawState?.anim?.tick);
    if (prop.kind !== 'chapel-double-door' && prop.kind !== 'ground-item') {
      signature.push(drawState?.pulse ?? 0, drawState?.flicker ?? 0);
    }
    if (timelineFrame != null) signature.push(timelineFrame);
  }
  return signature.join('|');
}

function animatedTimelineFrame(prop, tick) {
  const now = Number(tick);
  if (!Number.isFinite(now)) return null;

  if (prop.kind === 'chapel-double-door' && prop.opened && prop.openedAt != null) {
    const progress = Math.max(0, Math.min(1, (now - prop.openedAt) / 0.56));
    return progress < 1 ? Math.floor(progress * 32) : 'settled';
  }

  if (prop.kind === 'ground-item') {
    if (prop.pickupStart != null) {
      const progress = Math.max(0, Math.min(1, (now - prop.pickupStart) / (prop.pickupDuration ?? 0.24)));
      return progress < 1 ? `pickup:${Math.floor(progress * 24)}` : 'picked-up';
    }
    if (prop.droppedAt != null) {
      const progress = Math.max(0, Math.min(1, (now - prop.droppedAt) / (prop.dropDuration ?? 0.38)));
      return progress < 1 ? `drop:${Math.floor(progress * 24)}` : 'settled';
    }
  }

  if (prop.kind === 'cross-martyr' && prop.released && prop.fallStart != null) {
    const progress = Math.max(0, Math.min(1, (now - prop.fallStart) / 0.7));
    return progress < 1 ? Math.floor(progress * 32) : 'fallen';
  }

  return null;
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
