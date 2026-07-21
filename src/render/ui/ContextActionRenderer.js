import { PALETTE } from '../palette.js';
import { contextActionBox, contextActionMenuBox } from '../../ui/contextActionLayout.js';

export function drawContextActionMenu(ctx, menu, tools) {
  const box = contextActionMenuBox(menu);
  if (!box) return;
  tools.rect(ctx, box.x - 1, box.y - 1, box.w + 2, box.h + 2, PALETTE.outline);
  tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiDark);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, 1, PALETTE.uiBorderDark);
  tools.rect(ctx, box.x + 1, box.y + box.h - 2, box.w - 2, 1, PALETTE.uiBorderDark);
  tools.detailRect(ctx, box.x + 0.5, box.y + 0.5, box.w - 1, 0.5, PALETTE.uiBorderLight);

  const actions = menu.actions ?? [];
  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];
    const row = contextActionBox(menu, i);
    const enabled = action.enabled !== false;
    tools.rect(ctx, row.x, row.y, row.w, row.h, enabled ? PALETTE.uiPanel : PALETTE.uiDark);
    tools.rect(ctx, row.x, row.y, row.w, 1, enabled ? PALETTE.uiBorderDark : PALETTE.outline);
    tools.detailRect(ctx, row.x + 0.5, row.y + 0.5, row.w - 1, 0.5, enabled ? PALETTE.uiBorderLight : PALETTE.uiBorderDark);
    tools.text(ctx, tools.clip(action.label ?? action.id ?? 'ACTION', 24), row.x + 6, row.y + 3, enabled ? PALETTE.uiText : PALETTE.uiDim);
    if (enabled && action.hint) {
      tools.text(ctx, tools.clip(action.hint, 25), row.x + 6, row.y + 12, PALETTE.uiDim);
    } else if (!enabled && action.reason) {
      tools.text(ctx, tools.clip(action.reason, 25), row.x + 6, row.y + 12, PALETTE.uiBad);
    }
  }
}
