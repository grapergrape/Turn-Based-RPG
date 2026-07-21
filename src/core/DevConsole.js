import { BUILD_PROFILES, FIELD_RATINGS, calculateFieldRating, normalizeProgression } from './Progression.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '']);
const DEFAULT_LEVEL = 6;

const BUILD_PRESETS = Object.freeze({
  'field-agent': Object.freeze({
    primaries: { nerve: 6, eye: 5, agility: 5, body: 4, religion: 4, intelligence: 4, voice: 3 },
    techniques: ['field-measure', 'aimed-shot', 'study-target', 'stabilize']
  }),
  gunhand: Object.freeze({
    primaries: { eye: 7, nerve: 6, agility: 5, body: 4, intelligence: 3, voice: 3, religion: 3 },
    techniques: ['aimed-shot', 'overwatch', 'study-target', 'steady-hands']
  }),
  purifier: Object.freeze({
    primaries: { religion: 7, nerve: 6, body: 5, eye: 4, intelligence: 4, agility: 3, voice: 3 },
    techniques: ['censure-spark', 'burn-line', 'quarantine-line', 'hard-seal']
  }),
  engineer: Object.freeze({
    primaries: { intelligence: 7, agility: 6, eye: 5, body: 4, nerve: 3, religion: 3, voice: 3 },
    techniques: ['trip-mine', 'wire-snare', 'study-target', 'seal-tile']
  }),
  investigator: Object.freeze({
    primaries: { eye: 7, intelligence: 6, nerve: 5, religion: 4, agility: 4, voice: 3, body: 3 },
    techniques: ['case-file', 'study-target', 'aimed-shot', 'stabilize']
  }),
  'field-confessor': Object.freeze({
    primaries: { voice: 7, religion: 6, nerve: 5, eye: 4, intelligence: 4, body: 3, agility: 3 },
    techniques: ['name-the-error', 'stilling-litany', 'rally', 'feint']
  }),
  'road-ghost': Object.freeze({
    primaries: { agility: 7, eye: 6, nerve: 5, voice: 4, intelligence: 4, body: 3, religion: 3 },
    techniques: ['fade-back', 'ambush-mark', 'low-step', 'aimed-shot']
  }),
  'plague-surgeon': Object.freeze({
    primaries: { intelligence: 7, nerve: 6, body: 5, eye: 4, religion: 4, voice: 3, agility: 3 },
    techniques: ['stabilize', 'field-stimulant', 'surgeons-nerve', 'study-target']
  }),
  breaker: Object.freeze({
    primaries: { body: 7, nerve: 6, agility: 5, eye: 4, voice: 4, religion: 3, intelligence: 3 },
    techniques: ['shove', 'guard-break', 'riposte', 'stabilize']
  })
});

export function installDevConsole(game, { enabled = false, target = globalThis } = {}) {
  if (!enabled || !game || !target) return null;

  const api = {
    game: () => game,
    builds: () => Object.keys(BUILD_PRESETS),
    state: () => summarizeGame(game),
    createBuild: (buildId, options = {}) => applyBuild(game, buildId, options),
    setBuild: (buildId, options = {}) => applyBuild(game, buildId, options),
    learn: (techniques = []) => learnTechniques(game, techniques),
    weapons: () => loadWeaponCatalog(),
    give: (itemId, count = 1, options = {}) => giveItem(game, itemId, count, options),
    teleport: (x, y) => teleportPlayer(game, x, y),
    encounter: (encounterId = null) => startEncounter(game, encounterId),
    resetCombat: () => resetCombat(game),
    heal: () => healPlayer(game)
  };

  target.hostDebug = api;
  return api;
}

async function loadWeaponCatalog() {
  const response = await fetch('./data/catalogs/weapons.json');
  if (!response.ok) return { ok: false, reason: `Catalog request failed: ${response.status}` };
  return { ok: true, ...await response.json() };
}

async function giveItem(game, itemId, count = 1, options = {}) {
  if (!game.inventory || typeof itemId !== 'string' || !itemId.trim()) {
    return { ok: false, reason: 'Item id required.' };
  }
  if (!game.inventory.itemDefs[itemId]) {
    const response = await fetch(`./data/items/${encodeURIComponent(itemId)}.json`);
    if (!response.ok) return { ok: false, reason: `Unknown item: ${itemId}` };
    game.inventory.itemDefs[itemId] = await response.json();
  }
  const amount = Math.max(1, Math.floor(Number(count) || 1));
  const result = game.inventory.add(itemId, amount, {
    ...options,
    ignoreCapacity: options.ignoreCapacity !== false
  });
  if (!result.ok) return result;
  game._syncInventoryOrder?.();
  game._refreshPlayerAttacks?.();
  return {
    ok: true,
    itemId,
    count: amount,
    name: game.inventory.displayName(itemId)
  };
}

export function devConsoleEnabled(location) {
  const host = location?.hostname ?? '';
  if (!LOCAL_HOSTS.has(host)) return false;
  const params = new URL(location?.href ?? 'http://localhost').searchParams;
  return params.has('dev') || params.has('debug') || params.has('playtest') || params.has('level');
}

function applyBuild(game, buildId, options = {}) {
  const preset = BUILD_PRESETS[buildId];
  if (!preset) return { ok: false, reason: `Unknown build: ${buildId}` };
  const level = wholeNumber(options.level, DEFAULT_LEVEL);
  const techniques = Array.isArray(options.techniques) ? options.techniques : preset.techniques;
  const primaries = { ...preset.primaries, ...(options.primaries ?? {}) };
  game.player.progression = {
    ...(game.player.progression ?? {}),
    level,
    xp: wholeNumber(options.xp, 0),
    build: buildId,
    primaryPoints: wholeNumber(options.primaryPoints, 0),
    activeTechniquePoints: wholeNumber(options.activeTechniquePoints, 0),
    passiveTechniquePoints: wholeNumber(options.passiveTechniquePoints, 0),
    techniques: [...techniques],
    primaries
  };
  game.player.refreshProgressionStats?.();
  game.player.hp = game.player.maxHp;
  game.player.ap = game.player.maxAp;
  game._refreshPlayerAttacks?.();
  return summarizeGame(game);
}

function learnTechniques(game, techniques = []) {
  const current = normalizeProgression(game.player?.progression).techniques;
  const next = new Set(current);
  for (const technique of Array.isArray(techniques) ? techniques : [techniques]) {
    if (typeof technique === 'string' && technique.trim()) next.add(technique);
  }
  game.player.progression = {
    ...(game.player.progression ?? {}),
    techniques: [...next]
  };
  return summarizeGame(game);
}

function teleportPlayer(game, x, y) {
  const cell = { x: Math.round(Number(x)), y: Math.round(Number(y)) };
  if (!Number.isFinite(cell.x) || !Number.isFinite(cell.y)) return { ok: false, reason: 'Bad coordinates.' };
  if (!game.grid?.isInside?.(cell.x, cell.y) || !game.grid?.isWalkable?.(cell.x, cell.y)) {
    return { ok: false, reason: 'Destination is blocked.' };
  }
  game.player.moveTo(cell.x, cell.y);
  game.player.pxOffset = { x: 0, y: 0 };
  game.pathQueue = [];
  game.pendingExploreTarget = null;
  game.preCombatTarget = null;
  return summarizeGame(game);
}

function startEncounter(game, encounterId) {
  if (game.mode !== 'combat') game._startCombat?.(encounterId);
  return summarizeGame(game);
}

function resetCombat(game) {
  game.mode = 'explore';
  game.turnManager.active = false;
  game.enemyActions = null;
  game.enemyActor = null;
  game._clearCombatTechniquesState?.();
  for (const enemy of game.enemies ?? []) {
    enemy.isDead = false;
    enemy.hp = enemy.maxHp;
    enemy.ap = enemy.maxAp;
    enemy.render.state = 'idle';
    enemy.render.timer = 0;
  }
  healPlayer(game);
  return summarizeGame(game);
}

function healPlayer(game) {
  if (!game.player) return { ok: false, reason: 'No player.' };
  game.player.isDead = false;
  game.player.hp = game.player.maxHp;
  game.player.ap = game.player.maxAp;
  game.player.render.state = 'idle';
  game.player.render.timer = 0;
  return summarizeGame(game);
}

function summarizeGame(game) {
  const progression = normalizeProgression(game.player?.progression);
  return {
    ok: true,
    mode: game.mode,
    player: {
      name: game.player?.name,
      hp: game.player?.hp,
      maxHp: game.player?.maxHp,
      ap: game.player?.ap,
      maxAp: game.player?.maxAp,
      position: { ...(game.player?.position ?? {}) },
      build: progression.build,
      level: progression.level,
      primaries: progression.primaries,
      topFields: topFields(progression),
      techniques: progression.techniques
    },
    enemies: (game.enemies ?? []).map((enemy) => ({
      id: enemy.id,
      name: enemy.name,
      encounter: enemy.encounter ?? null,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      ap: enemy.ap,
      maxAp: enemy.maxAp,
      dead: Boolean(enemy.isDead),
      position: { ...enemy.position }
    }))
  };
}

function topFields(progression) {
  return FIELD_RATINGS.map((field) => ({
    id: field.id,
    label: field.label,
    value: calculateFieldRating(progression, field)
  }))
    .sort((a, b) => (b.value - a.value) || a.label.localeCompare(b.label))
    .slice(0, 8);
}

function wholeNumber(value, fallback) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : fallback;
}
