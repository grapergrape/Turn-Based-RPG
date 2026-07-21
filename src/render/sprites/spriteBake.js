import { PALETTE } from '../palette.js';
import { getSoftwareCanvasContext2D } from '../canvasContext.js';
import { NATIVE_PIXEL, NATIVE_SCALE, snapToNativePixel, toNativePixels } from '../renderConfig.js';



export const FACINGS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

export const FACING_META = {
  n: { view: 'back', side: 0, back: true, bodyTurn: 0 },
  ne: { view: 'three', side: 1, back: true, bodyTurn: 0.75 },
  e: { view: 'side', side: 1, back: false, bodyTurn: 1 },
  se: { view: 'three', side: 1, back: false, bodyTurn: 0.75 },
  s: { view: 'front', side: 0, back: false, bodyTurn: 0 },
  sw: { view: 'three', side: -1, back: false, bodyTurn: -0.75 },
  w: { view: 'side', side: -1, back: false, bodyTurn: -1 },
  nw: { view: 'three', side: -1, back: true, bodyTurn: -0.75 }
};

export const POSES = {
  idle: [
    { bob: 0, armA: 0, armB: 0, cloth: 0 },
    { bob: 0, armA: 0, armB: 0, cloth: 1 },
    { bob: 1, armA: 1, armB: -1, cloth: 1 },
    { bob: 0, armA: 0, armB: 0, cloth: 0 }
  ],
  walk: [
    { bob: 0, legA: -3, legB: 3, armA: 2, armB: -2, cloth: -1 },
    { bob: 1, legA: -2, legB: 2, armA: 1, armB: -1, cloth: 0 },
    { bob: 1, legA: 0, legB: 0, armA: 0, armB: 0, cloth: 1 },
    { bob: 0, legA: 2, legB: -2, armA: -1, armB: 1, cloth: 1 },
    { bob: 0, legA: 3, legB: -3, armA: -2, armB: 2, cloth: 0 },
    { bob: 1, legA: 2, legB: -2, armA: -1, armB: 1, cloth: -1 },
    { bob: 1, legA: 0, legB: 0, armA: 0, armB: 0, cloth: -1 },
    { bob: 0, legA: -2, legB: 2, armA: 1, armB: -1, cloth: 0 }
  ],
  sneakIdle: [
    { bob: 0, armA: 3, armB: 4, cloth: -1, lean: 2, sneak: 14 },
    { bob: 0, armA: 4, armB: 3, cloth: 0, lean: 2, sneak: 14 },
    { bob: 1, armA: 4, armB: 2, cloth: 1, lean: 3, sneak: 15 },
    { bob: 0, armA: 4, armB: 3, cloth: 0, lean: 2, sneak: 14 }
  ],
  sneak: [
    { bob: 0, legA: -2, legB: 2, armA: 3, armB: 4, cloth: -1, lean: 2, sneak: 14 },
    { bob: 0, legA: -1, legB: 1, armA: 4, armB: 3, cloth: 0, lean: 2, sneak: 14 },
    { bob: 1, legA: 0, legB: 0, armA: 4, armB: 2, cloth: 1, lean: 3, sneak: 15 },
    { bob: 0, legA: 1, legB: -1, armA: 3, armB: 3, cloth: 1, lean: 2, sneak: 14 },
    { bob: 0, legA: 2, legB: -2, armA: 2, armB: 4, cloth: 0, lean: 2, sneak: 14 },
    { bob: 0, legA: 1, legB: -1, armA: 3, armB: 3, cloth: -1, lean: 2, sneak: 14 },
    { bob: 1, legA: 0, legB: 0, armA: 4, armB: 2, cloth: -1, lean: 3, sneak: 15 },
    { bob: 0, legA: -1, legB: 1, armA: 4, armB: 3, cloth: 0, lean: 2, sneak: 14 }
  ],
  attack: [
    { bob: 0, attack: 0, lean: -1 },
    { bob: 0, attack: 2, lean: -1 },
    { bob: 0, attack: 7, lean: 1 },
    { bob: 1, attack: 11, lean: 2 },
    { bob: 0, attack: 6, lean: 1 },
    { bob: 0, attack: 0, lean: 0 }
  ],
  hit: [
    { bob: 0, hit: 1, lean: -2 },
    { bob: 1, hit: 1, lean: 2 },
    { bob: 0, hit: 0, lean: 1 },
    { bob: 0, hit: 0, lean: 0 }
  ],
  interact: [
    { bob: 0, reach: 0, lean: 0 },
    { bob: 1, reach: 2, lean: 1 },
    { bob: 2, reach: 5, lean: 2 },
    { bob: 2, reach: 7, lean: 2 },
    { bob: 1, reach: 3, lean: 1 },
    { bob: 0, reach: 0, lean: 0 }
  ],
  workPump: [
    { bob: 0, work: 'pump', workPhase: 0, lean: 1 },
    { bob: 0, work: 'pump', workPhase: 1, lean: 1 },
    { bob: 1, work: 'pump', workPhase: 2, lean: 2 },
    { bob: 1, work: 'pump', workPhase: 3, lean: 2 },
    { bob: 1, work: 'pump', workPhase: 4, lean: 2 },
    { bob: 0, work: 'pump', workPhase: 5, lean: 1 },
    { bob: 0, work: 'pump', workPhase: 6, lean: 0 },
    { bob: 0, work: 'pump', workPhase: 7, lean: 0 }
  ],
  workMark: [
    { bob: 0, work: 'mark', workPhase: 0, lean: 2 },
    { bob: 0, work: 'mark', workPhase: 1, lean: 3 },
    { bob: 1, work: 'mark', workPhase: 2, lean: 3 },
    { bob: 1, work: 'mark', workPhase: 3, lean: 3 },
    { bob: 0, work: 'mark', workPhase: 4, lean: 2 },
    { bob: 0, work: 'mark', workPhase: 5, lean: 1 }
  ],
  workLift: [
    { bob: 0, work: 'lift', workPhase: 0, sneak: 8, lean: 2, liftHeight: 0 },
    { bob: 0, work: 'lift', workPhase: 1, sneak: 10, lean: 3, liftHeight: 0 },
    { bob: 1, work: 'lift', workPhase: 2, sneak: 8, lean: 2, liftHeight: 2 },
    { bob: 1, work: 'lift', workPhase: 3, sneak: 4, lean: 1, liftHeight: 5 },
    { bob: 0, work: 'lift', workPhase: 4, sneak: 1, lean: 0, liftHeight: 7 },
    { bob: 0, work: 'lift', workPhase: 5, sneak: 1, lean: 0, liftHeight: 7 },
    { bob: 1, work: 'lift', workPhase: 6, sneak: 4, lean: 1, liftHeight: 4 },
    { bob: 0, work: 'lift', workPhase: 7, sneak: 7, lean: 2, liftHeight: 1 }
  ],
  workKneel: [
    { bob: 0, work: 'kneel', workPhase: 0, kneel: 1, sneak: 10, lean: 2 },
    { bob: 0, work: 'kneel', workPhase: 1, kneel: 1, sneak: 12, lean: 3 },
    { bob: 1, work: 'kneel', workPhase: 2, kneel: 1, sneak: 13, lean: 4 },
    { bob: 1, work: 'kneel', workPhase: 3, kneel: 1, sneak: 13, lean: 4 },
    { bob: 0, work: 'kneel', workPhase: 4, kneel: 1, sneak: 12, lean: 3 },
    { bob: 0, work: 'kneel', workPhase: 5, kneel: 1, sneak: 10, lean: 2 }
  ]
};

export const SPRITE_POSE_FRAME_COUNTS = Object.freeze(
  Object.fromEntries(Object.entries(POSES).map(([state, poses]) => [state, poses.length]))
);

export function createCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = toNativePixels(w);
  canvas.height = toNativePixels(h);
  const ctx = getSoftwareCanvasContext2D(canvas);
  if (typeof ctx.setTransform === 'function') {
    ctx.setTransform(NATIVE_SCALE, 0, 0, NATIVE_SCALE, 0, 0);
  }
  return { canvas, ctx };
}

export function px(ctx, x, y, color, w = 1, h = 1) {
  if (!color) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

// One physical backing-store pixel expressed on the logical design grid. Use
// this only for deliberate high-resolution accents; legacy silhouette pixels
// continue through px() so their proven proportions stay stable.
export function detailPx(ctx, x, y, color, w = NATIVE_PIXEL, h = NATIVE_PIXEL) {
  if (!color) return;
  ctx.fillStyle = color;
  ctx.fillRect(
    snapToNativePixel(x),
    snapToNativePixel(y),
    Math.max(NATIVE_PIXEL, snapToNativePixel(w)),
    Math.max(NATIVE_PIXEL, snapToNativePixel(h))
  );
}

// A one-backing-pixel hard line on the logical grid. Sampling at half-cell
// intervals keeps diagonals continuous after the actor canvas' 2x transform
// without introducing browser antialiasing.
export function detailLinePx(ctx, x0, y0, x1, y1, color, size = NATIVE_PIXEL) {
  if (!color) return;
  const span = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  const steps = Math.max(1, Math.ceil(span / NATIVE_PIXEL));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    detailPx(
      ctx,
      x0 + (x1 - x0) * t,
      y0 + (y1 - y0) * t,
      color,
      size,
      size
    );
  }
}

export function makeLazyFrameList(length, factory) {
  const frames = new Array(length);
  for (let index = 0; index < length; index += 1) {
    Object.defineProperty(frames, index, {
      configurable: true,
      enumerable: true,
      get() {
        const frame = factory(index);
        Object.defineProperty(frames, index, {
          configurable: false,
          enumerable: true,
          value: frame,
          writable: false
        });
        return frame;
      }
    });
  }
  return frames;
}

export function linePx(ctx, x0, y0, x1, y1, color, size = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    px(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, color, size, size);
  }
}

export function dither(ctx, x, y, w, h, color, phase = 0) {
  for (let yy = 0; yy < h; yy += 2) {
    for (let xx = ((yy / 2 + phase) & 1) * 2; xx < w; xx += 4) {
      px(ctx, x + xx, y + yy, color);
    }
  }
}

export function ramp(style, name) {
  return {
    hi: style[`${name}Hi`],
    mid: style[name],
    lo: style[`${name}Lo`],
    dk: style[`${name}Dk`] ?? style[`${name}Lo`]
  };
}

export function taperedSpan(ctx, cx, y, topW, bottomW, h, colors, lean = 0, phase = 0) {
  for (let row = 0; row < h; row += 1) {
    const t = h <= 1 ? 0 : row / (h - 1);
    const w = Math.max(2, Math.round(topW + (bottomW - topW) * t));
    const x = Math.round(cx - w / 2 + lean * t);
    px(ctx, x, y + row, colors.mid, w, 1);
    px(ctx, x, y + row, colors.hi);
    px(ctx, x + w - 1, y + row, colors.lo);
    if (((row + phase) & 3) === 0 && w > 5) px(ctx, x + Math.floor(w * 0.55), y + row, colors.dk);
  }
  px(ctx, cx - Math.floor(bottomW / 2) + lean, y + h - 1, colors.dk, bottomW, 1);
}

export function drawJointedLimb(ctx, points, colors, size = 2, far = false) {
  const c = far ? { ...colors, mid: colors.lo, hi: colors.mid } : colors;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    linePx(ctx, a.x, a.y, b.x, b.y, c.dk, size + 1);
    linePx(ctx, a.x, a.y, b.x, b.y, c.mid, size);
    linePx(ctx, a.x, a.y, b.x, b.y, c.hi, 1);
    detailLinePx(ctx, a.x - 0.5, a.y - 0.5, b.x - 0.5, b.y - 0.5, c.hi);
    if (!far) detailPx(ctx, b.x + 0.5, b.y - 0.5, c.lo);
  }
}

export function drawBoot(ctx, x, y, side, style, far = false) {
  const toe = side >= 0 ? 1 : -3;
  if (style.bareFeet) {
    const skin = ramp(style, 'skin');
    const mid = far ? skin.lo : skin.mid;
    px(ctx, x - 2, y + 1, mid, 5, 2);
    px(ctx, x - 1 + toe, y + 2, mid, 5, 1);
    px(ctx, x - 1, y + 1, skin.hi, 2, 1);
    px(ctx, x + 3 + (toe > 0 ? 1 : -2), y + 2, skin.dk, 1, 1);
    detailLinePx(ctx, x - 1.5, y + 1.5, x + toe + 2.5, y + 1.5, skin.hi);
    detailPx(ctx, x + toe + 3.5, y + 2.5, skin.dk);
    return;
  }
  const main = far ? style.bootLo : style.boot;
  px(ctx, x - 2, y, style.bootLo, 8, 3);
  px(ctx, x - 1 + toe, y + 2, style.bootLo, 8, 2);
  px(ctx, x - 1, y, main, 7, 2);
  px(ctx, x, y, style.bootHi, 4, 1);
  detailLinePx(ctx, x - 0.5, y + 0.5, x + toe + 3.5, y + 0.5, style.bootHi);
  detailLinePx(ctx, x + toe + 0.5, y + 2.5, x + toe + 4.5, y + 2.5, style.bootLo);
}

function drawHeldWeapon(ctx, hand, direction, style, sideView) {
  const dir = direction >= 0 ? 1 : -1;
  const profile = style.weaponProfile ?? 'knife';
  const sidearms = new Set(['sidearm', 'accelerator-sidearm']);
  const longGuns = new Set([
    'smg', 'carbine', 'rifle', 'shotgun', 'support-gun', 'precision-rifle',
    'accelerator-rifle', 'rail-rifle'
  ]);
  if (sidearms.has(profile)) {
    const muzzleX = hand.x + dir * 11;
    const y = hand.y - (sideView ? 1 : 2);
    linePx(ctx, hand.x + dir, y, muzzleX, y - 1, PALETTE.outline, 3);
    linePx(ctx, hand.x + dir * 2, y - 1, muzzleX, y - 1, style.weapon, 1);
    linePx(ctx, hand.x + dir * 3, y, hand.x + dir * 2, y + 5, PALETTE.rustDark, 2);
    if (profile === 'accelerator-sidearm') {
      for (let offset = 4; offset <= 8; offset += 2) px(ctx, hand.x + dir * offset, y - 2, PALETTE.hostGold, 1, 2);
    }
    detailLinePx(ctx, hand.x + dir * 2.5, y - 1.5, muzzleX - dir * 0.5, y - 1.5, PALETTE.hostBone);
    return;
  }
  if (longGuns.has(profile)) {
    const rearX = hand.x - dir * 7;
    const frontX = hand.x + dir * 16;
    const y = hand.y - 2;
    linePx(ctx, rearX, y + 2, frontX, y - 2, PALETTE.outline, profile === 'support-gun' ? 4 : 3);
    linePx(ctx, rearX + dir, y + 1, frontX - dir, y - 2, style.weapon, 1);
    linePx(ctx, hand.x + dir * 4, y - 1, frontX + dir * 3, y - 3, PALETTE.stoneLight, 1);
    linePx(ctx, rearX, y + 2, rearX + dir * 5, y + 5, PALETTE.woodDark, 3);
    linePx(ctx, hand.x + dir, y, hand.x + dir * 2, y + 5, PALETTE.rustDark, 2);
    if (profile === 'precision-rifle') px(ctx, hand.x + dir * 4, y - 5, PALETTE.stoneLight, 7, 2);
    if (profile === 'accelerator-rifle' || profile === 'rail-rifle') {
      for (let offset = 3; offset <= 10; offset += 3) px(ctx, hand.x + dir * offset, y - 2, PALETTE.hostGold, 1, 2);
    }
    detailLinePx(ctx, rearX + dir * 1.5, y + 0.5, frontX - dir * 1.5, y - 2.5, PALETTE.hostBone);
    return;
  }

  const long = profile === 'pike';
  const reach = long ? 21 : profile === 'sword' ? 14 : 10;
  const tipX = hand.x + dir * reach;
  const tipY = hand.y - (long ? 10 : 8);
  linePx(ctx, hand.x - dir * (long ? 9 : 2), hand.y + (long ? 5 : 3), tipX, tipY, PALETTE.outline, long ? 3 : 2);
  linePx(ctx, hand.x - dir * (long ? 8 : 1), hand.y + (long ? 4 : 2), tipX - dir, tipY + 1, profile === 'knife' || profile === 'sword' ? style.weapon : PALETTE.woodLight, 1);
  if (profile === 'axe') {
    px(ctx, tipX - (dir > 0 ? 2 : 5), tipY - 3, PALETTE.stoneLight, 7, 5);
  } else if (profile === 'blunt') {
    px(ctx, tipX - 3, tipY - 3, PALETTE.stoneMid, 7, 6);
  } else if (profile === 'tool-weapon') {
    linePx(ctx, tipX - dir * 4, tipY - 2, tipX + dir * 3, tipY + 2, PALETTE.stoneLight, 2);
  } else if (long) {
    linePx(ctx, tipX - dir * 2, tipY + 1, tipX + dir * 4, tipY - 3, PALETTE.stoneLight, 2);
  }
  detailLinePx(ctx, hand.x + dir * 0.5, hand.y + 1.5, tipX - dir * 0.5, tipY + 0.5, PALETTE.hostBone);
}

export function viewScale(meta) {
  if (meta.view === 'side') return 0.68;
  if (meta.view === 'three') return 0.88;
  return 1;
}

export function directionSide(meta) {
  return meta.side || 1;
}

const HUMAN_FACE_SHAPES = Object.freeze({
  narrow: Object.freeze({ frontTop: 5, frontBottom: 6, sideTop: 4, sideBottom: 5, height: 8 }),
  oval: Object.freeze({ frontTop: 6, frontBottom: 7, sideTop: 5, sideBottom: 6, height: 8 }),
  broad: Object.freeze({ frontTop: 7, frontBottom: 8, sideTop: 6, sideBottom: 7, height: 8 }),
  long: Object.freeze({ frontTop: 6, frontBottom: 6, sideTop: 5, sideBottom: 6, height: 9 })
});

function drawBackHair(ctx, x, y, hit, style, hairStyle, crown, crownHi) {
  const skin = ramp(style, 'skin');
  if (hairStyle === 'hooded') {
    px(ctx, x - 4 + hit, y - 2, crown, 9, 3);
    px(ctx, x - 5 + hit, y, crown, 10, 7);
    px(ctx, x - 3 + hit, y - 2, crownHi, 4, 1);
    return;
  }
  if (hairStyle === 'shaved') {
    px(ctx, x - 2 + hit, y - 1, crown, 5, 1);
    px(ctx, x - 1 + hit, y - 1, crownHi, 2, 1);
    return;
  }
  if (hairStyle === 'tonsure') {
    px(ctx, x - 3 + hit, y - 1, crown, 7, 2);
    px(ctx, x - 2 + hit, y, skin.mid, 5, 3);
    px(ctx, x - 3 + hit, y + 2, crown, 2, 4);
    px(ctx, x + 2 + hit, y + 2, crown, 2, 4);
    px(ctx, x - 2 + hit, y + 5, crown, 5, 1);
    return;
  }

  px(ctx, x - 3 + hit, y - 1, crown, 7, 2);
  px(ctx, x - 2 + hit, y - 1, crownHi, 3, 1);
  if (hairStyle === 'bobbed') {
    px(ctx, x - 4 + hit, y + 1, crown, 9, 6);
    px(ctx, x - 3 + hit, y + 7, crown, 7, 1);
    return;
  }
  if (hairStyle === 'loose') {
    px(ctx, x - 4 + hit, y + 1, crown, 9, 7);
    px(ctx, x - 3 + hit, y + 8, crown, 7, 2);
    return;
  }

  px(ctx, x - 3 + hit, y + 1, crown, 7, 5);
  if (hairStyle === 'tied') {
    px(ctx, x - 2 + hit, y + 5, crown, 5, 2);
    px(ctx, x - 1 + hit, y + 7, crown, 3, 4);
    px(ctx, x + hit, y + 10, crownHi, 1, 1);
  }
  if (hairStyle === 'braid') {
    px(ctx, x - 2 + hit, y + 5, crown, 5, 2);
    px(ctx, x - 1 + hit, y + 7, crown, 3, 2);
    px(ctx, x + hit, y + 9, crownHi, 2, 2);
    px(ctx, x - 1 + hit, y + 11, crown, 2, 2);
  }
}

function drawHumanHair(ctx, x, y, meta, hit, style, crown, crownHi) {
  const hairStyle = style.bareHead ? (style.hairStyle ?? 'cropped') : 'hooded';
  const side = directionSide(meta);
  const skin = ramp(style, 'skin');

  if (meta.back && meta.view !== 'side') {
    drawBackHair(ctx, x, y, hit, style, hairStyle, crown, crownHi);
    return;
  }

  if (meta.view === 'side') {
    if (hairStyle === 'shaved') {
      px(ctx, x - 2 + hit, y - 1, crown, 5, 1);
      px(ctx, x - 1 + hit, y - 1, crownHi, 2, 1);
      return;
    }
    if (hairStyle === 'tonsure') {
      const backX = x + (side > 0 ? -3 : 1) + hit;
      px(ctx, x - 1 + hit, y - 1, skin.mid, 3, 2);
      px(ctx, backX, y, crown, 2, 5);
      px(ctx, backX + (side > 0 ? 0 : -1), y + 4, crownHi, 2, 1);
      return;
    }
    if (hairStyle === 'hooded') {
      px(ctx, x - 4 + hit, y - 2, crown, 8, 2);
      px(ctx, x - 5 + hit, y, crown, 4, 6);
      px(ctx, x + (side > 0 ? 2 : -5) + hit, y + 1, crown, 4, 5);
      px(ctx, x - 3 + hit, y - 2, crownHi, 4, 1);
      return;
    }

    const backX = x + (side > 0 ? -4 : 1) + hit;
    px(ctx, x - 2 + hit, y - 1, crown, 5, 1);
    px(ctx, x - 3 + hit, y, crown, 6, 1);
    px(ctx, x - 1 + hit, y - 1, crownHi, 2, 1);
    if (hairStyle === 'bobbed') {
      px(ctx, backX, y + 1, crown, 3, 7);
      px(ctx, backX + (side > 0 ? 1 : -1), y + 7, crownHi, 2, 1);
      return;
    }
    if (hairStyle === 'loose') {
      px(ctx, backX, y + 1, crown, 3, 9);
      px(ctx, backX + (side > 0 ? 0 : -1), y + 8, crownHi, 2, 1);
      return;
    }
    if (hairStyle === 'tied') {
      px(ctx, backX, y + 2, crown, 3, 3);
      px(ctx, backX + (side > 0 ? 0 : 1), y + 5, crown, 2, 4);
      return;
    }
    if (hairStyle === 'braid') {
      px(ctx, backX, y + 2, crown, 3, 2);
      px(ctx, backX + 1, y + 4, crown, 2, 2);
      px(ctx, backX, y + 6, crownHi, 2, 2);
      px(ctx, backX + 1, y + 8, crown, 2, 3);
      return;
    }
    px(ctx, backX + 1, y + 1, crown, 2, 4);
    return;
  }

  if (hairStyle === 'shaved') {
    px(ctx, x - 2 + hit, y - 1, crown, 5, 1);
    px(ctx, x - 1 + hit, y - 1, crownHi, 2, 1);
    return;
  }
  if (hairStyle === 'tonsure') {
    px(ctx, x - 3 + hit, y - 1, crown, 7, 2);
    px(ctx, x - 2 + hit, y - 1, skin.mid, 5, 2);
    px(ctx, x - 4 + hit, y + 1, crown, 2, 4);
    px(ctx, x + 3 + hit, y + 1, crown, 1, 4);
    return;
  }
  if (hairStyle === 'hooded') {
    px(ctx, x - 4 + hit, y - 2, crown, 9, 2);
    px(ctx, x - 5 + hit, y, crown, 10, 2);
    px(ctx, x - 5 + hit, y + 1, crown, 2, 6);
    px(ctx, x + 3 + hit, y + 1, crown, 2, 6);
    px(ctx, x - 3 + hit, y - 2, crownHi, 4, 1);
    return;
  }

  px(ctx, x - 2 + hit, y - 1, crown, 5, 1);
  px(ctx, x - 3 + hit, y, crown, 7, 1);
  px(ctx, x - 1 + hit, y - 1, crownHi, 2, 1);
  if (hairStyle === 'bobbed') {
    px(ctx, x - 4 + hit, y + 1, crown, 2, 6);
    px(ctx, x + 3 + hit, y + 1, crown, 2, 6);
    px(ctx, x - 3 + hit, y + 6, crown, 2, 1);
    px(ctx, x + 2 + hit, y + 6, crownHi, 2, 1);
    return;
  }
  if (hairStyle === 'loose') {
    px(ctx, x - 4 + hit, y + 1, crown, 2, 7);
    px(ctx, x + 3 + hit, y + 1, crown, 2, 7);
    px(ctx, x - 3 + hit, y + 7, crown, 7, 2);
    return;
  }
  if ((hairStyle === 'tied' || hairStyle === 'braid') && meta.view === 'three') {
    const backX = x + (side > 0 ? -5 : 4) + hit;
    px(ctx, backX, y + 3, crown, 2, 3);
    if (hairStyle === 'braid') {
      px(ctx, backX + (side > 0 ? 0 : -1), y + 6, crownHi, 2, 2);
      px(ctx, backX, y + 8, crown, 1, 3);
    }
  }
  px(ctx, x - 4 + hit, y + 1, crown, 2, 4);
  px(ctx, x + 3 + hit, y + 1, crown, 1, 4);
}

function drawHoodHairWindow(ctx, x, y, meta, hit, style) {
  const hairStyle = style.hairStyle ?? 'cropped';
  if (hairStyle === 'hooded') return;
  const side = directionSide(meta);
  const skin = ramp(style, 'skin');
  if (meta.back) {
    if (hairStyle === 'bobbed' || hairStyle === 'loose') {
      const h = hairStyle === 'loose' ? 5 : 3;
      px(ctx, x - 3 + hit, y + 6, style.hair, 7, h);
    }
    if (hairStyle === 'tied') {
      px(ctx, x - 1 + hit, y + 6, style.hair, 3, 5);
      px(ctx, x + hit, y + 10, style.hairHi ?? style.hair, 1, 1);
    }
    if (hairStyle === 'braid') {
      px(ctx, x - 1 + hit, y + 6, style.hair, 3, 2);
      px(ctx, x + hit, y + 8, style.hairHi ?? style.hair, 2, 2);
      px(ctx, x - 1 + hit, y + 10, style.hair, 2, 3);
    }
    return;
  }
  if (hairStyle === 'shaved') {
    px(ctx, x - 2 + hit, y - 1, skin.mid, 5, 2);
    px(ctx, x - 1 + hit, y - 1, skin.hi, 2, 1);
    return;
  }
  if (hairStyle === 'tonsure') {
    px(ctx, x - 2 + hit, y - 1, skin.mid, 5, 2);
    px(ctx, x - 3 + hit, y + 1, style.hair, 2, 3);
    px(ctx, x + 2 + hit, y + 1, style.hair, 2, 3);
    return;
  }
  px(ctx, x - 2 + hit, y - 1, style.hair, 5, 3);
  px(ctx, x - 1 + hit, y - 1, style.hairHi ?? style.hair, 2, 1);
  if (hairStyle === 'bobbed' || hairStyle === 'loose') {
    const h = hairStyle === 'loose' ? 6 : 4;
    px(ctx, x - 4 + hit, y + 3, style.hair, 1, h);
    px(ctx, x + 3 + hit, y + 3, style.hair, 1, h + (side > 0 ? 1 : 0));
  }
  if ((hairStyle === 'tied' || hairStyle === 'braid') && meta.view !== 'front') {
    const backX = x + (side > 0 ? -5 : 4) + hit;
    px(ctx, backX, y + 3, style.hair, 2, hairStyle === 'braid' ? 5 : 3);
    if (hairStyle === 'braid') px(ctx, backX + (side > 0 ? 0 : -1), y + 8, style.hairHi ?? style.hair, 2, 2);
  }
}

function drawHumanFaceDetails(ctx, x, y, meta, hit, style) {
  if (meta.back) return;
  const skin = ramp(style, 'skin');
  const side = directionSide(meta);
  if (style.age === 'fresh') {
    if (meta.view === 'side') {
      px(ctx, x + (side > 0 ? 1 : -1) + hit, y + 5, skin.hi, 1, 1);
    } else {
      px(ctx, x + 2 + hit, y + 5, skin.hi, 1, 1);
      px(ctx, x - 1 + hit, y + 6, skin.mid, 2, 1);
    }
  } else if (style.age === 'weathered' || style.age === 'elder') {
    if (meta.view === 'side') {
      px(ctx, x + (side > 0 ? 1 : -2) + hit, y + 5, skin.dk, 2, 1);
    } else {
      px(ctx, x + 2 + hit, y + 5, skin.dk, 2, 1);
      if (style.age === 'elder') px(ctx, x + 2 + hit, y + 6, skin.lo, 1, 1);
    }
  }
  if (style.age === 'elder' && style.hairStyle !== 'hooded') {
    px(ctx, x - 2 + hit, y, PALETTE.stoneDust, 1, 2);
  }

  if (!style.faceMark || style.faceMark === 'none') return;
  if (meta.view === 'side') {
    const nearX = x + (side > 0 ? 2 : -3) + hit;
    if (style.faceMark === 'eye-patch') {
      px(ctx, nearX, y + 3, PALETTE.clothDark, 2, 2);
      linePx(ctx, nearX - side * 2, y + 2, nearX + side * 2, y + 4, PALETTE.stoneDark);
    } else if (style.faceMark === 'burn-scar') {
      px(ctx, nearX, y + 4, PALETTE.rustDark, 2, 2);
      px(ctx, nearX - side, y + 6, skin.dk, 1, 1);
    } else if (style.faceMark === 'cheek-scar') {
      px(ctx, nearX, y + 4, PALETTE.rustLight, 1, 1);
      px(ctx, nearX - side, y + 5, skin.dk, 1, 1);
    } else if (style.faceMark === 'split-brow') {
      px(ctx, nearX, y + 2, PALETTE.rustLight, 1, 1);
      px(ctx, nearX - side, y + 3, skin.dk, 1, 1);
    }
    return;
  }
  if (style.faceMark === 'eye-patch') {
    px(ctx, x - 3 + hit, y + 3, PALETTE.clothDark, 3, 2);
    linePx(ctx, x - 4 + hit, y + 2, x + 2 + hit, y + 4, PALETTE.stoneDark);
  } else if (style.faceMark === 'burn-scar') {
    px(ctx, x - 3 + hit, y + 3, PALETTE.rustDark, 2, 3);
    px(ctx, x - 1 + hit, y + 5, skin.dk, 1, 1);
  } else if (style.faceMark === 'cheek-scar') {
    px(ctx, x - 2 + hit, y + 4, PALETTE.rustLight, 1, 1);
    px(ctx, x - 1 + hit, y + 5, skin.dk, 1, 1);
    px(ctx, x + hit, y + 6, PALETTE.rustDark, 1, 1);
  } else if (style.faceMark === 'split-brow') {
    px(ctx, x - 2 + hit, y + 2, PALETTE.rustLight, 1, 1);
    px(ctx, x - 1 + hit, y + 3, skin.dk, 1, 1);
  }
}

function drawFacialHair(ctx, x, y, meta, hit, style) {
  // Facial hair stays visible with the hood up because the cowl frames the jaw.
  if (meta.back || !style.facialHair || style.facialHair === 'none') return;
  const hair = style.hair;
  const hairHi = style.hairHi ?? hair;
  const side = directionSide(meta);
  if (meta.view === 'side') {
    const jawX = x + (side > 0 ? 1 : -3) + hit;
    if (style.facialHair === 'moustache') {
      px(ctx, jawX + side, y + 5, hair, 3, 1);
      px(ctx, jawX + side, y + 5, hairHi, 1, 1);
    } else if (style.facialHair === 'goatee') {
      px(ctx, jawX + side, y + 6, hair, 2, 3);
      px(ctx, jawX + side, y + 8, hairHi, 1, 1);
    } else if (style.facialHair === 'short-beard') {
      px(ctx, jawX, y + 5, hair, 4, 2);
      px(ctx, jawX + side, y + 7, hair, 3, 1);
      px(ctx, jawX, y + 5, hairHi, 1, 1);
    } else if (style.facialHair === 'beard') {
      px(ctx, jawX, y + 5, hair, 4, 2);
      px(ctx, jawX + side, y + 7, hair, 3, 2);
      px(ctx, jawX, y + 5, hairHi, 1, 1);
    } else {
      px(ctx, jawX, y + 5, hair, 3, 1);
    }
    return;
  }
  if (style.facialHair === 'moustache') {
    px(ctx, x - 2 + hit, y + 5, hair, 5, 1);
    px(ctx, x - 1 + hit, y + 5, hairHi, 1, 1);
    return;
  }
  if (style.facialHair === 'goatee') {
    px(ctx, x - 1 + hit, y + 6, hair, 3, 3);
    px(ctx, x + hit, y + 8, hairHi, 1, 1);
    return;
  }
  if (style.facialHair === 'short-beard') {
    px(ctx, x - 3 + hit, y + 5, hair, 7, 2);
    px(ctx, x - 2 + hit, y + 7, hair, 5, 1);
    px(ctx, x - 2 + hit, y + 5, hairHi, 2, 1);
    return;
  }
  if (style.facialHair === 'beard') {
    px(ctx, x - 3 + hit, y + 5, hair, 7, 2);
    px(ctx, x - 2 + hit, y + 7, hair, 5, 2);
    px(ctx, x - 2 + hit, y + 5, hairHi, 2, 1);
    return;
  }
  px(ctx, x - 3 + hit, y + 5, hair, 7, 1);
}

export function drawSmallHead(ctx, x, y, meta, pose, style) {
  if (typeof style.drawHead === 'function') {
    style.drawHead({ ctx, px, linePx, detailPx, detailLinePx, meta, pose, style, x, y });
    return;
  }

  const skin = ramp(style, 'skin');
  const side = directionSide(meta);
  const hit = pose.hit ? side : 0;
  const hood = style.hood ?? style.hair;
  const hoodHi = style.hoodHi ?? style.hairHi;
  const faceShape = HUMAN_FACE_SHAPES[style.faceShape] ?? HUMAN_FACE_SHAPES.oval;

  if (style.hostHead) {
    const cx = x + hit + (meta.view === 'side' ? side : 0);
    const yaw = meta.back ? 0 : Math.round(side * (meta.view === 'three' ? 1 : meta.view === 'side' ? 2 : 0));
    const pulse = pose.bob ? 1 : 0;
    // Stretched agony mask. The uneven jaw and broken horn stop the head from
    // reading as a neat skull icon at gameplay scale.
    for (let row = 0; row < 14; row += 1) {
      const taper = row < 2 ? 2 : row > 10 ? 1 : 0;
      const w = 11 - taper - (row > 12 ? 2 : 0);
      const ox = Math.round(yaw * row / 12) - Math.floor(w / 2);
      px(ctx, cx + ox - 1, y - 2 + row, PALETTE.hostBlack, w + 2, 1);
      px(ctx, cx + ox, y - 2 + row, row > 9 ? PALETTE.hostGold : PALETTE.hostBone, w, 1);
    }
    px(ctx, cx - 5 + yaw, y - 1, PALETTE.void, 2, 3); // broken temple
    px(ctx, cx + 3 + yaw, y + 7, PALETTE.hostBlack, 3, 5); // sagging jaw shadow
    px(ctx, cx - 1 + yaw, y, PALETTE.hostBlack, 1, 6); // split brow
    // One eye is a hollow wound, the other a gold pin under bone.
    px(ctx, cx - 4 + yaw, y + 3, PALETTE.void, 3, 4);
    px(ctx, cx + 2 + yaw, y + 4, PALETTE.void, 2, 2);
    px(ctx, cx + 3 + yaw, y + 4, pulse ? PALETTE.hostGlow : PALETTE.hostGold);
    px(ctx, cx, y - 2, PALETTE.void, 1, 1);
    px(ctx, cx, y - 2, pulse ? PALETTE.flash : PALETTE.hostGlow, 1, 1);
    // Vertical screaming mouth, offset so the face feels pulled open.
    px(ctx, cx - 4 + yaw, y + 8, PALETTE.void, 9, 4);
    for (let t = 0; t < 6; t += 1) px(ctx, cx - 4 + yaw + t * 2, y + 8, PALETTE.hostBone, 1, 4);
    px(ctx, cx - 3 + yaw, y + 7, PALETTE.hostGold, 1, 7);
    px(ctx, cx + 4 + yaw, y + 7, PALETTE.hostGold, 1, 5);
    // One horn is intact; the other is just a broken stump.
    px(ctx, cx - 6 + yaw, y - 5, PALETTE.hostBone, 2, 5);
    px(ctx, cx + 5 + yaw, y - 3, PALETTE.hostBone, 1, 3);
    px(ctx, cx + 6 + yaw, y - 4, PALETTE.hostBlack, 1, 1);
    detailLinePx(ctx, cx - 3.5 + yaw, y - 0.5, cx + 1.5 + yaw, y + 5.5, PALETTE.stoneDust);
    detailPx(ctx, cx + 3.5 + yaw, y + 3.5, pulse ? PALETTE.hostGlow : PALETTE.hostGold);
    detailLinePx(ctx, cx - 2.5 + yaw, y + 8.5, cx + 3.5 + yaw, y + 8.5, PALETTE.hostBone);
    return;
  }

  if (style.maskedHead) {
    const cx = x + hit;
    const cowl = { hi: hoodHi, mid: hood, lo: PALETTE.void, dk: PALETTE.void };
    taperedSpan(ctx, cx, y - 1, 7, 6, 9, cowl, side * 0.2);
    px(ctx, cx - 3, y + 3, PALETTE.void, 6, 2);
    px(ctx, cx - 2, y + 4, PALETTE.rustDark, 4, 1);
    px(ctx, cx + side * 3, y + 3, skin.lo, 1, 3);
    detailLinePx(ctx, cx - 2.5, y + 2.5, cx + 2.5, y + 2.5, hoodHi);
    detailPx(ctx, cx + side * 2.5, y + 4.5, PALETTE.rustLight);
    return;
  }

  // With a hood equipped the crown reads as smoke-dark cloth; bare-headed it is
  // hair. Only the player uses this branch (enemies are masked/host heads), so
  // the bareHead path never touches enemy sprites.
  const bare = Boolean(style.bareHead);
  const hairStyle = bare ? (style.hairStyle ?? 'cropped') : 'hooded';
  const crown = bare && hairStyle !== 'hooded' ? style.hair : hood;
  const crownHi = bare && hairStyle !== 'hooded' ? (style.hairHi ?? style.hair) : hoodHi;

  if (meta.view === 'side') {
    taperedSpan(ctx, x + hit, y, faceShape.sideTop, faceShape.sideBottom, faceShape.height, skin, side * 0.3);
    drawHumanHair(ctx, x, y, meta, hit, { ...style, hairStyle, bareHead: bare }, crown, crownHi);
    px(ctx, x + (side > 0 ? 4 : -1) + hit, y + 4, skin.mid, 2, 2);
    px(ctx, x + (side > 0 ? 2 : 3) + hit, y + 4, skin.dk, 2, 1);
    if (bare) {
      px(ctx, x + hit, y + 2, skin.hi, 2, 1); // lit temple
    } else {
      drawHoodHairWindow(ctx, x, y, meta, hit, style);
    }
    drawHumanFaceDetails(ctx, x, y, meta, hit, style);
    drawFacialHair(ctx, x, y, meta, hit, style);
    if (!meta.back) {
      detailPx(ctx, x + side * 2.5 + hit, y + 3.5, skin.dk);
      detailPx(ctx, x + side * 3.5 + hit, y + 4.5, skin.hi);
      detailLinePx(ctx, x + side * 1.5 + hit, y + 6.5, x + side * 3.5 + hit, y + 6.5, skin.lo);
    } else {
      detailLinePx(ctx, x - 2.5 + hit, y + 0.5, x + 1.5 + hit, y + 0.5, crownHi);
    }
    return;
  }

  taperedSpan(ctx, x + hit, y, faceShape.frontTop, faceShape.frontBottom, faceShape.height, skin);
  drawHumanHair(ctx, x, y, meta, hit, { ...style, hairStyle, bareHead: bare }, crown, crownHi);
  if (meta.back) {
    if (!bare) drawHoodHairWindow(ctx, x, y, meta, hit, style);
    detailLinePx(ctx, x - 2.5 + hit, y + 0.5, x + 2.5 + hit, y + 0.5, crownHi);
    detailPx(ctx, x + 2.5 + hit, y + 4.5, crown);
    return;
  }
  if (bare) {
    // A brighter brow and cheek so the open face reads as skin, not shadow.
    px(ctx, x - 1 + hit, y + 2, skin.hi, 3, 1);
    px(ctx, x - 2 + hit, y + 3, skin.mid, 5, 1);
  } else {
    // The raised cowl keeps a real hair window and leaves the face lit.
    drawHoodHairWindow(ctx, x, y, meta, hit, style);
    px(ctx, x - 1 + hit, y + 2, skin.hi, 2, 1); // lit brow under the hairline
  }
  // The face draws last so no brow or cowl row buries it. It has to survive
  // being blown up 2.4x in the dialogue portrait plate: a browline shadow, a
  // nose hint, and one lit cheekbone turn two dark pixels into a face.
  px(ctx, x - 2 + hit, y + 3, skin.lo, 4, 1); // browline
  px(ctx, x - 2 + hit, y + 4, skin.dk, 2, 1);
  px(ctx, x + 1 + hit, y + 4, skin.dk, 1, 1);
  px(ctx, x + hit, y + 5, skin.lo, 1, 1); // the nose
  px(ctx, x - 2 + hit, y + 5, skin.hi, 1, 1); // lit cheekbone
  px(ctx, x + hit, y + 6, skin.lo, 2, 1);
  drawHumanFaceDetails(ctx, x, y, meta, hit, style);
  drawFacialHair(ctx, x, y, meta, hit, style);
  detailPx(ctx, x - 1.5 + hit, y + 3.5, skin.dk);
  detailPx(ctx, x + 1.5 + hit, y + 3.5, skin.dk);
  detailPx(ctx, x - 2.5 + hit, y + 4.5, skin.hi);
  detailLinePx(ctx, x - 1.5 + hit, y + 6.5, x + 1.5 + hit, y + 6.5, skin.lo);
}

export function drawTorso(ctx, cx, shoulderY, hipY, meta, pose, style) {
  const coat = ramp(style, 'coat');
  const scale = viewScale(meta);
  const side = directionSide(meta);
  const shoulderW = Math.max(7, Math.round(style.shoulders * scale));
  const waistW = Math.max(6, Math.round(style.waist * scale));
  const flare = Math.max(0, Math.round((style.hipFlare ?? 0) * scale));
  const hipW = waistW + flare;
  const lean = (pose.lean ?? 0) * side + Math.round(meta.bodyTurn * 1.2);
  const bodyCx = cx + lean;
  const bodyH = hipY - shoulderY;

  if (flare > 0 && bodyH > 6) {
    // Feminine frames: taper to the waist, then widen again into the hips.
    const flareH = Math.min(6, Math.max(3, Math.floor(bodyH * 0.32)));
    const upperH = bodyH - flareH;
    taperedSpan(ctx, bodyCx, shoulderY, shoulderW, waistW, upperH + 1, coat, lean * 0.16, pose.cloth ?? 0);
    taperedSpan(ctx, bodyCx, shoulderY + upperH, waistW, hipW, flareH, coat, lean * 0.16, pose.cloth ?? 0);
  } else {
    taperedSpan(ctx, bodyCx, shoulderY, shoulderW, waistW, bodyH, coat, lean * 0.16, pose.cloth ?? 0);
  }
  px(ctx, bodyCx - Math.floor(hipW / 2), hipY - 1, style.belt, hipW, 2);

  if (style.coatTail) {
    const tailY = hipY + 1;
    const tailH = style.coatTail;
    const split = meta.view === 'side' ? 0 : 2;
    taperedSpan(ctx, bodyCx - split, tailY, Math.max(4, hipW - 2), Math.max(3, hipW - 5), tailH, coat, -0.35, pose.cloth ?? 0);
    px(ctx, bodyCx, tailY + 2, coat.dk, 1, Math.max(4, tailH - 3));
  }

  px(ctx, bodyCx - Math.floor(shoulderW / 2), shoulderY, coat.hi, Math.max(3, shoulderW - 2), 1);
  px(ctx, bodyCx + Math.floor(shoulderW / 2), shoulderY + 2, coat.dk, 1, bodyH - 3);
  if (!style.anatomyVisible) {
    dither(ctx, bodyCx - Math.floor(shoulderW / 2) + 2, shoulderY + 3, Math.max(4, shoulderW - 4), bodyH - 4, coat.lo, pose.cloth ?? 0);
  }
  const leftShoulder = bodyCx - Math.floor(shoulderW / 2);
  const rightShoulder = bodyCx + Math.floor(shoulderW / 2);
  const leftWaist = bodyCx - Math.floor(waistW / 2);
  const rightWaist = bodyCx + Math.floor(waistW / 2);
  detailLinePx(ctx, leftShoulder + 1.5, shoulderY + 1.5, leftWaist + 1.5, hipY - 2.5, coat.hi);
  detailLinePx(ctx, rightShoulder - 0.5, shoulderY + 2.5, rightWaist - 0.5, hipY - 1.5, coat.dk);
  if (style.belt) {
    detailPx(ctx, bodyCx - 0.5, hipY - 0.5, style.coatHi ?? coat.hi);
    detailPx(ctx, bodyCx + 0.5, hipY - 0.5, style.coatLo ?? coat.lo);
  }
  return { bodyCx, shoulderW, waistW, hipW, lean };
}

function drawVest(ctx, torso, shoulderY, hipY, meta, style) {
  // Equipped body armor was styled but never painted; a vest has to read as a
  // separate layer strapped over the coat from every facing.
  if (!style.vest) return;
  const v = style.vest;
  const side = directionSide(meta);
  const bodyH = hipY - shoulderY;
  const vestTop = shoulderY + 2;
  const vestH = Math.max(4, bodyH - 6);
  const vestW = Math.max(4, (torso.waistW ?? 8) - (meta.view === 'side' ? 2 : 0));
  const vx = torso.bodyCx - Math.floor(vestW / 2) + Math.round(meta.bodyTurn);
  px(ctx, vx, vestTop, v.mid, vestW, vestH);
  px(ctx, vx, vestTop, v.hi, Math.max(2, vestW - 1), 1);
  px(ctx, vx + vestW - 1, vestTop + 1, v.lo, 1, vestH - 1);
  px(ctx, vx, vestTop + vestH - 1, v.lo, vestW, 1);
  if (!meta.back && v.plate) {
    // One stitched-on plate, off centre, so the armor stays field-made.
    const plateX = vx + (side >= 0 ? 1 : vestW - 3);
    px(ctx, plateX, vestTop + 2, v.plate, 2, 3);
    px(ctx, plateX, vestTop + 5, v.lo, 2, 1);
    detailLinePx(ctx, plateX + 0.5, vestTop + 2.5, plateX + 1.5, vestTop + 2.5, v.hi);
  }
  detailLinePx(ctx, vx + 0.5, vestTop + 0.5, vx + vestW - 1.5, vestTop + 0.5, v.hi);
}

function drawKitOverlay(ctx, torso, shoulderY, hipY, meta, style) {
  // Harness strap and trinket sit on top of coat, vest, and bust so the
  // equipped kit stays readable.
  const side = directionSide(meta);
  if (style.fieldHarness && !meta.back) {
    const strapTopX = torso.bodyCx + side * (Math.floor((torso.shoulderW ?? 10) / 2) - 2);
    const strapBotX = torso.bodyCx - side * (Math.floor((torso.waistW ?? 8) / 2) - 1);
    linePx(ctx, strapTopX, shoulderY + 1, strapBotX, hipY - 2, PALETTE.rustDark, 1);
    px(ctx, torso.bodyCx, shoulderY + Math.floor((hipY - shoulderY) / 2), PALETTE.stoneLight, 1, 1);
    detailLinePx(ctx, strapTopX - 0.5, shoulderY + 1.5, strapBotX - 0.5, hipY - 2.5, PALETTE.rustLight);
  }
  if (style.pendant && !meta.back) {
    px(ctx, torso.bodyCx + side, shoulderY + 3, style.pendant, 1, 2);
    detailPx(ctx, torso.bodyCx + side + 0.5, shoulderY + 3.5, PALETTE.hostBone);
  }
}

function bodyFeatureSize(value, fallback = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(10, Math.round(value)));
}

export function drawAdultChest(ctx, torso, shoulderY, meta, pose, style) {
  if (meta.back) return;
  const size = bodyFeatureSize(style.breastSize);
  if (size <= 0) return;
  if (!style.anatomyVisible) {
    // Clothed: the bust still shapes the outer layer. A lit shelf with a
    // shadow row under it, in the colours of whatever sits on top (vest or
    // coat), so the build chosen at creation reads through field kit.
    if (size < 2) return;
    const over = style.vest
      ? { hi: style.vest.hi, mid: style.vest.mid, dk: style.vest.lo }
      : (() => { const coat = ramp(style, 'coat'); return { hi: coat.hi, mid: coat.mid, dk: coat.dk }; })();
    const side = directionSide(meta);
    const chestY = shoulderY + 5 + Math.floor((pose.bob ?? 0) * 0.5);
    if (meta.view === 'side') {
      // In profile the bust pushes the chest line forward past the layer.
      const fx = torso.bodyCx + side * Math.max(2, Math.round((torso.waistW ?? 8) * 0.35));
      const reach = size >= 8 ? 2 : 1;
      px(ctx, fx, chestY, over.hi, 2, 1);
      px(ctx, fx + side, chestY, over.mid, reach, size >= 5 ? 3 : 2);
      px(ctx, fx + side * (reach + 1), chestY + 1, over.dk, 1, size >= 5 ? 2 : 1);
      px(ctx, fx, chestY + (size >= 5 ? 3 : 2), over.dk, 2, 1);
      return;
    }
    // The bust widens the outer layer's silhouette; a silhouette change
    // survives gameplay distance where interior shading disappears.
    const bustW = size >= 8 ? 8 : size >= 5 ? 6 : 4;
    const bulge = size >= 8 ? 2 : size >= 5 ? 1 : 0;
    const rows = size >= 5 ? 3 : 2;
    const bx = torso.bodyCx - Math.floor(bustW / 2);
    if (bulge > 0) {
      px(ctx, bx - bulge, chestY, over.mid, bulge, rows);
      px(ctx, bx - bulge, chestY, over.hi, 1, rows - 1);
      px(ctx, bx + bustW, chestY, over.mid, bulge, rows);
      px(ctx, bx + bustW + bulge - 1, chestY, over.dk, 1, rows);
    }
    px(ctx, bx + 1, chestY, over.hi, bustW - 2, 1);
    px(ctx, bx, chestY + rows - 1, over.dk, bustW, 1);
    if (size >= 5) px(ctx, torso.bodyCx, chestY, over.dk, 1, 2);
    return;
  }
  const skin = ramp(style, 'skin');
  const side = directionSide(meta);
  const chestY = shoulderY + 6 + Math.floor((pose.bob ?? 0) * 0.5);
  const lobeW = size >= 8 ? 4 : size >= 5 ? 3 : size >= 2 ? 2 : 1;
  const lobeH = size >= 8 ? 4 : size >= 5 ? 3 : 2;
  const shadowH = Math.max(1, Math.min(2, lobeH - 1));

  if (meta.view === 'side') {
    const x = torso.bodyCx + side * Math.max(2, Math.round((torso.waistW ?? 8) * 0.32));
    px(ctx, x, chestY, skin.hi, Math.max(1, lobeW - 1), 1);
    px(ctx, x, chestY + 1, skin.mid, lobeW, lobeH - 1);
    px(ctx, x + side * Math.max(1, lobeW - 1), chestY + lobeH - 1, skin.lo, 1, shadowH);
    return;
  }

  const offset = size >= 7 ? 4 : 3;
  const nearExtra = meta.view === 'three' ? 1 : 0;
  const farW = meta.view === 'three' ? Math.max(1, lobeW - 1) : lobeW;
  const nearW = Math.min(4, lobeW + nearExtra);
  const leftX = torso.bodyCx - offset - Math.floor(farW / 2);
  const rightX = torso.bodyCx + offset - Math.floor(nearW / 2);
  px(ctx, leftX, chestY, skin.hi, Math.max(1, farW - 1), 1);
  px(ctx, leftX, chestY + 1, skin.mid, farW, lobeH - 1);
  px(ctx, leftX, chestY + lobeH - 1, skin.lo, farW, shadowH);
  px(ctx, rightX, chestY, skin.hi, Math.max(1, nearW - 1), 1);
  px(ctx, rightX, chestY + 1, skin.mid, nearW, lobeH - 1);
  px(ctx, rightX, chestY + lobeH - 1, skin.lo, nearW, shadowH);
}

export function drawAdultAnatomy(ctx, torso, hipY, meta, pose, style) {
  if (!style.anatomyVisible || meta.back || !style.anatomy) return;
  const skin = ramp(style, 'skin');
  const side = directionSide(meta);
  const bob = pose.bob ?? 0;
  const anatomy = style.anatomy;
  const x = torso.bodyCx + Math.round(meta.bodyTurn * 0.5);
  const y = hipY + 1 + Math.floor(bob * 0.5);
  const penisSize = bodyFeatureSize(style.penisSize, anatomy === 'penis' || anatomy === 'intersex' ? 5 : 0);
  const hasPenis = anatomy === 'penis' || anatomy === 'intersex';

  // Pelvis and groin shading shared by every anatomy.
  const pelvisW = meta.view === 'side' ? 4 : Math.max(4, Math.round((torso.hipW ?? torso.waistW ?? 8) * 0.58));
  const pelvisX = x - Math.floor(pelvisW / 2);
  px(ctx, pelvisX, hipY - 1, skin.mid, pelvisW, 5);
  px(ctx, pelvisX, hipY - 1, skin.hi, Math.max(2, pelvisW - 1), 1);
  px(ctx, pelvisX + pelvisW - 1, hipY, skin.lo, 1, 4);
  px(ctx, pelvisX + 1, hipY + 4, skin.dk, Math.max(2, pelvisW - 2), 1);

  if (anatomy === 'smooth') return;

  if (anatomy === 'vulva') {
    // A shaded mons and a short vertical cleft. Read, not shouted.
    if (meta.view === 'side') {
      px(ctx, x + side, y + 1, skin.lo, 2, 1);
      px(ctx, x + side, y + 2, skin.dk, 1, 1);
      return;
    }
    px(ctx, x - 1, y, skin.lo, 3, 1); // mons shadow
    px(ctx, x, y + 1, skin.dk, 1, 2); // cleft
    return;
  }

  if (hasPenis) {
    // A flaccid set built like the real thing at pixel scale: the scrotum sits
    // behind and below, the shaft hangs over it and ends in a darker glans.
    // The groin scale drives the hang length; zero leaves only the scrotum.
    const len = penisSize >= 8 ? 5 : penisSize >= 6 ? 4 : penisSize >= 3 ? 3 : penisSize >= 1 ? 2 : 0;
    const sackW = penisSize >= 6 ? 4 : 3;
    const shaftW = penisSize >= 6 ? 2 : 1;

    if (meta.view === 'side') {
      // Scrotum tucked at the base, shaft dropping forward and down in profile.
      px(ctx, x - side, y + 1, skin.mid, 2, 2);
      px(ctx, x - side, y + 2, skin.lo, 2, 1);
      if (len > 0) {
        px(ctx, x + side, y, skin.mid, 2, 1); // root
        px(ctx, x + side * 2, y + 1, skin.mid, 1, Math.max(1, len - 2)); // hang
        px(ctx, x + side * 2, y + Math.max(1, len - 1), skin.dk, 1, 1); // glans
      }
      if (anatomy === 'intersex') px(ctx, x, y + 3, skin.dk, 1, 1);
      return;
    }

    // Front and three-quarter views. Scrotum first: two lobes with a centre
    // seam, lit upper-left, shaded along the bottom.
    const sackX = x - Math.floor(sackW / 2);
    px(ctx, sackX, y + 1, skin.mid, sackW, 2);
    px(ctx, sackX, y + 2, skin.lo, sackW, 1);
    px(ctx, sackX, y + 1, skin.hi, 1, 1);
    px(ctx, x, y + 1, skin.dk, 1, 2); // seam between the lobes
    if (len > 0) {
      // Shaft hanging over the scrotum, a lit left edge, a darker glans tip.
      px(ctx, x - Math.floor(shaftW / 2), y, skin.mid, shaftW, len);
      px(ctx, x - Math.floor(shaftW / 2), y, skin.hi, 1, Math.max(1, len - 2));
      px(ctx, x - Math.floor(shaftW / 2) + shaftW - 1, y + 1, skin.lo, 1, Math.max(1, len - 1));
      px(ctx, x - Math.floor(shaftW / 2), y + len, skin.dk, shaftW, 1); // glans
    }
    if (anatomy === 'intersex') px(ctx, x, y + 3, skin.dk, 1, 1); // cleft below the sack
  }
}

function drawActorNativeAccents(ctx, meta, pose, style, layout) {
  const { footY, hipY, shoulderY, headY, torso } = layout;
  const c = torso.bodyCx;
  const side = directionSide(meta);
  const shoulderHalf = Math.max(3, Math.floor(torso.shoulderW / 2));
  const waistHalf = Math.max(2, Math.floor(torso.waistW / 2));

  // Fine construction marks stay inside the established silhouette. They are
  // deliberately sparse so the actor still reads cleanly at gameplay scale.
  detailLinePx(
    ctx,
    c - shoulderHalf + 0.5,
    shoulderY + 3.5,
    c - waistHalf + 0.5,
    hipY - 2.5,
    style.coatHi ?? style.coat
  );
  detailLinePx(
    ctx,
    c + shoulderHalf - 0.5,
    shoulderY + 4.5,
    c + waistHalf - 0.5,
    hipY - 1.5,
    style.coatDk ?? style.coatLo
  );
  detailPx(ctx, c - side * 1.5, hipY - 0.5, style.belt ?? style.coatLo);
  detailLinePx(ctx, c - 4.5, footY - 2.5, c - 0.5, footY - 2.5, style.bootHi ?? style.pantsHi);
  detailLinePx(ctx, c + 0.5, footY - 2.5, c + 4.5, footY - 2.5, style.bootLo ?? style.pantsLo);

  if (style.hostHead) {
    detailLinePx(ctx, c - 3.5, headY + 0.5, c + 1.5, headY + 6.5, PALETTE.stoneDust);
    detailPx(ctx, c + side * 3.5, headY + 4.5, pose.bob ? PALETTE.hostGlow : PALETTE.hostGold);
  } else if (style.hostCorpse) {
    const seamSide = meta.view === 'front' ? 1 : side;
    detailLinePx(
      ctx,
      c + seamSide * 1.5,
      shoulderY + 4.5,
      c + seamSide * 3.5,
      hipY - 2.5,
      PALETTE.hostGold
    );
    detailPx(ctx, c + seamSide * 2.5, shoulderY + 7.5, PALETTE.hostBlack);
  } else if (style.maskedHead) {
    detailLinePx(ctx, c - 2.5, headY + 2.5, c + 2.5, headY + 2.5, style.hoodHi ?? style.hairHi);
    detailPx(ctx, c + side * 2.5, headY + 4.5, PALETTE.rustLight);
  } else if (meta.back) {
    detailLinePx(ctx, c - 2.5, headY + 0.5, c + 2.5, headY + 0.5, style.hairHi ?? style.hoodHi);
  } else if (meta.view === 'side') {
    detailPx(ctx, c + side * 2.5, headY + 3.5, style.skinDk ?? style.skinLo);
    detailPx(ctx, c + side * 3.5, headY + 4.5, style.skinHi ?? style.skin);
  } else {
    detailPx(ctx, c - 1.5, headY + 3.5, style.skinDk ?? style.skinLo);
    detailPx(ctx, c + 1.5, headY + 3.5, style.skinDk ?? style.skinLo);
    detailPx(ctx, c - 2.5, headY + 4.5, style.skinHi ?? style.skin);
  }

  if (pose.hit) {
    detailLinePx(ctx, c - 7.5, shoulderY + 7.5, c + 7.5, shoulderY + 7.5, PALETTE.flash);
  }
}

function drawWorkArms(ctx, {
  meta,
  pose,
  style,
  torso,
  shoulderY,
  hipY,
  farShoulder,
  nearShoulder,
  coat,
  skin
}) {
  if (!pose.work || typeof style.drawArms === 'function') return false;
  const side = directionSide(meta);
  const forward = side || 1;
  const phase = pose.workPhase ?? 0;
  const far = (elbow, hand) => drawJointedLimb(ctx, [farShoulder, elbow, hand], coat, style.armSize, true);
  const near = (elbow, hand) => drawJointedLimb(ctx, [nearShoulder, elbow, hand], coat, style.armSize, false);
  const hand = (point, isFar = false) => {
    px(ctx, point.x - 1, point.y - 1, isFar ? skin.lo : skin.mid, 3, 3);
    detailPx(ctx, point.x - 0.5, point.y - 0.5, isFar ? skin.mid : skin.hi);
  };

  if (pose.work === 'pump') {
    const stroke = [0, 2, 5, 7, 6, 3, 1, 0][phase % 8];
    const gripX = torso.bodyCx + forward * (11 + Math.round(Math.abs(meta.bodyTurn) * 2));
    const gripY = shoulderY + 7 + stroke;
    const farGrip = { x: gripX - forward * 2, y: gripY - 2 };
    const nearGrip = { x: gripX + forward * 2, y: gripY + 1 };
    far({ x: farShoulder.x + forward * 3, y: shoulderY + 8 }, farGrip);
    near({ x: nearShoulder.x + forward * 4, y: shoulderY + 9 }, nearGrip);
    hand(farGrip, true);
    hand(nearGrip);
    linePx(ctx, gripX - forward * 4, gripY + 2, gripX + forward * 5, gripY - 3, PALETTE.woodDark, 2);
    detailLinePx(ctx, gripX - forward * 3.5, gripY + 1.5, gripX + forward * 4.5, gripY - 3.5, PALETTE.woodLight);
    return true;
  }

  if (pose.work === 'mark') {
    const scratch = [0, 1, -1, 1, -1, 0][phase % 6];
    const brace = { x: torso.bodyCx + forward * 7, y: hipY - 5 };
    const writing = { x: torso.bodyCx + forward * (11 + scratch), y: hipY - 7 + (phase & 1) };
    far({ x: farShoulder.x + forward * 2, y: shoulderY + 10 }, brace);
    near({ x: nearShoulder.x + forward * 4, y: shoulderY + 9 }, writing);
    hand(brace, true);
    hand(writing);
    linePx(ctx, writing.x, writing.y, writing.x + forward * 5, writing.y + 4, PALETTE.rustDark, 1);
    detailPx(ctx, writing.x + forward * 4.5, writing.y + 3.5, PALETTE.rustLight);
    return true;
  }

  if (pose.work === 'lift') {
    const lift = pose.liftHeight ?? 0;
    const loadX = torso.bodyCx + forward * 9;
    const loadY = hipY + 2 - lift;
    const farGrip = { x: loadX - forward * 3, y: loadY - 1 };
    const nearGrip = { x: loadX + forward * 3, y: loadY + 1 };
    far({ x: farShoulder.x + forward * 3, y: shoulderY + 11 }, farGrip);
    near({ x: nearShoulder.x + forward * 4, y: shoulderY + 11 }, nearGrip);
    px(ctx, loadX - 5, loadY - 4, PALETTE.outline, 11, 7);
    px(ctx, loadX - 4, loadY - 4, PALETTE.woodMid, 9, 5);
    px(ctx, loadX - 4, loadY - 4, PALETTE.woodLight, 7, 1);
    px(ctx, loadX + 4, loadY - 3, PALETTE.woodDark, 1, 4);
    detailLinePx(ctx, loadX - 2.5, loadY - 3.5, loadX + 2.5, loadY + 0.5, PALETTE.rustLight);
    hand(farGrip, true);
    hand(nearGrip);
    return true;
  }

  if (pose.work === 'kneel') {
    const scrape = [0, 1, 3, 2, 1, 0][phase % 6];
    const brace = { x: torso.bodyCx - forward * 3, y: hipY + 3 };
    const working = { x: torso.bodyCx + forward * (9 + scrape), y: hipY + 8 - (phase & 1) };
    far({ x: farShoulder.x - forward, y: shoulderY + 11 }, brace);
    near({ x: nearShoulder.x + forward * 4, y: shoulderY + 13 }, working);
    hand(brace, true);
    hand(working);
    linePx(ctx, working.x - forward, working.y, working.x + forward * 5, working.y + 2, PALETTE.ironDark, 2);
    detailLinePx(ctx, working.x - forward * 0.5, working.y - 0.5, working.x + forward * 4.5, working.y + 1.5, PALETTE.ironLight);
    return true;
  }

  return false;
}

export function drawActorBase(ctx, w, h, facing, pose, style) {
  const meta = FACING_META[facing] ?? FACING_META.se;
  const side = directionSide(meta);
  const scale = viewScale(meta);
  const cx = Math.floor(w / 2);
  const footY = h - 4;
  const bob = pose.bob ?? 0;
  const sneak = pose.sneak ?? 0;
  const baseHunch = style.hunch ?? 0;
  const postureCompression = style.postureCompression ?? 0;
  const postureLean = meta.view === 'side'
    ? directionSide(meta) * (style.postureLean ?? 0)
    : meta.view === 'three'
      ? directionSide(meta) * Math.round((style.postureLean ?? 0) * 0.66)
      : 0;
  const hipY = footY - style.legLength + bob + Math.floor(baseHunch * 0.4) + Math.floor(sneak * 0.62);
  const shoulderY = hipY - style.torsoLength + Math.floor(baseHunch * 0.55) + postureCompression + Math.floor(sneak * 0.72);
  const headY = shoulderY - style.headHeight + Math.floor(baseHunch * 0.25) + Math.floor(sneak * 0.32);

  const pants = ramp(style, 'pants');
  const coat = ramp(style, 'coat');
  const skin = ramp(style, 'skin');
  const legSpread = meta.view === 'side' ? 2 : Math.max(3, Math.round(5 * scale) + Math.floor(sneak * 0.08));
  const legA = pose.legA ?? 0;
  const legB = pose.legB ?? 0;
  const armA = pose.armA ?? 0;
  const armB = pose.armB ?? 0;
  const attack = pose.attack ?? 0;
  const reach = pose.reach ?? 0;

  const farLeg = {
    hip: { x: cx - legSpread - Math.round(meta.bodyTurn), y: hipY },
    knee: { x: cx - legSpread + Math.round(legA * 0.45), y: hipY + Math.floor(style.legLength * 0.46) + Math.floor(sneak * 0.2) },
    foot: { x: cx - legSpread - 1 + Math.round(legA * 0.9), y: footY }
  };
  const nearLeg = {
    hip: { x: cx + legSpread - Math.round(meta.bodyTurn), y: hipY },
    knee: { x: cx + legSpread + Math.round(legB * 0.45), y: hipY + Math.floor(style.legLength * 0.48) + Math.floor(sneak * 0.22) },
    foot: { x: cx + legSpread + 1 + Math.round(legB * 0.9), y: footY }
  };

  if (meta.view === 'side') {
    farLeg.hip.x = cx - side * 3;
    farLeg.knee.x = cx - side * (4 + Math.round(Math.abs(legA) * 0.35));
    farLeg.foot.x = cx - side * (5 + Math.round(Math.abs(legA) * 0.7));
    nearLeg.hip.x = cx + side * 1;
    nearLeg.knee.x = cx + side * (2 + Math.round(Math.abs(legB) * 0.3));
    nearLeg.foot.x = cx + side * (4 + Math.round(Math.abs(legB) * 0.7));
  }

  if (pose.kneel) {
    const kneelSide = side || 1;
    farLeg.knee.x = cx - kneelSide * 2;
    farLeg.knee.y = footY - 7;
    farLeg.foot.x = cx - kneelSide * 7;
    nearLeg.knee.x = cx + kneelSide * 8;
    nearLeg.knee.y = footY - 2;
    nearLeg.foot.x = cx + kneelSide * 11;
  }

  drawJointedLimb(ctx, [farLeg.hip, farLeg.knee, farLeg.foot], pants, style.legSize, true);
  drawBoot(ctx, farLeg.foot.x, farLeg.foot.y, side, style, true);
  drawJointedLimb(ctx, [nearLeg.hip, nearLeg.knee, nearLeg.foot], pants, style.legSize, false);
  drawBoot(ctx, nearLeg.foot.x, nearLeg.foot.y, side, style, false);

  const torso = drawTorso(ctx, cx + postureLean, shoulderY, hipY, meta, pose, style);
  drawVest(ctx, torso, shoulderY, hipY, meta, style);
  drawAdultChest(ctx, torso, shoulderY, meta, pose, style);
  drawKitOverlay(ctx, torso, shoulderY, hipY, meta, style);
  drawAdultAnatomy(ctx, torso, hipY, meta, pose, style);
  const shoulderHalf = Math.floor(torso.shoulderW / 2);
  const farShoulder = { x: torso.bodyCx - shoulderHalf, y: shoulderY + 3 };
  const nearShoulder = { x: torso.bodyCx + shoulderHalf, y: shoulderY + 3 };
  const farHandY = hipY - 2 + armA;
  const nearHandY = hipY - 2 + armB;

  const action = attack || reach;
  if (drawWorkArms(ctx, {
    meta,
    pose,
    style,
    torso,
    shoulderY,
    hipY,
    farShoulder,
    nearShoulder,
    coat,
    skin
  })) {
    // The work-family pose owns both arms and any held tool or load.
  } else if (typeof style.drawArms === 'function') {
    style.drawArms({
      ctx,
      px,
      linePx,
      detailPx,
      detailLinePx,
      meta,
      facing,
      pose,
      style,
      footY,
      hipY,
      shoulderY,
      headY,
      torso
    });
  } else if (meta.view !== 'side') {
    drawJointedLimb(ctx, [
      farShoulder,
      { x: farShoulder.x - 2 + Math.round(armA * 0.45), y: shoulderY + 12 },
      { x: farShoulder.x - 1 + Math.round(armA * 0.55), y: farHandY }
    ], coat, style.armSize, true);

    if (action > 0) {
      const dir = meta.view === 'front' ? 1 : side;
      const elbow = { x: nearShoulder.x + dir * (3 + Math.floor(action / 3)), y: shoulderY + 10 };
      const hand = { x: nearShoulder.x + dir * (8 + action), y: shoulderY + 11 + Math.floor(action / 5) };
      drawJointedLimb(ctx, [nearShoulder, elbow, hand], coat, style.armSize, false);
      px(ctx, hand.x, hand.y, skin.mid, 3, 2);
      if (attack > 0) drawHeldWeapon(ctx, hand, dir, style, false);
    } else {
      drawJointedLimb(ctx, [
        nearShoulder,
        { x: nearShoulder.x + 2 + Math.round(armB * 0.45), y: shoulderY + 12 },
        { x: nearShoulder.x + 1 + Math.round(armB * 0.55), y: nearHandY }
      ], coat, style.armSize, false);
      px(ctx, farShoulder.x - 1 + Math.round(armA * 0.55), farHandY, skin.mid, 2, 2);
      px(ctx, nearShoulder.x + 1 + Math.round(armB * 0.55), nearHandY, skin.mid, 2, 2);
    }
  } else {
    drawJointedLimb(ctx, [
      { x: torso.bodyCx - side * 4, y: shoulderY + 4 },
      { x: torso.bodyCx - side * 5 + Math.round(armA * 0.3), y: shoulderY + 12 },
      { x: torso.bodyCx - side * 3, y: farHandY }
    ], coat, style.armSize, true);

    const reachX = action > 0 ? side * (7 + action) : side * (4 + Math.round(armB * 0.35));
    const hand = { x: torso.bodyCx + reachX, y: action > 0 ? shoulderY + 12 + Math.floor(action / 5) : nearHandY };
    drawJointedLimb(ctx, [
      { x: torso.bodyCx + side * 4, y: shoulderY + 5 },
      { x: torso.bodyCx + side * 5 + Math.round(armB * 0.35), y: shoulderY + 12 },
      hand
    ], coat, style.armSize, false);
    px(ctx, hand.x, hand.y, skin.mid, 2, 2);
    if (attack > 0) drawHeldWeapon(ctx, hand, side, style, true);
  }

  px(ctx, torso.bodyCx - 1, headY + style.headHeight - 1, skin.dk, 3, 2);
  drawSmallHead(ctx, torso.bodyCx, headY, meta, pose, style);

  if (style.decorate) {
    style.decorate({
      ctx,
      px,
      linePx,
      detailPx,
      detailLinePx,
      dither,
      meta,
      facing,
      pose,
      style,
      cx,
      footY,
      hipY,
      shoulderY,
      headY,
      torso
    });
  }

  if (pose.hit) px(ctx, torso.bodyCx - 8, shoulderY + 8, PALETTE.flash, 16, 2);
  drawActorNativeAccents(ctx, meta, pose, style, { footY, hipY, shoulderY, headY, torso });
}

function drawCorpseHair(ctx, hx, bodyTop, style, cult) {
  const hairStyle = style.hairStyle ?? 'cropped';
  const hair = style.hair ?? style.hood;
  const hairHi = style.hairHi ?? hair;
  const covered = cult || style.bareHead === false || hairStyle === 'hooded';
  if (covered) {
    px(ctx, hx - 1, bodyTop, style.hood ?? hair, 7, 3);
    if (hairStyle === 'bobbed' || hairStyle === 'loose') {
      px(ctx, hx + 4, bodyTop + 2, hair, 3, hairStyle === 'loose' ? 4 : 3);
    }
    if (hairStyle === 'tied') {
      px(ctx, hx - 2, bodyTop + 2, hair, 3, 2);
      px(ctx, hx - 4, bodyTop + 3, hair, 3, 2);
    }
    if (hairStyle === 'braid') {
      px(ctx, hx - 2, bodyTop + 2, hair, 3, 2);
      px(ctx, hx - 4, bodyTop + 4, hairHi, 2, 2);
      px(ctx, hx - 6, bodyTop + 5, hair, 2, 2);
    }
    return;
  }
  if (hairStyle === 'shaved') {
    px(ctx, hx + 1, bodyTop, hair, 4, 1);
    px(ctx, hx + 1, bodyTop, hairHi, 1, 1);
    return;
  }
  if (hairStyle === 'tonsure') {
    px(ctx, hx, bodyTop, hair, 6, 1);
    px(ctx, hx + 1, bodyTop + 1, style.skin, 4, 1);
    px(ctx, hx + 4, bodyTop + 2, hair, 2, 2);
    return;
  }
  px(ctx, hx, bodyTop, hair, 6, hairStyle === 'bobbed' || hairStyle === 'loose' ? 3 : 2);
  px(ctx, hx, bodyTop, hairHi, 2, 1);
  if (hairStyle === 'bobbed') px(ctx, hx + 4, bodyTop + 2, hair, 3, 2);
  if (hairStyle === 'loose') px(ctx, hx + 4, bodyTop + 2, hair, 4, 4);
  if (hairStyle === 'tied') {
    px(ctx, hx + 3, bodyTop + 1, hair, 3, 2);
    px(ctx, hx + 5, bodyTop + 2, hair, 3, 2);
  }
  if (hairStyle === 'braid') {
    px(ctx, hx + 3, bodyTop + 1, hair, 3, 2);
    px(ctx, hx + 5, bodyTop + 3, hairHi, 2, 2);
    px(ctx, hx + 6, bodyTop + 4, hair, 2, 3);
  }
}

function drawCorpseFaceDetails(ctx, hx, bodyTop, style) {
  if (style.faceMark === 'eye-patch') {
    px(ctx, hx + 1, bodyTop + 3, PALETTE.clothDark, 3, 2);
    linePx(ctx, hx, bodyTop + 2, hx + 5, bodyTop + 4, PALETTE.stoneDark);
  } else if (style.faceMark === 'burn-scar') {
    px(ctx, hx + 1, bodyTop + 3, PALETTE.rustDark, 2, 2);
  } else if (style.faceMark === 'cheek-scar') {
    px(ctx, hx + 2, bodyTop + 3, PALETTE.rustLight, 1, 1);
    px(ctx, hx + 3, bodyTop + 4, style.skinDk, 1, 1);
  } else if (style.faceMark === 'split-brow') {
    px(ctx, hx + 1, bodyTop + 2, PALETTE.rustLight, 1, 1);
  }
  if (style.age === 'elder' && style.hairStyle !== 'hooded') {
    px(ctx, hx + 1, bodyTop, PALETTE.stoneDust, 1, 1);
  }
}

export function drawDeath(ctx, w, h, style, frame) {
  if (typeof style.drawDeath === 'function') {
    style.drawDeath({ ctx, w, h, style, frame, px, linePx, detailPx, detailLinePx, dither });
    return;
  }
  const cx = Math.floor(w / 2);
  const groundY = h - 6;
  const fall = Math.min(1, frame / 4);
  const settle = Math.min(1, Math.max(0, (frame - 3) / 6));
  const coat = ramp(style, 'coat');
  const skin = ramp(style, 'skin');
  const host = Boolean(style.hostHead || style.hostCorpse);
  const cult = Boolean(style.maskedHead);

  const lift = Math.round((1 - fall) * 20); // body drops to the floor
  const bodyTop = groundY - 8 - lift;
  const half = Math.max(14, Math.round((style.shoulders ?? 15) * 1.15));

  // Ground seep / blood pool, settling under the body.
  if (settle > 0) {
    const seep = host ? PALETTE.hostBlack : PALETTE.hostRed;
    const seep2 = host ? PALETTE.hostGold : PALETTE.rustDark;
    const sw = Math.round(22 + settle * 16);
    for (let r = 0; r < 6; r += 1) {
      const ww = Math.max(2, Math.round(sw * (1 - Math.abs(r - 2.5) / 4)));
      px(ctx, cx - Math.floor(ww / 2) + 3, groundY - 2 + r, r % 2 ? seep2 : seep, ww, 1);
    }
  }

  // Coat / robe mass lying flat.
  for (let row = 0; row < 9; row += 1) {
    const ww = half * 2 - Math.abs(row - 4) * 2;
    const tone = row < 3 ? coat.hi : row < 6 ? coat.mid : coat.lo;
    px(ctx, cx - Math.floor(ww / 2) - 2, bodyTop + row, tone, ww, 1);
  }
  px(ctx, cx - half - 4, bodyTop, PALETTE.void, 2, 9);
  px(ctx, cx + half - 2, bodyTop, PALETTE.void, 2, 9);

  if (host) {
    // Collapsed Host icon: veins, scattered halo bone, thorns, a dim wound.
    px(ctx, cx - 11, bodyTop + 3, PALETTE.hostGold, 22, 1);
    px(ctx, cx - 6, bodyTop + 6, PALETTE.hostGold, 14, 1);
    for (const [dx, dy] of [[-16, -1], [-20, 2], [-14, 5], [-21, 5], [-12, -3]]) {
      px(ctx, cx + dx, bodyTop + dy, PALETTE.hostBone, 2, 1);
    }
    linePx(ctx, cx + 7, bodyTop + 2, cx + 13, bodyTop - 3, PALETTE.hostBone, 1);
    const deadWound = style.deadWound ?? (frame % 2 ? PALETTE.hostGlow : PALETTE.hostGold);
    px(ctx, cx, bodyTop + 4, deadWound, 2, 2);
    px(ctx, cx - 20, bodyTop + 1, PALETTE.hostBone, 5, 5); // skull at head end
    px(ctx, cx - 19, bodyTop + 2, PALETTE.void, 1, 1);
  } else {
    // Human corpse: head + boots at the ends, a slack outflung arm, belt.
    const hx = cx + 13;
    px(ctx, hx, bodyTop + 1, skin.mid, 6, 6);
    drawCorpseHair(ctx, hx, bodyTop, style, cult);
    if (!cult) drawCorpseFaceDetails(ctx, hx, bodyTop, style);
    if (!cult && style.facialHair && style.facialHair !== 'none') {
      const beardH = style.facialHair === 'beard' ? 3 : style.facialHair === 'short-beard' || style.facialHair === 'goatee' ? 2 : 1;
      const beardW = style.facialHair === 'goatee' ? 2 : style.facialHair === 'moustache' ? 3 : 4;
      px(ctx, hx + 1, bodyTop + 4, style.hair, beardW, beardH);
      px(ctx, hx + 1, bodyTop + 4, style.hairHi ?? style.hair, 1, 1);
    } else if (!cult) {
      px(ctx, hx + 1, bodyTop + 4, skin.dk, 3, 1); // slack jaw
    }
    px(ctx, cx - half - 1, bodyTop + 5, style.bootLo, 8, 3);
    px(ctx, cx - half, bodyTop + 5, style.boot, 4, 2);
    px(ctx, cx - 6, bodyTop + 4, style.belt, 13, 1);
    linePx(ctx, cx + 2, bodyTop + 7, cx + 9, bodyTop + 11, coat.lo, 2);
    px(ctx, cx + 9, bodyTop + 11, skin.mid, 2, 2);
    if (cult) {
      px(ctx, cx - 3, bodyTop + 2, PALETTE.clothRed, 9, 1); // stained stole
      linePx(ctx, cx - 7, bodyTop + 11, cx - 1, bodyTop + 13, style.weapon, 1); // dropped knife
    }
  }

  // Corpse-native detail follows the settled fabric and face rather than
  // outlining the body a second time. Every death key therefore retains the
  // same high-resolution contract as live animation frames.
  detailLinePx(ctx, cx - half + 1.5, bodyTop + 0.5, cx + half - 2.5, bodyTop + 0.5, coat.hi);
  detailLinePx(ctx, cx - half + 3.5, bodyTop + 6.5, cx + half - 4.5, bodyTop + 6.5, coat.dk);
  if (host) {
    detailLinePx(ctx, cx - 8.5, bodyTop + 3.5, cx + 7.5, bodyTop + 3.5, PALETTE.hostGold);
    detailPx(ctx, cx + 0.5, bodyTop + 4.5, PALETTE.hostBone);
  } else {
    detailPx(ctx, cx + 14.5, bodyTop + 2.5, skin.hi);
    detailLinePx(ctx, cx + 13.5, bodyTop + 5.5, cx + 16.5, bodyTop + 5.5, skin.dk);
  }
  if (settle > 0) {
    detailLinePx(ctx, cx - 8.5, groundY + 0.5, cx + 9.5, groundY + 0.5, host ? PALETTE.hostGold : PALETTE.rustDark);
  }
}

export function compose(w, h, drawBody) {
  const { canvas, ctx } = createCanvas(w, h);
  drawBody(ctx);
  return canvas;
}

export function bakeActor(w, h, style) {
  const frames = {};
  for (const state of Object.keys(POSES)) {
    frames[state] = {};
    for (const facing of FACINGS) {
      frames[state][facing] = makeLazyFrameList(POSES[state].length, (frame) =>
        compose(w, h, (ctx) => drawActorBase(ctx, w, h, facing, POSES[state][frame], style))
      );
    }
  }

  const death = makeLazyFrameList(10, (frame) =>
    compose(w, h, (ctx) => drawDeath(ctx, w, h, style, frame))
  );

  return {
    width: w,
    height: h,
    anchorX: Math.floor(w / 2),
    anchorY: h - 2,
    frames,
    death
  };
}

export function getFrame(atlas, spriteId, state, facing, frameIndex) {
  const sprite = atlas[spriteId];
  if (!sprite) return null;
  if (state === 'dead') {
    const i = Math.max(0, Math.min(sprite.death.length - 1, frameIndex));
    return { sprite, frame: sprite.death[i], mirror: false };
  }

  const face = FACING_META[facing] ? facing : 'se';
  const byFacing = sprite.frames[state] ?? sprite.frames.idle;
  const list = byFacing[face] ?? byFacing.se;
  const len = list.length;
  const index = len > 0 ? ((frameIndex % len) + len) % len : 0;
  return { sprite, frame: list[index], mirror: false };
}
