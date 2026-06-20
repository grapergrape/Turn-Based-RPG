import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getSprite } from '../src/render/spriteCatalog.js';
import { Grid } from '../src/world/Grid.js';
import { findPathToAdjacent } from '../src/world/Pathfinder.js';

const root = process.cwd();
const dataRoot = join(root, 'data');
const errors = [];

// NOTE: DECAL_KINDS below is a curated scene-density heuristic (ground clutter
// to keep rooms from looking bare), NOT the renderer's flat-decal set. The
// authoritative list of renderable kinds and which are flat lives in the sprite
// catalog (src/render/spriteCatalog.js); kind validity is checked against it.

// Content this slice (Ash Chapel Breach) must contain.
const MAIN_LEVEL_ID = 'ash-chapel-breach';
const CELLAR_LEVEL_ID = 'ash-chapel-cellar';
const REQUIRED_MAIN_ENEMY_IDS = [
  'choir-flesh-eater',
  'choir-candle-bearer',
  'choir-throat-singer',
  'host-touched-penitent'
];
const REQUIRED_INTERACTABLE_KINDS = ['rusted-reliquary', 'field-satchel', 'damaged-altar', 'rusted-barrel'];
const REQUIRED_ITEM_IDS = [
  'relic-rounds',
  'field-dressing',
  'tarnished-saint-token',
  'road-warden-chit',
  'choir-hymnal-fragment'
];
const REQUIRED_QUEST_IDS = ['investigate-ash-chapel-cult'];
const REQUIRED_DIALOGUE_IDS = [
  'ash-chapel-altar-rite',
  'ash-chapel-barrel-ladder',
  'ash-chapel-cellar-corpse',
  'ash-chapel-cellar-ladder',
  'ash-chapel-cult-ledger'
];
const DECAL_KINDS = new Set([
  'rubble-pile', 'rubble-decal', 'floor-crack', 'blood-stain', 'glass-debris', 'dust', 'road-dust'
]);
const ITEM_EQUIPMENT_SLOTS = new Set(['clothes', 'armor', 'boots', 'helmet', 'trinket', 'ring']);
const ITEM_GROUND_MODELS = new Set([
  'ball', 'boots', 'coat', 'hood', 'vest', 'ring', 'necklace', 'key',
  'token', 'chit', 'paper', 'vial', 'dressing', 'rounds', 'shard'
]);
const GROUND_ITEM_PICKUP_POLICIES = new Set(['player', 'any']);
const ACTOR_EQUIPMENT_SLOTS = new Set(['clothes', 'armor', 'boots', 'helmet', 'trinket', 'ring1', 'ring2']);

const seenItemIds = new Set();
const seenActorIds = new Set();
const seenQuestIds = new Set();
const seenDialogueIds = new Set();
const referencedItemIds = new Set();
const referencedActorIds = new Set();
const referencedDialogueIds = new Set();

async function main() {
  await checkRenderConfig();

  const jsonFiles = await findJsonFiles(dataRoot);

  for (const filePath of jsonFiles) {
    const data = await readJson(filePath);
    if (!data) continue;

    if (matchDir(filePath, 'maps')) validateMap(filePath, data);
    if (matchDir(filePath, 'levels')) validateLevel(filePath, data);
    if (matchDir(filePath, 'actors')) validateActor(filePath, data);
    if (matchDir(filePath, 'enemies')) validateEnemy(filePath, data);
    if (matchDir(filePath, 'items')) validateItem(filePath, data);
    if (matchDir(filePath, 'quests')) validateQuest(filePath, data);
    if (matchDir(filePath, 'dialogue')) validateDialogue(filePath, data);
  }

  for (const id of REQUIRED_ITEM_IDS) {
    if (!seenItemIds.has(id)) {
      errors.push(`data/items: required item "${id}" is missing.`);
    }
  }
  for (const id of REQUIRED_QUEST_IDS) {
    if (!seenQuestIds.has(id)) {
      errors.push(`data/quests: required quest "${id}" is missing.`);
    }
  }
  for (const id of REQUIRED_DIALOGUE_IDS) {
    if (!seenDialogueIds.has(id)) {
      errors.push(`data/dialogue: required dialogue "${id}" is missing.`);
    }
  }
  for (const id of referencedItemIds) {
    if (!seenItemIds.has(id)) {
      errors.push(`data/items: referenced item "${id}" is missing.`);
    }
  }
  for (const id of referencedActorIds) {
    if (!seenActorIds.has(id)) {
      errors.push(`data/actors: referenced actor "${id}" is missing.`);
    }
  }
  for (const id of referencedDialogueIds) {
    if (!seenDialogueIds.has(id)) {
      errors.push(`data/dialogue: referenced dialogue "${id}" is missing.`);
    }
  }

  if (errors.length > 0) {
    console.error('\nContent check failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Content check passed. Parsed ${jsonFiles.length} JSON file(s).`);
}

function matchDir(filePath, dir) {
  return filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`);
}

// Assert the renderer is configured for the fixed low-resolution presentation.
async function checkRenderConfig() {
  const configUrl = pathToFileURL(join(root, 'src', 'render', 'renderConfig.js'));
  try {
    const { RENDER_CONFIG } = await import(configUrl.href);
    const expect = (key, value) => {
      if (RENDER_CONFIG[key] !== value) {
        errors.push(`renderConfig: ${key} must be ${JSON.stringify(value)} (got ${JSON.stringify(RENDER_CONFIG[key])}).`);
      }
    };
    expect('INTERNAL_WIDTH', 640);
    expect('INTERNAL_HEIGHT', 480);
    expect('VIEWPORT_HEIGHT', 384);
    expect('TILE_WIDTH', 64);
    expect('TILE_HEIGHT', 32);
    expect('WALL_HEIGHT', 64);
    expect('DEBUG_GRID_DEFAULT', false);
  } catch (error) {
    errors.push(`renderConfig could not be loaded: ${error.message}`);
  }
}

async function findJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...await findJsonFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }

  return results;
}

async function readJson(filePath) {
  try {
    const text = await readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    errors.push(`${relative(filePath)} is invalid JSON: ${error.message}`);
    return null;
  }
}

// Shared tile-grid validation for maps and levels.
function validateTiles(name, data) {
  if (!Array.isArray(data.tiles)) {
    errors.push(`${name}: tiles must be an array of strings.`);
    return;
  }

  if (data.tiles.length !== data.height) {
    errors.push(`${name}: tiles length ${data.tiles.length} does not match height ${data.height}.`);
  }

  for (let y = 0; y < data.tiles.length; y += 1) {
    const row = data.tiles[y];

    if (typeof row !== 'string') {
      errors.push(`${name}: tile row ${y} must be a string.`);
      continue;
    }

    if (row.length !== data.width) {
      errors.push(`${name}: tile row ${y} length ${row.length} does not match width ${data.width}.`);
    }

    for (const tileChar of row) {
      if (!data.legend || !Object.hasOwn(data.legend, tileChar)) {
        errors.push(`${name}: tile character "${tileChar}" is missing from legend.`);
      }
    }
  }
}

function inBounds(data, point) {
  return point && point.x >= 0 && point.y >= 0 && point.x < data.width && point.y < data.height;
}

function validateMap(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireNumber(name, data.width, 'width');
  requireNumber(name, data.height, 'height');
  requireNumber(name, data.tileSize, 'tileSize');
  validateTiles(name, data);

  if (!data.spawns?.player) {
    errors.push(`${name}: missing spawns.player.`);
  }
}

function validateLevel(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.intro, 'intro');
  requireNumber(name, data.width, 'width');
  requireNumber(name, data.height, 'height');
  requireNumber(name, data.tileSize, 'tileSize');
  validateTiles(name, data);

  const player = data.spawns?.player;
  if (!player) {
    errors.push(`${name}: missing spawns.player.`);
  } else if (!inBounds(data, player)) {
    errors.push(`${name}: player start (${player.x}, ${player.y}) is out of bounds.`);
  }

  const enemies = data.spawns?.enemies ?? [];
  const npcs = data.spawns?.npcs ?? [];
  const levelDialogue = new Set();
  if (data.dialogue !== undefined) {
    if (!Array.isArray(data.dialogue)) {
      errors.push(`${name}: dialogue must be an array.`);
    } else {
      for (const id of data.dialogue) {
        requireString(name, id, 'dialogue[]');
        if (typeof id === 'string') {
          levelDialogue.add(id);
          referencedDialogueIds.add(id);
        }
      }
    }
  }
  for (const point of enemies) {
    if (!inBounds(data, point)) {
      errors.push(`${name}: enemy spawn (${point.x}, ${point.y}) is out of bounds.`);
    }
    if (point.dialogue !== undefined) {
      validateDialogueReference(name, point.dialogue, 'spawns.enemies[].dialogue');
      if (typeof point.dialogue === 'string' && !levelDialogue.has(point.dialogue)) {
        errors.push(`${name}: enemy dialogue "${point.dialogue}" must also be listed in level dialogue.`);
      }
    }
    if (point.dialogueTriggerRadius !== undefined) {
      requireNumber(name, point.dialogueTriggerRadius, 'spawns.enemies[].dialogueTriggerRadius');
    }
    if (point.talkRadius !== undefined) {
      requireNumber(name, point.talkRadius, 'spawns.enemies[].talkRadius');
    }
  }
  for (const point of npcs) {
    if (!inBounds(data, point)) {
      errors.push(`${name}: npc spawn (${point.x}, ${point.y}) is out of bounds.`);
    }
    const actorId = point.actor ?? point.id;
    requireString(name, actorId, 'spawns.npcs[].actor');
    if (typeof actorId === 'string') referencedActorIds.add(actorId);
    if (point.dialogue !== undefined) {
      validateDialogueReference(name, point.dialogue, 'spawns.npcs[].dialogue');
      if (typeof point.dialogue === 'string' && !levelDialogue.has(point.dialogue)) {
        errors.push(`${name}: npc dialogue "${point.dialogue}" must also be listed in level dialogue.`);
      }
    }
    if (point.dialogueTriggerRadius !== undefined) {
      requireNumber(name, point.dialogueTriggerRadius, 'spawns.npcs[].dialogueTriggerRadius');
    }
    if (point.talkRadius !== undefined) {
      requireNumber(name, point.talkRadius, 'spawns.npcs[].talkRadius');
    }
  }

  for (const id of REQUIRED_QUEST_IDS) {
    if (!Array.isArray(data.quests) || !data.quests.includes(id)) {
      errors.push(`${name}: required quest "${id}" is missing from quests.`);
    }
  }
  const objects = Array.isArray(data.objects) ? data.objects : [];
  for (const object of objects) {
    if (object.x !== undefined || object.y !== undefined) {
      if (!inBounds(data, object)) {
        errors.push(`${name}: object ${object.kind ?? 'unknown'} at (${object.x}, ${object.y}) is out of bounds.`);
      }
    }
    if (typeof object.kind === 'string' && !getSprite(object.kind)) {
      errors.push(`${name}: object kind "${object.kind}" at (${object.x}, ${object.y}) is not registered in the sprite catalog.`);
    }
    validateDialogueReference(name, object.interact?.dialogue, 'objects[].interact.dialogue');
    validateDialogueReference(name, object.interact?.lockedDialogue, 'objects[].interact.lockedDialogue');
    validateLoot(name, object.interact?.loot);
  }
  if (data.groundItems !== undefined) {
    if (!Array.isArray(data.groundItems)) {
      errors.push(`${name}: groundItems must be an array.`);
    } else {
      const grid = new Grid(data);
      for (const item of data.groundItems) {
        if (!inBounds(data, item)) {
          errors.push(`${name}: ground item ${item?.item ?? 'unknown'} at (${item?.x}, ${item?.y}) is out of bounds.`);
        } else if (!grid.isWalkable(item.x, item.y)) {
          errors.push(`${name}: ground item ${item.item ?? 'unknown'} at (${item.x}, ${item.y}) must be on a walkable tile.`);
        }
        requireString(name, item?.item, 'groundItems[].item');
        if (typeof item?.item === 'string') referencedItemIds.add(item.item);
        if (item?.count !== undefined) {
          requireNumber(name, item.count, 'groundItems[].count');
          if (typeof item.count === 'number' && item.count <= 0) {
            errors.push(`${name}: groundItems[].count must be greater than zero.`);
          }
        }
        if (item?.pickupPolicy !== undefined && !GROUND_ITEM_PICKUP_POLICIES.has(item.pickupPolicy)) {
          errors.push(`${name}: groundItems[].pickupPolicy must be one of ${[...GROUND_ITEM_PICKUP_POLICIES].join(', ')}.`);
        }
      }
    }
  }

  // Every non-walkable legend block must be a renderable kind in the catalog.
  for (const [tileChar, def] of Object.entries(data.legend ?? {})) {
    if (def && def.walkable === false && !getSprite(def.kind)) {
      errors.push(`${name}: legend "${tileChar}" kind "${def.kind}" is not a renderable block in the sprite catalog.`);
    }
  }

  validateTalkableNpcReachability(name, data, npcs, objects);

  if (data.id === MAIN_LEVEL_ID) validateAshChapelMain(name, data, enemies, objects);
  if (data.id === CELLAR_LEVEL_ID) validateAshChapelCellar(name, data, objects);
}

function validateTalkableNpcReachability(name, data, npcs, objects) {
  const player = data.spawns?.player;
  if (!player || !inBounds(data, player)) return;
  if (!Array.isArray(data.tiles) || !data.legend) return;

  const talkableNpcs = npcs.filter((npc) => typeof npc.dialogue === 'string' && inBounds(data, npc));
  if (talkableNpcs.length === 0) return;

  const grid = new Grid(data);
  for (const object of objects) {
    if (object.blocking && inBounds(data, object)) {
      grid.addBlocked(object.x, object.y);
    }
  }

  for (const target of talkableNpcs) {
    const actorId = target.actor ?? target.id ?? 'unknown';
    if (!grid.isWalkable(target.x, target.y)) {
      errors.push(`${name}: talkable npc "${actorId}" at (${target.x}, ${target.y}) must stand on a walkable cell.`);
      continue;
    }

    const occupied = new Set();
    for (const blocker of npcs) {
      if (!inBounds(data, blocker)) continue;
      if (!conditionsCanCoexist(target.conditions, blocker.conditions)) continue;
      occupied.add(cellKey(blocker.x, blocker.y));
    }

    const path = findPathToAdjacent(grid, player, target, occupied);
    if (path === null) {
      errors.push(`${name}: talkable npc "${actorId}" at (${target.x}, ${target.y}) has no reachable adjacent talk tile from player start.`);
    }
  }
}

function conditionsCanCoexist(a, b) {
  const aRequired = conditionRequiredFlags(a);
  const bRequired = conditionRequiredFlags(b);
  const aAbsent = conditionAbsentFlags(a);
  const bAbsent = conditionAbsentFlags(b);

  for (const flag of aRequired) {
    if (bAbsent.has(flag)) return false;
  }
  for (const flag of bRequired) {
    if (aAbsent.has(flag)) return false;
  }

  const aQuestStages = a?.questStages ?? {};
  const bQuestStages = b?.questStages ?? {};
  for (const [questId, stage] of Object.entries(aQuestStages)) {
    if (Object.hasOwn(bQuestStages, questId) && bQuestStages[questId] !== stage) return false;
  }
  return true;
}

function conditionRequiredFlags(conditions) {
  return new Set(flagValues(conditions?.flag).concat(flagValues(conditions?.flags)));
}

function conditionAbsentFlags(conditions) {
  return new Set(flagValues(conditions?.notFlag).concat(flagValues(conditions?.flagsAbsent)));
}

function flagValues(value) {
  return [].concat(value ?? []).filter((flag) => typeof flag === 'string');
}

function cellKey(x, y) {
  return `${x},${y}`;
}

function validateAshChapelMain(name, data, enemies, objects) {
  const enemyIds = enemies.map((spawn) => spawn.id);
  if (enemies.length < 6) {
    errors.push(`${name}: expected at least 6 spread enemies, found ${enemies.length}.`);
  }
  for (const id of REQUIRED_MAIN_ENEMY_IDS) {
    if (!enemyIds.includes(id)) {
      errors.push(`${name}: required enemy "${id}" is missing from spawns.`);
    }
  }

  const encounterIds = new Set(enemies.map((spawn) => spawn.encounter).filter(Boolean));
  if (encounterIds.size < 3) {
    errors.push(`${name}: expected at least 3 enemy encounter groups, found ${encounterIds.size}.`);
  }
  for (const spawn of enemies) {
    if (!spawn.encounter) {
      errors.push(`${name}: enemy "${spawn.id}" must define an encounter id.`);
    }
  }

  if (!Array.isArray(data.combatTriggers) || data.combatTriggers.length < 3) {
    errors.push(`${name}: combatTriggers must define at least 3 spread trigger zones.`);
  } else {
    for (const trigger of data.combatTriggers) {
      if (!trigger.encounter) errors.push(`${name}: combat trigger at (${trigger.x}, ${trigger.y}) must define encounter.`);
      if (!Array.isArray(trigger.intro) || trigger.intro.length === 0) {
        errors.push(`${name}: combat trigger "${trigger.id ?? trigger.encounter}" must define intro lines.`);
      }
    }
  }

  const requiredMainDialogue = [
    'ash-chapel-altar-rite',
    'ash-chapel-barrel-ladder',
    'ash-chapel-cult-ledger'
  ];
  for (const id of requiredMainDialogue) {
    if (!Array.isArray(data.dialogue) || !data.dialogue.includes(id)) {
      errors.push(`${name}: required main dialogue "${id}" is missing from dialogue.`);
    }
  }

  const kinds = objects.map((object) => object.kind);
  for (const kind of REQUIRED_INTERACTABLE_KINDS) {
    if (!kinds.includes(kind)) {
      errors.push(`${name}: required interactable "${kind}" is missing.`);
    }
  }
  for (const object of objects) {
    if (object.kind !== 'rusted-barrel' && REQUIRED_INTERACTABLE_KINDS.includes(object.kind) && !object.interact) {
      errors.push(`${name}: "${object.kind}" must define an interact descriptor.`);
    }
  }

  const pews = kinds.filter((kind) => kind === 'broken-pew').length;
  if (pews < 10) {
    errors.push(`${name}: expected at least 10 broken pews, found ${pews}.`);
  }

  const decals = kinds.filter((kind) => DECAL_KINDS.has(kind)).length;
  if (decals < 12) {
    errors.push(`${name}: expected at least 12 rubble/decal objects, found ${decals}.`);
  }

  const hasCampfire = objects.some((object) => object.kind === 'campfire');
  if (!hasCampfire) {
    errors.push(`${name}: expected a campfire prop for the cultist camp.`);
  }

  const hasAmbient = enemies.some((spawn) => Array.isArray(spawn.ambient) && spawn.ambient.length > 0);
  if (!hasAmbient) {
    errors.push(`${name}: expected at least one enemy spawn with ambient lines.`);
  }

  const hasSecretEntrance = objects.some((object) =>
    object.kind === 'rusted-barrel' && object.interact?.type === 'secret-entrance' && object.interact?.dialogue
  );
  if (!hasSecretEntrance) {
    errors.push(`${name}: expected a rusted-barrel secret entrance with dialogue.`);
  }

  const hasCultLedger = objects.some((object) =>
    object.kind === 'paper-scraps' && object.name === 'Cult Ledger' && object.interact?.dialogue === 'ash-chapel-cult-ledger'
  );
  if (!hasCultLedger) {
    errors.push(`${name}: expected a Cult Ledger paper-scraps object with dialogue.`);
  }

  if (!Array.isArray(data.combatIntro) || data.combatIntro.length === 0) {
    errors.push(`${name}: combatIntro must contain at least one fallback line.`);
  }
  if (!data.onVictory?.questUpdate) {
    errors.push(`${name}: onVictory.questUpdate is required for this slice.`);
  }
}

function validateAshChapelCellar(name, data, objects) {
  const requiredCellarDialogue = [
    'ash-chapel-cellar-corpse',
    'ash-chapel-cellar-ladder'
  ];
  for (const id of requiredCellarDialogue) {
    if (!Array.isArray(data.dialogue) || !data.dialogue.includes(id)) {
      errors.push(`${name}: required cellar dialogue "${id}" is missing from dialogue.`);
    }
  }

  const hasSecretExit = objects.some((object) =>
    object.kind === 'rusted-barrel' && object.interact?.type === 'secret-exit' && object.interact?.dialogue
  );
  if (!hasSecretExit) {
    errors.push(`${name}: expected a secret-exit ladder with dialogue.`);
  }

  const hasSecretCorpseLoot = objects.some((object) =>
    object.kind === 'corpse' && object.name === 'Dead Road Warden' && Array.isArray(object.interact?.loot)
  );
  if (!hasSecretCorpseLoot) {
    errors.push(`${name}: expected the secret area Dead Road Warden corpse to contain loot.`);
  }

  const lootEntries = objects.flatMap((object) => object.interact?.loot ?? []);
  if (lootEntries.length < 6) {
    errors.push(`${name}: expected richer secret-area loot, found ${lootEntries.length} loot entries.`);
  }
}

function validateActor(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.type, 'type');
  if (typeof data.id === 'string') seenActorIds.add(data.id);
  validateStats(name, data.stats);
  validateActorInventory(name, data.inventory);
}

function validateEnemy(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.type, 'type');
  requireString(name, data.faction, 'faction');
  validateStats(name, data.stats);

  if (data.faction === 'the-host') {
    const tags = Array.isArray(data.tags) ? data.tags : [];
    if (!tags.includes('host') || !tags.includes('vale-imprint')) {
      errors.push(`${name}: Host enemies must include tags "host" and "vale-imprint".`);
    }
  }
}

function validateItem(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.type, 'type');
  requireNumber(name, data.weight, 'weight');
  requireString(name, data.groundModel, 'groundModel');
  if (typeof data.groundModel === 'string' && !ITEM_GROUND_MODELS.has(data.groundModel)) {
    errors.push(`${name}: groundModel must be one of ${[...ITEM_GROUND_MODELS].join(', ')}.`);
  }
  if (typeof data.weight === 'number' && data.weight < 0) {
    errors.push(`${name}: weight must be zero or greater.`);
  }
  if (data.equipment !== undefined) {
    if (!data.equipment || typeof data.equipment !== 'object') {
      errors.push(`${name}: equipment must be an object.`);
    } else if (!ITEM_EQUIPMENT_SLOTS.has(data.equipment.slot)) {
      errors.push(`${name}: equipment.slot must be one of ${[...ITEM_EQUIPMENT_SLOTS].join(', ')}.`);
    }
  }
  if (typeof data.id === 'string') seenItemIds.add(data.id);
}

function validateActorInventory(name, inventory) {
  if (inventory === undefined) return;
  if (!inventory || typeof inventory !== 'object') {
    errors.push(`${name}: inventory must be an object.`);
    return;
  }

  if (inventory.maxCarryWeight !== undefined) {
    requireNumber(name, inventory.maxCarryWeight, 'inventory.maxCarryWeight');
    if (typeof inventory.maxCarryWeight === 'number' && inventory.maxCarryWeight < 0) {
      errors.push(`${name}: inventory.maxCarryWeight must be zero or greater.`);
    }
  }

  if (inventory.items !== undefined) {
    if (!Array.isArray(inventory.items)) {
      errors.push(`${name}: inventory.items must be an array.`);
    } else {
      validateLoot(name, inventory.items, 'inventory.items');
    }
  }

  if (inventory.equipment !== undefined) {
    if (!inventory.equipment || typeof inventory.equipment !== 'object' || Array.isArray(inventory.equipment)) {
      errors.push(`${name}: inventory.equipment must be an object.`);
    } else {
      for (const [slot, itemId] of Object.entries(inventory.equipment)) {
        if (!ACTOR_EQUIPMENT_SLOTS.has(slot)) {
          errors.push(`${name}: inventory.equipment slot "${slot}" is not valid.`);
        }
        requireString(name, itemId, `inventory.equipment.${slot}`);
        if (typeof itemId === 'string') referencedItemIds.add(itemId);
      }
    }
  }
}

function validateLoot(name, loot, fieldName = 'loot') {
  if (loot === undefined) return;
  if (!Array.isArray(loot)) {
    errors.push(`${name}: ${fieldName} must be an array.`);
    return;
  }
  for (const entry of loot) {
    requireString(name, entry?.item, `${fieldName}[].item`);
    if (typeof entry?.item === 'string') referencedItemIds.add(entry.item);
    if (entry?.count !== undefined) {
      requireNumber(name, entry.count, `${fieldName}[].count`);
      if (typeof entry.count === 'number' && entry.count <= 0) {
        errors.push(`${name}: ${fieldName}[].count must be greater than zero.`);
      }
    }
  }
}

function validateDialogueReference(name, id, fieldName) {
  if (id === undefined) return;
  requireString(name, id, fieldName);
  if (typeof id === 'string') referencedDialogueIds.add(id);
}

function validateQuest(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.title, 'title');
  requireString(name, data.initialStage, 'initialStage');
  if (typeof data.id === 'string') seenQuestIds.add(data.id);
  if (!Array.isArray(data.stages) || data.stages.length === 0) {
    errors.push(`${name}: stages must be a non-empty array.`);
    return;
  }
  let hasInitial = false;
  for (const stage of data.stages) {
    requireString(name, stage.id, 'stages[].id');
    requireString(name, stage.description, 'stages[].description');
    if (stage.id === data.initialStage) hasInitial = true;
  }
  if (!hasInitial) {
    errors.push(`${name}: initialStage "${data.initialStage}" is not listed in stages.`);
  }
}

function validateDialogue(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.title, 'title');
  if (typeof data.id === 'string') seenDialogueIds.add(data.id);
  if (!data.nodes || typeof data.nodes !== 'object') {
    errors.push(`${name}: nodes must be an object.`);
    return;
  }
  if (!data.nodes.start) {
    errors.push(`${name}: nodes.start is required.`);
  }
  for (const [nodeId, node] of Object.entries(data.nodes)) {
    if (!Array.isArray(node.lines) || node.lines.length === 0) {
      errors.push(`${name}: node "${nodeId}" must define a non-empty lines array.`);
    } else {
      for (const line of node.lines) requireString(name, line, `nodes.${nodeId}.lines[]`);
    }
    if (node.choices !== undefined) {
      if (!Array.isArray(node.choices) || node.choices.length === 0 || node.choices.length > 5) {
        errors.push(`${name}: node "${nodeId}" choices must contain 1 to 5 choices.`);
      } else {
        for (const choice of node.choices) {
          requireString(name, choice.label, `nodes.${nodeId}.choices[].label`);
          validateDialogueEffects(name, choice.effects, `nodes.${nodeId}.choices[].effects`);
        }
      }
    }
  }
}

function validateDialogueEffects(name, effects, fieldName) {
  if (effects === undefined) return;
  if (!effects || typeof effects !== 'object' || Array.isArray(effects)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }

  validateInventoryEffects(name, effects.inventory, `${fieldName}.inventory`);

  const startCombat = effects.startCombat;
  if (startCombat === undefined) return;
  if (typeof startCombat === 'string') return;
  if (startCombat && typeof startCombat === 'object' && !Array.isArray(startCombat)) {
    requireString(name, startCombat.encounter, `${fieldName}.startCombat.encounter`);
    return;
  }
  errors.push(`${name}: ${fieldName}.startCombat must be an encounter id or object.`);
}

function validateInventoryEffects(name, inventory, fieldName) {
  if (inventory === undefined) return;
  if (!inventory || typeof inventory !== 'object' || Array.isArray(inventory)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }
  for (const key of ['add', 'remove']) {
    if (inventory[key] === undefined) continue;
    if (!Array.isArray(inventory[key])) {
      errors.push(`${name}: ${fieldName}.${key} must be an array.`);
      continue;
    }
    validateLoot(name, inventory[key], `${fieldName}.${key}`);
  }
}

function validateStats(name, stats) {
  if (!stats || typeof stats !== 'object') {
    errors.push(`${name}: missing stats object.`);
    return;
  }

  requireNumber(name, stats.hp, 'stats.hp');
  requireNumber(name, stats.maxHp, 'stats.maxHp');
}

function requireString(fileName, value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${fileName}: ${fieldName} must be a non-empty string.`);
  }
}

function requireNumber(fileName, value, fieldName) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    errors.push(`${fileName}: ${fieldName} must be a number.`);
  }
}

function relative(filePath) {
  return filePath.replace(`${root}/`, '').replace(`${root}\\`, '');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
