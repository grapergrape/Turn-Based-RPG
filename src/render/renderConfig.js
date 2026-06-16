// Central rendering constants for the isometric presentation.
//
// These values are intentionally fixed and low-resolution. The game renders to
// an internal 640x480 buffer and is then upscaled with nearest-neighbour
// scaling so the result keeps crisp pixel-art edges. The validation script
// (scripts/check-content.mjs) reads this file and asserts the key values, so
// keep the shape simple and literal.

export const RENDER_CONFIG = {
  INTERNAL_WIDTH: 640,
  INTERNAL_HEIGHT: 480,
  VIEWPORT_HEIGHT: 384,
  // Compact 2:1 diamonds keep the scene tactically readable at 640x480 while
  // leaving enough pixel budget for small, grounded human sprites.
  TILE_WIDTH: 64,
  TILE_HEIGHT: 32,
  WALL_HEIGHT: 64,
  DEBUG_GRID_DEFAULT: false
};

// Convenience named exports for code that prefers not to reach through the
// config object. They must stay in sync with RENDER_CONFIG above.
export const INTERNAL_WIDTH = RENDER_CONFIG.INTERNAL_WIDTH;
export const INTERNAL_HEIGHT = RENDER_CONFIG.INTERNAL_HEIGHT;
export const VIEWPORT_HEIGHT = RENDER_CONFIG.VIEWPORT_HEIGHT;
export const TILE_WIDTH = RENDER_CONFIG.TILE_WIDTH;
export const TILE_HEIGHT = RENDER_CONFIG.TILE_HEIGHT;
export const WALL_HEIGHT = RENDER_CONFIG.WALL_HEIGHT;
export const DEBUG_GRID_DEFAULT = RENDER_CONFIG.DEBUG_GRID_DEFAULT;

// The world viewport occupies the upper portion of the screen; the command
// panel sits underneath it.
export const VIEWPORT = {
  x: 0,
  y: 0,
  width: INTERNAL_WIDTH,
  height: VIEWPORT_HEIGHT
};

export const UI_PANEL = {
  x: 0,
  y: VIEWPORT_HEIGHT,
  width: INTERNAL_WIDTH,
  height: INTERNAL_HEIGHT - VIEWPORT_HEIGHT
};
