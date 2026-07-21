import { PALETTE } from '../palette.js';
import {
  drawIsoDiamond,
  drawIsoPrism,
  linePx,
  nativeLinePx,
  nativePx,
  poly,
  px
} from './basePixels.js';

export function drawCensureAttendantShrine(ctx, cx, cy) {
  drawIsoPrism(ctx, cx, cy + 3, 68, 30, 10, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  drawIsoPrism(ctx, cx - 2, cy - 7, 52, 24, 31, {
    top: PALETTE.stoneDust,
    left: PALETTE.stoneMid,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });

  px(ctx, cx - 22, cy - 31, PALETTE.outline, 45, 4);
  px(ctx, cx - 20, cy - 32, PALETTE.stoneDust, 39, 2);
  px(ctx, cx - 20, cy - 25, PALETTE.outline, 40, 17);
  px(ctx, cx - 17, cy - 23, PALETTE.stoneDark, 34, 13);
  px(ctx, cx - 14, cy - 21, PALETTE.void, 28, 10);
  px(ctx, cx - 10, cy - 18, PALETTE.rustDark, 20, 6);
  px(ctx, cx - 7, cy - 17, PALETTE.rustMid, 13, 3);
  px(ctx, cx + 4, cy - 17, PALETTE.hostGold, 2, 2);
  nativeLinePx(ctx, cx - 13.5, cy - 20.5, cx + 11.5, cy - 20.5, PALETTE.stoneLight);
  nativeLinePx(ctx, cx - 8.5, cy - 16.5, cx + 4.5, cy - 16.5, PALETTE.rustLight);

  // A single local cradle is present. The catalogue names other models, but
  // the shrine itself never depicts them.
  for (const x of [cx - 24, cx + 19]) {
    px(ctx, x, cy - 29, PALETTE.outline, 5, 24);
    px(ctx, x + 1, cy - 28, PALETTE.stoneLight, 2, 21);
    nativeLinePx(ctx, x + 1.5, cy - 27.5, x + 1.5, cy - 8.5, PALETTE.stoneDust);
  }
  px(ctx, cx - 7, cy - 45, PALETTE.outline, 15, 13);
  px(ctx, cx - 5, cy - 43, PALETTE.clothTan, 11, 9);
  px(ctx, cx - 3, cy - 41, PALETTE.clothRed, 2, 6);
  px(ctx, cx + 1, cy - 41, PALETTE.clothRed, 2, 6);
  px(ctx, cx - 3, cy - 39, PALETTE.clothRed, 6, 2);
  nativePx(ctx, cx + 4.5, cy - 42.5, PALETTE.uiPaperHigh);

  linePx(ctx, cx - 17, cy - 5, cx - 24, cy + 2, PALETTE.rustDark, 2);
  linePx(ctx, cx + 15, cy - 4, cx + 23, cy + 3, PALETTE.stoneDark, 2);
  px(ctx, cx - 27, cy + 1, PALETTE.outline, 9, 3);
  px(ctx, cx + 18, cy + 2, PALETTE.outline, 9, 3);
}

export function drawDroneSensorStake(ctx, cx, cy) {
  drawDeviceShadow(ctx, cx, cy, 24, 10);
  drawTripod(ctx, cx, cy, 17);
  px(ctx, cx - 5, cy - 23, PALETTE.outline, 11, 8);
  px(ctx, cx - 4, cy - 22, PALETTE.stoneMid, 9, 6);
  px(ctx, cx - 2, cy - 21, PALETTE.hostGold, 4, 2);
  linePx(ctx, cx, cy - 23, cx + 7, cy - 32, PALETTE.rustLight, 1);
  nativePx(ctx, cx + 7.5, cy - 32.5, PALETTE.flash);
}

export function drawDroneFoldingScreen(ctx, cx, cy) {
  drawDeviceShadow(ctx, cx, cy, 50, 15);
  poly(ctx, PALETTE.outline, [[cx - 25, cy - 4], [cx, cy + 8], [cx + 25, cy - 4], [cx, cy - 17]]);
  poly(ctx, PALETTE.clothBlueDark, [[cx - 22, cy - 4], [cx, cy + 5], [cx, cy - 13], [cx - 22, cy - 22]]);
  poly(ctx, PALETTE.stoneDark, [[cx, cy + 5], [cx + 22, cy - 4], [cx + 22, cy - 22], [cx, cy - 13]]);
  linePx(ctx, cx, cy - 15, cx, cy + 6, PALETTE.rustLight, 2);
  nativeLinePx(ctx, cx - 19.5, cy - 19.5, cx - 1.5, cy - 11.5, PALETTE.uiRare);
  nativeLinePx(ctx, cx + 1.5, cy - 11.5, cx + 19.5, cy - 19.5, PALETTE.stoneLight);
}

export function drawDroneSnarePod(ctx, cx, cy) {
  drawDeviceShadow(ctx, cx, cy, 27, 10);
  drawIsoPrism(ctx, cx, cy, 26, 12, 7, {
    top: PALETTE.rustLight,
    left: PALETTE.rustMid,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  for (const dx of [-8, 0, 8]) {
    px(ctx, cx + dx - 1, cy - 10, PALETTE.outline, 3, 7);
    px(ctx, cx + dx, cy - 9, PALETTE.stoneDust, 1, 5);
  }
  nativeLinePx(ctx, cx - 8.5, cy - 9.5, cx + 8.5, cy - 9.5, PALETTE.rustLight);
}

export function drawDroneArcSentry(ctx, cx, cy) {
  drawDeviceShadow(ctx, cx, cy, 30, 12);
  drawTripod(ctx, cx, cy, 14);
  px(ctx, cx - 7, cy - 22, PALETTE.outline, 15, 9);
  px(ctx, cx - 6, cy - 21, PALETTE.stoneMid, 13, 7);
  px(ctx, cx - 3, cy - 20, PALETTE.rustLight, 8, 2);
  linePx(ctx, cx + 6, cy - 19, cx + 14, cy - 23, PALETTE.outline, 3);
  linePx(ctx, cx + 6, cy - 20, cx + 14, cy - 24, PALETTE.hostGold, 1);
  nativePx(ctx, cx + 14.5, cy - 24.5, PALETTE.flash);
}

export function drawDroneRelayPylon(ctx, cx, cy) {
  drawDeviceShadow(ctx, cx, cy, 31, 12);
  drawIsoPrism(ctx, cx, cy, 29, 14, 8, {
    top: PALETTE.stoneLight,
    left: PALETTE.stoneMid,
    right: PALETTE.rustDark,
    outline: PALETTE.outline
  });
  px(ctx, cx - 4, cy - 30, PALETTE.outline, 9, 24);
  px(ctx, cx - 2, cy - 29, PALETTE.rustMid, 5, 21);
  px(ctx, cx - 1, cy - 28, PALETTE.rustLight, 2, 17);
  for (const y of [cy - 29, cy - 22, cy - 15]) {
    px(ctx, cx - 8, y, PALETTE.outline, 17, 3);
    px(ctx, cx - 6, y, PALETTE.hostGold, 13, 1);
  }
  nativePx(ctx, cx + 0.5, cy - 27.5, PALETTE.flash);
}

export function drawDroneMedStation(ctx, cx, cy) {
  drawDeviceShadow(ctx, cx, cy, 38, 13);
  drawIsoPrism(ctx, cx, cy + 1, 36, 16, 9, {
    top: PALETTE.stoneDust,
    left: PALETTE.stoneMid,
    right: PALETTE.stoneDark,
    outline: PALETTE.outline
  });
  px(ctx, cx - 13, cy - 21, PALETTE.outline, 27, 15);
  px(ctx, cx - 11, cy - 19, PALETTE.clothTan, 23, 11);
  px(ctx, cx - 2, cy - 17, PALETTE.clothRed, 5, 7);
  px(ctx, cx - 5, cy - 15, PALETTE.clothRed, 11, 3);
  px(ctx, cx + 8, cy - 18, PALETTE.rustDark, 3, 8);
  nativeLinePx(ctx, cx - 9.5, cy - 18.5, cx + 6.5, cy - 18.5, PALETTE.uiPaperHigh);
}

function drawDeviceShadow(ctx, cx, cy, width, height) {
  drawIsoDiamond(ctx, cx, cy + 1, Math.max(12, width - 6), Math.max(5, height - 3), PALETTE.rustDark);
}

function drawTripod(ctx, cx, cy, height) {
  const topY = cy - height;
  for (const dx of [-10, 0, 10]) {
    linePx(ctx, cx, topY, cx + dx, cy, PALETTE.outline, 3);
    linePx(ctx, cx, topY, cx + dx, cy - 1, dx < 0 ? PALETTE.stoneLight : PALETTE.rustMid, 1);
  }
  px(ctx, cx - 3, topY - 2, PALETTE.outline, 7, 5);
  nativePx(ctx, cx - 1.5, topY - 0.5, PALETTE.stoneDust);
}
