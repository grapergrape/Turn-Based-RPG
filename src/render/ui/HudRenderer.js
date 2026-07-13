import { PALETTE } from '../palette.js';
import { UI_PANEL } from '../renderConfig.js';

const LOG_BOX = { x: 8, y: UI_PANEL.y + 7, w: 328, h: UI_PANEL.height - 14 };
const STATUS_BOX = { x: 342, y: UI_PANEL.y + 7, w: 138, h: UI_PANEL.height - 14 };
const COMMAND_BOX = { x: 486, y: UI_PANEL.y + 7, w: 146, h: UI_PANEL.height - 14 };

export function drawHud(ctx, ui, tools) {
  tools.panelTexture(ctx, UI_PANEL);
  tools.window(ctx, LOG_BOX, 'MESSAGE LOG');
  tools.window(ctx, STATUS_BOX, 'STATUS');
  tools.window(ctx, COMMAND_BOX, 'COMMAND');
  drawLog(ctx, ui, tools);
  drawStatus(ctx, ui, tools);
  drawCommands(ctx, ui, tools);
}

function drawLog(ctx, ui, tools) {
  const maxChars = 49;
  const wrapped = [];
  for (const line of ui.log ?? []) {
    wrapped.push(...tools.wrap(line, maxChars));
  }
  const lines = wrapped.slice(-6);
  let y = LOG_BOX.y + 19;
  for (const line of lines) {
    tools.outcomeText(ctx, line, LOG_BOX.x + 8, y, PALETTE.uiDim);
    y += 9;
  }
}

function drawStatus(ctx, ui, tools) {
  let y = STATUS_BOX.y + 17;
  const x = STATUS_BOX.x + 9;
  const statuses = Array.isArray(ui.statuses) ? ui.statuses : [];
  tools.text(ctx, tools.clip(ui.actorName ?? 'AGENT', 21), x, y, PALETTE.uiText);
  y += 8;
  if (ui.mode === 'COMBAT') {
    drawCombatStatus(ctx, ui, tools, { x, y, statuses });
    return;
  }
  if (statuses.length > 0) {
    const labels = statuses.map((status) => {
      const suffix = status.stacks > 1 ? `${status.stacks}` : '';
      return `${status.label}${suffix}`;
    });
    tools.text(ctx, tools.clip(`FX ${labels.join(' ')}`, 21), x, y, PALETTE.uiWarn);
    y += 10;
  } else if (ui.role) {
    tools.text(ctx, tools.clip(ui.role.split(',')[0], 21), x, y, PALETTE.uiDim);
    y += 10;
  } else {
    y += 1;
  }

  const hpRatio = ui.maxHp > 0 ? ui.hp / ui.maxHp : 0;
  const hpColor = hpRatio <= 0.34 ? PALETTE.uiBad : PALETTE.uiText;
  tools.text(ctx, `HP ${ui.hp}/${ui.maxHp}`, x, y, hpColor);
  tools.bar(ctx, x, y + 8, 94, 6, hpRatio, hpColor);
  y += 18;

  tools.text(ctx, `MODE ${ui.mode ?? '-'}`, x, y, ui.sneakMode ? PALETTE.uiSuccess : PALETTE.uiDim);
  if (ui.sneakMode) {
    tools.rect(ctx, x + 92, y + 6, 22, 1, PALETTE.uiSuccess);
    tools.rect(ctx, x + 94, y + 4, 8, 1, PALETTE.uiSuccess);
    tools.rect(ctx, x + 104, y + 5, 8, 1, PALETTE.uiBorderLight);
  }
  y += 9;
  const itemCount = (ui.inventoryItems ?? []).reduce((total, item) => total + item.count, 0);
  const hasCarry = typeof ui.carryWeight === 'number' && typeof ui.maxCarryWeight === 'number';
  const packLine = hasCarry
    ? `PACK ${tools.formatWeight(ui.carryWeight)}/${tools.formatWeight(ui.maxCarryWeight)} KG`
    : itemCount === 0 ? 'PACK EMPTY' : `PACK ${itemCount} ITEM${itemCount === 1 ? '' : 'S'}`;
  tools.text(ctx, packLine, x, y, PALETTE.uiDim);
}

function drawCombatStatus(ctx, ui, tools, { x, y, statuses }) {
  const maxChars = 20;
  if (statuses.length > 0) {
    const labels = statuses.map((status) => {
      const suffix = status.stacks > 1 ? `${status.stacks}` : '';
      return `${status.label}${suffix}`;
    });
    tools.text(ctx, tools.clip(`FX ${labels.join(' ')}`, maxChars), x, y, PALETTE.uiWarn);
    y += 9;
  } else {
    y += 1;
  }

  const hpRatio = ui.maxHp > 0 ? ui.hp / ui.maxHp : 0;
  const hpColor = hpRatio <= 0.34 ? PALETTE.uiBad : PALETTE.uiText;
  tools.text(ctx, `HP ${ui.hp}/${ui.maxHp}`, x, y, hpColor);
  tools.bar(ctx, x, y + 8, 94, 6, hpRatio, hpColor);
  y += 17;

  tools.text(ctx, `AP ${ui.ap}/${ui.maxAp}`, x, y, PALETTE.uiGood);
  tools.apPips(ctx, x + 45, y, ui.ap, ui.maxAp);
  y += 9;

  tools.text(ctx, tools.clip(`ATK ${ui.actionName ?? '-'}`, maxChars), x, y, PALETTE.uiGood);
  y += 9;
  const detail = [ui.actionChance, ui.actionDamage].filter(Boolean).join(' ') || ui.actionReason || '-';
  tools.text(ctx, tools.clip(detail, maxChars), x, y, ui.actionReason ? PALETTE.uiWarn : PALETTE.uiDim);
  y += 9;
  tools.text(ctx, tools.clip(`> ${ui.target ?? '-'}`, maxChars), x, y, PALETTE.uiBad);
}

function drawCommands(ctx, ui, tools) {
  let y = COMMAND_BOX.y + 19;
  const x = COMMAND_BOX.x + 8;
  if (ui.nearbyActionText) {
    tools.text(ctx, tools.clip(ui.nearbyActionText, 21), x, y, PALETTE.uiGood);
    y += 10;
    tools.rect(ctx, x, y, COMMAND_BOX.w - 16, 1, PALETTE.uiBorderDark);
    y += 4;
  }
  for (const line of ui.controls ?? []) {
    if (y > COMMAND_BOX.y + COMMAND_BOX.h - 10) break;
    tools.text(ctx, tools.clip(line, 21), x, y, PALETTE.uiDim);
    y += 9;
  }
}
