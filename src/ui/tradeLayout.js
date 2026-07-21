export const TRADE_BOX = Object.freeze({ x: 50, y: 38, w: 540, h: 342 });

export const TRADE_PANELS = Object.freeze({
  trader: Object.freeze({ x: TRADE_BOX.x + 16, y: TRADE_BOX.y + 32, w: 236, h: 168 }),
  player: Object.freeze({ x: TRADE_BOX.x + 288, y: TRADE_BOX.y + 32, w: 236, h: 168 }),
  detail: Object.freeze({ x: TRADE_BOX.x + 16, y: TRADE_BOX.y + 210, w: 508, h: 80 })
});

export const TRADE_ROW = Object.freeze({
  h: 22,
  visible: 6
});

export const TRADE_BUTTONS = Object.freeze({
  buy: Object.freeze({ x: TRADE_BOX.x + 188, y: TRADE_BOX.y + TRADE_BOX.h - 25, w: 78, h: 16 }),
  close: Object.freeze({ x: TRADE_BOX.x + 292, y: TRADE_BOX.y + TRADE_BOX.h - 25, w: 78, h: 16 })
});

export function tradeTraderRowBox(index) {
  if (!Number.isInteger(index) || index < 0 || index >= TRADE_ROW.visible) return null;
  return {
    x: TRADE_PANELS.trader.x + 7,
    y: TRADE_PANELS.trader.y + 26 + index * TRADE_ROW.h,
    w: TRADE_PANELS.trader.w - 14,
    h: TRADE_ROW.h - 2
  };
}

export function tradePlayerRowBox(index) {
  if (!Number.isInteger(index) || index < 0 || index >= TRADE_ROW.visible) return null;
  return {
    x: TRADE_PANELS.player.x + 7,
    y: TRADE_PANELS.player.y + 26 + index * TRADE_ROW.h,
    w: TRADE_PANELS.player.w - 14,
    h: TRADE_ROW.h - 2
  };
}

export function tradeListOffset(selectedIndex, count, visible = TRADE_ROW.visible) {
  const size = Math.max(0, Math.floor(Number(count) || 0));
  const windowSize = Math.max(1, Math.floor(Number(visible) || TRADE_ROW.visible));
  if (size <= windowSize) return 0;
  const selected = Math.max(0, Math.min(size - 1, Math.floor(Number(selectedIndex) || 0)));
  return Math.max(0, Math.min(selected - windowSize + 1, size - windowSize));
}

export function tradeTraderIndexAt(point, count = TRADE_ROW.visible, offset = 0) {
  if (!point) return null;
  const start = Math.max(0, Math.floor(Number(offset) || 0));
  const max = Math.min(TRADE_ROW.visible, Math.max(0, count - start));
  for (let index = 0; index < max; index += 1) {
    if (pointInBox(point, tradeTraderRowBox(index))) return start + index;
  }
  return null;
}

export function tradePlayerIndexAt(point, count = TRADE_ROW.visible, offset = 0) {
  if (!point) return null;
  const start = Math.max(0, Math.floor(Number(offset) || 0));
  const max = Math.min(TRADE_ROW.visible, Math.max(0, count - start));
  for (let index = 0; index < max; index += 1) {
    if (pointInBox(point, tradePlayerRowBox(index))) return start + index;
  }
  return null;
}

export function tradeActionAt(point) {
  if (!point) return null;
  for (const [id, box] of Object.entries(TRADE_BUTTONS)) {
    if (pointInBox(point, box)) return id;
  }
  return null;
}

function pointInBox(point, box) {
  return Boolean(
    point && box &&
    point.x >= box.x &&
    point.x < box.x + box.w &&
    point.y >= box.y &&
    point.y < box.y + box.h
  );
}
