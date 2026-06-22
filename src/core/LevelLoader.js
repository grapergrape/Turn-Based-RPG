// Loads a level and all the content it references, then assembles the runtime
// objects the game needs: a Grid, the renderer prop list (walls derived from
// tiles + authored objects), the interactable subset, ground items, the player
// and enemy entities, item definitions, dialogue definitions, quest
// definitions, and encounter trigger zones.

import { Grid } from '../world/Grid.js';
import { createActor } from '../entities/ActorFactory.js';
import { isPassableWhenOpen } from '../world/DoorSystem.js';
import { createGroundItem } from '../world/GroundItems.js';

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function loadContentById(ids, folder) {
  const entries = {};
  for (const id of ids ?? []) {
    entries[id] = await loadJson(`./data/${folder}/${id}.json`);
  }
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

// Map a non-walkable legend entry to a renderer prop kind. Any block kind the
// sprite catalog knows (wall, wall-broken, wall-window, ...) passes straight
// through; an unnamed entry falls back to a plain wall block.
function wallKindFor(def) {
  return typeof def?.kind === 'string' ? def.kind : 'wall';
}

export async function loadLevel(levelPath) {
  const level = await loadJson(levelPath);
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
  const playerSpawn = level.spawns.player;
  const playerData = await loadJson(`./data/actors/${playerSpawn.actor ?? 'mara-vey'}.json`);
  const player = createActor(playerData, { x: playerSpawn.x, y: playerSpawn.y });
  const playerLoadout = playerData.inventory ?? null;

  // Enemies (load each unique enemy id once).
  const enemySpawns = level.spawns.enemies ?? [];
  const enemyDataById = new Map();
  for (const spawn of enemySpawns) {
    if (!enemyDataById.has(spawn.id)) {
      enemyDataById.set(spawn.id, await loadJson(`./data/enemies/${spawn.id}.json`));
    }
  }
  const enemies = enemySpawns.map((spawn, index) => {
    const enemy = createActor(enemyDataById.get(spawn.id), { x: spawn.x, y: spawn.y });
    if (spawn.spriteId) enemy.spriteId = spawn.spriteId;
    enemy.appearance = mergeActorAppearance(enemy.appearance, spawn.appearance);
    enemy.spawnId = spawn.spawnId ?? `${spawn.id}-${index}`;
    enemy.encounter = spawn.encounter ?? enemy.spawnId;
    enemy.aggroRadius = spawn.aggroRadius ?? level.enemyAggroRadius ?? null;
    enemy.dialogue = spawn.dialogue ?? null;
    enemy.dialogueRepeat = Boolean(spawn.dialogueRepeat);
    enemy.dialogueTriggerRadius = spawn.dialogueTriggerRadius ?? null;
    enemy.talkRadius = spawn.talkRadius ?? 1;
    if (Array.isArray(spawn.loot)) enemy.loot = spawn.loot.map((entry) => ({ ...entry }));
    enemy.ambient = Array.isArray(spawn.ambient) ? [...spawn.ambient] : [];
    enemy.ambientIndex = 0;
    enemy.ambientTimer = 3 + (index % 3) * 2.4;
    return enemy;
  });

  // Neutral NPCs use actor data and the same render/dialogue/ambient plumbing as
  // enemies, but Game keeps them out of combat targeting and victory checks.
  const npcSpawns = level.spawns.npcs ?? [];
  const npcDataById = new Map();
  for (const spawn of npcSpawns) {
    const actorId = spawn.actor ?? spawn.id;
    if (!npcDataById.has(actorId)) {
      npcDataById.set(actorId, await loadJson(`./data/actors/${actorId}.json`));
    }
  }
  const npcs = npcSpawns.map((spawn, index) => {
    const actorId = spawn.actor ?? spawn.id;
    const npc = createActor(npcDataById.get(actorId), { x: spawn.x, y: spawn.y });
    if (spawn.spriteId) npc.spriteId = spawn.spriteId;
    npc.appearance = mergeActorAppearance(npc.appearance, spawn.appearance);
    npc.spawnId = spawn.spawnId ?? `${actorId}-${index}`;
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

  const dialogueDefs = await loadContentById(level.dialogue ?? [], 'dialogue');
  const questDefs = await loadContentById(level.quests ?? [], 'quests');

  // Item definitions referenced by loot.
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
  for (const id of itemIds) {
    itemDefs[id] = await loadJson(`./data/items/${id}.json`);
  }

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
    playerLoadout,
    dialogueDefs,
    questDefs,
    codex: Array.isArray(level.codex) ? level.codex : [],
    journalNotes: Array.isArray(level.journalNotes) ? level.journalNotes : [],
    hiddenRegions: Array.isArray(level.hiddenRegions) ? level.hiddenRegions : [],
    combatIntro: level.combatIntro ?? [],
    combatTriggers: level.combatTriggers ?? (level.combatTrigger ? [level.combatTrigger] : []),
    victoryLog: level.victoryLog ?? null,
    onVictory: level.onVictory ?? null,
    triggerZone: level.combatTrigger ?? null
  };
}
