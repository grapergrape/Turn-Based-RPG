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
import { normalizeNpcActivity } from '../world/NpcActivity.js';
import { hydrateActorWeaponLoadout } from '../combat/ActorWeaponLoadout.js';
import { clampLoadingProgress } from './LoadingProgress.js';

export const PATROL_MIN_DWELL = 2.4;
const PATROL_MIN_VARIANCE = 0.6;
const PATROL_STEP_DELAY = 3.0;
const PATROL_ACTIVITY_DEFAULT_DURATION = 2.4;
const PATROL_ACTIVITY_MIN_DURATION = 0.8;
const PATROL_ACTIVITY_MAX_DURATION = 12;

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

const RUN_LEVEL_PATH_PATTERN = /^\.\/data\/levels\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*\.json$/;
const CONTENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

async function loadReferencedRunContent(paths, currentLevelPath) {
  const questIds = new Set();
  const questDefs = {};
  const codex = [];
  const journalNotes = [];
  const uniquePaths = [...new Set(paths ?? [])]
    .filter((path) => path !== currentLevelPath && RUN_LEVEL_PATH_PATTERN.test(path));

  for (const path of uniquePaths) {
    try {
      const level = await loadJson(path);
      for (const questId of level.quests ?? []) {
        if (CONTENT_ID_PATTERN.test(questId)) questIds.add(questId);
      }
      if (Array.isArray(level.codex)) codex.push(...level.codex);
      if (Array.isArray(level.journalNotes)) journalNotes.push(...level.journalNotes);
    } catch {
      // A retired previously visited map must not strand a run that can still
      // load its current map. Missing journal sources simply stop contributing.
    }
  }

  for (const questId of questIds) {
    try {
      questDefs[questId] = await loadJson(`./data/quests/${questId}.json`);
    } catch {
      // Quest data can be retired independently of a compatible run snapshot.
    }
  }
  return { questDefs, codex, journalNotes };
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

function addConditionItems(conditions, itemIds) {
  if (!conditions || typeof conditions !== 'object') return;
  for (const itemId of Object.keys(conditions.items ?? {})) itemIds.add(itemId);
  for (const itemId of Object.keys(conditions.itemsMax ?? {})) itemIds.add(itemId);
}

function collectDialogueItemIds(dialogueDefs, itemIds) {
  for (const dialogue of Object.values(dialogueDefs ?? {})) {
    for (const node of Object.values(dialogue.nodes ?? {})) {
      addConditionItems(node.conditions, itemIds);
      addInventoryEffectItems(node.effects, itemIds);
      for (const choice of node.choices ?? []) {
        addConditionItems(choice.conditions, itemIds);
        addInventoryEffectItems(choice.effects, itemIds);
      }
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
  for (const entry of trade.buys ?? []) {
    if (entry?.item) itemIds.add(entry.item);
  }
}

function mergeActorAppearance(base, override) {
  if (!override) return base ?? null;
  return { ...(base ?? {}), ...override };
}

function normalizePatrolActivity(value) {
  return normalizeNpcActivity(value, {
    defaultDuration: PATROL_ACTIVITY_DEFAULT_DURATION,
    minDuration: PATROL_ACTIVITY_MIN_DURATION,
    maxDuration: PATROL_ACTIVITY_MAX_DURATION
  });
}

function clonePoint(point) {
  const activity = normalizePatrolActivity(point.activity);
  return activity
    ? { x: point.x, y: point.y, activity }
    : { x: point.x, y: point.y };
}

function cloneEffect(effect) {
  if (!effect || typeof effect !== 'object' || Array.isArray(effect)) return null;
  return JSON.parse(JSON.stringify(effect));
}

function cloneLevelTransitions(transitions) {
  if (!Array.isArray(transitions)) return [];
  return transitions
    .filter((transition) => transition && typeof transition === 'object' && !Array.isArray(transition))
    .map((transition) => JSON.parse(JSON.stringify(transition)));
}

function cloneTableaux(tableaux) {
  if (!Array.isArray(tableaux)) return [];
  return tableaux
    .filter((tableau) => tableau && typeof tableau === 'object' && !Array.isArray(tableau))
    .map((tableau) => ({
      id: tableau.id,
      center: { x: tableau.center?.x, y: tableau.center?.y },
      activationRadius: positiveNumber(tableau.activationRadius, 16),
      startDelay: nonNegativeNumber(tableau.startDelay, 0),
      cooldown: normalizePatrolDelay(tableau.cooldown ?? { min: 30, max: 45 }, 30),
      participants: (tableau.participants ?? [])
        .map((participant) => ({
          actor: participant.actor,
          slot: { x: participant.slot?.x, y: participant.slot?.y },
          delay: nonNegativeNumber(participant.delay, 0),
          activity: normalizePatrolActivity(participant.activity)
        }))
        .filter((participant) => participant.actor && participant.activity),
      barks: (tableau.barks ?? []).map((bark) => ({
        at: nonNegativeNumber(bark.at, 0),
        actor: bark.actor,
        text: bark.text
      }))
    }));
}

function cloneSoundscape(soundscape) {
  if (!soundscape || typeof soundscape !== 'object' || Array.isArray(soundscape)) return null;
  return {
    maxDistance: positiveNumber(soundscape.maxDistance, 18),
    maxOneShots: Math.max(1, Math.min(8, Math.round(positiveNumber(soundscape.maxOneShots, 4)))),
    activityCues: [...new Set((soundscape.activityCues ?? []).filter((cue) => typeof cue === 'string'))],
    ambientBeds: (soundscape.ambientBeds ?? [])
      .filter((bed) => bed && typeof bed === 'object' && !Array.isArray(bed))
      .map((bed) => ({
        id: bed.id,
        profile: bed.profile,
        bounds: {
          x0: bed.bounds?.x0,
          y0: bed.bounds?.y0,
          x1: bed.bounds?.x1,
          y1: bed.bounds?.y1
        },
        gain: Math.max(0, Math.min(1, Number.isFinite(bed.gain) ? bed.gain : 0.2))
      }))
  };
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

function hasMatchingBlock(grid, x, y, kind) {
  const def = grid.getTileDef(x, y);
  return Boolean(def && !def.walkable && wallKindFor(def) === kind);
}

function connectedBlockEdges(grid, x, y, kind) {
  return {
    xMinus: hasMatchingBlock(grid, x - 1, y, kind),
    xPlus: hasMatchingBlock(grid, x + 1, y, kind),
    yMinus: hasMatchingBlock(grid, x, y - 1, kind),
    yPlus: hasMatchingBlock(grid, x, y + 1, kind)
  };
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
        const kind = wallKindFor(def);
        props.push({
          kind,
          x,
          y,
          height: def.height,
          variant: def.variant,
          connected: connectedBlockEdges(grid, x, y, kind)
        });
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
    enemy.mapMarker = spawn.mapMarker ?? null;
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
    enemy.conditions = spawn.conditions ?? null;
    enemy.dormantUntilCombat = Boolean(spawn.dormantUntilCombat);
    enemy.dormant = enemy.dormantUntilCombat;
    enemy.weaponLoadout = JSON.parse(JSON.stringify(spawn.weapons ?? enemyData.weapons ?? []));
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
    npc.mapMarker = spawn.mapMarker ?? null;
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
  const currentQuestDefs = await loadContentById(level.quests ?? [], 'quests', {
    onProgress,
    start: 0.58,
    end: 0.64,
    message: 'Loading quests'
  });
  const referencedRunContent = await loadReferencedRunContent(options.requiredLevelPaths, levelPath);
  const questDefs = { ...referencedRunContent.questDefs, ...currentQuestDefs };
  reportLoadProgress(onProgress, 0.66, 'Loading technique index');
  const techniqueIndex = await loadJson('./data/techniques/index.json');
  const techniqueDefs = await loadContentById(techniqueIndex.ids ?? [], 'techniques', {
    onProgress,
    start: 0.68,
    end: 0.76,
    message: 'Loading techniques'
  });
  const companionIndex = await loadJson('./data/companions/index.json');
  const companionDefs = await loadContentById(companionIndex.ids ?? [], 'companions', {
    onProgress,
    start: 0.76,
    end: 0.78,
    message: 'Loading companion records'
  });

  // Item definitions referenced by loot.
  reportLoadProgress(onProgress, 0.78, 'Finding gear records');
  const itemIds = new Set();
  for (const itemId of options.requiredItemIds ?? []) {
    if (typeof itemId === 'string' && itemId.trim() !== '') itemIds.add(itemId);
  }
  for (const object of interactables) {
    for (const entry of object.interact.loot ?? []) itemIds.add(entry.item);
    collectLockItemIds(object.interact.lock, itemIds);
    collectSearchItemIds(object.interact.search, itemIds);
  }
  for (const data of enemyDataById.values()) {
    for (const entry of data.loot ?? []) itemIds.add(entry.item);
    for (const entry of data.weapons ?? []) if (entry?.item) itemIds.add(entry.item);
    collectTradeItemIds(data.trade, itemIds);
  }
  for (const data of npcDataById.values()) collectTradeItemIds(data.trade, itemIds);
  for (const spawn of enemySpawns) {
    for (const entry of spawn.loot ?? []) itemIds.add(entry.item);
    for (const entry of spawn.weapons ?? []) if (entry?.item) itemIds.add(entry.item);
  }
  for (const entry of level.groundItems ?? []) {
    if (entry.item) itemIds.add(entry.item);
  }
  for (const entry of playerLoadout?.items ?? []) itemIds.add(entry.item);
  for (const itemId of Object.values(playerLoadout?.equipment ?? {})) itemIds.add(itemId);
  collectDialogueItemIds(dialogueDefs, itemIds);
  const ammunitionIndex = await loadJson('./data/catalogs/ammunition.json');
  for (const itemId of Object.values(ammunitionIndex.families ?? {})) itemIds.add(itemId);
  for (const companion of Object.values(companionDefs)) {
    if (companion.serviceItem) itemIds.add(companion.serviceItem);
  }
  const itemDefs = {};
  const itemList = [...itemIds];
  for (const [index, id] of itemList.entries()) {
    reportLoadProgress(onProgress, collectionProgress(index, Math.max(1, itemList.length), 0.82, 0.94), 'Loading gear records', `${index + 1} of ${itemList.length}`);
    itemDefs[id] = await loadJson(`./data/items/${id}.json`);
  }
  reportLoadProgress(onProgress, 0.94, 'Loading gear records', `${itemList.length} of ${itemList.length}`);
  for (const enemy of enemies) hydrateActorWeaponLoadout(enemy, enemy.weaponLoadout, itemDefs);

  reportLoadProgress(onProgress, 0.97, 'Assembling level');
  const groundItems = (level.groundItems ?? [])
    .map((entry, index) => createGroundItem({
      id: entry.id ?? `${level.id}-ground-${index}`,
      itemId: entry.item,
      itemDef: itemDefs[entry.item],
      count: entry.count ?? 1,
      condition: entry.condition,
      loaded: entry.loaded,
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
    soundscape: cloneSoundscape(level.soundscape),
    grid,
    props,
    interactables,
    player,
    enemies,
    npcs,
    groundItems,
    itemDefs,
    techniqueDefs,
    companionDefs,
    playerLoadout,
    dialogueDefs,
    questDefs,
    codex: [...referencedRunContent.codex, ...(Array.isArray(level.codex) ? level.codex : [])],
    journalNotes: [...referencedRunContent.journalNotes, ...(Array.isArray(level.journalNotes) ? level.journalNotes : [])],
    hiddenRegions: Array.isArray(level.hiddenRegions) ? level.hiddenRegions : [],
    enemyVisionRadius: level.enemyVisionRadius ?? null,
    enemyVisionCone: level.enemyVisionCone ?? null,
    enemyHearingRadius: level.enemyHearingRadius ?? null,
    combatStartBarks: level.combatStartBarks ?? [],
    combatIntro: level.combatIntro ?? [],
    levelTransitions: cloneLevelTransitions(level.levelTransitions),
    tableaux: cloneTableaux(level.tableaux),
    combatTriggers: level.combatTriggers ?? (level.combatTrigger ? [level.combatTrigger] : []),
    victoryLog: level.victoryLog ?? null,
    onVictory: level.onVictory ?? null,
    triggerZone: level.combatTrigger ?? null
  };
}
