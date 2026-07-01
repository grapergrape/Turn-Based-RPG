import { PALETTE } from '../palette.js';
import {
  JOURNAL_ARROW_BOXES,
  JOURNAL_BOOK,
  JOURNAL_MAP_FIELD_BOX,
  JOURNAL_PAGES,
  journalMapGridMetrics
} from '../../ui/journalLayout.js';

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

export function drawJournal(ctx, ui, tools) {
  tools.screenBackdrop(ctx);

  const B = JOURNAL_BOOK;
  const noise = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

  // Soft drop shadow, then scuffed leather with brass corner fittings.
  tools.rect(ctx, B.x + 5, B.y + 7, B.w, B.h, 'rgba(5, 5, 5, 0.5)');
  tools.rect(ctx, B.x - 1, B.y - 1, B.w + 2, B.h + 2, PALETTE.outline);
  tools.rect(ctx, B.x, B.y, B.w, B.h, PALETTE.woodDark);
  tools.rect(ctx, B.x + 1, B.y + 1, B.w - 2, B.h - 2, PALETTE.woodMid);
  tools.rect(ctx, B.x + 1, B.y + 1, B.w - 2, 1, PALETTE.woodLight);
  tools.rect(ctx, B.x + 1, B.y + 1, 1, B.h - 2, PALETTE.woodLight);
  tools.rect(ctx, B.x + 1, B.y + B.h - 2, B.w - 2, 1, PALETTE.outline);
  tools.rect(ctx, B.x + B.w - 2, B.y + 1, 1, B.h - 2, PALETTE.outline);
  tools.rect(ctx, B.x + 8, B.y + B.h - 5, B.w - 16, 2, PALETTE.outline);
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

  const journal = ui.journal ?? {};
  const section = journal.section ?? 0;
  const turn = journal.turn ?? null;
  const contentSection = turn ? turn.from : section;
  journalTabs(ctx, B, journal.sections ?? [], section, tools);

  journalContent(ctx, left, right, contentSection, journal, tools);
  if (turn) journalPageTurn(ctx, left, right, turn, tools);
  journalArrowButton(ctx, JOURNAL_ARROW_BOXES.prev, 'prev', tools);
  journalArrowButton(ctx, JOURNAL_ARROW_BOXES.next, 'next', tools);

  journalFooter(ctx, B, journal.time, tools);
}

function journalContent(ctx, left, right, section, journal, tools) {
  const sectionId = (journal.sections ?? [])[section] ?? 'QUESTS';
  if (sectionId === 'MAP') journalMapPage(ctx, left, right, journal.map, tools);
  else if (sectionId === 'NOTES') journalNotesPage(ctx, left, right, journal.findings ?? [], tools);
  else if (sectionId === 'FACTIONS') journalFactionsPage(ctx, left, right, journal.factions ?? [], journal.factionIndex ?? 0, tools);
  else if (sectionId === 'CHARACTER') journalCharacterPage(ctx, left, right, journal.character ?? {}, journal.primaryIndex ?? 0, tools);
  else if (sectionId === 'SCARS') journalScarsPage(ctx, left, right, journal.character ?? {}, tools);
  else if (sectionId === 'TECHNIQUES') journalTechniquesPage(ctx, left, right, journal.techniques ?? {}, tools);
  else journalQuestsPage(ctx, left, right, journal.quests ?? [], journal.character ?? {}, tools);
}

function journalFooter(ctx, B, time, tools) {
  const controls = 'A/D PAGE   M MAP   J CLOSE';
  const y = B.y + B.h - 11;
  const controlsX = B.x + B.w - tools.textWidth(controls) - 24;
  const stampX = B.x + 72;
  const stampMax = Math.max(12, Math.floor((controlsX - stampX - 12) / 6));
  const stamp = time
    ? `${time.dateLabel ?? 'FIELD DAY 1, YEAR 130 AFTER DESCENT'}   ${time.timeLabel ?? '08:00'} ${time.phaseLabel ?? 'MORNING'}`
    : '';

  if (stamp) tools.text(ctx, tools.clip(stamp, stampMax), stampX, y, PALETTE.clothTan);
  tools.text(ctx, controls, controlsX, y, PALETTE.clothTan);
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
  journalArrowGlyph(ctx, box.x + Math.floor(box.w / 2), box.y + Math.floor(box.h / 2), direction, lit, tools);
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
  for (let yy = top + 18; yy < top + fullH - 14; yy += 22) {
    tools.rect(ctx, foldX + (forward ? 5 : -10), yy, 9, 1, 'rgba(78, 58, 32, 0.22)');
  }
}

// Section tabs sticking up from the top edge; the active one is parchment and
// sits a little proud of the leather ones.
function journalTabs(ctx, B, sections, active, tools) {
  const gap = 6;
  const tabW = Math.min(96, Math.floor((B.w - 24 - Math.max(0, sections.length - 1) * gap) / Math.max(1, sections.length)));
  const total = sections.length * tabW + Math.max(0, sections.length - 1) * gap;
  let x = B.x + Math.floor((B.w - total) / 2);
  for (let i = 0; i < sections.length; i += 1) {
    const on = i === active;
    const h = on ? 19 : 15;
    const y = on ? B.y - 10 : B.y - 6;
    tools.rect(ctx, x - 1, y - 1, tabW + 2, h + 2, PALETTE.outline);
    tools.rect(ctx, x, y, tabW, h, on ? PARCHMENT.base : PALETTE.woodMid);
    tools.rect(ctx, x, y, tabW, 1, on ? PARCHMENT.hi : PALETTE.woodLight);
    const label = sections[i];
    const lw = tools.textWidth(label);
    tools.text(ctx, label, x + Math.floor((tabW - lw) / 2), y + Math.floor((h - 7) / 2) + 1, on ? PARCHMENT.ink : PALETTE.clothTan);
    x += tabW + gap;
  }
}

function journalHeader(ctx, page, label, tools) {
  tools.text(ctx, label, page.x + 12, page.y + 6, PARCHMENT.ink);
  tools.rect(ctx, page.x + 10, page.y + 17, page.w - 20, 1, PARCHMENT.inkDim);
  return page.y + 26;
}

function journalSeal(ctx, page, tools, character = {}) {
  const sx = page.x + page.w - 42;
  const sy = page.y + page.h - 38;
  journalDisc(ctx, sx, sy, 13, PALETTE.hostRed, tools);
  journalDisc(ctx, sx, sy, 11, PALETTE.clothRed, tools);
  tools.rect(ctx, sx - 1, sy - 8, 2, 16, PALETTE.hostGold);
  tools.rect(ctx, sx - 8, sy - 1, 16, 2, PALETTE.hostGold);
  tools.rect(ctx, sx - 1, sy - 1, 2, 2, PALETTE.uiWarn);
  tools.text(ctx, tools.clip(character.name ?? 'UNKNOWN AGENT', 30), page.x + 12, page.y + page.h - 24, PARCHMENT.inkDim);
  tools.text(ctx, tools.clip(character.role ?? 'ASHEN CENSURE', 30), page.x + 12, page.y + page.h - 14, PARCHMENT.inkDim);
}

function journalQuestsPage(ctx, left, right, quests, character, tools) {
  const C = PARCHMENT;
  const INK_RED = PALETTE.clothRed;
  const lx = left.x + 12;
  let y = left.y + 8;
  if (!quests.length) tools.text(ctx, 'NO ACTIVE WRIT.', lx, y, C.inkDim);
  for (const quest of quests) {
    const title = tools.clip(quest.title, 30);
    tools.text(ctx, title, lx, y, C.ink);
    tools.rect(ctx, lx, y + 9, tools.textWidth(title), 1, C.inkDim);
    y += 16;
    if (quest.task) {
      tools.text(ctx, 'TASK', lx, y, C.inkDim);
      tools.text(ctx, tools.clip(quest.task, 26), lx + 30, y, quest.complete ? C.inkDim : INK_RED);
      y += 15;
    }
    for (const obj of quest.objectives ?? []) {
      const color = obj.lead ? INK_RED : obj.done ? C.inkDim : C.ink;
      const wrapped = tools.wrap(obj.text, 33);
      const tx = lx + 13;
      if (obj.active) tools.rect(ctx, lx - 3, y - 2, left.w - 18, wrapped.length * 10 + 3, C.hi);
      if (obj.lead) tools.text(ctx, '>>', lx, y, INK_RED);
      else journalCheckbox(ctx, lx, y - 1, obj.done, tools);
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

  let ry = journalHeader(ctx, right, 'CURRENT ORDERS', tools);
  const rx = right.x + 12;
  const note = quests.find((q) => q.note)?.note ?? '';
  if (note) {
    for (const line of tools.wrap(note, 36)) { tools.text(ctx, line, rx, ry, C.inkDim); ry += 11; }
  } else {
    tools.text(ctx, 'NOTHING SET DOWN YET.', rx, ry, C.inkDim);
  }
  journalSeal(ctx, right, tools, character);
}

function journalMapPage(ctx, left, right, map, tools) {
  const C = PARCHMENT;
  let y = journalHeader(ctx, left, 'AREA MAP', tools);
  const lx = left.x + 12;
  if (!map) {
    tools.text(ctx, 'NO AREA MAP.', lx, y, C.inkDim);
    return;
  }

  tools.text(ctx, tools.clip(map.name ?? 'AREA MAP', 31), lx, y, C.ink);
  const total = Math.max(1, map.totalCells ?? 1);
  const percent = Math.round(((map.exploredCount ?? 0) / total) * 100);
  tools.text(ctx, `${percent}% FILED`, left.x + left.w - 76, y, C.inkDim);
  y += 15;

  drawMapField(ctx, JOURNAL_MAP_FIELD_BOX, map, tools);

  const footerY = left.y + left.h - 36;
  tools.text(ctx, 'BLACK GROUND IS UNSEEN.', lx, footerY, C.inkDim);
  tools.text(ctx, 'SECRET ROOMS STAY DARK.', lx, footerY + 11, C.inkDim);

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
  let y = journalHeader(ctx, right, 'MAP NOTES', tools);
  const rx = right.x + 12;
  tools.text(ctx, tools.clip(map.name ?? 'AREA', 32), rx, y, C.ink);
  y += 14;

  tools.text(ctx, 'KEY', rx, y, C.inkDim);
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
    tools.text(ctx, legend[i][0], col + 12, rowY, C.inkDim);
  }
  y += 52;

  tools.text(ctx, 'MARKS', rx, y, C.inkDim);
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
    tools.text(ctx, markerKindLabel(marker.kind), rx + 12, y, color);
    tools.text(ctx, tools.clip(marker.label ?? 'MARK', 21), rx + 56, y, C.inkDim);
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
    return;
  }
  const s = Math.max(2, Math.min(4, scale + 1));
  const bx = x - Math.floor(s / 2);
  const by = y - Math.floor(s / 2);
  tools.rect(ctx, bx - 1, by - 1, s + 2, s + 2, PARCHMENT.ink);
  tools.rect(ctx, bx, by, s, s, color);
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

function journalNotesPage(ctx, left, right, findings, tools) {
  const C = PARCHMENT;
  const pages = [left, right];
  let pi = 0;
  let page = pages[0];
  let y = journalHeader(ctx, page, 'FINDINGS', tools);
  if (!findings.length) {
    tools.text(ctx, 'YOU HAVE WRITTEN NOTHING DOWN YET.', page.x + 12, y, C.inkDim);
    return;
  }
  for (const finding of findings) {
    const wrapped = tools.wrap(finding, 34);
    const blockH = wrapped.length * 10 + 9;
    if (y + blockH > page.y + page.h - 8) {
      if (pi + 1 >= pages.length) { tools.text(ctx, '. . .', page.x + 12, y, C.inkDim); break; }
      pi += 1; page = pages[pi];
      y = journalHeader(ctx, page, 'FINDINGS', tools);
    }
    tools.text(ctx, '+', page.x + 12, y, PALETTE.clothRed);
    let ly = y;
    for (const line of wrapped) { tools.text(ctx, line, page.x + 22, ly, C.ink); ly += 10; }
    y = ly + 3;
    tools.rect(ctx, page.x + 12, y, page.w - 24, 1, C.rule);
    y += 7;
  }
}

// A codex: a selectable list of known factions on the left, the full record of
// the selected one on the right. Cult entries appear here as they are learned.
function journalFactionsPage(ctx, left, right, factions, selected, tools) {
  const C = PARCHMENT;
  const known = factions.filter((f) => f.known);
  const hasLocked = factions.some((f) => !f.known);

  // Left page: the index of what you have on file.
  let y = journalHeader(ctx, left, 'FACTIONS', tools);
  const lx = left.x + 12;
  if (!known.length) tools.text(ctx, 'NO RECORDS YET.', lx, y, C.inkDim);
  const sel = Math.max(0, Math.min(known.length - 1, selected));
  for (let i = 0; i < known.length; i += 1) {
    const on = i === sel;
    if (on) tools.rect(ctx, left.x + 6, y - 2, left.w - 12, 12, C.hi);
    tools.text(ctx, on ? '>' : ' ', lx, y, PALETTE.clothRed);
    tools.text(ctx, tools.clip(known[i].name, 27), lx + 10, y, on ? C.ink : C.inkDim);
    y += 13;
  }
  if (hasLocked) {
    y += 6;
    tools.text(ctx, '[ unfiled records remain ]', lx, y, C.inkDim);
  }

  // Right page: the open record.
  let ry = journalHeader(ctx, right, 'RECORD', tools);
  const rx = right.x + 12;
  const entry = known[sel];
  if (!entry) { tools.text(ctx, 'NOTHING ON FILE.', rx, ry, C.inkDim); return; }
  tools.text(ctx, tools.clip(entry.name, 30), rx, ry, C.ink);
  tools.rect(ctx, rx, ry + 9, tools.textWidth(tools.clip(entry.name, 30)), 1, C.inkDim);
  ry += 14;
  if (entry.kind) { tools.text(ctx, tools.clip(entry.kind, 36), rx, ry, PALETTE.clothRed); ry += 13; }
  for (const line of tools.wrap(entry.summary, 36)) { tools.text(ctx, line, rx, ry, C.inkDim); ry += 10; }
  ry += 4;
  for (const fact of entry.facts ?? []) {
    tools.text(ctx, '-', rx, ry, C.inkDim);
    let ly = ry;
    for (const line of tools.wrap(fact, 34)) { tools.text(ctx, line, rx + 8, ly, C.inkDim); ly += 10; }
    ry = ly + 2;
  }
}

function journalCharacterPage(ctx, left, right, character, selectedPrimary, tools) {
  const C = PARCHMENT;
  const lx = left.x + 12;
  let y = journalHeader(ctx, left, 'CHARACTER SHEET', tools);

  tools.text(ctx, tools.clip(character.name ?? 'UNKNOWN AGENT', 30), lx, y, C.ink);
  y += 13;
  tools.text(ctx, tools.clip(character.role ?? 'ASHEN CENSURE', 34), lx, y, PALETTE.clothRed);
  y += 18;

  tools.text(ctx, `LEVEL ${character.level ?? 1}`, lx, y, C.ink);
  tools.text(ctx, tools.clip(character.build?.label ?? 'FIELD AGENT', 22), lx + 78, y, PALETTE.clothRed);
  y += 13;
  const xp = character.xp ?? {};
  const xpLabel = xp.atCap ? `XP ${xp.current ?? 0}` : `XP ${xp.current ?? 0}/${xp.nextLevelXp ?? 0}`;
  tools.text(ctx, tools.clip(xpLabel, 18), lx, y, C.inkDim);
  journalValueBar(ctx, lx + 78, y + 2, 114, 5, xp.intoLevel ?? 0, Math.max(1, xp.needed ?? 1), PALETTE.clothRed, C.rule, tools);
  y += 13;
  tools.text(ctx, `PRIMARY POINTS ${character.primaryPoints ?? 0}`, lx, y, C.inkDim);
  y += 18;
  tools.text(ctx, `ACTIVE TP ${character.activeTechniquePoints ?? 0}   PASSIVE TP ${character.passiveTechniquePoints ?? 0}`, lx, y, C.inkDim);
  y += 14;

  tools.text(ctx, `TRACE ${character.trace?.label ?? 'CLEAN'}`, lx, y, C.ink);
  y += 13;
  tools.text(ctx, `ICON RISK ${tools.clip(character.iconRisk?.label ?? 'NOT ASSESSED', 22)}`, lx, y, C.inkDim);
  y += 18;

  tools.text(ctx, 'PRIMARY ATTRIBUTES', lx, y, C.inkDim);
  y += 13;
  const primaries = character.primaries ?? [];
  const sel = Math.max(0, Math.min(primaries.length - 1, selectedPrimary));
  for (let i = 0; i < primaries.length; i += 1) {
    const primary = primaries[i];
    const on = i === sel;
    if (on) tools.rect(ctx, left.x + 6, y - 2, left.w - 12, 12, C.hi);
    tools.text(ctx, on ? '>' : ' ', lx, y, PALETTE.clothRed);
    tools.text(ctx, tools.clip(primary.label, 13), lx + 10, y, C.ink);
    tools.text(ctx, `${primary.value ?? 0}/10`, lx + 90, y, C.inkDim);
    journalValueBar(ctx, lx + 121, y + 2, 72, 5, primary.value ?? 0, 10, PALETTE.clothRed, C.rule, tools);
    y += 13;
  }
  if ((character.primaryPoints ?? 0) > 0) tools.text(ctx, 'ENTER SPENDS PRIMARY POINT', lx, left.y + left.h - 15, C.inkDim);

  let ry = journalHeader(ctx, right, 'FIELD RATINGS', tools);
  const fields = character.fields ?? [];
  const topFields = new Set((character.topFields ?? []).map((field) => field.id));
  const leftFields = fields.slice(0, Math.ceil(fields.length / 2));
  const rightFields = fields.slice(Math.ceil(fields.length / 2));
  journalFieldColumn(ctx, right.x + 12, ry, leftFields, topFields, 100, tools);
  journalFieldColumn(ctx, right.x + 124, ry, rightFields, topFields, 92, tools);
  journalSeal(ctx, right, tools, character);
}

function journalTechniquesPage(ctx, left, right, techniques, tools) {
  const C = PARCHMENT;
  const entries = techniques.entries ?? [];
  const selected = Math.max(0, Math.min(entries.length - 1, techniques.selectedIndex ?? 0));
  const lx = left.x + 12;
  let y = journalHeader(ctx, left, 'TECHNIQUES', tools);
  tools.text(ctx, `ACTIVE POINTS ${techniques.activePoints ?? 0}`, lx, y, C.inkDim);
  y += 12;
  tools.text(ctx, `PASSIVE POINTS ${techniques.passivePoints ?? 0}`, lx, y, C.inkDim);
  y += 18;

  if (!entries.length) {
    tools.text(ctx, 'NO TECHNIQUES FILED.', lx, y, C.inkDim);
  }
  for (let i = 0; i < entries.length && i < 14; i += 1) {
    const entry = entries[i];
    const on = i === selected;
    const known = entry.known;
    const available = entry.canLearn;
    const color = known ? PALETTE.clothRed : available ? C.ink : C.inkDim;
    if (on) tools.rect(ctx, left.x + 6, y - 2, left.w - 12, 12, C.hi);
    tools.text(ctx, on ? '>' : ' ', lx, y, PALETTE.clothRed);
    tools.text(ctx, tools.clip(entry.name ?? entry.id ?? 'TECHNIQUE', 23), lx + 10, y, color);
    tools.text(ctx, entry.type === 'passive' ? 'P' : 'A', left.x + left.w - 25, y, C.inkDim);
    y += 13;
  }

  let ry = journalHeader(ctx, right, 'DETAIL', tools);
  const rx = right.x + 12;
  const entry = entries[selected];
  if (!entry) {
    tools.text(ctx, 'NOTHING SELECTED.', rx, ry, C.inkDim);
    return;
  }
  tools.text(ctx, tools.clip(entry.name ?? 'TECHNIQUE', 30), rx, ry, C.ink);
  tools.text(ctx, entry.type === 'passive' ? 'PASSIVE' : 'ACTIVE', right.x + right.w - 62, ry, PALETTE.clothRed);
  ry += 14;
  for (const line of tools.wrap(entry.summary ?? '', 36).slice(0, 4)) {
    tools.text(ctx, line, rx, ry, C.inkDim);
    ry += 10;
  }
  ry += 6;
  tools.text(ctx, 'REQUIRES', rx, ry, C.ink);
  ry += 12;
  for (const line of tools.wrap(entry.requirementText ?? 'No requirements', 36).slice(0, 4)) {
    tools.text(ctx, line, rx, ry, C.inkDim);
    ry += 10;
  }
  ry += 7;
  if (entry.known) tools.text(ctx, 'KNOWN', rx, ry, PALETTE.clothRed);
  else if (entry.canLearn) tools.text(ctx, 'READY TO LEARN', rx, ry, PALETTE.clothRed);
  else tools.text(ctx, tools.clip(entry.disabledReason ?? 'LOCKED', 32), rx, ry, C.inkDim);
  if (entry.canLearn) tools.text(ctx, 'ENTER LEARNS TECHNIQUE', rx, right.y + right.h - 15, C.inkDim);
}

function journalScarsPage(ctx, left, right, character, tools) {
  const C = PARCHMENT;
  const scars = character.scars ?? [];
  const lx = left.x + 12;
  let y = journalHeader(ctx, left, 'SCARS', tools);
  tools.text(ctx, `UNSPENT POINTS ${character.scarPoints ?? 0}`, lx, y, C.inkDim);
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

  let ry = journalHeader(ctx, right, 'SCAR EFFECTS', tools);
  const rx = right.x + 12;
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

function journalFieldColumn(ctx, x, y, fields, topFields, barW, tools) {
  const C = PARCHMENT;
  for (const field of fields) {
    const value = field.value ?? 0;
    const highlighted = topFields.has(field.id);
    const color = highlighted ? C.ink : C.inkDim;
    tools.text(ctx, highlighted ? '*' : ' ', x, y, PALETTE.clothRed);
    tools.text(ctx, tools.clip(field.label ?? 'FIELD', 12), x + 8, y, color);
    tools.text(ctx, String(value).padStart(3, ' '), x + 79, y, color);
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
  if (fillW > 0) tools.rect(ctx, x, y, fillW, h, fill);
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
  // faint ruled lines
  for (let yy = p.y + 18; yy < p.y + p.h - 4; yy += 11) tools.rect(ctx, p.x + 6, yy, p.w - 12, 1, C.rule);
  // specks and brown foxing spots
  for (let i = 0; i < 24; i += 1) {
    const sx = p.x + 8 + Math.floor(noise(p.x + i * 3.1 + 1) * (p.w - 16));
    const sy = p.y + 10 + Math.floor(noise(p.y + i * 5.7 + 2) * (p.h - 20));
    const big = noise(i * 1.7 + p.x) > 0.82;
    tools.rect(ctx, sx, sy, big ? 2 : 1, big ? 2 : 1, big ? C.fox : C.lo);
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
  tools.rect(ctx, p.x + 18, p.y + 28, 16, 1, 'rgba(78, 46, 22, 0.25)');
  tools.rect(ctx, p.x + 21, p.y + 29, 1, 18, 'rgba(78, 46, 22, 0.2)');
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
}

function journalCheckbox(ctx, x, y, done, tools) {
  const INK = '#241b12';
  tools.rect(ctx, x, y, 8, 8, INK);
  tools.rect(ctx, x + 1, y + 1, 6, 6, '#c7b487');
  if (done) {
    tools.rect(ctx, x + 1, y + 4, 2, 2, INK);
    tools.rect(ctx, x + 2, y + 5, 2, 2, INK);
    tools.rect(ctx, x + 3, y + 3, 2, 2, INK);
    tools.rect(ctx, x + 4, y + 2, 2, 2, INK);
    tools.rect(ctx, x + 5, y + 1, 2, 2, INK);
  }
}
