import { PALETTE } from '../palette.js';
import {
  JOURNAL_ARROW_BOXES,
  JOURNAL_BOOK,
  JOURNAL_MAP_FIELD_BOX,
  JOURNAL_PAGES,
  JOURNAL_TECHNIQUE_LIST,
  journalEvidenceWindow,
  journalMapGridMetrics,
  journalTabBoxes,
  journalTechniqueWindow
} from '../../ui/journalLayout.js';
import {
  clipLedgerText,
  ledgerText,
  ledgerTextWidth
} from './JournalTypography.js';

// Aged-paper palette for the journal book (dark ink on dirty parchment).
const PARCHMENT = {
  base: PALETTE.uiPaperBase,
  hi: PALETTE.uiPaperHigh,
  lo: PALETTE.uiPaperLow,
  rule: PALETTE.uiPaperRule,
  fox: PALETTE.uiPaperFox,
  ink: PALETTE.uiPaperInk,
  inkDim: PALETTE.uiPaperInkDim,
  flap: PALETTE.uiPaperFlap
};

const SECTION_LABELS = Object.freeze({
  QUESTS: 'WRITS',
  MAP: 'MAP',
  NOTES: 'EVIDENCE',
  FACTIONS: 'DOSSIERS',
  CHARACTER: 'AGENT',
  SCARS: 'SCARS',
  TECHNIQUES: 'METHODS',
  DRONE: 'ATTENDANT'
});

const SECTION_FORMS = Object.freeze({
  QUESTS: 'C-12',
  MAP: 'C-4',
  NOTES: 'C-19',
  FACTIONS: 'C-22',
  CHARACTER: 'C-1',
  SCARS: 'C-31',
  TECHNIQUES: 'C-8',
  DRONE: 'C-17'
});

export function drawJournal(ctx, ui, tools) {
  tools.screenBackdrop(ctx);

  const B = JOURNAL_BOOK;
  const noise = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

  // Stepped shadow, then a scarred field ledger with brass fittings.
  tools.rect(ctx, B.x + 6, B.y + 7, B.w, B.h, 'rgba(5, 5, 5, 0.48)');
  tools.rect(ctx, B.x + 3, B.y + 4, B.w, B.h, 'rgba(5, 5, 5, 0.3)');
  tools.rect(ctx, B.x - 1, B.y - 1, B.w + 2, B.h + 2, PALETTE.outline);
  tools.rect(ctx, B.x, B.y, B.w, B.h, PALETTE.woodDark);
  tools.rect(ctx, B.x + 1, B.y + 1, B.w - 2, B.h - 2, PALETTE.woodMid);
  tools.rect(ctx, B.x + 1, B.y + 1, B.w - 2, 1, PALETTE.woodLight);
  tools.rect(ctx, B.x + 1, B.y + 1, 1, B.h - 2, PALETTE.woodLight);
  tools.rect(ctx, B.x + 1, B.y + B.h - 2, B.w - 2, 1, PALETTE.outline);
  tools.rect(ctx, B.x + B.w - 2, B.y + 1, 1, B.h - 2, PALETTE.outline);
  tools.rect(ctx, B.x + 8, B.y + B.h - 5, B.w - 16, 2, PALETTE.outline);
  tools.detailRect(ctx, B.x + 1.5, B.y + 1.5, B.w - 3, 0.5, PALETTE.woodLight);
  tools.detailRect(ctx, B.x + 1.5, B.y + 1.5, 0.5, B.h - 3, PALETTE.woodLight);
  tools.detailRect(ctx, B.x + 1.5, B.y + B.h - 2.5, B.w - 3, 0.5, PALETTE.outline);
  tools.rect(ctx, B.x + 9, B.y + 6, 34, B.h - 18, PALETTE.woodDark);
  tools.rect(ctx, B.x + B.w - 43, B.y + 6, 34, B.h - 18, PALETTE.woodDark);
  for (let i = 0; i < 12; i += 1) {
    const sx = B.x + 12 + Math.floor(noise(i + 1) * (B.w - 28));
    const sy = B.y + 10 + Math.floor(noise(i * 2 + 3) * (B.h - 20));
    const len = 4 + Math.floor(noise(i * 3 + 5) * 12);
    tools.rect(ctx, sx, sy, len, 1, noise(i + 7) > 0.5 ? PALETTE.woodDark : PALETTE.woodLight);
  }
  journalCoverWear(ctx, B, noise, tools);
  for (const [fx, fy] of [[B.x + 4, B.y + 4], [B.x + B.w - 12, B.y + 4], [B.x + 4, B.y + B.h - 12], [B.x + B.w - 12, B.y + B.h - 12]]) {
    tools.rect(ctx, fx, fy, 8, 8, PALETTE.uiBorderDark);
    tools.rect(ctx, fx + 1, fy + 1, 6, 6, PALETTE.uiBorderLight);
    tools.rect(ctx, fx + 2, fy + 2, 4, 4, PALETTE.woodDark);
    tools.detailRect(ctx, fx + 1.5, fy + 1.5, 3, 0.5, PALETTE.uiText);
    tools.detailRect(ctx, fx + 5.5, fy + 5.5, 0.5, 0.5, PALETTE.outline);
  }

  // Two worn parchment pages flanking a stitched spine.
  const left = JOURNAL_PAGES.left;
  const right = JOURNAL_PAGES.right;
  journalPage(ctx, left, { dogEar: 'bl' }, tools);
  journalPage(ctx, right, { dogEar: 'br', ring: true }, tools);
  const spineX = left.x + left.w;
  const spineW = right.x - spineX;
  tools.rect(ctx, spineX, left.y, spineW, left.h, PALETTE.woodDark);
  tools.rect(ctx, spineX + Math.floor(spineW / 2), left.y, 1, left.h, PALETTE.outline);
  for (let yy = left.y + 6; yy < left.y + left.h; yy += 16) {
    tools.rect(ctx, spineX + Math.floor(spineW / 2) - 1, yy, 3, 6, PALETTE.uiBorderDark);
  }
  tools.rect(ctx, spineX - 6, left.y, 6, left.h, PARCHMENT.lo);
  tools.rect(ctx, right.x, right.y, 6, right.h, PARCHMENT.lo);

  // Red ribbon down the spine, forked tail below the book.
  const rx = spineX + Math.floor((spineW - 7) / 2);
  tools.rect(ctx, rx, B.y - 4, 7, B.h - 6, PALETTE.clothRed);
  tools.rect(ctx, rx, B.y - 4, 1, B.h - 6, PALETTE.uiBad);
  tools.rect(ctx, rx + 6, B.y - 4, 1, B.h - 6, PALETTE.hostRed);
  const tailY = B.y + B.h - 10;
  tools.rect(ctx, rx, tailY, 2, 12, PALETTE.clothRed);
  tools.rect(ctx, rx + 5, tailY, 2, 12, PALETTE.clothRed);
  tools.detailRect(ctx, rx + 0.5, B.y - 3.5, 0.5, B.h - 7, PALETTE.uiWarn);

  const journal = ui.journal ?? {};
  const section = journal.section ?? 0;
  const turn = journal.turn ?? null;
  const contentSection = turn ? turn.from : section;
  const sectionId = (journal.sections ?? [])[contentSection] ?? 'QUESTS';
  journalTabs(ctx, B, journal.sections ?? [], section, tools);

  journalContent(ctx, left, right, contentSection, journal, tools);
  if (turn) journalPageTurn(ctx, left, right, turn, tools);
  journalArrowButton(ctx, JOURNAL_ARROW_BOXES.prev, 'prev', tools);
  journalArrowButton(ctx, JOURNAL_ARROW_BOXES.next, 'next', tools);

  journalFooter(ctx, B, journal.time, sectionId, tools);
}

function journalContent(ctx, left, right, section, journal, tools) {
  const sectionId = (journal.sections ?? [])[section] ?? 'QUESTS';
  if (sectionId === 'MAP') journalMapPage(ctx, left, right, journal.map, tools);
  else if (sectionId === 'NOTES') journalNotesPage(ctx, left, right, journal.findings ?? [], journal.evidenceIndex ?? 0, tools);
  else if (sectionId === 'FACTIONS') journalFactionsPage(ctx, left, right, journal.factions ?? [], journal.factionIndex ?? 0, tools);
  else if (sectionId === 'CHARACTER') journalCharacterPage(ctx, left, right, journal.character ?? {}, journal.primaryIndex ?? 0, tools);
  else if (sectionId === 'SCARS') journalScarsPage(ctx, left, right, journal.character ?? {}, tools);
  else if (sectionId === 'TECHNIQUES') journalTechniquesPage(ctx, left, right, journal.techniques ?? {}, tools);
  else if (sectionId === 'DRONE') journalDronePage(ctx, left, right, journal.drone ?? {}, tools);
  else journalQuestsPage(ctx, left, right, journal.quests ?? [], journal.character ?? {}, tools);
}

function journalFooter(ctx, B, time, sectionId, tools) {
  const controls = journalUsageLine(sectionId);
  const y = B.y + B.h - 9;
  const controlsX = B.x + B.w - ledgerTextWidth(controls) - 14;
  const stampX = B.x + 48;
  const stampMax = Math.max(12, Math.floor((controlsX - stampX - 12) / 5));
  const stamp = time
    ? `${time.dateLabel ?? 'FIELD DAY 1, YEAR 130 AFTER DESCENT'}  ${time.timeLabel ?? '08:00'}`
    : '';

  tools.rect(ctx, B.x + 42, y - 3, B.w - 84, 10, PALETTE.woodDark);
  tools.rect(ctx, B.x + 43, y - 2, B.w - 86, 1, PALETTE.woodLight);
  if (stamp) ledgerText(ctx, clipLedgerText(stamp, stampMax), stampX, y, PALETTE.clothTan, tools);
  ledgerText(ctx, controls, controlsX, y, PALETTE.uiBorderLight, tools);
}

function journalUsageLine(sectionId) {
  if (sectionId === 'MAP') return '[CLICK] ROUTE  [A D] TURN  [J/ESC] CLOSE';
  if (sectionId === 'NOTES') return '[WHEEL/UP DN] SCROLL  [A D] TURN  [J/ESC] CLOSE';
  if (sectionId === 'FACTIONS') return '[UP DN] SELECT  [A D] TURN  [J/ESC] CLOSE';
  if (sectionId === 'CHARACTER') return '[UP DN] SELECT  [ENTER] SPEND  [J/ESC] CLOSE';
  if (sectionId === 'TECHNIQUES') return '[CLICK/UP DN] SELECT  [ENTER] LEARN  [J/ESC] CLOSE';
  if (sectionId === 'DRONE') return '[UP DN] NODE  [A D] BRANCH  [ENTER] INSTALL  [J/ESC] CLOSE';
  return '[A D] TURN  [M] MAP  [J/ESC] CLOSE';
}

function journalCoverWear(ctx, B, noise, tools) {
  const rubbed = 'rgba(177, 130, 72, 0.36)';
  const cut = 'rgba(28, 18, 12, 0.45)';
  for (const [x, y, w, h] of [
    [B.x + 13, B.y + 12, 34, 3],
    [B.x + B.w - 52, B.y + 13, 38, 3],
    [B.x + 15, B.y + B.h - 18, 46, 4],
    [B.x + B.w - 71, B.y + B.h - 18, 58, 4]
  ]) {
    tools.rect(ctx, x, y, w, h, rubbed);
    tools.rect(ctx, x + 3, y + h, Math.max(3, w - 12), 1, cut);
  }
  for (let i = 0; i < 18; i += 1) {
    const sx = B.x + 24 + Math.floor(noise(i * 4 + 17) * (B.w - 48));
    const sy = B.y + 22 + Math.floor(noise(i * 6 + 29) * (B.h - 54));
    const len = 10 + Math.floor(noise(i * 8 + 31) * 30);
    tools.rect(ctx, sx, sy, len, 1, cut);
    if (noise(i * 2 + 5) > 0.55) tools.rect(ctx, sx + 1, sy - 1, Math.max(2, Math.floor(len / 3)), 1, rubbed);
    tools.detailRect(ctx, sx + 0.5, sy + 0.5, Math.max(1, Math.floor(len / 2)), 0.5, PALETTE.woodLight);
  }
  for (let y = B.y + 42; y < B.y + B.h - 42; y += 52) {
    tools.rect(ctx, B.x + 2, y, 3, 24, PALETTE.outline);
    tools.rect(ctx, B.x + B.w - 5, y + 8, 3, 20, PALETTE.outline);
  }
}

function journalArrowButton(ctx, box, direction, tools) {
  const lit = PALETTE.uiBorderLight;
  tools.rect(ctx, box.x - 1, box.y - 1, box.w + 2, box.h + 2, PALETTE.outline);
  tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.woodDark);
  tools.rect(ctx, box.x + 2, box.y + 2, box.w - 4, box.h - 4, PALETTE.woodMid);
  tools.rect(ctx, box.x + 3, box.y + 3, box.w - 6, 1, PALETTE.woodLight);
  tools.detailRect(ctx, box.x + 2.5, box.y + 2.5, box.w - 5, 0.5, PALETTE.uiBorderLight);
  tools.detailRect(ctx, box.x + box.w - 2.5, box.y + 2.5, 0.5, box.h - 5, PALETTE.outline);
  journalArrowGlyph(ctx, box.x + Math.floor(box.w / 2), box.y + Math.floor(box.h / 2), direction, lit, tools);
  const key = direction === 'prev' ? 'A' : 'D';
  ledgerText(ctx, key, box.x + Math.floor((box.w - ledgerTextWidth(key)) / 2), box.y + box.h - 13, PALETTE.clothTan, tools);
}

function journalArrowGlyph(ctx, cx, cy, direction, color, tools) {
  const rows = [1, 3, 5, 7, 5, 3, 1];
  for (let row = 0; row < rows.length; row += 1) {
    const w = rows[row];
    const y = cy - 3 + row;
    const offset = Math.floor(w / 2);
    if (direction === 'prev') tools.rect(ctx, cx - 2 - offset, y, w, 1, color);
    else tools.rect(ctx, cx + 2 - offset, y, w, 1, color);
  }
  tools.rect(ctx, direction === 'prev' ? cx + 1 : cx - 4, cy - 1, 5, 3, color);
}

function journalPageTurn(ctx, left, right, turn, tools) {
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
  tools.rect(ctx, shadowX, top + 5, 10, fullH - 10, 'rgba(16, 10, 6, 0.34)');
  tools.rect(ctx, forward ? foldX + 4 : foldX - 14, top + 1, 10, fullH - 2, 'rgba(42, 27, 12, 0.18)');
  tools.detailRect(ctx, shadowX + 0.5, top + 5.5, 0.5, fullH - 11, PARCHMENT.inkDim);

  for (let i = 0; i < width; i += 2) {
    const t = i / Math.max(1, width - 1);
    const x = forward ? foldX + i : foldX - i;
    if (x < minX || x > maxX) continue;
    const curve = Math.sin(t * Math.PI) * Math.sin(p * Math.PI);
    const yOff = Math.round(curve * 13);
    const stripH = fullH - yOff * 2;
    const color = t < 0.12 ? PARCHMENT.hi : t > 0.78 ? PARCHMENT.lo : (i % 4 === 0 ? PARCHMENT.base : PARCHMENT.flap);
    tools.rect(ctx, x, top + yOff, 2, stripH, color);
    if (i % 10 === 0) tools.rect(ctx, x, top + yOff + 16, 1, Math.max(4, stripH - 32), 'rgba(72, 55, 33, 0.18)');
  }

  tools.rect(ctx, foldX - 1, top + 3, 2, fullH - 6, PARCHMENT.inkDim);
  tools.detailRect(ctx, foldX - 0.5, top + 3.5, 0.5, fullH - 7, PARCHMENT.hi);
  for (let yy = top + 18; yy < top + fullH - 14; yy += 22) {
    tools.rect(ctx, foldX + (forward ? 5 : -10), yy, 9, 1, 'rgba(78, 58, 32, 0.22)');
  }
}

// Section tabs sticking up from the top edge; the active one is parchment and
// sits a little proud of the leather ones.
function journalTabs(ctx, B, sections, active, tools) {
  const boxes = journalTabBoxes(sections.length);
  for (let i = 0; i < sections.length; i += 1) {
    const box = boxes[i];
    const on = i === active;
    const h = on ? 22 : 17;
    const y = on ? box.y : box.y + 5;
    tools.rect(ctx, box.x - 1, y - 1, box.w + 2, h + 2, PALETTE.outline);
    tools.rect(ctx, box.x, y, box.w, h, on ? PARCHMENT.base : PALETTE.woodMid);
    tools.rect(ctx, box.x, y, box.w, 1, on ? PARCHMENT.hi : PALETTE.woodLight);
    tools.rect(ctx, box.x + 3, y + h - 3, box.w - 6, 1, on ? PARCHMENT.rule : PALETTE.woodDark);
    tools.detailRect(ctx, box.x + 0.5, y + 0.5, box.w - 1, 0.5, on ? PARCHMENT.hi : PALETTE.uiBorderLight);
    tools.detailRect(ctx, box.x + 0.5, y + 0.5, 0.5, h - 1, on ? PARCHMENT.hi : PALETTE.uiBorderLight);
    const label = `${i + 1} ${SECTION_LABELS[sections[i]] ?? sections[i]}`;
    const lw = ledgerTextWidth(label);
    ledgerText(ctx, label, box.x + Math.floor((box.w - lw) / 2), y + Math.floor((h - 6) / 2), on ? PARCHMENT.ink : PALETTE.clothTan, tools);
  }
}

function journalHeader(ctx, page, label, tools, form = '') {
  tools.text(ctx, label, page.x + 14, page.y + 7, PARCHMENT.ink, 2);
  const filing = form ? `FORM ${form}` : 'CENSURE FILE';
  ledgerText(ctx, filing, page.x + page.w - ledgerTextWidth(filing) - 13, page.y + 8, PALETTE.clothRed, tools);
  tools.rect(ctx, page.x + 12, page.y + 24, page.w - 24, 2, PARCHMENT.inkDim);
  tools.rect(ctx, page.x + 12, page.y + 27, 54, 1, PALETTE.clothRed);
  tools.detailRect(ctx, page.x + 12.5, page.y + 24.5, page.w - 25, 0.5, PARCHMENT.ink);
  tools.detailRect(ctx, page.x + 12.5, page.y + 27.5, 53, 0.5, PALETTE.uiFailure);
  return page.y + 34;
}

function journalSeal(ctx, page, tools, character = {}) {
  const sx = page.x + page.w - 42;
  const sy = page.y + page.h - 38;
  journalDisc(ctx, sx, sy, 13, PALETTE.hostRed, tools);
  journalDisc(ctx, sx, sy, 11, PALETTE.clothRed, tools);
  tools.rect(ctx, sx - 1, sy - 8, 2, 16, PALETTE.hostGold);
  tools.rect(ctx, sx - 8, sy - 1, 16, 2, PALETTE.hostGold);
  tools.rect(ctx, sx - 1, sy - 1, 2, 2, PALETTE.uiWarn);
  tools.detailRect(ctx, sx - 7.5, sy - 7.5, 6, 0.5, PALETTE.uiWarn);
  tools.detailRect(ctx, sx - 0.5, sy - 7.5, 0.5, 6, PALETTE.uiWarn);
  tools.text(ctx, tools.clip(character.name ?? 'UNKNOWN AGENT', 30), page.x + 12, page.y + page.h - 24, PARCHMENT.inkDim);
  tools.text(ctx, tools.clip(character.role ?? 'ASHEN CENSURE', 30), page.x + 12, page.y + page.h - 14, PARCHMENT.inkDim);
}

function journalQuestsPage(ctx, left, right, quests, character, tools) {
  const C = PARCHMENT;
  const INK_RED = PALETTE.clothRed;
  const lx = left.x + 14;
  let y = journalHeader(ctx, left, 'ACTIVE WRITS', tools, SECTION_FORMS.QUESTS);
  ledgerText(ctx, 'CASE STATUS AND REQUIRED ACTS', lx, y, C.inkDim, tools);
  y += 12;
  if (!quests.length) tools.text(ctx, 'NO ACTIVE WRIT.', lx, y, C.inkDim);
  for (let questIndex = 0; questIndex < quests.length; questIndex += 1) {
    const quest = quests[questIndex];
    if (y > left.y + left.h - 44) {
      ledgerText(ctx, 'MORE WRITS HELD IN OFFICE FILE', lx, left.y + left.h - 22, INK_RED, tools);
      break;
    }
    const caseLabel = `CASE ${String(questIndex + 1).padStart(2, '0')}  ${quest.complete ? 'CLOSED' : 'OPEN'}`;
    tools.rect(ctx, lx - 3, y - 3, left.w - 22, 13, quest.complete ? C.rule : C.hi);
    tools.detailRect(ctx, lx - 2.5, y - 2.5, left.w - 23, 0.5, quest.complete ? C.inkDim : C.hi);
    ledgerText(ctx, caseLabel, lx + 3, y, quest.complete ? C.inkDim : INK_RED, tools);
    y += 14;
    const title = tools.clip(quest.title, 36);
    tools.text(ctx, title, lx, y, C.ink);
    tools.rect(ctx, lx, y + 9, tools.textWidth(title), 1, C.inkDim);
    y += 16;
    if (quest.task) {
      ledgerText(ctx, 'ORDER', lx, y + 1, C.inkDim, tools);
      tools.text(ctx, tools.clip(quest.task, 31), lx + 34, y, quest.complete ? C.inkDim : INK_RED);
      y += 15;
    }
    for (const obj of quest.objectives ?? []) {
      const color = obj.lead ? INK_RED : obj.done ? C.inkDim : C.ink;
      const wrapped = tools.wrap(obj.text, 36);
      const tx = lx + 16;
      if (y + wrapped.length * 10 > left.y + left.h - 28) {
        ledgerText(ctx, 'CONTINUED IN CASE FILE', lx, left.y + left.h - 22, INK_RED, tools);
        y = left.y + left.h;
        break;
      }
      if (obj.active) {
        tools.rect(ctx, lx - 4, y - 3, left.w - 20, wrapped.length * 10 + 5, C.hi);
        tools.rect(ctx, lx - 4, y - 3, 2, wrapped.length * 10 + 5, INK_RED);
        tools.detailRect(ctx, lx - 3.5, y - 2.5, left.w - 21, 0.5, C.base);
      }
      journalObjectiveMark(ctx, lx, y - 1, obj, tools);
      let ly = y;
      for (const line of wrapped) {
        tools.text(ctx, line, tx, ly, color);
        if (obj.done) tools.rect(ctx, tx, ly + 3, tools.textWidth(line), 1, C.inkDim);
        ly += 10;
      }
      y = ly + 3;
    }
    y += 6;
  }

  let ry = journalHeader(ctx, right, 'FIELD ORDER', tools, SECTION_FORMS.QUESTS);
  const rx = right.x + 14;
  ledgerText(ctx, 'CULT BREAKER COPY. CENSURE PROPERTY.', rx, ry, INK_RED, tools);
  ry += 14;
  const note = quests.find((q) => q.note)?.note ?? '';
  if (note) {
    for (const line of tools.wrap(note, 40).slice(0, 13)) {
      tools.text(ctx, line, rx, ry, C.inkDim);
      ry += 11;
    }
  } else {
    tools.text(ctx, 'NOTHING SET DOWN YET.', rx, ry, C.inkDim);
  }
  journalObjectiveLegend(ctx, right, tools);
  journalSeal(ctx, right, tools, character);
}

function journalMapPage(ctx, left, right, map, tools) {
  const C = PARCHMENT;
  let y = journalHeader(ctx, left, 'FIELD MAP', tools, SECTION_FORMS.MAP);
  const lx = left.x + 14;
  if (!map) {
    tools.text(ctx, 'NO AREA MAP.', lx, y, C.inkDim);
    return;
  }

  tools.text(ctx, tools.clip(map.name ?? 'AREA MAP', 34), lx, y, C.ink);
  const total = Math.max(1, map.totalCells ?? 1);
  const percent = Math.round(((map.exploredCount ?? 0) / total) * 100);
  ledgerText(ctx, `${percent}% FILED`, left.x + left.w - ledgerTextWidth(`${percent}% FILED`) - 14, y + 1, C.inkDim, tools);
  y += 15;

  drawMapField(ctx, JOURNAL_MAP_FIELD_BOX, map, tools);

  const footerY = left.y + left.h - 36;
  ledgerText(ctx, '[CLICK] SETS A WALK ROUTE', lx, footerY, PALETTE.clothRed, tools);
  ledgerText(ctx, 'BLACK GROUND HAS NOT BEEN CLEARED', lx, footerY + 10, C.inkDim, tools);

  journalMapNotes(ctx, right, map, tools);
}

function drawMapField(ctx, box, map, tools) {
  const metrics = journalMapGridMetrics(map, box);
  if (!metrics) return;
  const { scale, scaleX, scaleY } = metrics;
  const ox = metrics.x;
  const oy = metrics.y;

  tools.rect(ctx, box.x - 1, box.y - 1, box.w + 2, box.h + 2, PARCHMENT.inkDim);
  tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.void);
  tools.detailRect(ctx, box.x - 0.5, box.y - 0.5, box.w + 1, 0.5, PARCHMENT.ink);
  tools.detailRect(ctx, box.x - 0.5, box.y - 0.5, 0.5, box.h + 1, PARCHMENT.ink);
  for (const cell of map.cells ?? []) {
    const x = ox + cell.x * scaleX;
    const y = oy + cell.y * scaleY;
    if (x < box.x || y < box.y || x >= box.x + box.w || y >= box.y + box.h) continue;
    tools.rect(ctx, x, y, scaleX, scaleY, mapCellColor(cell));
  }

  const markers = (map.markers ?? []).filter((marker) => marker.kind !== 'player');
  for (const marker of markers) drawMapMarker(ctx, metrics, marker, tools);
  const player = (map.markers ?? []).find((marker) => marker.kind === 'player');
  if (player) drawMapMarker(ctx, metrics, player, tools);
}

function journalMapNotes(ctx, right, map, tools) {
  const C = PARCHMENT;
  let y = journalHeader(ctx, right, 'ROUTE MARKS', tools, SECTION_FORMS.MAP);
  const rx = right.x + 14;
  tools.text(ctx, tools.clip(map.name ?? 'AREA', 36), rx, y, C.ink);
  y += 14;

  ledgerText(ctx, 'MAP KEY', rx, y + 1, C.inkDim, tools);
  y += 12;
  const legend = [
    ['OPEN', mapCellColor({ explored: true, type: 'floor' })],
    ['WALL', mapCellColor({ explored: true, type: 'wall' })],
    ['BLOCK', mapCellColor({ explored: true, type: 'blocked' })],
    ['DARK', mapCellColor({ explored: false, type: 'floor' })],
    ['YOU', mapMarkerColor('player')],
    ['WRIT', mapMarkerColor('quest')],
    ['TALK', mapMarkerColor('dialogue')],
    ['RISK', mapMarkerColor('danger')]
  ];
  for (let i = 0; i < legend.length; i += 1) {
    const col = i < 4 ? rx : rx + 92;
    const rowY = y + (i % 4) * 11;
    tools.rect(ctx, col, rowY + 1, 7, 7, PARCHMENT.inkDim);
    tools.rect(ctx, col + 1, rowY + 2, 5, 5, legend[i][1]);
    ledgerText(ctx, legend[i][0], col + 12, rowY + 1, C.inkDim, tools);
  }
  y += 52;

  ledgerText(ctx, 'CLEARED MARKS', rx, y + 1, C.inkDim, tools);
  y += 12;
  const markers = (map.markers ?? []).filter((marker) => marker.kind !== 'player');
  if (!markers.length) {
    tools.text(ctx, 'NO MARKS IN SIGHT.', rx, y, C.inkDim);
    return;
  }
  for (const marker of markers.slice(0, 13)) {
    const color = mapMarkerColor(marker.kind);
    tools.rect(ctx, rx, y + 1, 7, 7, PARCHMENT.inkDim);
    tools.rect(ctx, rx + 1, y + 2, 5, 5, color);
    ledgerText(ctx, markerKindLabel(marker.kind), rx + 12, y + 1, color, tools);
    tools.text(ctx, tools.clip(marker.label ?? 'MARK', 27), rx + 48, y, C.inkDim);
    y += 12;
    if (y > right.y + right.h - 18) {
      tools.text(ctx, '. . .', rx, y, C.inkDim);
      break;
    }
  }
}

function drawMapMarker(ctx, metrics, marker, tools) {
  const { scale, scaleX, scaleY } = metrics;
  const color = mapMarkerColor(marker.kind);
  const x = metrics.x + marker.x * scaleX + Math.floor(scaleX / 2);
  const y = metrics.y + marker.y * scaleY + Math.floor(scaleY / 2);
  if (marker.kind === 'player') {
    tools.rect(ctx, x - 3, y, 7, 1, PARCHMENT.ink);
    tools.rect(ctx, x, y - 3, 1, 7, PARCHMENT.ink);
    tools.rect(ctx, x - 2, y, 5, 1, color);
    tools.rect(ctx, x, y - 2, 1, 5, color);
    tools.detailRect(ctx, x - 1.5, y - 2.5, 0.5, 5, PALETTE.uiWarn);
    return;
  }
  const s = Math.max(2, Math.min(4, scale + 1));
  const bx = x - Math.floor(s / 2);
  const by = y - Math.floor(s / 2);
  tools.rect(ctx, bx - 1, by - 1, s + 2, s + 2, PARCHMENT.ink);
  tools.rect(ctx, bx, by, s, s, color);
  tools.detailRect(ctx, bx + 0.5, by + 0.5, Math.max(0.5, s - 1), 0.5, PARCHMENT.hi);
}

function mapCellColor(cell) {
  if (!cell.explored || cell.hidden) return PALETTE.void;
  if (cell.type === 'wall') return PARCHMENT.inkDim;
  if (cell.type === 'blocked') return PALETTE.woodDark;
  if (cell.type === 'secret' || cell.type === 'void') return PALETTE.outline;
  return PARCHMENT.hi;
}

function mapMarkerColor(kind) {
  if (kind === 'player') return PALETTE.clothRed;
  if (kind === 'quest') return PALETTE.hostGold;
  if (kind === 'dialogue') return PALETTE.clothBlue;
  if (kind === 'exit') return PALETTE.uiGood;
  if (kind === 'locked') return PALETTE.uiWarn;
  if (kind === 'search') return PALETTE.stoneLight;
  if (kind === 'danger') return PALETTE.uiBad;
  return PARCHMENT.inkDim;
}

function markerKindLabel(kind) {
  if (kind === 'quest') return 'WRIT';
  if (kind === 'dialogue') return 'TALK';
  if (kind === 'exit') return 'EXIT';
  if (kind === 'locked') return 'LOCK';
  if (kind === 'search') return 'SEEK';
  if (kind === 'danger') return 'RISK';
  return 'NOTE';
}

function journalNotesPage(ctx, left, right, findings, evidenceIndex, tools) {
  const C = PARCHMENT;
  const pages = [left, right];
  const window = journalEvidenceWindow(findings, evidenceIndex);
  journalHeader(ctx, left, 'EVIDENCE LOG', tools, SECTION_FORMS.NOTES);
  if (!findings.length) {
    tools.text(ctx, 'NO EVIDENCE FILED.', left.x + 14, left.y + 34, C.inkDim);
    return;
  }
  if (window.entries.some((entry) => entry.pageIndex === 1)) {
    journalHeader(ctx, right, 'EVIDENCE LOG', tools, SECTION_FORMS.NOTES);
  }
  for (const entry of window.entries) {
    const page = pages[entry.pageIndex];
    const y = entry.y;
    const tag = `E${String(entry.index + 1).padStart(2, '0')}`;
    tools.rect(ctx, page.x + 11, y - 3, 29, 11, C.hi);
    tools.rect(ctx, page.x + 11, y - 3, 2, 11, PALETTE.clothRed);
    tools.detailRect(ctx, page.x + 11.5, y - 2.5, 28, 0.5, C.base);
    ledgerText(ctx, tag, page.x + 17, y, PALETTE.clothRed, tools);
    let ly = y;
    for (const line of entry.lines) {
      tools.text(ctx, line, page.x + 46, ly, C.ink);
      ly += 10;
    }
    const ruleY = ly + 3;
    tools.rect(ctx, page.x + 14, ruleY, page.w - 28, 1, C.rule);
  }
  if (window.hasPrevious) tools.scrollArrow(ctx, left.x + left.w - 14, left.y + 35, -1, PALETTE.clothRed);
  if (window.hasNext) tools.scrollArrow(ctx, right.x + right.w - 14, right.y + right.h - 19, 1, PALETTE.clothRed);
}

// A codex: a selectable list of known factions on the left, the full record of
// the selected one on the right. Cult entries appear here as they are learned.
function journalFactionsPage(ctx, left, right, factions, selected, tools) {
  const C = PARCHMENT;
  const known = factions.filter((f) => f.known);
  const hasLocked = factions.some((f) => !f.known);

  let y = journalHeader(ctx, left, 'KNOWN CELLS', tools, SECTION_FORMS.FACTIONS);
  const lx = left.x + 14;
  ledgerText(ctx, 'PERSONS, ORDERS, AND HOST CULTS', lx, y, C.inkDim, tools);
  y += 13;
  if (!known.length) tools.text(ctx, 'NO RECORDS YET.', lx, y, C.inkDim);
  const sel = Math.max(0, Math.min(known.length - 1, selected));
  const maxRows = 17;
  const start = Math.max(0, Math.min(Math.max(0, known.length - maxRows), sel - maxRows + 1));
  const end = Math.min(known.length, start + maxRows);
  if (start > 0) tools.scrollArrow(ctx, left.x + left.w - 14, y - 8, -1, PALETTE.clothRed);
  for (let i = start; i < end; i += 1) {
    const on = i === sel;
    if (on) {
      tools.rect(ctx, left.x + 7, y - 3, left.w - 14, 13, C.hi);
      tools.rect(ctx, left.x + 7, y - 3, 2, 13, PALETTE.clothRed);
      tools.detailRect(ctx, left.x + 7.5, y - 2.5, left.w - 15, 0.5, C.base);
    }
    ledgerText(ctx, on ? 'OPEN' : 'FILE', lx, y + 1, on ? PALETTE.clothRed : C.inkDim, tools);
    tools.text(ctx, tools.clip(known[i].name, 30), lx + 31, y, on ? C.ink : C.inkDim);
    y += 14;
  }
  if (end < known.length) tools.scrollArrow(ctx, left.x + left.w - 14, y - 7, 1, PALETTE.clothRed);
  if (hasLocked) {
    y += 6;
    ledgerText(ctx, '[REDACTED FILES REMAIN]', lx, y, C.inkDim, tools);
  }

  let ry = journalHeader(ctx, right, 'CENSURE DOSSIER', tools, SECTION_FORMS.FACTIONS);
  const rx = right.x + 14;
  const entry = known[sel];
  if (!entry) { tools.text(ctx, 'NOTHING ON FILE.', rx, ry, C.inkDim); return; }
  journalStamp(ctx, right.x + right.w - 69, ry - 3, 'ON FILE', PALETTE.clothRed, tools);
  tools.text(ctx, tools.clip(entry.name, 33), rx, ry, C.ink);
  tools.rect(ctx, rx, ry + 9, tools.textWidth(tools.clip(entry.name, 33)), 1, C.inkDim);
  ry += 15;
  if (entry.kind) {
    ledgerText(ctx, `CLASS ${clipLedgerText(entry.kind, 38)}`, rx, ry + 1, PALETTE.clothRed, tools);
    ry += 14;
  }
  ledgerText(ctx, 'ASSESSMENT', rx, ry + 1, C.inkDim, tools);
  ry += 12;
  for (const line of tools.wrap(entry.summary, 40).slice(0, 8)) {
    tools.text(ctx, line, rx, ry, C.inkDim);
    ry += 10;
  }
  ry += 4;
  ledgerText(ctx, 'KNOWN FACTS', rx, ry + 1, C.inkDim, tools);
  ry += 12;
  for (const fact of entry.facts ?? []) {
    if (ry > right.y + right.h - 27) {
      ledgerText(ctx, 'FILE CONTINUES', rx, right.y + right.h - 20, PALETTE.clothRed, tools);
      break;
    }
    journalEvidenceTick(ctx, rx, ry - 1, tools);
    let ly = ry;
    for (const line of tools.wrap(fact, 38).slice(0, 3)) {
      tools.text(ctx, line, rx + 12, ly, C.inkDim);
      ly += 10;
    }
    ry = ly + 2;
  }
}

function journalCharacterPage(ctx, left, right, character, selectedPrimary, tools) {
  const C = PARCHMENT;
  const lx = left.x + 14;
  let y = journalHeader(ctx, left, 'AGENT RECORD', tools, SECTION_FORMS.CHARACTER);

  tools.text(ctx, tools.clip(character.name ?? 'UNKNOWN AGENT', 30), lx, y, C.ink);
  y += 13;
  tools.text(ctx, tools.clip(character.role ?? 'ASHEN CENSURE', 34), lx, y, PALETTE.clothRed);
  y += 18;

  ledgerText(ctx, `LEVEL ${character.level ?? 1}`, lx, y + 1, C.inkDim, tools);
  tools.text(ctx, tools.clip(character.build?.label ?? 'FIELD AGENT', 22), lx + 78, y, PALETTE.clothRed);
  y += 13;
  const xp = character.xp ?? {};
  const xpLabel = xp.atCap ? `XP ${xp.current ?? 0}` : `XP ${xp.current ?? 0}/${xp.nextLevelXp ?? 0}`;
  tools.text(ctx, tools.clip(xpLabel, 18), lx, y, C.inkDim);
  journalValueBar(ctx, lx + 78, y + 2, 114, 5, xp.intoLevel ?? 0, Math.max(1, xp.needed ?? 1), PALETTE.clothRed, C.rule, tools);
  y += 13;
  ledgerText(ctx, `PRIMARY POINTS ${character.primaryPoints ?? 0}`, lx, y + 1, C.inkDim, tools);
  y += 18;
  ledgerText(ctx, `ACTIVE TP ${character.activeTechniquePoints ?? 0}  PASSIVE TP ${character.passiveTechniquePoints ?? 0}`, lx, y + 1, C.inkDim, tools);
  y += 14;

  tools.text(ctx, `TRACE ${character.trace?.label ?? 'CLEAN'}`, lx, y, C.ink);
  y += 13;
  ledgerText(ctx, `ICON RISK ${clipLedgerText(character.iconRisk?.label ?? 'NOT ASSESSED', 28)}`, lx, y + 1, PALETTE.clothRed, tools);
  y += 18;

  ledgerText(ctx, 'PRIMARY ATTRIBUTES', lx, y + 1, C.inkDim, tools);
  y += 13;
  const primaries = character.primaries ?? [];
  const sel = Math.max(0, Math.min(primaries.length - 1, selectedPrimary));
  for (let i = 0; i < primaries.length; i += 1) {
    const primary = primaries[i];
    const on = i === sel;
    if (on) {
      tools.rect(ctx, left.x + 7, y - 3, left.w - 14, 13, C.hi);
      tools.rect(ctx, left.x + 7, y - 3, 2, 13, PALETTE.clothRed);
      tools.detailRect(ctx, left.x + 7.5, y - 2.5, left.w - 15, 0.5, C.base);
    }
    ledgerText(ctx, on ? 'SEL' : '   ', lx, y + 1, PALETTE.clothRed, tools);
    ledgerText(ctx, clipLedgerText(primary.label, 14), lx + 24, y + 1, C.ink, tools);
    tools.text(ctx, `${primary.value ?? 0}/10`, lx + 96, y, C.inkDim);
    journalValueBar(ctx, lx + 128, y + 2, 92, 5, primary.value ?? 0, 10, PALETTE.clothRed, C.rule, tools);
    y += 13;
  }
  if ((character.primaryPoints ?? 0) > 0) {
    journalStamp(ctx, left.x + 14, left.y + left.h - 24, 'ENTER SPENDS POINT', PALETTE.clothRed, tools);
  }

  let ry = journalHeader(ctx, right, 'FIELD RATINGS', tools, SECTION_FORMS.CHARACTER);
  const fields = character.fields ?? [];
  const topFields = new Set((character.topFields ?? []).map((field) => field.id));
  const leftFields = fields.slice(0, Math.ceil(fields.length / 2));
  const rightFields = fields.slice(Math.ceil(fields.length / 2));
  journalFieldColumn(ctx, right.x + 12, ry, leftFields, topFields, 100, tools);
  journalFieldColumn(ctx, right.x + 124, ry, rightFields, topFields, 100, tools);
  journalSeal(ctx, right, tools, character);
}

function journalTechniquesPage(ctx, left, right, techniques, tools) {
  const C = PARCHMENT;
  const entries = techniques.entries ?? [];
  const listWindow = journalTechniqueWindow(entries, techniques.selectedIndex);
  const selected = listWindow.selected;
  const lx = left.x + 14;
  let y = journalHeader(ctx, left, 'FIELD METHODS', tools, SECTION_FORMS.TECHNIQUES);
  techniquePointBox(ctx, lx, y, 'ACTIVE', techniques.activePoints ?? 0, tools);
  techniquePointBox(ctx, lx + 115, y, 'PASSIVE', techniques.passivePoints ?? 0, tools);
  const range = entries.length
    ? `${listWindow.start + 1}-${listWindow.end} OF ${entries.length}`
    : '0 OF 0';
  ledgerText(ctx, range, left.x + left.w - ledgerTextWidth(range) - 14, y + 27, C.inkDim, tools);
  ledgerText(ctx, '[X] FILED  [+] READY  [ ] LOCKED', lx, y + 40, C.inkDim, tools);

  if (!entries.length) {
    tools.text(ctx, 'NO METHODS FILED.', lx, JOURNAL_TECHNIQUE_LIST.y + JOURNAL_TECHNIQUE_LIST.textOffset, C.inkDim);
  }
  if (listWindow.hasPrevious) {
    tools.scrollArrow(ctx, left.x + left.w - 13, JOURNAL_TECHNIQUE_LIST.y - 6, -1, PALETTE.clothRed);
  }
  for (let row = 0; row < listWindow.entries.length; row += 1) {
    const entry = listWindow.entries[row];
    const index = listWindow.start + row;
    const on = index === selected;
    const known = entry.known;
    const available = entry.canLearn;
    const color = known ? PALETTE.clothRed : available ? C.ink : C.inkDim;
    const rowY = JOURNAL_TECHNIQUE_LIST.y + row * JOURNAL_TECHNIQUE_LIST.rowHeight;
    if (on) {
      tools.rect(ctx, JOURNAL_TECHNIQUE_LIST.x, rowY, JOURNAL_TECHNIQUE_LIST.w, 13, C.hi);
      tools.rect(ctx, JOURNAL_TECHNIQUE_LIST.x, rowY, 2, 13, PALETTE.clothRed);
      tools.detailRect(ctx, JOURNAL_TECHNIQUE_LIST.x + 0.5, rowY + 0.5, JOURNAL_TECHNIQUE_LIST.w - 1, 0.5, C.base);
    }
    techniqueStatusMark(ctx, JOURNAL_TECHNIQUE_LIST.x + 5, rowY + 2, entry, tools);
    tools.text(
      ctx,
      tools.clip(entry.name ?? entry.id ?? 'METHOD', 28),
      JOURNAL_TECHNIQUE_LIST.x + 20,
      rowY + JOURNAL_TECHNIQUE_LIST.textOffset,
      color
    );
    ledgerText(
      ctx,
      entry.type === 'passive' ? 'PAS' : 'ACT',
      left.x + left.w - 31,
      rowY + JOURNAL_TECHNIQUE_LIST.textOffset + 1,
      on ? PALETTE.clothRed : C.inkDim,
      tools
    );
  }
  if (listWindow.hasNext) {
    const bottomY = JOURNAL_TECHNIQUE_LIST.y + JOURNAL_TECHNIQUE_LIST.visibleRows * JOURNAL_TECHNIQUE_LIST.rowHeight + 1;
    tools.scrollArrow(ctx, left.x + left.w - 13, bottomY, 1, PALETTE.clothRed);
  }

  let ry = journalHeader(ctx, right, 'METHOD FILE', tools, SECTION_FORMS.TECHNIQUES);
  const rx = right.x + 14;
  const entry = entries[selected];
  if (!entry) {
    tools.text(ctx, 'NOTHING SELECTED.', rx, ry, C.inkDim);
    return;
  }
  const stateLabel = entry.known ? 'FILED' : entry.canLearn ? 'READY' : 'LOCKED';
  journalStamp(ctx, right.x + right.w - 61, ry - 3, stateLabel, entry.canLearn || entry.known ? PALETTE.clothRed : C.inkDim, tools);
  tools.text(ctx, tools.clip(entry.name ?? 'METHOD', 31), rx, ry, C.ink);
  ry += 16;
  ledgerField(ctx, rx, ry, 'USE', entry.type === 'passive' ? 'ALWAYS IN FORCE' : 'COMBAT ACTION', tools);
  ry += 13;
  ledgerField(ctx, rx, ry, 'TARGET', techniqueTargetText(entry), tools);
  ry += 17;

  ledgerText(ctx, 'FIELD EFFECT', rx, ry + 1, C.inkDim, tools);
  ry += 12;
  for (const line of tools.wrap(entry.summary ?? '', 40).slice(0, 6)) {
    tools.text(ctx, line, rx, ry, C.inkDim);
    ry += 10;
  }
  ry += 7;
  ledgerText(ctx, 'ENTRY TEST', rx, ry + 1, C.inkDim, tools);
  ry += 12;
  for (const line of tools.wrap(entry.requirementText ?? 'No requirements', 40).slice(0, 5)) {
    tools.text(ctx, line, rx, ry, C.inkDim);
    ry += 10;
  }
  ry += 7;
  ledgerText(ctx, 'FILING STATE', rx, ry + 1, C.inkDim, tools);
  ry += 11;
  if (entry.known) tools.text(ctx, 'METHOD FILED.', rx, ry, PALETTE.clothRed);
  else if (entry.canLearn) tools.text(ctx, 'CLEARED TO LEARN.', rx, ry, PALETTE.clothRed);
  else tools.text(ctx, tools.clip(entry.disabledReason ?? 'LOCKED', 38), rx, ry, C.inkDim);
  if (entry.canLearn) {
    journalStamp(ctx, rx, right.y + right.h - 24, 'ENTER LEARNS METHOD', PALETTE.clothRed, tools);
  }
}

function journalDronePage(ctx, left, right, drone, tools) {
  const C = PARCHMENT;
  const branches = drone.branches ?? [];
  const nodes = drone.nodes ?? [];
  const branchIndex = Math.max(0, Math.min(branches.length - 1, drone.branchIndex ?? 0));
  const nodeIndex = Math.max(0, Math.min(nodes.length - 1, drone.nodeIndex ?? 0));
  const branch = branches[branchIndex] ?? null;
  const selected = nodes[nodeIndex] ?? null;
  const lx = left.x + 14;
  let y = journalHeader(ctx, left, 'ATTENDANT TREE', tools, SECTION_FORMS.DRONE);

  tools.text(ctx, tools.clip(drone.name ?? 'UNREGISTERED', 24), lx, y, C.ink);
  ledgerText(ctx, clipLedgerText(drone.model || 'NO MODEL REGISTERED', 34), lx, y + 12, C.inkDim, tools);
  ledgerText(
    ctx,
    `HP ${drone.hp ?? 0}/${drone.maxHp ?? 0}  POINTS ${drone.points ?? 0}  PARTS ${drone.parts ?? 0}`,
    lx,
    y + 24,
    PALETTE.clothRed,
    tools
  );
  y += 41;

  ledgerText(ctx, 'SERVICE BRANCH', lx, y, C.inkDim, tools);
  y += 10;
  for (let index = 0; index < branches.length; index += 1) {
    const entry = branches[index];
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = left.x + 12 + column * 127;
    const rowY = y + row * 14;
    const active = index === branchIndex;
    if (active) {
      tools.rect(ctx, x, rowY - 2, 122, 12, C.hi);
      tools.rect(ctx, x, rowY - 2, 2, 12, PALETTE.clothRed);
      tools.detailRect(ctx, x + 0.5, rowY - 1.5, 121, 0.5, C.base);
    }
    ledgerText(ctx, active ? 'SEL' : '   ', x + 4, rowY, PALETTE.clothRed, tools);
    ledgerText(ctx, clipLedgerText(entry.name ?? entry.id ?? 'BRANCH', 12), x + 26, rowY, active ? C.ink : C.inkDim, tools);
    ledgerText(ctx, `${entry.installed ?? 0}/8`, x + 96, rowY, active ? PALETTE.clothRed : C.inkDim, tools);
  }

  const graphLabelY = y + Math.ceil(branches.length / 2) * 14 + 3;
  ledgerText(ctx, branch ? `${String(branch.name).toUpperCase()} SERVICE MAP` : 'NO SERVICE MAP', lx, graphLabelY, C.inkDim, tools);
  droneUpgradeGraph(ctx, left, nodes, nodeIndex, graphLabelY + 11, Boolean(drone.recruited), tools);

  let ry = journalHeader(ctx, right, 'SERVICE ORDER', tools, SECTION_FORMS.DRONE);
  const rx = right.x + 14;
  if (!drone.recruited) {
    journalStamp(ctx, rx, ry - 2, 'NO ATTENDANT ON FILE', C.inkDim, tools);
    ry += 23;
    for (const line of tools.wrap('Complete attendant registration at a Censure shrine before filing service work.', 39).slice(0, 6)) {
      tools.text(ctx, line, rx, ry, C.inkDim);
      ry += 10;
    }
    return;
  }
  if (!selected) {
    tools.text(ctx, 'NO SERVICE NODE SELECTED.', rx, ry, C.inkDim);
    return;
  }

  const installed = Boolean(selected.purchased);
  const ready = Boolean(selected.unlocked);
  const stateLabel = installed ? 'INSTALLED' : ready ? 'READY' : 'LOCKED';
  journalStamp(ctx, right.x + right.w - 72, ry - 3, stateLabel, installed || ready ? PALETTE.clothRed : C.inkDim, tools);
  tools.text(ctx, tools.clip(selected.name ?? selected.id ?? 'SERVICE NODE', 29), rx, ry, C.ink);
  ry += 17;
  ledgerField(ctx, rx, ry, 'BRANCH', String(branch?.name ?? 'UNKNOWN').toUpperCase(), tools);
  ry += 13;
  ledgerField(ctx, rx, ry, 'TIER', `${selected.tier ?? 1}  RATING ${selected.rating ?? 0}/${selected.threshold ?? 0}`, tools);
  ry += 13;
  ledgerField(ctx, rx, ry, 'COST', droneUpgradeCost(selected), tools);
  ry += 19;

  ledgerText(ctx, 'FIELD EFFECT', rx, ry, C.inkDim, tools);
  ry += 11;
  for (const line of tools.wrap(selected.description ?? '', 40).slice(0, 7)) {
    tools.text(ctx, line, rx, ry, C.inkDim);
    ry += 10;
  }
  ry += 5;

  ledgerText(ctx, 'LINK TEST', rx, ry, C.inkDim, tools);
  ry += 11;
  const requirements = (selected.requires ?? []).map((id) => {
    return nodes.find((node) => node.id === id)?.name ?? id;
  });
  const requirementText = requirements.length ? requirements.join(' + ') : 'No linked service required.';
  for (const line of tools.wrap(requirementText, 40).slice(0, 4)) {
    tools.text(ctx, line, rx, ry, C.inkDim);
    ry += 10;
  }
  ry += 5;

  ledgerText(ctx, 'FILING STATE', rx, ry, C.inkDim, tools);
  ry += 11;
  const reason = installed ? 'Installed.' : ready ? 'Cleared for installation.' : selected.reason || 'Locked.';
  for (const line of tools.wrap(reason, 40).slice(0, 3)) {
    tools.text(ctx, line, rx, ry, installed || ready ? PALETTE.clothRed : C.inkDim);
    ry += 10;
  }

  if (ready && drone.confirmNodeId === selected.id) {
    journalStamp(ctx, rx, right.y + right.h - 24, 'ENTER AGAIN TO INSTALL', PALETTE.clothRed, tools);
    ledgerText(ctx, 'PERMANENT SERVICE ORDER', rx, right.y + right.h - 35, PALETTE.clothRed, tools);
  } else if (ready) {
    journalStamp(ctx, rx, right.y + right.h - 24, 'ENTER REVIEWS ORDER', PALETTE.clothRed, tools);
  }
}

function droneUpgradeGraph(ctx, page, nodes, selectedIndex, startY, recruited, tools) {
  const positions = new Map();
  const boxW = 116;
  const boxH = 24;
  const leftX = page.x + 12;
  const rightX = page.x + page.w - boxW - 12;
  const centerX = page.x + Math.floor((page.w - boxW) / 2);
  const layout = [
    [leftX, startY],
    [rightX, startY],
    [leftX, startY + 31],
    [rightX, startY + 31],
    [leftX, startY + 62],
    [rightX, startY + 62],
    [centerX, startY + 93],
    [centerX, startY + 124]
  ];
  nodes.slice(0, layout.length).forEach((node, index) => {
    const [x, y] = layout[index];
    positions.set(node.id, { x, y, w: boxW, h: boxH });
  });

  for (const node of nodes.slice(0, layout.length)) {
    const child = positions.get(node.id);
    for (const requirement of node.requires ?? []) {
      const parent = positions.get(requirement);
      if (parent && child) droneGraphLink(ctx, parent, child, tools);
    }
  }

  nodes.slice(0, layout.length).forEach((node, index) => {
    const box = positions.get(node.id);
    const purchased = recruited && Boolean(node.purchased);
    const unlocked = recruited && Boolean(node.unlocked);
    const selected = index === selectedIndex;
    const edge = selected ? PALETTE.clothRed : purchased ? PARCHMENT.ink : PARCHMENT.inkDim;
    const fill = purchased ? PARCHMENT.rule : unlocked ? PARCHMENT.hi : PARCHMENT.lo;
    tools.rect(ctx, box.x - (selected ? 2 : 1), box.y - (selected ? 2 : 1), box.w + (selected ? 4 : 2), box.h + (selected ? 4 : 2), edge);
    tools.rect(ctx, box.x, box.y, box.w, box.h, fill);
    tools.rect(ctx, box.x, box.y, purchased ? 3 : 2, box.h, purchased || unlocked ? PALETTE.clothRed : PARCHMENT.inkDim);
    tools.detailRect(ctx, box.x + 0.5, box.y + 0.5, box.w - 1, 0.5, PARCHMENT.base);
    tools.text(ctx, tools.clip(node.name ?? node.id ?? 'NODE', 17), box.x + 7, box.y + 4, purchased ? PARCHMENT.ink : unlocked ? PARCHMENT.ink : PARCHMENT.inkDim);
    ledgerText(ctx, `T${node.tier ?? 1}  ${node.pointCost ?? 0}P${(node.partCost ?? 0) > 0 ? `  ${node.partCost} PART` : ''}`, box.x + 7, box.y + 15, purchased ? PALETTE.clothRed : PARCHMENT.inkDim, tools);
  });
}

function droneGraphLink(ctx, parent, child, tools) {
  const color = PARCHMENT.inkDim;
  const fromX = parent.x + Math.floor(parent.w / 2);
  const fromY = parent.y + parent.h;
  const toX = child.x + Math.floor(child.w / 2);
  const toY = child.y;
  const bendY = fromY + Math.max(2, Math.floor((toY - fromY) / 2));
  tools.rect(ctx, fromX, fromY, 1, Math.max(1, bendY - fromY + 1), color);
  tools.rect(ctx, Math.min(fromX, toX), bendY, Math.abs(toX - fromX) + 1, 1, color);
  tools.rect(ctx, toX, bendY, 1, Math.max(1, toY - bendY), color);
  tools.detailRect(ctx, toX + 0.5, Math.max(bendY, toY - 2) + 0.5, 0.5, 1, PARCHMENT.ink);
}

function droneUpgradeCost(node) {
  const points = `${node.pointCost ?? 0} POINT${node.pointCost === 1 ? '' : 'S'}`;
  const parts = Number(node.partCost ?? 0);
  return parts > 0 ? `${points} + ${parts} PART${parts === 1 ? '' : 'S'}` : points;
}

function journalScarsPage(ctx, left, right, character, tools) {
  const C = PARCHMENT;
  const scars = character.scars ?? [];
  const lx = left.x + 14;
  let y = journalHeader(ctx, left, 'SCAR RECORD', tools, SECTION_FORMS.SCARS);
  ledgerText(ctx, `UNSPENT POINTS ${character.scarPoints ?? 0}`, lx, y + 1, C.inkDim, tools);
  y += 17;

  if (!scars.length) {
    tools.text(ctx, 'NONE ON FILE.', lx, y, C.inkDim);
  }
  for (const scar of scars.slice(0, 5)) {
    tools.text(ctx, tools.clip(`R${scar.rank ?? 1} ${scar.name ?? 'SCAR'}`, 34), lx, y, C.ink);
    y += 11;
    if (scar.summary) {
      for (const line of tools.wrap(scar.summary, 35).slice(0, 2)) {
        tools.text(ctx, line, lx + 8, y, C.inkDim);
        y += 10;
      }
    }
    if (scar.cost) {
      for (const line of tools.wrap(`Cost: ${scar.cost}`, 34).slice(0, 2)) {
        tools.text(ctx, line, lx + 8, y, PALETTE.clothRed);
        y += 10;
      }
    }
    y += 3;
  }

  let ry = journalHeader(ctx, right, 'FIELD COST', tools, SECTION_FORMS.SCARS);
  const rx = right.x + 14;
  for (const scar of scars.slice(0, 6)) {
    tools.text(ctx, tools.clip(scar.name ?? 'SCAR', 28), rx, ry, C.ink);
    ry += 12;
    const modifiers = Object.entries(scar.modifiers ?? {});
    if (!modifiers.length) {
      tools.text(ctx, 'NO FIELD MODIFIERS.', rx + 8, ry, C.inkDim);
      ry += 11;
    }
    for (const [fieldId, value] of modifiers) {
      const sign = value >= 0 ? '+' : '';
      tools.text(ctx, `${sign}${value} ${tools.clip(fieldLabel(character, fieldId), 22)}`, rx + 8, ry, C.inkDim);
      ry += 11;
    }
    ry += 5;
  }
  journalSeal(ctx, right, tools, character);
}

function journalObjectiveMark(ctx, x, y, objective, tools) {
  const done = Boolean(objective?.done);
  const active = Boolean(objective?.active);
  const lead = Boolean(objective?.lead);
  tools.rect(ctx, x, y, 10, 10, PARCHMENT.ink);
  tools.rect(ctx, x + 1, y + 1, 8, 8, PARCHMENT.base);
  tools.detailRect(ctx, x + 1.5, y + 1.5, 7, 0.5, PARCHMENT.hi);
  tools.detailRect(ctx, x + 1.5, y + 1.5, 0.5, 7, PARCHMENT.hi);
  if (done) {
    tools.rect(ctx, x + 2, y + 5, 2, 2, PARCHMENT.ink);
    tools.rect(ctx, x + 4, y + 3, 2, 4, PARCHMENT.ink);
    tools.rect(ctx, x + 6, y + 2, 2, 2, PARCHMENT.ink);
  } else if (lead) {
    ledgerText(ctx, '?', x + 3, y + 2, PALETTE.clothRed, tools);
  } else if (active) {
    tools.rect(ctx, x + 2, y + 2, 6, 6, PALETTE.clothRed);
    tools.rect(ctx, x + 4, y + 2, 2, 6, PARCHMENT.hi);
  }
}

function journalObjectiveLegend(ctx, page, tools) {
  const x = page.x + 14;
  const y = page.y + page.h - 88;
  ledgerText(ctx, 'ORDER MARKS', x, y, PARCHMENT.inkDim, tools);
  const entries = [
    [{ done: true }, 'DONE'],
    [{ active: true }, 'CURRENT'],
    [{ lead: true }, 'LEAD'],
    [{}, 'PENDING']
  ];
  entries.forEach(([state, label], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const markX = x + column * 106;
    const markY = y + 11 + row * 13;
    journalObjectiveMark(ctx, markX, markY - 2, state, tools);
    ledgerText(ctx, label, markX + 14, markY, PARCHMENT.inkDim, tools);
  });
}

function journalEvidenceTick(ctx, x, y, tools) {
  tools.rect(ctx, x, y, 8, 8, PARCHMENT.inkDim);
  tools.rect(ctx, x + 1, y + 1, 6, 6, PARCHMENT.base);
  tools.detailRect(ctx, x + 1.5, y + 1.5, 5, 0.5, PARCHMENT.hi);
  tools.rect(ctx, x + 2, y + 4, 2, 2, PALETTE.clothRed);
  tools.rect(ctx, x + 4, y + 2, 2, 4, PALETTE.clothRed);
}

function journalStamp(ctx, x, y, label, color, tools) {
  const text = clipLedgerText(label, 28);
  const width = ledgerTextWidth(text) + 10;
  tools.rect(ctx, x - 1, y - 1, width + 2, 12, PARCHMENT.inkDim);
  tools.rect(ctx, x, y, width, 10, PARCHMENT.base);
  tools.rect(ctx, x + 2, y + 2, width - 4, 1, color);
  tools.rect(ctx, x + 2, y + 7, width - 4, 1, color);
  tools.detailRect(ctx, x + 0.5, y + 0.5, width - 1, 0.5, PARCHMENT.hi);
  tools.detailRect(ctx, x + 2.5, y + 2.5, width - 5, 0.5, color);
  ledgerText(ctx, text, x + 5, y + 2, color, tools);
}

function techniquePointBox(ctx, x, y, label, value, tools) {
  const box = { x, y: y - 3, w: 102, h: 25 };
  tools.rect(ctx, box.x, box.y, box.w, box.h, PARCHMENT.inkDim);
  tools.rect(ctx, box.x + 1, box.y + 1, box.w - 2, box.h - 2, PARCHMENT.hi);
  tools.detailRect(ctx, box.x + 1.5, box.y + 1.5, box.w - 3, 0.5, PARCHMENT.base);
  tools.detailRect(ctx, box.x + 1.5, box.y + 1.5, 0.5, box.h - 3, PARCHMENT.base);
  ledgerText(ctx, `${label} POINTS`, box.x + 6, box.y + 4, PARCHMENT.inkDim, tools);
  tools.text(ctx, String(value), box.x + box.w - 18, box.y + 8, PALETTE.clothRed);
}

function techniqueStatusMark(ctx, x, y, entry, tools) {
  tools.rect(ctx, x, y, 10, 10, PARCHMENT.ink);
  tools.rect(ctx, x + 1, y + 1, 8, 8, PARCHMENT.base);
  tools.detailRect(ctx, x + 1.5, y + 1.5, 7, 0.5, PARCHMENT.hi);
  if (entry?.known) {
    ledgerText(ctx, 'X', x + 3, y + 2, PALETTE.clothRed, tools);
  } else if (entry?.canLearn) {
    ledgerText(ctx, '+', x + 3, y + 2, PALETTE.clothRed, tools);
  }
}

function ledgerField(ctx, x, y, label, value, tools) {
  ledgerText(ctx, label, x, y + 1, PARCHMENT.inkDim, tools);
  const valueX = x + 52;
  tools.rect(ctx, valueX - 4, y - 2, 188, 11, PARCHMENT.hi);
  ledgerText(ctx, clipLedgerText(value, 35), valueX, y + 1, PARCHMENT.ink, tools);
}

function techniqueTargetText(entry) {
  const targets = Array.isArray(entry?.targets) ? entry.targets : [];
  if (!targets.length) return entry?.type === 'passive' ? 'SELF' : 'FIELD CHOICE';
  return targets.map((target) => String(target).toUpperCase()).join(' / ');
}

function journalFieldColumn(ctx, x, y, fields, topFields, barW, tools) {
  const C = PARCHMENT;
  for (const field of fields) {
    const value = field.value ?? 0;
    const highlighted = topFields.has(field.id);
    const color = highlighted ? C.ink : C.inkDim;
    ledgerText(ctx, highlighted ? '*' : ' ', x, y + 1, PALETTE.clothRed, tools);
    ledgerText(ctx, clipLedgerText(field.label ?? 'FIELD', 15), x + 8, y + 1, color, tools);
    tools.text(ctx, String(value).padStart(3, ' '), x + 86, y, color);
    journalValueBar(ctx, x + 8, y + 9, barW, 3, value, 100, highlighted ? PALETTE.clothRed : C.inkDim, C.rule, tools);
    y += 17;
  }
}

function fieldLabel(character, fieldId) {
  return character.fields?.find((field) => field.id === fieldId)?.label
    ?? String(fieldId).replace(/([A-Z])/g, ' $1');
}

function journalValueBar(ctx, x, y, w, h, value, max, fill, empty, tools) {
  tools.rect(ctx, x - 1, y - 1, w + 2, h + 2, PARCHMENT.inkDim);
  tools.rect(ctx, x, y, w, h, empty);
  const fillW = Math.max(0, Math.min(w, Math.round((w * (Number(value) || 0)) / max)));
  if (fillW > 0) {
    tools.rect(ctx, x, y, fillW, h, fill);
    tools.detailRect(ctx, x + 0.5, y + 0.5, Math.max(0.5, fillW - 1), 0.5, PARCHMENT.hi);
  }
}

function journalPage(ctx, p, opts = {}, tools) {
  const C = PARCHMENT;
  const noise = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
  tools.rect(ctx, p.x, p.y, p.w, p.h, C.base);
  tools.rect(ctx, p.x, p.y, p.w, 1, C.hi);
  tools.rect(ctx, p.x, p.y + 1, p.w, 1, C.hi);
  // aged edge darkening on the three open sides
  tools.rect(ctx, p.x, p.y + p.h - 1, p.w, 1, C.lo);
  tools.rect(ctx, p.x, p.y, 2, p.h, C.lo);
  tools.rect(ctx, p.x + p.w - 2, p.y, 2, p.h, C.lo);
  tools.detailRect(ctx, p.x + 2.5, p.y + 1.5, p.w - 5, 0.5, C.hi);
  tools.detailRect(ctx, p.x + 1.5, p.y + 2.5, 0.5, p.h - 5, C.hi);
  tools.detailRect(ctx, p.x + 2.5, p.y + p.h - 1.5, p.w - 5, 0.5, C.inkDim);
  tools.detailRect(ctx, p.x + p.w - 2.5, p.y + 2.5, 0.5, p.h - 5, C.inkDim);
  for (let i = 0; i < 9; i += 1) {
    const cy = p.y + 18 + Math.floor(noise(p.x + i * 11) * (p.h - 44));
    const chip = 2 + Math.floor(noise(p.y + i * 13) * 5);
    if (noise(i + p.x) > 0.48) tools.rect(ctx, p.x, cy, chip, 2, PALETTE.woodDark);
    else tools.rect(ctx, p.x + p.w - chip, cy, chip, 2, PALETTE.woodDark);
  }
  for (let i = 0; i < 7; i += 1) {
    const cx = p.x + 18 + Math.floor(noise(p.y + i * 7) * (p.w - 44));
    const chip = 3 + Math.floor(noise(p.x + i * 5) * 6);
    if (noise(i * 3 + p.y) > 0.52) tools.rect(ctx, cx, p.y, chip, 2, PALETTE.woodDark);
    else tools.rect(ctx, cx, p.y + p.h - 2, chip, 2, PALETTE.woodDark);
  }
  // Ruled evidence paper with an official red filing margin.
  for (let yy = p.y + 39; yy < p.y + p.h - 5; yy += 11) {
    tools.rect(ctx, p.x + 8, yy, p.w - 16, 1, C.rule);
  }
  tools.rect(ctx, p.x + 9, p.y + 34, 1, p.h - 44, PALETTE.clothRed);
  tools.rect(ctx, p.x + 11, p.y + 34, 1, p.h - 44, 'rgba(122, 36, 31, 0.28)');

  // A hard metal filing clip at the crown of each leaf.
  const clipX = p.x + Math.floor(p.w / 2) - 18;
  tools.rect(ctx, clipX, p.y - 2, 36, 7, PALETTE.outline);
  tools.rect(ctx, clipX + 1, p.y - 1, 34, 5, PALETTE.uiBorderDark);
  tools.rect(ctx, clipX + 3, p.y, 30, 1, PALETTE.uiBorderLight);
  tools.rect(ctx, clipX + 7, p.y + 2, 22, 1, PALETTE.uiDark);
  tools.detailRect(ctx, clipX + 1.5, p.y - 0.5, 33, 0.5, PALETTE.uiText);
  tools.detailRect(ctx, clipX + 1.5, p.y - 0.5, 0.5, 4, PALETTE.uiBorderLight);

  // Binding holes remain visible beside the stitched spine.
  const holeX = opts.dogEar === 'bl' ? p.x + p.w - 8 : p.x + 4;
  for (const holeY of [p.y + 70, p.y + 154, p.y + 238]) {
    tools.rect(ctx, holeX, holeY, 5, 5, C.lo);
    tools.rect(ctx, holeX + 1, holeY + 1, 3, 3, PALETTE.woodDark);
  }
  // specks and brown foxing spots
  for (let i = 0; i < 24; i += 1) {
    const sx = p.x + 8 + Math.floor(noise(p.x + i * 3.1 + 1) * (p.w - 16));
    const sy = p.y + 10 + Math.floor(noise(p.y + i * 5.7 + 2) * (p.h - 20));
    const big = noise(i * 1.7 + p.x) > 0.82;
    tools.rect(ctx, sx, sy, big ? 2 : 1, big ? 2 : 1, big ? C.fox : C.lo);
    if (i % 3 === 0) tools.detailRect(ctx, sx + 0.5, sy + 0.5, 0.5, 0.5, C.fox);
  }
  // Short half-pixel fibres make the native-resolution paper read as rough
  // stock without soft texture or colors outside the journal ramp.
  for (let i = 0; i < 8; i += 1) {
    const fx = p.x + 24.5 + Math.floor(noise(p.x + i * 9.3) * (p.w - 49));
    const fy = p.y + 46.5 + Math.floor(noise(p.y + i * 7.1) * (p.h - 83));
    tools.detailRect(ctx, fx, fy, 1 + (i % 3) * 0.5, 0.5, i % 2 ? C.rule : C.lo);
  }
  // a faint coffee-ring stain
  if (opts.ring) {
    const cx = p.x + p.w - 60;
    const cy = p.y + 66;
    const r = 24;
    for (let t = 0; t < 72; t += 1) {
      const a = (t / 72) * Math.PI * 2;
      const rr = r + (noise(t + p.x) * 2 - 1);
      tools.rect(ctx, Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr), 1, 1, 'rgba(74, 48, 20, 0.22)');
    }
  }
  // a small ink blot
  const bx = p.x + p.w - 30;
  const by = p.y + p.h - 56;
  tools.rect(ctx, bx, by, 3, 2, C.ink);
  tools.rect(ctx, bx + 2, by + 1, 2, 3, C.ink);
  tools.rect(ctx, bx - 1, by + 2, 2, 1, C.ink);
  tools.rect(ctx, bx + 3, by - 1, 1, 1, C.ink);
  tools.rect(ctx, p.x + 18, p.y + 31, 16, 1, 'rgba(78, 46, 22, 0.25)');
  tools.rect(ctx, p.x + 21, p.y + 32, 1, 18, 'rgba(78, 46, 22, 0.2)');
  tools.rect(ctx, p.x + p.w - 45, p.y + 33, 22, 2, 'rgba(78, 46, 22, 0.16)');
  // a folded-over dog-ear at the bottom outer corner
  if (opts.dogEar === 'bl' || opts.dogEar === 'br') {
    const s = 18;
    for (let i = 0; i < s; i += 1) {
      const w = s - i;
      const rowY = p.y + p.h - 1 - i;
      if (opts.dogEar === 'bl') {
        tools.rect(ctx, p.x, rowY, w, 1, C.flap);
        tools.rect(ctx, p.x + (s - 1 - i), rowY, 1, 1, C.lo);
      } else {
        tools.rect(ctx, p.x + p.w - w, rowY, w, 1, C.flap);
        tools.rect(ctx, p.x + p.w - 1 - (s - 1 - i), rowY, 1, 1, C.lo);
      }
    }
  }
}

function journalDisc(ctx, cx, cy, r, color, tools) {
  for (let dy = -r; dy <= r; dy += 1) {
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
    tools.rect(ctx, cx - half, cy + dy, half * 2 + 1, 1, color);
  }
  tools.detailRect(ctx, cx - r + 3.5, cy - 4.5, Math.max(0.5, r - 4), 0.5, PALETTE.uiWarn);
}
