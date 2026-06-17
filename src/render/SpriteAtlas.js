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
    // A stretched, screaming skull: cracked bone dome, hollow gold-pinned eye
    // sockets, a third eye, a too-wide mouth full of bone teeth, weeping gold,
    // and a pair of bone horns. Bold and high-contrast so it reads in-game.
    px(ctx, cx - 5, y - 1, PALETTE.hostBlack, 11, 13); // dark backing
    px(ctx, cx - 4, y, PALETTE.hostBone, 9, 11); // bone skull
    px(ctx, cx - 4, y, PALETTE.hostGold, 9, 1); // cracked crown seam
    px(ctx, cx - 1, y + 1, PALETTE.hostBlack, 1, 4); // split down the brow
    // hollow eye sockets + gold pinpoints, and a third eye opening
    px(ctx, cx - 3, y + 3, PALETTE.void, 2, 3);
    px(ctx, cx + 2, y + 3, PALETTE.void, 2, 3);
    px(ctx, cx - 3, y + 4, PALETTE.hostGold, 1, 1);
    px(ctx, cx + 3, y + 4, PALETTE.hostGold, 1, 1);
    px(ctx, cx, y, PALETTE.void, 1, 1);
    px(ctx, cx, y, PALETTE.hostGlow, 1, 1);
    // a too-wide screaming mouth with bone teeth
    px(ctx, cx - 4, y + 7, PALETTE.void, 9, 4);
    for (let t = 0; t < 5; t += 1) px(ctx, cx - 3 + t * 2, y + 7, PALETTE.hostBone, 1, 4);
    // black-gold weeping from the sockets, horns from the skull
    px(ctx, cx - 2, y + 6, PALETTE.hostGold, 1, 5);
    px(ctx, cx + 3, y + 6, PALETTE.hostGold, 1, 4);
    px(ctx, cx - 5, y - 3, PALETTE.hostBone, 1, 3);
    px(ctx, cx + 5, y - 3, PALETTE.hostBone, 1, 3);
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
  const pulse = pose.bob ? 1 : 0;
  const half = Math.max(6, Math.floor(torso.shoulderW / 2));

  // Big, broken bone halo wheeling above and behind the head.
  for (let n = 0; n < 18; n += 1) {
    if (n === 5 || n === 9 || n === 13) continue; // gaps in the ring
    const a = Math.PI * (0.02 + n * 0.057);
    const hx = c + Math.round(Math.cos(a) * 15);
    const hy = headY + 4 - Math.round(Math.sin(a) * 13);
    px(ctx, hx, hy, PALETTE.hostBone, n % 3 === 0 ? 2 : 1, 1);
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
    // The chest splayed open like chapel doors over a glowing black-gold wound.
    const cavTop = shoulderY + 5;
    const cavH = Math.max(8, hipY - cavTop - 1);
    px(ctx, c - 3, cavTop, PALETTE.void, 7, cavH);
    px(ctx, c - 2, cavTop + 1, PALETTE.hostBlack, 5, cavH - 1);
    for (let r = 0; r < 5; r += 1) {
      const ry = cavTop + 1 + r * 3;
      const sp = 4 + r;
      px(ctx, c - 3 - sp, ry, PALETTE.hostBone, sp, 1); // left rib door
      px(ctx, c + 3, ry, PALETTE.hostBone, sp, 1); // right rib door
      px(ctx, c - 3 - sp, ry + 1, PALETTE.hostGold, 1, 1);
      px(ctx, c + 2 + sp, ry + 1, PALETTE.hostGold, 1, 1);
    }
    const wy = cavTop + 3;
    px(ctx, c - 2, wy, PALETTE.hostRed, 5, 6);
    px(ctx, c - 1, wy + 1, pulse ? PALETTE.hostGlow : PALETTE.hostGold, 3, 4);
    px(ctx, c, wy + 2, PALETTE.flash, 1, 2);
    // a second screaming mouth low in the ribs, bone teeth
    const my = cavTop + cavH - 3;
    px(ctx, c - 4, my, PALETTE.void, 9, 3);
    for (let t = 0; t < 5; t += 1) px(ctx, c - 4 + t * 2, my, PALETTE.hostBone, 1, 3);
    // black-gold veins radiating from the wound
    linePx(ctx, c, wy + 2, c - half - 1, shoulderY + 2, PALETTE.hostGold);
    linePx(ctx, c, wy + 2, c + half + 1, shoulderY + 3, PALETTE.hostGold);
    linePx(ctx, c, wy + 4, c - 5, hipY + 2, PALETTE.hostGold);
    linePx(ctx, c, wy + 4, c + 5, hipY + 1, PALETTE.hostGold);
    // hanging viscera dripping from the cavity
    px(ctx, c - 2, hipY, PALETTE.hostRed, 2, 5);
    px(ctx, c + 2, hipY, PALETTE.hostRed, 1, 4);
  }

  // Bone-thorns bursting from both shoulders.
  linePx(ctx, c - half, shoulderY + 1, c - half - 6, shoulderY - 6, PALETTE.hostBone, 1);
  linePx(ctx, c - half + 1, shoulderY, c - half - 3, shoulderY - 8, PALETTE.hostBone, 1);
  linePx(ctx, c + half, shoulderY + 1, c + half + 6, shoulderY - 5, PALETTE.hostBone, 1);
  linePx(ctx, c + half - 1, shoulderY, c + half + 3, shoulderY - 8, PALETTE.hostBone, 1);

  // Elongated bone prayer-arms hanging too low, ending in too many fingers.
  for (const s of [-1, 1]) {
    const sx = c + s * (half - 1);
    const handY = hipY + 9;
    linePx(ctx, sx, shoulderY + 4, c + s * (half + 2), handY, PALETTE.hostBone, 2);
    for (let f = 0; f < 5; f += 1) {
      px(ctx, c + s * (half + 1) + (f - 2), handY, PALETTE.hostBone, 1, 3 + (f % 2));
    }
  }

  // Wet robe pool + black-gold sheen at the base.
  px(ctx, c - half, hipY + 6, PALETTE.hostBlack, half * 2, 8);
  px(ctx, c - half + 2, hipY + 13, PALETTE.hostRed, half * 2 - 4, 2);
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
  shoulders: 22,
  waist: 12,
  torsoLength: 24,
  legLength: 28,
  headHeight: 11,
  legSize: 3,
  armSize: 3,
  coatTail: 11,
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
    'choir-cultist': bakeActor(44, 64, CHOIR_STYLE),
    'red-tithe-cutthroat': bakeActor(44, 64, CUT_STYLE),
    'host-touched-penitent': bakeActor(64, 92, PEN_STYLE)
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
