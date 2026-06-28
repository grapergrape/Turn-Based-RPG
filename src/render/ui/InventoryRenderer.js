import { PALETTE } from '../palette.js';
import { getFrame } from '../SpriteAtlas.js';
import { itemRarityColor, itemRarityLabel } from './ItemRarityStyle.js';
import {
  INVENTORY_ACTION_BOXES,
  INVENTORY_BOX,
  INVENTORY_PANELS,
  INVENTORY_SPLIT_BOX,
  inventoryActionBox,
  inventoryActionMenuActions,
  inventoryActionMenuBox,
  inventoryCapacity,
  inventoryGearBox,
  inventorySlotBox
} from '../../ui/inventoryLayout.js';

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

  drawPaperDoll(ctx, figure, ui.figureSpriteId ?? 'mara-vey', ui.actorName ?? 'AGENT', tools);

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
    tools.text(ctx, `${selected ? '>' : ' '} ${tools.clip(slot.label, 8)}`, slotBox.x + 3, slotBox.y + 3, color);
    tools.text(ctx, tools.clip(slot.name, 16), slotBox.x + 12, slotBox.y + 12, itemColor);
  }

  const slotSelection = slots[slotIndex] ?? null;
  const detailItem = focusGear
    ? (slotSelection && !slotSelection.empty ? slotSelection : null)
    : items[selectedIndex] ?? null;
  drawInventoryDetail(ctx, detail, detailItem, focusGear ? slotSelection : null, tools);

  const footer = 'CLICK SELECT  RIGHT CLICK ACTIONS  SHIFT SORT  CTRL SPLIT  ESC CLOSE';
  tools.text(ctx, footer, INVENTORY_BOX.x + 14, INVENTORY_BOX.y + INVENTORY_BOX.h - 22, PALETTE.uiText);
  drawInventoryActionButton(ctx, INVENTORY_ACTION_BOXES.sort, 'SORT', {}, tools);
  if (ui.inventoryActionMenu) drawInventoryActionMenu(ctx, ui.inventoryActionMenu, tools);
  if (ui.inventorySplit) drawInventorySplit(ctx, ui.inventorySplit, tools);
}

export function drawInventorySlot(ctx, box, item, state = {}, tools) {
  if (!box) return;
  tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.outline);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, PALETTE.uiPanel);
  tools.rect(ctx, box.x + 2, box.y + 2, box.w - 4, 1, PALETTE.uiBorderDark);
  tools.rect(ctx, box.x + 2, box.y + box.h - 3, box.w - 4, 1, PALETTE.uiDark);
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
}

export function drawInventoryActionButton(ctx, box, label, options = {}, tools) {
  const disabled = Boolean(options.disabled);
  tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.outline);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, disabled ? PALETTE.uiDark : PALETTE.uiPanel);
  tools.rect(ctx, box.x + 2, box.y + 2, box.w - 4, 1, disabled ? PALETTE.uiBorderDark : PALETTE.uiBorderLight);
  tools.rect(ctx, box.x + 2, box.y + box.h - 3, box.w - 4, 1, PALETTE.uiBorderDark);
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

  for (const action of inventoryActionMenuActions(actionMenu)) {
    const box = inventoryActionBox(action, actionMenu.anchor, actionMenu);
    const label = action === 'equip'
      ? (actionMenu.canUnequip ? 'UNEQUIP' : 'EQUIP')
      : action.toUpperCase();
    tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiPanel);
    tools.rect(ctx, box.x, box.y, box.w, 1, PALETTE.uiBorderDark);
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
  const knobX = slider.x + Math.round((slider.w - 5) * ratio);
  tools.rect(ctx, knobX, slider.y - 3, 5, slider.h + 6, PALETTE.uiBorderLight);

  drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.minus, '<', {}, tools);
  drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.plus, '>', {}, tools);
  drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.confirm, 'DROP', {}, tools);
  drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.cancel, 'BACK', {}, tools);
  tools.text(ctx, 'LEFT RIGHT COUNT  ENTER DROP  ESC BACK', modal.x + 15, modal.y + modal.h - 15, PALETTE.uiDim);
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
  if (item.buildLabel) parts.push(`BUILD ${item.buildLabel}`);
  if (Array.isArray(item.wornSlots) && item.wornSlots.length > 0) parts.push(`WORN ${item.wornSlots.join(', ')}`);
  tools.text(ctx, tools.clip(parts.join('  '), textCols), box.x + 8, box.y + 20, PALETTE.uiGood);

  let y = box.y + 34;
  for (const line of tools.wrap(item.description || 'NO DESCRIPTION.', textCols).slice(0, 3)) {
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
