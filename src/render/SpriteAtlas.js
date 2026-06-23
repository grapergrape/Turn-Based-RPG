// Directional, animated, lo-fi isometric actor sprites.
//
// The actors are baked into tiny native-resolution canvas frames. Each frame is
// built from jointed limbs, narrow torsos, small heads, and actor-specific
// pixel clusters so the silhouettes read as downsampled human figures rather
// than block characters.

import { PALETTE } from './palette.js';

const FACINGS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

const FACING_META = {
  n: { view: 'back', side: 0, back: true, bodyTurn: 0 },
  ne: { view: 'three', side: 1, back: true, bodyTurn: 0.75 },
  e: { view: 'side', side: 1, back: false, bodyTurn: 1 },
  se: { view: 'three', side: 1, back: false, bodyTurn: 0.75 },
  s: { view: 'front', side: 0, back: false, bodyTurn: 0 },
  sw: { view: 'three', side: -1, back: false, bodyTurn: -0.75 },
  w: { view: 'side', side: -1, back: false, bodyTurn: -1 },
  nw: { view: 'three', side: -1, back: true, bodyTurn: -0.75 }
};

const POSES = {
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
  ]
};

export const SPRITE_POSE_FRAME_COUNTS = Object.freeze(
  Object.fromEntries(Object.entries(POSES).map(([state, poses]) => [state, poses.length]))
);

function createCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function px(ctx, x, y, color, w = 1, h = 1) {
  if (!color) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

function linePx(ctx, x0, y0, x1, y1, color, size = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    px(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, color, size, size);
  }
}

function dither(ctx, x, y, w, h, color, phase = 0) {
  for (let yy = 0; yy < h; yy += 2) {
    for (let xx = ((yy / 2 + phase) & 1) * 2; xx < w; xx += 4) {
      px(ctx, x + xx, y + yy, color);
    }
  }
}

function ramp(style, name) {
  return {
    hi: style[`${name}Hi`],
    mid: style[name],
    lo: style[`${name}Lo`],
    dk: style[`${name}Dk`] ?? style[`${name}Lo`]
  };
}

function taperedSpan(ctx, cx, y, topW, bottomW, h, colors, lean = 0, phase = 0) {
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

function drawJointedLimb(ctx, points, colors, size = 2, far = false) {
  const c = far ? { ...colors, mid: colors.lo, hi: colors.mid } : colors;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    linePx(ctx, a.x, a.y, b.x, b.y, c.dk, size + 1);
    linePx(ctx, a.x, a.y, b.x, b.y, c.mid, size);
    linePx(ctx, a.x, a.y, b.x, b.y, c.hi, 1);
  }
}

function drawBoot(ctx, x, y, side, style, far = false) {
  const toe = side >= 0 ? 1 : -3;
  if (style.bareFeet) {
    const skin = ramp(style, 'skin');
    const mid = far ? skin.lo : skin.mid;
    px(ctx, x - 2, y + 1, mid, 5, 2);
    px(ctx, x - 1 + toe, y + 2, mid, 5, 1);
    px(ctx, x - 1, y + 1, skin.hi, 2, 1);
    px(ctx, x + 3 + (toe > 0 ? 1 : -2), y + 2, skin.dk, 1, 1);
    return;
  }
  const main = far ? style.bootLo : style.boot;
  px(ctx, x - 2, y, style.bootLo, 8, 3);
  px(ctx, x - 1 + toe, y + 2, style.bootLo, 8, 2);
  px(ctx, x - 1, y, main, 7, 2);
  px(ctx, x, y, style.bootHi, 4, 1);
}

function viewScale(meta) {
  if (meta.view === 'side') return 0.68;
  if (meta.view === 'three') return 0.88;
  return 1;
}

function directionSide(meta) {
  return meta.side || 1;
}

function drawSmallHead(ctx, x, y, meta, pose, style) {
  const skin = ramp(style, 'skin');
  const side = directionSide(meta);
  const hit = pose.hit ? side : 0;
  const hood = style.hood ?? style.hair;
  const hoodHi = style.hoodHi ?? style.hairHi;

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
    return;
  }

  if (style.maskedHead) {
    const cx = x + hit;
    const cowl = { hi: hoodHi, mid: hood, lo: PALETTE.void, dk: PALETTE.void };
    taperedSpan(ctx, cx, y - 1, 7, 6, 9, cowl, side * 0.2);
    px(ctx, cx - 3, y + 3, PALETTE.void, 6, 2);
    px(ctx, cx - 2, y + 4, PALETTE.rustDark, 4, 1);
    px(ctx, cx + side * 3, y + 3, skin.lo, 1, 3);
    return;
  }

  // With a hood equipped the crown reads as smoke-dark cloth; bare-headed it is
  // hair, drawn in the same compact cap so the silhouette stays Mara's. Only the
  // player uses this branch (enemies are masked/host heads), so the bareHead
  // path never touches enemy sprites.
  const bare = Boolean(style.bareHead);
  const crown = bare ? style.hair : hood;
  const crownHi = bare ? (style.hairHi ?? style.hair) : hoodHi;

  if (meta.view === 'side') {
    taperedSpan(ctx, x + hit, y, 5, 6, 8, skin, side * 0.3);
    px(ctx, x - 2 + hit, y - 1, crown, 5, 1);
    px(ctx, x - 3 + hit, y, crown, 6, 1);
    px(ctx, x - 3 + hit, y + 1, crown, 2, 4);
    px(ctx, x + (side > 0 ? 4 : -1) + hit, y + 4, skin.mid, 2, 2);
    px(ctx, x + (side > 0 ? 2 : 3) + hit, y + 4, skin.dk, 2, 1);
    px(ctx, x - 1 + hit, y - 1, crownHi, 2, 1);
    if (bare) px(ctx, x + hit, y + 2, skin.hi, 2, 1); // lit temple
    return;
  }

  taperedSpan(ctx, x + hit, y, 6, 7, 8, skin);
  px(ctx, x - 2 + hit, y - 1, crown, 5, 1);
  px(ctx, x - 3 + hit, y, crown, 7, 1);
  px(ctx, x - 4 + hit, y + 1, crown, 2, 4);
  px(ctx, x + 3 + hit, y + 1, crown, 1, 4);
  px(ctx, x - 1 + hit, y - 1, crownHi, 2, 1);
  if (meta.back) {
    px(ctx, x - 3 + hit, y + 2, crown, 6, 6);
    return;
  }
  px(ctx, x - 2 + hit, y + 4, skin.dk, 2, 1);
  px(ctx, x + 1 + hit, y + 4, skin.dk, 1, 1);
  px(ctx, x + hit, y + 6, skin.lo, 2, 1);
  if (bare) {
    // A brighter brow and cheek so the open face reads as skin, not shadow.
    px(ctx, x - 1 + hit, y + 2, skin.hi, 3, 1);
    px(ctx, x - 2 + hit, y + 3, skin.mid, 5, 1);
  } else {
    // Hood up: a narrow brow-guard shadow keeps the face in cowl shadow.
    px(ctx, x - 2 + hit, y + 3, PALETTE.void, 5, 1);
  }
}

function drawTorso(ctx, cx, shoulderY, hipY, meta, pose, style) {
  const coat = ramp(style, 'coat');
  const scale = viewScale(meta);
  const side = directionSide(meta);
  const shoulderW = Math.max(7, Math.round(style.shoulders * scale));
  const waistW = Math.max(6, Math.round(style.waist * scale));
  const lean = (pose.lean ?? 0) * side + Math.round(meta.bodyTurn * 1.2);
  const bodyCx = cx + lean;
  const bodyH = hipY - shoulderY;

  taperedSpan(ctx, bodyCx, shoulderY, shoulderW, waistW, bodyH, coat, lean * 0.16, pose.cloth ?? 0);
  px(ctx, bodyCx - Math.floor(waistW / 2), hipY - 1, style.belt, waistW, 2);

  if (style.coatTail) {
    const tailY = hipY + 1;
    const tailH = style.coatTail;
    const split = meta.view === 'side' ? 0 : 2;
    taperedSpan(ctx, bodyCx - split, tailY, Math.max(4, waistW - 2), Math.max(3, waistW - 5), tailH, coat, -0.35, pose.cloth ?? 0);
    px(ctx, bodyCx, tailY + 2, coat.dk, 1, Math.max(4, tailH - 3));
  }

  px(ctx, bodyCx - Math.floor(shoulderW / 2), shoulderY, coat.hi, Math.max(3, shoulderW - 2), 1);
  px(ctx, bodyCx + Math.floor(shoulderW / 2), shoulderY + 2, coat.dk, 1, bodyH - 3);
  dither(ctx, bodyCx - Math.floor(shoulderW / 2) + 2, shoulderY + 3, Math.max(4, shoulderW - 4), bodyH - 4, coat.lo, pose.cloth ?? 0);
  return { bodyCx, shoulderW, waistW, lean };
}

function drawAdultAnatomy(ctx, torso, hipY, meta, style) {
  if (!style.anatomyVisible || meta.back) return;
  const skin = ramp(style, 'skin');
  const side = directionSide(meta);
  const c = torso.bodyCx + Math.round((meta.bodyTurn ?? 0) * 0.5);
  const y = hipY + 1;

  if (meta.view === 'side') {
    const x = c + side * 2;
    if (style.anatomy === 'penis' || style.anatomy === 'intersex') {
      px(ctx, x, y + 1, skin.lo, 2, 2);
      px(ctx, x + side, y + 2, skin.dk, 1, 1);
    } else if (style.anatomy === 'vulva') {
      px(ctx, x - side, y + 1, skin.lo, 1, 3);
      px(ctx, x, y + 2, skin.dk, 1, 1);
    } else {
      px(ctx, x - side, y + 1, skin.lo, 2, 1);
    }
    return;
  }

  if (style.anatomy === 'penis') {
    px(ctx, c - 1, y, skin.lo, 3, 1);
    px(ctx, c, y + 1, skin.mid, 2, 3);
    px(ctx, c + 1, y + 3, skin.dk, 1, 1);
  } else if (style.anatomy === 'intersex') {
    px(ctx, c - 1, y, skin.lo, 3, 1);
    px(ctx, c, y + 1, skin.mid, 1, 3);
    px(ctx, c - 1, y + 2, skin.dk, 1, 1);
  } else if (style.anatomy === 'vulva') {
    px(ctx, c - 1, y, skin.lo, 3, 1);
    px(ctx, c, y + 1, skin.dk, 1, 3);
    px(ctx, c - 1, y + 2, skin.lo, 1, 1);
  } else {
    px(ctx, c - 1, y + 1, skin.lo, 3, 1);
  }
}

function drawActorBase(ctx, w, h, facing, pose, style) {
  const meta = FACING_META[facing] ?? FACING_META.se;
  const side = directionSide(meta);
  const scale = viewScale(meta);
  const cx = Math.floor(w / 2);
  const footY = h - 4;
  const bob = pose.bob ?? 0;
  const sneak = pose.sneak ?? 0;
  const baseHunch = style.hunch ?? 0;
  const hipY = footY - style.legLength + bob + Math.floor(baseHunch * 0.4) + Math.floor(sneak * 0.62);
  const shoulderY = hipY - style.torsoLength + Math.floor(baseHunch * 0.55) + Math.floor(sneak * 0.72);
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

  drawJointedLimb(ctx, [farLeg.hip, farLeg.knee, farLeg.foot], pants, style.legSize, true);
  drawBoot(ctx, farLeg.foot.x, farLeg.foot.y, side, style, true);
  drawJointedLimb(ctx, [nearLeg.hip, nearLeg.knee, nearLeg.foot], pants, style.legSize, false);
  drawBoot(ctx, nearLeg.foot.x, nearLeg.foot.y, side, style, false);

  const torso = drawTorso(ctx, cx, shoulderY, hipY, meta, pose, style);
  drawAdultAnatomy(ctx, torso, hipY, meta, style);
  const shoulderHalf = Math.floor(torso.shoulderW / 2);
  const farShoulder = { x: torso.bodyCx - shoulderHalf, y: shoulderY + 3 };
  const nearShoulder = { x: torso.bodyCx + shoulderHalf, y: shoulderY + 3 };
  const farHandY = hipY - 2 + armA;
  const nearHandY = hipY - 2 + armB;

  const action = attack || reach;
  if (meta.view !== 'side') {
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
      if (attack > 0) linePx(ctx, hand.x + dir * 2, hand.y - 5, hand.x + dir * 5, hand.y + 8, style.weapon, 1);
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
    if (attack > 0) linePx(ctx, hand.x + side * 2, hand.y - 5, hand.x + side * 5, hand.y + 8, style.weapon, 1);
  }

  px(ctx, torso.bodyCx - 1, headY + style.headHeight - 1, skin.dk, 3, 2);
  drawSmallHead(ctx, torso.bodyCx, headY, meta, pose, style);

  if (style.decorate) {
    style.decorate({ ctx, px, linePx, dither, meta, facing, pose, style, cx, footY, hipY, shoulderY, headY, torso });
  }

  if (pose.hit) px(ctx, torso.bodyCx - 8, shoulderY + 8, PALETTE.flash, 16, 2);
}

// A clear, flat corpse on the ground, distinct per creature so a cleared room
// reads at a glance: a Host form collapses into a black-gold icon with scattered
// halo bone; a hooded cultist crumples into robes beside a dropped knife; a
// human (Mara) falls in her coat. The body drops into place over the first few
// frames, then blood / black-gold seep settles.
function drawDeath(ctx, w, h, style, frame) {
  const cx = Math.floor(w / 2);
  const groundY = h - 6;
  const fall = Math.min(1, frame / 4);
  const settle = Math.min(1, Math.max(0, (frame - 3) / 6));
  const coat = ramp(style, 'coat');
  const skin = ramp(style, 'skin');
  const host = Boolean(style.hostHead);
  const cult = Boolean(style.maskedHead);

  const lift = Math.round((1 - fall) * 20); // body drops to the floor
  const bodyTop = groundY - 8 - lift;
  const half = 17;

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
    px(ctx, cx, bodyTop + 4, frame % 2 ? PALETTE.hostGlow : PALETTE.hostGold, 2, 2);
    px(ctx, cx - 20, bodyTop + 1, PALETTE.hostBone, 5, 5); // skull at head end
    px(ctx, cx - 19, bodyTop + 2, PALETTE.void, 1, 1);
  } else {
    // Human corpse: head + boots at the ends, a slack outflung arm, belt.
    const hx = cx + 13;
    px(ctx, hx, bodyTop + 1, skin.mid, 6, 6);
    px(ctx, hx, bodyTop, style.hair, 6, 2);
    if (cult) px(ctx, hx - 1, bodyTop, style.hood, 7, 3); // cowl over the face
    else px(ctx, hx + 1, bodyTop + 4, skin.dk, 3, 1); // slack jaw
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
}

function compose(w, h, drawBody) {
  const { canvas, ctx } = createCanvas(w, h);
  drawBody(ctx);
  return canvas;
}

// A boiled-leather vest with thin iron plates, worn over the coat. Kept narrow
// so the coat still shows at the shoulders and below the hem: removing either
// the coat or the vest visibly changes the figure.
function drawLeatherVest(ctx, px, c, shoulderY, hipY, meta, torso, vest) {
  const top = shoulderY + 3;
  const bot = hipY - 1;
  const span = Math.max(1, bot - top);
  const topW = Math.max(5, torso.shoulderW - 4);
  const botW = Math.max(5, torso.waistW);
  for (let y = top; y <= bot; y += 1) {
    const t = (y - top) / span;
    const w = Math.max(4, Math.round(topW + (botW - topW) * t));
    const x = c - Math.floor(w / 2);
    px(ctx, x, y, vest.mid, w, 1);
    px(ctx, x, y, vest.hi);
    px(ctx, x + w - 1, y, vest.lo);
  }
  // Shoulder straps anchoring the vest.
  px(ctx, c - Math.floor(torso.shoulderW / 2) + 1, shoulderY + 2, vest.lo, 3, 5);
  px(ctx, c + Math.floor(torso.shoulderW / 2) - 3, shoulderY + 2, vest.lo, 3, 5);
  if (meta.back) {
    px(ctx, c - 1, top, vest.lo, 2, span); // back seam
    return;
  }
  // Two thin iron plates across the chest, plus a laced front seam.
  px(ctx, c - 4, top + 3, vest.plate, 9, 2);
  px(ctx, c - 4, top + 3, vest.hi, 9, 1);
  px(ctx, c - 3, top + 7, vest.plate, 7, 2);
  px(ctx, c, top + 1, vest.lo, 1, span - 2);
}

function drawMaraDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso, style }) {
  const side = directionSide(meta);
  const bob = pose.bob ?? 0;
  const c = torso.bodyCx;

  // Equipped body armor sits under the harness/pouches drawn below.
  if (style.vest) drawLeatherVest(ctx, px, c, shoulderY, hipY, meta, torso, style.vest);

  if (style.fieldHarness) {
    // Low scarf at the neck, not a face-wide red band.
    px(ctx, c - 3, headY + 8 + bob, PALETTE.clothDark, 5, 1);
    px(ctx, c + 1, headY + 9 + bob, PALETTE.clothRed, 2, 1);

    // Harness, belt pouches, and a small sidearm break the coat silhouette.
    const strapSide = meta.back ? -1 : 1;
    linePx(ctx, c - strapSide * 6, shoulderY + 3, c + strapSide * 5, hipY - 3, PALETTE.clothDark);
    px(ctx, c - 4, hipY - 2, PALETTE.rustLight, 2, 1);
    px(ctx, c + 2, hipY - 2, PALETTE.rustLight, 2, 1);

    const packX = c + (meta.side || strapSide) * 7;
    px(ctx, packX - 2, hipY - 12, PALETTE.skinDark, 7, 10);
    px(ctx, packX - 1, hipY - 12, PALETTE.clothTan, 4, 1);
    px(ctx, packX + (side > 0 ? 3 : -2), hipY - 8, PALETTE.stoneDark, 2, 6);

    const holsterX = c - (meta.side || -1) * 9;
    px(ctx, holsterX, hipY - 8, PALETTE.rustDark, 3, 8);
    px(ctx, holsterX + 1, hipY - 8, PALETTE.rustLight, 1, 3);
  }

  // Equipped trinket: a saint-token on a short chain at the sternum.
  if (style.pendant && !meta.back) {
    px(ctx, c, headY + 10 + bob, style.pendant, 1, 4);
    px(ctx, c - 1, headY + 13 + bob, style.pendant, 3, 3);
    px(ctx, c, headY + 14 + bob, PALETTE.rustDark, 1, 1);
  }
}

function drawCutthroatDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const side = directionSide(meta);
  const c = torso.bodyCx;
  const redSide = meta.back ? -1 : 1;

  // Mask slit and stained clerical stole. The figure is still human, but the
  // clothes read as scavenged ritual gear rather than clean raider armor.
  px(ctx, c - 3, headY + 4, PALETTE.void, 5, 1);
  linePx(ctx, c - redSide * 5, shoulderY + 2, c + redSide * 4, hipY + 2 + (pose.cloth ?? 0), PALETTE.clothRed);
  linePx(ctx, c - redSide * 4, shoulderY + 2, c + redSide * 5, hipY, PALETTE.hostRed);

  px(ctx, c - 10, shoulderY + 4, PALETTE.rustMid, 5, 5);
  px(ctx, c - 10, shoulderY + 4, PALETTE.rustLight, 4, 1);
  px(ctx, c + 6, hipY - 8, PALETTE.clothDark, 4, 9);
  px(ctx, c + 7, hipY - 6, PALETTE.skinDark, 2, 3);

  const knifeX = c + side * 9;
  linePx(ctx, knifeX, shoulderY + 9, knifeX + side * 2, hipY - 4, PALETTE.hostBone);
  px(ctx, knifeX, shoulderY + 9, PALETTE.stoneLight, 1, 8);
  px(ctx, c - 1, hipY - 4, PALETTE.hostBone, 2, 2);
}

function drawHostDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, footY, torso }) {
  const c = torso.bodyCx;
  const pulse = pose.bob ? 1 : 0;
  const half = Math.max(6, Math.floor(torso.shoulderW / 2));
  const side = directionSide(meta);
  const openSide = meta.view === 'side' ? side : 1;
  const brokenSide = -openSide;

  // Broken aureole: one side still forms a false holy ring, the other has
  // dropped into splinters behind the skull.
  for (let n = 0; n < 22; n += 1) {
    if (n === 4 || n === 5 || n === 11 || n === 15 || n === 16) continue;
    const a = Math.PI * (0.02 + n * 0.046);
    const bend = Math.cos(a) < 0 ? -3 : 1;
    const hx = c + Math.round(Math.cos(a) * (16 + bend));
    const hy = headY + 4 - Math.round(Math.sin(a) * (13 + (n % 2))) + (pulse && n % 5 === 0 ? 1 : 0);
    px(ctx, hx, hy, PALETTE.hostBone, n % 3 === 0 ? 2 : 1, 1);
  }
  for (let i = 0; i < 5; i += 1) {
    const sx = c + brokenSide * (15 + i);
    const sy = headY + 4 + i * 3;
    px(ctx, sx, sy, i % 2 ? PALETTE.hostGold : PALETTE.hostBone, 2, 1);
  }

  if (meta.back) {
    // From behind: a ridge of bone-thorns erupting up the spine.
    for (let i = 0; i < 7; i += 1) {
      const ty = shoulderY + 2 + i * 3;
      linePx(ctx, c, ty, c, ty - (4 + (i % 2) * 3), PALETTE.hostBone, 1);
      px(ctx, c - 1, ty, PALETTE.hostBone, 3, 1);
    }
    px(ctx, c - half, shoulderY + 5, PALETTE.hostGold, half * 2, 1);
  } else {
    // The chest is pried open unevenly, like failed chapel doors around a
    // black-gold wound. One side hangs lower, which keeps the silhouette human
    // enough to be ugly instead of decorative.
    const cavTop = shoulderY + 5;
    const cavH = Math.max(8, hipY - cavTop - 1);
    px(ctx, c - 5, cavTop, PALETTE.void, 10, cavH + 2);
    px(ctx, c - 3, cavTop + 1, PALETTE.hostBlack, 7, cavH);
    for (let r = 0; r < 5; r += 1) {
      const ry = cavTop + 1 + r * 3;
      const sp = 4 + r;
      px(ctx, c - 4 - sp, ry + (r > 2 ? 1 : 0), PALETTE.hostBone, sp, 1);
      px(ctx, c + 4, ry - (r % 2), PALETTE.hostBone, sp + 1, 1);
      px(ctx, c - 4 - sp, ry + 1, PALETTE.hostGold, 1, 1);
      px(ctx, c + 3 + sp, ry, PALETTE.hostGold, 1, 1);
    }
    const wy = cavTop + 3;
    px(ctx, c - 3, wy, PALETTE.hostRed, 7, 7);
    px(ctx, c - 2, wy + 1, pulse ? PALETTE.hostGlow : PALETTE.hostGold, 4, 5);
    px(ctx, c, wy + 2, pulse ? PALETTE.flash : PALETTE.hostBone, 1, 2);
    // a second screaming mouth low in the ribs, bone teeth
    const my = cavTop + cavH - 3;
    px(ctx, c - 5, my, PALETTE.void, 11, 4);
    for (let t = 0; t < 6; t += 1) px(ctx, c - 5 + t * 2, my, PALETTE.hostBone, 1, 4);
    // black-gold veins radiating from the wound
    linePx(ctx, c, wy + 2, c - half - 1, shoulderY + 2, PALETTE.hostGold);
    linePx(ctx, c, wy + 2, c + half + 1, shoulderY + 3, PALETTE.hostGold);
    linePx(ctx, c, wy + 4, c - 5, hipY + 2, PALETTE.hostGold);
    linePx(ctx, c, wy + 4, c + 5, hipY + 1, PALETTE.hostGold);
    // hanging viscera dripping from the cavity
    px(ctx, c - 2, hipY, PALETTE.hostRed, 2, 5);
    px(ctx, c + 2, hipY, PALETTE.hostRed, 1, 4);
  }

  // Shoulder thorns are not paired cleanly: one side becomes a crown, the other
  // a snapped rack of bone.
  linePx(ctx, c - half, shoulderY + 1, c - half - 7, shoulderY - 7, PALETTE.hostBone, 1);
  linePx(ctx, c - half + 1, shoulderY, c - half - 2, shoulderY - 10, PALETTE.hostBone, 1);
  linePx(ctx, c + half, shoulderY + 1, c + half + 8, shoulderY - 4, PALETTE.hostBone, 1);
  linePx(ctx, c + half - 1, shoulderY, c + half + 2, shoulderY - 9, PALETTE.hostBone, 1);
  px(ctx, c + openSide * (half + 7), shoulderY - 4, PALETTE.hostGold, 1, 3);

  // One prayer-arm is fused across the wound. The other drags low enough that
  // the fingers scrape the floor, giving the creature a penitent, broken gait.
  const dragHandY = footY - 7 + pulse;
  const foldHandY = hipY - 1;
  const dragX = c + openSide * (half + 4);
  const foldX = c + brokenSide * 3;
  linePx(ctx, c + openSide * (half - 1), shoulderY + 4, dragX, dragHandY, PALETTE.hostBone, 2);
  linePx(ctx, c + brokenSide * (half - 1), shoulderY + 5, foldX, foldHandY, PALETTE.hostBone, 2);
  px(ctx, foldX - 2, foldHandY - 2, PALETTE.hostBone, 5, 7);
  px(ctx, foldX - 1, foldHandY, PALETTE.hostBlack, 3, 3);
  for (let f = 0; f < 6; f += 1) {
    px(ctx, dragX + (f - 2), dragHandY, PALETTE.hostBone, 1, 4 + (f % 3));
  }

  // Kneeling mass: cover the clean humanoid legs with wet vestment-flesh, then
  // expose bent shin-bone and a low wound so the body reads as forced down.
  const robeTop = hipY - 2;
  const robeRows = footY - robeTop + 2;
  for (let row = 0; row < robeRows; row += 1) {
    const swell = row < 8 ? row : 8 - Math.max(0, row - 14);
    const taper = Math.max(0, row - 10);
    const w = Math.max(11, half * 2 + 2 + Math.max(0, swell) - Math.floor(taper * 1.8));
    const drag = row > 7 ? Math.floor((row - 7) * 0.35) * openSide : 0;
    const rag = (row % 4) - 1;
    const x = c - Math.floor(w / 2) + drag + rag;
    px(ctx, x, robeTop + row, PALETTE.hostBlack, w, 1);
    if (row % 5 === 2) px(ctx, x + 2, robeTop + row, PALETTE.hostRed, Math.max(3, w - 7), 1);
    if (row % 7 === 0) px(ctx, x + w - 4, robeTop + row, PALETTE.hostGold, 2, 1);
  }
  px(ctx, c - half - 5, footY - 12, PALETTE.hostBone, 10, 3);
  px(ctx, c + half - 4, footY - 8, PALETTE.hostBone, 11, 3);
  linePx(ctx, c - half - 1, footY - 10, c - 3, footY - 4, PALETTE.hostBone, 1);
  linePx(ctx, c + half + 4, footY - 8, c + 5, footY - 3, PALETTE.hostBone, 1);
  px(ctx, c - half - 1, footY - 4, PALETTE.hostGold, half + 3, 1);
  px(ctx, c + 2, footY - 3, PALETTE.hostGold, half - 1, 1);
  px(ctx, c - half + 2, footY - 2, PALETTE.hostRed, half + 1, 2);
  px(ctx, c + 3, footY - 1, PALETTE.hostRed, half - 2, 1);
}

function drawChoirDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const side = directionSide(meta);
  const c = torso.bodyCx;
  const redSide = meta.back ? -1 : 1;

  // Stained clerical stole down the front of the robe.
  linePx(ctx, c - redSide * 5, shoulderY + 2, c + redSide * 4, hipY + 2 + (pose.cloth ?? 0), PALETTE.clothRed);
  linePx(ctx, c - redSide * 4, shoulderY + 3, c + redSide * 5, hipY, PALETTE.hostRed);

  if (!meta.back) {
    // A blood-blackened mouth and chin below the cowl: they eat the opened flesh.
    px(ctx, c - 2, headY + 6, PALETTE.hostRed, 5, 2);
    px(ctx, c - 1, headY + 8, PALETTE.hostRed, 3, 1);
    // First black-gold creeping at the throat — they are slowly opening too.
    px(ctx, c, headY + 9, PALETTE.hostGold, 1, 3);
    // A held strip of pale sacrament-flesh, dripping.
    const hx = c + side * 6;
    px(ctx, hx - 1, hipY - 6, PALETTE.hostBone, 3, 5);
    px(ctx, hx, hipY - 1, PALETTE.hostRed, 1, 3);
    // Blood-soaked hands.
    px(ctx, c - side * 7, hipY - 3, PALETTE.hostRed, 3, 2);
    px(ctx, hx - 1, hipY - 2, PALETTE.hostRed, 3, 1);
  }

  // A hooked bone rite-knife at the hip and a small censer on the belt.
  const knifeX = c + side * 8;
  linePx(ctx, knifeX, shoulderY + 9, knifeX + side * 2, hipY - 3, PALETTE.hostBone);
  px(ctx, knifeX + side * 2, hipY - 3, PALETTE.hostBone, 2, 2);
  px(ctx, c - 9, shoulderY + 5, PALETTE.rustMid, 4, 5);
  px(ctx, c - 9, shoulderY + 5, PALETTE.hostGold, 4, 1);
}

function drawSurvivorManDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const side = directionSide(meta);
  const c = torso.bodyCx;
  // Rope belt, patched work coat, and a rolled sleeping cloth.
  linePx(ctx, c - 5, shoulderY + 5, c + 5, hipY - 5, PALETTE.rustDark);
  px(ctx, c - 6, hipY - 4, PALETTE.rustLight, 12, 2);
  px(ctx, c + side * 7, hipY - 14, PALETTE.clothTan, 5, 13);
  px(ctx, c + side * 7, hipY - 14, PALETTE.stoneDust, 5, 1);
  px(ctx, c - side * 8, shoulderY + 7, PALETTE.rustDark, 5, 4);
  px(ctx, c - side * 8, shoulderY + 7, PALETTE.rustLight, 4, 1);
  if (!meta.back) {
    px(ctx, c - 2, headY + 7 + (pose.bob ?? 0), PALETTE.skinDark, 4, 1);
  }
}

function drawSurvivorWomanDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const side = directionSide(meta);
  const c = torso.bodyCx;
  // Shawl and apron layers make the figure read as a camp civilian, not militia.
  px(ctx, c - 8, shoulderY + 2, PALETTE.clothTan, 16, 3);
  linePx(ctx, c - 7, shoulderY + 4, c - 2, hipY + 2 + (pose.cloth ?? 0), PALETTE.clothTan);
  linePx(ctx, c + 7, shoulderY + 4, c + 2, hipY + 1, PALETTE.stoneDust);
  px(ctx, c - 5, hipY - 6, PALETTE.stoneMid, 10, 8);
  px(ctx, c - 4, hipY - 6, PALETTE.stoneDust, 7, 1);
  px(ctx, c + side * 7, hipY - 11, PALETTE.rustDark, 4, 8);
  px(ctx, c + side * 7, hipY - 11, PALETTE.rustLight, 3, 1);
  if (!meta.back) px(ctx, c + 2, headY + 8 + (pose.bob ?? 0), PALETTE.clothTan, 3, 1);
}

function drawSurvivorChildDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const side = directionSide(meta);
  const c = torso.bodyCx;
  // Oversized coat hem, tiny satchel, and bare bright face.
  px(ctx, c - 6, hipY - 1, PALETTE.clothTan, 12, 3);
  px(ctx, c - 5, hipY + 1, PALETTE.stoneDust, 9, 1);
  linePx(ctx, c - side * 5, shoulderY + 4, c + side * 5, hipY - 3, PALETTE.rustDark);
  px(ctx, c + side * 6, hipY - 8, PALETTE.woodDark, 5, 5);
  px(ctx, c + side * 6, hipY - 8, PALETTE.woodLight, 4, 1);
  if (!meta.back) {
    px(ctx, c - 2, headY + 7 + (pose.bob ?? 0), PALETTE.skinLight, 4, 1);
  }
}

function drawCampStaff(ctx, linePx, x, topY, side, color = PALETTE.woodMid) {
  linePx(ctx, x, topY, x + side * 2, topY + 22, PALETTE.outline, 2);
  linePx(ctx, x, topY, x + side * 2, topY + 22, color, 1);
  px(ctx, x - 1, topY + 3, PALETTE.woodLight, 1, 7);
}

function drawCampBundle(ctx, px, x, y, tone = PALETTE.clothTan) {
  px(ctx, x - 3, y - 1, PALETTE.outline, 8, 13);
  px(ctx, x - 2, y, tone, 6, 11);
  px(ctx, x - 1, y, PALETTE.stoneDust, 4, 1);
  px(ctx, x - 3, y + 5, PALETTE.rustDark, 8, 1);
}

function drawCampJar(ctx, px, x, y) {
  px(ctx, x - 3, y, PALETTE.outline, 7, 9);
  px(ctx, x - 2, y - 1, PALETTE.stoneLight, 5, 2);
  px(ctx, x - 2, y + 1, PALETTE.stoneDust, 5, 7);
  px(ctx, x + 2, y + 2, PALETTE.stoneDark, 1, 6);
  px(ctx, x - 1, y + 1, PALETTE.hostBone, 1, 3);
}

function drawToolRoll(ctx, px, x, y) {
  px(ctx, x - 4, y - 1, PALETTE.outline, 10, 8);
  px(ctx, x - 3, y, PALETTE.clothDark, 8, 6);
  px(ctx, x - 2, y, PALETTE.stoneDust, 6, 1);
  px(ctx, x - 2, y + 2, PALETTE.rustLight, 1, 5);
  px(ctx, x + 1, y + 1, PALETTE.stoneLight, 1, 6);
  px(ctx, x + 4, y + 2, PALETTE.woodLight, 1, 4);
}

function drawCane(ctx, linePx, x, topY, side) {
  linePx(ctx, x, topY, x + side * 2, topY + 18, PALETTE.woodDark, 2);
  linePx(ctx, x, topY, x + side * 2, topY + 18, PALETTE.woodLight, 1);
  px(ctx, x - side * 2, topY, PALETTE.woodLight, 3, 1);
}

function drawShoulderPlate(ctx, px, x, y, side, color = PALETTE.stoneLight) {
  px(ctx, x - side * 2, y - 1, PALETTE.outline, 7, 6);
  px(ctx, x - side * 1, y, color, 5, 4);
  px(ctx, x - side * 1, y, PALETTE.stoneDust, 4, 1);
  px(ctx, x + side * 3, y + 2, PALETTE.stoneDark, 1, 3);
}

function drawSmallBook(ctx, px, x, y, color = PALETTE.woodMid) {
  px(ctx, x - 3, y - 1, PALETTE.outline, 8, 9);
  px(ctx, x - 2, y, color, 6, 7);
  px(ctx, x - 1, y, PALETTE.clothTan, 4, 1);
  px(ctx, x + 1, y + 1, PALETTE.rustDark, 1, 6);
  px(ctx, x - 1, y + 4, PALETTE.stoneDust, 4, 1);
}

function drawBandageSling(ctx, linePx, c, shoulderY, hipY, side) {
  linePx(ctx, c - side * 7, shoulderY + 4, c + side * 3, hipY - 4, PALETTE.hostBone, 1);
  px(ctx, c + side * 1, hipY - 5, PALETTE.hostBone, 7, 4);
  px(ctx, c + side * 2, hipY - 4, PALETTE.stoneDust, 5, 1);
}

function drawMedicineBag(ctx, px, x, y) {
  px(ctx, x - 4, y - 1, PALETTE.outline, 10, 12);
  px(ctx, x - 3, y, PALETTE.clothTan, 8, 10);
  px(ctx, x - 2, y, PALETTE.hostBone, 6, 1);
  px(ctx, x - 1, y + 3, PALETTE.clothRed, 2, 6);
  px(ctx, x - 3, y + 5, PALETTE.clothRed, 8, 2);
}

function drawMessageTube(ctx, linePx, x, y, side) {
  linePx(ctx, x, y, x + side * 4, y + 12, PALETTE.woodDark, 3);
  linePx(ctx, x, y, x + side * 4, y + 12, PALETTE.woodLight, 1);
  px(ctx, x + side * 3, y + 11, PALETTE.hostBone, 2, 2);
}

function drawRopeCoil(ctx, px, x, y) {
  px(ctx, x - 4, y - 1, PALETTE.outline, 10, 9);
  for (let row = 0; row < 7; row += 2) {
    px(ctx, x - 3, y + row, PALETTE.rustLight, 8, 1);
    px(ctx, x - 2, y + row + 1, PALETTE.rustDark, 6, 1);
  }
}

function drawCandleTray(ctx, px, linePx, c, y, side, count = 3) {
  linePx(ctx, c - side * 8, y + 5, c + side * 7, y + 7, PALETTE.stoneDark, 1);
  px(ctx, c - 8, y + 7, PALETTE.rustMid, 16, 2);
  for (let i = 0; i < count; i += 1) {
    const x = c - 5 + i * 5;
    px(ctx, x, y + 1, PALETTE.hostBone, 2, 6);
    px(ctx, x, y, PALETTE.ember, 1, 1);
    px(ctx, x + 1, y + 1, PALETTE.stoneDust, 1, 5);
  }
}

function drawChain(ctx, px, x, y, side, links = 5) {
  for (let i = 0; i < links; i += 1) {
    const lx = x + side * (i % 2);
    px(ctx, lx, y + i * 3, PALETTE.stoneLight, 3, 1);
    px(ctx, lx + 1, y + i * 3 + 1, PALETTE.stoneDark, 1, 2);
  }
}

function drawHumanModelExtras(args) {
  const { ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso, style } = args;
  const side = directionSide(meta);
  const c = torso.bodyCx;
  const bob = pose.bob ?? 0;
  const kits = Array.isArray(style.modelKits) ? style.modelKits : [];

  for (const kit of kits) {
    switch (kit) {
      case 'ledger':
        drawSmallBook(ctx, px, c + side * 9, hipY - 13, PALETTE.woodMid);
        break;
      case 'crate-pack':
        drawCampBundle(ctx, px, c + side * 9, hipY - 17, PALETTE.rustDark);
        drawCampBundle(ctx, px, c - side * 9, hipY - 10, PALETTE.clothTan);
        break;
      case 'cane':
        drawCane(ctx, linePx, c - side * 10, shoulderY + 8, -side);
        break;
      case 'tool-roll':
        drawToolRoll(ctx, px, c + side * 8, hipY - 12);
        break;
      case 'bandage-sling':
        drawBandageSling(ctx, linePx, c, shoulderY, hipY, side);
        break;
      case 'medicine-bag':
        drawMedicineBag(ctx, px, c + side * 9, hipY - 14);
        break;
      case 'water-jars':
        drawCampJar(ctx, px, c + side * 9, hipY - 13);
        drawCampJar(ctx, px, c - side * 9, hipY - 9);
        break;
      case 'message-tube':
        drawMessageTube(ctx, linePx, c + side * 8, shoulderY + 4, side);
        break;
      case 'long-apron':
        px(ctx, c - 5, shoulderY + 7, PALETTE.clothTan, 10, 15);
        px(ctx, c - 4, shoulderY + 7, PALETTE.hostBone, 7, 1);
        px(ctx, c - 3, hipY - 4, PALETTE.stoneDust, 7, 1);
        break;
      case 'prayer-cord':
        if (!meta.back) {
          linePx(ctx, c - 3, headY + 9 + bob, c + 2, hipY - 3, PALETTE.hostGold, 1);
          px(ctx, c + 1, hipY - 4, PALETTE.hostBone, 2, 3);
        }
        break;
      case 'scarred-face':
        if (!meta.back) linePx(ctx, c - 3, headY + 3 + bob, c + 2, headY + 6 + bob, PALETTE.rustDark, 1);
        break;
      case 'shoulder-plate':
        drawShoulderPlate(ctx, px, c - side * 10, shoulderY + 4, -side);
        break;
      case 'rope-coil':
        drawRopeCoil(ctx, px, c + side * 9, hipY - 12);
        break;
      case 'tally-tags':
        px(ctx, c - side * 9, shoulderY + 7, PALETTE.hostBone, 2, 5);
        px(ctx, c - side * 7, shoulderY + 9, PALETTE.stoneLight, 2, 5);
        px(ctx, c - side * 5, shoulderY + 8, PALETTE.hostGold, 2, 5);
        break;
      case 'child-token':
        if (!meta.back) px(ctx, c, headY + 10 + bob, PALETTE.hostGold, 2, 3);
        break;
      case 'candle-tray':
        if (!meta.back) drawCandleTray(ctx, px, linePx, c + side * 1, shoulderY + 8, side, 3);
        break;
      case 'throat-glass':
        if (!meta.back) {
          px(ctx, c - 3, headY + 8 + bob, PALETTE.hostRed, 7, 2);
          drawSmallBook(ctx, px, c + side * 8, hipY - 11, PALETTE.clothDark);
        }
        px(ctx, c - side * 9, hipY - 8, PALETTE.stoneLight, 4, 4);
        break;
      case 'sacrament-flesh':
        if (!meta.back) {
          px(ctx, c - side * 7, hipY - 8, PALETTE.hostBone, 5, 5);
          px(ctx, c - side * 6, hipY - 5, PALETTE.hostRed, 3, 2);
        }
        break;
      case 'bone-scroll':
        drawSmallBook(ctx, px, c + side * 9, hipY - 14, PALETTE.hostBone);
        px(ctx, c + side * 7, hipY - 9, PALETTE.hostGold, 5, 1);
        break;
      case 'veil':
        px(ctx, c - 5, headY + 1 + bob, PALETTE.clothDark, 10, 9);
        px(ctx, c - 4, headY + 2 + bob, PALETTE.stoneDark, 8, 1);
        px(ctx, c - 3, headY + 5 + bob, PALETTE.void, 6, 2);
        break;
      case 'chain':
        drawChain(ctx, px, c + side * 8, shoulderY + 6, side, 6);
        drawChain(ctx, px, c - side * 9, hipY - 13, -side, 4);
        break;
      case 'ash-mask':
        if (!meta.back) {
          px(ctx, c - 3, headY + 3 + bob, PALETTE.hostBone, 6, 4);
          px(ctx, c - 2, headY + 4 + bob, PALETTE.void, 4, 1);
        }
        break;
      case 'confessor-staff':
        drawCampStaff(ctx, linePx, c - side * 11, shoulderY + 4, -side, PALETTE.woodLight);
        px(ctx, c - side * 11, shoulderY + 2, PALETTE.hostBone, 3, 3);
        px(ctx, c - side * 11, shoulderY + 3, PALETTE.hostRed, 1, 1);
        break;
      case 'knife-belt':
        for (let i = 0; i < 3; i += 1) {
          const x = c - 3 + i * 3;
          linePx(ctx, x, hipY - 3, x + side * 2, hipY + 4, PALETTE.hostBone, 1);
        }
        break;
      case 'raider-cleaver':
        linePx(ctx, c + side * 8, shoulderY + 8, c + side * 10, hipY - 3, PALETTE.stoneLight, 2);
        px(ctx, c + side * 10, shoulderY + 9, PALETTE.hostBone, 4, 6);
        break;
      case 'thin-pack':
        px(ctx, c + side * 8, hipY - 18, PALETTE.outline, 5, 16);
        px(ctx, c + side * 8, hipY - 17, PALETTE.clothDark, 3, 14);
        px(ctx, c + side * 8, hipY - 17, PALETTE.stoneDust, 2, 1);
        break;
      default:
        break;
    }
  }
}

function drawHumanModelDetails(args) {
  const { style } = args;
  if (style.modelBase === 'choir') {
    drawChoirDetails(args);
  } else if (style.modelBase === 'cutthroat') {
    drawCutthroatDetails(args);
  } else {
    drawSurvivorVariantDetails(args);
  }
  drawHumanModelExtras(args);
}

function drawSurvivorVariantDetails(args) {
  const { ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso, style } = args;
  const side = directionSide(meta);
  const c = torso.bodyCx;
  const bob = pose.bob ?? 0;

  switch (style.campBase) {
    case 'shawl':
      drawSurvivorWomanDetails(args);
      break;
    case 'child':
      drawSurvivorChildDetails(args);
      break;
    default:
      drawSurvivorManDetails(args);
      break;
  }

  switch (style.campKit) {
    case 'matron':
      px(ctx, c - 6, shoulderY + 1, PALETTE.hostBone, 12, 1);
      px(ctx, c - 7, shoulderY + 3, PALETTE.clothDark, 14, 2);
      drawCampStaff(ctx, linePx, c - side * 10, shoulderY + 6, -side, PALETTE.woodLight);
      if (!meta.back) px(ctx, c - 1, headY + 8 + bob, PALETTE.hostGold, 2, 1);
      break;
    case 'quartermaster':
      drawCampBundle(ctx, px, c + side * 9, hipY - 15, PALETTE.clothTan);
      px(ctx, c - side * 8, hipY - 11, PALETTE.woodMid, 6, 8);
      px(ctx, c - side * 8, hipY - 11, PALETTE.hostBone, 5, 1);
      if (!meta.back) {
        px(ctx, c - 4, shoulderY + 8, PALETTE.clothBlueDark, 8, 4);
        px(ctx, c - 3, shoulderY + 8, PALETTE.clothBlue, 5, 1);
      }
      break;
    case 'settler':
      drawCampStaff(ctx, linePx, c + side * 11, shoulderY + 5, side, PALETTE.woodMid);
      px(ctx, c - side * 9, hipY - 8, PALETTE.rustMid, 5, 5);
      px(ctx, c - side * 9, hipY - 8, PALETTE.rustLight, 3, 1);
      break;
    case 'runner':
      linePx(ctx, c - side * 6, shoulderY + 4, c + side * 6, hipY - 2, PALETTE.clothBlueDark);
      px(ctx, c + side * 8, hipY - 10, PALETTE.woodDark, 6, 8);
      px(ctx, c + side * 8, hipY - 10, PALETTE.woodLight, 4, 1);
      px(ctx, c - side * 9, shoulderY + 7, PALETTE.stoneLight, 4, 2);
      break;
    case 'cook':
      px(ctx, c - 5, shoulderY + 8, PALETTE.clothTan, 10, 13);
      px(ctx, c - 4, shoulderY + 8, PALETTE.hostBone, 7, 1);
      px(ctx, c + side * 8, hipY - 7, PALETTE.stoneDark, 6, 5);
      px(ctx, c + side * 9, hipY - 8, PALETTE.stoneLight, 4, 1);
      linePx(ctx, c - side * 8, shoulderY + 9, c - side * 9, hipY - 3, PALETTE.woodLight);
      break;
    case 'mender':
      drawToolRoll(ctx, px, c + side * 8, hipY - 12);
      linePx(ctx, c - side * 6, shoulderY + 5, c + side * 5, hipY - 2, PALETTE.rustLight);
      px(ctx, c - side * 9, hipY - 4, PALETTE.stoneLight, 5, 2);
      break;
    case 'water':
      drawCampJar(ctx, px, c + side * 9, hipY - 13);
      drawCampJar(ctx, px, c - side * 8, hipY - 9);
      linePx(ctx, c - side * 6, shoulderY + 5, c + side * 8, hipY - 4, PALETTE.clothDark);
      break;
    case 'chapel-hand':
      drawCampBundle(ctx, px, c + side * 8, hipY - 13, PALETTE.stoneDust);
      px(ctx, c - side * 9, shoulderY + 8, PALETTE.rustDark, 5, 5);
      px(ctx, c - side * 9, shoulderY + 8, PALETTE.rustLight, 3, 1);
      px(ctx, c - 4, hipY - 3, PALETTE.hostBone, 8, 1);
      break;
    case 'nurse':
      px(ctx, c - 7, shoulderY + 3, PALETTE.stoneDust, 14, 2);
      px(ctx, c + side * 8, hipY - 13, PALETTE.clothTan, 7, 10);
      px(ctx, c + side * 9, hipY - 11, PALETTE.hostBone, 5, 1);
      px(ctx, c + side * 10, hipY - 13, PALETTE.clothRed, 2, 7);
      px(ctx, c + side * 8, hipY - 10, PALETTE.clothRed, 6, 2);
      break;
    case 'blue-child':
      px(ctx, c + side * 7, hipY - 8, PALETTE.clothBlueDark, 5, 5);
      px(ctx, c + side * 7, hipY - 8, PALETTE.clothBlue, 4, 1);
      if (!meta.back) px(ctx, c - 2, shoulderY + 8, PALETTE.clothBlue, 4, 3);
      break;
    case 'chalk-child':
      px(ctx, c - side * 7, hipY - 8, PALETTE.clothTan, 5, 5);
      px(ctx, c - side * 6, hipY - 8, PALETTE.hostBone, 3, 1);
      if (!meta.back) {
        px(ctx, c + 3, hipY - 4, PALETTE.hostBone, 1, 4);
        px(ctx, c + 2, hipY - 1, PALETTE.stoneDust, 3, 1);
      }
      break;
    default:
      break;
  }
}

// Mara's body: proportions, skin, hair, and the things that never change with
// her kit. Clothes, boots, hood, armor, and field harness are equipment layers.
const MARA_BODY = {
  shoulders: 15,
  waist: 9,
  torsoLength: 16,
  legLength: 24,
  headHeight: 9,
  legSize: 2,
  armSize: 2,
  coatHi: PALETTE.skinLight,
  coat: PALETTE.skinMid,
  coatLo: PALETTE.skinDark,
  coatDk: PALETTE.clothDark,
  coatTail: 0,
  pantsHi: PALETTE.skinLight,
  pants: PALETTE.skinMid,
  pantsLo: PALETTE.skinDark,
  pantsDk: PALETTE.clothDark,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  skinLo: PALETTE.skinDark,
  skinDk: PALETTE.clothDark,
  hair: PALETTE.woodMid,
  hairHi: PALETTE.woodLight,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.stoneDark,
  belt: null,
  weapon: PALETTE.stoneLight,
  bareFeet: true,
  fieldHarness: false,
  anatomy: 'vulva',
  anatomyVisible: true,
  hunch: 0,
  decorate: drawMaraDetails
};

const MARA_DEFAULT_APPEARANCE = Object.freeze({
  bodyFrame: 'feminine',
  anatomy: 'vulva'
});

const MARA_BODY_FRAMES = Object.freeze({
  feminine: Object.freeze({ shoulders: 15, waist: 9, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 }),
  masculine: Object.freeze({ shoulders: 17, waist: 10, torsoLength: 17, legLength: 24, legSize: 2, armSize: 2 }),
  androgynous: Object.freeze({ shoulders: 15, waist: 8, torsoLength: 16, legLength: 24, legSize: 2, armSize: 2 })
});

const MARA_ANATOMY_IDS = new Set(['vulva', 'penis', 'smooth', 'intersex']);

// How each worn item changes the figure. Item JSON may carry its own `visual`
// block (resolved first); these are the canonical fallbacks for the slice's
// loadout, authored so a fully-dressed Mara matches her established sprite.
const MARA_ITEM_VISUALS = {
  'censure-field-coat': {
    coat: 'stoneDust',
    coatHi: 'hostBone',
    coatLo: 'stoneMid',
    coatDk: 'skinDark',
    coatTail: 7,
    pants: 'clothDark',
    pantsHi: 'stoneDust',
    pantsLo: 'stoneDark',
    pantsDk: 'void',
    belt: 'rustDark',
    fieldHarness: true
  },
  'scarred-leather-vest': { vest: { mid: 'rustMid', hi: 'rustLight', lo: 'rustDark', plate: 'stoneLight' } },
  'ash-road-boots': { boot: 'rustDark', bootHi: 'rustMid', bootLo: 'stoneDark' },
  'censure-hood': { hood: 'clothDark', hoodHi: 'stoneDark' },
  'tarnished-saint-token': { pendant: 'hostGold' },
  'iron-vow-ring': { ring: 'stoneLight' },
  'mourning-ring': { ring: 'clothDark' }
};

const MARA_DEFAULT_EQUIPMENT = {
  clothes: 'censure-field-coat',
  armor: 'scarred-leather-vest',
  boots: 'ash-road-boots',
  helmet: 'censure-hood',
  trinket: 'tarnished-saint-token',
  ring1: 'iron-vow-ring',
  ring2: 'mourning-ring'
};

function pal(ref, fallback) {
  if (ref == null) return fallback;
  if (typeof ref === 'string') return PALETTE[ref] ?? ref;
  return fallback;
}

function resolveVest(vest) {
  if (!vest) return null;
  return {
    mid: pal(vest.mid, PALETTE.rustMid),
    hi: pal(vest.hi, PALETTE.rustLight),
    lo: pal(vest.lo, PALETTE.rustDark),
    plate: pal(vest.plate, PALETTE.stoneLight)
  };
}

function normalizeMaraAppearance(appearance = {}) {
  const bodyFrame = typeof appearance.bodyFrame === 'string' && MARA_BODY_FRAMES[appearance.bodyFrame]
    ? appearance.bodyFrame
    : MARA_DEFAULT_APPEARANCE.bodyFrame;
  const anatomy = typeof appearance.anatomy === 'string' && MARA_ANATOMY_IDS.has(appearance.anatomy)
    ? appearance.anatomy
    : MARA_DEFAULT_APPEARANCE.anatomy;
  return { bodyFrame, anatomy };
}

function genericVisualForSlot(slot) {
  switch (slot) {
    case 'clothes': return {
      coat: 'stoneDust',
      coatHi: 'hostBone',
      coatLo: 'stoneMid',
      coatDk: 'skinDark',
      coatTail: 6,
      pants: 'clothDark',
      pantsHi: 'stoneDust',
      pantsLo: 'stoneDark',
      pantsDk: 'void',
      belt: 'rustDark',
      fieldHarness: true
    };
    case 'armor': return { vest: { mid: 'rustMid', hi: 'rustLight', lo: 'rustDark', plate: 'stoneLight' } };
    case 'boots': return { boot: 'rustDark', bootHi: 'rustMid', bootLo: 'stoneDark' };
    case 'helmet': return { hood: 'clothDark', hoodHi: 'stoneDark' };
    case 'trinket': return { pendant: 'hostGold' };
    default: return {};
  }
}

// Build the final draw style from the worn items, slot by slot. Empty slots keep
// the naked base body, so taking every wearable item off is visually true.
function composeMaraStyle(visuals, appearance = {}) {
  const style = { ...MARA_BODY };
  const normalizedAppearance = normalizeMaraAppearance(appearance);
  Object.assign(style, MARA_BODY_FRAMES[normalizedAppearance.bodyFrame]);
  style.bodyFrame = normalizedAppearance.bodyFrame;
  style.anatomy = normalizedAppearance.anatomy;
  style.anatomyVisible = true;

  const clothes = visuals.clothes;
  if (clothes) {
    style.coat = pal(clothes.coat, PALETTE.stoneDust);
    style.coatHi = pal(clothes.coatHi, style.coat);
    style.coatLo = pal(clothes.coatLo, style.coat);
    style.coatDk = pal(clothes.coatDk, style.coatLo);
    style.coatTail = clothes.coatTail ?? 0;
    style.pants = pal(clothes.pants, PALETTE.clothDark);
    style.pantsHi = pal(clothes.pantsHi, PALETTE.stoneDust);
    style.pantsLo = pal(clothes.pantsLo, PALETTE.stoneDark);
    style.pantsDk = pal(clothes.pantsDk, PALETTE.void);
    style.belt = pal(clothes.belt, PALETTE.rustDark);
    style.fieldHarness = clothes.fieldHarness !== false;
    style.anatomyVisible = false;
  }

  style.vest = visuals.armor ? resolveVest(visuals.armor.vest ?? visuals.armor) : null;
  if (style.vest && !style.belt) style.belt = PALETTE.rustDark;
  if (style.vest) style.fieldHarness = true;

  if (visuals.boots) {
    style.boot = pal(visuals.boots.boot, PALETTE.rustDark);
    style.bootHi = pal(visuals.boots.bootHi, PALETTE.rustMid);
    style.bootLo = pal(visuals.boots.bootLo, PALETTE.stoneDark);
    style.bareFeet = false;
  }

  if (visuals.helmet) {
    style.hood = pal(visuals.helmet.hood, PALETTE.clothDark);
    style.hoodHi = pal(visuals.helmet.hoodHi, PALETTE.stoneDark);
    style.bareHead = false;
  } else {
    style.bareHead = true;
  }

  style.pendant = visuals.trinket ? pal(visuals.trinket.pendant, PALETTE.hostGold) : null;

  return style;
}

// Turn an equipment snapshot ({ clothes: itemId, ... }) into a draw style,
// preferring each item's own `visual` block and falling back to the canonical
// table, then a generic per-slot look for unknown gear.
export function deriveMaraStyle(equipment = {}, itemDefs = {}, appearance = {}) {
  const visuals = {};
  for (const [slot, itemId] of Object.entries(equipment)) {
    if (!itemId) continue;
    const baseSlot = slot === 'ring1' || slot === 'ring2' ? 'ring' : slot;
    visuals[baseSlot] =
      itemDefs?.[itemId]?.visual ?? MARA_ITEM_VISUALS[itemId] ?? genericVisualForSlot(baseSlot);
  }
  return composeMaraStyle(visuals, appearance);
}

const CUT_STYLE = {
  shoulders: 16,
  waist: 9,
  torsoLength: 17,
  legLength: 23,
  headHeight: 9,
  legSize: 2,
  armSize: 2,
  coatTail: 8,
  coatHi: PALETTE.stoneDust,
  coat: PALETTE.stoneMid,
  coatLo: PALETTE.stoneDark,
  coatDk: PALETTE.void,
  pantsHi: PALETTE.stoneMid,
  pants: PALETTE.stoneDark,
  pantsLo: PALETTE.void,
  pantsDk: PALETTE.void,
  boot: PALETTE.rustDark,
  bootHi: PALETTE.rustMid,
  bootLo: PALETTE.void,
  skinHi: PALETTE.skinMid,
  skin: PALETTE.skinDark,
  skinLo: PALETTE.clothDark,
  skinDk: PALETTE.void,
  hair: PALETTE.clothDark,
  hairHi: PALETTE.rustDark,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.rustDark,
  belt: PALETTE.rustDark,
  weapon: PALETTE.hostBone,
  hunch: 2,
  maskedHead: true,
  decorate: drawCutthroatDetails
};

const CHOIR_STYLE = {
  ...CUT_STYLE,
  coatHi: PALETTE.hostBone,
  coat: PALETTE.clothRed,
  coatLo: PALETTE.rustDark,
  pantsHi: PALETTE.stoneDust,
  pants: PALETTE.clothDark,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.hostBone,
  belt: PALETTE.hostGold,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  skinLo: PALETTE.skinDark,
  weapon: PALETTE.hostBone,
  hunch: 3,
  decorate: drawChoirDetails
};

const PEN_STYLE = {
  shoulders: 24,
  waist: 11,
  torsoLength: 25,
  legLength: 22,
  headHeight: 11,
  legSize: 3,
  armSize: 3,
  coatTail: 13,
  coatHi: PALETTE.hostGold,
  coat: PALETTE.hostBlack,
  coatLo: PALETTE.void,
  coatDk: PALETTE.void,
  pantsHi: PALETTE.hostGold,
  pants: PALETTE.hostBlack,
  pantsLo: PALETTE.void,
  pantsDk: PALETTE.void,
  boot: PALETTE.hostBlack,
  bootHi: PALETTE.hostRed,
  bootLo: PALETTE.void,
  skinHi: PALETTE.hostBone,
  skin: PALETTE.hostBone,
  skinLo: PALETTE.hostGold,
  skinDk: PALETTE.hostBlack,
  hair: PALETTE.hostBlack,
  hairHi: PALETTE.hostGold,
  hood: PALETTE.hostBlack,
  hoodHi: PALETTE.hostGold,
  belt: PALETTE.hostRed,
  weapon: PALETTE.hostBone,
  hunch: 11,
  hostHead: true,
  decorate: drawHostDetails
};

const SURVIVOR_MAN_STYLE = {
  shoulders: 15,
  waist: 9,
  torsoLength: 16,
  legLength: 23,
  headHeight: 9,
  legSize: 2,
  armSize: 2,
  coatTail: 5,
  coatHi: PALETTE.stoneDust,
  coat: PALETTE.stoneMid,
  coatLo: PALETTE.stoneDark,
  coatDk: PALETTE.void,
  pantsHi: PALETTE.stoneLight,
  pants: PALETTE.clothDark,
  pantsLo: PALETTE.stoneDark,
  pantsDk: PALETTE.void,
  boot: PALETTE.rustDark,
  bootHi: PALETTE.rustMid,
  bootLo: PALETTE.void,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  skinLo: PALETTE.skinDark,
  skinDk: PALETTE.clothDark,
  hair: PALETTE.woodDark,
  hairHi: PALETTE.woodLight,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.stoneDark,
  belt: PALETTE.rustDark,
  weapon: PALETTE.stoneLight,
  hunch: 1,
  decorate: drawSurvivorManDetails
};

const SURVIVOR_WOMAN_STYLE = {
  ...SURVIVOR_MAN_STYLE,
  shoulders: 13,
  waist: 8,
  torsoLength: 17,
  coatTail: 8,
  coatHi: PALETTE.clothTan,
  coat: PALETTE.stoneDust,
  coatLo: PALETTE.stoneMid,
  pantsHi: PALETTE.stoneDust,
  pants: PALETTE.stoneDark,
  hair: PALETTE.woodMid,
  hairHi: PALETTE.woodLight,
  decorate: drawSurvivorWomanDetails
};

const SURVIVOR_CHILD_STYLE = {
  ...SURVIVOR_MAN_STYLE,
  shoulders: 11,
  waist: 7,
  torsoLength: 13,
  legLength: 17,
  headHeight: 9,
  legSize: 1,
  armSize: 1,
  coatTail: 5,
  coatHi: PALETTE.clothTan,
  coat: PALETTE.stoneMid,
  coatLo: PALETTE.stoneDark,
  boot: PALETTE.rustDark,
  bootHi: PALETTE.rustMid,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  hunch: 0,
  decorate: drawSurvivorChildDetails
};

const SURVIVOR_VARIANTS = {
  selka: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'matron',
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothTan,
    coatLo: PALETTE.stoneDust,
    hair: PALETTE.stoneDark,
    hairHi: PALETTE.stoneDust,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  mirel: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'quartermaster',
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  oren: {
    ...SURVIVOR_MAN_STYLE,
    campKit: 'settler',
    shoulders: 16,
    waist: 10,
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.woodLight,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  tomas: {
    ...SURVIVOR_MAN_STYLE,
    campKit: 'runner',
    shoulders: 14,
    waist: 8,
    legLength: 24,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneLight,
    coatLo: PALETTE.stoneDark,
    pants: PALETTE.clothBlueDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawSurvivorVariantDetails
  },
  runa: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'cook',
    coatHi: PALETTE.clothTan,
    coat: PALETTE.rustDark,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  istra: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'mender',
    shoulders: 14,
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    pants: PALETTE.clothDark,
    hood: PALETTE.stoneDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawSurvivorVariantDetails
  },
  nessa: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'water',
    coatHi: PALETTE.clothBlue,
    coat: PALETTE.clothBlueDark,
    coatLo: PALETTE.void,
    pantsHi: PALETTE.stoneLight,
    pants: PALETTE.stoneMid,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  dalia: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'chapel-hand',
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hair: PALETTE.woodLight,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  hanne: {
    ...SURVIVOR_WOMAN_STYLE,
    campBase: 'shawl',
    campKit: 'nurse',
    coatHi: PALETTE.hostBone,
    coat: PALETTE.stoneDust,
    coatLo: PALETTE.stoneDark,
    hood: PALETTE.clothTan,
    hoodHi: PALETTE.hostBone,
    decorate: drawSurvivorVariantDetails
  },
  corin: {
    ...SURVIVOR_CHILD_STYLE,
    campBase: 'child',
    campKit: 'blue-child',
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.clothBlueDark,
    coatLo: PALETTE.void,
    hair: PALETTE.woodLight,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  },
  eda: {
    ...SURVIVOR_CHILD_STYLE,
    campBase: 'child',
    campKit: 'chalk-child',
    coatHi: PALETTE.clothTan,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawSurvivorVariantDetails
  }
};

const HUMAN_BODY_PARTS = Object.freeze({
  average: Object.freeze({ width: 42, height: 62, style: Object.freeze({}) }),
  compact: Object.freeze({ width: 42, height: 62, style: Object.freeze({ shoulders: 13, waist: 8 }) }),
  sturdy: Object.freeze({ width: 44, height: 62, style: Object.freeze({ shoulders: 15, waist: 11 }) }),
  heavy: Object.freeze({ width: 46, height: 62, style: Object.freeze({ shoulders: 18, waist: 14, torsoLength: 17, legLength: 21 }) }),
  broad: Object.freeze({ width: 48, height: 64, style: Object.freeze({ shoulders: 21, waist: 12, torsoLength: 18, legLength: 23, armSize: 3 }) }),
  lean: Object.freeze({ width: 40, height: 64, style: Object.freeze({ shoulders: 12, waist: 7, torsoLength: 17, legLength: 25 }) }),
  gaunt: Object.freeze({ width: 38, height: 62, style: Object.freeze({ shoulders: 12, waist: 7, torsoLength: 17, legLength: 24, hunch: 3 }) }),
  teen: Object.freeze({ width: 38, height: 56, style: Object.freeze({ shoulders: 12, waist: 7, torsoLength: 14, legLength: 19 }) }),
  child: Object.freeze({ width: 36, height: 50, style: Object.freeze({}) }),
  'old-stooped': Object.freeze({ width: 44, height: 64, style: Object.freeze({ shoulders: 14, waist: 9, legLength: 21, hunch: 8 }) }),
  'old-bent': Object.freeze({ width: 42, height: 60, style: Object.freeze({ shoulders: 13, waist: 8, torsoLength: 16, legLength: 21, hunch: 6 }) }),
  'old-small': Object.freeze({ width: 40, height: 60, style: Object.freeze({ shoulders: 11, waist: 8, torsoLength: 16, legLength: 20, hunch: 5 }) })
});

const HUMAN_OUTFIT_PARTS = Object.freeze({
  'settlement-shawl': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    accent: 'bare-brown',
    style: Object.freeze({
      campBase: 'shawl',
      coatHi: PALETTE.hostBone,
      coat: PALETTE.clothTan,
      coatLo: PALETTE.stoneDust,
      pants: PALETTE.stoneDark
    })
  }),
  'settlement-quartermaster': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    accent: 'bare-brown',
    style: Object.freeze({
      campBase: 'shawl',
      campKit: 'quartermaster',
      coatHi: PALETTE.stoneDust,
      coat: PALETTE.stoneMid,
      coatLo: PALETTE.clothDark
    })
  }),
  'settlement-work-coat': Object.freeze({
    base: 'man',
    modelBase: 'survivor',
    accent: 'bare-brown',
    style: Object.freeze({
      campKit: 'settler',
      coatHi: PALETTE.stoneLight,
      coat: PALETTE.stoneMid,
      coatLo: PALETTE.stoneDark,
      pants: PALETTE.clothDark
    })
  }),
  'settlement-runner': Object.freeze({
    base: 'man',
    modelBase: 'survivor',
    body: 'lean',
    accent: 'dark-hood',
    style: Object.freeze({
      campKit: 'runner',
      coatHi: PALETTE.stoneDust,
      coat: PALETTE.stoneLight,
      coatLo: PALETTE.stoneDark,
      pants: PALETTE.clothBlueDark
    })
  }),
  'settlement-cook': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    body: 'sturdy',
    accent: 'bare-light',
    style: Object.freeze({
      campBase: 'shawl',
      campKit: 'cook',
      coatHi: PALETTE.clothTan,
      coat: PALETTE.rustDark,
      coatLo: PALETTE.clothDark
    })
  }),
  'settlement-mender': Object.freeze({
    base: 'man',
    modelBase: 'survivor',
    accent: 'bare-grey',
    style: Object.freeze({
      campKit: 'mender',
      coatHi: PALETTE.stoneDust,
      coat: PALETTE.stoneMid,
      coatLo: PALETTE.clothDark,
      pants: PALETTE.stoneDark
    })
  }),
  'settlement-water-carrier': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    accent: 'blue-cloth',
    style: Object.freeze({
      campBase: 'shawl',
      campKit: 'water',
      coatHi: PALETTE.clothBlue,
      coat: PALETTE.clothBlueDark,
      coatLo: PALETTE.void,
      pantsHi: PALETTE.stoneLight,
      pants: PALETTE.stoneMid
    })
  }),
  'settlement-chapel-hand': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    accent: 'bare-light',
    style: Object.freeze({
      campBase: 'shawl',
      campKit: 'chapel-hand',
      coatHi: PALETTE.stoneDust,
      coat: PALETTE.clothDark,
      coatLo: PALETTE.void,
      pants: PALETTE.stoneDark
    })
  }),
  'settlement-nurse': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    body: 'compact',
    accent: 'pale-hood',
    style: Object.freeze({
      campBase: 'shawl',
      campKit: 'nurse',
      coatHi: PALETTE.hostBone,
      coat: PALETTE.stoneDust,
      coatLo: PALETTE.stoneDark
    })
  }),
  'settlement-child-blue': Object.freeze({
    base: 'child',
    modelBase: 'survivor',
    body: 'child',
    accent: 'bare-light',
    style: Object.freeze({
      campBase: 'child',
      campKit: 'blue-child',
      coatHi: PALETTE.stoneLight,
      coat: PALETTE.clothBlueDark,
      coatLo: PALETTE.void
    })
  }),
  'settlement-child-chalk': Object.freeze({
    base: 'child',
    modelBase: 'survivor',
    body: 'child',
    accent: 'bare-brown',
    style: Object.freeze({
      campBase: 'child',
      campKit: 'chalk-child',
      coatHi: PALETTE.clothTan,
      coat: PALETTE.stoneMid,
      coatLo: PALETTE.clothDark
    })
  }),
  'choir-red-robe': Object.freeze({
    base: 'choir',
    modelBase: 'choir',
    accent: 'bone-cowl',
    style: Object.freeze({
      coatHi: PALETTE.hostBone,
      coat: PALETTE.clothRed,
      coatLo: PALETTE.rustDark,
      pants: PALETTE.clothDark
    })
  }),
  'choir-dark-robe': Object.freeze({
    base: 'choir',
    modelBase: 'choir',
    accent: 'dark-cowl',
    style: Object.freeze({
      coatHi: PALETTE.stoneDust,
      coat: PALETTE.clothDark,
      coatLo: PALETTE.void,
      pants: PALETTE.clothDark,
      hunch: 4
    })
  }),
  'red-tithe-leathers': Object.freeze({
    base: 'cutthroat',
    modelBase: 'cutthroat',
    accent: 'rust-cowl',
    style: Object.freeze({
      coatHi: PALETTE.rustLight,
      coat: PALETTE.rustMid,
      coatLo: PALETTE.rustDark,
      pants: PALETTE.clothDark
    })
  })
});

const HUMAN_ACCENT_PARTS = Object.freeze({
  'bare-brown': Object.freeze({ style: Object.freeze({ hair: PALETTE.woodDark, hairHi: PALETTE.woodLight, bareHead: true, maskedHead: false }) }),
  'bare-grey': Object.freeze({ style: Object.freeze({ hair: PALETTE.stoneDark, hairHi: PALETTE.stoneDust, bareHead: true, maskedHead: false }) }),
  'bare-light': Object.freeze({ style: Object.freeze({ hair: PALETTE.woodLight, hairHi: PALETTE.clothTan, bareHead: true, maskedHead: false }) }),
  'dark-hood': Object.freeze({ style: Object.freeze({ hood: PALETTE.clothDark, hoodHi: PALETTE.stoneDust, bareHead: false, maskedHead: false }) }),
  'pale-hood': Object.freeze({ style: Object.freeze({ hood: PALETTE.clothTan, hoodHi: PALETTE.hostBone, bareHead: false, maskedHead: false }) }),
  'blue-cloth': Object.freeze({ style: Object.freeze({ hair: PALETTE.woodDark, hairHi: PALETTE.woodMid, hood: PALETTE.clothBlueDark, hoodHi: PALETTE.clothBlue, bareHead: true, maskedHead: false }) }),
  'bone-cowl': Object.freeze({ style: Object.freeze({ hood: PALETTE.clothDark, hoodHi: PALETTE.hostBone, bareHead: false, maskedHead: true }) }),
  'dark-cowl': Object.freeze({ style: Object.freeze({ hood: PALETTE.clothDark, hoodHi: PALETTE.stoneDust, bareHead: false, maskedHead: true }) }),
  'rust-cowl': Object.freeze({ style: Object.freeze({ hood: PALETTE.clothDark, hoodHi: PALETTE.rustMid, bareHead: false, maskedHead: true }) })
});

const HUMAN_GEAR_PARTS = Object.freeze({
  ledger: Object.freeze({}),
  'crate-pack': Object.freeze({}),
  cane: Object.freeze({}),
  'tool-roll': Object.freeze({}),
  'bandage-sling': Object.freeze({}),
  'medicine-bag': Object.freeze({}),
  'water-jars': Object.freeze({}),
  'message-tube': Object.freeze({}),
  'long-apron': Object.freeze({}),
  'prayer-cord': Object.freeze({}),
  'scarred-face': Object.freeze({}),
  'shoulder-plate': Object.freeze({}),
  'rope-coil': Object.freeze({}),
  'tally-tags': Object.freeze({}),
  'child-token': Object.freeze({}),
  'candle-tray': Object.freeze({}),
  'throat-glass': Object.freeze({}),
  'sacrament-flesh': Object.freeze({}),
  'bone-scroll': Object.freeze({}),
  veil: Object.freeze({}),
  chain: Object.freeze({}),
  'ash-mask': Object.freeze({}),
  'confessor-staff': Object.freeze({}),
  'knife-belt': Object.freeze({}),
  'raider-cleaver': Object.freeze({}),
  'thin-pack': Object.freeze({})
});

export const HUMAN_BODY_IDS = Object.freeze(Object.keys(HUMAN_BODY_PARTS));
export const HUMAN_OUTFIT_IDS = Object.freeze(Object.keys(HUMAN_OUTFIT_PARTS));
export const HUMAN_ACCENT_IDS = Object.freeze(Object.keys(HUMAN_ACCENT_PARTS));
export const HUMAN_GEAR_IDS = Object.freeze(Object.keys(HUMAN_GEAR_PARTS));

const DEFAULT_HUMAN_APPEARANCE = Object.freeze({
  body: 'average',
  outfit: 'settlement-work-coat',
  gear: Object.freeze([]),
  accent: 'bare-brown'
});

function baseStyleForOutfit(base) {
  switch (base) {
    case 'woman':
      return SURVIVOR_WOMAN_STYLE;
    case 'child':
      return SURVIVOR_CHILD_STYLE;
    case 'choir':
      return CHOIR_STYLE;
    case 'cutthroat':
      return CUT_STYLE;
    default:
      return SURVIVOR_MAN_STYLE;
  }
}

function normalizeHumanGear(gear) {
  if (!Array.isArray(gear)) return [];
  const requested = new Set(gear.filter((id) => typeof id === 'string' && HUMAN_GEAR_PARTS[id]));
  return HUMAN_GEAR_IDS.filter((id) => requested.has(id));
}

function normalizeHumanAppearance(appearance = {}) {
  const source = appearance && typeof appearance === 'object' && !Array.isArray(appearance)
    ? appearance
    : {};
  const outfit = typeof source.outfit === 'string' && HUMAN_OUTFIT_PARTS[source.outfit]
    ? source.outfit
    : DEFAULT_HUMAN_APPEARANCE.outfit;
  const outfitPart = HUMAN_OUTFIT_PARTS[outfit];
  const bodyDefault = outfitPart.body ?? DEFAULT_HUMAN_APPEARANCE.body;
  const accentDefault = outfitPart.accent ?? DEFAULT_HUMAN_APPEARANCE.accent;
  const body = typeof source.body === 'string' && HUMAN_BODY_PARTS[source.body]
    ? source.body
    : bodyDefault;
  const accent = typeof source.accent === 'string' && HUMAN_ACCENT_PARTS[source.accent]
    ? source.accent
    : accentDefault;
  const gear = normalizeHumanGear(source.gear);
  return Object.freeze({ body, outfit, gear: Object.freeze(gear), accent });
}

function humanAppearanceToken(value) {
  return String(value).replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'plain';
}

export function isHumanAppearance(appearance) {
  return Boolean(
    appearance &&
    typeof appearance === 'object' &&
    !Array.isArray(appearance) &&
    (
      appearance.body !== undefined ||
      appearance.outfit !== undefined ||
      appearance.gear !== undefined ||
      appearance.accent !== undefined
    )
  );
}

export function spriteIdForHumanAppearance(appearance = {}) {
  const normalized = normalizeHumanAppearance(appearance);
  const gearKey = normalized.gear.length > 0 ? normalized.gear.map(humanAppearanceToken).join('-') : 'plain';
  return [
    'human-composite',
    humanAppearanceToken(normalized.body),
    humanAppearanceToken(normalized.outfit),
    humanAppearanceToken(normalized.accent),
    gearKey
  ].join('-');
}

export function deriveHumanAppearanceStyle(appearance = {}) {
  const normalized = normalizeHumanAppearance(appearance);
  const bodyPart = HUMAN_BODY_PARTS[normalized.body];
  const outfitPart = HUMAN_OUTFIT_PARTS[normalized.outfit];
  const accentPart = HUMAN_ACCENT_PARTS[normalized.accent];
  const style = {
    ...baseStyleForOutfit(outfitPart.base),
    ...outfitPart.style,
    ...bodyPart.style,
    ...accentPart.style,
    modelBase: outfitPart.modelBase ?? 'survivor',
    modelKits: normalized.gear,
    decorate: drawHumanModelDetails
  };
  return Object.freeze({
    width: bodyPart.width,
    height: bodyPart.height,
    style: Object.freeze(style),
    appearance: normalized
  });
}

export function bakeHumanAppearance(appearance = {}) {
  const model = deriveHumanAppearanceStyle(appearance);
  return bakeActor(model.width, model.height, model.style);
}

function humanModel(id, description, width, height, style) {
  return Object.freeze({
    id,
    description,
    width,
    height,
    style: Object.freeze(style)
  });
}

const HUMAN_MODEL_DEFS = Object.freeze([
  humanModel('human-road-matron-heavy', 'Heavyset settlement matron with a layered shawl, pale shoulder cloth, staff, and ledger pouch.', 46, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'matron',
    modelKits: ['ledger'],
    shoulders: 18,
    waist: 14,
    torsoLength: 17,
    legLength: 21,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothTan,
    coatLo: PALETTE.stoneDust,
    pants: PALETTE.stoneDark,
    hair: PALETTE.stoneDark,
    hairHi: PALETTE.stoneDust,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-buff-hauler', 'Broad ash-road hauler with thick arms, crate bundle, rope belt, and work boots.', 48, 64, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'settler',
    modelKits: ['crate-pack'],
    shoulders: 22,
    waist: 14,
    torsoLength: 18,
    legLength: 22,
    armSize: 3,
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.stoneDark,
    coatLo: PALETTE.void,
    pants: PALETTE.clothDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-fat-trader', 'Round road trader with a tan coat, small ledger, belly pouch, and careful stance.', 46, 62, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'quartermaster',
    modelKits: ['ledger', 'tally-tags'],
    shoulders: 18,
    waist: 15,
    torsoLength: 18,
    legLength: 20,
    coatHi: PALETTE.clothTan,
    coat: PALETTE.stoneDust,
    coatLo: PALETTE.stoneMid,
    pants: PALETTE.rustDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.woodLight,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-old-widow', 'Stooped elderly widow in a dark shawl with a cane, pale scarf, and narrow face.', 42, 60, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    modelKits: ['cane', 'prayer-cord'],
    shoulders: 12,
    waist: 8,
    torsoLength: 17,
    legLength: 20,
    hunch: 5,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hair: PALETTE.stoneDust,
    hairHi: PALETTE.hostBone,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-old-tinker', 'Elderly tinker with a bent back, tool roll, patched coat, and short walking cane.', 42, 60, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'mender',
    modelKits: ['tool-roll', 'cane'],
    shoulders: 13,
    waist: 8,
    torsoLength: 16,
    legLength: 21,
    hunch: 6,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    pants: PALETTE.stoneDark,
    hair: PALETTE.stoneDust,
    hairHi: PALETTE.hostBone,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-field-nurse-compact', 'Compact field nurse with a pale hood, red medicine cross, and side satchel.', 42, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'nurse',
    modelKits: ['medicine-bag'],
    shoulders: 13,
    waist: 8,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.stoneDust,
    coatLo: PALETTE.stoneDark,
    hood: PALETTE.clothTan,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-water-carrier-blue', 'Water carrier with blue cloth, two stone jars, and a dark waist strap.', 42, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'water',
    modelKits: ['water-jars'],
    shoulders: 14,
    waist: 9,
    coatHi: PALETTE.clothBlue,
    coat: PALETTE.clothBlueDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneMid,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-wall-runner-lean', 'Lean wall runner with long legs, blue sash, message tube, and light pack.', 40, 64, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'runner',
    modelKits: ['message-tube', 'thin-pack'],
    shoulders: 13,
    waist: 7,
    torsoLength: 16,
    legLength: 25,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneLight,
    coatLo: PALETTE.stoneDark,
    pants: PALETTE.clothBlueDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-bandaged-teen', 'Small adolescent survivor with a bandaged sling, too-large coat, and thin legs.', 38, 56, {
    ...SURVIVOR_CHILD_STYLE,
    modelBase: 'survivor',
    campBase: 'child',
    modelKits: ['bandage-sling'],
    shoulders: 12,
    waist: 7,
    torsoLength: 14,
    legLength: 19,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.woodLight,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-road-child-blue', 'Child in a dark blue patched coat with a tiny satchel and bright face.', 36, 50, {
    ...SURVIVOR_CHILD_STYLE,
    modelBase: 'survivor',
    campBase: 'child',
    campKit: 'blue-child',
    modelKits: ['child-token'],
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.clothBlueDark,
    coatLo: PALETTE.void,
    hair: PALETTE.woodLight,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-chalk-child', 'Child with a chalk pouch, tan sleeves, and a small talisman at the neck.', 36, 50, {
    ...SURVIVOR_CHILD_STYLE,
    modelBase: 'survivor',
    campBase: 'child',
    campKit: 'chalk-child',
    modelKits: ['child-token'],
    coatHi: PALETTE.clothTan,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-ash-scout-hooded', 'Hooded ash scout with a staff, thin pack, bedroll, and narrow road stance.', 42, 62, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'settler',
    modelKits: ['thin-pack'],
    shoulders: 14,
    waist: 8,
    torsoLength: 16,
    legLength: 24,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-broad-warden', 'Broad settlement guard with shoulder plate, scarred brow, and heavy dark coat.', 48, 64, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'settler',
    modelKits: ['shoulder-plate', 'scarred-face'],
    shoulders: 21,
    waist: 12,
    torsoLength: 18,
    legLength: 23,
    armSize: 3,
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-hollow-refugee', 'Gaunt refugee with sunken shoulders, oversized coat, thin pack, and bare head.', 38, 62, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'chapel-hand',
    modelKits: ['thin-pack'],
    shoulders: 12,
    waist: 7,
    torsoLength: 17,
    legLength: 24,
    hunch: 3,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.void,
    pants: PALETTE.clothDark,
    hair: PALETTE.stoneDark,
    hairHi: PALETTE.stoneDust,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-cook-apron', 'Camp cook with a long apron, dark pot hook, and stocky working stance.', 44, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'cook',
    modelKits: ['long-apron'],
    shoulders: 15,
    waist: 11,
    coatHi: PALETTE.clothTan,
    coat: PALETTE.rustDark,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-prayer-keeper', 'Chapel keeper with a dark coat, prayer cord, bundled cloth, and careful posture.', 42, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'chapel-hand',
    modelKits: ['prayer-cord'],
    shoulders: 13,
    waist: 8,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    pants: PALETTE.stoneDark,
    hair: PALETTE.woodLight,
    hairHi: PALETTE.clothTan,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-seamstress-quartermaster', 'Seamstress quartermaster with roll bundle, ledger, blue chest cloth, and pinned tools.', 42, 62, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    campKit: 'quartermaster',
    modelKits: ['ledger', 'tool-roll'],
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hair: PALETTE.woodDark,
    hairHi: PALETTE.woodMid,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-scarred-veteran', 'Scarred veteran settler with shoulder plate, rope belt, and a guarded stance.', 44, 62, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'settler',
    modelKits: ['shoulder-plate', 'scarred-face', 'rope-coil'],
    shoulders: 18,
    waist: 10,
    coatHi: PALETTE.stoneLight,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.stoneDark,
    pants: PALETTE.clothDark,
    hair: PALETTE.woodMid,
    hairHi: PALETTE.woodLight,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-lame-grandfather', 'Lame grandfather with a high hunch, grey hair, cane, and patched dark trousers.', 40, 60, {
    ...SURVIVOR_MAN_STYLE,
    modelBase: 'survivor',
    campKit: 'mender',
    modelKits: ['cane'],
    shoulders: 12,
    waist: 8,
    torsoLength: 16,
    legLength: 20,
    hunch: 7,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    pants: PALETTE.stoneDark,
    hair: PALETTE.stoneDust,
    hairHi: PALETTE.hostBone,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('human-shawl-grandmother', 'Small grandmother in a pale shawl with jars, prayer cord, and bent shoulders.', 40, 60, {
    ...SURVIVOR_WOMAN_STYLE,
    modelBase: 'survivor',
    campBase: 'shawl',
    modelKits: ['water-jars', 'prayer-cord'],
    shoulders: 11,
    waist: 8,
    torsoLength: 16,
    legLength: 20,
    hunch: 5,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothTan,
    coatLo: PALETTE.stoneDust,
    hair: PALETTE.stoneDust,
    hairHi: PALETTE.hostBone,
    bareHead: true,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-candle-novice', 'Young Choir candle novice with a low tray, wax-lit sleeves, and masked cowl.', 44, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['candle-tray'],
    shoulders: 13,
    waist: 8,
    torsoLength: 17,
    legLength: 23,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothRed,
    coatLo: PALETTE.rustDark,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-throat-singer-lean', 'Lean Choir throat-singer with a dark neck strip, relic glass pouch, and narrow robe.', 42, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['throat-glass', 'thin-pack'],
    shoulders: 12,
    waist: 7,
    torsoLength: 18,
    legLength: 24,
    hunch: 4,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-flesh-eater-bloated', 'Bloated Choir flesh-eater with a swollen robe, sacrament bundle, and red-stained hands.', 48, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['sacrament-flesh'],
    shoulders: 20,
    waist: 14,
    torsoLength: 18,
    legLength: 21,
    coatHi: PALETTE.clothTan,
    coat: PALETTE.clothRed,
    coatLo: PALETTE.hostRed,
    pants: PALETTE.clothDark,
    hunch: 5,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-bone-lector', 'Choir bone lector with pale scroll plates, tally tags, and a formal red stole.', 44, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['bone-scroll', 'tally-tags'],
    shoulders: 15,
    waist: 9,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.stoneDust,
    coatLo: PALETTE.rustDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-veiled-mother', 'Veiled Choir mother with a dark face cloth, red robe, prayer cord, and hidden knife.', 44, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['veil', 'prayer-cord'],
    shoulders: 16,
    waist: 10,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothRed,
    coatLo: PALETTE.rustDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-chain-bearer', 'Choir chain-bearer with dragging links, rope coil, and heavy ritual sleeves.', 46, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['chain', 'rope-coil'],
    shoulders: 18,
    waist: 11,
    torsoLength: 18,
    legLength: 22,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-ash-penitent', 'Ash-masked Choir penitent with a pale face plate, tight robe, and bowed posture.', 42, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['ash-mask', 'prayer-cord'],
    shoulders: 13,
    waist: 8,
    torsoLength: 18,
    legLength: 23,
    hunch: 7,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.clothDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-broad-guard', 'Broad Choir guard with armored shoulder, red stole, and heavier ritual knife.', 48, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['shoulder-plate', 'knife-belt'],
    shoulders: 21,
    waist: 12,
    armSize: 3,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothRed,
    coatLo: PALETTE.rustDark,
    hoodHi: PALETTE.hostBone,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-old-confessor', 'Old Choir confessor with a staff, bone charm, grey hood edge, and bent ritual robe.', 44, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['confessor-staff', 'bone-scroll'],
    shoulders: 14,
    waist: 9,
    legLength: 21,
    hunch: 8,
    coatHi: PALETTE.hostBone,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('choir-scarlet-knife', 'Scarlet-robed knife cultist with triple blades, black cowl, and quick side stance.', 44, 64, {
    ...CHOIR_STYLE,
    modelBase: 'choir',
    modelKits: ['knife-belt'],
    shoulders: 15,
    waist: 8,
    legLength: 24,
    coatHi: PALETTE.clothTan,
    coat: PALETTE.clothRed,
    coatLo: PALETTE.hostRed,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.rustDark,
    decorate: drawHumanModelDetails
  }),
  humanModel('red-tithe-buff-raider', 'Buff Red Tithe raider with a cleaver, shoulder plate, dark leathers, and red scarf.', 48, 64, {
    ...CUT_STYLE,
    modelBase: 'cutthroat',
    modelKits: ['shoulder-plate', 'raider-cleaver'],
    shoulders: 21,
    waist: 12,
    armSize: 3,
    coatHi: PALETTE.rustLight,
    coat: PALETTE.rustMid,
    coatLo: PALETTE.rustDark,
    pants: PALETTE.clothDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.rustMid,
    decorate: drawHumanModelDetails
  }),
  humanModel('red-tithe-starved-runner', 'Starved Red Tithe runner with thin limbs, relic sack, and long hooked knife.', 40, 64, {
    ...CUT_STYLE,
    modelBase: 'cutthroat',
    modelKits: ['thin-pack', 'knife-belt'],
    shoulders: 12,
    waist: 7,
    torsoLength: 17,
    legLength: 25,
    hunch: 4,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.clothDark,
    coatLo: PALETTE.void,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDark,
    decorate: drawHumanModelDetails
  }),
  humanModel('red-tithe-sawbones', 'Red Tithe sawbones with tool roll, blood-dark apron, and a narrow hood.', 44, 64, {
    ...CUT_STYLE,
    modelBase: 'cutthroat',
    modelKits: ['tool-roll', 'long-apron'],
    shoulders: 15,
    waist: 9,
    coatHi: PALETTE.stoneDust,
    coat: PALETTE.rustDark,
    coatLo: PALETTE.clothDark,
    pants: PALETTE.stoneDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.stoneDust,
    decorate: drawHumanModelDetails
  }),
  humanModel('red-tithe-hook-carrier', 'Red Tithe hook carrier with rope coil, chain links, and a heavy scavenger pack.', 46, 64, {
    ...CUT_STYLE,
    modelBase: 'cutthroat',
    modelKits: ['rope-coil', 'chain', 'crate-pack'],
    shoulders: 18,
    waist: 11,
    coatHi: PALETTE.rustLight,
    coat: PALETTE.stoneMid,
    coatLo: PALETTE.void,
    pants: PALETTE.clothDark,
    hood: PALETTE.clothDark,
    hoodHi: PALETTE.rustDark,
    decorate: drawHumanModelDetails
  })
]);

export const HUMAN_MODEL_SUMMARY = Object.freeze(
  HUMAN_MODEL_DEFS.map(({ id, description }) => Object.freeze({ id, description }))
);

export const HUMAN_MODEL_IDS = Object.freeze(HUMAN_MODEL_DEFS.map(({ id }) => id));

function ratSide(meta) {
  return meta.side || (meta.back ? -1 : 1);
}

function ratSeg(ctx, x0, y0, x1, y1, color, size = 1) {
  linePx(ctx, x0, y0, x1, y1, color, size);
}

function drawRatBody(ctx, cx, cy, side, pose, opts = {}) {
  const bob = pose.bob ?? 0;
  const hit = pose.hit ? side * 2 : 0;
  const attack = pose.attack ?? 0;
  const bodyCx = cx + hit + Math.round(side * (attack > 0 ? 1 : 0));
  const bodyY = cy + bob;
  const fur = opts.fur ?? PALETTE.hostBlack;
  const furHi = opts.furHi ?? PALETTE.skinDark;
  const furLo = opts.furLo ?? PALETTE.void;
  const wound = opts.wound ?? PALETTE.hostRed;

  for (let row = 0; row < 13; row += 1) {
    const w = 28 - Math.abs(row - 6) * 2;
    const x = bodyCx - Math.floor(w / 2);
    const tone = row < 3 ? furHi : row < 10 ? fur : furLo;
    px(ctx, x, bodyY - 12 + row, PALETTE.outline, w + 2, 1);
    px(ctx, x + 1, bodyY - 12 + row, tone, w, 1);
    if ((row & 3) === 0) px(ctx, x + 4, bodyY - 12 + row, wound, Math.max(3, w - 10), 1);
    if (row === 2 || row === 7) px(ctx, x + w - 4, bodyY - 12 + row, PALETTE.hostGold, 2, 1);
  }

  const headX = bodyCx + side * (14 + Math.floor(attack / 3));
  const headY = bodyY - 10 + Math.floor(attack / 5);
  for (let row = 0; row < 8; row += 1) {
    const w = 10 - Math.abs(row - 3);
    const x = headX - Math.floor(w / 2);
    px(ctx, x - 1, headY + row, PALETTE.outline, w + 2, 1);
    px(ctx, x, headY + row, row < 3 ? furHi : fur, w, 1);
  }
  px(ctx, headX + side * 4, headY + 2, PALETTE.hostBone, 4, 2);
  px(ctx, headX + side * 6, headY + 3, PALETTE.void, 2, 2);
  px(ctx, headX + side * 2, headY + 3, PALETTE.hostGold, 1, 1);
  ratSeg(ctx, bodyCx - side * 13, bodyY - 5, bodyCx - side * 25, bodyY - 9 + bob, PALETTE.hostBlack);
  ratSeg(ctx, bodyCx - side * 16, bodyY - 6, bodyCx - side * 26, bodyY - 8 + bob, PALETTE.hostGold);
  return { bodyCx, bodyY, headX, headY };
}

function drawSixLeggedRat(ctx, w, h, facing, pose) {
  const meta = FACING_META[facing] ?? FACING_META.se;
  const side = ratSide(meta);
  const cx = Math.floor(w / 2);
  const footY = h - 8;
  const info = drawRatBody(ctx, cx, footY - 6, side, pose, {
    fur: PALETTE.hostBlack,
    furHi: PALETTE.skinDark,
    furLo: PALETTE.void,
    wound: PALETTE.hostRed
  });
  const step = pose.legA ?? 0;
  const legXs = [-10, -3, 5];
  for (let i = 0; i < 3; i += 1) {
    const x = info.bodyCx + side * legXs[i];
    const swing = Math.sign(step || (i - 1)) * (i + 1);
    ratSeg(ctx, x, info.bodyY - 3, x - side * (5 + i), footY - 3 + (i & 1), PALETTE.hostBone, i === 1 ? 2 : 1);
    ratSeg(ctx, x + side * 2, info.bodyY - 2, x + side * (6 + swing), footY - 1, PALETTE.skinDark, 1);
  }
  for (let i = 0; i < 7; i += 1) {
    const x = info.bodyCx - 9 + i * 3;
    ratSeg(ctx, x, info.bodyY - 13, x - 1 + (i & 1), info.bodyY - 17 - (i % 3), PALETTE.hostBone);
  }
  px(ctx, info.bodyCx - side * 3, info.bodyY - 9, PALETTE.hostGold, 2, 2);
  px(ctx, info.bodyCx + side * 6, info.bodyY - 4, PALETTE.hostGold, 1, 4);
}

function drawThroatMawRat(ctx, w, h, facing, pose) {
  const meta = FACING_META[facing] ?? FACING_META.se;
  const side = ratSide(meta);
  const cx = Math.floor(w / 2);
  const footY = h - 8;
  const info = drawRatBody(ctx, cx - side * 2, footY - 6, side, pose, {
    fur: PALETTE.hostBlack,
    furHi: PALETTE.rustDark,
    furLo: PALETTE.void,
    wound: PALETTE.hostRed
  });
  const mawX = info.bodyCx + side * 13;
  const mawY = info.bodyY - 7 + Math.floor((pose.attack ?? 0) / 5);
  px(ctx, mawX - 6, mawY - 5, PALETTE.hostBone, 12, 10);
  px(ctx, mawX - 5, mawY - 4, PALETTE.void, 10, 8);
  for (let i = 0; i < 10; i += 1) {
    const tx = mawX - 5 + i;
    px(ctx, tx, mawY - 4 + (i & 1), PALETTE.hostBone, 1, 3);
    px(ctx, tx, mawY + 2 - (i & 1), PALETTE.hostBone, 1, 3);
  }
  px(ctx, mawX - 2, mawY - 1, PALETTE.hostRed, 5, 3);
  px(ctx, mawX, mawY, PALETTE.hostGold, 1, 2);

  const headX = mawX + side * (11 + (pose.bob ?? 0));
  const headY = mawY + 8 + (pose.hit ? 2 : 0);
  ratSeg(ctx, mawX + side * 2, mawY + 2, headX - side * 2, headY - 2, PALETTE.hostRed, 2);
  ratSeg(ctx, mawX + side * 1, mawY + 1, headX - side * 3, headY - 4, PALETTE.hostGold);
  for (let row = 0; row < 7; row += 1) {
    const ww = 9 - Math.abs(row - 3);
    px(ctx, headX - Math.floor(ww / 2), headY + row, row < 3 ? PALETTE.skinDark : PALETTE.hostBlack, ww, 1);
  }
  px(ctx, headX + side * 3, headY + 3, PALETTE.void, 2, 2);
  px(ctx, headX - side * 2, headY + 5, PALETTE.hostBone, 5, 1);

  for (const dx of [-8, 0, 8]) {
    ratSeg(ctx, info.bodyCx + dx, info.bodyY - 1, info.bodyCx + dx - side * 5, footY - 2, PALETTE.skinDark);
  }
  for (let i = 0; i < 5; i += 1) {
    px(ctx, info.bodyCx - 8 + i * 4, info.bodyY - 15 - (i & 1), PALETTE.hostBone, 2, 1);
  }
}

function drawTendrilWalkerRat(ctx, w, h, facing, pose) {
  const meta = FACING_META[facing] ?? FACING_META.se;
  const side = ratSide(meta);
  const cx = Math.floor(w / 2);
  const footY = h - 7;
  const info = drawRatBody(ctx, cx, footY - 10, side, pose, {
    fur: PALETTE.hostBlack,
    furHi: PALETTE.skinDark,
    furLo: PALETTE.void,
    wound: PALETTE.hostRed
  });
  const sway = pose.legB ?? pose.bob ?? 0;
  const roots = [-11, -5, 1, 7, 12];
  for (let i = 0; i < roots.length; i += 1) {
    const rootX = info.bodyCx + roots[i];
    const footX = rootX + side * (((i % 2) ? 7 : -5) + Math.sign(sway || 1) * (i % 3));
    const foot = footY - (i & 1);
    ratSeg(ctx, rootX, info.bodyY - 2, Math.round((rootX + footX) / 2), foot - 8, i % 2 ? PALETTE.hostRed : PALETTE.hostBlack, 2);
    ratSeg(ctx, Math.round((rootX + footX) / 2), foot - 8, footX, foot, i % 2 ? PALETTE.hostGold : PALETTE.hostRed, 1);
    px(ctx, footX - 1, foot, PALETTE.hostBone, 3, 1);
  }
  px(ctx, info.bodyCx - 6, info.bodyY - 7, PALETTE.void, 14, 7);
  for (let r = 0; r < 4; r += 1) {
    px(ctx, info.bodyCx - 8 - r, info.bodyY - 7 + r * 2, PALETTE.hostBone, 7, 1);
    px(ctx, info.bodyCx + 4, info.bodyY - 7 + r * 2, PALETTE.hostBone, 7 + r, 1);
  }
  px(ctx, info.bodyCx, info.bodyY - 5, pose.bob ? PALETTE.hostGlow : PALETTE.hostGold, 2, 3);
  for (let i = 0; i < 6; i += 1) {
    ratSeg(ctx, info.bodyCx - side * 12, info.bodyY - 9 + i, info.bodyCx - side * (18 + i), info.bodyY - 15 + i, PALETTE.hostRed);
  }
}

function drawRatDeath(ctx, w, h, variant, frame) {
  const cx = Math.floor(w / 2);
  const cy = h - 12;
  const settle = Math.min(1, frame / 7);
  const wide = Math.round(22 + settle * 12);
  px(ctx, cx - Math.floor(wide / 2), cy - 4, PALETTE.hostBlack, wide, 5);
  px(ctx, cx - Math.floor(wide / 2) + 2, cy - 5, PALETTE.hostRed, wide - 4, 2);
  for (let i = 0; i < 9; i += 1) px(ctx, cx - 15 + i * 4, cy - 6 + (i & 1), PALETTE.hostBone, 2, 1);
  if (variant === 'maw') {
    px(ctx, cx + 8, cy - 9, PALETTE.void, 10, 5);
    for (let i = 0; i < 7; i += 1) px(ctx, cx + 8 + i, cy - 9, PALETTE.hostBone, 1, 4);
  } else if (variant === 'tendril') {
    for (let i = 0; i < 5; i += 1) ratSeg(ctx, cx - 8 + i * 4, cy - 2, cx - 18 + i * 8, cy + 4, PALETTE.hostRed);
  } else {
    for (let i = 0; i < 6; i += 1) ratSeg(ctx, cx - 12 + i * 4, cy - 2, cx - 18 + i * 7, cy + 2, PALETTE.hostBone);
  }
  px(ctx, cx - 1, cy - 4, frame % 2 ? PALETTE.hostGold : PALETTE.hostRed, 2, 1);
}

function bakeHostRat(variant, drawBody) {
  const w = 54;
  const h = 42;
  const frames = {};
  for (const state of Object.keys(POSES)) {
    frames[state] = {};
    for (const facing of FACINGS) {
      frames[state][facing] = POSES[state].map((pose) =>
        compose(w, h, (ctx) => drawBody(ctx, w, h, facing, pose))
      );
    }
  }
  const death = Array.from({ length: 10 }, (_, frame) =>
    compose(w, h, (ctx) => drawRatDeath(ctx, w, h, variant, frame))
  );
  return {
    width: w,
    height: h,
    anchorX: Math.floor(w / 2),
    anchorY: h - 3,
    frames,
    death
  };
}

function bakeActor(w, h, style) {
  const frames = {};
  for (const state of Object.keys(POSES)) {
    frames[state] = {};
    for (const facing of FACINGS) {
      frames[state][facing] = POSES[state].map((pose) =>
        compose(w, h, (ctx) => drawActorBase(ctx, w, h, facing, pose, style))
      );
    }
  }

  const death = Array.from({ length: 10 }, (_, frame) =>
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

// Bake Mara's sprite for a given equipment snapshot. Called once at startup with
// her default loadout, then again by the game whenever gear changes so the world
// figure (and the inventory paper doll, which reads the same atlas entry) stay
// in sync with what she is actually wearing.
export function bakeMara(equipment = MARA_DEFAULT_EQUIPMENT, itemDefs = {}, appearance = MARA_DEFAULT_APPEARANCE) {
  return bakeActor(42, 62, deriveMaraStyle(equipment, itemDefs, appearance));
}

const BASE_SPRITE_ATLAS_IDS = Object.freeze([
  'mara-vey',
  'settlement-man',
  'settlement-woman',
  'settlement-child',
  'settlement-selka',
  'settlement-mirel',
  'settlement-oren',
  'settlement-tomas',
  'settlement-runa',
  'settlement-istra',
  'settlement-nessa',
  'settlement-dalia',
  'settlement-hanne',
  'settlement-corin',
  'settlement-eda',
  'choir-cultist',
  'red-tithe-cutthroat',
  'host-touched-penitent',
  'host-rat-sixlegs',
  'host-rat-throat-maw',
  'host-rat-tendril-walker'
]);

export const SPRITE_ATLAS_IDS = Object.freeze([...BASE_SPRITE_ATLAS_IDS, ...HUMAN_MODEL_IDS]);

export function buildSpriteAtlas() {
  const atlas = {
    'mara-vey': bakeMara(MARA_DEFAULT_EQUIPMENT, {}),
    'settlement-man': bakeActor(42, 62, SURVIVOR_MAN_STYLE),
    'settlement-woman': bakeActor(42, 62, SURVIVOR_WOMAN_STYLE),
    'settlement-child': bakeActor(36, 50, SURVIVOR_CHILD_STYLE),
    'settlement-selka': bakeActor(42, 62, SURVIVOR_VARIANTS.selka),
    'settlement-mirel': bakeActor(42, 62, SURVIVOR_VARIANTS.mirel),
    'settlement-oren': bakeActor(42, 62, SURVIVOR_VARIANTS.oren),
    'settlement-tomas': bakeActor(42, 62, SURVIVOR_VARIANTS.tomas),
    'settlement-runa': bakeActor(42, 62, SURVIVOR_VARIANTS.runa),
    'settlement-istra': bakeActor(42, 62, SURVIVOR_VARIANTS.istra),
    'settlement-nessa': bakeActor(42, 62, SURVIVOR_VARIANTS.nessa),
    'settlement-dalia': bakeActor(42, 62, SURVIVOR_VARIANTS.dalia),
    'settlement-hanne': bakeActor(42, 62, SURVIVOR_VARIANTS.hanne),
    'settlement-corin': bakeActor(36, 50, SURVIVOR_VARIANTS.corin),
    'settlement-eda': bakeActor(36, 50, SURVIVOR_VARIANTS.eda),
    'choir-cultist': bakeActor(44, 64, CHOIR_STYLE),
    'red-tithe-cutthroat': bakeActor(44, 64, CUT_STYLE),
    'host-touched-penitent': bakeActor(64, 92, PEN_STYLE),
    'host-rat-sixlegs': bakeHostRat('sixlegs', drawSixLeggedRat),
    'host-rat-throat-maw': bakeHostRat('maw', drawThroatMawRat),
    'host-rat-tendril-walker': bakeHostRat('tendril', drawTendrilWalkerRat)
  };

  for (const model of HUMAN_MODEL_DEFS) {
    atlas[model.id] = bakeActor(model.width, model.height, model.style);
  }

  return atlas;
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
