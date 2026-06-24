// Loads a level and all the content it references, then assembles the runtime
// objects the game needs: a Grid, the renderer prop list (walls derived from
// tiles + authored objects), the interactable subset, ground items, the player
// and enemy entities, item definitions, dialogue definitions, quest
// definitions, and encounter trigger zones.

import { Grid } from '../world/Grid.js';
import { createActor } from '../entities/ActorFactory.js';
import { isPassableWhenOpen } from '../world/DoorSystem.js';
import { createGroundItem } from '../world/GroundItems.js';
import { PATROL_MODES } from '../world/PerceptionSystem.js';
import { clampLoadingProgress } from './LoadingProgress.js';

export const PATROL_MIN_DWELL = 2.4;
const PATROL_MIN_VARIANCE = 0.6;
const PATROL_STEP_DELAY = 3.0;

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function reportLoadProgress(onProgress, progress, message, detail = '') {
  if (typeof onProgress !== 'function') return;
  onProgress({ progress: clampLoadingProgress(progress), message, detail });
}

function collectionProgress(index, total, start, end) {
  if (total <= 0) return end;
  return start + (end - start) * (index / total);
}

async function loadContentById(ids, folder, options = {}) {
  const list = ids ?? [];
  const entries = {};
  if (list.length === 0) {
    reportLoadProgress(options.onProgress, options.end ?? 1, options.message ?? 'Loading content');
    return entries;
  }

  for (const [index, id] of list.entries()) {
    reportLoadProgress(
      options.onProgress,
      collectionProgress(index, list.length, options.start ?? 0, options.end ?? 1),
      options.message ?? 'Loading content',
      `${index + 1} of ${list.length}`
    );
    entries[id] = await loadJson(`./data/${folder}/${id}.json`);
  }
  reportLoadProgress(options.onProgress, options.end ?? 1, options.message ?? 'Loading content', `${list.length} of ${list.length}`);
  return entries;
}

function addInventoryEffectItems(effects, itemIds) {
  const inventory = effects?.inventory;
  if (!inventory) return;
  for (const entry of [].concat(inventory.add ?? [], inventory.remove ?? [])) {
    if (entry?.item) itemIds.add(entry.item);
  }
}

function collectDialogueItemIds(dialogueDefs, itemIds) {
  for (const dialogue of Object.values(dialogueDefs ?? {})) {
    for (const node of Object.values(dialogue.nodes ?? {})) {
      addInventoryEffectItems(node.effects, itemIds);
      for (const choice of node.choices ?? []) addInventoryEffectItems(choice.effects, itemIds);
    }
  }
}

function collectLockItemIds(lock, itemIds) {
  if (!lock || typeof lock !== 'object' || !Array.isArray(lock.methods)) return;
  for (const method of lock.methods) {
    if (method?.requiresItem) itemIds.add(method.requiresItem);
    addInventoryEffectItems(method?.success, itemIds);
    addInventoryEffectItems(method?.failure, itemIds);
  }
}

function collectSearchItemIds(search, itemIds) {
  if (!search || typeof search !== 'object' || !Array.isArray(search.methods)) return;
  for (const method of search.methods) {
    if (method?.requiresItem) itemIds.add(method.requiresItem);
    addInventoryEffectItems(method?.success, itemIds);
    addInventoryEffectItems(method?.failure, itemIds);
  }
}

function collectTradeItemIds(trade, itemIds) {
  if (!trade || typeof trade !== 'object') return;
  if (typeof trade.currency === 'string') itemIds.add(trade.currency);
  for (const entry of trade.stock ?? []) {
    if (entry?.item) itemIds.add(entry.item);
  }
}

function mergeActorAppearance(base, override) {
  if (!override) return base ?? null;
  return { ...(base ?? {}), ...override };
}

function clonePoint(point) {
  return { x: point.x, y: point.y };
}

function cloneEffect(effect) {
  if (!effect || typeof effect !== 'object' || Array.isArray(effect)) return null;
  return JSON.parse(JSON.stringify(effect));
}

function positiveNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function sortedDelay(min, max, fallback = 1.6) {
  const a = positiveNumber(min, fallback);
  const b = positiveNumber(max, a);
  const rawMin = Math.max(0.1, Math.min(a, b));
  const rawMax = Math.max(0.1, Math.max(a, b));
  const normalizedMin = Math.max(PATROL_MIN_DWELL, rawMin);
  let normalizedMax = Math.max(normalizedMin, rawMax);
  if (rawMin < PATROL_MIN_DWELL && normalizedMax - normalizedMin < PATROL_MIN_VARIANCE) {
    normalizedMax = normalizedMin + PATROL_MIN_VARIANCE;
  }
  return {
    min: normalizedMin,
    max: normalizedMax
  };
}

export function normalizePatrolDelay(value, fallback = PATROL_STEP_DELAY) {
  if (Array.isArray(value) && value.length >= 2) return sortedDelay(value[0], value[1], fallback);
  if (value && typeof value === 'object') {
    return sortedDelay(value.min ?? value.low, value.max ?? value.high, fallback);
  }
  const base = positiveNumber(value, fallback);
  return sortedDelay(base * 0.75, base * 1.25, fallback);
}

export function randomPatrolDelay(patrol) {
  const delay = patrol?.delay ?? normalizePatrolDelay(PATROL_STEP_DELAY);
  return delay.min + Math.random() * (delay.max - delay.min);
}

function initialPatrolTimer(delay, index) {
  const spread = delay.max - delay.min;
  if (spread <= 0) return delay.min;
  return delay.min + ((index % 4) / 3) * spread;
}

export function normalizePatrol(spawn, index = 0) {
  const authored = Array.isArray(spawn.patrol)
    ? { path: spawn.patrol }
    : spawn.patrol;
  if (!authored || typeof authored !== 'object' || !Array.isArray(authored.path) || authored.path.length < 2) {
    return null;
  }
  const delay = normalizePatrolDelay(authored.delay ?? authored.wait ?? authored.pause ?? PATROL_STEP_DELAY);
  const mode = PATROL_MODES.includes(authored.mode) ? authored.mode : 'loop';
  const timer = nonNegativeNumber(authored.startDelay ?? authored.timer, initialPatrolTimer(delay, index));
  return {
    path: authored.path.map(clonePoint),
    mode,
    delay,
    index: 0,
    direction: 1,
    timer,
    onComplete: cloneEffect(authored.onComplete ?? authored.complete ?? authored.arrival),
    removeOnComplete: Boolean(authored.removeOnComplete ?? authored.remove ?? authored.hideOnComplete)
  };
}

// Map a non-walkable legend entry to a renderer prop kind. Any block kind the
// sprite catalog knows (wall, wall-broken, wall-window, ...) passes straight
// through; an unnamed entry falls back to a plain wall block.
function wallKindFor(def) {
  return typeof def?.kind === 'string' ? def.kind : 'wall';
}

export async function loadLevel(levelPath, options = {}) {
  const onProgress = options.onProgress;
  reportLoadProgress(onProgress, 0.02, 'Reading level record');
  const level = await loadJson(levelPath);
  reportLoadProgress(onProgress, 0.08, 'Building map grid');
  const grid = new Grid(level);

  const props = [];

  // Cells already covered by an authored wall-block object (a `wall-*` kind set
  // into the wall, e.g. wall-safe / wall-stash): the default tile-wall behind it
  // is skipped so the block is not drawn twice.
  const wallObjectCells = new Set();
  for (const object of level.objects ?? []) {
    if (typeof object.kind === 'string' && object.kind.startsWith('wall-')) {
      wallObjectCells.add(`${object.x},${object.y}`);
    }
  }

  // Walls from the tile map.
  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const def = grid.getTileDef(x, y);
      if (def && !def.walkable && !wallObjectCells.has(`${x},${y}`)) {
        props.push({ kind: wallKindFor(def), x, y, height: def.height });
      }
    }
  }

  // Authored objects (decals, props, interactables, loot containers).
  const interactables = [];
  for (const object of level.objects ?? []) {
    props.push(object);
    if (object.blocking && !(object.opened && isPassableWhenOpen(object))) grid.addBlocked(object.x, object.y);
    if (object.interact) interactables.push(object);
  }

  // Player.
  reportLoadProgress(onProgress, 0.18, 'Loading player record');
  const playerSpawn = level.spawns.player;
  const playerData = await loadJson(`./data/actors/${playerSpawn.actor ?? 'mara-vey'}.json`);
  const player = createActor(playerData, { x: playerSpawn.x, y: playerSpawn.y });
  const playerLoadout = playerData.inventory ?? null;

  // Enemies (load each unique enemy id once).
  reportLoadProgress(onProgress, 0.25, 'Loading enemy records');
  const enemySpawns = level.spawns.enemies ?? [];
  const enemyDataById = new Map();
  const uniqueEnemyIds = [...new Set(enemySpawns.map((spawn) => spawn.id).filter(Boolean))];
  for (const [index, enemyId] of uniqueEnemyIds.entries()) {
    reportLoadProgress(onProgress, collectionProgress(index, Math.max(1, uniqueEnemyIds.length), 0.25, 0.34), 'Loading enemy records', `${index + 1} of ${uniqueEnemyIds.length}`);
    const spawn = enemySpawns.find((entry) => entry.id === enemyId);
    if (!enemyDataById.has(spawn.id)) {
      enemyDataById.set(spawn.id, await loadJson(`./data/enemies/${spawn.id}.json`));
    }
  }
  reportLoadProgress(onProgress, 0.34, 'Loading enemy records', `${uniqueEnemyIds.length} of ${uniqueEnemyIds.length}`);
  const enemies = enemySpawns.map((spawn, index) => {
    const enemyData = enemyDataById.get(spawn.id);
    const enemy = createActor(enemyData, { x: spawn.x, y: spawn.y });
    if (spawn.spriteId) enemy.spriteId = spawn.spriteId;
    enemy.appearance = mergeActorAppearance(enemy.appearance, spawn.appearance);
    enemy.spawnId = spawn.spawnId ?? `${spawn.id}-${index}`;
    enemy.encounter = spawn.encounter ?? enemy.spawnId;
    enemy.aggroRadius = spawn.aggroRadius ?? level.enemyAggroRadius ?? null;
    enemy.facing = spawn.facing ?? enemy.facing;
    enemy.perception = spawn.perception ? JSON.parse(JSON.stringify(spawn.perception)) : null;
    enemy.patrol = normalizePatrol(spawn, index);
    enemy.dialogue = spawn.dialogue ?? null;
    enemy.dialogueRepeat = Boolean(spawn.dialogueRepeat);
    enemy.dialogueTriggerRadius = spawn.dialogueTriggerRadius ?? null;
    enemy.talkRadius = spawn.talkRadius ?? 1;
    if (Array.isArray(spawn.loot)) enemy.loot = spawn.loot.map((entry) => ({ ...entry }));
    enemy.ambient = Array.isArray(spawn.ambient) ? [...spawn.ambient] : [];
    enemy.aggro = Array.isArray(spawn.aggro)
      ? [...spawn.aggro]
      : Array.isArray(enemyData.aggro)
        ? [...enemyData.aggro]
        : [];
    enemy.aggroIndex = 0;
    enemy.ambientIndex = 0;
    enemy.ambientTimer = 3 + (index % 3) * 2.4;
    return enemy;
  });

  // Neutral NPCs use actor data and the same render/dialogue/ambient plumbing as
  // enemies, but Game keeps them out of combat targeting and victory checks.
  reportLoadProgress(onProgress, 0.36, 'Loading survivor records');
  const npcSpawns = level.spawns.npcs ?? [];
  const npcDataById = new Map();
  const uniqueNpcIds = [...new Set(npcSpawns.map((spawn) => spawn.actor ?? spawn.id).filter(Boolean))];
  for (const [index, actorId] of uniqueNpcIds.entries()) {
    reportLoadProgress(onProgress, collectionProgress(index, Math.max(1, uniqueNpcIds.length), 0.36, 0.42), 'Loading survivor records', `${index + 1} of ${uniqueNpcIds.length}`);
    if (!npcDataById.has(actorId)) {
      npcDataById.set(actorId, await loadJson(`./data/actors/${actorId}.json`));
    }
  }
  reportLoadProgress(onProgress, 0.42, 'Loading survivor records', `${uniqueNpcIds.length} of ${uniqueNpcIds.length}`);
  const npcs = npcSpawns.map((spawn, index) => {
    const actorId = spawn.actor ?? spawn.id;
    const npc = createActor(npcDataById.get(actorId), { x: spawn.x, y: spawn.y });
    if (spawn.spriteId) npc.spriteId = spawn.spriteId;
    npc.appearance = mergeActorAppearance(npc.appearance, spawn.appearance);
    npc.spawnId = spawn.spawnId ?? `${actorId}-${index}`;
    npc.facing = spawn.facing ?? npc.facing;
    npc.patrol = normalizePatrol(spawn, index);
    npc.dialogue = spawn.dialogue ?? null;
    npc.dialogueRepeat = spawn.dialogueRepeat !== false;
    npc.dialogueTriggerRadius = spawn.dialogueTriggerRadius ?? null;
    npc.talkRadius = spawn.talkRadius ?? 1;
    npc.ambient = Array.isArray(spawn.ambient) ? [...spawn.ambient] : [];
    npc.ambientIndex = 0;
    npc.ambientTimer = 8 + (index % 6) * 3.2;
    npc.conditions = spawn.conditions ?? null;
    return npc;
  });

  const dialogueDefs = await loadContentById(level.dialogue ?? [], 'dialogue', {
    onProgress,
    start: 0.44,
    end: 0.58,
    message: 'Loading dialogue'
  });
  const questDefs = await loadContentById(level.quests ?? [], 'quests', {
    onProgress,
    start: 0.58,
    end: 0.64,
    message: 'Loading quests'
  });
  reportLoadProgress(onProgress, 0.66, 'Loading technique index');
  const techniqueIndex = await loadJson('./data/techniques/index.json');
  const techniqueDefs = await loadContentById(techniqueIndex.ids ?? [], 'techniques', {
    onProgress,
    start: 0.68,
    end: 0.76,
    message: 'Loading techniques'
  });

  // Item definitions referenced by loot.
  reportLoadProgress(onProgress, 0.78, 'Finding gear records');
  const itemIds = new Set();
  for (const object of interactables) {
    for (const entry of object.interact.loot ?? []) itemIds.add(entry.item);
    collectLockItemIds(object.interact.lock, itemIds);
    collectSearchItemIds(object.interact.search, itemIds);
  }
  for (const data of enemyDataById.values()) {
    for (const entry of data.loot ?? []) itemIds.add(entry.item);
    collectTradeItemIds(data.trade, itemIds);
  }
  for (const data of npcDataById.values()) collectTradeItemIds(data.trade, itemIds);
  for (const spawn of enemySpawns) {
    for (const entry of spawn.loot ?? []) itemIds.add(entry.item);
  }
  for (const entry of level.groundItems ?? []) {
    if (entry.item) itemIds.add(entry.item);
  }
  for (const entry of playerLoadout?.items ?? []) itemIds.add(entry.item);
  for (const itemId of Object.values(playerLoadout?.equipment ?? {})) itemIds.add(itemId);
  collectDialogueItemIds(dialogueDefs, itemIds);
  const itemDefs = {};
  const itemList = [...itemIds];
  for (const [index, id] of itemList.entries()) {
    reportLoadProgress(onProgress, collectionProgress(index, Math.max(1, itemList.length), 0.82, 0.94), 'Loading gear records', `${index + 1} of ${itemList.length}`);
    itemDefs[id] = await loadJson(`./data/items/${id}.json`);
  }
  reportLoadProgress(onProgress, 0.94, 'Loading gear records', `${itemList.length} of ${itemList.length}`);

  reportLoadProgress(onProgress, 0.97, 'Assembling level');
  const groundItems = (level.groundItems ?? [])
    .map((entry, index) => createGroundItem({
      id: entry.id ?? `${level.id}-ground-${index}`,
      itemId: entry.item,
      itemDef: itemDefs[entry.item],
      count: entry.count ?? 1,
      x: entry.x,
      y: entry.y,
      source: entry.source ?? 'authored',
      pickupPolicy: entry.pickupPolicy
    }))
    .filter(Boolean);

  reportLoadProgress(onProgress, 1, 'Level ready');
  return {
    id: level.id,
    name: level.name,
    intro: level.intro ?? '',
    briefing: Array.isArray(level.briefing) ? level.briefing : null,
    briefingTitle: level.briefingTitle ?? 'FIELD WRIT',
    mood: level.mood ?? null,
    grid,
    props,
    interactables,
    player,
    enemies,
    npcs,
    groundItems,
    itemDefs,
    techniqueDefs,
    playerLoadout,
    dialogueDefs,
    questDefs,
    codex: Array.isArray(level.codex) ? level.codex : [],
    journalNotes: Array.isArray(level.journalNotes) ? level.journalNotes : [],
    hiddenRegions: Array.isArray(level.hiddenRegions) ? level.hiddenRegions : [],
    enemyVisionRadius: level.enemyVisionRadius ?? null,
    enemyVisionCone: level.enemyVisionCone ?? null,
    enemyHearingRadius: level.enemyHearingRadius ?? null,
    combatStartBarks: level.combatStartBarks ?? [],
    combatIntro: level.combatIntro ?? [],
    combatTriggers: level.combatTriggers ?? (level.combatTrigger ? [level.combatTrigger] : []),
    victoryLog: level.victoryLog ?? null,
    onVictory: level.onVictory ?? null,
    triggerZone: level.combatTrigger ?? null
  };
}
