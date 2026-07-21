import { PALETTE } from '../palette.js';
import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  NATIVE_PIXEL,
  VIEWPORT,
  snapToNativePixel
} from '../renderConfig.js';
import { wrapUiText } from '../../ui/dialogueLayout.js';

const OUTCOME_PREFIXES = [
  { text: 'SUCCESS:', color: PALETTE.uiSuccess },
  { text: 'FAILED:', color: PALETTE.uiFailure }
];
const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ';': ['00000', '00100', '00100', '00000', '00100', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '[': ['01110', '01000', '01000', '01000', '01000', '01000', '01110'],
  ']': ['01110', '00010', '00010', '00010', '00010', '00010', '01110'],
  '>': ['10000', '01000', '00100', '00010', '00100', '01000', '10000'],
  '<': ['00001', '00010', '00100', '01000', '00100', '00010', '00001'],
  '%': ['11001', '11010', '00100', '01000', '10110', '00110', '00000'],
  '#': ['01010', '11111', '01010', '01010', '11111', '01010', '00000'],
  '*': ['00100', '10101', '01110', '11111', '01110', '10101', '00100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000']
};

// The opening writ: a full-screen wall of grim amber text, paged.
export function drawBriefing(ctx, data) {
  const W = LOGICAL_WIDTH;
  const H = LOGICAL_HEIGHT;
  rect(ctx, 0, 0, W, H, PALETTE.void);
  for (let y = 0; y < H; y += 3) rect(ctx, 0, y, W, 1, PALETTE.uiDark);
  for (let x = 20; x < W - 20; x += 29) {
    rect(ctx, x, 22 + ((x >> 2) % 4), 9, 1, PALETTE.uiBorderDark);
    rect(ctx, x + 7, H - 30 - ((x >> 3) % 4), 7, 1, PALETTE.uiDark);
  }

  const frame = { x: 44, y: 32, w: W - 88, h: H - 64 };
  const body = { x: frame.x + 42, y: frame.y + 68, w: frame.w - 84, h: frame.h - 148 };
  windowFrame(ctx, frame, data.title ?? 'FIELD WRIT');
  inset(ctx, body);

  const left = body.x + 12;
  const right = body.x + body.w - 12;
  const maxChars = Math.floor((right - left) / 6);

  const pageStr = `${(data.pageIndex ?? 0) + 1} / ${data.pageCount ?? 1}`;
  text(ctx, pageStr, right - textWidth(pageStr), frame.y + 28, PALETTE.uiDim);
  rect(ctx, left, frame.y + 49, right - left, 1, PALETTE.uiBorderDark);
  rect(ctx, left, frame.y + 52, 38, 1, PALETTE.uiWarn);
  rect(ctx, right - 38, frame.y + 52, 38, 1, PALETTE.uiBorderDark);
  detailRect(ctx, left + 0.5, frame.y + 49.5, right - left - 1, NATIVE_PIXEL, PALETTE.uiBorderLight);
  detailRect(ctx, left + 0.5, frame.y + 52.5, 37, NATIVE_PIXEL, PALETTE.uiText);

  let y = body.y + 12;
  for (const para of data.page ?? []) {
    for (const line of wrapText(para, maxChars)) {
      text(ctx, line, left, y, PALETTE.uiText);
      y += 12;
    }
    y += 12;
  }

  const last = (data.pageIndex ?? 0) >= (data.pageCount ?? 1) - 1;
  const advanceText = last
    ? (data.lastPrompt ?? 'ENTER: ENTER THE CHAPEL')
    : (data.nextPrompt ?? 'ENTER: CONTINUE');
  const skipText = data.skipPrompt ?? 'ESC: SKIP';
  rect(ctx, left - 2, frame.y + frame.h - 45, textWidth(advanceText) + 8, 13, PALETTE.outline);
  rect(ctx, left - 1, frame.y + frame.h - 44, textWidth(advanceText) + 6, 11, PALETTE.uiDark);
  detailRect(ctx, left - 0.5, frame.y + frame.h - 43.5, textWidth(advanceText) + 5, NATIVE_PIXEL, PALETTE.uiBorderLight);
  detailRect(ctx, left - 0.5, frame.y + frame.h - 43.5, NATIVE_PIXEL, 10, PALETTE.uiBorderLight);
  text(ctx, advanceText, left + 2, frame.y + frame.h - 42, PALETTE.uiGood);
  if (skipText) text(ctx, skipText, right - textWidth(skipText), frame.y + frame.h - 40, PALETTE.uiDim);
}

export function panelTexture(ctx, box) {
  const width = box.width ?? box.w;
  const height = box.height ?? box.h;
  rect(ctx, box.x, box.y, width, height, PALETTE.outline);
  rect(ctx, box.x + 1, box.y + 1, width - 2, height - 2, PALETTE.uiPanel);
  rect(ctx, box.x + 1, box.y + 1, width - 2, 1, PALETTE.uiBorderLight);
  rect(ctx, box.x + 1, box.y + height - 2, width - 2, 1, PALETTE.uiDark);
  rect(ctx, box.x + 1, box.y + 1, 1, height - 2, PALETTE.uiBorderLight);
  rect(ctx, box.x + width - 2, box.y + 1, 1, height - 2, PALETTE.uiDark);
  detailRect(ctx, box.x + 1.5, box.y + 1.5, width - 3, NATIVE_PIXEL, PALETTE.uiBorderLight);
  detailRect(ctx, box.x + 1.5, box.y + 1.5, NATIVE_PIXEL, height - 3, PALETTE.uiBorderLight);
  detailRect(ctx, box.x + 1.5, box.y + height - 2.5, width - 3, NATIVE_PIXEL, PALETTE.uiBorderDark);
  detailRect(ctx, box.x + width - 2.5, box.y + 1.5, NATIVE_PIXEL, height - 3, PALETTE.uiBorderDark);
  for (let y = box.y + 5; y < box.y + height - 4; y += 5) {
    rect(ctx, box.x + 3, y, width - 6, 1, PALETTE.uiDark);
  }
  for (let x = box.x + 7; x < box.x + width - 7; x += 19) {
    const y = box.y + 3 + ((x >> 1) % 4);
    rect(ctx, x, y, 5, 1, PALETTE.uiBorderDark);
    if (x % 3 === 0) rect(ctx, x + 2, box.y + height - 9, 1, 3, PALETTE.uiBorderDark);
  }
  for (const [x, y] of [
    [box.x + 4, box.y + 4],
    [box.x + width - 8, box.y + 4],
    [box.x + 4, box.y + height - 8],
    [box.x + width - 8, box.y + height - 8]
  ]) {
    rivet(ctx, x, y);
  }
}

export function windowFrame(ctx, box, title = '') {
  rect(ctx, box.x - 1, box.y - 1, box.w + 2, box.h + 2, PALETTE.outline);
  rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiDark);
  rect(ctx, box.x + 2, box.y + 2, box.w - 4, box.h - 4, PALETTE.uiPanel);
  rect(ctx, box.x, box.y, box.w, 1, PALETTE.uiBorderLight);
  rect(ctx, box.x, box.y + box.h - 1, box.w, 1, PALETTE.uiBorderDark);
  rect(ctx, box.x, box.y, 1, box.h, PALETTE.uiBorderLight);
  rect(ctx, box.x + box.w - 1, box.y, 1, box.h, PALETTE.uiBorderDark);
  rect(ctx, box.x + 3, box.y + 3, box.w - 6, 13, PALETTE.uiDark);
  rect(ctx, box.x + 5, box.y + 15, box.w - 10, 1, PALETTE.uiBorderDark);
  rect(ctx, box.x + 8, box.y + box.h - 6, box.w - 16, 1, PALETTE.uiDark);
  detailRect(ctx, box.x + 0.5, box.y + 0.5, box.w - 1, NATIVE_PIXEL, PALETTE.uiBorderLight);
  detailRect(ctx, box.x + 0.5, box.y + 0.5, NATIVE_PIXEL, box.h - 1, PALETTE.uiBorderLight);
  detailRect(ctx, box.x + 0.5, box.y + box.h - 1, box.w - 1, NATIVE_PIXEL, PALETTE.uiBorderDark);
  detailRect(ctx, box.x + box.w - 1, box.y + 0.5, NATIVE_PIXEL, box.h - 1, PALETTE.uiBorderDark);
  detailRect(ctx, box.x + 4.5, box.y + 14.5, box.w - 9, NATIVE_PIXEL, PALETTE.uiBorderLight);
  for (let x = box.x + 18; x < box.x + box.w - 18; x += 22) {
    rect(ctx, x, box.y + 6, 7, 1, PALETTE.uiBorderDark);
    rect(ctx, x + 3, box.y + box.h - 8, 5, 1, PALETTE.uiBorderDark);
  }
  frameCornerPlate(ctx, box.x + 4, box.y + 4, 1, 1);
  frameCornerPlate(ctx, box.x + box.w - 5, box.y + 4, -1, 1);
  frameCornerPlate(ctx, box.x + 4, box.y + box.h - 5, 1, -1);
  frameCornerPlate(ctx, box.x + box.w - 5, box.y + box.h - 5, -1, -1);
  if (title) {
    rect(ctx, box.x + 9, box.y + 5, Math.min(box.w - 24, textWidth(title) + 4), 9, PALETTE.outline);
    rect(ctx, box.x + 10, box.y + 6, Math.min(box.w - 26, textWidth(title) + 2), 7, PALETTE.uiDark);
    text(ctx, title, box.x + 11, box.y + 6, PALETTE.uiBorderLight);
  }
}

// A small solid scroll triangle (dir -1 = up, 1 = down).
export function scrollArrow(ctx, x, y, dir, color) {
  for (let i = 0; i < 4; i += 1) {
    const w = dir < 0 ? i * 2 + 1 : 7 - i * 2;
    rect(ctx, x - Math.floor(w / 2), y + i, w, 1, color);
  }
  detailLine(ctx, x + 0.5, y + (dir < 0 ? 0.5 : 3.5), x + 0.5, y + (dir < 0 ? 2.5 : 1.5), PALETTE.uiText);
}

export function drawAreaTitle(ctx, areaTitle) {
  const ttl = Math.max(0, areaTitle.ttl ?? 0);
  if (ttl <= 0) return;

  const duration = Math.max(areaTitle.duration ?? ttl, 0.001);
  const progress = Math.max(0, Math.min(1, 1 - ttl / duration));
  if (progress > 0.78 && Math.floor(ttl * 18) % 2 === 0) return;

  const label = clipUiText(areaTitle.text, 46);
  const scale = 2;
  const textW = textWidth(label, scale);
  const bandW = Math.min(VIEWPORT.width - 72, Math.max(textW + 48, 248));
  const x = Math.round((VIEWPORT.width - textW) / 2);
  const y = 36;
  const bx = Math.round((VIEWPORT.width - bandW) / 2);
  const by = y - 12;
  const edge = progress < 0.18 || progress > 0.68 ? PALETTE.uiWarn : PALETTE.uiBorderLight;
  const textColor = progress > 0.7 && Math.floor(ttl * 14) % 2 === 0 ? PALETTE.uiWarn : PALETTE.uiText;

  rect(ctx, bx - 2, by - 2, bandW + 4, 34, PALETTE.outline);
  rect(ctx, bx, by, bandW, 30, PALETTE.uiDark);
  rect(ctx, bx + 2, by + 2, bandW - 4, 1, edge);
  rect(ctx, bx + 2, by + 27, bandW - 4, 1, PALETTE.uiBorderDark);
  for (let sx = bx + 8; sx < bx + bandW - 8; sx += 16) {
    rect(ctx, sx, by + 6 + ((sx >> 2) % 3), 7, 1, PALETTE.uiBorderDark);
    rect(ctx, sx + 4, by + 23 - ((sx >> 3) % 3), 5, 1, PALETTE.uiBorderDark);
  }
  rect(ctx, bx + 6, by + 8, 12, 1, edge);
  rect(ctx, bx + bandW - 18, by + 8, 12, 1, edge);
  rect(ctx, bx + 6, by + 21, 12, 1, PALETTE.uiBorderDark);
  rect(ctx, bx + bandW - 18, by + 21, 12, 1, PALETTE.uiBorderDark);
  detailRect(ctx, bx + 2.5, by + 2.5, bandW - 5, NATIVE_PIXEL, edge);
  detailRect(ctx, bx + 2.5, by + 27.5, bandW - 5, NATIVE_PIXEL, PALETTE.uiBorderDark);
  text(ctx, label, x + 2, y + 2, PALETTE.outline, scale);
  text(ctx, label, x, y, textColor, scale);
}

export function drawJournalNotice(ctx, notice) {
  const ttl = Math.max(0, notice?.ttl ?? 0);
  if (ttl <= 0) return;

  const duration = Math.max(notice.duration ?? ttl, 0.001);
  const progress = Math.max(0, Math.min(1, 1 - ttl / duration));
  if (progress > 0.82 && Math.floor(ttl * 18) % 2 === 0) return;

  const title = clipUiText(notice.title ?? 'JOURNAL UPDATED', 24);
  const detail = clipUiText(notice.detail ?? '', 28);
  const width = Math.min(
    VIEWPORT.width - 24,
    Math.max(164, textWidth(title) + 42, textWidth(detail) + 42)
  );
  const height = 38;
  const x = VIEWPORT.width - width - 12;
  const y = 12;
  const edge = progress < 0.16 ? PALETTE.uiWarn : PALETTE.uiBorderLight;

  rect(ctx, x - 1, y - 1, width + 2, height + 2, PALETTE.outline);
  rect(ctx, x, y, width, height, PALETTE.uiPanel);
  rect(ctx, x + 1, y + 1, width - 2, 2, edge);
  rect(ctx, x + 1, y + height - 3, width - 2, 2, PALETTE.uiBorderDark);
  rect(ctx, x + 1, y + 1, 2, height - 2, edge);
  rect(ctx, x + width - 3, y + 1, 2, height - 2, PALETTE.uiBorderDark);
  rect(ctx, x + 5, y + 5, width - 10, 1, PALETTE.uiDark);
  rect(ctx, x + 5, y + height - 7, width - 10, 1, PALETTE.uiDark);
  detailRect(ctx, x + 1.5, y + 1.5, width - 3, NATIVE_PIXEL, edge);
  detailRect(ctx, x + 1.5, y + 1.5, NATIVE_PIXEL, height - 3, edge);
  detailRect(ctx, x + 1.5, y + height - 2.5, width - 3, NATIVE_PIXEL, PALETTE.uiBorderDark);
  detailRect(ctx, x + width - 2.5, y + 1.5, NATIVE_PIXEL, height - 3, PALETTE.uiBorderDark);

  // A split field ledger: two page blocks, a dark fold, and an amber clasp.
  rect(ctx, x + 8, y + 9, 18, 18, PALETTE.outline);
  rect(ctx, x + 9, y + 10, 8, 16, PALETTE.uiBorderLight);
  rect(ctx, x + 18, y + 10, 7, 16, PALETTE.uiText);
  rect(ctx, x + 17, y + 10, 1, 16, PALETTE.uiDark);
  rect(ctx, x + 11, y + 13, 4, 1, PALETTE.uiBorderDark);
  rect(ctx, x + 20, y + 13, 3, 1, PALETTE.uiBorderDark);
  rect(ctx, x + 11, y + 17, 4, 1, PALETTE.uiBorderDark);
  rect(ctx, x + 20, y + 17, 3, 1, PALETTE.uiBorderDark);
  rect(ctx, x + 15, y + 8, 5, 3, PALETTE.uiWarn);
  detailRect(ctx, x + 9.5, y + 10.5, 7, NATIVE_PIXEL, PALETTE.uiText);
  detailRect(ctx, x + 18.5, y + 10.5, 6, NATIVE_PIXEL, PALETTE.uiBorderLight);

  text(ctx, title, x + 34, y + 9, PALETTE.uiText);
  text(ctx, detail, x + 34, y + 22, PALETTE.uiGood);
}

export function drawHoverText(ctx, hoverText) {
  const label = clipUiText(hoverText, 62);
  const w = textWidth(label) + 16;
  const x = 10;
  const y = VIEWPORT.height - 20;
  rect(ctx, x - 1, y - 1, w + 2, 14, PALETTE.outline);
  rect(ctx, x, y, w, 12, PALETTE.uiDark);
  rect(ctx, x, y, w, 1, PALETTE.uiBorderLight);
  detailRect(ctx, x + 0.5, y + 0.5, w - 1, NATIVE_PIXEL, PALETTE.uiText);
  text(ctx, label, x + 7, y + 3, PALETTE.uiText);
}

export function drawCursor(ctx, cursor) {
  if (!cursor) return;
  const x = Math.round(cursor.x);
  const y = Math.round(cursor.y);
  const state = cursor.state ?? 'move';
  const c = state === 'blocked' ? PALETTE.uiBad : state === 'attack' ? PALETTE.uiBad : PALETTE.uiText;
  const dark = PALETTE.outline;

  if (state === 'move') {
    cursorLine(ctx, x, y, x, y + 13, dark, 2);
    cursorLine(ctx, x, y, x + 8, y + 8, dark, 2);
    cursorLine(ctx, x, y, x, y + 13, c);
    cursorLine(ctx, x, y, x + 8, y + 8, c);
    rect(ctx, x + 5, y + 12, 8, 2, c);
  } else if (state === 'inspect') {
    cursorBox(ctx, x, y, c);
    cursorLine(ctx, x + 10, y + 10, x + 15, y + 15, c);
  } else if (state === 'talk') {
    cursorBox(ctx, x, y, c);
    rect(ctx, x + 4, y + 5, 8, 2, c);
    rect(ctx, x + 4, y + 9, 5, 2, c);
  } else if (state === 'use') {
    cursorLine(ctx, x + 2, y + 13, x + 8, y + 2, c, 2);
    rect(ctx, x + 7, y + 1, 6, 4, c);
    rect(ctx, x + 11, y + 5, 3, 7, c);
  } else if (state === 'loot') {
    rect(ctx, x + 2, y + 5, 14, 9, dark);
    rect(ctx, x + 3, y + 6, 12, 7, c);
    rect(ctx, x + 5, y + 3, 8, 3, c);
    rect(ctx, x + 7, y + 8, 4, 2, PALETTE.uiBorderDark);
  } else if (state === 'attack') {
    cursorLine(ctx, x + 8, y, x + 8, y + 16, c);
    cursorLine(ctx, x, y + 8, x + 16, y + 8, c);
    rect(ctx, x + 6, y + 6, 5, 5, dark);
    rect(ctx, x + 7, y + 7, 3, 3, c);
  } else if (state === 'blocked') {
    cursorLine(ctx, x + 1, y + 1, x + 14, y + 14, c, 2);
    cursorLine(ctx, x + 14, y + 1, x + 1, y + 14, c, 2);
  } else {
    cursorLine(ctx, x, y, x, y + 13, PALETTE.uiBorderLight);
    cursorLine(ctx, x, y, x + 7, y + 7, PALETTE.uiBorderLight);
  }
  detailRect(ctx, x + 0.5, y + 0.5, NATIVE_PIXEL, NATIVE_PIXEL, PALETTE.uiText);
}

export function screenBackdrop(ctx, fullScreen = false) {
  const h = fullScreen ? LOGICAL_HEIGHT : VIEWPORT.height;
  for (let y = 0; y < h; y += 2) {
    rect(ctx, 0, y, VIEWPORT.width, 1, 'rgba(5, 5, 5, 0.45)');
  }
  for (let x = 0; x < VIEWPORT.width; x += 24) {
    rect(ctx, x, 0, 7, 1, PALETTE.uiBorderDark);
    rect(ctx, x + 9, h - 2, Math.min(9, VIEWPORT.width - (x + 9)), 1, PALETTE.uiDark);
  }
  for (let x = 12; x < LOGICAL_WIDTH - 12; x += 36) {
    detailRect(ctx, x + 0.5, 3.5 + ((x >> 2) % 3), 7, NATIVE_PIXEL, PALETTE.uiBorderDark);
  }
}

export function inset(ctx, box) {
  rect(ctx, box.x, box.y, box.w, box.h, PALETTE.outline);
  rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, PALETTE.uiDark);
  rect(ctx, box.x + 2, box.y + 2, box.w - 4, box.h - 4, PALETTE.uiPanel);
  rect(ctx, box.x + 2, box.y + 2, box.w - 4, 1, PALETTE.uiDark);
  rect(ctx, box.x + 2, box.y + box.h - 3, box.w - 4, 1, PALETTE.uiBorderLight);
  rect(ctx, box.x + 2, box.y + 2, 1, box.h - 4, PALETTE.uiDark);
  rect(ctx, box.x + box.w - 3, box.y + 2, 1, box.h - 4, PALETTE.uiBorderLight);
  for (let x = box.x + 6; x < box.x + box.w - 6; x += 23) {
    rect(ctx, x, box.y + 5 + (x % 5), 3, 1, PALETTE.uiBorderDark);
    if (x % 2 === 0) rect(ctx, x + 1, box.y + box.h - 9, 1, 2, PALETTE.uiDark);
  }
  rect(ctx, box.x + 5, box.y + 5, 10, 1, PALETTE.uiBorderDark);
  rect(ctx, box.x + 5, box.y + 5, 1, 7, PALETTE.uiBorderDark);
  rect(ctx, box.x + box.w - 15, box.y + 5, 10, 1, PALETTE.uiBorderDark);
  rect(ctx, box.x + box.w - 6, box.y + 5, 1, 7, PALETTE.uiBorderDark);
  rect(ctx, box.x + 5, box.y + box.h - 6, 10, 1, PALETTE.uiBorderLight);
  rect(ctx, box.x + box.w - 15, box.y + box.h - 6, 10, 1, PALETTE.uiBorderLight);
  detailRect(ctx, box.x + 2.5, box.y + 2.5, box.w - 5, NATIVE_PIXEL, PALETTE.uiDark);
  detailRect(ctx, box.x + 2.5, box.y + 2.5, NATIVE_PIXEL, box.h - 5, PALETTE.uiDark);
  detailRect(ctx, box.x + 2.5, box.y + box.h - 3, box.w - 5, NATIVE_PIXEL, PALETTE.uiBorderLight);
  detailRect(ctx, box.x + box.w - 3, box.y + 2.5, NATIVE_PIXEL, box.h - 5, PALETTE.uiBorderLight);
}

export function bar(ctx, x, y, w, h, ratio, color) {
  const innerW = Math.max(1, w - 2);
  const innerH = Math.max(1, h - 2);
  const fill = Math.max(0, Math.min(innerW, Math.round(innerW * ratio)));
  rect(ctx, x, y, w, h, PALETTE.outline);
  rect(ctx, x + 1, y + 1, innerW, innerH, PALETTE.uiDark);
  if (fill > 0) {
    rect(ctx, x + 1, y + 1, fill, innerH, color);
    rect(ctx, x + 2, y + 2, Math.max(1, fill - 2), 1, PALETTE.uiBorderLight);
    rect(ctx, x + 1, y + h - 2, fill, 1, PALETTE.uiBorderDark);
    detailRect(ctx, x + 1.5, y + 1.5, Math.max(NATIVE_PIXEL, fill - 1), NATIVE_PIXEL, PALETTE.uiText);
    detailRect(ctx, x + fill + 0.5, y + 1.5, NATIVE_PIXEL, Math.max(NATIVE_PIXEL, innerH - 1), PALETTE.uiBorderDark);
  }
  for (let i = 8; i < w - 2; i += 8) {
    rect(ctx, x + i, y + 1, 1, innerH, PALETTE.outline);
    rect(ctx, x + i + 1, y + 2, 1, Math.max(1, innerH - 2), PALETTE.uiBorderDark);
  }
}

export function apPips(ctx, x, y, ap, maxAp) {
  for (let i = 0; i < maxAp; i += 1) {
    const px = x + i * 7;
    const active = i < ap;
    rect(ctx, px, y, 6, 8, PALETTE.outline);
    rect(ctx, px + 1, y + 1, 4, 6, active ? PALETTE.uiGood : PALETTE.uiDark);
    rect(ctx, px + 1, y + 1, 4, 1, active ? PALETTE.uiBorderLight : PALETTE.uiBorderDark);
    rect(ctx, px + 4, y + 2, 1, 4, PALETTE.uiBorderDark);
    if (active) rect(ctx, px + 2, y + 3, 2, 2, PALETTE.uiText);
    detailRect(ctx, px + 1.5, y + 1.5, 3, NATIVE_PIXEL, active ? PALETTE.uiText : PALETTE.uiBorderDark);
    detailRect(ctx, px + 4.5, y + 2.5, NATIVE_PIXEL, 3, PALETTE.uiBorderDark);
  }
}

function cursorBox(ctx, x, y, color) {
  rect(ctx, x + 2, y + 2, 11, 11, PALETTE.outline);
  rect(ctx, x + 3, y + 3, 9, 9, PALETTE.uiDark);
  rect(ctx, x + 3, y + 3, 9, 1, color);
  rect(ctx, x + 3, y + 3, 1, 9, color);
  rect(ctx, x + 11, y + 3, 1, 9, PALETTE.uiBorderDark);
  rect(ctx, x + 3, y + 11, 9, 1, PALETTE.uiBorderDark);
}

function cursorLine(ctx, x0, y0, x1, y1, color, size = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    rect(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, size, size, color);
  }
}

function rivet(ctx, x, y) {
  rect(ctx, x, y, 4, 4, PALETTE.uiBorderDark);
  rect(ctx, x + 1, y + 1, 2, 2, PALETTE.uiBorderLight);
  rect(ctx, x + 2, y + 2, 1, 1, PALETTE.outline);
  detailRect(ctx, x + 1.5, y + 1.5, NATIVE_PIXEL, NATIVE_PIXEL, PALETTE.uiText);
  detailRect(ctx, x + 2.5, y + 2.5, NATIVE_PIXEL, NATIVE_PIXEL, PALETTE.outline);
}

function frameCornerPlate(ctx, x, y, sx, sy) {
  const ox = sx > 0 ? 0 : -7;
  const oy = sy > 0 ? 0 : -7;
  rect(ctx, x + ox, y + oy, 8, 8, PALETTE.outline);
  rect(ctx, x + ox + 1, y + oy + 1, 6, 6, PALETTE.uiBorderDark);
  rect(ctx, x + ox + 1, y + oy + 1, sx > 0 ? 5 : 1, 1, PALETTE.uiBorderLight);
  rect(ctx, x + ox + 1, y + oy + 1, 1, sy > 0 ? 5 : 1, PALETTE.uiBorderLight);
  rect(ctx, x + ox + 3, y + oy + 3, 2, 2, PALETTE.uiDark);
  detailRect(ctx, x + ox + 1.5, y + oy + 1.5, sx > 0 ? 4 : NATIVE_PIXEL, NATIVE_PIXEL, PALETTE.uiBorderLight);
  detailRect(ctx, x + ox + 4.5, y + oy + 4.5, NATIVE_PIXEL, NATIVE_PIXEL, PALETTE.outline);
}

export function text(ctx, str, x, y, color = PALETTE.uiText, scale = 1) {
  const text = normalize(str);
  let dx = Math.round(x);
  const dy = Math.round(y);
  for (const ch of text) {
    const glyph = FONT[ch] ?? FONT[' '];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === '1') rect(ctx, dx + col * scale, dy + row * scale, scale, scale, color);
      }
    }
    dx += 6 * scale;
  }
}

export function textWidth(str, scale = 1) {
  return normalize(str).length * 6 * scale;
}

export function outcomeText(ctx, str, x, y, baseColor = PALETTE.uiText, scale = 1) {
  const rendered = normalize(str);
  const outcome = OUTCOME_PREFIXES.find((entry) => rendered.startsWith(entry.text));
  if (!outcome) {
    text(ctx, rendered, x, y, baseColor, scale);
    return;
  }

  text(ctx, outcome.text, x, y, outcome.color, scale);
  const rest = rendered.slice(outcome.text.length);
  if (rest) {
    text(ctx, rest, x + textWidth(outcome.text, scale), y, baseColor, scale);
  }
}

export function wrapText(str, maxChars) {
  return wrapUiText(str, maxChars);
}

export function clipUiText(str, max) {
  const text = normalize(str);
  return text.length > max ? `${text.slice(0, Math.max(0, max - 3))}...` : text;
}

export function formatWeight(value) {
  const rounded = Math.round((Number(value) || 0) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function normalize(str) {
  return String(str ?? '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/×/g, 'X')
    .replace(/[^A-Za-z0-9:.,;!?+\-/'"()[\]<>%#* ]/g, ' ')
    .toUpperCase();
}

export function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

// One physical backing-store pixel expressed on the 640x480 logical grid.
// Geometry and hit boxes stay on their legacy integer coordinates; this is
// reserved for hard bevel glints, etching, and icon construction detail.
export function detailRect(ctx, x, y, w = NATIVE_PIXEL, h = NATIVE_PIXEL, color = PALETTE.uiBorderLight) {
  if (!color) return;
  ctx.fillStyle = color;
  ctx.fillRect(
    snapToNativePixel(x),
    snapToNativePixel(y),
    Math.max(NATIVE_PIXEL, snapToNativePixel(w)),
    Math.max(NATIVE_PIXEL, snapToNativePixel(h))
  );
}

export function detailLine(ctx, x0, y0, x1, y1, color, size = NATIVE_PIXEL) {
  if (!color) return;
  const span = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  const steps = Math.max(1, Math.ceil(span / NATIVE_PIXEL));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    detailRect(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, size, size, color);
  }
}
