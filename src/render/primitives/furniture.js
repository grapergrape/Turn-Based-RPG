import { PALETTE } from '../palette.js';
import { TILE_WIDTH, TILE_HEIGHT, WALL_HEIGHT } from '../renderConfig.js';
import {
  diamond,
  drawCracks,
  drawDitherRect,
  drawFloorGrime,
  drawHostGrowth,
  drawIsoDiamond,
  drawIsoPrism,
  drawNoisePixels,
  drawPixelShadow,
  drawPropLeg,
  drawRubbleCluster,
  drawScorchMark,
  drawShadowBlob,
  drawWarmLightPool,
  drawWaxStain,
  faceTools,
  footprintExtent,
  hash2D,
  isoFrame,
  linePx,
  mixPoint,
  normalizeOrient,
  ORIENTS,
  orientedBox,
  poly,
  px,
  rngFrom,
  wallRunFace
} from './basePixels.js';
import { drawRustedCrate } from './props.js';

// Furniture and settlement structure primitives.

export function drawBrokenPew(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 8, 68, 21);
  const rng = rngFrom(hash2D(seed + 13, seed * 9 + 1));

  // Long chapel bench seat: thin planks, not a solid block.
  const seatTop = [
    [cx - 34, cy - 4],
    [cx + 13, cy - 18],
    [cx + 33, cy - 9],
    [cx - 15, cy + 6]
  ];
  const seatFront = [
    [cx - 15, cy + 6],
    [cx + 33, cy - 9],
    [cx + 33, cy - 4],
    [cx - 15, cy + 12]
  ];
  poly(ctx, PALETTE.outline, [
    [seatTop[0][0] - 1, seatTop[0][1] + 1],
    [seatTop[1][0], seatTop[1][1] - 1],
    [seatTop[2][0] + 1, seatTop[2][1] + 1],
    [seatFront[2][0] + 1, seatFront[2][1] + 1],
    [seatFront[3][0] - 1, seatFront[3][1] + 1]
  ]);
  poly(ctx, PALETTE.woodMid, seatFront);
  poly(ctx, PALETTE.woodLight, seatTop);

  for (let i = 0; i < 4; i += 1) {
    const off = i * 9;
    ctx.strokeStyle = i === 2 ? PALETTE.woodDark : PALETTE.woodMid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 29 + off, cy - 5 + Math.floor(off * 0.08));
    ctx.lineTo(cx + 3 + off, cy - 16 + Math.floor(off * 0.08));
    ctx.stroke();
  }

  // Back rail and posts. The missing right rail makes the ruin read fast.
  px(ctx, cx - 30, cy - 29, PALETTE.outline, 5, 35);
  px(ctx, cx - 28, cy - 30, PALETTE.woodDark, 3, 33);
  px(ctx, cx + 17, cy - 42, PALETTE.outline, 5, 35);
  px(ctx, cx + 19, cy - 43, PALETTE.woodDark, 3, 31);
  ctx.lineWidth = 5;
  ctx.strokeStyle = PALETTE.outline;
  ctx.beginPath();
  ctx.moveTo(cx - 28, cy - 29);
  ctx.lineTo(cx + 18, cy - 41);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.woodLight;
  ctx.beginPath();
  ctx.moveTo(cx - 27, cy - 30);
  ctx.lineTo(cx + 17, cy - 41);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.woodMid;
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy - 20);
  ctx.lineTo(cx + 8, cy - 29);
  ctx.stroke();

  // Thin legs and splinters.
  for (const leg of [[-24, 5], [-4, 0], [22, -8]]) {
    px(ctx, cx + leg[0], cy + leg[1], PALETTE.outline, 4, 12);
    px(ctx, cx + leg[0] + 1, cy + leg[1], PALETTE.woodDark, 2, 10);
  }
  for (let i = 0; i < 9; i += 1) {
    px(ctx, cx + 18 + Math.floor(rng() * 18), cy - 6 + Math.floor((rng() - 0.5) * 13), PALETTE.woodDark);
  }
}

export function drawCanvasTent(ctx, cx, cy, seed) {
  const lean = (seed & 1) ? 2 : -2;
  drawShadowBlob(ctx, cx, cy + 8, 62, 24);
  poly(ctx, PALETTE.outline, [
    [cx - 31, cy - 2],
    [cx - 4 + lean, cy - 31],
    [cx + 30, cy - 1],
    [cx + 24, cy + 12],
    [cx - 26, cy + 12]
  ]);
  poly(ctx, PALETTE.clothTan, [
    [cx - 28, cy - 1],
    [cx - 4 + lean, cy - 29],
    [cx - 1 + lean, cy + 9],
    [cx - 26, cy + 10]
  ]);
  poly(ctx, PALETTE.stoneDust, [
    [cx - 4 + lean, cy - 29],
    [cx + 27, cy - 1],
    [cx + 22, cy + 10],
    [cx - 1 + lean, cy + 9]
  ]);
  poly(ctx, PALETTE.void, [
    [cx - 5 + lean, cy - 5],
    [cx + 6 + lean, cy + 8],
    [cx - 12 + lean, cy + 8]
  ]);
  linePx(ctx, cx - 4 + lean, cy - 29, cx - 2 + lean, cy + 11, PALETTE.woodMid, 2);
  linePx(ctx, cx - 25, cy + 7, cx - 34, cy + 13, PALETTE.rustDark);
  linePx(ctx, cx + 23, cy + 7, cx + 32, cy + 12, PALETTE.rustDark);
  px(ctx, cx - 14, cy - 14, PALETTE.hostBone, 9, 1);
  px(ctx, cx + 5, cy - 11, PALETTE.clothDark, 11, 1);
  drawNoisePixels(ctx, cx - 26, cy - 27, 52, 38, [PALETTE.stoneDark, PALETTE.rustDark], 0.028, seed);
}

export function drawCampBedroll(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 4, 38, 13);
  const flip = (seed & 1) ? -1 : 1;
  poly(ctx, PALETTE.outline, [
    [cx - 19 * flip, cy - 6],
    [cx - 1 * flip, cy - 14],
    [cx + 18 * flip, cy - 6],
    [cx + 12 * flip, cy + 5],
    [cx - 12 * flip, cy + 6]
  ]);
  poly(ctx, PALETTE.clothDark, [
    [cx - 17 * flip, cy - 5],
    [cx - 1 * flip, cy - 12],
    [cx + 16 * flip, cy - 5],
    [cx + 10 * flip, cy + 4],
    [cx - 11 * flip, cy + 5]
  ]);
  poly(ctx, PALETTE.stoneDust, [
    [cx - 13 * flip, cy - 7],
    [cx - 1 * flip, cy - 12],
    [cx + 12 * flip, cy - 7],
    [cx - 1 * flip, cy - 3]
  ]);
  px(ctx, cx - 14, cy, PALETTE.rustDark, 28, 2);
  px(ctx, cx - 8, cy - 8, PALETTE.clothTan, 15, 1);
  px(ctx, cx + 9 * flip, cy - 4, PALETTE.hostBone, 5, 1);
}

export function drawSettlementTable(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 8, 66, 22);
  const rng = rngFrom(hash2D(seed + 67, seed * 5 + 3));
  const top = [
    [cx - 34, cy - 12],
    [cx - 6, cy - 26],
    [cx + 31, cy - 12],
    [cx + 3, cy + 4]
  ];
  const front = [
    [cx - 27, cy - 5],
    [cx + 3, cy + 4],
    [cx + 31, cy - 12],
    [cx + 29, cy - 6],
    [cx + 2, cy + 10],
    [cx - 28, cy - 1]
  ];

  poly(ctx, PALETTE.outline, [
    [cx - 36, cy - 12],
    [cx - 7, cy - 28],
    [cx + 34, cy - 13],
    [cx + 31, cy - 5],
    [cx + 2, cy + 12],
    [cx - 30, cy]
  ]);
  poly(ctx, PALETTE.woodDark, front);
  poly(ctx, PALETTE.woodMid, top);
  poly(ctx, PALETTE.woodLight, [
    [cx - 31, cy - 13],
    [cx - 6, cy - 25],
    [cx + 2, cy - 22],
    [cx - 22, cy - 9]
  ]);

  for (const off of [-23, -13, -3, 8, 19]) {
    ctx.strokeStyle = off === 8 ? PALETTE.woodDark : PALETTE.stoneDark;
    ctx.lineWidth = off === 8 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx - 27 + off, cy - 12 + Math.floor(off * 0.06));
    ctx.lineTo(cx + 2 + off, cy - 25 + Math.floor(off * 0.06));
    ctx.stroke();
  }

  // Broken far corner and trestle legs make the table feel repaired, not cute.
  px(ctx, cx + 21, cy - 15, PALETTE.outline, 8, 3);
  px(ctx, cx + 22, cy - 14, PALETTE.woodDark, 5, 2);
  for (const leg of [[-24, -3], [-7, 4], [18, -7]]) {
    px(ctx, cx + leg[0], cy + leg[1], PALETTE.outline, 4, 15);
    px(ctx, cx + leg[0] + 1, cy + leg[1], PALETTE.woodDark, 2, 13);
  }
  linePx(ctx, cx - 21, cy + 6, cx + 17, cy - 6, PALETTE.outline, 2);
  linePx(ctx, cx - 20, cy + 5, cx + 16, cy - 7, PALETTE.woodDark, 1);

  // Household evidence kept tiny so it reads as mess, not icons.
  drawIsoDiamond(ctx, cx - 13, cy - 16, 10, 5, PALETTE.stoneDust);
  drawIsoDiamond(ctx, cx + 8, cy - 14, 8, 4, PALETTE.rustDark);
  px(ctx, cx - 14, cy - 18, PALETTE.void, 5, 1);
  px(ctx, cx + 6, cy - 16, PALETTE.stoneDark, 5, 1);
  px(ctx, cx - 1, cy - 17, PALETTE.hostBone, 2, 2);
  for (let i = 0; i < 12; i += 1) {
    const color = rng() < 0.4 ? PALETTE.stoneDark : PALETTE.woodDark;
    px(ctx, cx - 28 + Math.floor(rng() * 55), cy - 20 + Math.floor(rng() * 18), color);
  }
}

export function drawLowStool(ctx, cx, cy, seed) {
  const lean = (seed & 1) ? 2 : -2;
  drawShadowBlob(ctx, cx, cy + 4, 25, 10);
  const top = [
    [cx - 13 + lean, cy - 7],
    [cx - 2 + lean, cy - 13],
    [cx + 13 + lean, cy - 7],
    [cx + 2 + lean, cy]
  ];
  poly(ctx, PALETTE.outline, [
    [cx - 15 + lean, cy - 7],
    [cx - 2 + lean, cy - 15],
    [cx + 15 + lean, cy - 7],
    [cx + 2 + lean, cy + 2]
  ]);
  poly(ctx, PALETTE.woodMid, top);
  poly(ctx, PALETTE.woodDark, [
    [cx - 11 + lean, cy - 5],
    [cx + 2 + lean, cy],
    [cx + 13 + lean, cy - 7],
    [cx + 12 + lean, cy - 4],
    [cx + 2 + lean, cy + 4],
    [cx - 11 + lean, cy - 1]
  ]);
  px(ctx, cx - 7 + lean, cy - 10, PALETTE.woodLight, 10, 1);
  for (const leg of [[-9, -1], [0, 4], [9, -2]]) {
    px(ctx, cx + leg[0] + lean, cy + leg[1], PALETTE.outline, 3, 9);
    px(ctx, cx + leg[0] + 1 + lean, cy + leg[1], PALETTE.woodDark, 1, 8);
  }
  px(ctx, cx + 8 + lean, cy - 8, PALETTE.outline, 4, 2);
}

export function drawKitchenHearth(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 8, 64, 22);
  const rng = rngFrom(hash2D(seed + 83, seed * 7 + 9));
  drawIsoPrism(ctx, cx, cy + 2, 60, 28, 15, {
    top: PALETTE.stoneMid,
    left: PALETTE.stoneDark,
    right: PALETTE.void,
    outline: PALETTE.outline
  });
  poly(ctx, PALETTE.outline, [
    [cx - 28, cy - 17],
    [cx - 5, cy - 29],
    [cx + 27, cy - 17],
    [cx + 24, cy - 8],
    [cx - 4, cy + 6],
    [cx - 28, cy - 5]
  ]);
  poly(ctx, PALETTE.stoneDark, [
    [cx - 25, cy - 16],
    [cx - 5, cy - 27],
    [cx + 24, cy - 16],
    [cx - 4, cy - 2]
  ]);
  poly(ctx, PALETTE.stoneMid, [
    [cx - 23, cy - 18],
    [cx - 5, cy - 27],
    [cx + 2, cy - 24],
    [cx - 16, cy - 14]
  ]);

  // Off-center oven mouth and ash bed. Avoids the face-like symmetry.
  poly(ctx, PALETTE.outline, [
    [cx - 16, cy - 13],
    [cx - 4, cy - 19],
    [cx + 10, cy - 14],
    [cx + 9, cy - 5],
    [cx - 7, cy],
    [cx - 17, cy - 5]
  ]);
  poly(ctx, PALETTE.void, [
    [cx - 13, cy - 12],
    [cx - 4, cy - 17],
    [cx + 7, cy - 13],
    [cx + 7, cy - 6],
    [cx - 6, cy - 2],
    [cx - 14, cy - 6]
  ]);
  px(ctx, cx - 11, cy - 5, PALETTE.rustDark, 17, 3);
  px(ctx, cx - 3, cy - 8, PALETTE.stoneDark, 6, 2);

  drawIsoDiamond(ctx, cx + 16, cy - 15, 16, 8, PALETTE.outline);
  drawIsoDiamond(ctx, cx + 16, cy - 16, 13, 6, PALETTE.rustDark);
  px(ctx, cx + 10, cy - 18, PALETTE.stoneDark, 12, 1);
  linePx(ctx, cx + 10, cy - 21, cx + 4, cy - 18, PALETTE.rustDark);
  linePx(ctx, cx + 23, cy - 19, cx + 28, cy - 16, PALETTE.rustDark);

  for (let i = 0; i < 9; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 48);
    const y = cy - 24 + Math.floor(rng() * 25);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.stoneDark : PALETTE.rustDark);
  }
  drawNoisePixels(ctx, cx - 25, cy - 22, 50, 24, [PALETTE.stoneDark, PALETTE.rustDark], 0.06, seed);
}

export function drawPantryShelf(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 7, 43, 17);
  const lean = (seed & 1) ? 2 : -2;
  linePx(ctx, cx - 21 + lean, cy - 55, cx - 24 + lean, cy + 1, PALETTE.outline, 4);
  linePx(ctx, cx + 19 + lean, cy - 53, cx + 17 + lean, cy + 2, PALETTE.outline, 4);
  linePx(ctx, cx - 20 + lean, cy - 54, cx - 23 + lean, cy, PALETTE.woodDark, 2);
  linePx(ctx, cx + 20 + lean, cy - 52, cx + 18 + lean, cy + 1, PALETTE.woodDark, 2);

  for (const shelf of [
    [-46, 42],
    [-32, 36],
    [-17, 43]
  ]) {
    drawIsoPrism(ctx, cx + lean, cy + shelf[0], shelf[1], 10, 4, {
      top: PALETTE.woodMid,
      left: PALETTE.woodDark,
      right: PALETTE.stoneDark,
      outline: PALETTE.outline
    });
  }

  // Irregular sacks and jars, subdued to avoid toy-like eyes.
  for (const item of [
    [-15, -48, PALETTE.rustDark, 6, 7],
    [-5, -48, PALETTE.stoneDust, 5, 5],
    [8, -46, PALETTE.clothTan, 7, 4],
    [-13, -34, PALETTE.clothDark, 8, 6],
    [2, -32, PALETTE.rustMid, 5, 5],
    [12, -20, PALETTE.stoneDark, 7, 4],
    [-4, -18, PALETTE.clothTan, 9, 3]
  ]) {
    px(ctx, cx + item[0] + lean, cy + item[1], PALETTE.outline, item[3] + 2, item[4] + 1);
    px(ctx, cx + item[0] + 1 + lean, cy + item[1], item[2], item[3], item[4]);
    if (item[2] !== PALETTE.stoneDark) px(ctx, cx + item[0] + 2 + lean, cy + item[1], PALETTE.stoneDust, 2, 1);
  }
  px(ctx, cx + 12 + lean, cy - 35, PALETTE.outline, 9, 2);
  px(ctx, cx + 12 + lean, cy - 34, PALETTE.woodDark, 7, 1);
  drawNoisePixels(ctx, cx - 22, cy - 52, 43, 49, [PALETTE.woodDark, PALETTE.stoneDark], 0.045, seed);
}

export function drawWashTub(ctx, cx, cy, seed) {
  drawShadowBlob(ctx, cx, cy + 6, 43, 15);
  const shift = (seed & 1) ? 1 : -1;
  const rim = [
    [cx - 22 + shift, cy - 12],
    [cx - 3 + shift, cy - 20],
    [cx + 22 + shift, cy - 11],
    [cx + 3 + shift, cy - 2]
  ];
  poly(ctx, PALETTE.outline, [
    [cx - 24 + shift, cy - 12],
    [cx - 3 + shift, cy - 22],
    [cx + 24 + shift, cy - 12],
    [cx + 4 + shift, cy],
    [cx - 22 + shift, cy - 1]
  ]);
  poly(ctx, PALETTE.woodMid, [
    [cx - 22 + shift, cy - 11],
    [cx + 3 + shift, cy - 2],
    [cx + 22 + shift, cy - 11],
    [cx + 21 + shift, cy - 6],
    [cx + 3 + shift, cy + 5],
    [cx - 21 + shift, cy - 3]
  ]);
  poly(ctx, PALETTE.woodDark, [
    [cx + 3 + shift, cy - 2],
    [cx + 22 + shift, cy - 11],
    [cx + 21 + shift, cy - 6],
    [cx + 3 + shift, cy + 5]
  ]);
  poly(ctx, PALETTE.stoneDark, rim);
  drawIsoDiamond(ctx, cx + shift, cy - 11, 35, 14, PALETTE.stoneDark);
  drawIsoDiamond(ctx, cx - 1 + shift, cy - 12, 25, 9, PALETTE.stoneMid);
  px(ctx, cx - 19 + shift, cy - 7, PALETTE.rustDark, 35, 2);
  px(ctx, cx - 11 + shift, cy - 20, PALETTE.clothTan, 11, 5);
  px(ctx, cx + 2 + shift, cy - 18, PALETTE.stoneDust, 9, 3);
  px(ctx, cx + 16 + shift, cy - 11, PALETTE.outline, 5, 2);
  drawNoisePixels(ctx, cx - 21, cy - 18, 42, 22, [PALETTE.woodDark, PALETTE.stoneDark], 0.055, seed);
}

export function drawDiningTable(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 71, seed * 5 + 13));
  const lenA = 1.9;
  const lenB = 0.92;
  const legH = 13;
  const slabT = 5;
  const ext = footprintExtent(lenA, lenB);
  drawShadowBlob(ctx, cx, cy + 5, ext.w * 0.82, ext.h * 0.82);

  const ha = lenA / 2;
  const hb = lenB / 2;
  const legCorners = [
    frame.point(-ha + 0.06, -hb + 0.12),
    frame.point(ha - 0.06, -hb + 0.12),
    frame.point(ha - 0.06, hb - 0.12),
    frame.point(-ha + 0.06, hb - 0.12)
  ].sort((a, b) => a[1] - b[1]);
  // Trestle stretcher between the leg pairs, low to the ground.
  const sA = frame.point(-ha + 0.1, 0, 3);
  const sB = frame.point(ha - 0.1, 0, 3);
  linePx(ctx, sA[0], sA[1], sB[0], sB[1], PALETTE.outline, 3);
  linePx(ctx, sA[0], sA[1] - 1, sB[0], sB[1] - 1, PALETTE.woodDark, 1);
  for (const c of legCorners) drawPropLeg(ctx, c, legH, PALETTE.woodDark);

  const box = orientedBox(ctx, frame, lenA, lenB, slabT, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, legH);

  // Plank seams along the long axis.
  for (let i = 1; i < 4; i += 1) {
    const lb = -hb + (i / 4) * (2 * hb);
    const a0 = frame.point(-ha + 0.06, lb, legH + slabT);
    const a1 = frame.point(ha - 0.06, lb, legH + slabT);
    linePx(ctx, a0[0], a0[1], a1[0], a1[1], PALETTE.woodDark, 1);
  }
  // Lit upper-left edge of the plank top.
  linePx(ctx, box.cap.left[0], box.cap.left[1], box.cap.top[0], box.cap.top[1], PALETTE.woodLight, 1);
  linePx(ctx, box.cap.top[0], box.cap.top[1], box.cap.right[0], box.cap.right[1], PALETTE.woodLight, 1);

  // Tableware in local coords so it follows the facing. Bowls, a tin cup, bread.
  const setTop = legH + slabT;
  for (const [la, lb] of [[-0.58, -0.1], [-0.05, 0.12], [0.5, -0.08]]) {
    const p = frame.point(la, lb, setTop);
    drawIsoDiamond(ctx, p[0], p[1], 9, 5, PALETTE.outline);
    drawIsoDiamond(ctx, p[0], p[1] - 1, 7, 4, PALETTE.stoneDust);
    px(ctx, p[0] - 1, p[1] - 2, PALETTE.stoneMid, 2, 1);
  }
  const cup = frame.point(0.18, -0.22, setTop);
  px(ctx, cup[0] - 2, cup[1] - 5, PALETTE.outline, 5, 6);
  px(ctx, cup[0] - 1, cup[1] - 4, PALETTE.stoneMid, 3, 4);
  px(ctx, cup[0] - 1, cup[1] - 5, PALETTE.stoneLight, 2, 1);
  const bread = frame.point(-0.32, 0.16, setTop);
  px(ctx, bread[0] - 3, bread[1] - 3, PALETTE.rustDark, 7, 4);
  px(ctx, bread[0] - 2, bread[1] - 4, PALETTE.clothTan, 4, 2);

  // Knife scars and grime, kept sparse so it reads as use, not noise.
  for (let i = 0; i < 4; i += 1) {
    const p = frame.point(-ha + rng() * lenA, -hb + rng() * lenB, setTop);
    px(ctx, p[0], p[1], rng() < 0.5 ? PALETTE.woodDark : PALETTE.woodLight, rng() < 0.4 ? 2 : 1, 1);
  }
}

export function drawDiningBench(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 29, seed * 3 + 7));
  const lenA = 1.7;
  const lenB = 0.34;
  const legH = 8;
  const slabT = 3;
  const ext = footprintExtent(lenA, lenB);
  drawShadowBlob(ctx, cx, cy + 3, ext.w * 0.78, ext.h * 0.92);

  const ha = lenA / 2;
  const hb = lenB / 2;
  const legCorners = [
    frame.point(-ha + 0.08, 0),
    frame.point(ha - 0.08, 0)
  ].sort((a, b) => a[1] - b[1]);
  for (const c of legCorners) drawPropLeg(ctx, c, legH, PALETTE.woodDark);

  const box = orientedBox(ctx, frame, lenA, lenB, slabT, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, legH);
  linePx(ctx, box.cap.left[0], box.cap.left[1], box.cap.top[0], box.cap.top[1], PALETTE.woodLight, 1);

  // A worn seat scuff and a couple of grain lines along the plank.
  const a0 = frame.point(-ha + 0.1, 0, legH + slabT);
  const a1 = frame.point(ha - 0.1, 0, legH + slabT);
  linePx(ctx, a0[0], a0[1], a1[0], a1[1], PALETTE.woodDark, 1);
  for (let i = 0; i < 3; i += 1) {
    const p = frame.point(-ha + rng() * lenA, -hb + rng() * lenB, legH + slabT);
    px(ctx, p[0], p[1], PALETTE.woodLight, 1, 1);
  }
}

export function drawKitchenCounter(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 53, seed * 7 + 5));
  const lenA = 1.42;
  const lenB = 0.82;
  const baseH = 16;
  const topT = 4;
  const ext = footprintExtent(lenA, lenB);
  drawShadowBlob(ctx, cx, cy + 6, ext.w * 0.86, ext.h * 0.86);

  // Stone base.
  const base = orientedBox(ctx, frame, lenA, lenB, baseH, {
    top: PALETTE.stoneDark,
    lit: PALETTE.stoneMid,
    shade: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  // Drawer / panel seams on the lit lower-left face.
  const seam = (t) => {
    const a = [
      base.cap.left[0] + (base.cap.bottom[0] - base.cap.left[0]) * t,
      base.cap.left[1] + (base.cap.bottom[1] - base.cap.left[1]) * t
    ];
    const b = [
      base.base.left[0] + (base.base.bottom[0] - base.base.left[0]) * t,
      base.base.left[1] + (base.base.bottom[1] - base.base.left[1]) * t
    ];
    linePx(ctx, a[0], a[1] + 2, b[0], b[1] - 2, PALETTE.void, 1);
  };
  seam(0.5);
  px(ctx, base.cap.bottom[0] - 9, base.cap.bottom[1] + 6, PALETTE.stoneDust, 3, 1);

  // Wood worktop, slightly overhanging the base.
  const top = orientedBox(ctx, frame, lenA + 0.12, lenB + 0.12, topT, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, baseH);
  linePx(ctx, top.cap.left[0], top.cap.left[1], top.cap.top[0], top.cap.top[1], PALETTE.woodLight, 1);

  // Prep clutter on the worktop, placed in local coords.
  const workTop = baseH + topT;
  const board = frame.point(-0.28, 0.04, workTop);
  drawIsoDiamond(ctx, board[0], board[1], 16, 8, PALETTE.outline);
  drawIsoDiamond(ctx, board[0], board[1] - 1, 13, 6, PALETTE.woodLight);
  for (let i = 0; i < 4; i += 1) {
    px(ctx, board[0] - 5 + i * 3, board[1] - 1, PALETTE.rustDark, 1, 1);
  }
  // A knife laid across the board.
  const k0 = frame.point(-0.44, -0.06, workTop);
  const k1 = frame.point(-0.1, 0.12, workTop);
  linePx(ctx, k0[0], k0[1], k1[0], k1[1], PALETTE.stoneLight, 1);
  px(ctx, k0[0] - 1, k0[1], PALETTE.woodDark, 2, 2);
  // A clay jar and a bowl.
  const jar = frame.point(0.4, -0.1, workTop);
  px(ctx, jar[0] - 3, jar[1] - 8, PALETTE.outline, 7, 9);
  px(ctx, jar[0] - 2, jar[1] - 7, PALETTE.rustMid, 5, 7);
  px(ctx, jar[0] - 1, jar[1] - 6, PALETTE.rustLight, 2, 2);
  const bowl = frame.point(0.22, 0.16, workTop);
  drawIsoDiamond(ctx, bowl[0], bowl[1], 9, 5, PALETTE.outline);
  drawIsoDiamond(ctx, bowl[0], bowl[1] - 1, 6, 3, PALETTE.stoneDust);

  drawNoisePixels(ctx, cx - 18, cy - workTop, 36, workTop + 6, [PALETTE.stoneDark, PALETTE.woodDark], 0.03, seed);
  if (rng() < 0.5) px(ctx, top.cap.top[0] - 4, top.cap.top[1] - 1, PALETTE.hostBone, 2, 1);
}

export function drawFarmPrepTable(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const rng = rngFrom(hash2D(seed + 109, seed * 7 + 23));
  const lenA = 1.48;
  const lenB = 0.68;
  const legH = 11;
  const slabT = 4;
  const ext = footprintExtent(lenA, lenB);
  const ha = lenA / 2;
  const hb = lenB / 2;
  drawShadowBlob(ctx, cx, cy + 5, ext.w * 0.82, ext.h * 0.86);

  const legs = [
    frame.point(-ha + 0.07, -hb + 0.08),
    frame.point(ha - 0.07, -hb + 0.08),
    frame.point(ha - 0.07, hb - 0.08),
    frame.point(-ha + 0.07, hb - 0.08)
  ].sort((a, b) => a[1] - b[1]);
  for (const p of legs) drawPropLeg(ctx, p, legH, PALETTE.woodDark);

  const shelfA = frame.point(-ha + 0.08, 0, 4);
  const shelfB = frame.point(ha - 0.1, 0, 4);
  linePx(ctx, shelfA[0], shelfA[1], shelfB[0], shelfB[1], PALETTE.outline, 3);
  linePx(ctx, shelfA[0], shelfA[1] - 1, shelfB[0], shelfB[1] - 1, PALETTE.woodMid, 1);

  const box = orientedBox(ctx, frame, lenA, lenB, slabT, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  }, legH);
  linePx(ctx, box.cap.left[0], box.cap.left[1], box.cap.top[0], box.cap.top[1], PALETTE.woodLight, 1);

  const topH = legH + slabT;
  const board = frame.point(-0.2, 0.02, topH);
  drawIsoDiamond(ctx, board[0], board[1], 18, 8, PALETTE.outline);
  drawIsoDiamond(ctx, board[0], board[1] - 1, 15, 6, PALETTE.woodLight);
  for (let i = 0; i < 4; i += 1) px(ctx, board[0] - 6 + i * 4, board[1] - 1, PALETTE.rustDark, 1, 1);

  const bowl = frame.point(0.36, -0.1, topH);
  drawIsoDiamond(ctx, bowl[0], bowl[1], 12, 6, PALETTE.outline);
  drawIsoDiamond(ctx, bowl[0], bowl[1] - 1, 9, 4, PALETTE.stoneDust);
  px(ctx, bowl[0] - 3, bowl[1] - 3, PALETTE.stoneMid, 6, 1);

  const sack = frame.point(0.44, 0.16, topH);
  px(ctx, sack[0] - 5, sack[1] - 8, PALETTE.outline, 10, 9);
  px(ctx, sack[0] - 4, sack[1] - 7, PALETTE.clothTan, 8, 7);
  px(ctx, sack[0] - 3, sack[1] - 7, PALETTE.stoneDust, 2, 2);
  px(ctx, sack[0] - 2, sack[1] - 2, PALETTE.rustDark, 5, 1);

  const knifeA = frame.point(-0.42, -0.12, topH);
  const knifeB = frame.point(-0.08, 0.08, topH);
  linePx(ctx, knifeA[0], knifeA[1], knifeB[0], knifeB[1], PALETTE.stoneLight, 1);
  px(ctx, knifeA[0] - 1, knifeA[1], PALETTE.woodDark, 2, 2);

  for (let i = 0; i < 5; i += 1) {
    const p = frame.point(-ha + rng() * lenA, -hb + rng() * lenB, topH);
    px(ctx, p[0], p[1], rng() < 0.5 ? PALETTE.woodLight : PALETTE.woodDark, rng() < 0.35 ? 2 : 1, 1);
  }
}

export function drawFarmKitchenHearth(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 127, seed * 11 + 41));
  drawShadowBlob(ctx, cx, cy + 8, 60, 22);

  drawIsoPrism(ctx, cx, cy + 2, 58, 26, 11, {
    top: PALETTE.clothTan,
    left: PALETTE.woodMid,
    right: PALETTE.woodDark,
    outline: PALETTE.outline
  });

  poly(ctx, PALETTE.outline, [
    [cx - 26, cy - 16],
    [cx - 4, cy - 28],
    [cx + 26, cy - 16],
    [cx + 25, cy - 9],
    [cx - 4, cy + 6],
    [cx - 27, cy - 5]
  ]);
  poly(ctx, PALETTE.clothTan, [
    [cx - 23, cy - 16],
    [cx - 4, cy - 26],
    [cx + 22, cy - 16],
    [cx - 4, cy - 4]
  ]);
  poly(ctx, PALETTE.woodMid, [
    [cx - 23, cy - 16],
    [cx - 4, cy - 4],
    [cx - 26, cy - 6]
  ]);
  poly(ctx, PALETTE.woodDark, [
    [cx - 4, cy - 4],
    [cx + 22, cy - 16],
    [cx + 23, cy - 10]
  ]);

  poly(ctx, PALETTE.outline, [
    [cx - 12, cy - 13],
    [cx - 3, cy - 18],
    [cx + 9, cy - 14],
    [cx + 8, cy - 7],
    [cx - 5, cy - 2],
    [cx - 13, cy - 6]
  ]);
  poly(ctx, PALETTE.void, [
    [cx - 10, cy - 12],
    [cx - 3, cy - 16],
    [cx + 6, cy - 13],
    [cx + 6, cy - 8],
    [cx - 5, cy - 4],
    [cx - 11, cy - 7]
  ]);

  linePx(ctx, cx - 24, cy - 18, cx + 24, cy - 17, PALETTE.woodDark, 3);
  linePx(ctx, cx - 23, cy - 19, cx + 23, cy - 18, PALETTE.woodLight, 1);
  px(ctx, cx + 12, cy - 21, PALETTE.outline, 8, 7);
  px(ctx, cx + 13, cy - 20, PALETTE.rustDark, 6, 5);
  px(ctx, cx + 14, cy - 21, PALETTE.rustLight, 3, 1);
  linePx(ctx, cx + 13, cy - 24, cx + 7, cy - 20, PALETTE.rustDark, 1);
  linePx(ctx, cx + 20, cy - 24, cx + 27, cy - 20, PALETTE.rustDark, 1);

  for (let i = 0; i < 8; i += 1) {
    const x = cx - 24 + Math.floor(rng() * 48);
    const y = cy - 23 + Math.floor(rng() * 22);
    px(ctx, x, y, rng() < 0.5 ? PALETTE.rustDark : PALETTE.stoneDark);
  }
  drawNoisePixels(ctx, cx - 24, cy - 22, 48, 26, [PALETTE.rustDark, PALETTE.woodDark, PALETTE.stoneDark], 0.045, seed);
}

export function drawSealedStorageCrate(ctx, cx, cy, seed) {
  drawRustedCrate(ctx, cx, cy, seed);
  px(ctx, cx - 18, cy - 2, PALETTE.outline, 36, 4);
  px(ctx, cx - 17, cy - 1, PALETTE.stoneDark, 34, 2);
  px(ctx, cx - 5, cy - 14, PALETTE.outline, 11, 10);
  px(ctx, cx - 4, cy - 13, PALETTE.rustDark, 9, 8);
  px(ctx, cx - 1, cy - 12, PALETTE.rustLight, 3, 2);
  for (const dx of [-12, -4, 4, 12]) {
    px(ctx, cx + dx, cy - 18, PALETTE.hostBone, 2, 1);
  }
}

export function drawRustedBarrel(ctx, cx, cy, seed, opts = {}) {
  drawShadowBlob(ctx, cx, cy + 6, 34, 15);

  // Rasterized cylinder: stepped oval caps and row-width changes avoid a box.
  for (let row = 0; row < 29; row += 1) {
    const y = cy - 23 + row;
    const topCurve = row < 5 ? 5 - row : 0;
    const bottomCurve = row > 23 ? row - 23 : 0;
    const inset = Math.max(topCurve, bottomCurve);
    const half = 17 - inset;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, PALETTE.rustMid, half, 1);
    px(ctx, cx, y, PALETTE.rustDark, half, 1);
    if (row % 5 === 1) px(ctx, cx - half + 3, y, PALETTE.rustLight, 3, 1);
  }

  px(ctx, cx - 10, cy - 30, PALETTE.outline, 21, 2);
  px(ctx, cx - 16, cy - 28, PALETTE.outline, 33, 5);
  px(ctx, cx - 18, cy - 25, PALETTE.outline, 37, 4);
  px(ctx, cx - 9, cy - 30, PALETTE.rustLight, 19, 2);
  px(ctx, cx - 15, cy - 27, PALETTE.rustMid, 31, 4);
  px(ctx, cx - 17, cy - 24, PALETTE.rustDark, 35, 2);
  px(ctx, cx - 10, cy - 26, PALETTE.void, 18, 3);
  px(ctx, cx - 7, cy - 27, PALETTE.rustDark, 11, 2);

  px(ctx, cx - 15, cy - 19, PALETTE.stoneDark, 31, 3);
  px(ctx, cx - 14, cy - 8, PALETTE.stoneDark, 29, 3);
  px(ctx, cx - 10, cy + 1, PALETTE.stoneDark, 21, 2);
  px(ctx, cx - 11, cy - 18, PALETTE.rustLight, 2, 17);
  px(ctx, cx + 8, cy - 18, PALETTE.outline, 2, 18);
  px(ctx, cx + 3, cy - 27, PALETTE.hostGold, 3, 2);
  drawNoisePixels(ctx, cx - 16, cy - 25, 32, 28, [PALETTE.rustDark, PALETTE.stoneDark], 0.06, seed);

  // Secret entrance/exit barrels carry a timber ladder rising out of the open
  // top, so the way between floors is unmistakable rather than just another keg.
  if (opts.ladder) {
    const top = cy - 58;
    const bot = cy - 24;
    const lx = cx - 6;
    const rx = cx + 4;
    px(ctx, lx - 1, top, PALETTE.outline, 3, bot - top);
    px(ctx, rx - 1, top, PALETTE.outline, 3, bot - top);
    px(ctx, lx, top, PALETTE.woodMid, 2, bot - top);
    px(ctx, rx, top, PALETTE.woodMid, 2, bot - top);
    px(ctx, lx, top, PALETTE.woodLight, 1, bot - top);
    for (let ry = top + 3; ry < bot; ry += 7) {
      px(ctx, lx, ry, PALETTE.outline, rx - lx + 2, 3);
      px(ctx, lx + 1, ry + 1, PALETTE.woodLight, rx - lx, 1);
    }
  }
}

export function drawStoneStairwell(ctx, cx, cy, seed) {
  const rng = rngFrom(hash2D(seed + 59, seed * 7 + 13));
  drawShadowBlob(ctx, cx, cy + 10, 72, 26);

  const topY = cy - 15;
  const ovalHalf = (rx, ry, dy) => Math.max(0, Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))));

  // Dropped stone skirt under the round stair-head. It gives the opening weight
  // without turning it back into a rectangular block.
  for (let dy = 3; dy <= 20; dy += 1) {
    const half = ovalHalf(35, 16, dy - 3);
    if (half < 4) continue;
    const y = topY + dy;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, PALETTE.stoneMid, half, 1);
    px(ctx, cx, y, PALETTE.stoneDark, half, 1);
    if (dy % 5 === 0) px(ctx, cx - half + 5, y, PALETTE.stoneDust, 4, 1);
  }

  // Stepped oval rim: a broken masonry ring around the stair void.
  for (let dy = -15; dy <= 15; dy += 1) {
    const half = ovalHalf(37, 15, dy);
    if (half < 4) continue;
    const y = topY + dy;
    const leftTone = dy < -6 ? PALETTE.stoneDust : dy < 4 ? PALETTE.stoneMid : PALETTE.stoneLight;
    const rightTone = dy < 0 ? PALETTE.stoneMid : PALETTE.stoneDark;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, leftTone, half, 1);
    px(ctx, cx, y, rightTone, half, 1);
  }
  for (let dy = -10; dy <= 12; dy += 1) {
    const half = ovalHalf(26, 11, dy);
    if (half < 3) continue;
    const y = topY + dy;
    px(ctx, cx - half - 2, y, PALETTE.outline, half * 2 + 4, 1);
    px(ctx, cx - half, y, PALETTE.void, half * 2, 1);
    if (dy < -5) px(ctx, cx - half, y, PALETTE.stoneDark, Math.max(4, Math.floor(half * 0.45)), 1);
  }

  // Curving treads, bright near the entry and fading into the stairwell.
  for (let i = 0; i < 8; i += 1) {
    const y = topY - 7 + i * 4;
    const w = 41 - i * 4;
    const lean = i < 4 ? i * 2 : 8 - i;
    const tone = i < 2 ? PALETTE.stoneDust : i < 5 ? PALETTE.stoneMid : PALETTE.stoneDark;
    linePx(ctx, cx - Math.floor(w / 2) + lean, y + 1, cx + Math.floor(w / 2) - lean, y - 3, PALETTE.outline, 2);
    linePx(ctx, cx - Math.floor(w / 2) + lean + 2, y, cx + Math.floor(w / 2) - lean - 2, y - 3, tone, 1);
  }
  linePx(ctx, cx + 9, topY - 8, cx - 5, topY + 12, PALETTE.outline, 2);
  linePx(ctx, cx + 8, topY - 9, cx - 6, topY + 11, PALETTE.rustMid, 1);

  const rail = (points, color, size = 1) => {
    for (let i = 1; i < points.length; i += 1) {
      linePx(ctx, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], color, size);
    }
  };
  const shifted = (points, y) => points.map((point) => [point[0], point[1] + y]);
  const post = (x, baseY, height, lit = false) => {
    px(ctx, x - 2, baseY - height, PALETTE.outline, 5, height + 3);
    px(ctx, x - 1, baseY - height + 1, PALETTE.rustDark, 3, height);
    px(ctx, x, baseY - height + 1, lit ? PALETTE.stoneLight : PALETTE.rustMid, 1, height - 2);
    px(ctx, x - 4, baseY + 1, PALETTE.outline, 9, 3);
    px(ctx, x - 3, baseY + 1, PALETTE.rustDark, 7, 1);
  };

  const backArc = [
    [cx - 34, topY - 25],
    [cx - 24, topY - 33],
    [cx - 8, topY - 37],
    [cx + 9, topY - 37],
    [cx + 25, topY - 33],
    [cx + 34, topY - 25]
  ];
  const leftArc = [
    [cx - 34, topY - 25],
    [cx - 38, topY - 14],
    [cx - 35, topY - 2],
    [cx - 25, topY + 6]
  ];
  const rightArc = [
    [cx + 34, topY - 25],
    [cx + 38, topY - 14],
    [cx + 35, topY - 2],
    [cx + 25, topY + 6]
  ];

  rail(shifted(backArc, 12), PALETTE.outline, 2);
  rail(shifted(backArc, 12), PALETTE.rustDark, 1);
  rail(shifted(leftArc, 11), PALETTE.outline, 2);
  rail(shifted(leftArc, 11), PALETTE.rustDark, 1);
  rail(shifted(rightArc, 11), PALETTE.outline, 2);
  rail(shifted(rightArc, 11), PALETTE.rustDark, 1);

  for (const spec of [
    [cx - 31, topY - 1, 31, true],
    [cx - 10, topY - 12, 27, true],
    [cx + 11, topY - 12, 27, false],
    [cx + 31, topY - 1, 31, false],
    [cx - 24, topY + 15, 42, true],
    [cx + 24, topY + 15, 42, false]
  ]) post(spec[0], spec[1], spec[2], spec[3]);

  rail(backArc, PALETTE.outline, 3);
  rail(backArc, PALETTE.rustDark, 2);
  rail(backArc.slice(0, 4), PALETTE.stoneLight, 1);
  rail(leftArc, PALETTE.outline, 3);
  rail(leftArc, PALETTE.rustDark, 2);
  rail(leftArc.slice(0, 3), PALETTE.stoneLight, 1);
  rail(rightArc, PALETTE.outline, 3);
  rail(rightArc, PALETTE.rustDark, 2);
  rail(rightArc, PALETTE.rustMid, 1);

  // Short entry rails sell the spiral route down through the gap.
  linePx(ctx, cx - 10, topY + 5, cx - 1, topY + 17, PALETTE.outline, 3);
  linePx(ctx, cx - 9, topY + 5, cx, topY + 16, PALETTE.rustMid, 1);
  linePx(ctx, cx + 11, topY + 5, cx + 2, topY + 17, PALETTE.outline, 3);
  linePx(ctx, cx + 10, topY + 5, cx + 1, topY + 16, PALETTE.rustDark, 1);

  drawNoisePixels(ctx, cx - 34, topY - 13, 68, 35, [PALETTE.stoneDark, PALETTE.stoneDust], 0.045, seed);
  for (let i = 0; i < 5; i += 1) {
    px(ctx, cx - 26 + Math.floor(rng() * 52), topY - 10 + Math.floor(rng() * 24), PALETTE.void, 1, 1);
  }
}
