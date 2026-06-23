import { PALETTE } from '../palette.js';
import {
  DIALOGUE_BOX,
  DIALOGUE_LINE_HEIGHT,
  DIALOGUE_OPTION_LINE_HEIGHT,
  buildDialogueLayout
} from '../../ui/dialogueLayout.js';

export function drawDialogue(ctx, ui, tools) {
  const dialogue = ui.dialogue ?? { title: 'INSPECT', lines: [] };
  const layout = buildDialogueLayout(dialogue);
  const { body, responseBox, scroll, maxScroll } = layout;
  tools.screenBackdrop(ctx, true);
  tools.window(ctx, DIALOGUE_BOX, dialogue.title ?? 'INSPECT');
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
