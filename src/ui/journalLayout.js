export const JOURNAL_BOOK = Object.freeze({ x: 48, y: 16, w: 544, h: 352 });

export const JOURNAL_ARROW_BOXES = Object.freeze({
  prev: Object.freeze({ x: JOURNAL_BOOK.x + 18, y: JOURNAL_BOOK.y + JOURNAL_BOOK.h - 39, w: 34, h: 28 }),
  next: Object.freeze({ x: JOURNAL_BOOK.x + JOURNAL_BOOK.w - 52, y: JOURNAL_BOOK.y + JOURNAL_BOOK.h - 39, w: 34, h: 28 })
});

export function journalArrowAt(point) {
  if (!point) return null;
  for (const [id, box] of Object.entries(JOURNAL_ARROW_BOXES)) {
    if (
      point.x >= box.x && point.x < box.x + box.w &&
      point.y >= box.y && point.y < box.y + box.h
    ) {
      return id;
    }
  }
  return null;
}
