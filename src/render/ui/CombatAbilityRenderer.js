import { PALETTE } from '../palette.js';
import {
  combatAbilityAt,
  combatAbilityCardBox,
  combatAbilityNavBox,
  combatAbilityPage,
  combatAbilityPageCount,
  combatAbilityTrayBox,
  visibleCombatAbilities
} from '../../ui/combatAbilityLayout.js';

export function drawCombatAbilityTray(ctx, tray, tools, cursor = null) {
  const box = combatAbilityTrayBox(tray);
  if (!box) return;
  const hover = combatAbilityAt(cursor, tray);

  tools.rect(ctx, box.x - 1, box.y - 1, box.w + 2, box.h + 2, PALETTE.outline);
  tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiDark);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, 1, PALETTE.uiBorderLight);
  tools.rect(ctx, box.x + 1, box.y + box.h - 2, box.w - 2, 1, PALETTE.uiBorderDark);
  tools.rect(ctx, box.x + 1, box.y + 1, 1, box.h - 2, PALETTE.uiBorderLight);
  tools.rect(ctx, box.x + box.w - 2, box.y + 1, 1, box.h - 2, PALETTE.uiBorderDark);
  tools.detailRect(ctx, box.x + 1.5, box.y + 1.5, box.w - 3, 0.5, PALETTE.uiBorderLight);
  tools.detailRect(ctx, box.x + 1.5, box.y + box.h - 2.5, box.w - 3, 0.5, PALETTE.uiBorderDark);

  const page = combatAbilityPage(tray);
  const pageCount = combatAbilityPageCount(tray);
  const header = tray.prompt || (pageCount > 1 ? `ACTIVES ${page + 1}/${pageCount}` : 'ACTIVES');
  tools.text(ctx, tools.clip(header, Math.max(1, Math.floor((box.w - 12) / 6))), box.x + 6, box.y + 4,
    tray.prompt ? PALETTE.uiWarn : PALETTE.uiBorderLight);

  const entries = visibleCombatAbilities(tray);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const card = combatAbilityCardBox(tray, index);
    const selected = entry.id === tray.selectedAbilityId;
    const hovered = hover?.kind === 'ability' && hover.entry?.id === entry.id;
    drawAbilityCard(ctx, card, entry, { selected, hovered }, tools);
  }

  if (box.paging) {
    drawPageButton(ctx, combatAbilityNavBox(tray, -1), '<', hover?.kind === 'page' && hover.direction < 0, tools);
    drawPageButton(ctx, combatAbilityNavBox(tray, 1), '>', hover?.kind === 'page' && hover.direction > 0, tools);
  }
}

function drawAbilityCard(ctx, box, entry, { selected, hovered }, tools) {
  const enabled = entry.enabled !== false;
  const maxChars = Math.max(1, Math.floor((box.w - 10) / 6));
  const edge = selected
    ? PALETTE.uiWarn
    : hovered
      ? PALETTE.uiText
      : enabled
        ? PALETTE.uiGood
        : PALETTE.uiBorderDark;
  const fill = selected || hovered ? PALETTE.uiPanel : PALETTE.uiDark;

  tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.outline);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, fill);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, 1, edge);
  tools.rect(ctx, box.x + 1, box.y + 1, 1, box.h - 2, edge);
  tools.rect(ctx, box.x + 1, box.y + box.h - 2, box.w - 2, 1, PALETTE.uiBorderDark);
  tools.rect(ctx, box.x + box.w - 2, box.y + 1, 1, box.h - 2, PALETTE.uiBorderDark);
  tools.detailRect(ctx, box.x + 1.5, box.y + 1.5, box.w - 3, 0.5, edge);
  tools.text(ctx, tools.clip(entry.name ?? 'ABILITY', maxChars), box.x + 5, box.y + 4,
    enabled ? PALETTE.uiText : PALETTE.uiDim);
  tools.text(ctx, tools.clip(entry.detail ?? entry.reason ?? '', maxChars), box.x + 5, box.y + 15,
    enabled ? (selected ? PALETTE.uiWarn : PALETTE.uiGood) : PALETTE.uiBad);
}

function drawPageButton(ctx, box, label, hovered, tools) {
  const edge = hovered ? PALETTE.uiText : PALETTE.uiBorderLight;
  tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.outline);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, PALETTE.uiDark);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, 1, edge);
  tools.rect(ctx, box.x + 1, box.y + box.h - 2, box.w - 2, 1, PALETTE.uiBorderDark);
  tools.detailRect(ctx, box.x + 1.5, box.y + 1.5, box.w - 3, 0.5, edge);
  tools.text(ctx, label, box.x + 6, box.y + 10, edge);
}
