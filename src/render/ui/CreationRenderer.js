import { PALETTE } from '../palette.js';
import { getFrame } from '../SpriteAtlas.js';

const CREATION_BOX = { x: 58, y: 34, w: 524, h: 342 };
const PREVIEW_BOX = { x: 386, y: 76, w: 142, h: 230 };
const LIST_BOX = { x: 88, y: 76, w: 270, h: 230 };
const PRIMARY_BOX = { x: 72, y: 46, w: 496, h: 318 };

export function drawCharacterCreation(ctx, ui, tools) {
  const creation = ui.characterCreation ?? {};
  tools.screenBackdrop(ctx, true);
  tools.window(ctx, CREATION_BOX, 'CHARACTER CUSTOMIZATION');
  tools.inset(ctx, LIST_BOX);
  tools.inset(ctx, PREVIEW_BOX);

  tools.text(ctx, 'FIELD AGENT RECORD', LIST_BOX.x + 12, LIST_BOX.y + 10, PALETTE.uiBorderLight);
  let y = LIST_BOX.y + 30;
  for (const row of creation.rows ?? []) {
    drawOptionRow(ctx, tools, row, LIST_BOX.x + 10, y, LIST_BOX.w - 20);
    y += 25;
  }

  drawPlayerPreview(ctx, tools, PREVIEW_BOX, creation.previewSpriteId ?? ui.figureSpriteId ?? 'mara-vey');
  const previewName = tools.clip(creation.name ?? ui.actorName ?? 'AGENT', 18);
  tools.text(ctx, previewName, PREVIEW_BOX.x + Math.floor((PREVIEW_BOX.w - tools.textWidth(previewName)) / 2), PREVIEW_BOX.y + 12, PALETTE.uiBorderLight);

  const valid = Boolean(creation.canConfirm);
  const status = valid ? 'ENTER CONFIRMS' : 'ENTER LOCKED';
  tools.text(ctx, status, CREATION_BOX.x + 22, CREATION_BOX.y + CREATION_BOX.h - 40, valid ? PALETTE.uiGood : PALETTE.uiBad);
  tools.text(ctx, creation.error || 'NAME USES LETTERS SPACES APOSTROPHES', CREATION_BOX.x + 22, CREATION_BOX.y + CREATION_BOX.h - 26, PALETTE.uiDim);
  tools.text(ctx, 'UP DOWN SELECT', CREATION_BOX.x + 22, CREATION_BOX.y + CREATION_BOX.h - 13, PALETTE.uiDim);
  tools.text(ctx, 'LEFT RIGHT CHANGE', CREATION_BOX.x + 180, CREATION_BOX.y + CREATION_BOX.h - 13, PALETTE.uiDim);
  tools.text(ctx, 'TYPE NAME', CREATION_BOX.x + 390, CREATION_BOX.y + CREATION_BOX.h - 13, PALETTE.uiDim);
}

export function drawPrimaryAssignment(ctx, ui, tools) {
  const assignment = ui.primaryAssignment ?? {};
  tools.screenBackdrop(ctx, true);
  tools.window(ctx, PRIMARY_BOX, 'LEVEL 1 PRIMARY ASSIGNMENT');

  const left = { x: PRIMARY_BOX.x + 24, y: PRIMARY_BOX.y + 42, w: 260, h: 216 };
  const right = { x: PRIMARY_BOX.x + 310, y: PRIMARY_BOX.y + 42, w: 132, h: 216 };
  tools.inset(ctx, left);
  tools.inset(ctx, right);

  tools.text(ctx, 'PRIMARY ATTRIBUTES', left.x + 12, left.y + 10, PALETTE.uiBorderLight);
  let y = left.y + 30;
  for (const row of assignment.rows ?? []) {
    drawPrimaryRow(ctx, tools, row, left.x + 10, y, left.w - 20);
    y += 25;
  }

  tools.text(ctx, 'POINTS LEFT', right.x + 20, right.y + 20, PALETTE.uiBorderLight);
  tools.text(ctx, String(assignment.pointsRemaining ?? 0), right.x + 57, right.y + 44, assignment.pointsRemaining === 0 ? PALETTE.uiGood : PALETTE.uiWarn, 2);
  tools.text(ctx, 'START 3', right.x + 24, right.y + 83, PALETTE.uiDim);
  tools.text(ctx, 'CAP 7', right.x + 30, right.y + 96, PALETTE.uiDim);
  tools.text(ctx, 'POINTS 14', right.x + 18, right.y + 109, PALETTE.uiDim);

  const valid = Boolean(assignment.canConfirm);
  tools.text(ctx, valid ? 'ENTER CONFIRMS' : 'SPEND ALL POINTS', PRIMARY_BOX.x + 24, PRIMARY_BOX.y + PRIMARY_BOX.h - 34, valid ? PALETTE.uiGood : PALETTE.uiBad);
  tools.text(ctx, 'UP DOWN SELECT   LEFT RIGHT ASSIGN', PRIMARY_BOX.x + 260, PRIMARY_BOX.y + PRIMARY_BOX.h - 34, PALETTE.uiDim);
}

function drawOptionRow(ctx, tools, row, x, y, w) {
  const selected = Boolean(row.selected);
  if (selected) {
    tools.rect(ctx, x - 3, y - 3, w + 6, 20, PALETTE.outline);
    tools.rect(ctx, x - 2, y - 2, w + 4, 18, PALETTE.uiDark);
    tools.rect(ctx, x - 2, y - 2, w + 4, 1, PALETTE.uiBorderLight);
  }
  tools.text(ctx, selected ? '>' : ' ', x, y, selected ? PALETTE.uiText : PALETTE.uiDim);
  tools.text(ctx, tools.clip(row.label ?? '', 17), x + 12, y, selected ? PALETTE.uiText : PALETTE.uiDim);
  const value = row.kind === 'name' && selected ? `${row.value ?? ''}*` : row.value ?? '';
  tools.text(ctx, tools.clip(value, 20), x + 138, y, selected ? PALETTE.uiWarn : PALETTE.uiBorderLight);
}

function drawPrimaryRow(ctx, tools, row, x, y, w) {
  const selected = Boolean(row.selected);
  if (selected) {
    tools.rect(ctx, x - 3, y - 3, w + 6, 20, PALETTE.outline);
    tools.rect(ctx, x - 2, y - 2, w + 4, 18, PALETTE.uiDark);
    tools.rect(ctx, x - 2, y - 2, w + 4, 1, PALETTE.uiBorderLight);
  }
  tools.text(ctx, selected ? '>' : ' ', x, y, selected ? PALETTE.uiText : PALETTE.uiDim);
  tools.text(ctx, tools.clip(row.label ?? '', 14), x + 12, y, selected ? PALETTE.uiText : PALETTE.uiDim);
  tools.text(ctx, `${row.value ?? 0}/10`, x + 112, y, selected ? PALETTE.uiWarn : PALETTE.uiBorderLight);
  tools.bar(ctx, x + 154, y + 2, 82, 6, (row.value ?? 0) / 10, selected ? PALETTE.uiWarn : PALETTE.uiBorderLight);
}

function drawPlayerPreview(ctx, tools, box, spriteId) {
  const cx = box.x + Math.floor(box.w / 2);
  const baseY = box.y + box.h - 22;
  tools.rect(ctx, cx - 34, baseY + 3, 68, 1, PALETTE.outline);
  tools.rect(ctx, cx - 27, baseY + 4, 54, 1, PALETTE.uiDark);
  tools.rect(ctx, cx - 17, baseY + 5, 34, 1, PALETTE.uiDark);

  const resolved = tools.atlas ? getFrame(tools.atlas, spriteId, 'idle', 's', 0) : null;
  if (!resolved?.frame) {
    const label = 'NO PREVIEW';
    tools.text(ctx, label, cx - Math.floor(tools.textWidth(label) / 2), box.y + 106, PALETTE.uiDim);
    return;
  }
  const scale = 3;
  const { sprite, frame } = resolved;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    frame,
    cx - sprite.anchorX * scale,
    baseY - sprite.anchorY * scale,
    sprite.width * scale,
    sprite.height * scale
  );
}
