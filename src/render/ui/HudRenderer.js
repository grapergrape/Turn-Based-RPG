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
  let y = STATUS_BOX.y + 19;
  const x = STATUS_BOX.x + 9;
  tools.text(ctx, tools.clip(ui.actorName ?? 'MARA VEY', 21), x, y, PALETTE.uiText);
  y += 9;
  if (ui.role) {
    tools.text(ctx, tools.clip(ui.role.split(',')[0], 21), x, y, PALETTE.uiDim);
    y += 11;
  } else {
    y += 2;
  }

  const hpRatio = ui.maxHp > 0 ? ui.hp / ui.maxHp : 0;
  const hpColor = hpRatio <= 0.34 ? PALETTE.uiBad : PALETTE.uiText;
  tools.text(ctx, `HP ${ui.hp}/${ui.maxHp}`, x, y, hpColor);
  tools.bar(ctx, x, y + 9, 94, 6, hpRatio, hpColor);
  y += 20;

  tools.text(ctx, `MODE ${ui.mode ?? '-'}`, x, y, ui.sneakMode ? PALETTE.uiSuccess : PALETTE.uiDim);
  if (ui.sneakMode) {
    tools.rect(ctx, x + 92, y + 6, 22, 1, PALETTE.uiSuccess);
    tools.rect(ctx, x + 94, y + 4, 8, 1, PALETTE.uiSuccess);
    tools.rect(ctx, x + 104, y + 5, 8, 1, PALETTE.uiBorderLight);
  }
  y += 10;
  if (ui.mode === 'COMBAT') {
    tools.text(ctx, `AP ${ui.ap}/${ui.maxAp}`, x, y, PALETTE.uiGood);
    tools.apPips(ctx, x + 45, y, ui.ap, ui.maxAp);
    y += 10;
    tools.text(ctx, tools.clip(ui.action ?? '-', 19), x, y, PALETTE.uiGood);
    y += 10;
    tools.text(ctx, tools.clip(`> ${ui.target ?? '-'}`, 19), x, y, PALETTE.uiBad);
  } else {
    const itemCount = (ui.inventoryItems ?? []).reduce((total, item) => total + item.count, 0);
    const hasCarry = typeof ui.carryWeight === 'number' && typeof ui.maxCarryWeight === 'number';
    const packLine = hasCarry
      ? `PACK ${tools.formatWeight(ui.carryWeight)}/${tools.formatWeight(ui.maxCarryWeight)} KG`
      : itemCount === 0 ? 'PACK EMPTY' : `PACK ${itemCount} ITEM${itemCount === 1 ? '' : 'S'}`;
    tools.text(ctx, packLine, x, y, PALETTE.uiDim);
  }
}

function drawCommands(ctx, ui, tools) {
  let y = COMMAND_BOX.y + 19;
  const x = COMMAND_BOX.x + 8;
  for (const line of ui.controls ?? []) {
    tools.text(ctx, tools.clip(line, 21), x, y, PALETTE.uiDim);
    y += 9;
  }
}
