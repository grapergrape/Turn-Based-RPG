export const PRIMARY_ATTRIBUTES = Object.freeze([
  { id: 'body', label: 'Body' },
  { id: 'agility', label: 'Agility' },
  { id: 'eye', label: 'Eye' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'religion', label: 'Religion' },
  { id: 'voice', label: 'Voice' },
  { id: 'nerve', label: 'Nerve' }
]);

export const FIELD_RATINGS = Object.freeze([
  { id: 'unarmed', label: 'Unarmed', primaries: ['body', 'agility', 'nerve'] },
  { id: 'melee', label: 'Melee', primaries: ['body', 'agility', 'eye'] },
  { id: 'firearms', label: 'Firearms', primaries: ['eye', 'agility', 'nerve'] },
  { id: 'arcWeapons', label: 'Arc Weapons', primaries: ['intelligence', 'eye', 'religion'] },
  { id: 'heavyWeapons', label: 'Heavy Weapons', primaries: ['body', 'eye', 'nerve'] },
  { id: 'purgationTools', label: 'Purgation Tools', primaries: ['religion', 'body', 'nerve'] },
  { id: 'engineering', label: 'Engineering', primaries: ['intelligence', 'agility', 'body'] },
  { id: 'stealth', label: 'Stealth', primaries: ['agility', 'eye', 'nerve'] },
  { id: 'security', label: 'Security', primaries: ['agility', 'intelligence', 'eye'] },
  { id: 'search', label: 'Search', primaries: ['eye', 'intelligence', 'body'] },
  { id: 'medicine', label: 'Medicine', primaries: ['intelligence', 'body', 'nerve'] },
  { id: 'doctrine', label: 'Doctrine', primaries: ['religion', 'intelligence', 'voice'] },
  { id: 'hostSigns', label: 'Host Signs', primaries: ['eye', 'religion', 'nerve'] },
  { id: 'containment', label: 'Containment', primaries: ['intelligence', 'religion', 'body'] },
  { id: 'speech', label: 'Speech', primaries: ['voice', 'eye', 'intelligence'] },
  { id: 'command', label: 'Command', primaries: ['voice', 'religion', 'nerve'] },
  { id: 'guile', label: 'Guile', primaries: ['voice', 'agility', 'religion'] }
]);

export const TRACE_STAGES = Object.freeze([
  { value: 0, label: 'Clean' },
  { value: 1, label: 'Marked' },
  { value: 2, label: 'Whispering' },
  { value: 3, label: 'Confessing' },
  { value: 4, label: 'Icon Risk' },
  { value: 5, label: 'Blooming' }
]);

export const LEVEL_CAP = 20;
export const PRIMARY_POINTS_PER_LEVEL = 1;

export const ENEMY_COMPLEXITIES = Object.freeze([
  { id: 'minion', label: 'Minion', multiplier: 0.6 },
  { id: 'standard', label: 'Standard', multiplier: 1 },
  { id: 'hardened', label: 'Hardened', multiplier: 1.35 },
  { id: 'elite', label: 'Elite', multiplier: 2 },
  { id: 'boss', label: 'Boss', multiplier: 4 }
]);

export const BUILD_PROFILES = Object.freeze([
  {
    id: 'field-agent',
    label: 'Field Agent',
    primaryGrowth: ['nerve', 'eye', 'agility', 'body', 'religion', 'intelligence', 'voice'],
    hpPerLevel: 1,
    apEvery: 5
  },
  {
    id: 'gunhand',
    label: 'Gunhand',
    primaryGrowth: ['eye', 'nerve', 'agility', 'body', 'intelligence', 'voice', 'religion'],
    hpPerLevel: 1,
    apEvery: 5
  },
  {
    id: 'purifier',
    label: 'Purifier',
    primaryGrowth: ['religion', 'nerve', 'body', 'eye', 'intelligence', 'agility', 'voice'],
    hpPerLevel: 2,
    apEvery: 6
  },
  {
    id: 'engineer',
    label: 'Engineer',
    primaryGrowth: ['intelligence', 'agility', 'eye', 'body', 'nerve', 'religion', 'voice'],
    hpPerLevel: 1,
    apEvery: 4
  },
  {
    id: 'investigator',
    label: 'Investigator',
    primaryGrowth: ['eye', 'intelligence', 'nerve', 'religion', 'agility', 'voice', 'body'],
    hpPerLevel: 1,
    apEvery: 5
  },
  {
    id: 'field-confessor',
    label: 'Field Confessor',
    primaryGrowth: ['voice', 'religion', 'nerve', 'eye', 'intelligence', 'body', 'agility'],
    hpPerLevel: 1,
    apEvery: 5
  },
  {
    id: 'road-ghost',
    label: 'Road Ghost',
    primaryGrowth: ['agility', 'eye', 'nerve', 'voice', 'intelligence', 'body', 'religion'],
    hpPerLevel: 1,
    apEvery: 4
  },
  {
    id: 'plague-surgeon',
    label: 'Plague Surgeon',
    primaryGrowth: ['intelligence', 'nerve', 'body', 'eye', 'religion', 'voice', 'agility'],
    hpPerLevel: 2,
    apEvery: 6
  },
  {
    id: 'breaker',
    label: 'Breaker',
    primaryGrowth: ['body', 'nerve', 'agility', 'eye', 'voice', 'religion', 'intelligence'],
    hpPerLevel: 2,
    apEvery: 6
  },
  {
    id: 'host-threat',
    label: 'Host Threat',
    primaryGrowth: ['body', 'nerve', 'religion', 'eye', 'agility', 'intelligence', 'voice'],
    hpPerLevel: 2,
    apEvery: 7
  }
]);

const DEFAULT_PRIMARY = 3;
const PRIMARY_MAX = 10;
const FIELD_MAX = 100;

const ICON_RISK_LABELS = Object.freeze({
  'not-assessed': 'Not Assessed',
  'penitent-bastion': 'Penitent Pressure',
  'false-saint': 'False Saint Pressure',
  'madonna-of-ash': 'Madonna Pressure',
  'scholastic-heretic': 'Scholastic Pressure'
});

export function normalizeProgression(progression = {}) {
  const build = buildProfile(progression?.build);
  const baseLevel = clampLevel(progression?.level);
  const xp = clampWholeNumber(progression?.xp, xpForLevel(baseLevel));
  const level = Math.max(baseLevel, levelFromXp(xp));
  const primaryBonuses = normalizePrimaryBonuses(progression?.primaryBonuses);
  const buildBonuses = buildPrimaryBonuses(build, level);
  const primaries = {};
  const basePrimaries = {};
  const sourcePrimaries = progression?.basePrimaries ?? progression?.primaries ?? {};
  for (const primary of PRIMARY_ATTRIBUTES) {
    basePrimaries[primary.id] = clampPrimary(sourcePrimaries[primary.id]);
    primaries[primary.id] = clampPrimary(
      basePrimaries[primary.id] + (primaryBonuses[primary.id] ?? 0) + (buildBonuses[primary.id] ?? 0)
    );
  }

  return {
    level,
    xp,
    build,
    primaryPoints: clampWholeNumber(progression?.primaryPoints, 0),
    primaryBonuses,
    basePrimaries,
    primaries,
    scars: normalizeScars(progression?.scars),
    trace: clampTrace(progression?.trace),
    iconRisk: typeof progression?.iconRisk === 'string' ? progression.iconRisk : 'not-assessed',
    scarPoints: clampWholeNumber(progression?.scarPoints, 0),
    fieldModifiers: normalizeModifiers(progression?.fieldModifiers),
    xpReward: progression?.xpReward === undefined ? null : clampWholeNumber(progression.xpReward, 0),
    complexity: enemyComplexity(progression?.complexity)
  };
}

export function calculateFieldRating(progression, field) {
  const sheet = progression?.primaries ? progression : normalizeProgression(progression);
  const weighted = field.primaries
    .map((id, index) => ({ id, index, value: sheet.primaries[id] ?? DEFAULT_PRIMARY }))
    .sort((a, b) => (b.value - a.value) || (a.index - b.index));
  const primaryTotal = (weighted[0].value * 4) + (weighted[1].value * 3) + (weighted[2].value * 2);
  const modifierTotal = modifierForField(sheet, field.id);
  return clampFieldRating(primaryTotal + modifierTotal);
}

export function buildCharacterSheet(actor = {}) {
  const progression = normalizeProgression(actor.progression);
  const xp = experienceProgress(progression);
  const fields = FIELD_RATINGS.map((field) => ({
    ...field,
    sourceLabels: field.primaries.map(primaryLabel),
    value: calculateFieldRating(progression, field)
  }));
  const topFields = [...fields]
    .sort((a, b) => (b.value - a.value) || a.label.localeCompare(b.label))
    .slice(0, 6);
  const traceStage = TRACE_STAGES.find((stage) => stage.value === progression.trace) ?? TRACE_STAGES[0];

  return {
    name: actor.name ?? 'Unknown Agent',
    role: actor.role ?? 'Ashen Censure',
    level: progression.level,
    xp,
    build: progression.build,
    primaryPoints: progression.primaryPoints,
    primaries: PRIMARY_ATTRIBUTES.map((primary) => ({
      ...primary,
      value: progression.primaries[primary.id]
    })),
    fields,
    topFields,
    scars: progression.scars,
    scarPoints: progression.scarPoints,
    trace: traceStage,
    iconRisk: {
      id: progression.iconRisk,
      label: iconRiskLabel(progression)
    }
  };
}

export function xpForLevel(level) {
  const clamped = clampLevel(level);
  if (clamped <= 1) return 0;
  return 50 * (clamped - 1) * clamped;
}

export function levelFromXp(xp) {
  const value = clampWholeNumber(xp, 0);
  let level = 1;
  while (level < LEVEL_CAP && value >= xpForLevel(level + 1)) level += 1;
  return level;
}

export function experienceProgress(progression = {}) {
  const sheet = isNormalizedProgression(progression) ? progression : normalizeProgression(progression);
  const levelStart = xpForLevel(sheet.level);
  if (sheet.level >= LEVEL_CAP) {
    return {
      current: sheet.xp,
      levelStart,
      nextLevelXp: null,
      intoLevel: 0,
      needed: 0,
      progress: 1,
      atCap: true
    };
  }
  const nextLevelXp = xpForLevel(sheet.level + 1);
  const intoLevel = Math.max(0, sheet.xp - levelStart);
  const needed = Math.max(1, nextLevelXp - levelStart);
  return {
    current: sheet.xp,
    levelStart,
    nextLevelXp,
    intoLevel,
    needed,
    progress: Math.max(0, Math.min(1, intoLevel / needed)),
    atCap: false
  };
}

export function grantExperience(progression, amount) {
  const base = progression && typeof progression === 'object' && !Array.isArray(progression)
    ? JSON.parse(JSON.stringify(progression))
    : {};
  const before = normalizeProgression(base);
  const gained = clampWholeNumber(amount, 0);
  if (gained <= 0) return base;
  base.xp = Math.max(0, before.xp + gained);
  const nextLevel = levelFromXp(base.xp);
  const levelDelta = Math.max(0, nextLevel - before.level);
  base.level = Math.max(before.level, nextLevel);
  base.primaryPoints = before.primaryPoints + (levelDelta * PRIMARY_POINTS_PER_LEVEL);
  return base;
}

export function awardExperience(actor, amount) {
  if (!actor) return { amount: 0, beforeLevel: 1, level: 1, levelDelta: 0 };
  const before = normalizeProgression(actor.progression);
  actor.progression = grantExperience(actor.progression, amount);
  const after = normalizeProgression(actor.progression);
  if (typeof actor.refreshProgressionStats === 'function') actor.refreshProgressionStats();
  return {
    amount: clampWholeNumber(amount, 0),
    beforeLevel: before.level,
    level: after.level,
    levelDelta: Math.max(0, after.level - before.level),
    primaryPoints: after.primaryPoints
  };
}

export function experienceRewardForActor(actor = {}) {
  const progression = normalizeProgression(actor.progression);
  if (progression.xpReward !== null) return progression.xpReward;
  if (actor.type !== 'enemy') return 0;
  const complexity = enemyComplexity(actor.progression?.complexity ?? actor.complexity ?? complexityFromTags(actor.tags));
  const baseReward = 15 + progression.level * 15;
  return roundToStep(baseReward * complexity.multiplier, 5);
}

export function experienceRewardForEncounter(enemies = []) {
  return enemies.reduce((sum, enemy) => sum + experienceRewardForActor(enemy), 0);
}

export function questStageExperience(quest, stageId) {
  const stage = quest?.stages?.find((entry) => entry.id === stageId);
  return clampWholeNumber(stage?.xp ?? stage?.reward?.xp, 0);
}

export function questStageExperienceKey(questId, stageId) {
  return `${questId}:${stageId}`;
}

export function scaleStatsForProgression(stats = {}, progression = {}) {
  const sheet = normalizeProgression(progression);
  const profile = sheet.build;
  const levelSteps = Math.max(0, sheet.level - 1);
  const baseMaxHp = clampWholeNumber(stats.maxHp ?? stats.hp, 1);
  const baseHp = clampOptionalWholeNumber(stats.hp, baseMaxHp, 0, baseMaxHp);
  const hpBonus = levelSteps * profile.hpPerLevel;
  const apBase = clampWholeNumber(stats.actionPoints ?? stats.ap, 0);
  const apBonus = profile.apEvery > 0 ? Math.floor(levelSteps / profile.apEvery) : 0;

  return {
    ...stats,
    maxHp: baseMaxHp + hpBonus,
    hp: Math.min(baseMaxHp + hpBonus, baseHp + hpBonus),
    actionPoints: apBase + apBonus,
    moveCost: stats.moveCost ?? 1
  };
}

export function buildProfile(buildId) {
  const id = typeof buildId === 'string' ? buildId : buildId?.id;
  return BUILD_PROFILES.find((profile) => profile.id === id) ?? BUILD_PROFILES[0];
}

export function enemyComplexity(complexityId) {
  const id = typeof complexityId === 'string' ? complexityId : complexityId?.id;
  return ENEMY_COMPLEXITIES.find((profile) => profile.id === id) ?? ENEMY_COMPLEXITIES[1];
}

function normalizeScars(scars) {
  if (!Array.isArray(scars)) return [];
  return scars.map((scar) => ({
    id: typeof scar?.id === 'string' ? scar.id : 'unknown-scar',
    name: typeof scar?.name === 'string' ? scar.name : 'Unknown Scar',
    rank: clampWholeNumber(scar?.rank, 1, 5),
    branch: typeof scar?.branch === 'string' ? scar.branch : null,
    tags: Array.isArray(scar?.tags) ? scar.tags.filter((tag) => typeof tag === 'string') : [],
    modifiers: normalizeModifiers(scar?.modifiers),
    summary: typeof scar?.summary === 'string' ? scar.summary : '',
    cost: typeof scar?.cost === 'string' ? scar.cost : ''
  }));
}

function normalizeModifiers(modifiers) {
  if (!modifiers || typeof modifiers !== 'object' || Array.isArray(modifiers)) return {};
  const out = {};
  for (const [key, value] of Object.entries(modifiers)) {
    if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
  }
  return out;
}

function normalizePrimaryBonuses(bonuses) {
  if (!bonuses || typeof bonuses !== 'object' || Array.isArray(bonuses)) return {};
  const out = {};
  for (const primary of PRIMARY_ATTRIBUTES) {
    const value = bonuses[primary.id];
    if (typeof value === 'number' && Number.isFinite(value)) out[primary.id] = Math.round(value);
  }
  return out;
}

function buildPrimaryBonuses(build, level) {
  const out = {};
  const steps = Math.floor(Math.max(0, level - 1) / 2);
  for (let i = 0; i < steps; i += 1) {
    const primaryId = build.primaryGrowth[i % build.primaryGrowth.length];
    out[primaryId] = (out[primaryId] ?? 0) + 1;
  }
  return out;
}

function isNormalizedProgression(progression) {
  return Boolean(
    progression
    && typeof progression === 'object'
    && typeof progression.level === 'number'
    && typeof progression.xp === 'number'
    && progression.build
    && typeof progression.build === 'object'
    && typeof progression.build.id === 'string'
  );
}

function complexityFromTags(tags = []) {
  const tagSet = new Set(Array.isArray(tags) ? tags : []);
  if (tagSet.has('boss')) return 'boss';
  if (tagSet.has('elite')) return 'elite';
  if (tagSet.has('tank') || tagSet.has('heavy')) return 'hardened';
  if (tagSet.has('minion') || tagSet.has('rat')) return 'minion';
  return 'standard';
}

function modifierForField(progression, fieldId) {
  let total = progression.fieldModifiers[fieldId] ?? 0;
  for (const scar of progression.scars) {
    total += scar.modifiers[fieldId] ?? 0;
  }
  return total;
}

function iconRiskLabel(progression) {
  if (progression.trace < 2) return ICON_RISK_LABELS['not-assessed'];
  if (progression.trace === 2) return 'Pressure Signs';
  return ICON_RISK_LABELS[progression.iconRisk] ?? 'Unclear Pressure';
}

function primaryLabel(primaryId) {
  return PRIMARY_ATTRIBUTES.find((primary) => primary.id === primaryId)?.label ?? primaryId;
}

function clampPrimary(value) {
  return clampWholeNumber(value, DEFAULT_PRIMARY, PRIMARY_MAX);
}

function clampTrace(value) {
  return clampWholeNumber(value, 0, TRACE_STAGES.length - 1);
}

function clampLevel(value) {
  return clampWholeNumber(value, 1, LEVEL_CAP);
}

function clampWholeNumber(value, min, max = Number.POSITIVE_INFINITY) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampOptionalWholeNumber(value, fallback, min, max = Number.POSITIVE_INFINITY) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function roundToStep(value, step) {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return 0;
  return Math.max(0, Math.round(value / step) * step);
}

function clampFieldRating(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(FIELD_MAX, Math.round(value)));
}
