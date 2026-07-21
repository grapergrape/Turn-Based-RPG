// Shared layout math for the low-resolution dialogue window.
//
// Game owns scroll state, while the renderer only draws the computed layout.
// Keeping the wrap math here prevents one-frame drift between input and paint.

export const DIALOGUE_MAX_CHOICES = 5;
export const DIALOGUE_LINE_HEIGHT = 10;
export const DIALOGUE_OPTION_LINE_HEIGHT = 11;

export const DIALOGUE_BOX = { x: 28, y: 138, w: 584, h: 236 };
export const DIALOGUE_BODY = {
  x: DIALOGUE_BOX.x + 14,
  y: DIALOGUE_BOX.y + 26,
  w: DIALOGUE_BOX.w - 28,
  h: 126
};
export const DIALOGUE_RESPONSE_BOX = {
  x: DIALOGUE_BOX.x + 14,
  y: DIALOGUE_BODY.y + DIALOGUE_BODY.h + 6,
  w: DIALOGUE_BOX.w - 28,
  h: 64
};

const DIALOGUE_BOX_BOTTOM = DIALOGUE_BOX.y + DIALOGUE_BOX.h;
const DIALOGUE_BODY_MIN_HEIGHT = 46;
const DIALOGUE_RESPONSE_MIN_HEIGHT = 26;

export function buildDialogueLayout(dialogue = {}) {
  const bodyMaxChars = Math.max(1, Math.floor((DIALOGUE_BODY.w - 16) / 6));
  const allLines = [];
  for (const para of dialogue.lines ?? []) {
    if (allLines.length) allLines.push('');
    allLines.push(...wrapUiText(para, bodyMaxChars));
  }

  const optionMaxChars = Math.max(1, Math.floor((DIALOGUE_RESPONSE_BOX.w - 34) / 6));
  const options = (dialogue.options?.length ? dialogue.options : ['ENTER CLOSE'])
    .slice(0, DIALOGUE_MAX_CHOICES)
    .map((option) => clipUiText(option, optionMaxChars));
  const optionDetails = options.map((text, index) => ({
    text,
    tone: dialogueChoiceTone(dialogue.choices?.[index])
  }));

  const bodyHeight = clamp(
    allLines.length * DIALOGUE_LINE_HEIGHT + 14,
    DIALOGUE_BODY_MIN_HEIGHT,
    DIALOGUE_BODY.h
  );
  const responseHeight = clamp(
    options.length * DIALOGUE_OPTION_LINE_HEIGHT + 10,
    DIALOGUE_RESPONSE_MIN_HEIGHT,
    DIALOGUE_RESPONSE_BOX.h
  );
  const boxHeight = 46 + bodyHeight + responseHeight;
  const box = {
    ...DIALOGUE_BOX,
    y: DIALOGUE_BOX_BOTTOM - boxHeight,
    h: boxHeight
  };
  const body = {
    x: box.x + 14,
    y: box.y + 26,
    w: box.w - 28,
    h: bodyHeight
  };
  const responseBox = {
    x: box.x + 14,
    y: body.y + body.h + 6,
    w: box.w - 28,
    h: responseHeight
  };
  const visibleLines = Math.max(1, Math.floor((body.h - 14) / DIALOGUE_LINE_HEIGHT));
  const maxScroll = Math.max(0, allLines.length - visibleLines);
  const scroll = clamp(Number(dialogue.scroll) || 0, 0, maxScroll);

  return {
    box,
    body,
    responseBox,
    lines: allLines.slice(scroll, scroll + visibleLines),
    scroll,
    maxScroll,
    options,
    optionDetails,
    optionMaxChars
  };
}

export function dialogueOptionIndexAt(dialogue, point) {
  if (!point) return null;
  const layout = buildDialogueLayout(dialogue);
  const optionCount = layout.options.length;
  const rows = {
    x: layout.responseBox.x + 4,
    y: layout.responseBox.y + 4,
    w: layout.responseBox.w - 8,
    h: optionCount * DIALOGUE_OPTION_LINE_HEIGHT
  };
  if (!pointInBox(point, rows)) return null;
  const index = Math.floor((point.y - rows.y) / DIALOGUE_OPTION_LINE_HEIGHT);
  return index >= 0 && index < optionCount ? index : null;
}

function dialogueChoiceTone(choice) {
  if (['danger', 'commit', 'quiet', 'normal'].includes(choice?.tone)) return choice.tone;
  const effects = choice?.effects;
  if (effects?.startCombat) return 'danger';
  if (effects?.questUpdate && choice?.close) return 'commit';
  if (choice?.close && !effects && !choice?.next) return 'quiet';
  return 'normal';
}

export function normalizeUiText(str) {
  return String(str ?? '')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00d7/g, 'X')
    .replace(/[^A-Za-z0-9:.,;!?+\-/'"()[\]<>%#* ]/g, ' ')
    .toUpperCase();
}

export function wrapUiText(str, maxChars) {
  const safeMax = Math.max(1, Math.floor(maxChars));
  const words = normalizeUiText(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (word.length > safeMax) {
      if (line) lines.push(line);
      line = '';
      for (let i = 0; i < word.length; i += safeMax) {
        lines.push(word.slice(i, i + safeMax));
      }
      continue;
    }

    const next = line ? `${line} ${word}` : word;
    if (next.length > safeMax) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [''];
}

export function clipUiText(str, max) {
  const text = normalizeUiText(str);
  return text.length > max ? `${text.slice(0, Math.max(0, max - 3))}...` : text;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pointInBox(point, box) {
  return Boolean(
    point && box &&
    point.x >= box.x &&
    point.x < box.x + box.w &&
    point.y >= box.y &&
    point.y < box.y + box.h
  );
}
