import { PALETTE } from '../palette.js';

import { FACINGS, FACING_META, POSES, compose, linePx, px } from './spriteBake.js';

function wolfSide(meta) {
  return meta.side || (meta.back ? -1 : 1);
}

function wolfSeg(ctx, x0, y0, x1, y1, color, size = 1) {
  linePx(ctx, x0, y0, x1, y1, color, size);
}

function drawHorn(ctx, x0, y0, x1, y1, broken = false) {
  wolfSeg(ctx, x0, y0, x1, y1, PALETTE.outline, 3);
  wolfSeg(ctx, x0, y0, x1, y1, PALETTE.hostBone, 1);
  const notchCount = broken ? 2 : 4;
  for (let i = 1; i <= notchCount; i += 1) {
    const t = i / (notchCount + 1);
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    px(ctx, x, y, PALETTE.stoneDust, 2, 1);
  }
  if (broken) px(ctx, x1 - 1, y1, PALETTE.outline, 3, 1);
}

function drawSkullHead(ctx, headX, headY, side, pose, opts = {}) {
  const attack = pose.attack ?? 0;
  const maw = opts.maw ?? false;
  const open = maw || attack > 6;

  px(ctx, headX - 7, headY - 6, PALETTE.outline, 16, 11);
  px(ctx, headX - 6, headY - 5, PALETTE.hostBone, 13, 8);
  px(ctx, headX + side * 3, headY - 2, PALETTE.void, 3, 3);
  px(ctx, headX + side * 6, headY + 1, PALETTE.hostBlack, 7, 3);
  px(ctx, headX + side * 9, headY + 2, PALETTE.hostBone, 5, 2);
  px(ctx, headX + side * 1, headY - 1, pose.bob ? PALETTE.hostGlow : PALETTE.hostGold, 1, 1);

  drawHorn(ctx, headX - side * 4, headY - 7, headX - side * 12, headY - 15, false);
  drawHorn(ctx, headX + side * 3, headY - 7, headX + side * 8, headY - 10, true);

  if (!open) return;
  px(ctx, headX + side * 5, headY + 5, PALETTE.outline, 13, 6);
  px(ctx, headX + side * 5, headY + 5, PALETTE.void, 11, 4);
  for (let t = 0; t < 6; t += 1) {
    px(ctx, headX + side * (5 + t * 2), headY + 4 + (t % 2), PALETTE.hostBone, 1, 3);
  }
}

function drawWolfValeMarks(ctx, bodyCx, bodyY, side, pose) {
  const glow = pose.bob ? PALETTE.hostGlow : PALETTE.hostGold;
  for (let i = 0; i < 7; i += 1) {
    const rootX = bodyCx - 18 + i * 6;
    const tipX = rootX + (i - 3) * 2;
    const tipY = bodyY - 29 - (i % 2);
    wolfSeg(ctx, rootX, bodyY - 16, tipX, tipY, PALETTE.outline, 2);
    wolfSeg(ctx, rootX, bodyY - 16, tipX, tipY, i % 2 ? PALETTE.stoneDust : PALETTE.hostBone, 1);
  }
  const haloX = bodyCx + side * 3;
  for (const mark of [
    [-10, -28, -3, -35],
    [-3, -31, 4, -39],
    [5, -30, 13, -36]
  ]) {
    wolfSeg(ctx, haloX + mark[0], bodyY + mark[1], haloX + mark[2], bodyY + mark[3], PALETTE.outline, 3);
    wolfSeg(ctx, haloX + mark[0], bodyY + mark[1], haloX + mark[2], bodyY + mark[3], PALETTE.hostBone, 1);
  }
  const handY = bodyY + 2;
  for (const hand of [-1, 1]) {
    const wristX = bodyCx + side * 4 + hand * 4;
    wolfSeg(ctx, wristX, handY - 8, wristX + hand * 4, handY + 5, PALETTE.outline, 2);
    wolfSeg(ctx, wristX, handY - 8, wristX + hand * 4, handY + 4, PALETTE.skinDark, 1);
    px(ctx, wristX + hand * 4 - 2, handY + 4, PALETTE.hostBone, 5, 2);
    for (let f = 0; f < 3; f += 1) px(ctx, wristX + hand * 4 - 2 + f * 2, handY + 6, PALETTE.hostBone, 1, 3);
  }
  px(ctx, bodyCx + side * 2, bodyY - 17, glow, 2, 3);
}

function drawWolfBody(ctx, w, h, facing, pose, opts = {}) {
  const meta = FACING_META[facing] ?? FACING_META.se;
  const side = wolfSide(meta);
  const cx = Math.floor(w / 2);
  const footY = h - 8;
  const bob = pose.bob ?? 0;
  const attack = pose.attack ?? pose.reach ?? 0;
  const hit = pose.hit ? -side * 2 : 0;
  const crouch = pose.sneak ? 3 : 0;
  const bodyCx = cx + hit + Math.round(side * Math.min(3, attack / 4));
  const bodyY = footY - 13 + bob + crouch;
  const backShift = meta.back ? -2 : 0;

  // Low animal torso, still wolf-shaped, with Host-black hide and thin gold seams.
  for (let row = 0; row < 17; row += 1) {
    const taper = row < 8 ? row : 16 - row;
    const ww = 28 + taper * 3 - (meta.view === 'front' || meta.view === 'back' ? 6 : 0);
    const x = bodyCx - Math.floor(ww / 2) - side * 2;
    const y = bodyY - 12 + row + backShift;
    const tone = row < 4 ? PALETTE.stoneDark : row < 12 ? PALETTE.hostBlack : PALETTE.void;
    px(ctx, x - 1, y, PALETTE.outline, ww + 2, 1);
    px(ctx, x, y, tone, ww, 1);
    if (row < 5) px(ctx, x + 2, y, PALETTE.stoneDust, 3, 1);
    if ((row === 5 || row === 9) && !meta.back) px(ctx, x + ww - 7, y, PALETTE.hostGold, 4, 1);
    if (row === 7 && opts.ribHint) px(ctx, x + 8, y, PALETTE.hostBone, ww - 16, 1);
  }
  drawWolfValeMarks(ctx, bodyCx, bodyY, side, pose);

  const legA = pose.legA ?? 0;
  const legB = pose.legB ?? 0;
  const roots = [-17, -6, 7, 18];
  for (let i = 0; i < roots.length; i += 1) {
    const swing = i % 2 ? legA : legB;
    const rootX = bodyCx + roots[i] - side * 1;
    const rootY = bodyY - 3 + (i > 1 ? 2 : 0);
    const kneeX = rootX + side * Math.round(swing * 0.55);
    const kneeY = footY - 8 + (i % 2);
    const pawX = kneeX + side * (4 + Math.sign(swing || side) * (i % 2));
    const pawY = footY - (i % 2);
    const legTone = i < 2 ? PALETTE.stoneDark : PALETTE.hostBlack;
    wolfSeg(ctx, rootX, rootY, kneeX, kneeY, PALETTE.outline, 3);
    wolfSeg(ctx, kneeX, kneeY, pawX, pawY, PALETTE.outline, 3);
    wolfSeg(ctx, rootX, rootY, kneeX, kneeY, legTone, 1);
    wolfSeg(ctx, kneeX, kneeY, pawX, pawY, PALETTE.stoneDark, 1);
    px(ctx, pawX - 1, pawY, PALETTE.hostBone, 4, 1);
  }

  wolfSeg(ctx, bodyCx - side * 23, bodyY - 8, bodyCx - side * 38, bodyY - 12 + bob, PALETTE.outline, 4);
  wolfSeg(ctx, bodyCx - side * 23, bodyY - 8, bodyCx - side * 37, bodyY - 12 + bob, PALETTE.hostBlack, 2);
  px(ctx, bodyCx - side * 39, bodyY - 14 + bob, PALETTE.hostBone, 2, 2);

  const headX = bodyCx + side * (23 + Math.floor(attack / 2));
  const headY = bodyY - 11 + Math.floor(attack / 5) + (meta.back ? -1 : 0);
  drawSkullHead(ctx, headX, headY, side, pose, opts);

  return { bodyCx, bodyY, footY, headX, headY, side, meta };
}

export function drawHostWolfSpider(ctx, w, h, facing, pose) {
  const info = drawWolfBody(ctx, w, h, facing, pose, { ribHint: true });
  const sway = pose.legB ?? pose.bob ?? 0;
  const roots = [-12, -6, 2, 8, 14, 20];
  for (let i = 0; i < roots.length; i += 1) {
    const localSide = i < 3 ? -1 : 1;
    const baseX = info.bodyCx + roots[i] - info.side * 2;
    const baseY = info.bodyY - 11 + (i % 3);
    const kneeX = baseX + localSide * (10 + (i % 3) * 3);
    const kneeY = baseY - 11 - (i % 2);
    const footX = kneeX + localSide * (7 + Math.sign(sway || 1) * (i % 2 ? 2 : -1));
    const footY = info.footY - 1 + (i % 2);
    wolfSeg(ctx, baseX, baseY, kneeX, kneeY, PALETTE.outline, 3);
    wolfSeg(ctx, kneeX, kneeY, footX, footY, PALETTE.outline, 3);
    wolfSeg(ctx, baseX, baseY, kneeX, kneeY, i % 2 ? PALETTE.hostBone : PALETTE.hostRed, 1);
    wolfSeg(ctx, kneeX, kneeY, footX, footY, i % 2 ? PALETTE.stoneDust : PALETTE.hostGold, 1);
    px(ctx, footX - 1, footY, PALETTE.void, 3, 1);
  }
  px(ctx, info.bodyCx - 3, info.bodyY - 9, PALETTE.hostRed, 7, 4);
  px(ctx, info.bodyCx - 1, info.bodyY - 8, pose.bob ? PALETTE.hostGlow : PALETTE.hostGold, 2, 2);
}

export function drawHostWolfMaw(ctx, w, h, facing, pose) {
  const info = drawWolfBody(ctx, w, h, facing, pose, { maw: true });
  const throatX = info.headX - info.side * 3;
  const throatY = info.headY + 5;
  for (let i = 0; i < 5; i += 1) {
    const rootX = throatX - info.side * (i % 2);
    const rootY = throatY + i;
    const tipX = rootX - info.side * (9 + i * 2);
    const tipY = throatY + 7 + i;
    wolfSeg(ctx, rootX, rootY, tipX, tipY, i % 2 ? PALETTE.hostRed : PALETTE.hostBlack, 1);
    px(ctx, tipX, tipY, PALETTE.hostGold, 1, 1);
  }
  px(ctx, throatX - 3, throatY - 1, PALETTE.hostRed, 7, 4);
  px(ctx, throatX, throatY, pose.bob ? PALETTE.hostGlow : PALETTE.hostGold, 1, 2);
}

export function drawHostWolfRibsplit(ctx, w, h, facing, pose) {
  const info = drawWolfBody(ctx, w, h, facing, pose, { ribHint: true });
  const chestX = info.bodyCx + info.side * 2;
  const chestY = info.bodyY - 8;
  px(ctx, chestX - 7, chestY - 1, PALETTE.void, 15, 9);
  px(ctx, chestX - 5, chestY, PALETTE.hostBlack, 11, 7);
  for (let r = 0; r < 5; r += 1) {
    wolfSeg(ctx, chestX - 2, chestY + r * 2, chestX - 13 - r, chestY - 5 + r, PALETTE.outline, 2);
    wolfSeg(ctx, chestX + 2, chestY + r * 2, chestX + 13 + r, chestY - 4 + r, PALETTE.outline, 2);
    wolfSeg(ctx, chestX - 2, chestY + r * 2, chestX - 12 - r, chestY - 5 + r, PALETTE.hostBone, 1);
    wolfSeg(ctx, chestX + 2, chestY + r * 2, chestX + 12 + r, chestY - 4 + r, PALETTE.stoneDust, 1);
  }
  px(ctx, chestX, chestY - 2, pose.bob ? PALETTE.hostGlow : PALETTE.hostGold, 1, 11);
  px(ctx, chestX + 2, chestY + 3, PALETTE.rustDark, 2, 3);
}

function drawWolfDeath(ctx, w, h, variant, frame) {
  const cx = Math.floor(w / 2);
  const cy = h - 12;
  const settle = Math.min(1, frame / 7);
  const bodyW = Math.round(38 + settle * 14);
  for (let row = 0; row < 9; row += 1) {
    const ww = Math.max(16, bodyW - Math.abs(row - 4) * 4);
    const x = cx - Math.floor(ww / 2) - 3;
    const y = cy - 8 + row;
    px(ctx, x - 1, y, PALETTE.outline, ww + 2, 1);
    px(ctx, x, y, row < 3 ? PALETTE.stoneDark : row < 7 ? PALETTE.hostBlack : PALETTE.void, ww, 1);
    if (row === 4) px(ctx, x + 8, y, PALETTE.hostGold, ww - 16, 1);
  }
  px(ctx, cx + 19, cy - 12, PALETTE.hostBone, 12, 8);
  px(ctx, cx + 24, cy - 10, PALETTE.void, 3, 2);
  px(ctx, cx + 27, cy - 7, PALETTE.hostBlack, 6, 2);
  px(ctx, cx - 24, cy - 11, PALETTE.hostBlack, 15, 3);
  for (const dx of [-16, -6, 6, 15]) {
    wolfSeg(ctx, cx + dx, cy - 2, cx + dx + 8, cy + 6, PALETTE.stoneDark, 1);
    px(ctx, cx + dx + 8, cy + 6, PALETTE.hostBone, 3, 1);
  }
  if (variant === 'spider') {
    for (let i = 0; i < 6; i += 1) {
      const side = i < 3 ? -1 : 1;
      wolfSeg(ctx, cx - 5 + i * 3, cy - 7, cx + side * (24 + i * 2), cy + (i % 2 ? 2 : 5), i % 2 ? PALETTE.hostBone : PALETTE.hostRed, 1);
    }
  } else if (variant === 'maw') {
    px(ctx, cx + 20, cy - 7, PALETTE.void, 14, 5);
    for (let i = 0; i < 8; i += 1) px(ctx, cx + 20 + i * 2, cy - 8 + (i % 2), PALETTE.hostBone, 1, 3);
  } else {
    for (let r = 0; r < 5; r += 1) {
      wolfSeg(ctx, cx - 2, cy - 6 + r * 2, cx - 17 - r, cy - 11 + r, PALETTE.hostBone, 1);
      wolfSeg(ctx, cx + 2, cy - 6 + r * 2, cx + 16 + r, cy - 10 + r, PALETTE.stoneDust, 1);
    }
  }
  px(ctx, cx - 1, cy - 6, frame % 2 ? PALETTE.hostGold : PALETTE.hostRed, 2, 1);
}

export function bakeHostWolf(variant, drawBody) {
  const w = 72;
  const h = 54;
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
    compose(w, h, (ctx) => drawWolfDeath(ctx, w, h, variant, frame))
  );
  return {
    width: w,
    height: h,
    anchorX: Math.floor(w / 2),
    anchorY: h - 4,
    frames,
    death
  };
}
