// Parses optional local-dev URL parameters into startup options. This keeps the
// normal game path unchanged while making scene and prop checks easy to reach.

const DEFAULT_LEVEL_PATH = './data/levels/ash_chapel_breach.json';

const LEVEL_ALIASES = {
  chapel: './data/levels/ash_chapel_breach.json',
  breach: './data/levels/ash_chapel_breach.json',
  'ash-chapel-breach': './data/levels/ash_chapel_breach.json',
  ash_chapel_breach: './data/levels/ash_chapel_breach.json',
  basement: './data/levels/ash_chapel_cellar.json',
  cellar: './data/levels/ash_chapel_cellar.json',
  'ash-chapel-basement': './data/levels/ash_chapel_cellar.json',
  'ash-chapel-cellar': './data/levels/ash_chapel_cellar.json',
  ash_chapel_cellar: './data/levels/ash_chapel_cellar.json',
  catacombs: './data/levels/ash_chapel_catacombs.json',
  'ash-chapel-catacombs': './data/levels/ash_chapel_catacombs.json',
  'ash-chapel-hidden-catacombs': './data/levels/ash_chapel_catacombs.json',
  ash_chapel_catacombs: './data/levels/ash_chapel_catacombs.json',
  road: './data/levels/long_ash_road_approach.json',
  'long-ash-road': './data/levels/long_ash_road_approach.json',
  'long-ash-road-approach': './data/levels/long_ash_road_approach.json'
};

const TRUE_VALUES = new Set(['', '1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

function firstParam(params, names) {
  for (const name of names) {
    if (params.has(name)) return params.get(name);
  }
  return null;
}

function readFlag(params, names, fallback = null) {
  const value = firstParam(params, names);
  if (value === null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return fallback;
}

function readInt(params, names) {
  const value = firstParam(params, names);
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readPoint(params) {
  const packed = firstParam(params, ['pos', 'player']);
  if (packed) {
    const [x, y] = packed.split(/[,:]/).map((part) => Number.parseInt(part.trim(), 10));
    if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  }

  const x = readInt(params, ['x', 'px']);
  const y = readInt(params, ['y', 'py']);
  return x === null || y === null ? null : { x, y };
}

function resolveLevelPath(value) {
  if (!value) return DEFAULT_LEVEL_PATH;
  const raw = String(value).trim().replaceAll('\\', '/');
  const alias = raw.toLowerCase().replaceAll(' ', '-');
  if (LEVEL_ALIASES[alias]) return LEVEL_ALIASES[alias];
  if (raw.endsWith('.json')) {
    if (raw.startsWith('./') || raw.startsWith('../')) return raw;
    if (raw.startsWith('/')) return `.${raw}`;
    return `./${raw}`;
  }
  if (raw.includes('/')) return raw.startsWith('.') ? raw : `./${raw}`;
  return `./data/levels/${raw}.json`;
}

export function resolveDevStart(location) {
  const url = new URL(location.href);
  const params = url.searchParams;
  const levelValue = firstParam(params, ['level', 'area', 'dev']);
  const player = readPoint(params);
  const debugGrid = readFlag(params, ['grid', 'debugGrid']);
  const enemies = readFlag(params, ['enemies']);
  const noCombat = readFlag(params, ['noCombat', 'peaceful', 'noEnemies'], false) || enemies === false;
  const skipIntroParam = readFlag(params, ['skipIntro', 'skipWrit']);
  const intro = readFlag(params, ['intro']);
  const enabled = Boolean(levelValue || player || debugGrid !== null || noCombat || skipIntroParam !== null || intro !== null);
  const skipIntro = skipIntroParam ?? (intro === null ? enabled : !intro);

  const bootOptions = {};
  if (player) bootOptions.player = player;
  if (noCombat) bootOptions.noCombat = true;
  if (skipIntro) bootOptions.skipIntro = true;

  return {
    enabled,
    levelPath: resolveLevelPath(levelValue),
    debugGrid,
    bootOptions
  };
}
