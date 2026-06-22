// Low-resolution CRPG interface renderer.
//
// Everything is drawn directly to the 640x480 canvas using hard pixels:
// no browser text, no arcs, no gradients, no vector icons. Panels are dark
// metal/leather boxes with brass edges, rivets, inset wells, muted amber text,
// and small old-CRPG cursor glyphs.

import { PALETTE } from './palette.js';
import { UI_PANEL, VIEWPORT } from './renderConfig.js';
import { getFrame } from './SpriteAtlas.js';
import {
  DIALOGUE_BOX,
  DIALOGUE_LINE_HEIGHT,
  DIALOGUE_OPTION_LINE_HEIGHT,
  buildDialogueLayout,
  wrapUiText
} from '../ui/dialogueLayout.js';
import {
  INVENTORY_ACTION_BOXES,
  INVENTORY_BOX,
  INVENTORY_GRID,
  INVENTORY_PANELS,
  INVENTORY_SPLIT_BOX,
  inventoryActionBox,
  inventoryActionMenuActions,
  inventoryActionMenuBox,
  inventoryCapacity,
  inventoryGearBox,
  inventorySlotBox
} from '../ui/inventoryLayout.js';
import { JOURNAL_ARROW_BOXES, JOURNAL_BOOK } from '../ui/journalLayout.js';
import {
  TRADE_BOX,
  TRADE_BUTTONS,
  TRADE_PANELS,
  TRADE_ROW,
  tradePlayerRowBox,
  tradeTraderRowBox
} from '../ui/tradeLayout.js';

const LOG_BOX = { x: 8, y: UI_PANEL.y + 7, w: 328, h: UI_PANEL.height - 14 };
const STATUS_BOX = { x: 342, y: UI_PANEL.y + 7, w: 138, h: UI_PANEL.height - 14 };
const COMMAND_BOX = { x: 486, y: UI_PANEL.y + 7, w: 146, h: UI_PANEL.height - 14 };
const LOOT_BOX = { x: 104, y: 54, w: 432, h: 270 };
const LOOT_LIST_BOX = { x: LOOT_BOX.x + 16, y: LOOT_BOX.y + 32, w: 222, h: 164 };
const LOOT_DETAIL_BOX = { x: LOOT_BOX.x + 252, y: LOOT_BOX.y + 32, w: 148, h: 164 };
const OUTCOME_PREFIXES = [
  { text: 'SUCCESS:', color: PALETTE.uiSuccess },
  { text: 'FAILED:', color: PALETTE.uiFailure }
];
// Aged-paper palette for the journal book (dark ink on dirty parchment).
const PARCHMENT = {
  base: '#c7b487',
  hi: '#d8c79a',
  lo: '#9a8a60',
  rule: '#bca877',
  fox: '#a07c44',
  ink: '#241b12',
  inkDim: '#5e4f35',
  flap: '#cfbd88'
};

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
    if (ui.screen === 'loot') this.#drawLoot(ctx, ui);
    if (ui.screen === 'trade') this.#drawTrade(ctx, ui);
    if (ui.screen === 'journal') this.#drawJournal(ctx, ui);
    this.#drawHud(ctx, ui);
    if (ui.screen === 'dialogue') this.#drawDialogue(ctx, ui);
    if (ui.areaTitle && !ui.screen) this.#drawAreaTitle(ctx, ui.areaTitle);
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
    const advanceText = last
      ? (data.lastPrompt ?? 'ENTER: ENTER THE CHAPEL')
      : (data.nextPrompt ?? 'ENTER: CONTINUE');
    const skipText = data.skipPrompt ?? 'ESC: SKIP';
    this.#text(ctx, advanceText, left, H - 44, PALETTE.uiGood);
    if (skipText) this.#text(ctx, skipText, right - this.#textWidth(skipText), H - 44, PALETTE.uiDim);
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
      this.#outcomeText(ctx, line, LOG_BOX.x + 8, y, PALETTE.uiDim);
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

    const itemsBox = INVENTORY_PANELS.items;
    const figure = INVENTORY_PANELS.figure;
    const gear = INVENTORY_PANELS.gear;
    const detail = INVENTORY_PANELS.detail;
    this.#inset(ctx, itemsBox);
    this.#inset(ctx, figure);
    this.#inset(ctx, gear);
    this.#inset(ctx, detail);

    const items = ui.inventoryItems ?? [];
    const selectedIndex = Math.max(0, Math.min(items.length - 1, ui.inventoryIndex ?? 0));
    const focusItems = ui.inventoryFocus !== 'gear';
    const movingIndex = Number.isInteger(ui.inventoryMoveIndex) ? ui.inventoryMoveIndex : null;
    this.#text(ctx, 'ITEMS', itemsBox.x + 8, itemsBox.y + 8, focusItems ? PALETTE.uiText : PALETTE.uiBorderLight);
    const ducats = `DUCATS ${ui.ducats ?? 0}`;
    this.#text(ctx, ducats, itemsBox.x + itemsBox.w - this.#textWidth(ducats) - 8, itemsBox.y + 8, PALETTE.uiWarn);
    this.#text(ctx, movingIndex !== null ? 'PLACE ITEM' : 'CLICK SAME SLOT TO MOVE', itemsBox.x + 8, itemsBox.y + 20, movingIndex !== null ? PALETTE.uiWarn : PALETTE.uiDim);

    for (let i = 0; i < inventoryCapacity(); i += 1) {
      this.#drawInventorySlot(ctx, inventorySlotBox(i), items[i] ?? null, {
        selected: focusItems && i === selectedIndex,
        moving: movingIndex === i
      });
    }
    if (items.length === 0) {
      this.#text(ctx, 'PACK EMPTY', itemsBox.x + 8, itemsBox.y + itemsBox.h - 14, PALETTE.uiDim);
    }
    if (items.length > inventoryCapacity()) {
      const more = `+${items.length - inventoryCapacity()} MORE`;
      this.#text(ctx, more, itemsBox.x + itemsBox.w - this.#textWidth(more) - 8, itemsBox.y + itemsBox.h - 14, PALETTE.uiWarn);
    }

    this.#drawPaperDoll(ctx, figure, ui.figureSpriteId ?? 'mara-vey', ui.actorName ?? 'MARA VEY');

    const slots = ui.equipmentSlots ?? [];
    const slotIndex = Math.max(0, Math.min(slots.length - 1, ui.equipmentIndex ?? 0));
    const focusGear = ui.inventoryFocus === 'gear';
    this.#text(ctx, 'GEAR', gear.x + 8, gear.y + 8, focusGear ? PALETTE.uiText : PALETTE.uiBorderLight);
    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i];
      const selected = focusGear && i === slotIndex;
      const slotBox = inventoryGearBox(i);
      if (selected) this.#rect(ctx, slotBox.x, slotBox.y, slotBox.w, slotBox.h, PALETTE.uiDark);
      const color = selected ? PALETTE.uiText : PALETTE.uiDim;
      this.#text(ctx, `${selected ? '>' : ' '} ${this.#clip(slot.label, 8)}`, slotBox.x + 3, slotBox.y + 3, color);
      this.#text(ctx, this.#clip(slot.name, 16), slotBox.x + 12, slotBox.y + 12, slot.empty ? PALETTE.uiBorderDark : PALETTE.uiDim);
    }

    const slotSelection = slots[slotIndex] ?? null;
    const detailItem = focusGear
      ? (slotSelection && !slotSelection.empty ? slotSelection : null)
      : items[selectedIndex] ?? null;
    this.#drawInventoryDetail(ctx, detail, detailItem, focusGear ? slotSelection : null);

    const footer = 'CLICK SELECT  RIGHT CLICK ACTIONS  SHIFT SORT  CTRL SPLIT  ESC CLOSE';
    this.#text(ctx, footer, INVENTORY_BOX.x + 14, INVENTORY_BOX.y + INVENTORY_BOX.h - 22, PALETTE.uiText);
    this.#drawInventoryActionButton(ctx, INVENTORY_ACTION_BOXES.sort, 'SORT');
    if (ui.inventoryActionMenu) this.#drawInventoryActionMenu(ctx, ui.inventoryActionMenu);
    if (ui.inventorySplit) this.#drawInventorySplit(ctx, ui.inventorySplit);
  }

  #drawInventorySlot(ctx, box, item, state = {}) {
    if (!box) return;
    this.#rect(ctx, box.x, box.y, box.w, box.h, PALETTE.outline);
    this.#rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, PALETTE.uiPanel);
    this.#rect(ctx, box.x + 2, box.y + 2, box.w - 4, 1, PALETTE.uiBorderDark);
    this.#rect(ctx, box.x + 2, box.y + box.h - 3, box.w - 4, 1, PALETTE.uiDark);
    if (state.selected) {
      this.#rect(ctx, box.x + 1, box.y + 1, box.w - 2, 1, PALETTE.uiText);
      this.#rect(ctx, box.x + 1, box.y + 1, 1, box.h - 2, PALETTE.uiText);
      this.#rect(ctx, box.x + box.w - 2, box.y + 1, 1, box.h - 2, PALETTE.uiBorderLight);
      this.#rect(ctx, box.x + 1, box.y + box.h - 2, box.w - 2, 1, PALETTE.uiBorderLight);
    }
    if (state.moving) {
      this.#rect(ctx, box.x + 4, box.y + 4, box.w - 8, 1, PALETTE.uiWarn);
      this.#rect(ctx, box.x + 4, box.y + box.h - 5, box.w - 8, 1, PALETTE.uiWarn);
    }
    if (!item) return;

    this.#drawItemIcon(ctx, item, box);
    if (item.equippedCount > 0) this.#text(ctx, '*', box.x + 4, box.y + 4, PALETTE.uiWarn);
    if (item.count > 1) {
      const label = item.count > 99 ? '99+' : String(item.count);
      const tx = box.x + box.w - this.#textWidth(label) - 3;
      const ty = box.y + box.h - 10;
      this.#rect(ctx, tx - 1, ty - 1, this.#textWidth(label) + 2, 9, PALETTE.outline);
      this.#text(ctx, label, tx, ty, PALETTE.uiText);
    }
  }

  #drawItemIcon(ctx, item, box) {
    const model = item.groundModel ?? item.type ?? 'item';
    const cx = box.x + Math.floor(box.w / 2);
    const cy = box.y + Math.floor(box.h / 2);

    if (model === 'dressing') {
      this.#rect(ctx, cx - 10, cy - 8, 20, 16, PALETTE.outline);
      this.#rect(ctx, cx - 9, cy - 7, 18, 14, PALETTE.uiBorderLight);
      this.#rect(ctx, cx - 8, cy - 6, 16, 12, PALETTE.clothTan);
      this.#rect(ctx, cx - 7, cy - 5, 14, 2, PALETTE.hostBone);
      this.#rect(ctx, cx - 2, cy - 6, 4, 12, PALETTE.uiText);
      this.#rect(ctx, cx - 8, cy - 1, 16, 4, PALETTE.uiText);
      this.#rect(ctx, cx - 5, cy - 6, 1, 12, PALETTE.uiBorderDark);
      this.#rect(ctx, cx + 5, cy - 6, 1, 12, PALETTE.uiBorderDark);
    } else if (model === 'food') {
      this.#rect(ctx, cx - 8, cy - 10, 16, 20, PALETTE.outline);
      this.#rect(ctx, cx - 7, cy - 9, 14, 3, PALETTE.hostBone);
      this.#rect(ctx, cx - 7, cy - 6, 14, 14, PALETTE.stoneLight);
      this.#rect(ctx, cx - 6, cy + 8, 12, 2, PALETTE.stoneDark);
      this.#rect(ctx, cx - 7, cy - 2, 14, 7, PALETTE.clothTan);
      this.#rect(ctx, cx - 4, cy, 8, 1, PALETTE.rustDark);
      this.#rect(ctx, cx + 5, cy - 5, 1, 12, PALETTE.stoneDark);
      this.#rect(ctx, cx - 5, cy - 7, 4, 1, PALETTE.uiText);
    } else if (model === 'rounds') {
      for (let i = 0; i < 4; i += 1) {
        const x = cx - 10 + i * 6;
        this.#rect(ctx, x, cy - 8, 4, 13, PALETTE.uiBorderDark);
        this.#rect(ctx, x + 1, cy - 9, 2, 2, PALETTE.uiWarn);
        this.#rect(ctx, x + 1, cy - 6, 2, 9, PALETTE.uiBorderLight);
      }
    } else if (model === 'key') {
      this.#rect(ctx, cx - 10, cy - 2, 17, 3, PALETTE.uiBorderLight);
      this.#rect(ctx, cx + 4, cy + 1, 3, 5, PALETTE.uiBorderLight);
      this.#rect(ctx, cx + 8, cy + 1, 3, 3, PALETTE.uiBorderLight);
      this.#rect(ctx, cx - 12, cy - 5, 7, 9, PALETTE.uiBorderDark);
      this.#rect(ctx, cx - 10, cy - 3, 3, 5, PALETTE.uiDark);
    } else if (model === 'paper') {
      this.#rect(ctx, cx - 8, cy - 10, 16, 19, PALETTE.uiText);
      this.#rect(ctx, cx - 6, cy - 8, 12, 15, PALETTE.clothTan);
      this.#rect(ctx, cx + 3, cy - 8, 3, 3, PALETTE.uiBorderDark);
      this.#rect(ctx, cx - 4, cy - 3, 8, 1, PALETTE.uiBorderDark);
      this.#rect(ctx, cx - 4, cy + 1, 7, 1, PALETTE.uiBorderDark);
    } else if (model === 'vial') {
      this.#rect(ctx, cx - 4, cy - 10, 8, 3, PALETTE.uiBorderLight);
      this.#rect(ctx, cx - 6, cy - 7, 12, 17, PALETTE.outline);
      this.#rect(ctx, cx - 5, cy - 6, 10, 15, PALETTE.clothBlueDark);
      this.#rect(ctx, cx - 4, cy + 1, 8, 7, PALETTE.clothBlue);
      this.#rect(ctx, cx - 3, cy - 4, 2, 5, PALETTE.uiText);
    } else if (model === 'shard') {
      this.#rect(ctx, cx - 3, cy - 12, 6, 4, PALETTE.uiBorderLight);
      this.#rect(ctx, cx - 6, cy - 8, 11, 6, PALETTE.stoneDust);
      this.#rect(ctx, cx - 9, cy - 2, 13, 7, PALETTE.hostGold);
      this.#rect(ctx, cx - 11, cy + 5, 9, 5, PALETTE.stoneMid);
    } else if (model === 'ball') {
      this.#rect(ctx, cx - 6, cy - 8, 12, 2, PALETTE.clothBlueDark);
      this.#rect(ctx, cx - 9, cy - 6, 18, 12, PALETTE.clothBlue);
      this.#rect(ctx, cx - 6, cy + 6, 12, 2, PALETTE.clothBlueDark);
      this.#rect(ctx, cx - 4, cy - 3, 4, 2, PALETTE.uiBorderLight);
    } else if (model === 'boots') {
      this.#rect(ctx, cx - 10, cy - 6, 7, 15, PALETTE.woodDark);
      this.#rect(ctx, cx + 2, cy - 6, 7, 15, PALETTE.woodDark);
      this.#rect(ctx, cx - 12, cy + 7, 12, 4, PALETTE.outline);
      this.#rect(ctx, cx, cy + 7, 12, 4, PALETTE.outline);
    } else if (model === 'coat') {
      this.#rect(ctx, cx - 8, cy - 10, 16, 20, PALETTE.clothDark);
      this.#rect(ctx, cx - 6, cy - 8, 12, 18, PALETTE.woodDark);
      this.#rect(ctx, cx - 1, cy - 7, 2, 17, PALETTE.outline);
      this.#rect(ctx, cx - 9, cy - 2, 4, 10, PALETTE.clothDark);
      this.#rect(ctx, cx + 5, cy - 2, 4, 10, PALETTE.clothDark);
    } else if (model === 'hood') {
      this.#rect(ctx, cx - 8, cy - 6, 16, 13, PALETTE.clothDark);
      this.#rect(ctx, cx - 6, cy - 10, 12, 7, PALETTE.woodDark);
      this.#rect(ctx, cx - 4, cy - 4, 8, 6, PALETTE.outline);
    } else if (model === 'vest') {
      this.#rect(ctx, cx - 8, cy - 9, 16, 18, PALETTE.woodDark);
      this.#rect(ctx, cx - 6, cy - 7, 5, 14, PALETTE.rustDark);
      this.#rect(ctx, cx + 1, cy - 7, 5, 14, PALETTE.rustDark);
      this.#rect(ctx, cx - 1, cy - 8, 2, 16, PALETTE.outline);
    } else if (model === 'ring') {
      this.#rect(ctx, cx - 6, cy - 8, 12, 4, PALETTE.uiBorderDark);
      this.#rect(ctx, cx - 9, cy - 4, 18, 8, PALETTE.uiBorderLight);
      this.#rect(ctx, cx - 6, cy + 4, 12, 4, PALETTE.uiBorderDark);
      this.#rect(ctx, cx - 4, cy - 2, 8, 4, PALETTE.uiDark);
    } else if (model === 'necklace') {
      this.#rect(ctx, cx - 8, cy - 8, 3, 3, PALETTE.uiBorderLight);
      this.#rect(ctx, cx + 5, cy - 8, 3, 3, PALETTE.uiBorderLight);
      this.#rect(ctx, cx - 6, cy - 5, 2, 7, PALETTE.uiBorderLight);
      this.#rect(ctx, cx + 4, cy - 5, 2, 7, PALETTE.uiBorderLight);
      this.#rect(ctx, cx - 3, cy + 4, 6, 8, PALETTE.uiWarn);
      this.#rect(ctx, cx - 1, cy + 6, 2, 4, PALETTE.uiBorderDark);
    } else {
      this.#rect(ctx, cx - 7, cy - 7, 14, 14, PALETTE.uiBorderDark);
      this.#rect(ctx, cx - 5, cy - 9, 10, 18, PALETTE.uiBorderLight);
      this.#rect(ctx, cx - 4, cy - 4, 8, 8, PALETTE.uiWarn);
      this.#rect(ctx, cx - 2, cy - 2, 4, 4, PALETTE.uiDark);
    }
  }

  #drawInventoryActionButton(ctx, box, label, options = {}) {
    const disabled = Boolean(options.disabled);
    this.#rect(ctx, box.x, box.y, box.w, box.h, PALETTE.outline);
    this.#rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, disabled ? PALETTE.uiDark : PALETTE.uiPanel);
    this.#rect(ctx, box.x + 2, box.y + 2, box.w - 4, 1, disabled ? PALETTE.uiBorderDark : PALETTE.uiBorderLight);
    this.#rect(ctx, box.x + 2, box.y + box.h - 3, box.w - 4, 1, PALETTE.uiBorderDark);
    const text = this.#clip(label, Math.max(1, Math.floor((box.w - 8) / 6)));
    this.#text(ctx, text, box.x + Math.floor((box.w - this.#textWidth(text)) / 2), box.y + 4, disabled ? PALETTE.uiDim : PALETTE.uiText);
  }

  #drawInventoryActionMenu(ctx, actionMenu) {
    const menu = inventoryActionMenuBox(actionMenu.anchor, actionMenu);
    if (!menu) return;
    this.#rect(ctx, menu.x - 1, menu.y - 1, menu.w + 2, menu.h + 2, PALETTE.outline);
    this.#rect(ctx, menu.x, menu.y, menu.w, menu.h, PALETTE.uiDark);
    this.#rect(ctx, menu.x + 1, menu.y + 1, menu.w - 2, 1, PALETTE.uiBorderDark);
    this.#rect(ctx, menu.x + 1, menu.y + menu.h - 2, menu.w - 2, 1, PALETTE.uiBorderDark);

    for (const action of inventoryActionMenuActions(actionMenu)) {
      const box = inventoryActionBox(action, actionMenu.anchor, actionMenu);
      const label = action === 'equip'
        ? (actionMenu.canUnequip ? 'UNEQUIP' : 'EQUIP')
        : action.toUpperCase();
      this.#rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiPanel);
      this.#rect(ctx, box.x, box.y, box.w, 1, PALETTE.uiBorderDark);
      this.#text(ctx, label, box.x + 6, box.y + 4, PALETTE.uiText);
    }
  }

  #drawInventorySplit(ctx, split) {
    const modal = INVENTORY_SPLIT_BOX.box;
    this.#rect(ctx, modal.x - 4, modal.y - 4, modal.w + 8, modal.h + 8, 'rgba(5, 5, 5, 0.62)');
    this.#window(ctx, modal, 'SPLIT STACK');
    const item = split.item ?? {};
    this.#text(ctx, this.#clip(item.name ?? 'ITEM', 30), modal.x + 12, modal.y + 27, PALETTE.uiBorderLight);
    const count = `DROP ${split.amount ?? 1} OF ${split.max ?? 1}`;
    this.#text(ctx, count, modal.x + 12, modal.y + 42, PALETTE.uiText);

    const slider = INVENTORY_SPLIT_BOX.slider;
    const max = Math.max(1, split.max ?? 1);
    const amount = Math.max(1, Math.min(max, split.amount ?? 1));
    const ratio = max <= 1 ? 0 : (amount - 1) / (max - 1);
    const fill = Math.round(slider.w * ratio);
    this.#rect(ctx, slider.x, slider.y, slider.w, slider.h, PALETTE.outline);
    this.#rect(ctx, slider.x + 1, slider.y + 3, slider.w - 2, 4, PALETTE.uiDark);
    this.#rect(ctx, slider.x + 1, slider.y + 3, Math.max(1, fill - 2), 4, PALETTE.uiWarn);
    const knobX = slider.x + Math.round((slider.w - 5) * ratio);
    this.#rect(ctx, knobX, slider.y - 3, 5, slider.h + 6, PALETTE.uiBorderLight);

    this.#drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.minus, '<');
    this.#drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.plus, '>');
    this.#drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.confirm, 'DROP');
    this.#drawInventoryActionButton(ctx, INVENTORY_SPLIT_BOX.cancel, 'BACK');
    this.#text(ctx, 'LEFT RIGHT COUNT  ENTER DROP  ESC BACK', modal.x + 15, modal.y + modal.h - 15, PALETTE.uiDim);
  }

  #drawInventoryDetail(ctx, box, item, slot) {
    if (!item) {
      const label = slot ? `${slot.label}: Empty` : 'NO ITEM SELECTED';
      this.#text(ctx, label, box.x + 8, box.y + 8, PALETTE.uiBorderLight);
      return;
    }

    const title = slot ? `${slot.label}: ${item.name}` : item.name;
    const textCols = Math.max(20, Math.floor((box.w - 16) / 6));
    this.#text(ctx, this.#clip(title, textCols), box.x + 8, box.y + 8, PALETTE.uiBorderLight);
    const parts = [`TYPE ${item.type || 'item'}`, `WT ${this.#formatWeight(item.weight ?? item.totalWeight ?? 0)} KG`];
    if (item.equipmentSlot) parts.push(item.equipmentSlot === 'ring' ? 'GEAR RING' : `GEAR ${item.equipmentSlot}`);
    if (Array.isArray(item.wornSlots) && item.wornSlots.length > 0) parts.push(`WORN ${item.wornSlots.join(', ')}`);
    this.#text(ctx, this.#clip(parts.join('  '), textCols), box.x + 8, box.y + 20, PALETTE.uiGood);

    let y = box.y + 34;
    for (const line of this.#wrap(item.description || 'NO DESCRIPTION.', textCols).slice(0, 3)) {
      this.#text(ctx, line, box.x + 8, y, PALETTE.uiDim);
      y += 9;
    }
  }

  #drawLoot(ctx, ui) {
    this.#screenBackdrop(ctx);
    const loot = ui.loot ?? { title: 'Loot', entries: [], index: 0 };
    this.#window(ctx, LOOT_BOX, `LOOT: ${loot.title ?? 'CACHE'}`);
    this.#inset(ctx, LOOT_LIST_BOX);
    this.#inset(ctx, LOOT_DETAIL_BOX);

    const entries = loot.entries ?? [];
    const selectedIndex = Math.max(0, Math.min(entries.length - 1, loot.index ?? 0));
    this.#text(ctx, 'MARKED', LOOT_LIST_BOX.x + 8, LOOT_LIST_BOX.y + 8, PALETTE.uiBorderLight);

    if (!entries.length) {
      this.#text(ctx, 'NOTHING USEFUL', LOOT_LIST_BOX.x + 8, LOOT_LIST_BOX.y + 28, PALETTE.uiDim);
    }
    let y = LOOT_LIST_BOX.y + 25;
    for (let i = 0; i < Math.min(entries.length, 6); i += 1) {
      const entry = entries[i];
      const selected = i === selectedIndex;
      if (selected) this.#rect(ctx, LOOT_LIST_BOX.x + 5, y - 3, LOOT_LIST_BOX.w - 10, 24, PALETTE.uiDark);
      const iconBox = { x: LOOT_LIST_BOX.x + 8, y: y - 5, w: 24, h: 24 };
      this.#drawInventorySlot(ctx, iconBox, entry, { selected: false, moving: false });
      const color = selected ? PALETTE.uiText : PALETTE.uiDim;
      this.#text(ctx, `${selected ? '>' : ' '} ${entry.count}X`, LOOT_LIST_BOX.x + 38, y, color);
      this.#text(ctx, this.#clip(entry.name, 24), LOOT_LIST_BOX.x + 38, y + 10, color);
      y += 26;
    }

    const selected = entries[selectedIndex] ?? null;
    if (selected) {
      this.#text(ctx, this.#clip(selected.name, 20), LOOT_DETAIL_BOX.x + 8, LOOT_DETAIL_BOX.y + 8, PALETTE.uiBorderLight);
      const wt = `WT ${this.#formatWeight(selected.totalWeight ?? selected.weight ?? 0)} KG`;
      this.#text(ctx, wt, LOOT_DETAIL_BOX.x + 8, LOOT_DETAIL_BOX.y + 21, PALETTE.uiGood);
      let dy = LOOT_DETAIL_BOX.y + 38;
      for (const line of this.#wrap(selected.description || 'NO DESCRIPTION.', 21).slice(0, 9)) {
        this.#text(ctx, line, LOOT_DETAIL_BOX.x + 8, dy, PALETTE.uiDim);
        dy += 9;
      }
    }

    this.#text(ctx, 'UP DN MARK', LOOT_BOX.x + 20, LOOT_BOX.y + LOOT_BOX.h - 39, PALETTE.uiDim);
    this.#text(ctx, 'E PICK ITEM', LOOT_BOX.x + 142, LOOT_BOX.y + LOOT_BOX.h - 39, PALETTE.uiText);
    this.#text(ctx, 'A PICK ALL', LOOT_BOX.x + 264, LOOT_BOX.y + LOOT_BOX.h - 39, PALETTE.uiText);
    this.#text(ctx, 'SPACE LEAVE', LOOT_BOX.x + 144, LOOT_BOX.y + LOOT_BOX.h - 22, PALETTE.uiDim);
  }

  #drawTrade(ctx, ui) {
    this.#screenBackdrop(ctx);
    const trade = ui.trade ?? { traderName: 'Trader', traderItems: [], playerItems: [], stockIndex: 0, playerIndex: 0 };
    this.#window(ctx, TRADE_BOX, trade.title ?? `TRADE: ${trade.traderName ?? 'TRADER'}`);
    this.#inset(ctx, TRADE_PANELS.trader);
    this.#inset(ctx, TRADE_PANELS.player);
    this.#inset(ctx, TRADE_PANELS.detail);

    const traderItems = trade.traderItems ?? [];
    const playerItems = trade.playerItems ?? [];
    const stockIndex = Math.max(0, Math.min(traderItems.length - 1, trade.stockIndex ?? 0));
    const playerIndex = Math.max(0, Math.min(playerItems.length - 1, trade.playerIndex ?? 0));
    const focusStock = trade.focus !== 'player';

    const stockLabel = this.#clip(`${trade.traderName ?? 'TRADER'} STOCK`, 22);
    this.#text(ctx, stockLabel, TRADE_PANELS.trader.x + 8, TRADE_PANELS.trader.y + 8, focusStock ? PALETTE.uiText : PALETTE.uiBorderLight);
    this.#text(ctx, 'PRICE', TRADE_PANELS.trader.x + TRADE_PANELS.trader.w - 45, TRADE_PANELS.trader.y + 8, PALETTE.uiDim);
    this.#text(ctx, `YOUR DUCATS ${trade.ducats ?? 0}`, TRADE_PANELS.player.x + 8, TRADE_PANELS.player.y + 8, PALETTE.uiWarn);
    this.#text(ctx, 'YOUR PACK', TRADE_PANELS.player.x + 8, TRADE_PANELS.player.y + 20, focusStock ? PALETTE.uiBorderLight : PALETTE.uiText);
    this.#text(ctx, 'WT', TRADE_PANELS.player.x + TRADE_PANELS.player.w - 27, TRADE_PANELS.player.y + 20, PALETTE.uiDim);
    this.#rect(ctx, TRADE_PANELS.trader.x + 8, TRADE_PANELS.trader.y + 20, TRADE_PANELS.trader.w - 16, 1, PALETTE.uiBorderDark);
    this.#rect(ctx, TRADE_PANELS.player.x + 8, TRADE_PANELS.player.y + 32, TRADE_PANELS.player.w - 16, 1, PALETTE.uiBorderDark);

    for (let i = 0; i < TRADE_ROW.visible; i += 1) {
      this.#drawTradeStockRow(ctx, tradeTraderRowBox(i), traderItems[i] ?? null, {
        selected: focusStock && i === stockIndex
      });
      this.#drawTradePackRow(ctx, tradePlayerRowBox(i), playerItems[i] ?? null, {
        selected: !focusStock && i === playerIndex
      });
    }

    const selected = focusStock ? traderItems[stockIndex] : playerItems[playerIndex];
    this.#drawTradeDetail(ctx, trade, selected, focusStock);
    this.#drawInventoryActionButton(ctx, TRADE_BUTTONS.buy, 'BUY', { disabled: !focusStock || !trade.canBuy });
    this.#drawInventoryActionButton(ctx, TRADE_BUTTONS.close, 'CLOSE');
    this.#text(ctx, 'UP DN SELECT  A D SIDE  E BUY  ESC CLOSE', TRADE_BOX.x + 18, TRADE_BOX.y + TRADE_BOX.h - 43, PALETTE.uiDim);
  }

  #drawTradeStockRow(ctx, box, item, state = {}) {
    if (!box) return;
    if (state.selected) {
      this.#rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiDark);
      this.#rect(ctx, box.x, box.y, 3, box.h, item?.affordable === false ? PALETTE.uiFailure : PALETTE.uiWarn);
      this.#rect(ctx, box.x + 3, box.y, box.w - 3, 1, PALETTE.uiBorderDark);
      this.#rect(ctx, box.x + 3, box.y + box.h - 1, box.w - 3, 1, PALETTE.uiBorderDark);
    }
    if (!item) return;
    const iconBox = { x: box.x + 5, y: box.y + 1, w: 18, h: 18 };
    this.#drawInventorySlot(ctx, iconBox, item, { selected: false });
    const sold = item.count <= 0;
    const blocked = !sold && item.affordable === false;
    const color = sold ? PALETTE.uiBorderDark : (state.selected ? PALETTE.uiText : PALETTE.uiDim);
    const priceColor = sold ? PALETTE.uiBorderDark : (blocked ? PALETTE.uiFailure : PALETTE.uiWarn);
    const count = item.count > 0 ? `${item.count}X` : 'SOLD';
    const price = `${item.price ?? 0}D`;
    const priceW = this.#textWidth(price) + 8;
    const priceX = box.x + box.w - priceW - 4;
    this.#text(ctx, this.#clip(item.name, 18), box.x + 29, box.y + 3, color);
    this.#text(ctx, count, box.x + 29, box.y + 12, priceColor);
    this.#rect(ctx, priceX, box.y + 4, priceW, 12, PALETTE.outline);
    this.#rect(ctx, priceX + 1, box.y + 5, priceW - 2, 10, blocked || sold ? PALETTE.uiDark : PALETTE.uiPanel);
    this.#text(ctx, price, priceX + 4, box.y + 7, priceColor);
  }

  #drawTradePackRow(ctx, box, item, state = {}) {
    if (!box) return;
    if (state.selected) {
      this.#rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiDark);
      this.#rect(ctx, box.x, box.y, 3, box.h, PALETTE.uiGood);
      this.#rect(ctx, box.x + 3, box.y, box.w - 3, 1, PALETTE.uiBorderDark);
      this.#rect(ctx, box.x + 3, box.y + box.h - 1, box.w - 3, 1, PALETTE.uiBorderDark);
    }
    if (!item) return;
    const iconBox = { x: box.x + 5, y: box.y + 1, w: 18, h: 18 };
    this.#drawInventorySlot(ctx, iconBox, item, { selected: false });
    const color = state.selected ? PALETTE.uiText : PALETTE.uiDim;
    const weight = `WT ${this.#formatWeight(item.totalWeight ?? item.weight ?? 0)}`;
    this.#text(ctx, this.#clip(item.name, 19), box.x + 29, box.y + 3, color);
    this.#text(ctx, `${item.count}X`, box.x + 29, box.y + 12, PALETTE.uiGood);
    this.#text(ctx, weight, box.x + box.w - this.#textWidth(weight) - 5, box.y + 12, PALETTE.uiGood);
  }

  #drawTradeDetail(ctx, trade, item, focusStock) {
    const box = TRADE_PANELS.detail;
    if (!item) {
      this.#text(ctx, focusStock ? 'NO STOCK SELECTED' : 'PACK EMPTY', box.x + 8, box.y + 8, PALETTE.uiBorderLight);
      return;
    }
    this.#text(ctx, this.#clip(item.name, 36), box.x + 8, box.y + 8, PALETTE.uiBorderLight);
    const ask = focusStock
      ? `PRICE ${item.price ?? 0} DUCATS  STOCK ${item.count ?? 0}`
      : `COUNT ${item.count ?? 0}  WT ${this.#formatWeight(item.totalWeight ?? item.weight ?? 0)} KG`;
    this.#text(ctx, ask, box.x + 8, box.y + 20, focusStock ? PALETTE.uiWarn : PALETTE.uiGood);
    const status = focusStock
      ? item.count <= 0
        ? 'SOLD OUT'
        : (trade.canBuy ? 'E BUY: TAKE 1' : trade.buyHint ?? 'NOT ENOUGH DUCATS')
      : this.#clip(item.description || 'NO DESCRIPTION.', 58);
    const statusColor = focusStock && item.count > 0
      ? (trade.canBuy ? PALETTE.uiGood : PALETTE.uiFailure)
      : PALETTE.uiDim;
    this.#text(ctx, this.#clip(status, 58), box.x + 8, box.y + 32, statusColor);
    if (focusStock) {
      this.#text(ctx, this.#clip(item.description || 'NO DESCRIPTION.', 58), box.x + 8, box.y + 44, PALETTE.uiDim);
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

  // The quest journal: a worn leather book with section tabs. It is the run's
  // source of truth: the live quest checklist, findings log, faction codex, and
  // the current Censure file.
  #drawJournal(ctx, ui) {
    this.#screenBackdrop(ctx);

    const B = JOURNAL_BOOK;
    const noise = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

    // Soft drop shadow, then scuffed leather with brass corner fittings.
    this.#rect(ctx, B.x + 5, B.y + 7, B.w, B.h, 'rgba(5, 5, 5, 0.5)');
    this.#rect(ctx, B.x - 1, B.y - 1, B.w + 2, B.h + 2, PALETTE.outline);
    this.#rect(ctx, B.x, B.y, B.w, B.h, PALETTE.woodDark);
    this.#rect(ctx, B.x + 1, B.y + 1, B.w - 2, B.h - 2, PALETTE.woodMid);
    this.#rect(ctx, B.x + 1, B.y + 1, B.w - 2, 1, PALETTE.woodLight);
    this.#rect(ctx, B.x + 1, B.y + 1, 1, B.h - 2, PALETTE.woodLight);
    this.#rect(ctx, B.x + 1, B.y + B.h - 2, B.w - 2, 1, PALETTE.outline);
    this.#rect(ctx, B.x + B.w - 2, B.y + 1, 1, B.h - 2, PALETTE.outline);
    this.#rect(ctx, B.x + 8, B.y + B.h - 5, B.w - 16, 2, PALETTE.outline);
    for (let i = 0; i < 12; i += 1) {
      const sx = B.x + 12 + Math.floor(noise(i + 1) * (B.w - 28));
      const sy = B.y + 10 + Math.floor(noise(i * 2 + 3) * (B.h - 20));
      const len = 4 + Math.floor(noise(i * 3 + 5) * 12);
      this.#rect(ctx, sx, sy, len, 1, noise(i + 7) > 0.5 ? PALETTE.woodDark : PALETTE.woodLight);
    }
    this.#journalCoverWear(ctx, B, noise);
    for (const [fx, fy] of [[B.x + 4, B.y + 4], [B.x + B.w - 12, B.y + 4], [B.x + 4, B.y + B.h - 12], [B.x + B.w - 12, B.y + B.h - 12]]) {
      this.#rect(ctx, fx, fy, 8, 8, PALETTE.uiBorderDark);
      this.#rect(ctx, fx + 1, fy + 1, 6, 6, PALETTE.uiBorderLight);
      this.#rect(ctx, fx + 2, fy + 2, 4, 4, PALETTE.woodDark);
    }

    // Two worn parchment pages flanking a stitched spine.
    const left = { x: B.x + 16, y: B.y + 14, w: 244, h: B.h - 26 };
    const right = { x: B.x + 284, y: B.y + 14, w: 244, h: B.h - 26 };
    this.#journalPage(ctx, left, { dogEar: 'bl' });
    this.#journalPage(ctx, right, { dogEar: 'br', ring: true });
    const spineX = left.x + left.w;
    const spineW = right.x - spineX;
    this.#rect(ctx, spineX, left.y, spineW, left.h, PALETTE.woodDark);
    this.#rect(ctx, spineX + Math.floor(spineW / 2), left.y, 1, left.h, PALETTE.outline);
    for (let yy = left.y + 6; yy < left.y + left.h; yy += 16) {
      this.#rect(ctx, spineX + Math.floor(spineW / 2) - 1, yy, 3, 6, PALETTE.uiBorderDark);
    }
    this.#rect(ctx, spineX - 6, left.y, 6, left.h, PARCHMENT.lo);
    this.#rect(ctx, right.x, right.y, 6, right.h, PARCHMENT.lo);

    // Red ribbon down the spine, forked tail below the book.
    const rx = spineX + Math.floor((spineW - 7) / 2);
    this.#rect(ctx, rx, B.y - 4, 7, B.h - 6, PALETTE.clothRed);
    this.#rect(ctx, rx, B.y - 4, 1, B.h - 6, PALETTE.uiBad);
    this.#rect(ctx, rx + 6, B.y - 4, 1, B.h - 6, PALETTE.hostRed);
    const tailY = B.y + B.h - 10;
    this.#rect(ctx, rx, tailY, 2, 12, PALETTE.clothRed);
    this.#rect(ctx, rx + 5, tailY, 2, 12, PALETTE.clothRed);

    const journal = ui.journal ?? {};
    const section = journal.section ?? 0;
    const turn = journal.turn ?? null;
    const contentSection = turn ? turn.from : section;
    this.#journalTabs(ctx, B, journal.sections ?? [], section);

    this.#journalContent(ctx, left, right, contentSection, journal);
    if (turn) this.#journalPageTurn(ctx, left, right, turn);
    this.#journalArrowButton(ctx, JOURNAL_ARROW_BOXES.prev, 'prev');
    this.#journalArrowButton(ctx, JOURNAL_ARROW_BOXES.next, 'next');

    this.#text(ctx, 'A/D OR ARROWS TURN PAGE   J OR ESC CLOSE', B.x + 72, B.y + B.h - 11, PALETTE.clothTan);
  }

  #journalContent(ctx, left, right, section, journal) {
    if (section === 1) this.#journalNotesPage(ctx, left, right, journal.findings ?? []);
    else if (section === 2) this.#journalFactionsPage(ctx, left, right, journal.factions ?? [], journal.factionIndex ?? 0);
    else if (section === 3) this.#journalCharacterPage(ctx, left, right, journal.character ?? {});
    else if (section === 4) this.#journalScarsPage(ctx, left, right, journal.character ?? {});
    else this.#journalQuestsPage(ctx, left, right, journal.quests ?? []);
  }

  #journalCoverWear(ctx, B, noise) {
    const rubbed = 'rgba(177, 130, 72, 0.36)';
    const cut = 'rgba(28, 18, 12, 0.45)';
    for (const [x, y, w, h] of [
      [B.x + 13, B.y + 12, 34, 3],
      [B.x + B.w - 52, B.y + 13, 38, 3],
      [B.x + 15, B.y + B.h - 18, 46, 4],
      [B.x + B.w - 71, B.y + B.h - 18, 58, 4]
    ]) {
      this.#rect(ctx, x, y, w, h, rubbed);
      this.#rect(ctx, x + 3, y + h, Math.max(3, w - 12), 1, cut);
    }
    for (let i = 0; i < 18; i += 1) {
      const sx = B.x + 24 + Math.floor(noise(i * 4 + 17) * (B.w - 48));
      const sy = B.y + 22 + Math.floor(noise(i * 6 + 29) * (B.h - 54));
      const len = 10 + Math.floor(noise(i * 8 + 31) * 30);
      this.#rect(ctx, sx, sy, len, 1, cut);
      if (noise(i * 2 + 5) > 0.55) this.#rect(ctx, sx + 1, sy - 1, Math.max(2, Math.floor(len / 3)), 1, rubbed);
    }
    for (let y = B.y + 42; y < B.y + B.h - 42; y += 52) {
      this.#rect(ctx, B.x + 2, y, 3, 24, PALETTE.outline);
      this.#rect(ctx, B.x + B.w - 5, y + 8, 3, 20, PALETTE.outline);
    }
  }

  #journalArrowButton(ctx, box, direction) {
    const lit = PALETTE.uiBorderLight;
    this.#rect(ctx, box.x - 1, box.y - 1, box.w + 2, box.h + 2, PALETTE.outline);
    this.#rect(ctx, box.x, box.y, box.w, box.h, PALETTE.woodDark);
    this.#rect(ctx, box.x + 2, box.y + 2, box.w - 4, box.h - 4, PALETTE.woodMid);
    this.#rect(ctx, box.x + 3, box.y + 3, box.w - 6, 1, PALETTE.woodLight);
    this.#journalArrowGlyph(ctx, box.x + Math.floor(box.w / 2), box.y + Math.floor(box.h / 2), direction, lit);
  }

  #journalArrowGlyph(ctx, cx, cy, direction, color) {
    const rows = [1, 3, 5, 7, 5, 3, 1];
    for (let row = 0; row < rows.length; row += 1) {
      const w = rows[row];
      const y = cy - 3 + row;
      const offset = Math.floor(w / 2);
      if (direction === 'prev') this.#rect(ctx, cx - 2 - offset, y, w, 1, color);
      else this.#rect(ctx, cx + 2 - offset, y, w, 1, color);
    }
    this.#rect(ctx, direction === 'prev' ? cx + 1 : cx - 4, cy - 1, 5, 3, color);
  }

  #journalPageTurn(ctx, left, right, turn) {
    const p = Math.max(0, Math.min(1, Number(turn.progress) || 0));
    if (p <= 0 || p >= 1) return;
    const ease = p * p * (3 - 2 * p);
    const forward = (turn.direction ?? 1) >= 0;
    const outer = forward ? right.x + right.w : left.x;
    const far = forward ? left.x : right.x + right.w;
    const travel = Math.abs(outer - far);
    const foldX = forward
      ? outer - Math.round(travel * ease)
      : outer + Math.round(travel * ease);
    const width = 34 + Math.round(Math.sin(p * Math.PI) * 88);
    const top = left.y + 3;
    const fullH = left.h - 6;
    const minX = left.x;
    const maxX = right.x + right.w;

    const shadowX = forward ? foldX - 8 : foldX + 4;
    this.#rect(ctx, shadowX, top + 5, 10, fullH - 10, 'rgba(16, 10, 6, 0.34)');
    this.#rect(ctx, forward ? foldX + 4 : foldX - 14, top + 1, 10, fullH - 2, 'rgba(42, 27, 12, 0.18)');

    for (let i = 0; i < width; i += 2) {
      const t = i / Math.max(1, width - 1);
      const x = forward ? foldX + i : foldX - i;
      if (x < minX || x > maxX) continue;
      const curve = Math.sin(t * Math.PI) * Math.sin(p * Math.PI);
      const yOff = Math.round(curve * 13);
      const stripH = fullH - yOff * 2;
      const color = t < 0.12 ? PARCHMENT.hi : t > 0.78 ? PARCHMENT.lo : (i % 4 === 0 ? PARCHMENT.base : PARCHMENT.flap);
      this.#rect(ctx, x, top + yOff, 2, stripH, color);
      if (i % 10 === 0) this.#rect(ctx, x, top + yOff + 16, 1, Math.max(4, stripH - 32), 'rgba(72, 55, 33, 0.18)');
    }

    this.#rect(ctx, foldX - 1, top + 3, 2, fullH - 6, PARCHMENT.inkDim);
    for (let yy = top + 18; yy < top + fullH - 14; yy += 22) {
      this.#rect(ctx, foldX + (forward ? 5 : -10), yy, 9, 1, 'rgba(78, 58, 32, 0.22)');
    }
  }

  // Section tabs sticking up from the top edge; the active one is parchment and
  // sits a little proud of the leather ones.
  #journalTabs(ctx, B, sections, active) {
    const gap = 6;
    const tabW = Math.min(96, Math.floor((B.w - 24 - Math.max(0, sections.length - 1) * gap) / Math.max(1, sections.length)));
    const total = sections.length * tabW + Math.max(0, sections.length - 1) * gap;
    let x = B.x + Math.floor((B.w - total) / 2);
    for (let i = 0; i < sections.length; i += 1) {
      const on = i === active;
      const h = on ? 19 : 15;
      const y = on ? B.y - 10 : B.y - 6;
      this.#rect(ctx, x - 1, y - 1, tabW + 2, h + 2, PALETTE.outline);
      this.#rect(ctx, x, y, tabW, h, on ? PARCHMENT.base : PALETTE.woodMid);
      this.#rect(ctx, x, y, tabW, 1, on ? PARCHMENT.hi : PALETTE.woodLight);
      const label = sections[i];
      const lw = this.#textWidth(label);
      this.#text(ctx, label, x + Math.floor((tabW - lw) / 2), y + Math.floor((h - 7) / 2) + 1, on ? PARCHMENT.ink : PALETTE.clothTan);
      x += tabW + gap;
    }
  }

  #journalHeader(ctx, page, label) {
    this.#text(ctx, label, page.x + 12, page.y + 6, PARCHMENT.ink);
    this.#rect(ctx, page.x + 10, page.y + 17, page.w - 20, 1, PARCHMENT.inkDim);
    return page.y + 26;
  }

  #journalSeal(ctx, page) {
    const sx = page.x + page.w - 42;
    const sy = page.y + page.h - 38;
    this.#journalDisc(ctx, sx, sy, 13, PALETTE.hostRed);
    this.#journalDisc(ctx, sx, sy, 11, PALETTE.clothRed);
    this.#rect(ctx, sx - 1, sy - 8, 2, 16, PALETTE.hostGold);
    this.#rect(ctx, sx - 8, sy - 1, 16, 2, PALETTE.hostGold);
    this.#rect(ctx, sx - 1, sy - 1, 2, 2, PALETTE.uiWarn);
    this.#text(ctx, 'MARA VEY', page.x + 12, page.y + page.h - 24, PARCHMENT.inkDim);
    this.#text(ctx, 'ASHEN CENSURE', page.x + 12, page.y + page.h - 14, PARCHMENT.inkDim);
  }

  #journalQuestsPage(ctx, left, right, quests) {
    const C = PARCHMENT;
    const INK_RED = PALETTE.clothRed;
    const lx = left.x + 12;
    let y = left.y + 8;
    if (!quests.length) this.#text(ctx, 'NO ACTIVE WRIT.', lx, y, C.inkDim);
    for (const quest of quests) {
      const title = this.#clip(quest.title, 30);
      this.#text(ctx, title, lx, y, C.ink);
      this.#rect(ctx, lx, y + 9, this.#textWidth(title), 1, C.inkDim);
      y += 16;
      if (quest.task) {
        this.#text(ctx, 'TASK', lx, y, C.inkDim);
        this.#text(ctx, this.#clip(quest.task, 26), lx + 30, y, quest.complete ? C.inkDim : INK_RED);
        y += 15;
      }
      for (const obj of quest.objectives ?? []) {
        const color = obj.lead ? INK_RED : obj.done ? C.inkDim : C.ink;
        const wrapped = this.#wrap(obj.text, 33);
        const tx = lx + 13;
        if (obj.active) this.#rect(ctx, lx - 3, y - 2, left.w - 18, wrapped.length * 10 + 3, C.hi);
        if (obj.lead) this.#text(ctx, '>>', lx, y, INK_RED);
        else this.#journalCheckbox(ctx, lx, y - 1, obj.done);
        let ly = y;
        for (const line of wrapped) {
          this.#text(ctx, line, tx, ly, color);
          if (obj.done) this.#rect(ctx, tx, ly + 3, this.#textWidth(line), 1, C.inkDim);
          ly += 10;
        }
        y = ly + 3;
      }
      y += 6;
    }

    let ry = this.#journalHeader(ctx, right, 'CURRENT ORDERS');
    const rx = right.x + 12;
    const note = quests.find((q) => q.note)?.note ?? '';
    if (note) {
      for (const line of this.#wrap(note, 36)) { this.#text(ctx, line, rx, ry, C.inkDim); ry += 11; }
    } else {
      this.#text(ctx, 'NOTHING SET DOWN YET.', rx, ry, C.inkDim);
    }
    this.#journalSeal(ctx, right);
  }

  #journalNotesPage(ctx, left, right, findings) {
    const C = PARCHMENT;
    const pages = [left, right];
    let pi = 0;
    let page = pages[0];
    let y = this.#journalHeader(ctx, page, 'FINDINGS');
    if (!findings.length) {
      this.#text(ctx, 'YOU HAVE WRITTEN NOTHING DOWN YET.', page.x + 12, y, C.inkDim);
      return;
    }
    for (const finding of findings) {
      const wrapped = this.#wrap(finding, 34);
      const blockH = wrapped.length * 10 + 9;
      if (y + blockH > page.y + page.h - 8) {
        if (pi + 1 >= pages.length) { this.#text(ctx, '. . .', page.x + 12, y, C.inkDim); break; }
        pi += 1; page = pages[pi];
        y = this.#journalHeader(ctx, page, 'FINDINGS');
      }
      this.#text(ctx, '+', page.x + 12, y, PALETTE.clothRed);
      let ly = y;
      for (const line of wrapped) { this.#text(ctx, line, page.x + 22, ly, C.ink); ly += 10; }
      y = ly + 3;
      this.#rect(ctx, page.x + 12, y, page.w - 24, 1, C.rule);
      y += 7;
    }
  }

  // A codex: a selectable list of known factions on the left, the full record of
  // the selected one on the right. Cult entries appear here as they are learned.
  #journalFactionsPage(ctx, left, right, factions, selected) {
    const C = PARCHMENT;
    const known = factions.filter((f) => f.known);
    const hasLocked = factions.some((f) => !f.known);

    // Left page: the index of what you have on file.
    let y = this.#journalHeader(ctx, left, 'FACTIONS');
    const lx = left.x + 12;
    if (!known.length) this.#text(ctx, 'NO RECORDS YET.', lx, y, C.inkDim);
    const sel = Math.max(0, Math.min(known.length - 1, selected));
    for (let i = 0; i < known.length; i += 1) {
      const on = i === sel;
      if (on) this.#rect(ctx, left.x + 6, y - 2, left.w - 12, 12, C.hi);
      this.#text(ctx, on ? '>' : ' ', lx, y, PALETTE.clothRed);
      this.#text(ctx, this.#clip(known[i].name, 27), lx + 10, y, on ? C.ink : C.inkDim);
      y += 13;
    }
    if (hasLocked) {
      y += 6;
      this.#text(ctx, '[ unfiled records remain ]', lx, y, C.inkDim);
    }

    // Right page: the open record.
    let ry = this.#journalHeader(ctx, right, 'RECORD');
    const rx = right.x + 12;
    const entry = known[sel];
    if (!entry) { this.#text(ctx, 'NOTHING ON FILE.', rx, ry, C.inkDim); return; }
    this.#text(ctx, this.#clip(entry.name, 30), rx, ry, C.ink);
    this.#rect(ctx, rx, ry + 9, this.#textWidth(this.#clip(entry.name, 30)), 1, C.inkDim);
    ry += 14;
    if (entry.kind) { this.#text(ctx, this.#clip(entry.kind, 36), rx, ry, PALETTE.clothRed); ry += 13; }
    for (const line of this.#wrap(entry.summary, 36)) { this.#text(ctx, line, rx, ry, C.inkDim); ry += 10; }
    ry += 4;
    for (const fact of entry.facts ?? []) {
      this.#text(ctx, '-', rx, ry, C.inkDim);
      let ly = ry;
      for (const line of this.#wrap(fact, 34)) { this.#text(ctx, line, rx + 8, ly, C.inkDim); ly += 10; }
      ry = ly + 2;
    }
  }

  #journalCharacterPage(ctx, left, right, character) {
    const C = PARCHMENT;
    const lx = left.x + 12;
    let y = this.#journalHeader(ctx, left, 'CHARACTER SHEET');

    this.#text(ctx, this.#clip(character.name ?? 'UNKNOWN AGENT', 30), lx, y, C.ink);
    y += 13;
    this.#text(ctx, this.#clip(character.role ?? 'ASHEN CENSURE', 34), lx, y, PALETTE.clothRed);
    y += 18;

    this.#text(ctx, `LEVEL ${character.level ?? 1}`, lx, y, C.ink);
    this.#text(ctx, this.#clip(character.build?.label ?? 'FIELD AGENT', 22), lx + 78, y, PALETTE.clothRed);
    y += 13;
    const xp = character.xp ?? {};
    const xpLabel = xp.atCap ? `XP ${xp.current ?? 0}` : `XP ${xp.current ?? 0}/${xp.nextLevelXp ?? 0}`;
    this.#text(ctx, this.#clip(xpLabel, 18), lx, y, C.inkDim);
    this.#journalValueBar(ctx, lx + 78, y + 2, 114, 5, xp.intoLevel ?? 0, Math.max(1, xp.needed ?? 1), PALETTE.clothRed, C.rule);
    y += 13;
    this.#text(ctx, `PRIMARY POINTS ${character.primaryPoints ?? 0}`, lx, y, C.inkDim);
    y += 18;

    this.#text(ctx, `TRACE ${character.trace?.label ?? 'CLEAN'}`, lx, y, C.ink);
    y += 13;
    this.#text(ctx, `ICON RISK ${this.#clip(character.iconRisk?.label ?? 'NOT ASSESSED', 22)}`, lx, y, C.inkDim);
    y += 18;

    this.#text(ctx, 'PRIMARY ATTRIBUTES', lx, y, C.inkDim);
    y += 13;
    for (const primary of character.primaries ?? []) {
      this.#text(ctx, this.#clip(primary.label, 13), lx, y, C.ink);
      this.#text(ctx, `${primary.value ?? 0}/10`, lx + 90, y, C.inkDim);
      this.#journalValueBar(ctx, lx + 121, y + 2, 72, 5, primary.value ?? 0, 10, PALETTE.clothRed, C.rule);
      y += 13;
    }

    let ry = this.#journalHeader(ctx, right, 'FIELD RATINGS');
    const fields = character.fields ?? [];
    const topFields = new Set((character.topFields ?? []).map((field) => field.id));
    const leftFields = fields.slice(0, Math.ceil(fields.length / 2));
    const rightFields = fields.slice(Math.ceil(fields.length / 2));
    this.#journalFieldColumn(ctx, right.x + 12, ry, leftFields, topFields, 100);
    this.#journalFieldColumn(ctx, right.x + 124, ry, rightFields, topFields, 92);
    this.#journalSeal(ctx, right);
  }

  #journalScarsPage(ctx, left, right, character) {
    const C = PARCHMENT;
    const scars = character.scars ?? [];
    const lx = left.x + 12;
    let y = this.#journalHeader(ctx, left, 'SCARS');
    this.#text(ctx, `UNSPENT POINTS ${character.scarPoints ?? 0}`, lx, y, C.inkDim);
    y += 17;

    if (!scars.length) {
      this.#text(ctx, 'NONE ON FILE.', lx, y, C.inkDim);
    }
    for (const scar of scars.slice(0, 5)) {
      this.#text(ctx, this.#clip(`R${scar.rank ?? 1} ${scar.name ?? 'SCAR'}`, 34), lx, y, C.ink);
      y += 11;
      if (scar.summary) {
        for (const line of this.#wrap(scar.summary, 35).slice(0, 2)) {
          this.#text(ctx, line, lx + 8, y, C.inkDim);
          y += 10;
        }
      }
      if (scar.cost) {
        for (const line of this.#wrap(`Cost: ${scar.cost}`, 34).slice(0, 2)) {
          this.#text(ctx, line, lx + 8, y, PALETTE.clothRed);
          y += 10;
        }
      }
      y += 3;
    }

    let ry = this.#journalHeader(ctx, right, 'SCAR EFFECTS');
    const rx = right.x + 12;
    for (const scar of scars.slice(0, 6)) {
      this.#text(ctx, this.#clip(scar.name ?? 'SCAR', 28), rx, ry, C.ink);
      ry += 12;
      const modifiers = Object.entries(scar.modifiers ?? {});
      if (!modifiers.length) {
        this.#text(ctx, 'NO FIELD MODIFIERS.', rx + 8, ry, C.inkDim);
        ry += 11;
      }
      for (const [fieldId, value] of modifiers) {
        const sign = value >= 0 ? '+' : '';
        this.#text(ctx, `${sign}${value} ${this.#clip(this.#fieldLabel(character, fieldId), 22)}`, rx + 8, ry, C.inkDim);
        ry += 11;
      }
      ry += 5;
    }
    this.#journalSeal(ctx, right);
  }

  #journalFieldColumn(ctx, x, y, fields, topFields, barW) {
    const C = PARCHMENT;
    for (const field of fields) {
      const value = field.value ?? 0;
      const highlighted = topFields.has(field.id);
      const color = highlighted ? C.ink : C.inkDim;
      this.#text(ctx, highlighted ? '*' : ' ', x, y, PALETTE.clothRed);
      this.#text(ctx, this.#clip(field.label ?? 'FIELD', 12), x + 8, y, color);
      this.#text(ctx, String(value).padStart(3, ' '), x + 79, y, color);
      this.#journalValueBar(ctx, x + 8, y + 9, barW, 3, value, 100, highlighted ? PALETTE.clothRed : C.inkDim, C.rule);
      y += 17;
    }
  }

  #fieldLabel(character, fieldId) {
    return character.fields?.find((field) => field.id === fieldId)?.label
      ?? String(fieldId).replace(/([A-Z])/g, ' $1');
  }

  #journalValueBar(ctx, x, y, w, h, value, max, fill, empty) {
    this.#rect(ctx, x - 1, y - 1, w + 2, h + 2, PARCHMENT.inkDim);
    this.#rect(ctx, x, y, w, h, empty);
    const fillW = Math.max(0, Math.min(w, Math.round((w * (Number(value) || 0)) / max)));
    if (fillW > 0) this.#rect(ctx, x, y, fillW, h, fill);
  }

  #journalPage(ctx, p, opts = {}) {
    const C = PARCHMENT;
    const noise = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
    this.#rect(ctx, p.x, p.y, p.w, p.h, C.base);
    this.#rect(ctx, p.x, p.y, p.w, 1, C.hi);
    this.#rect(ctx, p.x, p.y + 1, p.w, 1, C.hi);
    // aged edge darkening on the three open sides
    this.#rect(ctx, p.x, p.y + p.h - 1, p.w, 1, C.lo);
    this.#rect(ctx, p.x, p.y, 2, p.h, C.lo);
    this.#rect(ctx, p.x + p.w - 2, p.y, 2, p.h, C.lo);
    for (let i = 0; i < 9; i += 1) {
      const cy = p.y + 18 + Math.floor(noise(p.x + i * 11) * (p.h - 44));
      const chip = 2 + Math.floor(noise(p.y + i * 13) * 5);
      if (noise(i + p.x) > 0.48) this.#rect(ctx, p.x, cy, chip, 2, PALETTE.woodDark);
      else this.#rect(ctx, p.x + p.w - chip, cy, chip, 2, PALETTE.woodDark);
    }
    for (let i = 0; i < 7; i += 1) {
      const cx = p.x + 18 + Math.floor(noise(p.y + i * 7) * (p.w - 44));
      const chip = 3 + Math.floor(noise(p.x + i * 5) * 6);
      if (noise(i * 3 + p.y) > 0.52) this.#rect(ctx, cx, p.y, chip, 2, PALETTE.woodDark);
      else this.#rect(ctx, cx, p.y + p.h - 2, chip, 2, PALETTE.woodDark);
    }
    // faint ruled lines
    for (let yy = p.y + 18; yy < p.y + p.h - 4; yy += 11) this.#rect(ctx, p.x + 6, yy, p.w - 12, 1, C.rule);
    // specks and brown foxing spots
    for (let i = 0; i < 24; i += 1) {
      const sx = p.x + 8 + Math.floor(noise(p.x + i * 3.1 + 1) * (p.w - 16));
      const sy = p.y + 10 + Math.floor(noise(p.y + i * 5.7 + 2) * (p.h - 20));
      const big = noise(i * 1.7 + p.x) > 0.82;
      this.#rect(ctx, sx, sy, big ? 2 : 1, big ? 2 : 1, big ? C.fox : C.lo);
    }
    // a faint coffee-ring stain
    if (opts.ring) {
      const cx = p.x + p.w - 60;
      const cy = p.y + 66;
      const r = 24;
      for (let t = 0; t < 72; t += 1) {
        const a = (t / 72) * Math.PI * 2;
        const rr = r + (noise(t + p.x) * 2 - 1);
        this.#rect(ctx, Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr), 1, 1, 'rgba(74, 48, 20, 0.22)');
      }
    }
    // a small ink blot
    const bx = p.x + p.w - 30;
    const by = p.y + p.h - 56;
    this.#rect(ctx, bx, by, 3, 2, C.ink);
    this.#rect(ctx, bx + 2, by + 1, 2, 3, C.ink);
    this.#rect(ctx, bx - 1, by + 2, 2, 1, C.ink);
    this.#rect(ctx, bx + 3, by - 1, 1, 1, C.ink);
    this.#rect(ctx, p.x + 18, p.y + 28, 16, 1, 'rgba(78, 46, 22, 0.25)');
    this.#rect(ctx, p.x + 21, p.y + 29, 1, 18, 'rgba(78, 46, 22, 0.2)');
    this.#rect(ctx, p.x + p.w - 45, p.y + 33, 22, 2, 'rgba(78, 46, 22, 0.16)');
    // a folded-over dog-ear at the bottom outer corner
    if (opts.dogEar === 'bl' || opts.dogEar === 'br') {
      const s = 18;
      for (let i = 0; i < s; i += 1) {
        const w = s - i;
        const rowY = p.y + p.h - 1 - i;
        if (opts.dogEar === 'bl') {
          this.#rect(ctx, p.x, rowY, w, 1, C.flap);
          this.#rect(ctx, p.x + (s - 1 - i), rowY, 1, 1, C.lo);
        } else {
          this.#rect(ctx, p.x + p.w - w, rowY, w, 1, C.flap);
          this.#rect(ctx, p.x + p.w - 1 - (s - 1 - i), rowY, 1, 1, C.lo);
        }
      }
    }
  }

  #journalDisc(ctx, cx, cy, r, color) {
    for (let dy = -r; dy <= r; dy += 1) {
      const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
      this.#rect(ctx, cx - half, cy + dy, half * 2 + 1, 1, color);
    }
  }

  #journalCheckbox(ctx, x, y, done) {
    const INK = '#241b12';
    this.#rect(ctx, x, y, 8, 8, INK);
    this.#rect(ctx, x + 1, y + 1, 6, 6, '#c7b487');
    if (done) {
      this.#rect(ctx, x + 1, y + 4, 2, 2, INK);
      this.#rect(ctx, x + 2, y + 5, 2, 2, INK);
      this.#rect(ctx, x + 3, y + 3, 2, 2, INK);
      this.#rect(ctx, x + 4, y + 2, 2, 2, INK);
      this.#rect(ctx, x + 5, y + 1, 2, 2, INK);
    }
  }

  #drawDialogue(ctx, ui) {
    const dialogue = ui.dialogue ?? { title: 'INSPECT', lines: [] };
    const layout = buildDialogueLayout(dialogue);
    const { body, responseBox, scroll, maxScroll } = layout;
    this.#screenBackdrop(ctx, true);
    this.#window(ctx, DIALOGUE_BOX, dialogue.title ?? 'INSPECT');
    this.#inset(ctx, body);

    let y = body.y + 8;
    for (const line of layout.lines) {
      this.#outcomeText(ctx, line, body.x + 8, y, PALETTE.uiText);
      y += DIALOGUE_LINE_HEIGHT;
    }
    if (scroll > 0) this.#scrollArrow(ctx, body.x + body.w - 12, body.y + 7, -1, PALETTE.uiBorderLight);
    if (scroll < maxScroll) this.#scrollArrow(ctx, body.x + body.w - 12, body.y + body.h - 11, 1, PALETTE.uiWarn);

    this.#inset(ctx, responseBox);
    y = responseBox.y + 7;
    for (const option of layout.options) {
      this.#text(ctx, option, responseBox.x + 8, y, PALETTE.uiGood);
      y += DIALOGUE_OPTION_LINE_HEIGHT;
    }
  }

  // A small solid scroll triangle (dir -1 = up, 1 = down).
  #scrollArrow(ctx, x, y, dir, color) {
    for (let i = 0; i < 4; i += 1) {
      const w = dir < 0 ? i * 2 + 1 : 7 - i * 2;
      this.#rect(ctx, x - Math.floor(w / 2), y + i, w, 1, color);
    }
  }

  #drawAreaTitle(ctx, areaTitle) {
    const ttl = Math.max(0, areaTitle.ttl ?? 0);
    if (ttl <= 0) return;

    const duration = Math.max(areaTitle.duration ?? ttl, 0.001);
    const progress = Math.max(0, Math.min(1, 1 - ttl / duration));
    if (progress > 0.78 && Math.floor(ttl * 18) % 2 === 0) return;

    const label = this.#clip(areaTitle.text, 46);
    const scale = 2;
    const textW = this.#textWidth(label, scale);
    const bandW = Math.min(VIEWPORT.width - 72, Math.max(textW + 48, 248));
    const x = Math.round((VIEWPORT.width - textW) / 2);
    const y = 36;
    const bx = Math.round((VIEWPORT.width - bandW) / 2);
    const by = y - 12;
    const edge = progress < 0.18 || progress > 0.68 ? PALETTE.uiWarn : PALETTE.uiBorderLight;
    const text = progress > 0.7 && Math.floor(ttl * 14) % 2 === 0 ? PALETTE.uiWarn : PALETTE.uiText;

    this.#rect(ctx, bx - 2, by - 2, bandW + 4, 34, PALETTE.outline);
    this.#rect(ctx, bx, by, bandW, 30, PALETTE.uiDark);
    this.#rect(ctx, bx + 2, by + 2, bandW - 4, 1, edge);
    this.#rect(ctx, bx + 2, by + 27, bandW - 4, 1, PALETTE.uiBorderDark);
    for (let sx = bx + 8; sx < bx + bandW - 8; sx += 16) {
      this.#rect(ctx, sx, by + 6 + ((sx >> 2) % 3), 7, 1, PALETTE.uiBorderDark);
      this.#rect(ctx, sx + 4, by + 23 - ((sx >> 3) % 3), 5, 1, PALETTE.uiBorderDark);
    }
    this.#rect(ctx, bx + 6, by + 8, 12, 1, edge);
    this.#rect(ctx, bx + bandW - 18, by + 8, 12, 1, edge);
    this.#rect(ctx, bx + 6, by + 21, 12, 1, PALETTE.uiBorderDark);
    this.#rect(ctx, bx + bandW - 18, by + 21, 12, 1, PALETTE.uiBorderDark);
    this.#text(ctx, label, x + 2, y + 2, PALETTE.outline, scale);
    this.#text(ctx, label, x, y, text, scale);
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

  #screenBackdrop(ctx, fullScreen = false) {
    const h = fullScreen ? ctx.canvas.height : VIEWPORT.height;
    for (let y = 0; y < h; y += 2) {
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

  #outcomeText(ctx, str, x, y, baseColor = PALETTE.uiText, scale = 1) {
    const text = this.#normalize(str);
    const outcome = OUTCOME_PREFIXES.find((entry) => text.startsWith(entry.text));
    if (!outcome) {
      this.#text(ctx, text, x, y, baseColor, scale);
      return;
    }

    this.#text(ctx, outcome.text, x, y, outcome.color, scale);
    const rest = text.slice(outcome.text.length);
    if (rest) {
      this.#text(ctx, rest, x + this.#textWidth(outcome.text, scale), y, baseColor, scale);
    }
  }

  #wrap(str, maxChars) {
    return wrapUiText(str, maxChars);
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
