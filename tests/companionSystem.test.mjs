import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  DRONE_REBOOT_RATIO,
  applyCompanionUpgrades,
  awardCompanionLevelPoints,
  companionBranchRating,
  companionNodeState,
  createCompanionEntity,
  createCompanionRunState,
  normalizeCompanionRunState,
  normalizeDroneName,
  purchaseCompanionUpgrade,
  rebootCompanion,
  recruitCompanionState
} from '../src/companions/CompanionSystem.js';

const definition = JSON.parse(await readFile(new URL('../data/companions/utility-drone-mark-i.json', import.meta.url), 'utf8'));
const highPrimaries = Object.fromEntries(['body', 'agility', 'eye', 'intelligence', 'religion', 'voice', 'nerve'].map((id) => [id, 10]));
const owner = {
  id: 'mara-vey',
  progression: { level: 3, build: 'engineer', primaries: highPrimaries }
};

assert.equal(definition.branches.length, 6);
assert.equal(definition.branches.every((branch) => branch.nodes.length === 8), true);
assert.equal(definition.branches.flatMap((branch) => branch.nodes).length, 48);
assert.deepEqual(definition.upgradeEconomy.nodePointCosts, [1, 1, 2, 2, 3, 3, 4, 5]);
assert.deepEqual(definition.upgradeEconomy.nodePartCosts, [0, 0, 0, 0, 1, 1, 2, 3]);
assert.deepEqual(definition.upgradeEconomy.ratingThresholds, [27, 40, 55, 70, 85]);

assert.deepEqual(normalizeDroneName(" Pip's  "), { name: "Pip's", valid: true });
assert.equal(normalizeDroneName('!').valid, false);
assert.equal(normalizeDroneName('abcdefghijklmnop').name.length, 12);

const recruited = recruitCompanionState(createCompanionRunState(), definition, 3, 'Pip');
assert.equal(recruited.ok, true);
assert.equal(recruited.state.recruited, true);
assert.equal(recruited.state.name, 'Pip');
assert.equal(recruited.state.upgradePoints, 8);
assert.equal(recruited.state.rewardedLevel, 3);

const actor = createCompanionEntity(definition, recruited.state, { x: 2, y: 3 }, owner);
assert.equal(actor.type, 'companion');
assert.equal(actor.communication.mode, 'nonverbal');
assert.equal(actor.team, 'player');
assert.equal(actor.control, 'player');
assert.equal(actor.ownerId, owner.id);
assert.equal(actor.maxHp, 8);
assert.equal(actor.maxAp, 5);
assert.deepEqual(actor.attacks.map(({ id, apCost, damage, range }) => ({ id, apCost, damage, range })), [
  { id: 'arc-pin', apCost: 3, damage: 2, range: 4 }
]);

assert.ok(companionBranchRating(definition, 'medical', owner) >= 85);
assert.ok(companionBranchRating(definition, 'veil', owner) >= 85);
assert.deepEqual(
  companionNodeState(definition, { ...recruited.state, upgradePoints: 100 }, 'core-reinforced-shell', owner, 10),
  assertNodeState({ pointCost: 1, partCost: 0, threshold: 27 })
);
const lockedCapstone = companionNodeState(definition, { ...recruited.state, upgradePoints: 100 }, 'core-command-bus', owner, 10);
assert.equal(lockedCapstone.pointCost, 5);
assert.equal(lockedCapstone.partCost, 3);
assert.equal(lockedCapstone.threshold, 85);
assert.equal(lockedCapstone.unlocked, false);
assert.equal(lockedCapstone.reason, 'Install the linked upgrades first.');

let serviceParts = 10;
const inventory = {
  count(itemId) {
    return itemId === definition.serviceItem ? serviceParts : 0;
  },
  remove(itemId, count) {
    if (itemId !== definition.serviceItem || count > serviceParts) return false;
    serviceParts -= count;
    return true;
  }
};
let upgradeState = { ...recruited.state, upgradePoints: 100 };
for (const node of definition.branches.find((branch) => branch.id === 'core').nodes) {
  const result = purchaseCompanionUpgrade({ definition, state: upgradeState, nodeId: node.id, player: owner, inventory });
  assert.equal(result.ok, true, `${node.id} should install in branch order: ${result.reason ?? ''}`);
  upgradeState = result.state;
}
assert.equal(upgradeState.upgrades.length, 8);
assert.equal(upgradeState.upgradePoints, 79);
assert.equal(serviceParts, 3);

applyCompanionUpgrades(actor, definition, upgradeState);
assert.equal(actor.maxHp, 11);
assert.equal(actor.maxAp, 6);
assert.equal(actor.spriteId, 'utility-drone-mark-i-core');

actor.hp = 0;
actor.isDead = true;
actor.disabled = true;
const rebooted = rebootCompanion({ ...upgradeState, hp: 0, disabled: true }, actor);
assert.equal(rebooted.hp, Math.ceil(actor.maxHp * DRONE_REBOOT_RATIO));
assert.equal(rebooted.disabled, false);
assert.equal(actor.isDead, false);

const leveled = awardCompanionLevelPoints(upgradeState, definition, 5);
assert.equal(leveled.gained, 4);
assert.equal(leveled.state.rewardedLevel, 5);

const normalized = normalizeCompanionRunState({
  ...upgradeState,
  vanishingSpentEncounters: ['road-watch', 'road-watch', 'chapel-guard']
});
assert.deepEqual(normalized.vanishingSpentEncounters, ['road-watch', 'chapel-guard']);

console.log('companionSystem: recruitment, 48-node economy, prerequisites, upgrades, level rewards, and reboot passed.');

function assertNodeState({ pointCost, partCost, threshold }) {
  return {
    exists: true,
    purchased: false,
    unlocked: true,
    reason: '',
    node: companionNodeStateEntry('core-reinforced-shell'),
    pointCost,
    partCost,
    threshold,
    rating: companionBranchRating(definition, 'core', owner)
  };
}

function companionNodeStateEntry(nodeId) {
  const branch = definition.branches.find((entry) => entry.nodes.some((node) => node.id === nodeId));
  const nodeIndex = branch.nodes.findIndex((node) => node.id === nodeId);
  return { ...branch.nodes[nodeIndex], branch, nodeIndex };
}
