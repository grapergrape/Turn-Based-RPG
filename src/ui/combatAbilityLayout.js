import { VIEWPORT } from '../render/renderConfig.js';

export const COMBAT_ABILITY_TRAY = Object.freeze({
  maxVisible: 4,
  cardW: 110,
  cardH: 27,
  navW: 18,
  pad: 3,
  gap: 2,
  headerH: 13,
  actorGap: 21,
  edgePad: 4
});

export function combatAbilityPageCount(tray = null) {
  const count = tray?.entries?.length ?? 0;
  return Math.max(1, Math.ceil(count / COMBAT_ABILITY_TRAY.maxVisible));
}

export function combatAbilityPage(tray = null) {
  const pageCount = combatAbilityPageCount(tray);
  return Math.max(0, Math.min(Math.trunc(tray?.page ?? 0), pageCount - 1));
}

export function visibleCombatAbilities(tray = null) {
  const page = combatAbilityPage(tray);
  const start = page * COMBAT_ABILITY_TRAY.maxVisible;
  return (tray?.entries ?? []).slice(start, start + COMBAT_ABILITY_TRAY.maxVisible);
}

export function combatAbilityTrayBox(tray = null) {
  if (!tray?.anchor || (tray.entries?.length ?? 0) <= 0) return null;
  const { maxVisible, cardW, cardH, navW, pad, gap, headerH, actorGap, edgePad } = COMBAT_ABILITY_TRAY;
  const paging = (tray.entries?.length ?? 0) > maxVisible;
  const slots = Math.min(maxVisible, tray.entries.length);
  const cardsW = slots * cardW + Math.max(0, slots - 1) * gap;
  const navsW = paging ? navW * 2 + gap * 2 : 0;
  const w = pad * 2 + cardsW + navsW;
  const h = pad * 2 + headerH + cardH;
  const desiredX = Math.round(tray.anchor.x - w / 2);
  let y = Math.round(tray.anchor.y + actorGap);
  if (y + h > VIEWPORT.y + VIEWPORT.height - edgePad) {
    y = Math.round(tray.anchor.y - h - 70);
  }
  return {
    x: clamp(desiredX, VIEWPORT.x + edgePad, VIEWPORT.x + VIEWPORT.width - w - edgePad),
    y: clamp(y, VIEWPORT.y + edgePad, VIEWPORT.y + VIEWPORT.height - h - edgePad),
    w,
    h,
    paging
  };
}

export function combatAbilityCardBox(tray = null, visibleIndex = -1) {
  const visible = visibleCombatAbilities(tray);
  if (!Number.isInteger(visibleIndex) || visibleIndex < 0 || visibleIndex >= visible.length) return null;
  const box = combatAbilityTrayBox(tray);
  if (!box) return null;
  const { navW, pad, gap, headerH, cardW, cardH } = COMBAT_ABILITY_TRAY;
  const startX = box.x + pad + (box.paging ? navW + gap : 0);
  return {
    x: startX + visibleIndex * (cardW + gap),
    y: box.y + pad + headerH,
    w: cardW,
    h: cardH
  };
}

export function combatAbilityNavBox(tray = null, direction = 0) {
  const box = combatAbilityTrayBox(tray);
  if (!box?.paging || (direction !== -1 && direction !== 1)) return null;
  const { navW, pad, headerH, cardH } = COMBAT_ABILITY_TRAY;
  return {
    x: direction < 0 ? box.x + pad : box.x + box.w - pad - navW,
    y: box.y + pad + headerH,
    w: navW,
    h: cardH
  };
}

export function combatAbilityAt(point, tray = null) {
  if (!point || !tray) return null;
  const previous = combatAbilityNavBox(tray, -1);
  if (pointInBox(point, previous)) return { kind: 'page', direction: -1 };
  const next = combatAbilityNavBox(tray, 1);
  if (pointInBox(point, next)) return { kind: 'page', direction: 1 };
  const visible = visibleCombatAbilities(tray);
  for (let index = 0; index < visible.length; index += 1) {
    if (pointInBox(point, combatAbilityCardBox(tray, index))) {
      return { kind: 'ability', entry: visible[index], visibleIndex: index };
    }
  }
  return pointInBox(point, combatAbilityTrayBox(tray)) ? { kind: 'tray' } : null;
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
