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
    const cx = x + hit;
    px(ctx, cx - 3, y, PALETTE.hostBlack, 7, 9);
    px(ctx, cx - 2, y + 1, PALETTE.hostBone, 5, 6);
    px(ctx, cx - 1, y + 3, PALETTE.void, 3, 1);
    px(ctx, cx, y + 5, PALETTE.hostGold, 1, 2);
    px(ctx, cx - 3, y + 7, PALETTE.hostBlack, 7, 2);
    px(ctx, cx - 2, y - 1, PALETTE.hostGold, 5, 1);
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

  if (meta.view === 'side') {
    taperedSpan(ctx, x + hit, y, 5, 6, 8, skin, side * 0.3);
    px(ctx, x - 2 + hit, y - 1, hood, 5, 1);
    px(ctx, x - 3 + hit, y, hood, 6, 1);
    px(ctx, x - 3 + hit, y + 1, hood, 2, 4);
    px(ctx, x + (side > 0 ? 4 : -1) + hit, y + 4, skin.mid, 2, 2);
    px(ctx, x + (side > 0 ? 2 : 3) + hit, y + 4, skin.dk, 2, 1);
    px(ctx, x - 1 + hit, y - 1, hoodHi, 2, 1);
    return;
  }

  taperedSpan(ctx, x + hit, y, 6, 7, 8, skin);
  px(ctx, x - 2 + hit, y - 1, hood, 5, 1);
  px(ctx, x - 3 + hit, y, hood, 7, 1);
  px(ctx, x - 4 + hit, y + 1, hood, 2, 4);
  px(ctx, x + 3 + hit, y + 1, hood, 1, 4);
  px(ctx, x - 1 + hit, y - 1, hoodHi, 2, 1);
  if (meta.back) {
    px(ctx, x - 3 + hit, y + 2, hood, 6, 6);
    return;
  }
  px(ctx, x - 2 + hit, y + 4, skin.dk, 2, 1);
  px(ctx, x + 1 + hit, y + 4, skin.dk, 1, 1);
  px(ctx, x + hit, y + 6, skin.lo, 2, 1);
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

function drawActorBase(ctx, w, h, facing, pose, style) {
  const meta = FACING_META[facing] ?? FACING_META.se;
  const side = directionSide(meta);
  const scale = viewScale(meta);
  const cx = Math.floor(w / 2);
  const footY = h - 4;
  const bob = pose.bob ?? 0;
  const hunch = style.hunch ?? 0;
  const hipY = footY - style.legLength + bob + Math.floor(hunch * 0.4);
  const shoulderY = hipY - style.torsoLength + Math.floor(hunch * 0.55);
  const headY = shoulderY - style.headHeight + Math.floor(hunch * 0.25);

  const pants = ramp(style, 'pants');
  const coat = ramp(style, 'coat');
  const skin = ramp(style, 'skin');
  const legSpread = meta.view === 'side' ? 2 : Math.max(3, Math.round(5 * scale));
  const legA = pose.legA ?? 0;
  const legB = pose.legB ?? 0;
  const armA = pose.armA ?? 0;
  const armB = pose.armB ?? 0;
  const attack = pose.attack ?? 0;
  const reach = pose.reach ?? 0;

  const farLeg = {
    hip: { x: cx - legSpread - Math.round(meta.bodyTurn), y: hipY },
    knee: { x: cx - legSpread + Math.round(legA * 0.45), y: hipY + Math.floor(style.legLength * 0.46) },
    foot: { x: cx - legSpread - 1 + Math.round(legA * 0.9), y: footY }
  };
  const nearLeg = {
    hip: { x: cx + legSpread - Math.round(meta.bodyTurn), y: hipY },
    knee: { x: cx + legSpread + Math.round(legB * 0.45), y: hipY + Math.floor(style.legLength * 0.48) },
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

function drawDeath(ctx, w, h, style, frame) {
  const t = frame / 9;
  const cx = Math.floor(w / 2);
  const footY = h - 4;
  const coat = ramp(style, 'coat');
  const pants = ramp(style, 'pants');
  const skin = ramp(style, 'skin');
  const bodyW = Math.round(11 + t * 25);
  const bodyH = Math.round(36 - t * 25);
  const x = Math.round(cx - bodyW / 2 - t * 4);
  const y = Math.round(footY - bodyH - 3 + t * 20);

  px(ctx, x - 1, y + 1, coat.dk, bodyW + 3, bodyH + 3);
  taperedSpan(ctx, x + Math.floor(bodyW / 2), y, Math.max(7, bodyW - 3), Math.max(8, bodyW), bodyH, coat, 0, frame);
  px(ctx, x + 2, footY - 2, pants.mid, Math.max(8, bodyW - 4), 3);
  px(ctx, x - 3, footY, style.bootLo, Math.max(12, bodyW - 1), 2);

  const hx = Math.round(cx + t * 13);
  const hy = Math.round(y - 7 + t * 23);
  px(ctx, hx, hy, skin.mid, 7, 6);
  px(ctx, hx, hy, style.hair, 7, 2);
  if (frame >= 5) px(ctx, x + Math.floor(bodyW * 0.45), footY - 1, PALETTE.hostRed, Math.max(7, Math.floor(bodyW * 0.45)), 2);
}

function compose(w, h, drawBody) {
  const { canvas, ctx } = createCanvas(w, h);
  drawBody(ctx);
  return canvas;
}

function drawMaraDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const side = directionSide(meta);
  const bob = pose.bob ?? 0;
  const c = torso.bodyCx;

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

function drawHostDetails({ ctx, px, linePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const c = torso.bodyCx;
  const side = directionSide(meta);
  const pulse = pose.bob ? 1 : 0;

  // Broken bone halo, offset behind the tiny head.
  for (let n = 0; n < 13; n += 1) {
    if (n === 4 || n === 8) continue;
    const angle = Math.PI * (0.06 + n * 0.074);
    const hx = c + Math.round(Math.cos(angle) * 10);
    const hy = headY + 5 - Math.round(Math.sin(angle) * 8);
    px(ctx, hx, hy, PALETTE.hostBone, n % 4 === 0 ? 2 : 1, 1);
  }

  // Rib cage and black-gold wound under torn robe/flesh.
  px(ctx, c - 5, shoulderY + 7, PALETTE.hostBone, 10, 1);
  px(ctx, c - 4, shoulderY + 11, PALETTE.hostBone, 9, 1);
  px(ctx, c - 3, shoulderY + 15, PALETTE.hostBone, 8, 1);
  px(ctx, c - 2, shoulderY + 11, PALETTE.hostRed, 5, 7);
  px(ctx, c, shoulderY + 13, pulse ? PALETTE.hostGlow : PALETTE.hostGold, 2, 2);
  if (pulse) px(ctx, c + 1, shoulderY + 12, PALETTE.flash, 1, 1);

  // Elongated prayer-limb shapes. They keep a human shoulder and elbow, but the
  // hands hang too low.
  linePx(ctx, c - 8, shoulderY + 5, c - 12, hipY + 7, PALETTE.hostBone, 1);
  linePx(ctx, c + 8, shoulderY + 5, c + 12, hipY + 7, PALETTE.hostBone, 1);
  px(ctx, c - 14, hipY + 7, PALETTE.hostBone, 3, 4);
  px(ctx, c + 12, hipY + 7, PALETTE.hostBone, 3, 4);

  // Thorn splinters and robe pool.
  linePx(ctx, c - 10, shoulderY + 2, c - 15, shoulderY - 4, PALETTE.hostBone);
  linePx(ctx, c + 10, shoulderY + 3, c + 15, shoulderY - 2, PALETTE.hostBone);
  px(ctx, c - 10, hipY + 4, PALETTE.hostBlack, 20, 10);
  px(ctx, c - 7, hipY + 12, PALETTE.hostRed, 14, 2);
  linePx(ctx, c - side * 4, shoulderY + 3, c + side * 7, hipY + 5, PALETTE.hostGold);
}

const MARA_STYLE = {
  shoulders: 15,
  waist: 9,
  torsoLength: 16,
  legLength: 24,
  headHeight: 9,
  legSize: 2,
  armSize: 2,
  coatTail: 7,
  coatHi: PALETTE.hostBone,
  coat: PALETTE.stoneDust,
  coatLo: PALETTE.stoneMid,
  coatDk: PALETTE.skinDark,
  pantsHi: PALETTE.stoneDust,
  pants: PALETTE.clothDark,
  pantsLo: PALETTE.stoneDark,
  pantsDk: PALETTE.void,
  boot: PALETTE.rustDark,
  bootHi: PALETTE.rustMid,
  bootLo: PALETTE.stoneDark,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  skinLo: PALETTE.skinDark,
  skinDk: PALETTE.clothDark,
  hair: PALETTE.clothDark,
  hairHi: PALETTE.stoneMid,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.stoneDark,
  belt: PALETTE.rustDark,
  weapon: PALETTE.stoneLight,
  hunch: 0,
  decorate: drawMaraDetails
};

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

const PEN_STYLE = {
  shoulders: 16,
  waist: 8,
  torsoLength: 18,
  legLength: 24,
  headHeight: 9,
  legSize: 2,
  armSize: 2,
  coatTail: 9,
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
  hunch: 5,
  hostHead: true,
  decorate: drawHostDetails
};

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

export function buildSpriteAtlas() {
  return {
    'mara-vey': bakeActor(42, 62, MARA_STYLE),
    'red-tithe-cutthroat': bakeActor(44, 64, CUT_STYLE),
    'host-touched-penitent': bakeActor(52, 68, PEN_STYLE)
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
