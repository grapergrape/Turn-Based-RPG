import { PALETTE } from '../palette.js';
import { NATIVE_SCALE } from '../renderConfig.js';
import { getFrame } from '../SpriteAtlas.js';
import {
  DIALOGUE_LINE_HEIGHT,
  DIALOGUE_OPTION_LINE_HEIGHT,
  buildDialogueLayout
} from '../../ui/dialogueLayout.js';

// The talking-head plate perched above the dialogue window, the way the era
// did it: the speaker's own baked sprite blown up to a bust, hard pixels kept
// hard. Only actor conversations get one.
function drawSpeakerPortrait(ctx, tools, spriteId, dialogueBox) {
  if (!spriteId || !tools.atlas) return;
  const resolved = getFrame(tools.atlas, spriteId, 'idle', 's', 0);
  if (!resolved?.frame) return;
  const { sprite, frame } = resolved;
  const portraitBox = { x: dialogueBox.x, y: dialogueBox.y - 100, w: 96, h: 100 };
  tools.window(ctx, portraitBox, 'SPEAKER');
  const inner = {
    x: portraitBox.x + 6,
    y: portraitBox.y + 20,
    w: portraitBox.w - 12,
    h: portraitBox.h - 26
  };
  tools.inset(ctx, inner);
  ctx.imageSmoothingEnabled = false;
  // Head and shoulders only: crop the top of the frame and scale it up so
  // the bust fills the plate.
  const srcX = Math.max(0, Math.floor(sprite.width / 2) - 17);
  const srcY = 4;
  const srcW = Math.min(34, sprite.width - srcX);
  const srcH = 30;
  const scale = 2.4;
  ctx.drawImage(
    frame,
    srcX * NATIVE_SCALE,
    srcY * NATIVE_SCALE,
    srcW * NATIVE_SCALE,
    srcH * NATIVE_SCALE,
    Math.round(inner.x + (inner.w - srcW * scale) / 2),
    Math.round(inner.y + (inner.h - srcH * scale) / 2) + 2,
    Math.round(srcW * scale),
    Math.round(srcH * scale)
  );
}

export function drawDialogue(ctx, ui, tools) {
  const dialogue = ui.dialogue ?? { title: 'INSPECT', lines: [] };
  const layout = buildDialogueLayout(dialogue);
  const { box, body, responseBox, scroll, maxScroll } = layout;
  tools.screenBackdrop(ctx, true);
  tools.window(ctx, box, dialogue.title ?? 'INSPECT');
  drawSpeakerPortrait(ctx, tools, dialogue.speakerSpriteId, box);
  tools.inset(ctx, body);

  let y = body.y + 8;
  let paragraphStart = true;
  for (const line of layout.lines) {
    if (line === '') {
      paragraphStart = true;
      y += DIALOGUE_LINE_HEIGHT;
      continue;
    }
    if (paragraphStart) {
      tools.rect(ctx, body.x + 3, y + 1, 5, 1, PALETTE.uiBorderDark);
      tools.rect(ctx, body.x + 3, y + 1, 1, 5, PALETTE.uiBorderDark);
      tools.rect(ctx, body.x + 4, y + 2, 2, 1, PALETTE.uiBorderLight);
      tools.detailRect?.(ctx, body.x + 3.5, y + 1.5, 3, 0.5, PALETTE.uiText);
    }
    tools.outcomeText(ctx, line, body.x + 12, y, PALETTE.uiText);
    paragraphStart = false;
    y += DIALOGUE_LINE_HEIGHT;
  }
  if (scroll > 0) tools.scrollArrow(ctx, body.x + body.w - 12, body.y + 7, -1, PALETTE.uiBorderLight);
  if (scroll < maxScroll) tools.scrollArrow(ctx, body.x + body.w - 12, body.y + body.h - 11, 1, PALETTE.uiWarn);

  tools.inset(ctx, responseBox);
  y = responseBox.y + 7;
  for (const option of layout.optionDetails) {
    drawResponseOption(ctx, tools, responseBox, option, y);
    y += DIALOGUE_OPTION_LINE_HEIGHT;
  }
}

function drawResponseOption(ctx, tools, responseBox, option, y) {
  const colors = {
    danger: PALETTE.uiBad,
    commit: PALETTE.uiWarn,
    quiet: PALETTE.uiGood,
    normal: PALETTE.uiGood
  };
  const color = colors[option.tone] ?? PALETTE.uiGood;
  const match = option.text.match(/^(\d+)\.\s*(.*)$/);
  if (!match) {
    tools.text(ctx, option.text, responseBox.x + 8, y, color);
    return;
  }

  const plateX = responseBox.x + 7;
  tools.rect(ctx, plateX, y - 1, 11, 9, PALETTE.outline);
  tools.rect(ctx, plateX + 1, y, 9, 7, PALETTE.uiDark);
  tools.rect(ctx, plateX + 1, y, 9, 1, color);
  tools.rect(ctx, plateX + 1, y, 1, 7, PALETTE.uiBorderLight);
  tools.detailRect?.(ctx, plateX + 1.5, y + 0.5, 8, 0.5, color);
  tools.detailRect?.(ctx, plateX + 1.5, y + 0.5, 0.5, 6, PALETTE.uiText);
  tools.text(ctx, match[1], plateX + 3, y, color);
  tools.text(ctx, match[2], plateX + 16, y, color);
  tools.rect(ctx, plateX + 16, y + 8, responseBox.w - 32, 1, PALETTE.uiDark);
}
