// Loads a level and all the content it references, then assembles the runtime
// objects the game needs: a Grid, the renderer prop list (walls derived from
// tiles + authored objects), the interactable subset, the player and enemy
// entities, item definitions, and the combat trigger zone.

import { Grid } from '../world/Grid.js';
import { createActor } from '../entities/ActorFactory.js';

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json();
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
  const enemies = enemySpawns.map((spawn) =>
    createActor(enemyDataById.get(spawn.id), { x: spawn.x, y: spawn.y })
  );

  // Item definitions referenced by loot.
  const itemIds = new Set();
  for (const object of interactables) {
    for (const entry of object.interact.loot ?? []) itemIds.add(entry.item);
  }
  const itemDefs = {};
  for (const id of itemIds) {
    itemDefs[id] = await loadJson(`./data/items/${id}.json`);
  }

  return {
    id: level.id,
    name: level.name,
    intro: level.intro ?? '',
    grid,
    props,
    interactables,
    player,
    enemies,
    itemDefs,
    triggerZone: level.combatTrigger ?? null
  };
}
