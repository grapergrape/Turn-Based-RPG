// Shape-aware hard-pixel masks derived from prepared prop and actor rasters.
//
// The visible raster is the source of truth. Contact shadows sample its authored
// ground band, daylight shadows project its opaque pixels with integer math,
// and hover rims expand its silhouette by exactly one native pixel. Generated
// canvases are bounded by one shared LRU budget so dense maps cannot retain an
// unbounded second copy of world art.

import { PALETTE } from './palette.js';
import { NATIVE_SCALE } from './renderConfig.js';
import { getSoftwareCanvasContext2D } from './canvasContext.js';

export const DEFAULT_SHADOW_MASK_BYTES = 24 * 1024 * 1024;
const DEFAULT_MAX_SOURCES = 1024;
const ALPHA_OPAQUE = 1;
const BAYER_4 = Object.freeze([
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5
]);

export class ShadowMaskCache {
  constructor({ maxBytes = DEFAULT_SHADOW_MASK_BYTES, maxSources = DEFAULT_MAX_SOURCES } = {}) {
    this.maxBytes = maxBytes;
    this.maxSources = maxSources;
    this.bySurface = new WeakMap();
    this.live = new Set();
    this.bytes = 0;
    this.clock = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
  }

  get stats() {
    let masks = 0;
    for (const source of this.live) masks += source.masks.size;
    return {
      sources: this.live.size,
      masks,
      bytes: this.bytes,
      hits: this.hitCount,
      misses: this.missCount,
      evictions: this.evictionCount
    };
  }

  clear() {
    for (const source of this.live) this.#discard(source);
    this.bySurface = new WeakMap();
    this.live.clear();
    this.bytes = 0;
    this.clock = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
  }

  prepareContact(source, profile) {
    if (!source?.surface || !profile || profile.mode === 'none') return null;
    const signature = contactSignature(profile);
    return this.#prepare(source, signature, (alpha) => buildContactMask(alpha, source, profile));
  }

  prepareCast(source, profile, projection, coverage = 1) {
    if (!source?.surface || !profile || profile.mode === 'none') return null;
    const resolvedCoverage = clamp01(coverage * finite(profile.alphaScale, 1));
    if (resolvedCoverage <= 0) return null;
    const signature = castSignature(profile, projection, resolvedCoverage);
    return this.#prepare(source, signature, (alpha) => buildCastMask(
      alpha,
      source,
      profile,
      projection,
      resolvedCoverage
    ));
  }

  prepareOutline(source, color, opacityThreshold = ALPHA_OPAQUE) {
    if (!source?.surface || !color) return null;
    const signature = `outline|${color}|${Math.max(1, Math.round(opacityThreshold))}`;
    return this.#prepare(source, signature, (alpha) => buildOutlineMask(
      alpha,
      source,
      color,
      opacityThreshold
    ));
  }

  draw(ctx, mask, anchorX, anchorY) {
    if (!mask?.surface) return false;
    ctx.drawImage(
      mask.surface,
      0,
      0,
      mask.surface.width,
      mask.surface.height,
      Math.round((anchorX + mask.offsetX) * NATIVE_SCALE) / NATIVE_SCALE,
      Math.round((anchorY + mask.offsetY) * NATIVE_SCALE) / NATIVE_SCALE,
      mask.logicalWidth,
      mask.logicalHeight
    );
    return true;
  }

  #prepare(source, signature, build) {
    let record = this.bySurface.get(source.surface);
    if (!record) {
      record = this.#readSource(source);
      if (!record) return null;
      this.bySurface.set(source.surface, record);
      this.live.add(record);
      this.bytes += record.alpha.byteLength;
    }

    record.lastUsed = ++this.clock;
    let cached = record.masks.get(signature);
    if (cached?.invalid) {
      this.#discardMask(cached);
      record.masks.delete(signature);
      cached = null;
    }
    if (cached) {
      cached.lastUsed = record.lastUsed;
      this.hitCount += 1;
      return cached;
    }

    const maskData = build(record.alpha);
    const mask = maskData ? rasterizeMask(maskData) : null;
    this.missCount += 1;
    if (!mask) return null;

    mask.lastUsed = record.lastUsed;
    mask.bytes = mask.surface.width * mask.surface.height * 4;
    mask.invalid = false;
    mask.surface.addEventListener?.('contextlost', (event) => {
      event.preventDefault?.();
      mask.invalid = true;
    });
    mask.surface.addEventListener?.('contextrestored', () => {
      mask.invalid = true;
    });
    record.masks.set(signature, mask);
    this.bytes += mask.bytes;
    this.#trim(record);
    return mask;
  }

  #readSource(source) {
    const width = source.surface.width;
    const height = source.surface.height;
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) return null;
    const ctx = source.surface.getContext?.('2d', { willReadFrequently: true });
    if (!ctx || typeof ctx.getImageData !== 'function') return null;
    let pixels;
    try {
      pixels = ctx.getImageData(0, 0, width, height).data;
    } catch {
      return null;
    }
    const alpha = new Uint8Array(width * height);
    for (let pixel = 0, offset = 3; pixel < alpha.length; pixel += 1, offset += 4) {
      alpha[pixel] = pixels[offset] ?? 0;
    }
    return {
      surface: source.surface,
      alpha,
      width,
      height,
      masks: new Map(),
      lastUsed: ++this.clock
    };
  }

  #trim(protectedRecord) {
    while (this.bytes > this.maxBytes || this.live.size > this.maxSources) {
      let oldest = null;
      for (const record of this.live) {
        if (record === protectedRecord) continue;
        if (!oldest || record.lastUsed < oldest.lastUsed) oldest = record;
      }
      if (!oldest) break;
      this.#discard(oldest);
      this.live.delete(oldest);
      this.bySurface.delete(oldest.surface);
      this.evictionCount += 1;
    }
  }

  #discard(record) {
    this.bytes = Math.max(0, this.bytes - record.alpha.byteLength);
    for (const mask of record.masks.values()) {
      this.#discardMask(mask);
    }
    record.masks.clear();
    record.alpha = new Uint8Array(0);
  }

  #discardMask(mask) {
    this.bytes = Math.max(0, this.bytes - (mask.bytes ?? 0));
    mask.surface.width = 1;
    mask.surface.height = 1;
    mask.bytes = 0;
  }
}

// Pure builders are exported so the geometry contract can be tested without a
// browser canvas. Each returns a tightly cropped binary mask description.
export function buildContactMask(alpha, source, profile) {
  const width = source.surface.width;
  const height = source.surface.height;
  if (alpha.length !== width * height) return null;

  const anchorX = native(-finite(source.offsetX, 0));
  const anchorY = native(-finite(source.offsetY, 0));
  const threshold = thresholdFor(profile);
  const depth = Math.max(1, native(finite(profile.depth, 8)));
  const offsetX = native(finite(profile.offsetX, 0));
  const offsetY = native(finite(profile.offsetY, 0));
  const full = profile.mode === 'full-silhouette' || (
    profile.mode === 'custom' && (profile.custom === 'airborne' || profile.custom === 'prone')
  );
  const airborne = profile.mode === 'custom' && profile.custom === 'airborne';
  const compression = airborne ? clamp(finite(profile.compression, 0.22), 0.08, 0.5) : 1;
  const minSourceY = full ? 0 : Math.max(0, anchorY - depth);
  const maxSourceY = Math.min(height - 1, anchorY + Math.max(1, Math.floor(depth * 0.25)));
  const spread = Math.min(1, Math.max(0, Math.round(finite(profile.spread, 1))));
  const projectedMinY = airborne
    ? anchorY + Math.round((minSourceY - anchorY) * compression) + offsetY
    : minSourceY + offsetY;
  const projectedMaxY = airborne
    ? anchorY + Math.round((maxSourceY - anchorY) * compression) + offsetY
    : maxSourceY + offsetY;
  const minX = offsetX - spread;
  const maxX = width - 1 + offsetX + spread;
  const minY = Math.min(projectedMinY, projectedMaxY) - spread;
  const maxY = Math.max(projectedMinY, projectedMaxY) + spread;
  const maskWidth = maxX - minX + 1;
  const maskHeight = maxY - minY + 1;
  const data = new Uint8Array(maskWidth * maskHeight);
  let occupied = false;
  for (let y = minSourceY; y <= maxSourceY; y += 1) {
    const row = y * width;
    const targetY = airborne
      ? anchorY + Math.round((y - anchorY) * compression) + offsetY
      : y + offsetY;
    for (let x = 0; x < width; x += 1) {
      if (alpha[row + x] < threshold) continue;
      occupied = true;
      const centerX = x + offsetX - minX;
      const centerY = targetY - minY;
      for (let oy = -spread; oy <= spread; oy += 1) {
        const outputRow = (centerY + oy) * maskWidth;
        for (let ox = -spread; ox <= spread; ox += 1) {
          data[outputRow + centerX + ox] = 1;
        }
      }
    }
  }
  if (!occupied) return null;
  return maskFromData(data, maskWidth, maskHeight, PALETTE.void, source, minX, minY);
}

export function buildCastMask(alpha, source, profile, projection, coverage = 1) {
  const width = source.surface.width;
  const height = source.surface.height;
  if (alpha.length !== width * height) return null;

  const anchorY = native(-finite(source.offsetY, 0));
  const threshold = thresholdFor(profile);
  const referenceHeight = Math.max(1, native(finite(profile.referenceHeight, 56)));
  const vectorX = native(finite(projection?.x, 12));
  const vectorY = native(finite(projection?.y, 6));
  const topElevation = Math.max(0, anchorY);
  const topProjectionX = Math.round((vectorX * topElevation) / referenceHeight);
  const topProjectionY = Math.round((vectorY * topElevation) / referenceHeight);
  const minX = Math.min(0, topProjectionX);
  const maxX = width - 1 + Math.max(0, topProjectionX);
  const minY = anchorY + Math.min(0, topProjectionY);
  const maxY = anchorY + Math.max(0, topProjectionY);
  const maskWidth = maxX - minX + 1;
  const maskHeight = maxY - minY + 1;
  const data = new Uint8Array(maskWidth * maskHeight);
  let occupied = false;
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    const elevation = Math.max(0, anchorY - y);
    const projectedX = Math.round((vectorX * elevation) / referenceHeight);
    const projectedY = Math.round((vectorY * elevation) / referenceHeight);
    for (let x = 0; x < width; x += 1) {
      if (alpha[row + x] < threshold) continue;
      const targetX = x + projectedX;
      const targetY = anchorY + projectedY;
      if (!coveragePixel(targetX, targetY, coverage)) continue;
      data[(targetY - minY) * maskWidth + targetX - minX] = 1;
      occupied = true;
    }
  }
  if (!occupied) return null;
  return maskFromData(data, maskWidth, maskHeight, PALETTE.void, source, minX, minY);
}

export function buildOutlineMask(alpha, source, color, opacityThreshold = ALPHA_OPAQUE) {
  const width = source.surface.width;
  const height = source.surface.height;
  if (alpha.length !== width * height) return null;
  const threshold = Math.max(1, Math.min(255, Math.round(opacityThreshold)));
  const paddedWidth = width + 2;
  const paddedHeight = height + 2;
  const data = new Uint8Array(paddedWidth * paddedHeight);
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      if (alpha[row + x] < threshold) continue;
      for (let oy = 0; oy < 3; oy += 1) {
        const outputRow = (y + oy) * paddedWidth;
        for (let ox = 0; ox < 3; ox += 1) {
          data[outputRow + x + ox] = 1;
        }
      }
    }
  }
  for (let y = 0; y < height; y += 1) {
    const sourceRow = y * width;
    const outputRow = (y + 1) * paddedWidth + 1;
    for (let x = 0; x < width; x += 1) {
      if (alpha[sourceRow + x] >= threshold) data[outputRow + x] = 0;
    }
  }
  return cropBinaryData(data, paddedWidth, paddedHeight, color, source, -1, -1);
}

export function unionBinaryMasks(target, targetWidth, mask, offsetX = 0, offsetY = 0) {
  if (!(target instanceof Uint8Array) || !mask) return target;
  const targetHeight = Math.floor(target.length / targetWidth);
  const data = mask instanceof Uint8Array ? mask : mask.data;
  const maskWidth = mask.width ?? 0;
  const maskHeight = mask.height ?? Math.floor((data?.length ?? 0) / maskWidth);
  if (!(data instanceof Uint8Array) || maskWidth <= 0 || maskHeight <= 0) return target;
  for (let y = 0; y < maskHeight; y += 1) {
    const ty = y + offsetY;
    if (ty < 0 || ty >= targetHeight) continue;
    for (let x = 0; x < maskWidth; x += 1) {
      const tx = x + offsetX;
      if (tx < 0 || tx >= targetWidth || data[y * maskWidth + x] === 0) continue;
      target[ty * targetWidth + tx] = 1;
    }
  }
  return target;
}

function rasterizeMask(mask) {
  if (!mask || mask.width <= 0 || mask.height <= 0) return null;
  const canvas = document.createElement('canvas');
  canvas.width = mask.width;
  canvas.height = mask.height;
  const ctx = getSoftwareCanvasContext2D(canvas);
  ctx.setTransform?.(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (typeof ctx.createImageData === 'function' && typeof ctx.putImageData === 'function') {
    const image = ctx.createImageData(mask.width, mask.height);
    const [red, green, blue] = colorChannels(mask.color);
    for (let index = 0, offset = 0; index < mask.data.length; index += 1, offset += 4) {
      if (mask.data[index] === 0) continue;
      image.data[offset] = red;
      image.data[offset + 1] = green;
      image.data[offset + 2] = blue;
      image.data[offset + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  } else {
    ctx.fillStyle = mask.color;
    for (let y = 0; y < mask.height; y += 1) {
      let runStart = -1;
      for (let x = 0; x <= mask.width; x += 1) {
        const filled = x < mask.width && mask.data[y * mask.width + x] !== 0;
        if (filled && runStart < 0) runStart = x;
        if (!filled && runStart >= 0) {
          ctx.fillRect(runStart, y, x - runStart, 1);
          runStart = -1;
        }
      }
    }
  }
  return {
    surface: canvas,
    offsetX: mask.offsetX,
    offsetY: mask.offsetY,
    logicalWidth: mask.width / NATIVE_SCALE,
    logicalHeight: mask.height / NATIVE_SCALE
  };
}

function cropBinaryData(data, width, height, color, source, originX = 0, originY = 0) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      if (data[row + x] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (!Number.isFinite(minX)) return null;
  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;
  const cropped = new Uint8Array(croppedWidth * croppedHeight);
  for (let y = minY; y <= maxY; y += 1) {
    const sourceStart = y * width + minX;
    cropped.set(data.subarray(sourceStart, sourceStart + croppedWidth), (y - minY) * croppedWidth);
  }
  return maskFromData(
    cropped,
    croppedWidth,
    croppedHeight,
    color,
    source,
    originX + minX,
    originY + minY
  );
}

function maskFromData(data, width, height, color, source, minX, minY) {
  return {
    data,
    width,
    height,
    color,
    offsetX: finite(source.offsetX, 0) + minX / NATIVE_SCALE,
    offsetY: finite(source.offsetY, 0) + minY / NATIVE_SCALE
  };
}

function colorChannels(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(color));
  if (!match) return [0, 0, 0];
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function contactSignature(profile) {
  return [
    'contact', profile.mode, profile.custom, profile.depth, profile.spread,
    profile.offsetX, profile.offsetY, profile.opacityThreshold, profile.compression
  ].join('|');
}

function castSignature(profile, projection, coverage) {
  return [
    'cast', profile.mode, profile.custom, profile.referenceHeight,
    profile.opacityThreshold, finite(projection?.x, 12), finite(projection?.y, 6),
    coverage.toFixed(3)
  ].join('|');
}

function thresholdFor(profile) {
  return Math.max(1, Math.min(255, Math.round(finite(profile.opacityThreshold, ALPHA_OPAQUE))));
}

function coveragePixel(x, y, coverage) {
  if (coverage >= 1) return true;
  const threshold = Math.round(clamp01(coverage) * 16);
  const bx = ((x % 4) + 4) % 4;
  const by = ((y % 4) + 4) % 4;
  return BAYER_4[by * 4 + bx] < threshold;
}

function native(value) {
  return Math.round(value * NATIVE_SCALE);
}

function finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}
