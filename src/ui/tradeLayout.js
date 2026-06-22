export const TRADE_BOX = Object.freeze({ x: 50, y: 38, w: 540, h: 318 });

export const TRADE_PANELS = Object.freeze({
  trader: Object.freeze({ x: TRADE_BOX.x + 16, y: TRADE_BOX.y + 32, w: 236, h: 168 }),
  player: Object.freeze({ x: TRADE_BOX.x + 288, y: TRADE_BOX.y + 32, w: 236, h: 168 }),
  detail: Object.freeze({ x: TRADE_BOX.x + 16, y: TRADE_BOX.y + 210, w: 508, h: 56 })
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

export function tradeTraderIndexAt(point, count = TRADE_ROW.visible) {
  if (!point) return null;
  const max = Math.min(TRADE_ROW.visible, Math.max(0, count));
  for (let index = 0; index < max; index += 1) {
    if (pointInBox(point, tradeTraderRowBox(index))) return index;
  }
  return null;
}

export function tradePlayerIndexAt(point, count = TRADE_ROW.visible) {
  if (!point) return null;
  const max = Math.min(TRADE_ROW.visible, Math.max(0, count));
  for (let index = 0; index < max; index += 1) {
    if (pointInBox(point, tradePlayerRowBox(index))) return index;
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
