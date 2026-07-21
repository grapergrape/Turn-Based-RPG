// Isometric projection helpers.
//
// The world is stored as a logical rectangular grid (x to the right, y down).
// On screen we project it into a 2:1 isometric diamond layout. The origin is
// the screen position of grid cell (0, 0); callers compute it once per level to
// centre the scene inside the viewport (see computeSceneBounds).

import { TILE_WIDTH, TILE_HEIGHT, WALL_HEIGHT } from './renderConfig.js';

const SCENE_PAD = 48;

const HALF_W = TILE_WIDTH / 2;
const HALF_H = TILE_HEIGHT / 2;

// Project a grid cell to the screen-space centre of its floor diamond.
// z raises the point upward (used for prop/wall height). All outputs are
// integer-rounded so nothing is ever drawn on a half pixel.
export function gridToScreen(x, y, z = 0, origin = { x: 0, y: 0 }) {
  return {
    x: origin.x + Math.round((x - y) * HALF_W),
    y: origin.y + Math.round((x + y) * HALF_H) - Math.round(z)
  };
}

// Inverse projection: screen pixel -> nearest grid cell (z assumed 0).
export function screenToGrid(sx, sy, origin = { x: 0, y: 0 }) {
  const dx = sx - origin.x;
  const dy = sy - origin.y;
  return {
    x: Math.round((dx / HALF_W + dy / HALF_H) / 2),
    y: Math.round((dy / HALF_H - dx / HALF_W) / 2)
  };
}

// Map a grid movement/target vector to one of eight isometric facings by its
// screen-space direction. sx/sy are the screen axes:
// sx = dx - dy (right), sy = dx + dy (down).
export function screenFacing(dx, dy) {
  const sx = dx - dy;
  const sy = dx + dy;
  if (sx === 0 && sy === 0) return 'se';

  const facings = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
  const angle = Math.atan2(sy, sx);
  const sector = (Math.round(angle / (Math.PI / 4)) + 8) % 8;
  return facings[sector];
}

// Painter's-algorithm depth key. Cells further "down" the screen (larger
// x + y) draw later. zLayer breaks ties so something sitting on a tile draws
// after the floor of that same tile.
export function sortKey(x, y, zLayer = 0) {
  return (x + y) * 8 + zLayer;
}

// Logical projected bounds for a width x height grid, plus the origin (screen
// position of cell 0,0) inside those bounds. The camera clamps against this
// full extent while StaticSceneCache bakes only a bounded moving window.
export function computeSceneBounds(width, height) {
  const minSx = (0 - (height - 1)) * HALF_W; // leftmost point (x=0, y=max)
  const maxSx = ((width - 1) - 0) * HALF_W;   // rightmost point (x=max, y=0)
  const spanW = maxSx - minSx + TILE_WIDTH;
  const spanH = ((width - 1) + (height - 1)) * HALF_H + TILE_HEIGHT + WALL_HEIGHT;

  const origin = {
    x: Math.round(SCENE_PAD - minSx + HALF_W / 2),
    y: Math.round(SCENE_PAD + WALL_HEIGHT)
  };
  return {
    width: Math.round(spanW + SCENE_PAD * 2),
    height: Math.round(spanH + SCENE_PAD * 2),
    origin
  };
}
