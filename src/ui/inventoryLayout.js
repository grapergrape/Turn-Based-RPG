export const INVENTORY_BOX = Object.freeze({ x: 28, y: 16, w: 584, h: 352 });

export const INVENTORY_PANELS = Object.freeze({
  items: Object.freeze({ x: INVENTORY_BOX.x + 16, y: INVENTORY_BOX.y + 31, w: 250, h: 196 }),
  figure: Object.freeze({ x: INVENTORY_BOX.x + 280, y: INVENTORY_BOX.y + 31, w: 120, h: 196 }),
  gear: Object.freeze({ x: INVENTORY_BOX.x + 414, y: INVENTORY_BOX.y + 31, w: 138, h: 196 }),
  detail: Object.freeze({ x: INVENTORY_BOX.x + 16, y: INVENTORY_BOX.y + 237, w: 536, h: 68 })
});

export const INVENTORY_GRID = Object.freeze({
  x: INVENTORY_PANELS.items.x + 9,
  y: INVENTORY_PANELS.items.y + 31,
  cols: 7,
  rows: 4,
  cell: 30,
  gap: 4
});

export const INVENTORY_ACTION_BOXES = Object.freeze({
  sort: Object.freeze({ x: INVENTORY_BOX.x + INVENTORY_BOX.w - 74, y: INVENTORY_BOX.y + INVENTORY_BOX.h - 27, w: 60, h: 16 })
});

export const INVENTORY_ACTION_MENU = Object.freeze({
  w: 74,
  rowH: 16,
  pad: 3,
  gap: 4
});

export const INVENTORY_SPLIT_BOX = Object.freeze({
  box: Object.freeze({ x: 196, y: 122, w: 248, h: 128 }),
  slider: Object.freeze({ x: 228, y: 181, w: 184, h: 10 }),
  minus: Object.freeze({ x: 211, y: 178, w: 12, h: 16 }),
  plus: Object.freeze({ x: 417, y: 178, w: 12, h: 16 }),
  confirm: Object.freeze({ x: 222, y: 214, w: 78, h: 16 }),
  cancel: Object.freeze({ x: 340, y: 214, w: 78, h: 16 })
});

export const INVENTORY_REPAIR_BOX = Object.freeze({
  box: Object.freeze({ x: 174, y: 98, w: 292, h: 178 }),
  list: Object.freeze({ x: 190, y: 160, w: 260, h: 72 }),
  rowH: 18,
  confirm: Object.freeze({ x: 204, y: 242, w: 86, h: 16 }),
  cancel: Object.freeze({ x: 350, y: 242, w: 86, h: 16 })
});

export function inventoryCapacity() {
  return INVENTORY_GRID.cols * INVENTORY_GRID.rows;
}

export function inventorySlotBox(index) {
  if (!Number.isInteger(index) || index < 0 || index >= inventoryCapacity()) return null;
  const col = index % INVENTORY_GRID.cols;
  const row = Math.floor(index / INVENTORY_GRID.cols);
  return {
    x: INVENTORY_GRID.x + col * (INVENTORY_GRID.cell + INVENTORY_GRID.gap),
    y: INVENTORY_GRID.y + row * (INVENTORY_GRID.cell + INVENTORY_GRID.gap),
    w: INVENTORY_GRID.cell,
    h: INVENTORY_GRID.cell
  };
}

export function inventorySlotAt(point) {
  if (!point) return null;
  for (let index = 0; index < inventoryCapacity(); index += 1) {
    if (pointInBox(point, inventorySlotBox(index))) return index;
  }
  return null;
}

export function inventoryGearBox(index) {
  if (!Number.isInteger(index) || index < 0) return null;
  return {
    x: INVENTORY_PANELS.gear.x + 5,
    y: INVENTORY_PANELS.gear.y + 23 + index * 18 - 2,
    w: INVENTORY_PANELS.gear.w - 10,
    h: 16
  };
}

export function inventoryGearAt(point, slotCount = 0) {
  if (!point) return null;
  for (let index = 0; index < slotCount; index += 1) {
    if (pointInBox(point, inventoryGearBox(index))) return index;
  }
  return null;
}

export function inventoryActionMenuActions(menu = null) {
  const actions = [];
  if (menu?.canUse) actions.push('use');
  if (!menu || menu.canEquip || menu.canUnequip) actions.push('equip');
  if (menu?.canReload) actions.push('reload');
  if (menu?.canRepair) actions.push('repair');
  actions.push('drop');
  if (!menu || menu.canSplit !== false) actions.push('split');
  return actions;
}

export function inventoryActionMenuBox(anchorBox, menu = null) {
  if (!anchorBox) return null;
  const actions = inventoryActionMenuActions(menu);
  const w = INVENTORY_ACTION_MENU.w;
  const h = INVENTORY_ACTION_MENU.pad * 2 + actions.length * INVENTORY_ACTION_MENU.rowH;
  const leftLimit = INVENTORY_BOX.x + 8;
  const rightLimit = INVENTORY_BOX.x + INVENTORY_BOX.w - 8;
  const bottomLimit = INVENTORY_BOX.y + INVENTORY_BOX.h - 36;
  let x = anchorBox.x + anchorBox.w + INVENTORY_ACTION_MENU.gap;
  if (x + w > rightLimit) x = anchorBox.x - INVENTORY_ACTION_MENU.gap - w;
  x = Math.max(leftLimit, Math.min(x, rightLimit - w));
  const y = Math.max(INVENTORY_BOX.y + 28, Math.min(anchorBox.y, bottomLimit - h));
  return { x, y, w, h };
}

export function inventoryActionBox(action, anchorBox, menu = null) {
  const actions = inventoryActionMenuActions(menu);
  const index = actions.indexOf(action);
  if (index < 0) return null;
  const menuBox = inventoryActionMenuBox(anchorBox, menu);
  if (!menuBox) return null;
  return {
    x: menuBox.x + INVENTORY_ACTION_MENU.pad,
    y: menuBox.y + INVENTORY_ACTION_MENU.pad + index * INVENTORY_ACTION_MENU.rowH,
    w: menuBox.w - INVENTORY_ACTION_MENU.pad * 2,
    h: INVENTORY_ACTION_MENU.rowH - 2
  };
}

export function inventoryActionAt(point, menu = null, anchorBox = null) {
  if (!point) return null;
  if (pointInBox(point, INVENTORY_ACTION_BOXES.sort)) return 'sort';
  const actionMenu = typeof menu === 'object' && menu !== null
    ? menu
    : (menu ? { anchor: anchorBox } : null);
  if (!actionMenu?.anchor) return null;
  for (const id of inventoryActionMenuActions(actionMenu)) {
    if (pointInBox(point, inventoryActionBox(id, actionMenu.anchor, actionMenu))) return id;
  }
  return null;
}

export function inventorySplitActionAt(point) {
  if (!point) return null;
  if (!pointInBox(point, INVENTORY_SPLIT_BOX.box)) return null;
  for (const [id, box] of Object.entries(INVENTORY_SPLIT_BOX)) {
    if (id === 'box') continue;
    if (pointInBox(point, box)) return id;
  }
  return 'body';
}

export function inventorySplitAmountAt(point, maxAmount) {
  if (!point || !pointInBox(point, INVENTORY_SPLIT_BOX.slider)) return null;
  const max = Math.max(1, Math.floor(Number(maxAmount) || 1));
  const ratio = Math.max(0, Math.min(1, (point.x - INVENTORY_SPLIT_BOX.slider.x) / INVENTORY_SPLIT_BOX.slider.w));
  return Math.max(1, Math.min(max, Math.round(1 + ratio * (max - 1))));
}

export function inventoryRepairDonorBox(index) {
  if (!Number.isInteger(index) || index < 0 || index >= 4) return null;
  return {
    x: INVENTORY_REPAIR_BOX.list.x,
    y: INVENTORY_REPAIR_BOX.list.y + index * INVENTORY_REPAIR_BOX.rowH,
    w: INVENTORY_REPAIR_BOX.list.w,
    h: INVENTORY_REPAIR_BOX.rowH - 2
  };
}

export function inventoryRepairActionAt(point, donorCount = 0) {
  if (!point || !pointInBox(point, INVENTORY_REPAIR_BOX.box)) return null;
  if (pointInBox(point, INVENTORY_REPAIR_BOX.confirm)) return 'confirm';
  if (pointInBox(point, INVENTORY_REPAIR_BOX.cancel)) return 'cancel';
  const maxRows = Math.min(4, Math.max(0, donorCount));
  for (let index = 0; index < maxRows; index += 1) {
    if (pointInBox(point, inventoryRepairDonorBox(index))) return `donor:${index}`;
  }
  return 'body';
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
