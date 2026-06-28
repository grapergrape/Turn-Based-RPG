export const JOURNAL_BOOK = Object.freeze({ x: 48, y: 16, w: 544, h: 352 });

export const JOURNAL_PAGES = Object.freeze({
  left: Object.freeze({
    x: JOURNAL_BOOK.x + 16,
    y: JOURNAL_BOOK.y + 14,
    w: 244,
    h: JOURNAL_BOOK.h - 26
  }),
  right: Object.freeze({
    x: JOURNAL_BOOK.x + 284,
    y: JOURNAL_BOOK.y + 14,
    w: 244,
    h: JOURNAL_BOOK.h - 26
  })
});

export const JOURNAL_MAP_FIELD_BOX = Object.freeze({
  x: JOURNAL_PAGES.left.x + 12,
  y: JOURNAL_PAGES.left.y + 41,
  w: JOURNAL_PAGES.left.w - 24,
  h: JOURNAL_PAGES.left.h - 76
});

export const JOURNAL_ARROW_BOXES = Object.freeze({
  prev: Object.freeze({ x: JOURNAL_BOOK.x + 18, y: JOURNAL_BOOK.y + JOURNAL_BOOK.h - 39, w: 34, h: 28 }),
  next: Object.freeze({ x: JOURNAL_BOOK.x + JOURNAL_BOOK.w - 52, y: JOURNAL_BOOK.y + JOURNAL_BOOK.h - 39, w: 34, h: 28 })
});

export function journalArrowAt(point) {
  if (!point) return null;
  for (const [id, box] of Object.entries(JOURNAL_ARROW_BOXES)) {
    if (pointInBox(point, box)) {
      return id;
    }
  }
  return null;
}

export function journalMapGridMetrics(map, box = JOURNAL_MAP_FIELD_BOX) {
  if (!map) return null;
  const width = Math.max(1, map.width ?? 1);
  const height = Math.max(1, map.height ?? 1);
  const scaleX = Math.max(1, Math.floor(box.w / width));
  const scaleY = Math.max(1, Math.floor(box.h / height));
  const scale = Math.min(scaleX, scaleY);
  const drawW = Math.min(box.w, width * scaleX);
  const drawH = Math.min(box.h, height * scaleY);
  return {
    scale,
    scaleX,
    scaleY,
    width,
    height,
    x: box.x + Math.floor((box.w - drawW) / 2),
    y: box.y + Math.floor((box.h - drawH) / 2),
    w: drawW,
    h: drawH
  };
}

export function journalMapCellAt(point, map, box = JOURNAL_MAP_FIELD_BOX) {
  if (!point) return null;
  const metrics = journalMapGridMetrics(map, box);
  if (!metrics || !pointInBox(point, metrics)) return null;
  const x = Math.floor((point.x - metrics.x) / metrics.scaleX);
  const y = Math.floor((point.y - metrics.y) / metrics.scaleY);
  if (x < 0 || y < 0 || x >= metrics.width || y >= metrics.height) return null;
  return { x, y, key: `${x},${y}` };
}

function pointInBox(point, box) {
  return Boolean(
    point && box &&
    point.x >= box.x && point.x < box.x + box.w &&
    point.y >= box.y && point.y < box.y + box.h
  );
}
