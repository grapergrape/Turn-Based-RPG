import { normalizeLoadingState, loadingPercent } from '../../core/LoadingProgress.js';
import { PALETTE } from '../palette.js';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../renderConfig.js';
import {
  bar,
  clipUiText,
  detailRect,
  rect,
  text,
  textWidth,
  windowFrame
} from './UiPrimitives.js';

const PANEL = { x: 96, y: 148, w: 448, h: 174 };
const BAR = { x: PANEL.x + 46, y: PANEL.y + 110, w: PANEL.w - 92, h: 13 };

export function drawLoadingScreen(ctx, rawState = {}) {
  const state = normalizeLoadingState(rawState);
  const w = LOGICAL_WIDTH;
  const h = LOGICAL_HEIGHT;
  ctx.imageSmoothingEnabled = false;

  rect(ctx, 0, 0, w, h, PALETTE.void);
  for (let y = 0; y < h; y += 4) rect(ctx, 0, y, w, 1, PALETTE.uiDark);
  for (let x = 12; x < w - 12; x += 31) {
    rect(ctx, x, 22 + ((x >> 2) % 5) * 3, 9, 1, PALETTE.uiBorderDark);
    rect(ctx, x + 7, h - 32 - ((x >> 3) % 5) * 2, 7, 1, PALETTE.uiBorderDark);
  }

  windowFrame(ctx, PANEL, 'FIELD LOAD');
  drawCornerMarks(ctx);

  const title = 'VALE IMPRINT';
  text(ctx, title, Math.round((w - textWidth(title, 2)) / 2), PANEL.y + 34, PALETTE.uiWarn, 2);

  const message = clipUiText(state.message, 48);
  text(ctx, message, Math.round((w - textWidth(message)) / 2), PANEL.y + 76, PALETTE.uiText);

  if (state.detail) {
    const detail = clipUiText(state.detail, 48);
    text(ctx, detail, Math.round((w - textWidth(detail)) / 2), PANEL.y + 91, PALETTE.uiDim);
  }

  bar(ctx, BAR.x, BAR.y, BAR.w, BAR.h, state.progress, PALETTE.uiWarn);
  drawBarTicks(ctx, state.progress);

  const percent = loadingPercent(state.progress);
  text(ctx, percent, BAR.x + BAR.w - textWidth(percent), BAR.y + 22, PALETTE.uiGood);
  text(ctx, 'LOADING', BAR.x, BAR.y + 22, PALETTE.uiDim);
}

function drawCornerMarks(ctx) {
  const c = PALETTE.uiBorderLight;
  const d = PALETTE.uiBorderDark;
  const points = [
    { x: PANEL.x + 18, y: PANEL.y + 28, sx: 1, sy: 1 },
    { x: PANEL.x + PANEL.w - 18, y: PANEL.y + 28, sx: -1, sy: 1 },
    { x: PANEL.x + 18, y: PANEL.y + PANEL.h - 18, sx: 1, sy: -1 },
    { x: PANEL.x + PANEL.w - 18, y: PANEL.y + PANEL.h - 18, sx: -1, sy: -1 }
  ];
  for (const p of points) {
    const hx = p.sx > 0 ? p.x : p.x - 12;
    const hy = p.sy > 0 ? p.y : p.y - 8;
    const ix = p.sx > 0 ? p.x + 2 : p.x - 10;
    const iy = p.sy > 0 ? p.y + 3 : p.y - 3;
    rect(ctx, hx, p.y, 12, 1, c);
    rect(ctx, p.x, hy, 1, 8, c);
    rect(ctx, ix, iy, 8, 1, d);
    detailRect(ctx, p.x + (p.sx > 0 ? 0.5 : -0.5), p.y + (p.sy > 0 ? 0.5 : -0.5), 0.5, 0.5, PALETTE.uiText);
  }
}

function drawBarTicks(ctx, progress) {
  const filled = Math.round((BAR.w - 2) * Math.max(0, Math.min(1, progress)));
  for (let x = 7; x < BAR.w - 2; x += 14) {
    const color = x <= filled ? PALETTE.uiText : PALETTE.uiBorderDark;
    rect(ctx, BAR.x + x, BAR.y + 3, 1, BAR.h - 6, color);
    detailRect(ctx, BAR.x + x + 0.5, BAR.y + 3.5, 0.5, BAR.h - 7, color);
  }
}
