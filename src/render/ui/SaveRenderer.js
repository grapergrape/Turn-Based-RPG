import { PALETTE } from '../palette.js';
import {
  SAVE_BODY,
  SAVE_FRAME,
  saveOptionBox,
  saveSlotBox
} from '../../ui/saveLayout.js';

export function drawSaveScreen(ctx, ui, tools) {
  const save = ui.save ?? {};
  tools.screenBackdrop(ctx, true);
  tools.window(ctx, SAVE_FRAME, screenTitle(save.screen));

  if (save.screen === 'title') drawTitle(ctx, save, tools);
  else if (save.screen === 'pause') drawOptions(ctx, save, tools);
  else if (save.screen === 'saves') drawSlots(ctx, save, tools);
  else if (save.screen === 'confirm') drawConfirm(ctx, save, tools);

  if (save.message) {
    const color = save.messageKind === 'error' ? PALETTE.uiBad : PALETTE.uiGood;
    tools.text(ctx, tools.clip(save.message, 62), SAVE_FRAME.x + 18, SAVE_FRAME.y + SAVE_FRAME.h - 25, color);
  }
}

function drawTitle(ctx, save, tools) {
  const title = 'VALE IMPRINT';
  const titleX = Math.round((640 - tools.textWidth(title, 3)) / 2);
  tools.text(ctx, title, titleX + 2, 64 + 2, PALETTE.outline, 3);
  tools.text(ctx, title, titleX, 64, PALETTE.uiText, 3);
  tools.detailRect(ctx, 178.5, 92.5, 284, 0.5, PALETTE.uiWarn);
  drawOptions(ctx, save, tools);
  tools.text(ctx, `GAME VERSION ${save.gameVersion ?? 'UNKNOWN'}`, SAVE_FRAME.x + 18, SAVE_FRAME.y + SAVE_FRAME.h - 42, PALETTE.uiDim);
}

function drawOptions(ctx, save, tools) {
  const options = save.options ?? [];
  for (const [index, option] of options.entries()) {
    const box = saveOptionBox(index);
    drawSelectionBox(ctx, box, index === save.selected, option.enabled !== false, tools);
    const color = option.enabled === false
      ? PALETTE.uiDim
      : index === save.selected ? PALETTE.uiGood : PALETTE.uiText;
    tools.text(ctx, option.label, box.x + 12, box.y + 5, color);
    if (option.detail) {
      tools.text(ctx, tools.clip(option.detail, 48), box.x + 12, box.y + 15, PALETTE.uiDim);
    }
  }
  if (save.busy) tools.text(ctx, 'WORKING', SAVE_BODY.x + SAVE_BODY.w - 62, SAVE_BODY.y + SAVE_BODY.h - 14, PALETTE.uiWarn);
}

function drawSlots(ctx, save, tools) {
  for (const [index, row] of (save.rows ?? []).entries()) {
    const box = saveSlotBox(index);
    const enabled = row.status === 'valid';
    drawSelectionBox(ctx, box, index === save.selected, enabled, tools);
    const titleColor = row.status === 'valid'
      ? index === save.selected ? PALETTE.uiGood : PALETTE.uiText
      : row.status === 'empty' ? PALETTE.uiDim : PALETTE.uiBad;
    tools.text(ctx, row.label, box.x + 9, box.y + 6, titleColor);

    if (row.status === 'empty') {
      tools.text(ctx, 'EMPTY', box.x + 9, box.y + 22, PALETTE.uiDim);
      continue;
    }
    if (row.status !== 'valid') {
      tools.text(ctx, row.status === 'incompatible' ? 'INCOMPATIBLE SAVE' : 'DAMAGED SAVE', box.x + 9, box.y + 22, PALETTE.uiBad);
      tools.text(ctx, tools.clip(row.reason ?? '', 54), box.x + 9, box.y + 34, PALETTE.uiDim);
      continue;
    }

    tools.text(ctx, tools.clip(`${row.playerName}  LEVEL ${row.playerLevel}`, 40), box.x + 9, box.y + 18, PALETTE.uiText);
    tools.text(ctx, tools.clip(row.location, 38), box.x + 9, box.y + 30, PALETTE.uiDim);
    const right = `${row.fieldTime}  ${row.savedAt}`;
    tools.text(ctx, right, box.x + box.w - tools.textWidth(right) - 9, box.y + 30, PALETTE.uiDim);
    if (row.versionWarning) {
      const warning = tools.clip(`SAVED ${row.savedGameVersion}  CURRENT ${save.gameVersion}`, 34);
      tools.text(ctx, warning, box.x + box.w - tools.textWidth(warning) - 9, box.y + 6, PALETTE.uiWarn);
    }
  }
  tools.text(ctx, 'ENTER LOAD   X EXPORT   DELETE REMOVE   ESC BACK', SAVE_FRAME.x + 18, SAVE_FRAME.y + SAVE_FRAME.h - 42, PALETTE.uiDim);
  if (save.busy) tools.text(ctx, 'READING SAVES', SAVE_BODY.x + SAVE_BODY.w - 96, SAVE_BODY.y + SAVE_BODY.h - 5, PALETTE.uiWarn);
}

function drawConfirm(ctx, save, tools) {
  const box = { x: SAVE_BODY.x + 34, y: SAVE_BODY.y + 48, w: SAVE_BODY.w - 68, h: 154 };
  tools.inset(ctx, box);
  let y = box.y + 18;
  for (const line of tools.wrap(save.confirmText ?? 'Confirm this action?', 48)) {
    tools.text(ctx, line, box.x + 14, y, PALETTE.uiText);
    y += 12;
  }
  const options = save.options ?? [];
  for (const [index, option] of options.entries()) {
    const row = { x: box.x + 52, y: box.y + 90 + index * 26, w: box.w - 104, h: 20 };
    drawSelectionBox(ctx, row, index === save.selected, true, tools);
    tools.text(ctx, option.label, row.x + 10, row.y + 5, index === save.selected ? PALETTE.uiGood : PALETTE.uiText);
  }
}

function drawSelectionBox(ctx, box, selected, enabled, tools) {
  tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.outline);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, selected ? PALETTE.uiDark : PALETTE.uiPanel);
  tools.rect(ctx, box.x + 2, box.y + 2, box.w - 4, 1, selected ? PALETTE.uiBorderLight : PALETTE.uiBorderDark);
  tools.rect(ctx, box.x + 2, box.y + box.h - 3, box.w - 4, 1, PALETTE.uiBorderDark);
  if (selected) {
    tools.rect(ctx, box.x + 3, box.y + 4, 3, box.h - 8, enabled ? PALETTE.uiGood : PALETTE.uiWarn);
    tools.detailRect(ctx, box.x + 1.5, box.y + 1.5, box.w - 3, 0.5, PALETTE.uiBorderLight);
  }
}

function screenTitle(screen) {
  if (screen === 'title') return 'RUN REGISTER';
  if (screen === 'pause') return 'FIELD MENU';
  if (screen === 'saves') return 'SAVED RUNS';
  return 'CONFIRM ORDER';
}
