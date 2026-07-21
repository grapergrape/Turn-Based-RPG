import { FIELD_RATINGS, calculateFieldRating, normalizeProgression } from '../core/Progression.js';
import { createActor } from '../entities/ActorFactory.js';

export const DRONE_DEFINITION_ID = 'utility-drone-mark-i';
export const DRONE_SERVICE_ITEM_ID = 'drone-service-parts';
export const DRONE_NAME_MAX = 12;
export const DRONE_REBOOT_RATIO = 0.35;
export const DRONE_REGISTRATION_FLAGS = Object.freeze([
  'agent-of-censure-identified',
  'censure-attendant-registered'
]);

const COSMETIC_BRANCH_SPRITES = Object.freeze({
  core: 'utility-drone-mark-i-core',
  energy: 'utility-drone-mark-i-energy',
  bulwark: 'utility-drone-mark-i-bulwark',
  medical: 'utility-drone-mark-i-medical',
  veil: 'utility-drone-mark-i-veil',
  fieldworks: 'utility-drone-mark-i-fieldworks'
});

export function createCompanionRunState() {
  return {
    definitionId: DRONE_DEFINITION_ID,
    recruited: false,
    name: '',
    hp: null,
    disabled: false,
    upgrades: [],
    upgradeOrder: [],
    vanishingSpentEncounters: [],
    upgradePoints: 0,
    rewardedLevel: 0,
    ritual: {
      opened: false,
      failedModels: [],
      completed: false
    }
  };
}

export function normalizeCompanionRunState(value = null) {
  const base = createCompanionRunState();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return base;
  const upgrades = uniqueStrings(value.upgrades);
  const upgradeOrder = uniqueStrings(value.upgradeOrder).filter((id) => upgrades.includes(id));
  const vanishingSpentEncounters = uniqueStrings(value.vanishingSpentEncounters);
  for (const id of upgrades) if (!upgradeOrder.includes(id)) upgradeOrder.push(id);
  return {
    ...base,
    ...value,
    definitionId: typeof value.definitionId === 'string' ? value.definitionId : base.definitionId,
    recruited: Boolean(value.recruited),
    name: normalizeDroneName(value.name).name,
    hp: Number.isFinite(value.hp) ? Math.max(0, Math.round(value.hp)) : null,
    disabled: Boolean(value.disabled),
    upgrades,
    upgradeOrder,
    vanishingSpentEncounters,
    upgradePoints: nonNegativeWhole(value.upgradePoints),
    rewardedLevel: nonNegativeWhole(value.rewardedLevel),
    ritual: {
      opened: Boolean(value.ritual?.opened),
      failedModels: uniqueStrings(value.ritual?.failedModels),
      completed: Boolean(value.ritual?.completed)
    }
  };
}

export function normalizeDroneName(value) {
  const raw = String(value ?? '').replace(/[^A-Za-z0-9 ']/g, '').slice(0, DRONE_NAME_MAX);
  const name = raw.trim().replace(/\s+/g, ' ');
  return {
    name,
    valid: name.length >= 1 && name.length <= DRONE_NAME_MAX && /^[A-Za-z0-9][A-Za-z0-9 ']*$/.test(name)
  };
}

export function applyDroneNameInput(current, events = []) {
  let value = String(current ?? '');
  for (const event of events) {
    if (event?.type === 'backspace') value = value.slice(0, -1);
    if (event?.type === 'char' && /^[A-Za-z0-9 ']$/.test(event.value ?? '') && value.length < DRONE_NAME_MAX) {
      value += event.value;
    }
  }
  return value;
}

export function recruitCompanionState(state, definition, playerLevel, name) {
  const next = normalizeCompanionRunState(state);
  const normalizedName = normalizeDroneName(name);
  if (!normalizedName.valid) return { ok: false, state: next, reason: 'Enter a name from 1 to 12 characters.' };
  const level = Math.max(1, nonNegativeWhole(playerLevel) || 1);
  const economy = definition?.upgradeEconomy ?? {};
  const basePoints = nonNegativeWhole(economy.recruitBasePoints ?? 4);
  const perLevel = nonNegativeWhole(economy.pointsPerLevel ?? 2);
  next.recruited = true;
  next.name = normalizedName.name;
  next.hp = baseMaximumHp(definition, next.upgrades);
  next.disabled = false;
  next.upgradePoints = basePoints + perLevel * (level - 1);
  next.rewardedLevel = level;
  next.ritual.opened = true;
  next.ritual.completed = true;
  return { ok: true, state: next };
}

export function awardCompanionLevelPoints(state, definition, playerLevel) {
  const next = normalizeCompanionRunState(state);
  if (!next.recruited) return { state: next, gained: 0 };
  const level = Math.max(1, nonNegativeWhole(playerLevel) || 1);
  const previous = Math.max(1, next.rewardedLevel || level);
  if (level <= previous) return { state: next, gained: 0 };
  const gained = (level - previous) * nonNegativeWhole(definition?.upgradeEconomy?.pointsPerLevel ?? 2);
  next.upgradePoints += gained;
  next.rewardedLevel = level;
  return { state: next, gained };
}

export function createCompanionEntity(definition, state, position, owner) {
  if (!definition || !state?.recruited) return null;
  const actor = createActor({
    ...definition,
    name: state.name || definition.name,
    progression: owner?.progression ? JSON.parse(JSON.stringify(owner.progression)) : null
  }, position);
  actor.definitionId = definition.id;
  actor.ownerId = owner?.id ?? null;
  actor.team = definition.team ?? 'player';
  actor.control = definition.control ?? 'player';
  actor.isCompanion = true;
  actor.communication = definition.communication
    ? JSON.parse(JSON.stringify(definition.communication))
    : null;
  applyCompanionUpgrades(actor, definition, state);
  actor.hp = state.disabled
    ? 0
    : Math.max(1, Math.min(actor.maxHp, Number.isFinite(state.hp) ? state.hp : actor.maxHp));
  actor.isDead = Boolean(state.disabled);
  actor.disabled = Boolean(state.disabled);
  actor.render.state = actor.disabled ? 'dead' : 'idle';
  return actor;
}

export function snapshotCompanionEntity(state, actor) {
  const next = normalizeCompanionRunState(state);
  if (!actor) return next;
  next.name = actor.name || next.name;
  next.hp = Math.max(0, Math.round(actor.hp ?? 0));
  next.disabled = Boolean(actor.disabled || actor.isDead || next.hp <= 0);
  return next;
}

export function rebootCompanion(state, actor = null) {
  const next = normalizeCompanionRunState(state);
  if (!next.recruited) return next;
  const maxHp = actor?.maxHp ?? Math.max(1, next.hp ?? 1);
  const hp = Math.max(1, Math.ceil(maxHp * DRONE_REBOOT_RATIO));
  next.hp = hp;
  next.disabled = false;
  if (actor) {
    actor.hp = hp;
    actor.isDead = false;
    actor.disabled = false;
    actor.render.state = 'idle';
    actor.render.frameIndex = 0;
    actor.render.timer = 0;
  }
  return next;
}

export function companionNodeIndex(definition) {
  const index = new Map();
  for (const branch of definition?.branches ?? []) {
    for (const [nodeIndex, node] of (branch.nodes ?? []).entries()) {
      index.set(node.id, { ...node, branch, nodeIndex });
    }
  }
  return index;
}

export function hasCompanionUpgrade(state, nodeId) {
  return normalizeCompanionRunState(state).upgrades.includes(nodeId);
}

export function companionBranchRating(definition, branchId, player) {
  const branch = (definition?.branches ?? []).find((entry) => entry.id === branchId);
  if (!branch) return Number.NEGATIVE_INFINITY;
  const ratings = (branch.rating?.fields ?? ['engineering']).map((fieldId) => fieldRating(player, fieldId));
  return branch.rating?.mode === 'max' ? Math.max(...ratings) : ratings[0];
}

export function companionNodeState(definition, state, nodeId, player, serviceParts = 0) {
  const normalized = normalizeCompanionRunState(state);
  const entry = companionNodeIndex(definition).get(nodeId);
  if (!entry) return { exists: false, unlocked: false, reason: 'Unknown upgrade.' };
  const pointCost = nodeCost(definition, entry.nodeIndex, 'nodePointCosts');
  const partCost = nodeCost(definition, entry.nodeIndex, 'nodePartCosts');
  const threshold = ratingThreshold(definition, entry.tier);
  const rating = companionBranchRating(definition, entry.branch.id, player);
  const purchased = normalized.upgrades.includes(nodeId);
  const missingRequirements = (entry.requires ?? []).filter((id) => !normalized.upgrades.includes(id));
  let reason = '';
  if (purchased) reason = 'Installed.';
  else if (missingRequirements.length) reason = 'Install the linked upgrades first.';
  else if (rating < threshold) reason = `Requires ${entry.branch.name} rating ${threshold}.`;
  else if (normalized.upgradePoints < pointCost) reason = `Requires ${pointCost} upgrade points.`;
  else if (serviceParts < partCost) reason = `Requires ${partCost} Drone Service Parts.`;
  return {
    exists: true,
    purchased,
    unlocked: !purchased && !reason,
    reason,
    node: entry,
    pointCost,
    partCost,
    threshold,
    rating
  };
}

export function purchaseCompanionUpgrade({ definition, state, nodeId, player, inventory, mode = 'explore' } = {}) {
  const next = normalizeCompanionRunState(state);
  if (!next.recruited) return { ok: false, state: next, reason: 'No attendant is registered.' };
  if (mode === 'combat') return { ok: false, state: next, reason: 'Service work is unavailable during combat.' };
  const serviceItem = definition?.serviceItem ?? DRONE_SERVICE_ITEM_ID;
  const availableParts = inventory?.count?.(serviceItem) ?? 0;
  const status = companionNodeState(definition, next, nodeId, player, availableParts);
  if (!status.unlocked) return { ok: false, state: next, reason: status.reason };
  if (status.partCost > 0 && !inventory?.remove?.(serviceItem, status.partCost)) {
    return { ok: false, state: next, reason: `Requires ${status.partCost} Drone Service Parts.` };
  }
  next.upgradePoints -= status.pointCost;
  next.upgrades.push(nodeId);
  next.upgradeOrder.push(nodeId);
  return { ok: true, state: next, node: status.node, pointCost: status.pointCost, partCost: status.partCost };
}

export function applyCompanionUpgrades(actor, definition, state) {
  if (!actor || !definition) return actor;
  const upgrades = new Set(normalizeCompanionRunState(state).upgrades);
  const previousMax = actor.maxHp ?? definition.stats?.hp ?? 1;
  const ratio = previousMax > 0 ? (actor.hp ?? previousMax) / previousMax : 1;
  actor.maxHp = baseMaximumHp(definition, upgrades);
  actor.maxAp = Math.max(0, Math.round(definition.stats?.actionPoints ?? definition.stats?.ap ?? 0)) +
    (upgrades.has('core-service-cell') ? 1 : 0);
  actor.moveCost = Math.max(0, Math.round(definition.stats?.moveCost ?? 1));
  actor.hp = actor.isDead ? 0 : Math.max(1, Math.min(actor.maxHp, Math.round(actor.maxHp * ratio)));
  actor.ap = Math.min(actor.ap ?? actor.maxAp, actor.maxAp);
  actor.attacks = (definition.attacks ?? []).map((attack) => {
    const energy = (attack.tags ?? []).includes('energy');
    return {
      ...attack,
      damage: attack.damage + (attack.id === 'arc-pin' && upgrades.has('energy-tuned-emitter') ? 1 : 0),
      range: attack.range + (energy && upgrades.has('energy-range-lens') ? 1 : 0),
      accuracyBonus: (attack.accuracyBonus ?? 0) + (energy && upgrades.has('energy-range-lens') ? 10 : 0)
    };
  });
  actor.baseAttacks = actor.attacks.map((attack) => ({ ...attack }));
  actor.spriteId = companionSpriteId(definition, state);
  return actor;
}

export function companionSpriteId(definition, state) {
  const order = normalizeCompanionRunState(state).upgradeOrder;
  const index = companionNodeIndex(definition);
  for (let cursor = order.length - 1; cursor >= 0; cursor -= 1) {
    const entry = index.get(order[cursor]);
    if (entry?.tier >= 3 && COSMETIC_BRANCH_SPRITES[entry.branch.id]) return COSMETIC_BRANCH_SPRITES[entry.branch.id];
  }
  return definition?.spriteId ?? DRONE_DEFINITION_ID;
}

export function companionAbilityNodes(definition, state) {
  const purchased = new Set(normalizeCompanionRunState(state).upgrades);
  const abilities = [];
  for (const branch of definition?.branches ?? []) {
    for (const node of branch.nodes ?? []) {
      if (!purchased.has(node.id)) continue;
      if (String(node.effect ?? '').startsWith('ability-') || String(node.effect ?? '').startsWith('deploy-')) {
        abilities.push({ ...node, branchId: branch.id, branchName: branch.name });
      }
    }
  }
  return abilities;
}

function baseMaximumHp(definition, upgrades) {
  const installed = upgrades instanceof Set ? upgrades : new Set(upgrades ?? []);
  return Math.max(1, Math.round(definition?.stats?.hp ?? 1)) +
    (installed.has('core-reinforced-shell') ? 3 : 0) +
    (installed.has('bulwark-armor-band') ? 4 : 0);
}

function nodeCost(definition, nodeIndex, field) {
  const costs = definition?.upgradeEconomy?.[field] ?? [];
  return nonNegativeWhole(costs[nodeIndex] ?? 0);
}

function ratingThreshold(definition, tier) {
  const thresholds = definition?.upgradeEconomy?.ratingThresholds ?? [];
  return nonNegativeWhole(thresholds[Math.max(0, Math.min(thresholds.length - 1, (tier ?? 1) - 1))] ?? 0);
}

function fieldRating(player, fieldId) {
  const field = FIELD_RATINGS.find((entry) => entry.id === fieldId);
  if (!field) return Number.NEGATIVE_INFINITY;
  return calculateFieldRating(normalizeProgression(player?.progression), field);
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === 'string' && value.trim()))];
}

function nonNegativeWhole(value) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}
