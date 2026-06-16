// Low-resolution CRPG interface renderer.
//
// Everything is drawn directly to the 640x480 canvas using hard pixels:
// no browser text, no arcs, no gradients, no vector icons. Panels are dark
// metal/leather boxes with brass edges, rivets, inset wells, muted amber text,
// and small old-CRPG cursor glyphs.

import { PALETTE } from './palette.js';
import { UI_PANEL, VIEWPORT } from './renderConfig.js';

const LOG_BOX = { x: 8, y: UI_PANEL.y + 7, w: 328, h: UI_PANEL.height - 14 };
const STATUS_BOX = { x: 342, y: UI_PANEL.y + 7, w: 138, h: UI_PANEL.height - 14 };
const COMMAND_BOX = { x: 486, y: UI_PANEL.y + 7, w: 146, h: UI_PANEL.height - 14 };
const INVENTORY_BOX = { x: 54, y: 42, w: 532, h: 296 };
const DIALOGUE_BOX = { x: 42, y: 248, w: 556, h: 124 };

const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ';': ['00000', '00100', '00100', '00000', '00100', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '[': ['01110', '01000', '01000', '01000', '01000', '01000', '01110'],
  ']': ['01110', '00010', '00010', '00010', '00010', '00010', '01110'],
  '>': ['10000', '01000', '00100', '00010', '00100', '01000', '10000'],
  '<': ['00001', '00010', '00100', '01000', '00100', '00010', '00001'],
  '%': ['11001', '11010', '00100', '01000', '10110', '00110', '00000'],
  '#': ['01010', '11111', '01010', '01010', '11111', '01010', '00000'],
  '*': ['00100', '10101', '01110', '11111', '01110', '10101', '00100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000']
};

export class UIRenderer {
  draw(ctx, ui) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (ui.screen === 'inventory') this.#drawInventory(ctx, ui);
    if (ui.screen === 'dialogue') this.#drawDialogue(ctx, ui);

    this.#drawHud(ctx, ui);
    if (ui.hoverText && !ui.screen) this.#drawHoverText(ctx, ui.hoverText);
    this.#drawCursor(ctx, ui.cursor);

    ctx.restore();
  }

  #drawHud(ctx, ui) {
    this.#panelTexture(ctx, UI_PANEL);
    this.#window(ctx, LOG_BOX, 'MESSAGE LOG');
    this.#window(ctx, STATUS_BOX, 'STATUS');
    this.#window(ctx, COMMAND_BOX, 'COMMAND');
    this.#drawLog(ctx, ui);
    this.#drawStatus(ctx, ui);
    this.#drawCommands(ctx, ui);
  }

  #panelTexture(ctx, box) {
    this.#rect(ctx, box.x, box.y, box.width, box.height, PALETTE.uiPanel);
    for (let y = box.y + 3; y < box.y + box.height; y += 4) {
      this.#rect(ctx, box.x, y, box.width, 1, PALETTE.uiDark);
    }
    for (let x = box.x + 5; x < box.x + box.width; x += 17) {
      this.#rect(ctx, x, box.y + 2 + ((x >> 1) % 4), 1, 1, PALETTE.uiBorderDark);
    }
    this.#rect(ctx, box.x, box.y, box.width, 1, PALETTE.uiBorderLight);
    this.#rect(ctx, box.x, box.y + 1, box.width, 1, PALETTE.uiBorderDark);
  }

  #window(ctx, box, title = '') {
    this.#rect(ctx, box.x - 1, box.y - 1, box.w + 2, box.h + 2, PALETTE.outline);
    this.#rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiDark);
    this.#rect(ctx, box.x + 2, box.y + 2, box.w - 4, box.h - 4, PALETTE.uiPanel);
    this.#rect(ctx, box.x, box.y, box.w, 1, PALETTE.uiBorderLight);
    this.#rect(ctx, box.x, box.y + box.h - 1, box.w, 1, PALETTE.uiBorderDark);
    this.#rect(ctx, box.x, box.y, 1, box.h, PALETTE.uiBorderLight);
    this.#rect(ctx, box.x + box.w - 1, box.y, 1, box.h, PALETTE.uiBorderDark);
    this.#rect(ctx, box.x + 4, box.y + 4, box.w - 8, 10, PALETTE.uiDark);
    this.#rivet(ctx, box.x + 4, box.y + 4);
    this.#rivet(ctx, box.x + box.w - 8, box.y + 4);
    if (title) this.#text(ctx, title, box.x + 10, box.y + 6, PALETTE.uiBorderLight);
  }

  #drawLog(ctx, ui) {
    const maxChars = 49;
    const wrapped = [];
    for (const line of ui.log ?? []) {
      wrapped.push(...this.#wrap(line, maxChars));
    }
    const lines = wrapped.slice(-6);
    let y = LOG_BOX.y + 19;
    for (const line of lines) {
      this.#text(ctx, line, LOG_BOX.x + 8, y, PALETTE.uiDim);
      y += 9;
    }
  }

  #drawStatus(ctx, ui) {
    let y = STATUS_BOX.y + 19;
    const x = STATUS_BOX.x + 9;
    this.#text(ctx, this.#clip(ui.actorName ?? 'MARA VEY', 19), x, y, PALETTE.uiText);
    y += 11;

    const hpRatio = ui.maxHp > 0 ? ui.hp / ui.maxHp : 0;
    const hpColor = hpRatio <= 0.34 ? PALETTE.uiBad : PALETTE.uiText;
    this.#text(ctx, `HP ${ui.hp}/${ui.maxHp}`, x, y, hpColor);
    this.#bar(ctx, x, y + 9, 94, 6, hpRatio, hpColor);
    y += 20;

    this.#text(ctx, `MODE ${ui.mode ?? '-'}`, x, y, PALETTE.uiDim);
    y += 10;
    if (ui.mode === 'COMBAT') {
      this.#text(ctx, `AP ${ui.ap}/${ui.maxAp}`, x, y, PALETTE.uiGood);
      this.#apPips(ctx, x + 45, y, ui.ap, ui.maxAp);
      y += 10;
      this.#text(ctx, this.#clip(ui.action ?? '-', 19), x, y, PALETTE.uiGood);
      y += 10;
      this.#text(ctx, this.#clip(`> ${ui.target ?? '-'}`, 19), x, y, PALETTE.uiBad);
    } else {
      const itemCount = (ui.inventoryItems ?? []).reduce((total, item) => total + item.count, 0);
      const packLine = itemCount === 0 ? 'PACK EMPTY' : `PACK ${itemCount} ITEM${itemCount === 1 ? '' : 'S'}`;
      this.#text(ctx, packLine, x, y, PALETTE.uiDim);
    }
  }

  #drawCommands(ctx, ui) {
    let y = COMMAND_BOX.y + 19;
    const x = COMMAND_BOX.x + 8;
    for (const line of ui.controls ?? []) {
      this.#text(ctx, this.#clip(line, 21), x, y, PALETTE.uiDim);
      y += 9;
    }
  }

  #drawInventory(ctx, ui) {
    this.#screenBackdrop(ctx);
    this.#window(ctx, INVENTORY_BOX, 'FIELD PACK');
    const left = { x: INVENTORY_BOX.x + 14, y: INVENTORY_BOX.y + 28, w: 230, h: 222 };
    const right = { x: INVENTORY_BOX.x + 260, y: INVENTORY_BOX.y + 28, w: 254, h: 222 };
    this.#inset(ctx, left);
    this.#inset(ctx, right);

    this.#text(ctx, 'ITEMS', left.x + 8, left.y + 8, PALETTE.uiBorderLight);
    const items = ui.inventoryItems ?? [];
    if (items.length === 0) {
      this.#text(ctx, 'PACK EMPTY', left.x + 8, left.y + 25, PALETTE.uiDim);
    } else {
      let y = left.y + 25;
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const color = i === 0 ? PALETTE.uiText : PALETTE.uiDim;
        if (i === 0) this.#rect(ctx, left.x + 5, y - 2, left.w - 10, 10, PALETTE.uiDark);
        this.#text(ctx, `${i === 0 ? '>' : ' '} ${item.count}X ${item.name}`, left.x + 8, y, color);
        y += 11;
      }
    }

    const selected = items[0] ?? null;
    this.#text(ctx, selected ? selected.name : 'NO ITEM SELECTED', right.x + 8, right.y + 8, PALETTE.uiBorderLight);
    if (selected) {
      this.#text(ctx, `TYPE ${selected.type}`, right.x + 8, right.y + 22, PALETTE.uiGood);
      let y = right.y + 39;
      for (const line of this.#wrap(selected.description || 'NO DESCRIPTION.', 37).slice(0, 9)) {
        this.#text(ctx, line, right.x + 8, y, PALETTE.uiDim);
        y += 9;
      }
    }
    this.#text(ctx, 'I OR ESC CLOSE    H USE DRESSING', INVENTORY_BOX.x + 14, INVENTORY_BOX.y + INVENTORY_BOX.h - 24, PALETTE.uiText);
  }

  #drawDialogue(ctx, ui) {
    const dialogue = ui.dialogue ?? { title: 'INSPECT', lines: [] };
    this.#window(ctx, DIALOGUE_BOX, dialogue.title ?? 'INSPECT');
    const body = { x: DIALOGUE_BOX.x + 14, y: DIALOGUE_BOX.y + 26, w: DIALOGUE_BOX.w - 28, h: DIALOGUE_BOX.h - 58 };
    this.#inset(ctx, body);
    let y = body.y + 8;
    for (const line of this.#wrap((dialogue.lines ?? []).join(' '), 82).slice(0, 5)) {
      this.#text(ctx, line, body.x + 8, y, PALETTE.uiText);
      y += 10;
    }
    const options = dialogue.options ?? ['ENTER CLOSE'];
    let ox = DIALOGUE_BOX.x + 14;
    for (const option of options) {
      this.#text(ctx, `[${option}]`, ox, DIALOGUE_BOX.y + DIALOGUE_BOX.h - 20, PALETTE.uiGood);
      ox += this.#textWidth(`[${option}]`) + 14;
    }
  }

  #drawHoverText(ctx, text) {
    const label = this.#clip(text, 62);
    const w = this.#textWidth(label) + 16;
    const x = 10;
    const y = VIEWPORT.height - 20;
    this.#rect(ctx, x - 1, y - 1, w + 2, 14, PALETTE.outline);
    this.#rect(ctx, x, y, w, 12, PALETTE.uiDark);
    this.#rect(ctx, x, y, w, 1, PALETTE.uiBorderLight);
    this.#text(ctx, label, x + 7, y + 3, PALETTE.uiText);
  }

  #drawCursor(ctx, cursor) {
    if (!cursor) return;
    const x = Math.round(cursor.x);
    const y = Math.round(cursor.y);
    const state = cursor.state ?? 'move';
    const c = state === 'blocked' ? PALETTE.uiBad : state === 'attack' ? PALETTE.uiBad : PALETTE.uiText;
    const dark = PALETTE.outline;

    if (state === 'move') {
      this.#cursorLine(ctx, x, y, x, y + 13, dark, 2);
      this.#cursorLine(ctx, x, y, x + 8, y + 8, dark, 2);
      this.#cursorLine(ctx, x, y, x, y + 13, c);
      this.#cursorLine(ctx, x, y, x + 8, y + 8, c);
      this.#rect(ctx, x + 5, y + 12, 8, 2, c);
    } else if (state === 'inspect') {
      this.#cursorBox(ctx, x, y, c);
      this.#cursorLine(ctx, x + 10, y + 10, x + 15, y + 15, c);
    } else if (state === 'talk') {
      this.#cursorBox(ctx, x, y, c);
      this.#rect(ctx, x + 4, y + 5, 8, 2, c);
      this.#rect(ctx, x + 4, y + 9, 5, 2, c);
    } else if (state === 'use') {
      this.#cursorLine(ctx, x + 2, y + 13, x + 8, y + 2, c, 2);
      this.#rect(ctx, x + 7, y + 1, 6, 4, c);
      this.#rect(ctx, x + 11, y + 5, 3, 7, c);
    } else if (state === 'loot') {
      this.#rect(ctx, x + 2, y + 5, 14, 9, dark);
      this.#rect(ctx, x + 3, y + 6, 12, 7, c);
      this.#rect(ctx, x + 5, y + 3, 8, 3, c);
      this.#rect(ctx, x + 7, y + 8, 4, 2, PALETTE.uiBorderDark);
    } else if (state === 'attack') {
      this.#cursorLine(ctx, x + 8, y, x + 8, y + 16, c);
      this.#cursorLine(ctx, x, y + 8, x + 16, y + 8, c);
      this.#rect(ctx, x + 6, y + 6, 5, 5, dark);
      this.#rect(ctx, x + 7, y + 7, 3, 3, c);
    } else if (state === 'blocked') {
      this.#cursorLine(ctx, x + 1, y + 1, x + 14, y + 14, c, 2);
      this.#cursorLine(ctx, x + 14, y + 1, x + 1, y + 14, c, 2);
    } else {
      this.#cursorLine(ctx, x, y, x, y + 13, PALETTE.uiBorderLight);
      this.#cursorLine(ctx, x, y, x + 7, y + 7, PALETTE.uiBorderLight);
    }
  }

  #screenBackdrop(ctx) {
    for (let y = 0; y < VIEWPORT.height; y += 2) {
      this.#rect(ctx, 0, y, VIEWPORT.width, 1, 'rgba(5, 5, 5, 0.45)');
    }
  }

  #inset(ctx, box) {
    this.#rect(ctx, box.x, box.y, box.w, box.h, PALETTE.outline);
    this.#rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, PALETTE.uiDark);
    this.#rect(ctx, box.x + 2, box.y + 2, box.w - 4, 1, PALETTE.uiBorderDark);
    this.#rect(ctx, box.x + 2, box.y + box.h - 3, box.w - 4, 1, PALETTE.uiBorderLight);
    for (let x = box.x + 6; x < box.x + box.w - 6; x += 23) {
      this.#rect(ctx, x, box.y + 5 + (x % 5), 1, 1, PALETTE.uiBorderDark);
    }
  }

  #bar(ctx, x, y, w, h, ratio, color) {
    const fill = Math.max(0, Math.min(w - 2, Math.round((w - 2) * ratio)));
    this.#rect(ctx, x, y, w, h, PALETTE.outline);
    this.#rect(ctx, x + 1, y + 1, w - 2, h - 2, PALETTE.uiDark);
    this.#rect(ctx, x + 1, y + 1, fill, h - 2, color);
    for (let i = 8; i < w - 2; i += 8) this.#rect(ctx, x + i, y + 1, 1, h - 2, PALETTE.outline);
  }

  #apPips(ctx, x, y, ap, maxAp) {
    for (let i = 0; i < maxAp; i += 1) {
      const px = x + i * 7;
      this.#rect(ctx, px, y + 1, 5, 6, PALETTE.outline);
      this.#rect(ctx, px + 1, y + 2, 3, 4, i < ap ? PALETTE.uiGood : PALETTE.uiDark);
      this.#rect(ctx, px + 1, y + 2, 3, 1, PALETTE.uiBorderLight);
    }
  }

  #cursorBox(ctx, x, y, color) {
    this.#rect(ctx, x + 2, y + 2, 11, 11, PALETTE.outline);
    this.#rect(ctx, x + 3, y + 3, 9, 9, PALETTE.uiDark);
    this.#rect(ctx, x + 3, y + 3, 9, 1, color);
    this.#rect(ctx, x + 3, y + 3, 1, 9, color);
    this.#rect(ctx, x + 11, y + 3, 1, 9, PALETTE.uiBorderDark);
    this.#rect(ctx, x + 3, y + 11, 9, 1, PALETTE.uiBorderDark);
  }

  #cursorLine(ctx, x0, y0, x1, y1, color, size = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      this.#rect(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, size, size, color);
    }
  }

  #rivet(ctx, x, y) {
    this.#rect(ctx, x, y, 4, 4, PALETTE.uiBorderDark);
    this.#rect(ctx, x + 1, y + 1, 2, 2, PALETTE.uiBorderLight);
    this.#rect(ctx, x + 2, y + 2, 1, 1, PALETTE.outline);
  }

  #text(ctx, str, x, y, color = PALETTE.uiText, scale = 1) {
    const text = this.#normalize(str);
    let dx = Math.round(x);
    const dy = Math.round(y);
    for (const ch of text) {
      const glyph = FONT[ch] ?? FONT[' '];
      for (let row = 0; row < glyph.length; row += 1) {
        for (let col = 0; col < glyph[row].length; col += 1) {
          if (glyph[row][col] === '1') this.#rect(ctx, dx + col * scale, dy + row * scale, scale, scale, color);
        }
      }
      dx += 6 * scale;
    }
  }

  #textWidth(str, scale = 1) {
    return this.#normalize(str).length * 6 * scale;
  }

  #wrap(str, maxChars) {
    const words = this.#normalize(str).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      if (word.length > maxChars) {
        if (line) lines.push(line);
        lines.push(word.slice(0, maxChars));
        line = '';
        continue;
      }
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines.length > 0 ? lines : [''];
  }

  #clip(str, max) {
    const text = this.#normalize(str);
    return text.length > max ? `${text.slice(0, Math.max(0, max - 3))}...` : text;
  }

  #normalize(str) {
    return String(str ?? '')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/×/g, 'X')
      .replace(/[^A-Za-z0-9:.,;!?+\-/'"()[\]<>%#* ]/g, ' ')
      .toUpperCase();
  }

  #rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }
}
