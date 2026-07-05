import { PALETTE } from '../palette.js';

import { FACINGS, FACING_META, POSES, compose, linePx, px } from './spriteBake.js';



function ratSide(meta) {
  return meta.side || (meta.back ? -1 : 1);
}

function ratSeg(ctx, x0, y0, x1, y1, color, size = 1) {
  linePx(ctx, x0, y0, x1, y1, color, size);
}

function drawRatPrayerRibs(ctx, bodyCx, bodyY, side, pose) {
  const glow = pose.bob ? PALETTE.hostGlow : PALETTE.hostGold;
  for (let i = 0; i < 5; i += 1) {
    const rootX = bodyCx - 10 + i * 5;
    const tipX = rootX + (i - 2) * 2;
    const tipY = bodyY - 21 - (i % 2);
    ratSeg(ctx, rootX, bodyY - 12, tipX, tipY, PALETTE.outline, 2);
    ratSeg(ctx, rootX, bodyY - 12, tipX, tipY, PALETTE.hostBone, 1);
    if (i === 1 || i === 3) px(ctx, tipX - 2, tipY - 1, PALETTE.stoneDust, 4, 1);
  }
  const crossX = bodyCx - side * 2;
  ratSeg(ctx, crossX, bodyY - 13, crossX, bodyY - 24, PALETTE.outline, 2);
  ratSeg(ctx, crossX, bodyY - 13, crossX, bodyY - 24, PALETTE.hostBone, 1);
  ratSeg(ctx, crossX - 6, bodyY - 19, crossX + 6, bodyY - 19, PALETTE.outline, 2);
  ratSeg(ctx, crossX - 5, bodyY - 19, crossX + 5, bodyY - 19, PALETTE.hostBone, 1);
  px(ctx, crossX, bodyY - 16, glow, 1, 2);
}

function drawRatFusedHands(ctx, bodyCx, bodyY, side) {
  const wristX = bodyCx + side * 5;
  const wristY = bodyY - 3;
  for (const hand of [-1, 1]) {
    const palmX = wristX + hand * 4;
    ratSeg(ctx, wristX, wristY, palmX, wristY + 9, PALETTE.outline, 2);
    ratSeg(ctx, wristX, wristY, palmX, wristY + 8, PALETTE.skinDark, 1);
    px(ctx, palmX - 2, wristY + 8, PALETTE.hostBone, 5, 2);
    for (let f = 0; f < 3; f += 1) px(ctx, palmX - 2 + f * 2, wristY + 10, PALETTE.hostBone, 1, 3);
  }
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
  drawRatPrayerRibs(ctx, bodyCx, bodyY, side, pose);
  drawRatFusedHands(ctx, bodyCx, bodyY, side);
  return { bodyCx, bodyY, headX, headY };
}

export function drawSixLeggedRat(ctx, w, h, facing, pose) {
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

export function drawThroatMawRat(ctx, w, h, facing, pose) {
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

export function drawTendrilWalkerRat(ctx, w, h, facing, pose) {
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

export function bakeHostRat(variant, drawBody) {
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
