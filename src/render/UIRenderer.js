// Low-resolution CRPG interface renderer.
//
// Everything is drawn directly to the 640x480 canvas using hard pixels:
// no browser text, no arcs, no gradients, no vector icons. Panels are dark
// metal/leather boxes with brass edges, rivets, inset wells, muted amber text,
// and small old-CRPG cursor glyphs.

import { PALETTE } from './palette.js';
import { UI_PANEL, VIEWPORT } from './renderConfig.js';
import { getFrame } from './SpriteAtlas.js';

const LOG_BOX = { x: 8, y: UI_PANEL.y + 7, w: 328, h: UI_PANEL.height - 14 };
const STATUS_BOX = { x: 342, y: UI_PANEL.y + 7, w: 138, h: UI_PANEL.height - 14 };
const COMMAND_BOX = { x: 486, y: UI_PANEL.y + 7, w: 146, h: UI_PANEL.height - 14 };
const INVENTORY_BOX = { x: 54, y: 42, w: 532, h: 296 };
const DIALOGUE_BOX = { x: 36, y: 188, w: 568, h: 184 };

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
  // `atlas` is the same sprite atlas the world renderer draws from, so the
  // inventory paper doll shows the exact figure (and equipped gear) seen in play.
  constructor(atlas = null) {
    this.atlas = atlas;
  }

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

  // The opening writ: a full-screen wall of grim amber text, paged.
  drawBriefing(ctx, data) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    for (let y = 0; y < H; y += 3) this.#rect(ctx, 0, y, W, 1, PALETTE.uiDark);
    this.#rect(ctx, 10, 10, W - 20, 1, PALETTE.uiBorderDark);
    this.#rect(ctx, 10, H - 11, W - 20, 1, PALETTE.uiBorderDark);
    this.#rect(ctx, 10, 10, 1, H - 20, PALETTE.uiBorderDark);
    this.#rect(ctx, W - 11, 10, 1, H - 20, PALETTE.uiBorderDark);

    const left = 64;
    const right = W - 64;
    const maxChars = Math.floor((right - left) / 6);

    this.#text(ctx, data.title ?? 'FIELD WRIT', left, 40, PALETTE.uiWarn);
    const pageStr = `${(data.pageIndex ?? 0) + 1} / ${data.pageCount ?? 1}`;
    this.#text(ctx, pageStr, right - this.#textWidth(pageStr), 40, PALETTE.uiDim);
    this.#rect(ctx, left, 54, right - left, 1, PALETTE.uiBorderDark);

    let y = 92;
    for (const para of data.page ?? []) {
      for (const line of this.#wrap(para, maxChars)) {
        this.#text(ctx, line, left, y, PALETTE.uiText);
        y += 12;
      }
      y += 12;
    }

    const last = (data.pageIndex ?? 0) >= (data.pageCount ?? 1) - 1;
    this.#text(ctx, last ? 'ENTER: ENTER THE CHAPEL' : 'ENTER: CONTINUE', left, H - 44, PALETTE.uiGood);
    this.#text(ctx, 'ESC: SKIP', right - this.#textWidth('ESC: SKIP'), H - 44, PALETTE.uiDim);
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
    this.#text(ctx, this.#clip(ui.actorName ?? 'MARA VEY', 21), x, y, PALETTE.uiText);
    y += 9;
    if (ui.role) {
      // Show the short title; the full office name lives in the opening writ.
      this.#text(ctx, this.#clip(ui.role.split(',')[0], 21), x, y, PALETTE.uiDim);
      y += 11;
    } else {
      y += 2;
    }

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
      const hasCarry = typeof ui.carryWeight === 'number' && typeof ui.maxCarryWeight === 'number';
      const packLine = hasCarry
        ? `PACK ${this.#formatWeight(ui.carryWeight)}/${this.#formatWeight(ui.maxCarryWeight)} KG`
        : itemCount === 0 ? 'PACK EMPTY' : `PACK ${itemCount} ITEM${itemCount === 1 ? '' : 'S'}`;
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
    const carry = `CARRY ${this.#formatWeight(ui.carryWeight ?? 0)}/${this.#formatWeight(ui.maxCarryWeight ?? 0)} KG`;
    this.#text(ctx, carry, INVENTORY_BOX.x + INVENTORY_BOX.w - this.#textWidth(carry) - 14, INVENTORY_BOX.y + 6, PALETTE.uiDim);

    const left = { x: INVENTORY_BOX.x + 14, y: INVENTORY_BOX.y + 28, w: 202, h: 171 };
    const figure = { x: INVENTORY_BOX.x + 224, y: INVENTORY_BOX.y + 28, w: 118, h: 171 };
    const right = { x: INVENTORY_BOX.x + 350, y: INVENTORY_BOX.y + 28, w: 168, h: 171 };
    const detail = { x: INVENTORY_BOX.x + 14, y: INVENTORY_BOX.y + 206, w: 504, h: 58 };
    this.#inset(ctx, left);
    this.#inset(ctx, figure);
    this.#inset(ctx, right);
    this.#inset(ctx, detail);

    const items = ui.inventoryItems ?? [];
    const selectedIndex = Math.max(0, Math.min(items.length - 1, ui.inventoryIndex ?? 0));
    const focusItems = ui.inventoryFocus !== 'gear';
    this.#text(ctx, 'ITEMS', left.x + 8, left.y + 8, focusItems ? PALETTE.uiText : PALETTE.uiBorderLight);
    if (items.length === 0) {
      this.#text(ctx, 'PACK EMPTY', left.x + 8, left.y + 25, PALETTE.uiDim);
    } else {
      let y = left.y + 25;
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const selected = focusItems && i === selectedIndex;
        const color = selected ? PALETTE.uiText : PALETTE.uiDim;
        if (selected) this.#rect(ctx, left.x + 5, y - 2, left.w - 10, 10, PALETTE.uiDark);
        const worn = item.equippedCount > 0 ? '*' : ' ';
        const marker = selected ? '>' : worn;
        const name = this.#clip(item.name, 19);
        this.#text(ctx, `${marker} ${item.count}X ${name}`, left.x + 8, y, color);
        const wt = `${this.#formatWeight(item.totalWeight)}KG`;
        this.#text(ctx, wt, left.x + left.w - this.#textWidth(wt) - 8, y, PALETTE.uiDim);
        y += 11;
      }
    }

    this.#drawPaperDoll(ctx, figure, ui.figureSpriteId ?? 'mara-vey', ui.actorName ?? 'MARA VEY');

    const slots = ui.equipmentSlots ?? [];
    const slotIndex = Math.max(0, Math.min(slots.length - 1, ui.equipmentIndex ?? 0));
    const focusGear = ui.inventoryFocus === 'gear';
    this.#text(ctx, 'GEAR', right.x + 8, right.y + 8, focusGear ? PALETTE.uiText : PALETTE.uiBorderLight);
    let sy = right.y + 24;
    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i];
      const selected = focusGear && i === slotIndex;
      if (selected) this.#rect(ctx, right.x + 5, sy - 2, right.w - 10, 18, PALETTE.uiDark);
      const color = selected ? PALETTE.uiText : PALETTE.uiDim;
      this.#text(ctx, `${selected ? '>' : ' '} ${this.#clip(slot.label, 8)}`, right.x + 8, sy, color);
      this.#text(ctx, this.#clip(slot.name, 19), right.x + 17, sy + 9, slot.empty ? PALETTE.uiBorderDark : PALETTE.uiDim);
      sy += 21;
    }

    const slotSelection = slots[slotIndex] ?? null;
    const detailItem = focusGear
      ? (slotSelection && !slotSelection.empty ? slotSelection : null)
      : items[selectedIndex] ?? null;
    this.#drawInventoryDetail(ctx, detail, detailItem, focusGear ? slotSelection : null);

    const footer = 'UP/DN SELECT  LEFT/RIGHT PANEL  1 EQUIP  2 REMOVE  H DRESS  ESC CLOSE';
    this.#text(ctx, footer, INVENTORY_BOX.x + 14, INVENTORY_BOX.y + INVENTORY_BOX.h - 22, PALETTE.uiText);
  }

  #drawInventoryDetail(ctx, box, item, slot) {
    if (!item) {
      const label = slot ? `${slot.label}: Empty` : 'NO ITEM SELECTED';
      this.#text(ctx, label, box.x + 8, box.y + 8, PALETTE.uiBorderLight);
      return;
    }

    const title = slot ? `${slot.label}: ${item.name}` : item.name;
    this.#text(ctx, this.#clip(title, 46), box.x + 8, box.y + 8, PALETTE.uiBorderLight);
    const parts = [`TYPE ${item.type || 'item'}`, `WT ${this.#formatWeight(item.weight ?? item.totalWeight ?? 0)} KG`];
    if (item.equipmentSlot) parts.push(item.equipmentSlot === 'ring' ? 'GEAR RING' : `GEAR ${item.equipmentSlot}`);
    if (Array.isArray(item.wornSlots) && item.wornSlots.length > 0) parts.push(`WORN ${item.wornSlots.join(', ')}`);
    this.#text(ctx, this.#clip(parts.join('  '), 79), box.x + 8, box.y + 20, PALETTE.uiGood);

    let y = box.y + 34;
    for (const line of this.#wrap(item.description || 'NO DESCRIPTION.', 80).slice(0, 2)) {
      this.#text(ctx, line, box.x + 8, y, PALETTE.uiDim);
      y += 9;
    }
  }

  // The paper doll is the live game sprite, scaled up on a small stand, so it is
  // literally the same figure the player controls and reflects equipped gear.
  #drawPaperDoll(ctx, box, spriteId, name) {
    this.#text(ctx, name, box.x + Math.floor((box.w - this.#textWidth(name)) / 2), box.y + 8, PALETTE.uiBorderLight);

    const cx = box.x + Math.floor(box.w / 2);
    const baseY = box.y + box.h - 16;

    // A stepped cast shadow under the boots grounds the figure on its stand.
    this.#rect(ctx, cx - 22, baseY + 2, 44, 1, PALETTE.outline);
    this.#rect(ctx, cx - 18, baseY + 3, 36, 1, PALETTE.uiDark);
    this.#rect(ctx, cx - 11, baseY + 4, 22, 1, PALETTE.uiDark);

    const resolved = this.atlas ? getFrame(this.atlas, spriteId, 'idle', 's', 0) : null;
    if (resolved?.frame) {
      const scale = 2;
      const { sprite, frame } = resolved;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        frame,
        cx - sprite.anchorX * scale,
        baseY - sprite.anchorY * scale,
        sprite.width * scale,
        sprite.height * scale
      );
    } else {
      const label = 'NO FIGURE';
      this.#text(ctx, label, cx - this.#textWidth(label) / 2, box.y + Math.floor(box.h / 2), PALETTE.uiDim);
    }
  }

  #drawDialogue(ctx, ui) {
    const dialogue = ui.dialogue ?? { title: 'INSPECT', lines: [] };
    this.#window(ctx, DIALOGUE_BOX, dialogue.title ?? 'INSPECT');
    const body = { x: DIALOGUE_BOX.x + 14, y: DIALOGUE_BOX.y + 26, w: DIALOGUE_BOX.w - 28, h: DIALOGUE_BOX.h - 58 };
    this.#inset(ctx, body);

    // Wrap every paragraph (keeping blank-line breaks between them) so the whole
    // script is available, then show a scrollable window of it.
    const maxChars = Math.floor((body.w - 16) / 6);
    const all = [];
    for (const para of dialogue.lines ?? []) {
      if (all.length) all.push('');
      all.push(...this.#wrap(para, maxChars));
    }
    const lineH = 10;
    const visible = Math.max(1, Math.floor((body.h - 14) / lineH));
    const maxScroll = Math.max(0, all.length - visible);
    const scroll = Math.max(0, Math.min(dialogue.scroll ?? 0, maxScroll));
    // Write the clamped values back so Game's input handler knows the bounds.
    dialogue.scroll = scroll;
    dialogue.maxScroll = maxScroll;

    let y = body.y + 8;
    for (const line of all.slice(scroll, scroll + visible)) {
      this.#text(ctx, line, body.x + 8, y, PALETTE.uiText);
      y += lineH;
    }
    if (scroll > 0) this.#scrollArrow(ctx, body.x + body.w - 12, body.y + 7, -1, PALETTE.uiBorderLight);
    if (scroll < maxScroll) this.#scrollArrow(ctx, body.x + body.w - 12, body.y + body.h - 11, 1, PALETTE.uiWarn);

    const options = dialogue.options ?? ['ENTER CLOSE'];
    let ox = DIALOGUE_BOX.x + 14;
    for (const option of options) {
      this.#text(ctx, `[${option}]`, ox, DIALOGUE_BOX.y + DIALOGUE_BOX.h - 20, PALETTE.uiGood);
      ox += this.#textWidth(`[${option}]`) + 14;
    }
    if (maxScroll > 0) {
      const hint = 'UP/DN SCROLL';
      this.#text(ctx, hint, DIALOGUE_BOX.x + DIALOGUE_BOX.w - this.#textWidth(hint) - 14, DIALOGUE_BOX.y + DIALOGUE_BOX.h - 20, PALETTE.uiDim);
    }
  }

  // A small solid scroll triangle (dir -1 = up, 1 = down).
  #scrollArrow(ctx, x, y, dir, color) {
    for (let i = 0; i < 4; i += 1) {
      const w = dir < 0 ? i * 2 + 1 : 7 - i * 2;
      this.#rect(ctx, x - Math.floor(w / 2), y + i, w, 1, color);
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

  #formatWeight(value) {
    const rounded = Math.round((Number(value) || 0) * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
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
