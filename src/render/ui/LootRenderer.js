import { PALETTE } from '../palette.js';
import { itemRarityColor, itemRarityLabel } from './ItemRarityStyle.js';

const LOOT_BOX = { x: 104, y: 54, w: 432, h: 270 };
const LOOT_LIST_BOX = { x: LOOT_BOX.x + 16, y: LOOT_BOX.y + 32, w: 222, h: 164 };
const LOOT_DETAIL_BOX = { x: LOOT_BOX.x + 252, y: LOOT_BOX.y + 32, w: 148, h: 164 };

export function drawLoot(ctx, ui, tools) {
  tools.screenBackdrop(ctx);
  const loot = ui.loot ?? { title: 'Loot', entries: [], index: 0 };
  tools.window(ctx, LOOT_BOX, `LOOT: ${loot.title ?? 'CACHE'}`);
  tools.inset(ctx, LOOT_LIST_BOX);
  tools.inset(ctx, LOOT_DETAIL_BOX);

  const entries = loot.entries ?? [];
  const selectedIndex = Math.max(0, Math.min(entries.length - 1, loot.index ?? 0));
  tools.text(ctx, 'MARKED', LOOT_LIST_BOX.x + 8, LOOT_LIST_BOX.y + 8, PALETTE.uiBorderLight);

  if (!entries.length) {
    tools.text(ctx, 'NOTHING USEFUL', LOOT_LIST_BOX.x + 8, LOOT_LIST_BOX.y + 28, PALETTE.uiDim);
  }
  let y = LOOT_LIST_BOX.y + 25;
  for (let i = 0; i < Math.min(entries.length, 6); i += 1) {
    const entry = entries[i];
    const selected = i === selectedIndex;
    if (selected) {
      tools.rect(ctx, LOOT_LIST_BOX.x + 5, y - 3, LOOT_LIST_BOX.w - 10, 24, PALETTE.uiDark);
      tools.detailRect(ctx, LOOT_LIST_BOX.x + 5.5, y - 2.5, LOOT_LIST_BOX.w - 11, 0.5, PALETTE.uiBorderLight);
      tools.detailRect(ctx, LOOT_LIST_BOX.x + 5.5, y - 2.5, 0.5, 23, PALETTE.uiText);
    }
    const iconBox = { x: LOOT_LIST_BOX.x + 8, y: y - 5, w: 24, h: 24 };
    tools.drawInventorySlot(ctx, iconBox, entry, { selected: false, moving: false });
    const color = selected ? PALETTE.uiText : PALETTE.uiDim;
    const nameColor = itemRarityColor(entry);
    tools.text(ctx, `${selected ? '>' : ' '} ${entry.count}X`, LOOT_LIST_BOX.x + 38, y, color);
    tools.text(ctx, tools.clip(entry.name, 24), LOOT_LIST_BOX.x + 38, y + 10, nameColor);
    y += 26;
  }

  const selected = entries[selectedIndex] ?? null;
  if (selected) {
    tools.text(ctx, tools.clip(selected.name, 20), LOOT_DETAIL_BOX.x + 8, LOOT_DETAIL_BOX.y + 8, itemRarityColor(selected));
    const wt = `WT ${tools.formatWeight(selected.totalWeight ?? selected.weight ?? 0)} KG`;
    tools.text(ctx, wt, LOOT_DETAIL_BOX.x + 8, LOOT_DETAIL_BOX.y + 21, PALETTE.uiGood);
    tools.text(ctx, `GRADE ${itemRarityLabel(selected)}`, LOOT_DETAIL_BOX.x + 8, LOOT_DETAIL_BOX.y + 30, itemRarityColor(selected));
    let dy = LOOT_DETAIL_BOX.y + 38;
    if (selected.buildLabel) {
      tools.text(ctx, tools.clip(`BUILD ${selected.buildLabel}`, 21), LOOT_DETAIL_BOX.x + 8, dy, PALETTE.uiGood);
      dy += 9;
    }
    for (const line of tools.wrap(selected.description || 'NO DESCRIPTION.', 21).slice(0, 9)) {
      tools.text(ctx, line, LOOT_DETAIL_BOX.x + 8, dy, PALETTE.uiDim);
      dy += 9;
    }
  }

  tools.text(ctx, 'UP DN MARK', LOOT_BOX.x + 20, LOOT_BOX.y + LOOT_BOX.h - 39, PALETTE.uiDim);
  tools.text(ctx, 'E PICK ITEM', LOOT_BOX.x + 142, LOOT_BOX.y + LOOT_BOX.h - 39, PALETTE.uiText);
  tools.text(ctx, 'A PICK ALL', LOOT_BOX.x + 264, LOOT_BOX.y + LOOT_BOX.h - 39, PALETTE.uiText);
  tools.text(ctx, 'SPACE LEAVE', LOOT_BOX.x + 144, LOOT_BOX.y + LOOT_BOX.h - 22, PALETTE.uiDim);
}
