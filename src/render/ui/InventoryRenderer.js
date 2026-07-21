import { PALETTE } from '../palette.js';
import { getFrame } from '../SpriteAtlas.js';
import { itemRarityColor, itemRarityLabel } from './ItemRarityStyle.js';
import { drawWeaponDetailRows } from './WeaponDetailRenderer.js';
import {
  INVENTORY_ACTION_BOXES,
  INVENTORY_BOX,
  INVENTORY_PANELS,
  INVENTORY_REPAIR_BOX,
  INVENTORY_SPLIT_BOX,
  inventoryActionBox,
  inventoryActionMenuActions,
  inventoryActionMenuBox,
  inventoryCapacity,
  inventoryGearBox,
  inventoryRepairDonorBox,
  inventorySlotBox
} from '../../ui/inventoryLayout.js';

const LONG_GUN_ICON_MODELS = new Set([
  'smg', 'carbine', 'rifle', 'shotgun', 'support-gun', 'precision-rifle',
  'accelerator-rifle', 'rail-rifle'
]);
const MELEE_ICON_MODELS = new Set(['knife', 'sword', 'axe', 'blunt', 'pike', 'tool-weapon']);

export function drawInventory(ctx, ui, tools) {
  tools.screenBackdrop(ctx);
  tools.window(ctx, INVENTORY_BOX, 'FIELD PACK');
  const carry = `CARRY ${tools.formatWeight(ui.carryWeight ?? 0)}/${tools.formatWeight(ui.maxCarryWeight ?? 0)} KG`;
  tools.text(ctx, carry, INVENTORY_BOX.x + INVENTORY_BOX.w - tools.textWidth(carry) - 14, INVENTORY_BOX.y + 6, PALETTE.uiDim);

  const itemsBox = INVENTORY_PANELS.items;
  const figure = INVENTORY_PANELS.figure;
  const gear = INVENTORY_PANELS.gear;
  const detail = INVENTORY_PANELS.detail;
  tools.inset(ctx, itemsBox);
  tools.inset(ctx, figure);
  tools.inset(ctx, gear);
  tools.inset(ctx, detail);

  const items = ui.inventoryItems ?? [];
  const selectedIndex = Math.max(0, Math.min(items.length - 1, ui.inventoryIndex ?? 0));
  const focusItems = ui.inventoryFocus !== 'gear';
  const movingIndex = Number.isInteger(ui.inventoryMoveIndex) ? ui.inventoryMoveIndex : null;
  tools.text(ctx, 'ITEMS', itemsBox.x + 8, itemsBox.y + 8, focusItems ? PALETTE.uiText : PALETTE.uiBorderLight);
  const ducats = `DUCATS ${ui.ducats ?? 0}`;
  tools.text(ctx, ducats, itemsBox.x + itemsBox.w - tools.textWidth(ducats) - 8, itemsBox.y + 8, PALETTE.uiWarn);
  tools.text(ctx, movingIndex !== null ? 'PLACE ITEM' : 'CLICK SAME SLOT TO MOVE', itemsBox.x + 8, itemsBox.y + 20, movingIndex !== null ? PALETTE.uiWarn : PALETTE.uiDim);

  for (let i = 0; i < inventoryCapacity(); i += 1) {
    drawInventorySlot(ctx, inventorySlotBox(i), items[i] ?? null, {
      selected: focusItems && i === selectedIndex,
      moving: movingIndex === i
    }, tools);
  }
  if (items.length === 0) {
    tools.text(ctx, 'PACK EMPTY', itemsBox.x + 8, itemsBox.y + itemsBox.h - 14, PALETTE.uiDim);
  }
  if (items.length > inventoryCapacity()) {
    const more = `+${items.length - inventoryCapacity()} MORE`;
    tools.text(ctx, more, itemsBox.x + itemsBox.w - tools.textWidth(more) - 8, itemsBox.y + itemsBox.h - 14, PALETTE.uiWarn);
  }

  drawPaperDoll(ctx, figure, ui.figureSpriteId ?? 'player', ui.actorName ?? 'AGENT', tools);

  const slots = ui.equipmentSlots ?? [];
  const slotIndex = Math.max(0, Math.min(slots.length - 1, ui.equipmentIndex ?? 0));
  const focusGear = ui.inventoryFocus === 'gear';
  tools.text(ctx, 'GEAR', gear.x + 8, gear.y + 8, focusGear ? PALETTE.uiText : PALETTE.uiBorderLight);
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    const selected = focusGear && i === slotIndex;
    const slotBox = inventoryGearBox(i);
    if (selected) tools.rect(ctx, slotBox.x, slotBox.y, slotBox.w, slotBox.h, PALETTE.uiDark);
    const color = selected ? PALETTE.uiText : PALETTE.uiDim;
    const itemColor = slot.empty ? PALETTE.uiBorderDark : itemRarityColor(slot);
    tools.text(ctx, `${selected ? '>' : ' '} ${tools.clip(slot.label, 8)}`, slotBox.x + 3, slotBox.y + 2, color);
    tools.text(ctx, tools.clip(slot.name, 16), slotBox.x + 12, slotBox.y + 9, itemColor);
  }

  const slotSelection = slots[slotIndex] ?? null;
  const detailItem = focusGear
    ? (slotSelection && !slotSelection.empty ? slotSelection : null)
    : items[selectedIndex] ?? null;
  drawInventoryDetail(ctx, detail, detailItem, focusGear ? slotSelection : null, tools);

  const footer = '1/2 READY SLOT  R RELOAD  RIGHT CLICK ACTIONS  SHIFT SORT  ESC CLOSE';
  tools.text(ctx, footer, INVENTORY_BOX.x + 14, INVENTORY_BOX.y + INVENTORY_BOX.h - 22, PALETTE.uiText);
  drawInventoryActionButton(ctx, INVENTORY_ACTION_BOXES.sort, 'SORT', {}, tools);
  if (ui.inventoryActionMenu) drawInventoryActionMenu(ctx, ui.inventoryActionMenu, tools);
  if (ui.inventorySplit) drawInventorySplit(ctx, ui.inventorySplit, tools);
  if (ui.inventoryRepair) drawInventoryRepair(ctx, ui.inventoryRepair, tools);
}

export function drawInventorySlot(ctx, box, item, state = {}, tools) {
  if (!box) return;
  tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.outline);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, PALETTE.uiPanel);
  tools.rect(ctx, box.x + 2, box.y + 2, box.w - 4, 1, PALETTE.uiBorderDark);
  tools.rect(ctx, box.x + 2, box.y + box.h - 3, box.w - 4, 1, PALETTE.uiDark);
  tools.detailRect(ctx, box.x + 1.5, box.y + 1.5, box.w - 3, 0.5, PALETTE.uiBorderLight);
  tools.detailRect(ctx, box.x + 1.5, box.y + 1.5, 0.5, box.h - 3, PALETTE.uiBorderLight);
  tools.detailRect(ctx, box.x + 1.5, box.y + box.h - 2.5, box.w - 3, 0.5, PALETTE.uiDark);
  if (state.selected) {
    tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, 1, PALETTE.uiText);
    tools.rect(ctx, box.x + 1, box.y + 1, 1, box.h - 2, PALETTE.uiText);
    tools.rect(ctx, box.x + box.w - 2, box.y + 1, 1, box.h - 2, PALETTE.uiBorderLight);
    tools.rect(ctx, box.x + 1, box.y + box.h - 2, box.w - 2, 1, PALETTE.uiBorderLight);
  }
  if (state.moving) {
    tools.rect(ctx, box.x + 4, box.y + 4, box.w - 8, 1, PALETTE.uiWarn);
    tools.rect(ctx, box.x + 4, box.y + box.h - 5, box.w - 8, 1, PALETTE.uiWarn);
  }
  if (!item) return;

  const rarityColor = itemRarityColor(item);
  tools.rect(ctx, box.x + 2, box.y + box.h - 4, box.w - 4, 1, rarityColor);
  tools.rect(ctx, box.x + 2, box.y + 2, 1, box.h - 5, rarityColor);
  drawItemIcon(ctx, item, box, tools);
  if (item.equippedCount > 0) tools.text(ctx, '*', box.x + 4, box.y + 4, PALETTE.uiWarn);
  if (item.count > 1) {
    const label = item.count > 99 ? '99+' : String(item.count);
    const tx = box.x + box.w - tools.textWidth(label) - 3;
    const ty = box.y + box.h - 10;
    tools.rect(ctx, tx - 1, ty - 1, tools.textWidth(label) + 2, 9, PALETTE.outline);
    tools.text(ctx, label, tx, ty, PALETTE.uiText);
  }
}

function drawItemIcon(ctx, item, box, tools) {
  const model = item.groundModel ?? item.type ?? 'item';
  const cx = box.x + Math.floor(box.w / 2);
  const cy = box.y + Math.floor(box.h / 2);

  if (model === 'dressing') {
    tools.rect(ctx, cx - 10, cy - 8, 20, 16, PALETTE.outline);
    tools.rect(ctx, cx - 9, cy - 7, 18, 14, PALETTE.uiBorderLight);
    tools.rect(ctx, cx - 8, cy - 6, 16, 12, PALETTE.clothTan);
    tools.rect(ctx, cx - 7, cy - 5, 14, 2, PALETTE.hostBone);
    tools.rect(ctx, cx - 2, cy - 6, 4, 12, PALETTE.uiText);
    tools.rect(ctx, cx - 8, cy - 1, 16, 4, PALETTE.uiText);
    tools.rect(ctx, cx - 5, cy - 6, 1, 12, PALETTE.uiBorderDark);
    tools.rect(ctx, cx + 5, cy - 6, 1, 12, PALETTE.uiBorderDark);
  } else if (model === 'food') {
    tools.rect(ctx, cx - 8, cy - 10, 16, 20, PALETTE.outline);
    tools.rect(ctx, cx - 7, cy - 9, 14, 3, PALETTE.hostBone);
    tools.rect(ctx, cx - 7, cy - 6, 14, 14, PALETTE.stoneLight);
    tools.rect(ctx, cx - 6, cy + 8, 12, 2, PALETTE.stoneDark);
    tools.rect(ctx, cx - 7, cy - 2, 14, 7, PALETTE.clothTan);
    tools.rect(ctx, cx - 4, cy, 8, 1, PALETTE.rustDark);
    tools.rect(ctx, cx + 5, cy - 5, 1, 12, PALETTE.stoneDark);
    tools.rect(ctx, cx - 5, cy - 7, 4, 1, PALETTE.uiText);
  } else if (model === 'rounds') {
    for (let i = 0; i < 4; i += 1) {
      const x = cx - 10 + i * 6;
      tools.rect(ctx, x, cy - 8, 4, 13, PALETTE.uiBorderDark);
      tools.rect(ctx, x + 1, cy - 9, 2, 2, PALETTE.uiWarn);
      tools.rect(ctx, x + 1, cy - 6, 2, 9, PALETTE.uiBorderLight);
    }
  } else if (model === 'sidearm') {
    tools.rect(ctx, cx - 12, cy - 7, 23, 7, PALETTE.outline);
    tools.rect(ctx, cx - 10, cy - 6, 19, 4, PALETTE.uiBorderLight);
    tools.rect(ctx, cx + 6, cy - 4, 7, 3, PALETTE.outline);
    tools.rect(ctx, cx + 7, cy - 3, 5, 1, PALETTE.uiBorderLight);
    tools.rect(ctx, cx - 5, cy - 2, 8, 12, PALETTE.outline);
    tools.rect(ctx, cx - 3, cy - 1, 5, 9, PALETTE.rustDark);
    tools.rect(ctx, cx - 7, cy, 7, 4, PALETTE.outline);
    tools.rect(ctx, cx - 6, cy + 1, 4, 2, PALETTE.uiDark);
    tools.rect(ctx, cx - 8, cy - 8, 8, 1, PALETTE.hostBone);
  } else if (model === 'accelerator-sidearm') {
    tools.rect(ctx, cx - 13, cy - 8, 25, 8, PALETTE.outline);
    tools.rect(ctx, cx - 11, cy - 7, 20, 5, PALETTE.stoneLight);
    for (let x = cx - 8; x <= cx + 4; x += 4) tools.rect(ctx, x, cy - 7, 2, 4, PALETTE.uiWarn);
    tools.rect(ctx, cx - 5, cy - 2, 8, 12, PALETTE.outline);
    tools.rect(ctx, cx - 3, cy - 1, 5, 9, PALETTE.rustDark);
    tools.rect(ctx, cx + 8, cy - 5, 6, 3, PALETTE.outline);
  } else if (LONG_GUN_ICON_MODELS.has(model)) {
    drawLongGunIcon(ctx, model, cx, cy, tools);
  } else if (MELEE_ICON_MODELS.has(model)) {
    drawMeleeIcon(ctx, model, cx, cy, tools);
  } else if (model === 'key') {
    tools.rect(ctx, cx - 10, cy - 2, 17, 3, PALETTE.uiBorderLight);
    tools.rect(ctx, cx + 4, cy + 1, 3, 5, PALETTE.uiBorderLight);
    tools.rect(ctx, cx + 8, cy + 1, 3, 3, PALETTE.uiBorderLight);
    tools.rect(ctx, cx - 12, cy - 5, 7, 9, PALETTE.uiBorderDark);
    tools.rect(ctx, cx - 10, cy - 3, 3, 5, PALETTE.uiDark);
  } else if (model === 'paper') {
    tools.rect(ctx, cx - 8, cy - 10, 16, 19, PALETTE.uiText);
    tools.rect(ctx, cx - 6, cy - 8, 12, 15, PALETTE.clothTan);
    tools.rect(ctx, cx + 3, cy - 8, 3, 3, PALETTE.uiBorderDark);
    tools.rect(ctx, cx - 4, cy - 3, 8, 1, PALETTE.uiBorderDark);
    tools.rect(ctx, cx - 4, cy + 1, 7, 1, PALETTE.uiBorderDark);
  } else if (model === 'vial') {
    tools.rect(ctx, cx - 4, cy - 10, 8, 3, PALETTE.uiBorderLight);
    tools.rect(ctx, cx - 6, cy - 7, 12, 17, PALETTE.outline);
    tools.rect(ctx, cx - 5, cy - 6, 10, 15, PALETTE.clothBlueDark);
    tools.rect(ctx, cx - 4, cy + 1, 8, 7, PALETTE.clothBlue);
    tools.rect(ctx, cx - 3, cy - 4, 2, 5, PALETTE.uiText);
  } else if (model === 'shard') {
    tools.rect(ctx, cx - 3, cy - 12, 6, 4, PALETTE.uiBorderLight);
    tools.rect(ctx, cx - 6, cy - 8, 11, 6, PALETTE.stoneDust);
    tools.rect(ctx, cx - 9, cy - 2, 13, 7, PALETTE.hostGold);
    tools.rect(ctx, cx - 11, cy + 5, 9, 5, PALETTE.stoneMid);
  } else if (model === 'ball') {
    tools.rect(ctx, cx - 6, cy - 8, 12, 2, PALETTE.clothBlueDark);
    tools.rect(ctx, cx - 9, cy - 6, 18, 12, PALETTE.clothBlue);
    tools.rect(ctx, cx - 6, cy + 6, 12, 2, PALETTE.clothBlueDark);
    tools.rect(ctx, cx - 4, cy - 3, 4, 2, PALETTE.uiBorderLight);
  } else if (model === 'boots') {
    tools.rect(ctx, cx - 10, cy - 6, 7, 15, PALETTE.woodDark);
    tools.rect(ctx, cx + 2, cy - 6, 7, 15, PALETTE.woodDark);
    tools.rect(ctx, cx - 12, cy + 7, 12, 4, PALETTE.outline);
    tools.rect(ctx, cx, cy + 7, 12, 4, PALETTE.outline);
  } else if (model === 'coat') {
    tools.rect(ctx, cx - 8, cy - 10, 16, 20, PALETTE.clothDark);
    tools.rect(ctx, cx - 6, cy - 8, 12, 18, PALETTE.woodDark);
    tools.rect(ctx, cx - 1, cy - 7, 2, 17, PALETTE.outline);
    tools.rect(ctx, cx - 9, cy - 2, 4, 10, PALETTE.clothDark);
    tools.rect(ctx, cx + 5, cy - 2, 4, 10, PALETTE.clothDark);
  } else if (model === 'hood') {
    tools.rect(ctx, cx - 8, cy - 6, 16, 13, PALETTE.clothDark);
    tools.rect(ctx, cx - 6, cy - 10, 12, 7, PALETTE.woodDark);
    tools.rect(ctx, cx - 4, cy - 4, 8, 6, PALETTE.outline);
  } else if (model === 'vest') {
    tools.rect(ctx, cx - 8, cy - 9, 16, 18, PALETTE.woodDark);
    tools.rect(ctx, cx - 6, cy - 7, 5, 14, PALETTE.rustDark);
    tools.rect(ctx, cx + 1, cy - 7, 5, 14, PALETTE.rustDark);
    tools.rect(ctx, cx - 1, cy - 8, 2, 16, PALETTE.outline);
  } else if (model === 'ribguard') {
    tools.rect(ctx, cx - 9, cy - 10, 18, 20, PALETTE.outline);
    tools.rect(ctx, cx - 7, cy - 8, 14, 16, PALETTE.rustDark);
    tools.rect(ctx, cx - 6, cy - 9, 5, 18, PALETTE.hostBone);
    tools.rect(ctx, cx + 1, cy - 9, 5, 18, PALETTE.hostBone);
    tools.rect(ctx, cx - 5, cy - 5, 3, 1, PALETTE.stoneMid);
    tools.rect(ctx, cx + 2, cy - 5, 3, 1, PALETTE.stoneMid);
    tools.rect(ctx, cx - 6, cy, 4, 1, PALETTE.stoneMid);
    tools.rect(ctx, cx + 1, cy, 4, 1, PALETTE.stoneMid);
    tools.rect(ctx, cx - 1, cy - 9, 2, 18, PALETTE.outline);
    tools.rect(ctx, cx - 8, cy - 2, 3, 4, PALETTE.woodDark);
    tools.rect(ctx, cx + 5, cy + 1, 3, 4, PALETTE.woodDark);
  } else if (model === 'ring') {
    tools.rect(ctx, cx - 6, cy - 8, 12, 4, PALETTE.uiBorderDark);
    tools.rect(ctx, cx - 9, cy - 4, 18, 8, PALETTE.uiBorderLight);
    tools.rect(ctx, cx - 6, cy + 4, 12, 4, PALETTE.uiBorderDark);
    tools.rect(ctx, cx - 4, cy - 2, 8, 4, PALETTE.uiDark);
  } else if (model === 'necklace') {
    tools.rect(ctx, cx - 8, cy - 8, 3, 3, PALETTE.uiBorderLight);
    tools.rect(ctx, cx + 5, cy - 8, 3, 3, PALETTE.uiBorderLight);
    tools.rect(ctx, cx - 6, cy - 5, 2, 7, PALETTE.uiBorderLight);
    tools.rect(ctx, cx + 4, cy - 5, 2, 7, PALETTE.uiBorderLight);
    tools.rect(ctx, cx - 3, cy + 4, 6, 8, PALETTE.uiWarn);
    tools.rect(ctx, cx - 1, cy + 6, 2, 4, PALETTE.uiBorderDark);
  } else {
    tools.rect(ctx, cx - 7, cy - 7, 14, 14, PALETTE.uiBorderDark);
    tools.rect(ctx, cx - 5, cy - 9, 10, 18, PALETTE.uiBorderLight);
    tools.rect(ctx, cx - 4, cy - 4, 8, 8, PALETTE.uiWarn);
    tools.rect(ctx, cx - 2, cy - 2, 4, 4, PALETTE.uiDark);
  }
  drawItemIconNativeDetail(ctx, model, cx, cy, tools);
}

function drawItemIconNativeDetail(ctx, model, cx, cy, tools) {
  if (model === 'dressing') {
    tools.detailLine(ctx, cx - 7.5, cy - 4.5, cx + 6.5, cy - 4.5, PALETTE.uiText);
    tools.detailLine(ctx, cx - 1.5, cy - 5.5, cx - 1.5, cy + 5.5, PALETTE.uiBorderLight);
  } else if (model === 'food') {
    tools.detailRect(ctx, cx - 5.5, cy - 7.5, 8, 0.5, PALETTE.uiText);
    tools.detailLine(ctx, cx - 4.5, cy - 1.5, cx + 4.5, cy - 0.5, PALETTE.uiBorderDark);
  } else if (model === 'rounds') {
    for (let i = 0; i < 4; i += 1) {
      tools.detailRect(ctx, cx - 8.5 + i * 6, cy - 7.5, 0.5, 9, PALETTE.uiText);
    }
  } else if (model === 'sidearm') {
    tools.detailLine(ctx, cx - 9.5, cy - 5.5, cx + 7.5, cy - 5.5, PALETTE.uiText);
    tools.detailLine(ctx, cx - 2.5, cy + 0.5, cx + 0.5, cy + 7.5, PALETTE.uiBorderLight);
  } else if (model === 'accelerator-sidearm') {
    tools.detailLine(ctx, cx - 10.5, cy - 6.5, cx + 8.5, cy - 6.5, PALETTE.uiText);
    tools.detailLine(ctx, cx - 7.5, cy - 4.5, cx + 5.5, cy - 4.5, PALETTE.uiWarn);
  } else if (LONG_GUN_ICON_MODELS.has(model)) {
    tools.detailLine(ctx, cx - 12.5, cy + 4.5, cx + 12.5, cy - 7.5, PALETTE.uiText);
    tools.detailLine(ctx, cx - 7.5, cy + 1.5, cx + 8.5, cy - 5.5, model.includes('accelerator') || model === 'rail-rifle' ? PALETTE.uiWarn : PALETTE.uiBorderLight);
  } else if (MELEE_ICON_MODELS.has(model)) {
    tools.detailLine(ctx, cx - 10.5, cy + 7.5, cx + 10.5, cy - 8.5, model === 'knife' || model === 'sword' ? PALETTE.uiText : PALETTE.uiBorderLight);
  } else if (model === 'key') {
    tools.detailLine(ctx, cx - 8.5, cy - 1.5, cx + 8.5, cy - 1.5, PALETTE.uiText);
    tools.detailRect(ctx, cx - 9.5, cy - 2.5, 0.5, 3, PALETTE.uiBorderLight);
  } else if (model === 'paper') {
    tools.detailRect(ctx, cx - 3.5, cy - 5.5, 7, 0.5, PALETTE.uiPaperInkDim);
    tools.detailRect(ctx, cx - 3.5, cy - 1.5, 6, 0.5, PALETTE.uiPaperInkDim);
    tools.detailRect(ctx, cx - 3.5, cy + 2.5, 5, 0.5, PALETTE.uiPaperInkDim);
  } else if (model === 'vial') {
    tools.detailRect(ctx, cx - 3.5, cy - 4.5, 1, 5, PALETTE.uiText);
    tools.detailLine(ctx, cx - 3.5, cy + 1.5, cx + 3.5, cy + 1.5, PALETTE.uiBorderLight);
  } else if (model === 'shard') {
    tools.detailLine(ctx, cx - 1.5, cy - 9.5, cx + 0.5, cy + 6.5, PALETTE.uiText);
    tools.detailLine(ctx, cx - 7.5, cy + 0.5, cx + 2.5, cy - 3.5, PALETTE.uiBorderLight);
  } else if (model === 'ball') {
    tools.detailLine(ctx, cx - 7.5, cy - 3.5, cx + 7.5, cy + 3.5, PALETTE.uiBorderLight);
  } else if (model === 'boots') {
    tools.detailRect(ctx, cx - 8.5, cy - 4.5, 4, 0.5, PALETTE.uiBorderLight);
    tools.detailRect(ctx, cx + 3.5, cy - 4.5, 4, 0.5, PALETTE.uiBorderLight);
    for (const x of [cx - 9.5, cx - 6.5, cx + 2.5, cx + 5.5]) {
      tools.detailRect(ctx, x, cy + 8.5, 1.5, 0.5, PALETTE.uiBorderDark);
    }
  } else if (model === 'coat' || model === 'vest' || model === 'ribguard') {
    tools.detailLine(ctx, cx - 0.5, cy - 7.5, cx - 0.5, cy + 7.5, PALETTE.uiBorderLight);
    tools.detailLine(ctx, cx - 5.5, cy - 5.5, cx - 1.5, cy - 1.5, PALETTE.uiText);
    tools.detailLine(ctx, cx + 4.5, cy - 5.5, cx + 0.5, cy - 1.5, PALETTE.uiBorderDark);
  } else if (model === 'hood') {
    tools.detailLine(ctx, cx - 5.5, cy - 7.5, cx + 5.5, cy - 7.5, PALETTE.uiBorderLight);
    tools.detailLine(ctx, cx - 3.5, cy - 2.5, cx + 3.5, cy - 2.5, PALETTE.uiBorderDark);
  } else if (model === 'ring') {
    tools.detailLine(ctx, cx - 5.5, cy - 4.5, cx + 5.5, cy - 4.5, PALETTE.uiText);
    tools.detailRect(ctx, cx + 5.5, cy - 1.5, 0.5, 3, PALETTE.uiBorderDark);
  } else if (model === 'necklace') {
    tools.detailLine(ctx, cx - 6.5, cy - 6.5, cx - 1.5, cy + 4.5, PALETTE.uiText);
    tools.detailLine(ctx, cx + 6.5, cy - 6.5, cx + 1.5, cy + 4.5, PALETTE.uiBorderLight);
  } else {
    tools.detailLine(ctx, cx - 4.5, cy - 4.5, cx + 3.5, cy + 3.5, PALETTE.uiText);
  }
}

function drawLongGunIcon(ctx, model, cx, cy, tools) {
  const compact = model === 'smg' || model === 'carbine';
  const rear = cx - (compact ? 11 : 14);
  const front = cx + (compact ? 12 : 14);
  const accelerator = model === 'accelerator-rifle' || model === 'rail-rifle';
  iconLine(ctx, rear, cy + 5, front, cy - 7, PALETTE.outline, model === 'support-gun' ? 6 : 5, tools);
  iconLine(ctx, rear + 1, cy + 4, front - 1, cy - 7, accelerator ? PALETTE.uiBorderDark : PALETTE.uiBorderLight, 3, tools);
  iconLine(ctx, cx - 3, cy, front + 3, cy - 8, PALETTE.outline, 2, tools);
  iconLine(ctx, cx - 2, cy - 1, front + 3, cy - 9, PALETTE.uiText, 1, tools);
  tools.rect(ctx, rear - 3, cy + 2, 8, 7, PALETTE.outline);
  tools.rect(ctx, rear - 2, cy + 3, 6, 4, PALETTE.woodDark);
  if (model === 'shotgun') {
    iconLine(ctx, cx, cy - 2, front + 3, cy - 10, PALETTE.rustLight, 1, tools);
  } else if (model === 'support-gun') {
    tools.rect(ctx, cx - 1, cy + 1, 8, 8, PALETTE.outline);
    tools.rect(ctx, cx + 1, cy + 2, 5, 5, PALETTE.rustDark);
  } else {
    tools.rect(ctx, cx, cy + 1, 5, 7, PALETTE.outline);
    tools.rect(ctx, cx + 1, cy + 1, 3, 5, PALETTE.rustDark);
  }
  if (model === 'precision-rifle') {
    tools.rect(ctx, cx - 2, cy - 8, 11, 3, PALETTE.outline);
    tools.rect(ctx, cx, cy - 7, 7, 1, PALETTE.uiText);
  }
  if (accelerator) {
    for (let x = cx - 6; x <= cx + 5; x += 4) tools.rect(ctx, x, cy - 4, 2, 3, PALETTE.uiWarn);
  }
}

function drawMeleeIcon(ctx, model, cx, cy, tools) {
  if (model === 'pike') {
    iconLine(ctx, cx - 13, cy + 10, cx + 11, cy - 10, PALETTE.outline, 4, tools);
    iconLine(ctx, cx - 12, cy + 9, cx + 10, cy - 10, PALETTE.woodDark, 2, tools);
    iconLine(ctx, cx + 8, cy - 9, cx + 14, cy - 13, PALETTE.uiText, 3, tools);
    return;
  }
  const short = model === 'knife';
  const sx = cx - (short ? 7 : 11);
  const sy = cy + (short ? 6 : 10);
  const ex = cx + (short ? 9 : 11);
  const ey = cy - (short ? 7 : 10);
  const edge = model === 'knife' || model === 'sword';
  iconLine(ctx, sx, sy, ex, ey, PALETTE.outline, edge ? 5 : 4, tools);
  iconLine(ctx, sx + 1, sy - 1, ex - 1, ey + 1, edge ? PALETTE.uiBorderLight : PALETTE.woodDark, 2, tools);
  if (edge) {
    iconLine(ctx, sx - 3, sy - 2, sx + 3, sy + 3, PALETTE.rustDark, 2, tools);
  } else if (model === 'axe') {
    tools.rect(ctx, ex - 3, ey - 4, 9, 7, PALETTE.outline);
    tools.rect(ctx, ex - 1, ey - 3, 5, 4, PALETTE.uiBorderLight);
  } else if (model === 'blunt') {
    tools.rect(ctx, ex - 4, ey - 4, 9, 8, PALETTE.outline);
    tools.rect(ctx, ex - 2, ey - 3, 5, 5, PALETTE.uiBorderDark);
  } else {
    iconLine(ctx, ex - 5, ey - 2, ex + 5, ey + 1, PALETTE.uiBorderLight, 3, tools);
  }
}

function iconLine(ctx, x0, y0, x1, y1, color, width, tools) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(1, Math.abs(dx), Math.abs(dy));
  const size = Math.max(1, Math.round(width));
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const x = Math.round(x0 + dx * t) - Math.floor(size / 2);
    const y = Math.round(y0 + dy * t) - Math.floor(size / 2);
    tools.rect(ctx, x, y, size, size, color);
  }
}

export function drawInventoryActionButton(ctx, box, label, options = {}, tools) {
  const disabled = Boolean(options.disabled);
  tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.outline);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, disabled ? PALETTE.uiDark : PALETTE.uiPanel);
  tools.rect(ctx, box.x + 2, box.y + 2, box.w - 4, 1, disabled ? PALETTE.uiBorderDark : PALETTE.uiBorderLight);
  tools.rect(ctx, box.x + 2, box.y + box.h - 3, box.w - 4, 1, PALETTE.uiBorderDark);
  tools.detailRect(ctx, box.x + 1.5, box.y + 1.5, box.w - 3, 0.5, disabled ? PALETTE.uiBorderDark : PALETTE.uiText);
  tools.detailRect(ctx, box.x + 1.5, box.y + box.h - 2.5, box.w - 3, 0.5, PALETTE.uiBorderDark);
  const text = tools.clip(label, Math.max(1, Math.floor((box.w - 8) / 6)));
  tools.text(ctx, text, box.x + Math.floor((box.w - tools.textWidth(text)) / 2), box.y + 4, disabled ? PALETTE.uiDim : PALETTE.uiText);
}

function drawInventoryActionMenu(ctx, actionMenu, tools) {
  const menu = inventoryActionMenuBox(actionMenu.anchor, actionMenu);
  if (!menu) return;
  tools.rect(ctx, menu.x - 1, menu.y - 1, menu.w + 2, menu.h + 2, PALETTE.outline);
  tools.rect(ctx, menu.x, menu.y, menu.w, menu.h, PALETTE.uiDark);
  tools.rect(ctx, menu.x + 1, menu.y + 1, menu.w - 2, 1, PALETTE.uiBorderDark);
  tools.rect(ctx, menu.x + 1, menu.y + menu.h - 2, menu.w - 2, 1, PALETTE.uiBorderDark);
  tools.detailRect(ctx, menu.x + 0.5, menu.y + 0.5, menu.w - 1, 0.5, PALETTE.uiBorderLight);

  for (const action of inventoryActionMenuActions(actionMenu)) {
    const box = inventoryActionBox(action, actionMenu.anchor, actionMenu);
    const label = action === 'equip'
      ? (actionMenu.canUnequip ? 'UNEQUIP' : 'EQUIP')
      : action.toUpperCase();
    tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiPanel);
    tools.rect(ctx, box.x, box.y, box.w, 1, PALETTE.uiBorderDark);
    tools.detailRect(ctx, box.x + 0.5, box.y + 0.5, box.w - 1, 0.5, PALETTE.uiBorderLight);
    tools.text(ctx, label, box.x + 6, box.y + 4, PALETTE.uiText);
  }
}

function drawInventorySplit(ctx, split, tools) {
  const modal = INVENTORY_SPLIT_BOX.box;
  tools.rect(ctx, modal.x - 4, modal.y - 4, modal.w + 8, modal.h + 8, 'rgba(5, 5, 5, 0.62)');
  tools.window(ctx, modal, 'SPLIT STACK');
  const item = split.item ?? {};
  tools.text(ctx, tools.clip(item.name ?? 'ITEM', 30), modal.x + 12, modal.y + 27, PALETTE.uiBorderLight);
  const count = `DROP ${split.amount ?? 1} OF ${split.max ?? 1}`;
  tools.text(ctx, count, modal.x + 12, modal.y + 42, PALETTE.uiText);

  const slider = INVENTORY_SPLIT_BOX.slider;
  const max = Math.max(1, split.max ?? 1);
  const amount = Math.max(1, Math.min(max, split.amount ?? 1));
  const ratio = max <= 1 ? 0 : (amount - 1) / (max - 1);
  const fill = Math.round(slider.w * ratio);
  tools.rect(ctx, slider.x, slider.y, slider.w, slider.h, PALETTE.outline);
  tools.rect(ctx, slider.x + 1, slider.y + 3, slider.w - 2, 4, PALETTE.uiDark);
  tools.rect(ctx, slider.x + 1, slider.y + 3, Math.max(1, fill - 2), 4, PALETTE.uiWarn);
  tools.detailRect(ctx, slider.x + 1.5, slider.y + 3.5, Math.max(0.5, fill - 3), 0.5, PALETTE.uiText);
  const knobX = slider.x + Math.round((slider.w - 5) * ratio);
  tools.rect(ctx, knobX, slider.y - 3, 5, slider.h + 6, PALETTE.uiBorderLight);
  tools.detailRect(ctx, knobX + 0.5, slider.y - 2.5, 0.5, slider.h + 5, PALETTE.uiText);

  drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.minus, '<', {}, tools);
  drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.plus, '>', {}, tools);
  drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.confirm, 'DROP', {}, tools);
  drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.cancel, 'BACK', {}, tools);
  tools.text(ctx, 'LEFT RIGHT COUNT  ENTER DROP  ESC BACK', modal.x + 15, modal.y + modal.h - 15, PALETTE.uiDim);
}

function drawInventoryRepair(ctx, repair, tools) {
  const modal = INVENTORY_REPAIR_BOX.box;
  tools.rect(ctx, modal.x - 4, modal.y - 4, modal.w + 8, modal.h + 8, 'rgba(5, 5, 5, 0.62)');
  tools.window(ctx, modal, 'REPAIR WEAPON');
  const target = repair.target ?? {};
  tools.text(ctx, tools.clip(target.name ?? 'WEAPON', 36), modal.x + 12, modal.y + 27, PALETTE.uiBorderLight);
  const condition = target.conditionMax
    ? `COND ${target.condition}/${target.conditionMax}`
    : 'COND UNKNOWN';
  tools.text(ctx, condition, modal.x + 12, modal.y + 40, PALETTE.uiText);
  tools.text(ctx, 'DONOR', modal.x + 12, modal.y + 55, PALETTE.uiDim);

  const donors = repair.donors ?? [];
  const selectedIndex = Math.max(0, Math.min(donors.length - 1, repair.index ?? 0));
  if (!donors.length) {
    tools.text(ctx, 'NO MATCHING WEAPON', INVENTORY_REPAIR_BOX.list.x, INVENTORY_REPAIR_BOX.list.y + 4, PALETTE.uiBad);
  }
  for (let i = 0; i < Math.min(4, donors.length); i += 1) {
    const donor = donors[i];
    const box = inventoryRepairDonorBox(i);
    if (!box) continue;
    const selected = i === selectedIndex;
    tools.rect(ctx, box.x, box.y, box.w, box.h, selected ? PALETTE.uiDark : PALETTE.uiPanel);
    tools.rect(ctx, box.x, box.y, box.w, 1, selected ? PALETTE.uiBorderLight : PALETTE.uiBorderDark);
    tools.detailRect(ctx, box.x + 0.5, box.y + 0.5, box.w - 1, 0.5, selected ? PALETTE.uiText : PALETTE.uiBorderDark);
    const exact = donor.exactMatch ? ' SAME' : '';
    const line = `${selected ? '>' : ' '} ${donor.name} ${donor.condition}/${donor.conditionMax}${exact}`;
    tools.text(ctx, tools.clip(line, 40), box.x + 5, box.y + 4, donor.exactMatch ? PALETTE.uiGood : PALETTE.uiText);
  }

  drawInventoryActionButton(ctx, INVENTORY_REPAIR_BOX.confirm, 'REPAIR', { disabled: !donors.length }, tools);
  drawInventoryActionButton(ctx, INVENTORY_REPAIR_BOX.cancel, 'BACK', {}, tools);
  tools.text(ctx, 'UP DOWN DONOR  ENTER REPAIR  ESC BACK', modal.x + 19, modal.y + modal.h - 15, PALETTE.uiDim);
}

function drawInventoryDetail(ctx, box, item, slot, tools) {
  if (!item) {
    const label = slot ? `${slot.label}: Empty` : 'NO ITEM SELECTED';
    tools.text(ctx, label, box.x + 8, box.y + 8, PALETTE.uiBorderLight);
    return;
  }

  const title = slot ? `${slot.label}: ${item.name}` : item.name;
  const textCols = Math.max(20, Math.floor((box.w - 16) / 6));
  tools.text(ctx, tools.clip(title, textCols), box.x + 8, box.y + 8, itemRarityColor(item));
  const parts = [
    `GRADE ${itemRarityLabel(item)}`,
    `TYPE ${item.type || 'item'}`,
    `WT ${tools.formatWeight(item.weight ?? item.totalWeight ?? 0)} KG`
  ];
  if (item.equipmentSlot) parts.push(item.equipmentSlot === 'ring' ? 'GEAR RING' : `GEAR ${item.equipmentSlot}`);
  if (item.conditionMax) parts.push(`COND ${item.condition}/${item.conditionMax}`);
  if (item.buildLabel) parts.push(`BUILD ${item.buildLabel}`);
  if (Array.isArray(item.wornSlots) && item.wornSlots.length > 0) parts.push(`WORN ${item.wornSlots.join(', ')}`);
  tools.text(ctx, tools.clip(parts.join('  '), textCols), box.x + 8, box.y + 20, PALETTE.uiGood);

  const hasWeaponDetails = Array.isArray(item.attackModes) && item.attackModes.length > 0;
  let y = hasWeaponDetails
    ? drawWeaponDetailRows(ctx, item, {
        x: box.x + 8,
        y: box.y + 32,
        maxChars: textCols,
        maxRows: 3
      }, tools)
    : box.y + 34;
  const bottom = box.y + box.h - 2;
  for (const line of tools.wrap(item.description || 'NO DESCRIPTION.', textCols)) {
    if (y + 7 > bottom) break;
    tools.text(ctx, line, box.x + 8, y, PALETTE.uiDim);
    y += 9;
  }
}

function drawPaperDoll(ctx, box, spriteId, name, tools) {
  tools.text(ctx, name, box.x + Math.floor((box.w - tools.textWidth(name)) / 2), box.y + 8, PALETTE.uiBorderLight);

  const cx = box.x + Math.floor(box.w / 2);
  const baseY = box.y + box.h - 16;

  tools.rect(ctx, cx - 22, baseY + 2, 44, 1, PALETTE.outline);
  tools.rect(ctx, cx - 18, baseY + 3, 36, 1, PALETTE.uiDark);
  tools.rect(ctx, cx - 11, baseY + 4, 22, 1, PALETTE.uiDark);
  tools.detailRect(ctx, cx - 17.5, baseY + 3.5, 35, 0.5, PALETTE.uiBorderLight);

  const resolved = tools.atlas ? getFrame(tools.atlas, spriteId, 'idle', 's', 0) : null;
  if (resolved?.frame) {
    const scale = 2;
    const { sprite, frame } = resolved;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      frame,
      cx - sprite.anchorX * scale,
      baseY - sprite.anchorY * scale,
      sprite.width * scale,
      sprite.height * scale
    );
  } else {
    const label = 'NO FIGURE';
    tools.text(ctx, label, cx - tools.textWidth(label) / 2, box.y + Math.floor(box.h / 2), PALETTE.uiDim);
  }
}
