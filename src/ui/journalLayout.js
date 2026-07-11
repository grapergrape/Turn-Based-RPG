export const JOURNAL_BOOK = Object.freeze({ x: 18, y: 14, w: 604, h: 356 });

export const JOURNAL_PAGES = Object.freeze({
  left: Object.freeze({
    x: JOURNAL_BOOK.x + 14,
    y: JOURNAL_BOOK.y + 17,
    w: 274,
    h: JOURNAL_BOOK.h - 34
  }),
  right: Object.freeze({
    x: JOURNAL_BOOK.x + JOURNAL_BOOK.w - 288,
    y: JOURNAL_BOOK.y + 17,
    w: 274,
    h: JOURNAL_BOOK.h - 34
  })
});

export const JOURNAL_MAP_FIELD_BOX = Object.freeze({
  x: JOURNAL_PAGES.left.x + 12,
  y: JOURNAL_PAGES.left.y + 45,
  w: JOURNAL_PAGES.left.w - 24,
  h: JOURNAL_PAGES.left.h - 82
});

export const JOURNAL_ARROW_BOXES = Object.freeze({
  prev: Object.freeze({ x: 2, y: 155, w: 28, h: 58 }),
  next: Object.freeze({ x: 610, y: 155, w: 28, h: 58 })
});

export const JOURNAL_TECHNIQUE_LIST = Object.freeze({
  x: JOURNAL_PAGES.left.x + 7,
  y: JOURNAL_PAGES.left.y + 87,
  w: JOURNAL_PAGES.left.w - 14,
  rowHeight: 14,
  textOffset: 3,
  visibleRows: 14
});

export function journalTabBoxes(count) {
  const safeCount = Math.max(0, Math.floor(Number(count) || 0));
  if (safeCount === 0) return [];
  const gap = 4;
  const margin = 20;
  const tabW = Math.floor((JOURNAL_BOOK.w - margin * 2 - gap * (safeCount - 1)) / safeCount);
  const total = safeCount * tabW + (safeCount - 1) * gap;
  const startX = JOURNAL_BOOK.x + Math.floor((JOURNAL_BOOK.w - total) / 2);
  return Array.from({ length: safeCount }, (_, index) => Object.freeze({
    x: startX + index * (tabW + gap),
    y: JOURNAL_BOOK.y - 12,
    w: tabW,
    h: 25
  }));
}

export function journalTabAt(point, count) {
  if (!point) return null;
  const boxes = journalTabBoxes(count);
  const index = boxes.findIndex((box) => pointInBox(point, box));
  return index >= 0 ? index : null;
}

export function journalTechniqueWindow(entries, selectedIndex, visibleRows = JOURNAL_TECHNIQUE_LIST.visibleRows) {
  const list = Array.isArray(entries) ? entries : [];
  const count = list.length;
  const rows = Math.max(1, Math.floor(Number(visibleRows) || 1));
  const selected = count > 0
    ? Math.max(0, Math.min(count - 1, Math.floor(Number(selectedIndex) || 0)))
    : 0;
  const start = Math.max(0, Math.min(Math.max(0, count - rows), selected - rows + 1));
  const end = Math.min(count, start + rows);
  return {
    count,
    selected,
    start,
    end,
    selectedRow: count > 0 ? selected - start : 0,
    entries: list.slice(start, end),
    hasPrevious: start > 0,
    hasNext: end < count
  };
}

export function journalTechniqueRowAt(point, entries, selectedIndex) {
  if (!point || !pointInBox(point, {
    ...JOURNAL_TECHNIQUE_LIST,
    h: JOURNAL_TECHNIQUE_LIST.rowHeight * JOURNAL_TECHNIQUE_LIST.visibleRows
  })) return null;
  const window = journalTechniqueWindow(entries, selectedIndex);
  const row = Math.floor((point.y - JOURNAL_TECHNIQUE_LIST.y) / JOURNAL_TECHNIQUE_LIST.rowHeight);
  const index = window.start + row;
  return index >= window.start && index < window.end ? index : null;
}

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
