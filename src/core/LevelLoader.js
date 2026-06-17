// Loads a level and all the content it references, then assembles the runtime
// objects the game needs: a Grid, the renderer prop list (walls derived from
// tiles + authored objects), the interactable subset, the player and enemy
// entities, item definitions, dialogue definitions, quest definitions, and
// encounter trigger zones.

import { Grid } from '../world/Grid.js';
import { createActor } from '../entities/ActorFactory.js';

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

// Map a non-walkable legend entry to a renderer prop kind.
function wallKindFor(def) {
  return def?.kind === 'wall-broken' ? 'wall-broken' : 'wall';
}

export async function loadLevel(levelPath) {
  const level = await loadJson(levelPath);
  const grid = new Grid(level);

  const props = [];

  // Walls from the tile map.
  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const def = grid.getTileDef(x, y);
      if (def && !def.walkable) {
        props.push({ kind: wallKindFor(def), x, y, height: def.height });
      }
    }
  }

  // Authored objects (decals, props, interactables, loot containers).
  const interactables = [];
  for (const object of level.objects ?? []) {
    props.push(object);
    if (object.blocking) grid.addBlocked(object.x, object.y);
    if (object.interact) interactables.push(object);
  }

  // Player.
  const playerSpawn = level.spawns.player;
  const playerData = await loadJson(`./data/actors/${playerSpawn.actor ?? 'mara-vey'}.json`);
  const player = createActor(playerData, { x: playerSpawn.x, y: playerSpawn.y });

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
    enemy.spawnId = spawn.spawnId ?? `${spawn.id}-${index}`;
    enemy.encounter = spawn.encounter ?? enemy.spawnId;
    enemy.aggroRadius = spawn.aggroRadius ?? level.enemyAggroRadius ?? null;
    enemy.ambient = Array.isArray(spawn.ambient) ? [...spawn.ambient] : [];
    enemy.ambientIndex = 0;
    enemy.ambientTimer = 1.2 + (index % 3) * 1.4;
    return enemy;
  });

  // Item definitions referenced by loot.
  const itemIds = new Set();
  for (const object of interactables) {
    for (const entry of object.interact.loot ?? []) itemIds.add(entry.item);
  }
  const itemDefs = {};
  for (const id of itemIds) {
    itemDefs[id] = await loadJson(`./data/items/${id}.json`);
  }

  const dialogueDefs = await loadContentById(level.dialogue ?? [], 'dialogue');
  const questDefs = await loadContentById(level.quests ?? [], 'quests');

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
    itemDefs,
    dialogueDefs,
    questDefs,
    combatIntro: level.combatIntro ?? [],
    combatTriggers: level.combatTriggers ?? (level.combatTrigger ? [level.combatTrigger] : []),
    onVictory: level.onVictory ?? null,
    triggerZone: level.combatTrigger ?? null
  };
}
