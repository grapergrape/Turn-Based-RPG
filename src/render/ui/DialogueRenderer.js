import { PALETTE } from '../palette.js';
import { getFrame } from '../SpriteAtlas.js';
import {
  DIALOGUE_BOX,
  DIALOGUE_LINE_HEIGHT,
  DIALOGUE_OPTION_LINE_HEIGHT,
  buildDialogueLayout
} from '../../ui/dialogueLayout.js';

// The talking-head plate perched above the dialogue window, the way the era
// did it: the speaker's own baked sprite blown up to a bust, hard pixels kept
// hard. Only actor conversations get one.
const PORTRAIT_BOX = { x: DIALOGUE_BOX.x, y: DIALOGUE_BOX.y - 100, w: 96, h: 100 };

function drawSpeakerPortrait(ctx, tools, spriteId) {
  if (!spriteId || !tools.atlas) return;
  const resolved = getFrame(tools.atlas, spriteId, 'idle', 's', 0);
  if (!resolved?.frame) return;
  const { sprite, frame } = resolved;
  tools.window(ctx, PORTRAIT_BOX, 'SPEAKER');
  const inner = {
    x: PORTRAIT_BOX.x + 6,
    y: PORTRAIT_BOX.y + 20,
    w: PORTRAIT_BOX.w - 12,
    h: PORTRAIT_BOX.h - 26
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
    srcX, srcY, srcW, srcH,
    Math.round(inner.x + (inner.w - srcW * scale) / 2),
    Math.round(inner.y + (inner.h - srcH * scale) / 2) + 2,
    Math.round(srcW * scale),
    Math.round(srcH * scale)
  );
}

export function drawDialogue(ctx, ui, tools) {
  const dialogue = ui.dialogue ?? { title: 'INSPECT', lines: [] };
  const layout = buildDialogueLayout(dialogue);
  const { body, responseBox, scroll, maxScroll } = layout;
  tools.screenBackdrop(ctx, true);
  tools.window(ctx, DIALOGUE_BOX, dialogue.title ?? 'INSPECT');
  drawSpeakerPortrait(ctx, tools, dialogue.speakerSpriteId);
  tools.inset(ctx, body);

  let y = body.y + 8;
  for (const line of layout.lines) {
    tools.outcomeText(ctx, line, body.x + 8, y, PALETTE.uiText);
    y += DIALOGUE_LINE_HEIGHT;
  }
  if (scroll > 0) tools.scrollArrow(ctx, body.x + body.w - 12, body.y + 7, -1, PALETTE.uiBorderLight);
  if (scroll < maxScroll) tools.scrollArrow(ctx, body.x + body.w - 12, body.y + body.h - 11, 1, PALETTE.uiWarn);

  tools.inset(ctx, responseBox);
  y = responseBox.y + 7;
  for (const option of layout.options) {
    tools.text(ctx, option, responseBox.x + 8, y, PALETTE.uiGood);
    y += DIALOGUE_OPTION_LINE_HEIGHT;
  }
}
