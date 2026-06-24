import { PALETTE } from '../palette.js';



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
  ]
};

export const SPRITE_POSE_FRAME_COUNTS = Object.freeze(
  Object.fromEntries(Object.entries(POSES).map(([state, poses]) => [state, poses.length]))
);

export function createCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

export function px(ctx, x, y, color, w = 1, h = 1) {
  if (!color) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
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
    return;
  }
  const main = far ? style.bootLo : style.boot;
  px(ctx, x - 2, y, style.bootLo, 8, 3);
  px(ctx, x - 1 + toe, y + 2, style.bootLo, 8, 2);
  px(ctx, x - 1, y, main, 7, 2);
  px(ctx, x, y, style.bootHi, 4, 1);
}

export function viewScale(meta) {
  if (meta.view === 'side') return 0.68;
  if (meta.view === 'three') return 0.88;
  return 1;
}

export function directionSide(meta) {
  return meta.side || 1;
}

function drawHumanHair(ctx, x, y, meta, hit, style, crown, crownHi) {
  const hairStyle = style.bareHead ? (style.hairStyle ?? 'cropped') : 'hooded';
  const side = directionSide(meta);
  if (meta.view === 'side') {
    if (hairStyle === 'shaved') {
      px(ctx, x - 2 + hit, y - 1, crown, 5, 1);
      px(ctx, x - 1 + hit, y - 1, crownHi, 2, 1);
      return;
    }
    if (hairStyle === 'hooded') {
      px(ctx, x - 4 + hit, y - 2, crown, 8, 2);
      px(ctx, x - 5 + hit, y, crown, 4, 6);
      px(ctx, x + (side > 0 ? 2 : -5) + hit, y + 1, crown, 4, 5);
      px(ctx, x - 3 + hit, y - 2, crownHi, 4, 1);
      return;
    }
    px(ctx, x - 2 + hit, y - 1, crown, 5, 1);
    px(ctx, x - 3 + hit, y, crown, 6, 1);
    px(ctx, x - 3 + hit, y + 1, crown, 2, hairStyle === 'loose' ? 6 : 4);
    if (hairStyle === 'loose') px(ctx, x - 4 + hit, y + 4, crown, 3, 4);
    px(ctx, x - 1 + hit, y - 1, crownHi, 2, 1);
    return;
  }

  if (hairStyle === 'shaved') {
    px(ctx, x - 2 + hit, y - 1, crown, 5, 1);
    px(ctx, x - 1 + hit, y - 1, crownHi, 2, 1);
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
  px(ctx, x - 4 + hit, y + 1, crown, 2, hairStyle === 'loose' ? 6 : 4);
  px(ctx, x + 3 + hit, y + 1, crown, 1, hairStyle === 'loose' ? 6 : 4);
  if (hairStyle === 'loose') px(ctx, x - 3 + hit, y + 6, crown, 7, 2);
  px(ctx, x - 1 + hit, y - 1, crownHi, 2, 1);
}

function drawFacialHair(ctx, x, y, meta, hit, style) {
  if (!style.bareHead || meta.back || !style.facialHair || style.facialHair === 'none') return;
  const hair = style.hair;
  const side = directionSide(meta);
  if (meta.view === 'side') {
    const jawX = x + (side > 0 ? 1 : -3) + hit;
    if (style.facialHair === 'beard') {
      px(ctx, jawX, y + 5, hair, 4, 2);
      px(ctx, jawX + side, y + 7, hair, 3, 2);
    } else {
      px(ctx, jawX, y + 5, hair, 3, 1);
    }
    return;
  }
  if (style.facialHair === 'beard') {
    px(ctx, x - 3 + hit, y + 5, hair, 7, 2);
    px(ctx, x - 2 + hit, y + 7, hair, 5, 2);
    return;
  }
  px(ctx, x - 3 + hit, y + 5, hair, 7, 1);
}

export function drawSmallHead(ctx, x, y, meta, pose, style) {
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
  // hair. Only the player uses this branch (enemies are masked/host heads), so
  // the bareHead path never touches enemy sprites.
  const bare = Boolean(style.bareHead);
  const hairStyle = bare ? (style.hairStyle ?? 'cropped') : 'hooded';
  const crown = bare && hairStyle !== 'hooded' ? style.hair : hood;
  const crownHi = bare && hairStyle !== 'hooded' ? (style.hairHi ?? style.hair) : hoodHi;

  if (meta.view === 'side') {
    taperedSpan(ctx, x + hit, y, 5, 6, 8, skin, side * 0.3);
    drawHumanHair(ctx, x, y, meta, hit, { ...style, hairStyle, bareHead: bare }, crown, crownHi);
    px(ctx, x + (side > 0 ? 4 : -1) + hit, y + 4, skin.mid, 2, 2);
    px(ctx, x + (side > 0 ? 2 : 3) + hit, y + 4, skin.dk, 2, 1);
    drawFacialHair(ctx, x, y, meta, hit, style);
    if (bare) px(ctx, x + hit, y + 2, skin.hi, 2, 1); // lit temple
    return;
  }

  taperedSpan(ctx, x + hit, y, 6, 7, 8, skin);
  drawHumanHair(ctx, x, y, meta, hit, { ...style, hairStyle, bareHead: bare }, crown, crownHi);
  if (meta.back) {
    px(ctx, x - 3 + hit, y + 2, crown, 6, 6);
    return;
  }
  px(ctx, x - 2 + hit, y + 4, skin.dk, 2, 1);
  px(ctx, x + 1 + hit, y + 4, skin.dk, 1, 1);
  px(ctx, x + hit, y + 6, skin.lo, 2, 1);
  drawFacialHair(ctx, x, y, meta, hit, style);
  if (bare) {
    // A brighter brow and cheek so the open face reads as skin, not shadow.
    px(ctx, x - 1 + hit, y + 2, skin.hi, 3, 1);
    px(ctx, x - 2 + hit, y + 3, skin.mid, 5, 1);
  } else {
    // Hood up: a narrow brow-guard shadow keeps the face in cowl shadow.
    px(ctx, x - 2 + hit, y + 3, PALETTE.void, 5, 1);
  }
}

export function drawTorso(ctx, cx, shoulderY, hipY, meta, pose, style) {
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

export function drawAdultAnatomy() {}

export function drawActorBase(ctx, w, h, facing, pose, style) {
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

export function drawDeath(ctx, w, h, style, frame) {
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
    px(ctx, cx, bodyTop + 4, frame % 2 ? PALETTE.hostGlow : PALETTE.hostGold, 2, 2);
    px(ctx, cx - 20, bodyTop + 1, PALETTE.hostBone, 5, 5); // skull at head end
    px(ctx, cx - 19, bodyTop + 2, PALETTE.void, 1, 1);
  } else {
    // Human corpse: head + boots at the ends, a slack outflung arm, belt.
    const hx = cx + 13;
    px(ctx, hx, bodyTop + 1, skin.mid, 6, 6);
    const corpseHair = style.bareHead === false || style.hairStyle === 'hooded' ? style.hood : style.hair;
    if (cult) px(ctx, hx - 1, bodyTop, style.hood, 7, 3); // cowl over the face
    else if (style.hairStyle === 'shaved') px(ctx, hx + 1, bodyTop, corpseHair, 4, 1);
    else {
      px(ctx, hx, bodyTop, corpseHair, 6, style.hairStyle === 'loose' ? 3 : 2);
      if (style.hairStyle === 'loose') px(ctx, hx + 4, bodyTop + 2, corpseHair, 3, 3);
    }
    if (!cult && style.bareHead !== false && style.facialHair && style.facialHair !== 'none') {
      px(ctx, hx + 1, bodyTop + 4, style.hair, 4, style.facialHair === 'beard' ? 2 : 1);
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
