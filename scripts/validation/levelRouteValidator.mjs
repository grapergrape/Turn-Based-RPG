import { errors, relative } from './validationContext.mjs';

const levelRecords = new Map();
const routeRecords = [];
const LOAD_LEVEL_KEYS = new Set(['loadLevel', 'thenLoadLevel']);

export function registerLevelRouteContent(filePath, data) {
  const name = normalizedName(filePath);
  levelRecords.set(`./${name}`, { name, data });
  collectRoutes(name, data);
}

export function registerDialogueRouteContent(filePath, data) {
  collectRoutes(normalizedName(filePath), data);
}

export function validateLevelRouteDestinations() {
  for (const route of routeRecords) validateRouteDestination(route);
}

function normalizedName(filePath) {
  return relative(filePath).replaceAll('\\', '/');
}

function collectRoutes(sourceName, value, fieldName = '') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const childName = fieldName ? `${fieldName}.${key}` : key;
    if (LOAD_LEVEL_KEYS.has(key) && child && typeof child === 'object' && !Array.isArray(child)) {
      routeRecords.push({ sourceName, fieldName: childName, loadLevel: child });
    }
    collectRoutes(sourceName, child, childName);
  }
}

function validateRouteDestination(route) {
  const { sourceName, fieldName, loadLevel } = route;
  if (typeof loadLevel.path !== 'string' || loadLevel.path.length === 0) return;

  const target = levelRecords.get(loadLevel.path);
  if (!target) {
    errors.push(`${sourceName}: ${fieldName}.path references missing level "${loadLevel.path}".`);
    return;
  }

  const player = loadLevel.player;
  if (!player || !Number.isInteger(player.x) || !Number.isInteger(player.y)) return;

  const tile = target.data.tiles?.[player.y]?.[player.x];
  const tileDefinition = target.data.legend?.[tile];
  if (!tileDefinition?.walkable) {
    errors.push(
      `${sourceName}: ${fieldName}.player (${player.x}, ${player.y}) must arrive on a walkable tile in ${target.name}.`
    );
    return;
  }

  const blocker = (target.data.objects ?? []).find((object) =>
    object?.blocking === true && object.x === player.x && object.y === player.y
  );
  if (blocker) {
    errors.push(
      `${sourceName}: ${fieldName}.player (${player.x}, ${player.y}) overlaps blocking object "${blocker.id ?? blocker.kind}" in ${target.name}.`
    );
  }

  const occupant = [
    ...(target.data.spawns?.npcs ?? []),
    ...(target.data.spawns?.enemies ?? [])
  ].find((spawn) => spawn?.x === player.x && spawn.y === player.y);
  if (occupant) {
    errors.push(
      `${sourceName}: ${fieldName}.player (${player.x}, ${player.y}) overlaps actor "${occupant.spawnId ?? occupant.actor ?? occupant.id}" in ${target.name}.`
    );
  }
}
