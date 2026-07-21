// Central rendering constants for the isometric presentation.
//
// Gameplay and layout continue to use the proven 640x480 design grid. The
// backing canvas is a native 2x surface so art can use one physical pixel for
// detail instead of enlarging every design pixel into a featureless 2x2 block.
// The validation script reads this object and asserts the contract, so keep the
// shape simple and literal.

export const RENDER_CONFIG = {
  NATIVE_SCALE: 2,
  LOGICAL_WIDTH: 640,
  LOGICAL_HEIGHT: 480,
  LOGICAL_VIEWPORT_HEIGHT: 384,
  INTERNAL_WIDTH: 1280,
  INTERNAL_HEIGHT: 960,
  NATIVE_VIEWPORT_HEIGHT: 768,
  // Compact logical diamonds preserve the tactical composition. They occupy
  // 128x64 native pixels and can carry single-native-pixel surface detail.
  TILE_WIDTH: 64,
  TILE_HEIGHT: 32,
  WALL_HEIGHT: 64,
  NATIVE_TILE_WIDTH: 128,
  NATIVE_TILE_HEIGHT: 64,
  NATIVE_WALL_HEIGHT: 128,
  DEBUG_GRID_DEFAULT: false
};

// Convenience named exports for code that prefers not to reach through the
// config object. They must stay in sync with RENDER_CONFIG above.
export const NATIVE_SCALE = RENDER_CONFIG.NATIVE_SCALE;
export const LOGICAL_WIDTH = RENDER_CONFIG.LOGICAL_WIDTH;
export const LOGICAL_HEIGHT = RENDER_CONFIG.LOGICAL_HEIGHT;
export const LOGICAL_VIEWPORT_HEIGHT = RENDER_CONFIG.LOGICAL_VIEWPORT_HEIGHT;
export const INTERNAL_WIDTH = RENDER_CONFIG.INTERNAL_WIDTH;
export const INTERNAL_HEIGHT = RENDER_CONFIG.INTERNAL_HEIGHT;
export const NATIVE_VIEWPORT_HEIGHT = RENDER_CONFIG.NATIVE_VIEWPORT_HEIGHT;
// Existing gameplay code consumes VIEWPORT_HEIGHT in logical coordinates.
export const VIEWPORT_HEIGHT = LOGICAL_VIEWPORT_HEIGHT;
export const TILE_WIDTH = RENDER_CONFIG.TILE_WIDTH;
export const TILE_HEIGHT = RENDER_CONFIG.TILE_HEIGHT;
export const WALL_HEIGHT = RENDER_CONFIG.WALL_HEIGHT;
export const NATIVE_TILE_WIDTH = RENDER_CONFIG.NATIVE_TILE_WIDTH;
export const NATIVE_TILE_HEIGHT = RENDER_CONFIG.NATIVE_TILE_HEIGHT;
export const NATIVE_WALL_HEIGHT = RENDER_CONFIG.NATIVE_WALL_HEIGHT;
export const DEBUG_GRID_DEFAULT = RENDER_CONFIG.DEBUG_GRID_DEFAULT;

export const NATIVE_PIXEL = 1 / NATIVE_SCALE;

export function toNativePixels(logicalPixels) {
  return Math.round(logicalPixels * NATIVE_SCALE);
}

export function snapToNativePixel(logicalPixels) {
  return Math.round(logicalPixels * NATIVE_SCALE) / NATIVE_SCALE;
}

// The world viewport occupies the upper portion of the screen; the command
// panel sits underneath it.
export const VIEWPORT = {
  x: 0,
  y: 0,
  width: LOGICAL_WIDTH,
  height: VIEWPORT_HEIGHT
};

export const UI_PANEL = {
  x: 0,
  y: VIEWPORT_HEIGHT,
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT - VIEWPORT_HEIGHT
};

export const NATIVE_VIEWPORT = {
  x: 0,
  y: 0,
  width: INTERNAL_WIDTH,
  height: NATIVE_VIEWPORT_HEIGHT
};
