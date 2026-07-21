import { PALETTE } from '../palette.js';

import {
  FACINGS,
  FACING_META,
  POSES,
  compose,
  detailLinePx,
  detailPx,
  linePx,
  makeLazyFrameList,
  px
} from './spriteBake.js';

function wolfSide(meta) {
  return meta.side || (meta.back ? -1 : 1);
}

function wolfSeg(ctx, x0, y0, x1, y1, color, size = 1) {
  linePx(ctx, x0, y0, x1, y1, color, size);
}

// A ridged, curling horn drawn from a base point along an offset path. The
// notch highlights and the dark socket read as ram/goat bone, not a smooth spike.
function drawHorn(ctx, baseX, baseY, path, broken = false) {
  for (const [dx, dy] of path) px(ctx, baseX + dx - 1, baseY + dy - 1, PALETTE.outline, 4, 4);
  for (let i = 0; i < path.length; i += 1) {
    const [dx, dy] = path[i];
    px(ctx, baseX + dx, baseY + dy, PALETTE.hostBone, 2, 2);
    if (i % 2 === 1) px(ctx, baseX + dx, baseY + dy, PALETTE.stoneDust, 1, 1); // ridge notch
  }
  if (broken) {
    const [dx, dy] = path[path.length - 1];
    px(ctx, baseX + dx, baseY + dy - 1, PALETTE.hostBlack, 2, 2); // snapped, jagged tip
  }
  const [rootX, rootY] = path[0];
  const [tipX, tipY] = path[path.length - 1];
  detailLinePx(ctx, baseX + rootX + 0.5, baseY + rootY - 0.5, baseX + tipX + 0.5, baseY + tipY - 0.5, PALETTE.stoneDust);
}

// A profile goat/ram skull for a fully opened Host head. The long muzzle that
// drops forward and down is the silhouette tell; the horns are asymmetric (one
// long ram curl, one snapped stump) per the Vale Imprint standard.
function drawSkullHead(ctx, hx, hy, s, pose, opts = {}, back = false) {
  const attack = pose.attack ?? 0;
  const open = (opts.maw ?? false) || attack > 6;
  const glow = pose.bob ? PALETTE.hostGlow : PALETTE.hostGold;
  const bone = PALETTE.hostBone;
  const boneLo = PALETTE.stoneDust;

  // Elongated cranium at the back of the head: taller than wide, not a ball.
  for (let row = 0; row < 9; row += 1) {
    const w = 8 - (row < 2 ? 2 : 0) - (row > 6 ? row - 6 : 0);
    const x = hx - s * 4 - Math.floor(w / 2);
    px(ctx, x - 1, hy - 5 + row, PALETTE.outline, w + 2, 1);
    px(ctx, x, hy - 5 + row, row < 3 ? bone : boneLo, w, 1);
    px(ctx, x, hy - 5 + row, bone, 1, 1); // lit crown, upper-left
  }
  px(ctx, hx - s * 7, hy - 3, PALETTE.hostBlack, 2, 3); // shaded back of the skull

  // Long muzzle dropping forward and down: the goat/ram silhouette tell.
  for (let i = 0; i < 9; i += 1) {
    const w = Math.max(2, 6 - Math.floor(i / 2));
    const mx = hx + s * (i - 1);
    const my = hy - 1 + Math.floor(i * 0.55);
    const left = mx - Math.floor(w / 2);
    px(ctx, left - 1, my, PALETTE.outline, w + 2, 1);
    px(ctx, left, my, i < 5 ? bone : boneLo, w, 1);
    px(ctx, left, my, bone, 1, 1);
    if (i > 2 && i < 8) px(ctx, left, my + 1, PALETTE.hostBlack, w, 1); // muzzle seam / underside
  }
  px(ctx, hx + s * 6, hy + 3, PALETTE.void, 1, 2); // nostril pit

  // Deep angled socket where the cranium meets the muzzle; a gold goat-pupil
  // when the head is alive.
  px(ctx, hx - s * 1, hy - 2, PALETTE.void, 3, 3);
  if (!back) px(ctx, hx - (s > 0 ? 0 : -1), hy - 1, glow, 1, 1);

  // Horns from the top of the cranium: the near horn is a long ram curl, the
  // far one is snapped to a stub.
  drawHorn(ctx, hx - s * 3, hy - 5, [
    [0, 0], [-s * 2, -2], [-s * 4, -3], [-s * 6, -1], [-s * 7, 2], [-s * 6, 5], [-s * 4, 6]
  ]);
  drawHorn(ctx, hx - s * 1, hy - 5, [[0, 0], [s * 1, -2], [s * 2, -3]], true);

  // Jaw: torn open with bone teeth when attacking or a maw form, else a clenched
  // seam. A little light sits in the throat when alive.
  if (open) {
    const jy = hy + 5;
    const left = Math.min(hx, hx + s * 9) - 1;
    px(ctx, left, jy, PALETTE.outline, 11, 1);
    px(ctx, left, jy - 1, PALETTE.void, 11, 4);
    for (let i = 0; i < 6; i += 1) {
      const tx = Math.round(hx + s * (i * 1.6));
      px(ctx, tx, jy - 1, bone, 1, 2); // upper fang
      px(ctx, tx, jy + 3, bone, 1, 2); // lower fang
    }
    if (!back) px(ctx, hx + s * 3, jy + 1, glow, 1, 1);
  } else {
    px(ctx, hx - 2, hy + 4, PALETTE.hostBlack, 7, 1); // clenched jaw seam
  }

  detailLinePx(ctx, hx - s * 5.5, hy - 4.5, hx - s * 1.5, hy - 3.5, bone);
  detailLinePx(ctx, hx + s * 0.5, hy - 0.5, hx + s * 6.5, hy + 2.5, boneLo);
  if (!back) detailPx(ctx, hx - (s > 0 ? -0.5 : 0), hy - 0.5, glow);
}

function drawWolfValeMarks(ctx, bodyCx, bodyY, side, pose) {
  // Uneven bone thorns erupt along the spine, snapped to different lengths so
  // the row of them never reads as a tidy fin. One is broken to a stub.
  const spikes = [-16, -9, -2, 5, 12];
  for (let i = 0; i < spikes.length; i += 1) {
    const rootX = bodyCx + spikes[i];
    const len = i === 2 ? 4 : 8 + ((i * 5 + 3) % 6);
    const tipX = rootX + (i % 2 ? 2 : -2);
    const tipY = bodyY - 15 - len;
    wolfSeg(ctx, rootX, bodyY - 14, tipX, tipY, PALETTE.outline, 3);
    wolfSeg(ctx, rootX, bodyY - 14, tipX, tipY, i % 2 ? PALETTE.hostBone : PALETTE.stoneDust, 1);
    if (i === 2) px(ctx, tipX, tipY, PALETTE.hostBlack, 2, 1); // snapped stub
  }

  // A single fused prayer-hand knot pressed to the chest (one knot, not a tidy
  // symmetric pair): human skin fingers gone to bone at the tips.
  const handX = bodyCx + side * 7;
  const handY = bodyY - 2;
  wolfSeg(ctx, handX, handY - 8, handX + side * 2, handY + 3, PALETTE.outline, 3);
  wolfSeg(ctx, handX, handY - 8, handX + side * 2, handY + 3, PALETTE.skinDark, 1);
  px(ctx, handX + side * 2 - 1, handY + 3, PALETTE.hostBone, 4, 2);
  for (let f = 0; f < 3; f += 1) px(ctx, handX + side * 2 - 1 + f, handY + 5, PALETTE.hostBone, 1, 2);

  // Thin black-gold seams run under the hide (a trace, not a flood). The pulsing
  // wound itself belongs to each variant body.
  px(ctx, bodyCx - side * 3, bodyY - 10, PALETTE.hostGold, 1, 1);
  px(ctx, bodyCx + side * 4, bodyY - 6, PALETTE.hostGold, 1, 1);
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
  drawSkullHead(ctx, headX, headY, side, pose, opts, !!meta.back);

  // Backing-pixel hide and bone construction stays inside the established
  // silhouette while preserving the uneven Vale Imprint anatomy.
  detailLinePx(ctx, bodyCx - 15.5, bodyY - 11.5 + backShift, bodyCx + 14.5, bodyY - 11.5 + backShift, PALETTE.stoneDust);
  detailLinePx(ctx, bodyCx - side * 20.5, bodyY - 7.5, bodyCx - side * 34.5, bodyY - 11.5 + bob, PALETTE.hostGold);
  detailLinePx(ctx, bodyCx - side * 5.5, bodyY - 8.5, bodyCx + side * 6.5, bodyY - 5.5, PALETTE.hostGold);
  detailPx(ctx, bodyCx + side * 7.5, bodyY + 1.5, PALETTE.hostBone);

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
  detailLinePx(ctx, info.bodyCx - 2.5, info.bodyY - 8.5, info.bodyCx + 2.5, info.bodyY - 6.5, PALETTE.hostGlow);
  detailLinePx(ctx, info.bodyCx - 11.5, info.bodyY - 14.5, info.bodyCx + 11.5, info.bodyY - 13.5, PALETTE.hostBone);
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
  detailLinePx(ctx, throatX - 2.5, throatY - 0.5, throatX + 2.5, throatY + 1.5, PALETTE.hostRed);
  detailLinePx(ctx, throatX - info.side * 0.5, throatY + 1.5, throatX - info.side * 12.5, throatY + 9.5, PALETTE.hostGold);
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
  detailLinePx(ctx, chestX + 0.5, chestY - 1.5, chestX + 0.5, chestY + 7.5, PALETTE.hostGlow);
  detailLinePx(ctx, chestX - 5.5, chestY + 0.5, chestX - 12.5, chestY - 3.5, PALETTE.hostBone);
  detailLinePx(ctx, chestX + 5.5, chestY + 0.5, chestX + 12.5, chestY - 2.5, PALETTE.stoneDust);
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
  detailLinePx(ctx, cx - bodyW / 2 + 3.5, cy - 7.5, cx + bodyW / 2 - 4.5, cy - 7.5, PALETTE.stoneDust);
  detailLinePx(ctx, cx + 19.5, cy - 11.5, cx + 28.5, cy - 9.5, PALETTE.hostBone);
  detailPx(ctx, cx - 0.5, cy - 5.5, frame % 2 ? PALETTE.hostGold : PALETTE.hostRed);
}

export function bakeHostWolf(variant, drawBody) {
  const w = 72;
  const h = 54;
  const frames = {};
  for (const state of Object.keys(POSES)) {
    frames[state] = {};
    for (const facing of FACINGS) {
      frames[state][facing] = makeLazyFrameList(POSES[state].length, (frame) =>
        compose(w, h, (ctx) => drawBody(ctx, w, h, facing, POSES[state][frame]))
      );
    }
  }
  const death = makeLazyFrameList(10, (frame) =>
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
