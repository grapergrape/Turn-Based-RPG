import {
  ACTOR_SPRITE_IDS,
  FIELD_RATINGS,
  errors,
  referencedItemIds,
  relative,
  requireNumber,
  requireString
} from './validationContext.mjs';

const seenCompanions = new Set();
const indexedCompanions = new Set();
const fieldIds = new Set(FIELD_RATINGS.map((field) => field.id));
const spriteIds = ACTOR_SPRITE_IDS;

export function validateCompanion(filePath, data) {
  const name = relative(filePath);
  if (name.endsWith('/index.json')) {
    if (!Array.isArray(data.ids) || data.ids.length === 0) {
      errors.push(`${name}: ids must be a non-empty array.`);
      return;
    }
    for (const id of data.ids) {
      requireString(name, id, 'ids[]');
      if (typeof id === 'string') indexedCompanions.add(id);
    }
    return;
  }

  requireString(name, data.id, 'id');
  requireString(name, data.name, 'name');
  requireString(name, data.type, 'type');
  requireString(name, data.spriteId, 'spriteId');
  requireString(name, data.serviceItem, 'serviceItem');
  if (data.type !== 'companion') errors.push(`${name}: type must be companion.`);
  if (typeof data.id === 'string') seenCompanions.add(data.id);
  if (typeof data.spriteId === 'string' && !spriteIds.has(data.spriteId)) {
    errors.push(`${name}: spriteId "${data.spriteId}" is not registered in the sprite atlas.`);
  }
  if (typeof data.serviceItem === 'string') referencedItemIds.add(data.serviceItem);

  validateStats(name, data.stats);
  validateCommunication(name, data.communication);
  validateAttacks(name, data.attacks);
  validateEconomy(name, data.upgradeEconomy);
  validateBranches(name, data.branches);
}

function validateCommunication(name, communication) {
  if (!communication || typeof communication !== 'object' || Array.isArray(communication)) {
    errors.push(`${name}: communication must be an object.`);
    return;
  }
  if (!['nonverbal', 'speech'].includes(communication.mode)) {
    errors.push(`${name}: communication.mode must be nonverbal or speech.`);
  }
  if (!communication.signals || typeof communication.signals !== 'object' || Array.isArray(communication.signals)) {
    errors.push(`${name}: communication.signals must be an object.`);
    return;
  }
  const entries = Object.entries(communication.signals);
  if (communication.mode === 'nonverbal' && entries.length === 0) {
    errors.push(`${name}: nonverbal companions must define at least one signal.`);
  }
  for (const [signalId, signal] of entries) {
    requireString(name, signalId, 'communication.signals key');
    requireString(name, signal, `communication.signals.${signalId}`);
  }
}

export function validateCompanionCatalog() {
  for (const id of indexedCompanions) {
    if (!seenCompanions.has(id)) errors.push(`data/companions: indexed companion "${id}" is missing.`);
  }
  for (const id of seenCompanions) {
    if (!indexedCompanions.has(id)) errors.push(`data/companions: companion "${id}" is missing from index.json.`);
  }
}

function validateStats(name, stats) {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
    errors.push(`${name}: stats must be an object.`);
    return;
  }
  for (const field of ['hp', 'actionPoints', 'moveCost']) {
    requireNumber(name, stats[field], `stats.${field}`);
    if (typeof stats[field] === 'number' && (!Number.isInteger(stats[field]) || stats[field] < 0)) {
      errors.push(`${name}: stats.${field} must be a zero or greater integer.`);
    }
  }
}

function validateAttacks(name, attacks) {
  if (!Array.isArray(attacks) || attacks.length === 0) {
    errors.push(`${name}: attacks must be a non-empty array.`);
    return;
  }
  const ids = new Set();
  for (const [index, attack] of attacks.entries()) {
    const field = `attacks[${index}]`;
    requireString(name, attack?.id, `${field}.id`);
    requireString(name, attack?.name, `${field}.name`);
    for (const numberField of ['apCost', 'damage', 'range']) {
      requireNumber(name, attack?.[numberField], `${field}.${numberField}`);
    }
    if (ids.has(attack?.id)) errors.push(`${name}: ${field}.id must be unique.`);
    ids.add(attack?.id);
    for (const ratingField of ['accuracyField', 'damageField']) {
      if (!fieldIds.has(attack?.[ratingField])) errors.push(`${name}: ${field}.${ratingField} must name a field rating.`);
    }
  }
}

function validateEconomy(name, economy) {
  if (!economy || typeof economy !== 'object' || Array.isArray(economy)) {
    errors.push(`${name}: upgradeEconomy must be an object.`);
    return;
  }
  for (const field of ['recruitBasePoints', 'pointsPerLevel']) requireNumber(name, economy[field], `upgradeEconomy.${field}`);
  validateCostArray(name, economy.nodePointCosts, 'nodePointCosts', 8);
  validateCostArray(name, economy.nodePartCosts, 'nodePartCosts', 8);
  validateCostArray(name, economy.ratingThresholds, 'ratingThresholds', 5);
}

function validateCostArray(name, values, field, count) {
  if (!Array.isArray(values) || values.length !== count) {
    errors.push(`${name}: upgradeEconomy.${field} must contain ${count} values.`);
    return;
  }
  for (const [index, value] of values.entries()) {
    if (!Number.isInteger(value) || value < 0) errors.push(`${name}: upgradeEconomy.${field}[${index}] must be a zero or greater integer.`);
  }
}

function validateBranches(name, branches) {
  if (!Array.isArray(branches) || branches.length !== 6) {
    errors.push(`${name}: branches must contain exactly 6 branches.`);
    return;
  }
  const branchIds = new Set();
  const nodeIds = new Set();
  const nodes = [];
  for (const [branchIndex, branch] of branches.entries()) {
    const field = `branches[${branchIndex}]`;
    requireString(name, branch?.id, `${field}.id`);
    requireString(name, branch?.name, `${field}.name`);
    if (branchIds.has(branch?.id)) errors.push(`${name}: ${field}.id must be unique.`);
    branchIds.add(branch?.id);
    if (!['one', 'max'].includes(branch?.rating?.mode)) errors.push(`${name}: ${field}.rating.mode must be one or max.`);
    if (!Array.isArray(branch?.rating?.fields) || branch.rating.fields.length === 0) {
      errors.push(`${name}: ${field}.rating.fields must be a non-empty array.`);
    } else {
      for (const rating of branch.rating.fields) if (!fieldIds.has(rating)) errors.push(`${name}: ${field}.rating.fields contains unknown field "${rating}".`);
    }
    if (!Array.isArray(branch?.nodes) || branch.nodes.length !== 8) {
      errors.push(`${name}: ${field}.nodes must contain exactly 8 nodes.`);
      continue;
    }
    for (const [nodeIndex, node] of branch.nodes.entries()) {
      const nodeField = `${field}.nodes[${nodeIndex}]`;
      requireString(name, node?.id, `${nodeField}.id`);
      requireString(name, node?.name, `${nodeField}.name`);
      requireString(name, node?.description, `${nodeField}.description`);
      requireString(name, node?.effect, `${nodeField}.effect`);
      requireNumber(name, node?.tier, `${nodeField}.tier`);
      if (!Array.isArray(node?.requires)) errors.push(`${name}: ${nodeField}.requires must be an array.`);
      if (nodeIds.has(node?.id)) errors.push(`${name}: ${nodeField}.id must be unique across the tree.`);
      nodeIds.add(node?.id);
      nodes.push({ node, nodeField });
    }
  }
  if (nodeIds.size !== 48) errors.push(`${name}: the upgrade tree must contain exactly 48 unique nodes.`);
  for (const { node, nodeField } of nodes) {
    for (const prerequisite of node.requires ?? []) {
      if (!nodeIds.has(prerequisite)) errors.push(`${name}: ${nodeField}.requires references unknown node "${prerequisite}".`);
    }
  }
}
