const SCREEN_W = 640;
const VIEWPORT_H = 384;

export const CONTEXT_ACTION_MENU = Object.freeze({
  w: 168,
  rowH: 22,
  pad: 3,
  gap: 5
});

export function contextActionMenuBox(menu = null) {
  const actions = menu?.actions ?? [];
  if (!menu?.anchor || actions.length <= 0) return null;
  const w = CONTEXT_ACTION_MENU.w;
  const h = CONTEXT_ACTION_MENU.pad * 2 + actions.length * CONTEXT_ACTION_MENU.rowH;
  let x = menu.anchor.x + CONTEXT_ACTION_MENU.gap;
  if (x + w > SCREEN_W - 4) x = menu.anchor.x - CONTEXT_ACTION_MENU.gap - w;
  x = Math.max(4, Math.min(x, SCREEN_W - w - 4));
  const y = Math.max(4, Math.min(menu.anchor.y, VIEWPORT_H - h - 4));
  return { x, y, w, h };
}

export function contextActionBox(menu = null, index = -1) {
  const actions = menu?.actions ?? [];
  if (!Number.isInteger(index) || index < 0 || index >= actions.length) return null;
  const box = contextActionMenuBox(menu);
  if (!box) return null;
  return {
    x: box.x + CONTEXT_ACTION_MENU.pad,
    y: box.y + CONTEXT_ACTION_MENU.pad + index * CONTEXT_ACTION_MENU.rowH,
    w: box.w - CONTEXT_ACTION_MENU.pad * 2,
    h: CONTEXT_ACTION_MENU.rowH - 2
  };
}

export function contextActionAt(point, menu = null) {
  if (!point || !menu) return null;
  for (let index = 0; index < (menu.actions ?? []).length; index += 1) {
    if (pointInBox(point, contextActionBox(menu, index))) return menu.actions[index];
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
