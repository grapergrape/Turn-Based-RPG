// Old Pilgrim Way furniture and mechanisms. These props share the pre-Bloom
// Solar Ecclesiate material language: pale stone, dark ashwood, worn brass,
// linen, and pressure hardware built for practical road service.

import { PALETTE } from '../palette.js';
import {
  drawIsoPrism,
  drawPropLeg,
  footprintExtent,
  hash2D,
  isoFrame,
  linePx,
  nativeLinePx,
  nativePx,
  orientedBox,
  poly,
  px,
  rngFrom
} from './basePixels.js';

function wear(ctx, cx, cy, seed, width, height, colors) {
  const rng = rngFrom(hash2D(seed + 1901, seed * 11 + 71));
  for (let i = 0; i < 8; i += 1) {
    const x = cx - Math.floor(width / 2) + Math.floor(rng() * width);
    const y = cy - height + Math.floor(rng() * height);
    px(ctx, x, y, colors[i % colors.length], i % 3 === 0 ? 2 : 1, 1);
  }
}

export function drawPilgrimRoadShrine(ctx, cx, cy, seed, opts = {}) {
  const variant = opts.variant ?? 'road';

  drawIsoPrism(ctx, cx, cy + 1, 35, 17, 9, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  drawIsoPrism(ctx, cx - 1, cy - 9, 23, 12, 7, {
    top: PALETTE.stoneDust,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  px(ctx, cx - 7, cy - 48, PALETTE.outline, 15, 40);
  px(ctx, cx - 5, cy - 46, PALETTE.stoneMid, 11, 36);
  px(ctx, cx - 5, cy - 46, PALETTE.stoneLight, 3, 33);
  px(ctx, cx + 3, cy - 43, PALETTE.stoneDark, 3, 31);

  // A stepped sun wheel reads at map scale without becoming a clean icon.
  px(ctx, cx - 12, cy - 62, PALETTE.outline, 24, 17);
  px(ctx, cx - 9, cy - 65, PALETTE.outline, 18, 23);
  px(ctx, cx - 9, cy - 60, PALETTE.rustDark, 18, 13);
  px(ctx, cx - 6, cy - 63, PALETTE.rustMid, 12, 19);
  px(ctx, cx - 3, cy - 59, PALETTE.hostBone, 6, 11);
  px(ctx, cx - 1, cy - 57, PALETTE.stoneDust, 2, 7);

  if (variant === 'branch') {
    px(ctx, cx + 7, cy - 61, PALETTE.outline, 7, 8);
    px(ctx, cx + 8, cy - 60, PALETTE.stoneDark, 6, 6);
  } else if (variant === 'hill') {
    linePx(ctx, cx - 4, cy - 34, cx + 8, cy - 25, PALETTE.outline, 3);
    linePx(ctx, cx - 4, cy - 35, cx + 8, cy - 26, PALETTE.clothTan, 1);
    px(ctx, cx + 7, cy - 26, PALETTE.rustMid, 5, 3);
  }

  linePx(ctx, cx - 4, cy - 33, cx + 5, cy - 36, PALETTE.outline, 2);
  linePx(ctx, cx - 3, cy - 34, cx + 4, cy - 36, PALETTE.stoneDust, 1);
  wear(ctx, cx, cy - 8, seed, 22, 42, [PALETTE.stoneDark, PALETTE.rustDark]);

  // Native-scale chisel cuts sit inside the old logical-pixel silhouette.
  // They make the pale shaft and worn plinth resolve as carved stone at 2x.
  nativeLinePx(ctx, cx - 3.5, cy - 43.5, cx - 3.5, cy - 35.5, PALETTE.stoneDust);
  nativeLinePx(ctx, cx + 1.5, cy - 41.5, cx + 1.5, cy - 34.5, PALETTE.stoneDark);
  nativeLinePx(ctx, cx - 9.5, cy - 7.5, cx - 1.5, cy - 9.5, PALETTE.stoneLight);
  nativePx(ctx, cx - 4.5, cy - 59.5, PALETTE.hostBone);
}

export function drawOpenedPilgrimRemains(ctx, cx, cy, seed, opts = {}) {
  const variant = opts.variant ?? 'runner';

  // The body stays recognizably human-sized and collapsed, with an old road
  // coat under the transformed torso rather than a free-standing alien mass.
  poly(ctx, PALETTE.outline, [
    [cx - 24, cy - 8], [cx - 9, cy - 17], [cx + 12, cy - 12],
    [cx + 24, cy - 2], [cx + 11, cy + 8], [cx - 11, cy + 6]
  ]);
  poly(ctx, PALETTE.clothDark, [
    [cx - 20, cy - 7], [cx - 8, cy - 14], [cx + 9, cy - 10],
    [cx + 19, cy - 2], [cx + 9, cy + 5], [cx - 10, cy + 3]
  ]);
  poly(ctx, PALETTE.skinDark, [
    [cx - 7, cy - 13], [cx + 6, cy - 11], [cx + 14, cy - 4],
    [cx + 6, cy + 3], [cx - 5, cy]
  ]);

  for (const offset of [-5, 0, 5]) {
    linePx(ctx, cx - 2 + offset, cy - 11, cx + 5 + offset, cy + 1, PALETTE.outline, 3);
    linePx(ctx, cx - 2 + offset, cy - 12, cx + 4 + offset, cy, PALETTE.hostBone, 1);
  }
  linePx(ctx, cx - 10, cy + 1, cx - 28, cy + 9, PALETTE.outline, 4);
  linePx(ctx, cx - 10, cy, cx - 27, cy + 7, PALETTE.skinDark, 2);
  linePx(ctx, cx + 11, cy + 2, cx + 28, cy + 8, PALETTE.outline, 4);
  linePx(ctx, cx + 11, cy + 1, cx + 27, cy + 6, PALETTE.skinDark, 2);
  linePx(ctx, cx - 12, cy - 7, cx - 28, cy - 13, PALETTE.outline, 4);
  linePx(ctx, cx - 12, cy - 8, cx - 27, cy - 14, PALETTE.skinMid, 2);

  px(ctx, cx + 13, cy - 13, PALETTE.outline, 11, 10);
  px(ctx, cx + 15, cy - 15, PALETTE.hostBone, 7, 10);
  linePx(ctx, cx + 19, cy - 14, cx + 27, cy - 24, PALETTE.outline, 3);
  linePx(ctx, cx + 19, cy - 15, cx + 26, cy - 23, PALETTE.hostBone, 1);

  if (variant === 'bell') {
    px(ctx, cx - 2, cy - 12, PALETTE.outline, 16, 15);
    px(ctx, cx + 1, cy - 10, PALETTE.void, 10, 10);
    px(ctx, cx + 3, cy - 9, PALETTE.rustDark, 6, 7);
    linePx(ctx, cx + 5, cy - 10, cx + 9, cy - 3, PALETTE.hostBone, 1);
  } else if (variant === 'cord') {
    for (const dy of [-8, -3, 2]) {
      linePx(ctx, cx - 18, cy + dy, cx + 19, cy + dy + 5, PALETTE.outline, 2);
      linePx(ctx, cx - 17, cy + dy - 1, cx + 18, cy + dy + 4, PALETTE.hostGold, 1);
    }
  } else {
    linePx(ctx, cx - 23, cy + 7, cx - 34, cy + 13, PALETTE.hostBone, 2);
    linePx(ctx, cx + 25, cy + 7, cx + 35, cy + 11, PALETTE.hostBone, 2);
  }

  wear(ctx, cx, cy + 2, seed, 46, 18, [PALETTE.rustDark, PALETTE.hostBlack, PALETTE.hostGold]);
  // Each runner, bell, and cord corpse keeps the same fine bodily material:
  // rib cortex, coat stitching, skull lamination, and a black-gold capillary.
  nativeLinePx(ctx, cx - 1.5, cy - 11.5, cx + 4.5, cy - 0.5, PALETTE.stoneDust);
  nativeLinePx(ctx, cx - 17.5, cy - 6.5, cx - 8.5, cy - 10.5, PALETTE.clothTan);
  nativeLinePx(ctx, cx + 15.5, cy - 14.5, cx + 20.5, cy - 14.5, PALETTE.stoneDust);
  nativeLinePx(ctx, cx + 4.5, cy - 7.5, cx + 9.5, cy - 3.5, PALETTE.hostGold);
  nativePx(ctx, cx - 27.5, cy + 7.5, PALETTE.skinMid);
}

export function drawPilgrimCot(ctx, cx, cy, seed, opts = {}) {
  const frame = isoFrame(cx, cy, opts.orient);
  const lenA = 1.52;
  const lenB = 0.7;
  const ha = lenA / 2;
  const hb = lenB / 2;
  const ext = footprintExtent(lenA, lenB);
  const variant = opts.variant ?? 'novice';
  const cloth = variant === 'sister'
    ? PALETTE.clothBlueDark
    : variant === 'priest'
      ? PALETTE.clothDark
      : PALETTE.stoneMid;

  for (const p of [
    frame.point(-ha + 0.05, -hb + 0.05), frame.point(ha - 0.05, -hb + 0.05),
    frame.point(ha - 0.05, hb - 0.05), frame.point(-ha + 0.05, hb - 0.05)
  ]) drawPropLeg(ctx, p, 8, PALETTE.rustDark);

  orientedBox(ctx, frame, lenA, lenB, 6, {
    top: PALETTE.woodMid,
    lit: PALETTE.woodMid,
    shade: PALETTE.woodDark,
    outline: PALETTE.outline
  });
  const mattress = orientedBox(ctx, frame, lenA - 0.12, lenB - 0.12, 5, {
    top: PALETTE.clothTan,
    lit: PALETTE.stoneDust,
    shade: PALETTE.stoneMid,
    outline: PALETTE.outline
  }, 6);
  linePx(ctx, mattress.cap.left[0], mattress.cap.left[1], mattress.cap.top[0], mattress.cap.top[1], PALETTE.hostBone, 1);

  poly(ctx, cloth, [
    frame.point(0.02, -hb + 0.07, 12), frame.point(ha - 0.07, -hb + 0.07, 12),
    frame.point(ha - 0.07, hb - 0.07, 12), frame.point(0.02, hb - 0.07, 12)
  ]);
  const pillow = [
    frame.point(-0.67, -0.23, 13), frame.point(-0.38, -0.23, 13),
    frame.point(-0.38, 0.23, 13), frame.point(-0.67, 0.23, 13)
  ];
  poly(ctx, PALETTE.outline, pillow.map(([x, y]) => [x, y + 1]));
  poly(ctx, PALETTE.stoneDust, pillow);

  const posts = [frame.point(-ha + 0.02, -hb + 0.02), frame.point(-ha + 0.02, hb - 0.02)];
  for (const post of posts) {
    px(ctx, post[0] - 2, post[1] - 25, PALETTE.outline, 5, 26);
    px(ctx, post[0] - 1, post[1] - 24, PALETTE.rustDark, 3, 23);
    px(ctx, post[0] - 1, post[1] - 23, PALETTE.rustLight, 1, 18);
  }
  linePx(ctx, posts[0][0], posts[0][1] - 19, posts[1][0], posts[1][1] - 19, PALETTE.outline, 4);
  linePx(ctx, posts[0][0], posts[0][1] - 20, posts[1][0], posts[1][1] - 20, PALETTE.rustMid, 1);
  wear(ctx, cx, cy + 1, seed, 38, 16, [PALETTE.stoneDark, PALETTE.rustDark]);
  nativeLinePx(ctx, mattress.cap.left[0] + 1.5, mattress.cap.left[1] - 0.5, mattress.cap.top[0] - 1.5, mattress.cap.top[1] + 0.5, PALETTE.hostBone);
  const clothSeamA = frame.point(0.06, -hb + 0.09, 12.5);
  const clothSeamB = frame.point(ha - 0.09, -hb + 0.09, 12.5);
  nativeLinePx(ctx, clothSeamA[0], clothSeamA[1], clothSeamB[0], clothSeamB[1], variant === 'sister' ? PALETTE.clothBlue : PALETTE.stoneDust);
  const pillowCreaseA = frame.point(-0.52, -0.2, 13.5);
  const pillowCreaseB = frame.point(-0.52, 0.2, 13.5);
  nativeLinePx(ctx, pillowCreaseA[0], pillowCreaseA[1], pillowCreaseB[0], pillowCreaseB[1], PALETTE.stoneMid);
  for (const post of posts) nativeLinePx(ctx, post[0] - 0.5, post[1] - 23.5, post[0] - 0.5, post[1] - 5.5, PALETTE.rustLight);
}

export function drawPilgrimMemorialTablet(ctx, cx, cy, seed, opts = {}) {
  const variant = opts.variant ?? 'record';

  if (variant === 'sealed') {
    drawIsoPrism(ctx, cx, cy, 42, 18, 13, {
      top: PALETTE.woodMid,
      left: PALETTE.woodDark,
      right: PALETTE.outline,
      outline: PALETTE.outline
    });
    px(ctx, cx - 4, cy - 17, PALETTE.outline, 9, 7);
    px(ctx, cx - 2, cy - 16, PALETTE.rustMid, 5, 4);
    nativeLinePx(ctx, cx - 16.5, cy - 7.5, cx - 1.5, cy - 14.5, PALETTE.woodLight);
    nativeLinePx(ctx, cx + 1.5, cy - 14.5, cx + 16.5, cy - 7.5, PALETTE.woodMid);
    nativePx(ctx, cx - 0.5, cy - 15.5, PALETTE.rustLight);
    return;
  }

  if (variant === 'road-book') {
    drawIsoPrism(ctx, cx, cy + 1, 38, 17, 8, {
      top: PALETTE.woodMid,
      left: PALETTE.woodDark,
      right: PALETTE.outline,
      outline: PALETTE.outline
    });
    poly(ctx, PALETTE.outline, [
      [cx - 17, cy - 14], [cx, cy - 21], [cx + 18, cy - 14], [cx, cy - 7]
    ]);
    poly(ctx, PALETTE.clothTan, [
      [cx - 14, cy - 14], [cx, cy - 19], [cx + 15, cy - 14], [cx, cy - 9]
    ]);
    linePx(ctx, cx, cy - 19, cx, cy - 9, PALETTE.rustDark, 1);
    nativeLinePx(ctx, cx - 12.5, cy - 13.5, cx - 0.5, cy - 18.5, PALETTE.hostBone);
    nativeLinePx(ctx, cx + 0.5, cy - 18.5, cx + 12.5, cy - 13.5, PALETTE.stoneDust);
    nativeLinePx(ctx, cx - 9.5, cy - 11.5, cx - 1.5, cy - 14.5, PALETTE.stoneDark);
    nativeLinePx(ctx, cx + 1.5, cy - 14.5, cx + 9.5, cy - 11.5, PALETTE.stoneDark);
    return;
  }

  px(ctx, cx - 18, cy - 47, PALETTE.outline, 37, 42);
  px(ctx, cx - 15, cy - 44, PALETTE.woodDark, 31, 36);
  px(ctx, cx - 13, cy - 42, PALETTE.clothTan, 27, 31);
  px(ctx, cx - 12, cy - 41, PALETTE.hostBone, 24, 2);
  for (let row = 0; row < 5; row += 1) {
    const shorten = (seed + row) % 3;
    linePx(ctx, cx - 10, cy - 35 + row * 5, cx + 10 - shorten * 3, cy - 35 + row * 5, PALETTE.stoneDark, 1);
  }
  px(ctx, cx - 15, cy - 8, PALETTE.outline, 5, 10);
  px(ctx, cx + 11, cy - 8, PALETTE.outline, 5, 10);
  px(ctx, cx - 13, cy - 7, PALETTE.woodMid, 2, 8);
  px(ctx, cx + 12, cy - 7, PALETTE.woodMid, 2, 8);

  if (variant === 'memorial') {
    px(ctx, cx - 1, cy - 40, PALETTE.rustMid, 3, 27);
  } else if (variant === 'profession-forced') {
    linePx(ctx, cx - 10, cy - 39, cx + 10, cy - 17, PALETTE.rustDark, 3);
  } else if (variant === 'profession-kept') {
    for (const x of [-8, -3, 3, 8]) px(ctx, cx + x, cy - 32, PALETTE.rustLight, 3, 4);
  } else if (variant === 'last-office') {
    px(ctx, cx - 10, cy - 15, PALETTE.clothRed, 21, 3);
  }
  wear(ctx, cx, cy - 5, seed, 28, 36, [PALETTE.stoneMid, PALETTE.rustDark]);
  nativeLinePx(ctx, cx - 12.5, cy - 40.5, cx + 11.5, cy - 40.5, PALETTE.hostBone);
  for (let row = 0; row < 5; row += 1) {
    const shorten = (seed + row) % 3;
    nativeLinePx(ctx, cx - 9.5, cy - 34.5 + row * 5, cx + 9.5 - shorten * 3, cy - 34.5 + row * 5, PALETTE.stoneDark);
  }
  nativeLinePx(ctx, cx - 14.5, cy - 43.5, cx - 14.5, cy - 9.5, PALETTE.woodLight);
  if (variant === 'memorial') nativeLinePx(ctx, cx - 0.5, cy - 39.5, cx - 0.5, cy - 14.5, PALETTE.rustLight);
  if (variant === 'profession-forced') nativeLinePx(ctx, cx - 9.5, cy - 38.5, cx + 9.5, cy - 17.5, PALETTE.rustMid);
  if (variant === 'last-office') nativeLinePx(ctx, cx - 8.5, cy - 14.5, cx + 8.5, cy - 14.5, PALETTE.clothRed);
}

export function drawClosureControlPanel(ctx, cx, cy, seed, opts = {}) {
  const variant = opts.variant ?? 'register';
  drawIsoPrism(ctx, cx, cy + 1, 38, 18, 12, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  px(ctx, cx - 17, cy - 51, PALETTE.outline, 35, 41);
  px(ctx, cx - 14, cy - 48, PALETTE.stoneMid, 29, 35);
  px(ctx, cx - 13, cy - 47, PALETTE.stoneLight, 8, 31);
  px(ctx, cx + 8, cy - 47, PALETTE.stoneDark, 6, 33);

  if (variant === 'wheel') {
    px(ctx, cx - 12, cy - 42, PALETTE.outline, 25, 23);
    px(ctx, cx - 9, cy - 39, PALETTE.stoneDark, 19, 17);
    px(ctx, cx - 2, cy - 42, PALETTE.rustMid, 5, 23);
    px(ctx, cx - 12, cy - 33, PALETTE.rustMid, 25, 5);
    px(ctx, cx - 4, cy - 35, PALETTE.rustLight, 9, 9);
  } else if (variant === 'gauge') {
    px(ctx, cx - 10, cy - 43, PALETTE.outline, 21, 20);
    px(ctx, cx - 7, cy - 40, PALETTE.clothTan, 15, 14);
    linePx(ctx, cx, cy - 28, cx + 6, cy - 38, PALETTE.clothRed, 2);
    px(ctx, cx - 9, cy - 20, PALETTE.rustDark, 19, 4);
  } else {
    const rows = variant === 'tally' || variant === 'chapter-record' ? 6 : 4;
    px(ctx, cx - 10, cy - 43, PALETTE.clothTan, 21, 26);
    for (let row = 0; row < rows; row += 1) {
      linePx(ctx, cx - 8, cy - 39 + row * 4, cx + 8 - ((seed + row) % 3) * 2, cy - 39 + row * 4, PALETTE.stoneDark, 1);
    }
    if (variant === 'chapter-record') px(ctx, cx - 8, cy - 18, PALETTE.clothRed, 17, 3);
  }

  px(ctx, cx - 13, cy - 16, PALETTE.outline, 5, 5);
  px(ctx, cx + 9, cy - 16, PALETTE.outline, 5, 5);
  px(ctx, cx - 12, cy - 15, PALETTE.rustLight, 2, 2);
  px(ctx, cx + 10, cy - 15, PALETTE.rustLight, 2, 2);
  wear(ctx, cx, cy - 12, seed, 28, 34, [PALETTE.rustDark, PALETTE.stoneDark]);
  nativeLinePx(ctx, cx - 12.5, cy - 46.5, cx - 12.5, cy - 17.5, PALETTE.stoneDust);
  nativeLinePx(ctx, cx + 8.5, cy - 46.5, cx + 8.5, cy - 17.5, PALETTE.stoneMid);
  if (variant === 'wheel') {
    nativeLinePx(ctx, cx - 8.5, cy - 32.5, cx + 8.5, cy - 32.5, PALETTE.rustLight);
    nativeLinePx(ctx, cx - 0.5, cy - 40.5, cx - 0.5, cy - 23.5, PALETTE.rustLight);
  } else if (variant === 'gauge') {
    nativeLinePx(ctx, cx - 6.5, cy - 39.5, cx + 6.5, cy - 39.5, PALETTE.hostBone);
    nativeLinePx(ctx, cx + 0.5, cy - 28.5, cx + 5.5, cy - 37.5, PALETTE.clothRed);
  } else {
    const rows = variant === 'tally' || variant === 'chapter-record' ? 6 : 4;
    for (let row = 0; row < rows; row += 1) {
      nativeLinePx(ctx, cx - 7.5, cy - 38.5 + row * 4, cx + 7.5 - ((seed + row) % 3) * 2, cy - 38.5 + row * 4, PALETTE.stoneDark);
    }
  }
  nativePx(ctx, cx - 11.5, cy - 14.5, PALETTE.stoneLight);
}

function trialStateColors(state) {
  if (state === 'kept') return { accent: PALETTE.hostBone, metal: PALETTE.rustMid };
  if (state === 'broken') return { accent: PALETTE.clothRed, metal: PALETTE.rustDark };
  return { accent: PALETTE.stoneDust, metal: PALETTE.rustMid };
}

export function drawPilgrimTrialFrame(ctx, cx, cy, seed, opts = {}) {
  const variant = opts.variant ?? 'quiet';
  const state = opts.state ?? 'idle';
  const colors = trialStateColors(state);

  drawIsoPrism(ctx, cx, cy + 1, 43, 19, 9, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });

  if (variant === 'quiet') {
    px(ctx, cx - 18, cy - 50, PALETTE.outline, 5, 44);
    px(ctx, cx + 14, cy - 50, PALETTE.outline, 5, 44);
    px(ctx, cx - 16, cy - 48, PALETTE.rustDark, 2, 40);
    px(ctx, cx + 15, cy - 48, PALETTE.rustMid, 2, 40);
    linePx(ctx, cx - 16, cy - 48, cx + 16, cy - 48, PALETTE.outline, 4);
    linePx(ctx, cx - 15, cy - 49, cx + 15, cy - 49, PALETTE.rustLight, 1);
    for (const x of [-12, -7, -2, 3, 8, 13]) {
      linePx(ctx, cx + x, cy - 47, cx + x, cy - 30 + Math.abs(x % 3), PALETTE.hostBone, 1);
      px(ctx, cx + x - 2, cy - 30 + Math.abs(x % 3), PALETTE.outline, 5, 4);
      px(ctx, cx + x - 1, cy - 30 + Math.abs(x % 3), colors.accent, 3, 2);
    }
  } else if (variant === 'service') {
    px(ctx, cx - 17, cy - 44, PALETTE.outline, 35, 31);
    px(ctx, cx - 14, cy - 41, PALETTE.stoneMid, 29, 25);
    for (const x of [-9, 0, 9]) {
      px(ctx, cx + x - 5, cy - 36, PALETTE.outline, 11, 11);
      px(ctx, cx + x - 3, cy - 34, colors.metal, 7, 7);
      px(ctx, cx + x - 1, cy - 37, colors.accent, 3, 13);
      px(ctx, cx + x - 6, cy - 32, colors.accent, 13, 3);
    }
    linePx(ctx, cx - 13, cy - 18, cx + 13, cy - 18, PALETTE.clothBlueDark, 3);
  } else if (variant === 'burden') {
    linePx(ctx, cx - 22, cy - 7, cx - 10, cy - 51, PALETTE.outline, 6);
    linePx(ctx, cx + 22, cy - 7, cx + 10, cy - 51, PALETTE.outline, 6);
    linePx(ctx, cx - 21, cy - 8, cx - 9, cy - 49, PALETTE.woodMid, 2);
    linePx(ctx, cx + 21, cy - 8, cx + 9, cy - 49, PALETTE.woodDark, 2);
    linePx(ctx, cx - 10, cy - 50, cx + 10, cy - 50, PALETTE.rustLight, 3);
    linePx(ctx, cx - 7, cy - 49, cx - 7, cy - 27, PALETTE.hostBone, 1);
    linePx(ctx, cx + 7, cy - 49, cx + 7, cy - 27, PALETTE.hostBone, 1);
    drawIsoPrism(ctx, cx, cy - 18, 32, 14, 12, {
      top: colors.accent,
      left: PALETTE.stoneMid,
      right: PALETTE.stoneDark,
      outline: PALETTE.outline
    });
  } else if (variant === 'mercy') {
    px(ctx, cx - 19, cy - 45, PALETTE.outline, 39, 31);
    px(ctx, cx - 16, cy - 42, PALETTE.clothTan, 33, 25);
    for (const x of [-10, 0, 10]) {
      px(ctx, cx + x - 5, cy - 37, PALETTE.outline, 11, 12);
      px(ctx, cx + x - 3, cy - 35, PALETTE.stoneDark, 7, 8);
      px(ctx, cx + x - 1, cy - 38, colors.accent, 3, 14);
      px(ctx, cx + x - 6, cy - 32, colors.metal, 13, 3);
    }
  } else {
    px(ctx, cx - 17, cy - 52, PALETTE.outline, 35, 43);
    px(ctx, cx - 14, cy - 49, PALETTE.stoneMid, 29, 37);
    px(ctx, cx - 12, cy - 47, PALETTE.stoneLight, 8, 33);
    for (const x of [-9, -3, 3, 9]) {
      px(ctx, cx + x - 2, cy - 34, PALETTE.outline, 5, 8);
      px(ctx, cx + x - 1, cy - 33, colors.accent, 3, state === 'broken' && x === 3 ? 3 : 6);
    }
    px(ctx, cx - 9, cy - 20, PALETTE.rustDark, 19, 5);
  }

  if (state === 'kept') {
    px(ctx, cx - 6, cy - 15, PALETTE.outline, 13, 8);
    px(ctx, cx - 4, cy - 14, PALETTE.rustMid, 9, 5);
    px(ctx, cx - 2, cy - 16, PALETTE.hostBone, 5, 7);
  }
  if (state === 'broken') {
    linePx(ctx, cx - 18, cy - 39, cx + 18, cy - 19, PALETTE.outline, 3);
    linePx(ctx, cx - 17, cy - 40, cx + 17, cy - 20, PALETTE.clothRed, 1);
  }
  wear(ctx, cx, cy - 8, seed, 34, 35, [PALETTE.rustDark, PALETTE.stoneDark]);

  // Fine abrasion follows the working metal and the raised stone base. These
  // marks remain subordinate to the trial frame's large readable mechanism.
  nativeLinePx(ctx, cx - 11.5, cy - 47.5, cx + 8.5, cy - 47.5, PALETTE.rustLight);
  nativeLinePx(ctx, cx - 10.5, cy - 5.5, cx - 1.5, cy - 7.5, PALETTE.stoneDust);
  nativePx(ctx, cx + 7.5, cy - 13.5, colors.metal);
}

export function drawProcessionalPikeRack(ctx, cx, cy, seed, opts = {}) {
  const opened = Boolean(opts.opened);
  drawIsoPrism(ctx, cx, cy + 1, 52, 17, 8, {
    top: PALETTE.woodMid,
    left: PALETTE.woodDark,
    right: PALETTE.outline,
    outline: PALETTE.outline
  });
  px(ctx, cx - 23, cy - 31, PALETTE.outline, 7, 27);
  px(ctx, cx + 17, cy - 31, PALETTE.outline, 7, 27);
  px(ctx, cx - 21, cy - 29, PALETTE.woodMid, 3, 24);
  px(ctx, cx + 19, cy - 29, PALETTE.woodDark, 3, 24);
  px(ctx, cx - 20, cy - 25, PALETTE.rustMid, 5, 6);
  px(ctx, cx + 16, cy - 25, PALETTE.rustMid, 5, 6);

  if (!opened) {
    linePx(ctx, cx - 30, cy - 30, cx + 27, cy - 20, PALETTE.outline, 5);
    linePx(ctx, cx - 29, cy - 31, cx + 26, cy - 21, PALETTE.woodLight, 2);
    poly(ctx, PALETTE.outline, [
      [cx + 25, cy - 25], [cx + 39, cy - 20], [cx + 27, cy - 15], [cx + 21, cy - 21]
    ]);
    poly(ctx, PALETTE.rustLight, [
      [cx + 27, cy - 23], [cx + 35, cy - 20], [cx + 27, cy - 17], [cx + 24, cy - 21]
    ]);
    px(ctx, cx - 27, cy - 33, PALETTE.clothTan, 7, 7);
  } else {
    linePx(ctx, cx - 18, cy - 25, cx + 20, cy - 18, PALETTE.clothTan, 1);
    px(ctx, cx - 1, cy - 22, PALETTE.rustDark, 4, 3);
  }
  wear(ctx, cx, cy, seed, 44, 23, [PALETTE.rustDark, PALETTE.stoneDark]);
  nativeLinePx(ctx, cx - 20.5, cy - 28.5, cx - 20.5, cy - 5.5, PALETTE.woodLight);
  nativeLinePx(ctx, cx + 19.5, cy - 28.5, cx + 19.5, cy - 5.5, PALETTE.woodMid);
  nativeLinePx(ctx, cx - 22.5, cy - 7.5, cx + 21.5, cy - 7.5, PALETTE.woodLight);
  if (!opened) {
    nativeLinePx(ctx, cx - 28.5, cy - 30.5, cx + 25.5, cy - 20.5, PALETTE.woodLight);
    nativeLinePx(ctx, cx + 27.5, cy - 22.5, cx + 34.5, cy - 19.5, PALETTE.hostBone);
    nativePx(ctx, cx - 26.5, cy - 32.5, PALETTE.hostBone);
  } else {
    nativeLinePx(ctx, cx - 17.5, cy - 24.5, cx + 19.5, cy - 17.5, PALETTE.stoneDust);
    nativePx(ctx, cx - 0.5, cy - 21.5, PALETTE.rustLight);
  }
}
