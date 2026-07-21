export const SAVE_FRAME = Object.freeze({ x: 86, y: 36, w: 468, h: 408 });
export const SAVE_BODY = Object.freeze({ x: 110, y: 106, w: 420, h: 286 });
export const SAVE_OPTION_START_Y = 150;
export const SAVE_OPTION_ROW_HEIGHT = 34;
export const SAVE_OPTION_COUNT = 5;
export const SAVE_SLOT_START_Y = 126;
export const SAVE_SLOT_ROW_HEIGHT = 58;

export function saveOptionBox(index) {
  return {
    x: SAVE_BODY.x + 44,
    y: SAVE_OPTION_START_Y + index * SAVE_OPTION_ROW_HEIGHT,
    w: SAVE_BODY.w - 88,
    h: 25
  };
}

export function saveSlotBox(index) {
  return {
    x: SAVE_BODY.x + 12,
    y: SAVE_SLOT_START_Y + index * SAVE_SLOT_ROW_HEIGHT,
    w: SAVE_BODY.w - 24,
    h: 49
  };
}

export function saveOptionAt(point, count = SAVE_OPTION_COUNT) {
  for (let index = 0; index < count; index += 1) {
    if (pointInBox(point, saveOptionBox(index))) return index;
  }
  return null;
}

export function saveSlotAt(point, count = 4) {
  for (let index = 0; index < count; index += 1) {
    if (pointInBox(point, saveSlotBox(index))) return index;
  }
  return null;
}

function pointInBox(point, box) {
  return Boolean(point && point.x >= box.x && point.x < box.x + box.w && point.y >= box.y && point.y < box.y + box.h);
}
