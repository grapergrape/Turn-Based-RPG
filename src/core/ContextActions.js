import { chebyshev } from '../combat/CombatSystem.js';
import { isMeleeAttack, isRangedAttack } from '../combat/AttackMode.js';
import { hasStatus } from '../combat/StatusEffects.js';
import { AIMED_SHOT_DAMAGE_MULTIPLIER, TECHNIQUE_AP_COSTS, TECHNIQUE_RANGES } from '../combat/TechniqueRules.js';
import { findPath } from '../world/Pathfinder.js';
import { normalizeProgression } from './Progression.js';

const STABILIZE_STATUS_IDS = new Set(['burning', 'snared', 'suppressed', 'rattled', 'fatigued', 'sealed']);

export function buildContextActionsForTarget({
  player,
  target,
  enemies = [],
  grid,
  occupied = new Set(),
  techniqueDefs = {},
  inventory = null,
  selectedAttack = null,
  objectName = (object) => object?.name ?? 'Object',
  attackPreview = null
} = {}) {
  if (!player || !target) return [];
  const techniqueActions = buildTechniqueActionsForTarget({
    player,
    target,
    enemies,
    grid,
    occupied,
    techniqueDefs,
    attackPreview
  });
  if (target.type === 'combatant' && enemies.includes(target.actor)) {
    return [
      ...basicAttackActions(player, target.actor, attackPreview),
      ...techniqueActions
    ];
  }
  if (target.type === 'self') {
    return [
      reloadAction(player, inventory, selectedAttack),
      bindWoundsAction(player, inventory),
      ...techniqueActions
    ];
  }
  if (target.type === 'move') {
    return [
      moveAction({ player, grid, occupied, cell: target.cell }),
      ...techniqueActions
    ];
  }
  if (target.type === 'object') {
    return [{
      id: 'object-use',
      kind: 'object',
      label: `Use ${objectName(target.object)}`,
      object: target.object,
      cell: target.cell,
      enabled: false,
      reason: 'Not ready yet'
    }];
  }
  return [];
}

export function buildTechniqueActionsForTarget({
  player,
  target,
  enemies = [],
  grid,
  occupied = new Set(),
  techniqueDefs = {},
  attackPreview = null
} = {}) {
  if (!player || !target) return [];
  if (target.type === 'combatant' && enemies.includes(target.actor)) {
    return knownActiveTechniqueActions({
      player,
      techniqueDefs,
      targetType: 'enemy',
      target: target.actor,
      grid,
      occupied,
      attackPreview
    });
  }
  if (target.type === 'self') {
    return knownActiveTechniqueActions({
      player,
      techniqueDefs,
      targetType: 'self',
      target: player,
      grid,
      occupied,
      attackPreview
    });
  }
  if (target.type === 'move') {
    return knownActiveTechniqueActions({
      player,
      techniqueDefs,
      targetType: 'tile',
      cell: target.cell,
      grid,
      occupied,
      attackPreview
    });
  }
  return [];
}

function basicAttackActions(player, target, attackPreview) {
  return (player.attacks ?? []).map((attack) => {
    const state = attackState(player, attack, target);
    const preview = state.enabled && typeof attackPreview === 'function'
      ? attackPreview({ attack, target })
      : null;
    return withAttackPreview({
      id: `attack:${attack.id}`,
      kind: 'attack',
      label: attack.name,
      attackId: attack.id,
      target,
      enabled: state.enabled,
      reason: state.reason
    }, preview);
  });
}

function knownActiveTechniqueActions({
  player,
  techniqueDefs,
  targetType,
  target = null,
  cell = null,
  grid = null,
  occupied = new Set(),
  attackPreview = null
}) {
  const progression = normalizeProgression(player.progression);
  const actions = [];
  for (const techniqueId of progression.techniques) {
    const technique = techniqueDefs?.[techniqueId];
    if (!technique || technique.type !== 'active') continue;
    const targets = Array.isArray(technique.targets) ? technique.targets : ['enemy'];
    if (!targets.includes(targetType)) continue;
    if (technique.id === 'aimed-shot' && targetType === 'enemy') {
      actions.push(aimedShotAction(player, technique, target, attackPreview));
      continue;
    }
    if (technique.id === 'study-target' && targetType === 'enemy') {
      actions.push(simpleEnemyTechniqueAction(player, technique, target, TECHNIQUE_AP_COSTS['study-target'], TECHNIQUE_RANGES['study-target']));
      continue;
    }
    if (technique.id === 'overwatch') {
      actions.push(overwatchAction(player, technique, targetType, target, cell, grid, occupied));
      continue;
    }
    if (technique.id === 'trip-mine' && targetType === 'tile') {
      actions.push(tileTechniqueAction(player, technique, cell, grid, occupied, TECHNIQUE_AP_COSTS['trip-mine'], TECHNIQUE_RANGES['trip-mine']));
      continue;
    }
    if (technique.id === 'burn-line' && targetType === 'tile') {
      actions.push(tileTechniqueAction(player, technique, cell, grid, occupied, TECHNIQUE_AP_COSTS['burn-line'], TECHNIQUE_RANGES['burn-line']));
      continue;
    }
    if (technique.id === 'burn-line' && targetType === 'enemy') {
      actions.push(hazardEnemyTileAction(player, technique, target, grid, occupied, TECHNIQUE_AP_COSTS['burn-line'], Math.min(TECHNIQUE_RANGES['burn-line'], 3)));
      continue;
    }
    if (technique.id === 'shove' && targetType === 'enemy') {
      actions.push(shoveAction(player, technique, target, grid, occupied));
      continue;
    }
    if (technique.id === 'guard-break' && targetType === 'enemy') {
      actions.push(guardBreakAction(player, technique, target));
      continue;
    }
    if (technique.id === 'name-the-error' && targetType === 'enemy') {
      actions.push(humanPressureAction(player, technique, target, TECHNIQUE_AP_COSTS['name-the-error'], TECHNIQUE_RANGES['name-the-error']));
      continue;
    }
    if (technique.id === 'stilling-litany' && targetType === 'enemy') {
      actions.push(hostPressureAction(player, technique, target, TECHNIQUE_AP_COSTS['stilling-litany'], TECHNIQUE_RANGES['stilling-litany']));
      continue;
    }
    if (technique.id === 'feint' && targetType === 'enemy') {
      actions.push(humanPressureAction(player, technique, target, TECHNIQUE_AP_COSTS.feint, TECHNIQUE_RANGES.feint));
      continue;
    }
    if (technique.id === 'wire-snare' && targetType === 'enemy') {
      actions.push(simpleEnemyTechniqueAction(player, technique, target, TECHNIQUE_AP_COSTS['wire-snare'], TECHNIQUE_RANGES['wire-snare']));
      continue;
    }
    if (technique.id === 'censure-spark' && targetType === 'enemy') {
      actions.push(simpleEnemyTechniqueAction(player, technique, target, TECHNIQUE_AP_COSTS['censure-spark'], TECHNIQUE_RANGES['censure-spark']));
      continue;
    }
    if (technique.id === 'stabilize' && targetType === 'self') {
      actions.push(stabilizeAction(player, technique));
      continue;
    }
    if (technique.id === 'field-stimulant' && targetType === 'self') {
      actions.push(selfTechniqueAction(player, technique, TECHNIQUE_AP_COSTS['field-stimulant'], {
        enabled: !hasStatus(player, 'stimmed'),
        reason: hasStatus(player, 'stimmed') ? 'Dose spent' : ''
      }));
      continue;
    }
    if (technique.id === 'field-measure' && targetType === 'self') {
      actions.push(selfTechniqueAction(player, technique, TECHNIQUE_AP_COSTS['field-measure'], {
        enabled: !hasStatus(player, 'prepared'),
        reason: hasStatus(player, 'prepared') ? 'Already prepared' : ''
      }));
      continue;
    }
    if (technique.id === 'rally' && targetType === 'self') {
      actions.push(selfTechniqueAction(player, technique, TECHNIQUE_AP_COSTS.rally, {
        enabled: !hasStatus(player, 'rallied'),
        reason: hasStatus(player, 'rallied') ? 'Already rallied' : ''
      }));
      continue;
    }
    if (technique.id === 'fade-back' && targetType === 'tile') {
      actions.push(tileTechniqueAction(player, technique, cell, grid, occupied, TECHNIQUE_AP_COSTS['fade-back'], TECHNIQUE_RANGES['fade-back']));
      continue;
    }
    if (technique.id === 'seal-tile' && targetType === 'tile') {
      actions.push(tileTechniqueAction(player, technique, cell, grid, occupied, TECHNIQUE_AP_COSTS['seal-tile'], TECHNIQUE_RANGES['seal-tile']));
      continue;
    }
    if (technique.id === 'seal-tile' && targetType === 'enemy') {
      actions.push(hazardEnemyTileAction(player, technique, target, grid, occupied, TECHNIQUE_AP_COSTS['seal-tile'], TECHNIQUE_RANGES['seal-tile']));
      continue;
    }
    if (technique.id === 'quarantine-line' && targetType === 'tile') {
      actions.push(tileTechniqueAction(player, technique, cell, grid, occupied, TECHNIQUE_AP_COSTS['quarantine-line'], TECHNIQUE_RANGES['quarantine-line']));
      continue;
    }
    if (technique.id === 'quarantine-line' && targetType === 'enemy') {
      actions.push(hazardEnemyTileAction(player, technique, target, grid, occupied, TECHNIQUE_AP_COSTS['quarantine-line'], Math.min(TECHNIQUE_RANGES['quarantine-line'], 3)));
      continue;
    }
  }
  return actions;
}

function aimedShotAction(player, technique, target, attackPreview) {
  const attack = firearmAttack(player);
  if (!attack) {
    return {
      id: `technique:${technique.id}`,
      kind: 'technique',
      techniqueId: technique.id,
      label: technique.name,
      target,
      enabled: false,
      reason: 'Requires firearm'
    };
  }
  const extraAp = TECHNIQUE_AP_COSTS['aimed-shot'];
  const state = attackState(player, attack, target, extraAp);
  const preview = state.enabled && typeof attackPreview === 'function'
    ? attackPreview({ attack, target, extraAp, aimedShot: true, damageMultiplier: AIMED_SHOT_DAMAGE_MULTIPLIER })
    : null;
  return withAttackPreview({
    id: `technique:${technique.id}`,
    kind: 'technique',
    techniqueId: technique.id,
    label: technique.name,
    attackId: attack.id,
    target,
    extraAp,
    damageMultiplier: AIMED_SHOT_DAMAGE_MULTIPLIER,
    enabled: state.enabled,
    reason: state.reason
  }, preview);
}

function simpleEnemyTechniqueAction(player, technique, target, apCost, range) {
  const state = targetTechniqueState(player, target, apCost, range);
  return {
    id: `technique:${technique.id}`,
    kind: 'technique',
    techniqueId: technique.id,
    label: `${technique.name} ${apCost} AP`,
    target,
    apCost,
    enabled: state.enabled,
    reason: state.reason
  };
}

function overwatchAction(player, technique, targetType, target, cell, grid, occupied) {
  const attack = firearmAttack(player);
  if (!attack) {
    return {
      id: `technique:${technique.id}`,
      kind: 'technique',
      techniqueId: technique.id,
      label: technique.name,
      target,
      cell,
      enabled: false,
      reason: 'Requires firearm'
    };
  }
  const apCost = TECHNIQUE_AP_COSTS.overwatch;
  const range = attack.range ?? TECHNIQUE_RANGES.overwatch;
  if (targetType === 'enemy') {
    const state = targetTechniqueState(player, target, apCost, range);
    return {
      id: `technique:${technique.id}`,
      kind: 'technique',
      techniqueId: technique.id,
      label: `${technique.name} ${apCost} AP`,
      attackId: attack.id,
      target,
      apCost,
      enabled: state.enabled,
      reason: state.reason
    };
  }
  const state = tileTechniqueState(player, cell, grid, occupied, apCost, range);
  return {
    id: `technique:${technique.id}`,
    kind: 'technique',
    techniqueId: technique.id,
    label: `${technique.name} ${apCost} AP`,
    attackId: attack.id,
    cell,
    apCost,
    enabled: state.enabled,
    reason: state.reason
  };
}

function tileTechniqueAction(player, technique, cell, grid, occupied, apCost, range) {
  const state = tileTechniqueState(player, cell, grid, occupied, apCost, range);
  return {
    id: `technique:${technique.id}`,
    kind: 'technique',
    techniqueId: technique.id,
    label: `${technique.name} ${apCost} AP`,
    cell,
    apCost,
    enabled: state.enabled,
    reason: state.reason
  };
}

function hazardEnemyTileAction(player, technique, target, grid, occupied, apCost, range) {
  const cell = target?.position ?? null;
  const state = tileTechniqueState(player, cell, grid, occupied, apCost, range, { allowOccupied: true });
  return {
    id: `technique:${technique.id}`,
    kind: 'technique',
    techniqueId: technique.id,
    label: `${technique.name} ${apCost} AP`,
    target,
    cell,
    apCost,
    enabled: state.enabled,
    reason: state.reason
  };
}

function shoveAction(player, technique, target, grid, occupied) {
  const apCost = TECHNIQUE_AP_COSTS.shove;
  const state = targetTechniqueState(player, target, apCost, TECHNIQUE_RANGES.shove);
  return {
    id: `technique:${technique.id}`,
    kind: 'technique',
    techniqueId: technique.id,
    label: `${technique.name} ${apCost} AP`,
    target,
    apCost,
    destination: pushDestination(player, target, grid, occupied),
    enabled: state.enabled,
    reason: state.reason
  };
}

function guardBreakAction(player, technique, target) {
  const attack = meleeAttack(player);
  if (!attack) {
    return {
      id: `technique:${technique.id}`,
      kind: 'technique',
      techniqueId: technique.id,
      label: technique.name,
      target,
      enabled: false,
      reason: 'Requires melee'
    };
  }
  const apCost = TECHNIQUE_AP_COSTS['guard-break'];
  const state = targetTechniqueState(player, target, apCost, TECHNIQUE_RANGES['guard-break']);
  return {
    id: `technique:${technique.id}`,
    kind: 'technique',
    techniqueId: technique.id,
    label: `${technique.name} ${apCost} AP`,
    attackId: attack.id,
    target,
    apCost,
    enabled: state.enabled,
    reason: state.reason
  };
}

function humanPressureAction(player, technique, target, apCost, range) {
  const susceptible = isHumanLike(target);
  const state = susceptible
    ? targetTechniqueState(player, target, apCost, range)
    : { enabled: false, reason: 'No purchase' };
  return {
    id: `technique:${technique.id}`,
    kind: 'technique',
    techniqueId: technique.id,
    label: `${technique.name} ${apCost} AP`,
    target,
    apCost,
    enabled: state.enabled,
    reason: state.reason
  };
}

function hostPressureAction(player, technique, target, apCost, range) {
  const susceptible = isHostLike(target);
  const state = susceptible
    ? targetTechniqueState(player, target, apCost, range)
    : { enabled: false, reason: 'No purchase' };
  return {
    id: `technique:${technique.id}`,
    kind: 'technique',
    techniqueId: technique.id,
    label: `${technique.name} ${apCost} AP`,
    target,
    apCost,
    enabled: state.enabled,
    reason: state.reason
  };
}

function stabilizeAction(player, technique) {
  const apCost = TECHNIQUE_AP_COSTS.stabilize;
  const hasBadStatus = (player.statuses ?? []).some((status) => STABILIZE_STATUS_IDS.has(status.id) && isCleanseableStatus(status));
  const needsCare = hasBadStatus || player.hp < player.maxHp;
  return selfTechniqueAction(player, technique, apCost, {
    enabled: needsCare,
    reason: needsCare ? '' : 'No need'
  });
}

function selfTechniqueAction(player, technique, apCost, state = { enabled: true, reason: '' }) {
  const enoughAp = player.ap >= apCost;
  const enabled = Boolean(state.enabled) && enoughAp;
  return {
    id: `technique:${technique.id}`,
    kind: 'technique',
    techniqueId: technique.id,
    label: `${technique.name} ${apCost} AP`,
    target: player,
    apCost,
    enabled,
    reason: enoughAp ? state.reason : `Need ${apCost} AP`
  };
}

function attackState(player, attack, target, extraAp = 0) {
  if (!attack) return { enabled: false, reason: 'No attack' };
  if (attack.broken) return { enabled: false, reason: 'Needs repair' };
  if (attack.empty) return { enabled: false, reason: 'Empty' };
  if (attack.requiresStationary && player.movedThisTurn) return { enabled: false, reason: 'Must brace before moving' };
  if (!target || target.isDead) return { enabled: false, reason: 'No target' };
  if (chebyshev(player.position, target.position) > attack.range) return { enabled: false, reason: 'Out of range' };
  const cost = attack.apCost + extraAp;
  if (player.ap < cost) return { enabled: false, reason: `Need ${cost} AP` };
  return { enabled: true, reason: '' };
}

function targetTechniqueState(player, target, apCost, range) {
  if (!target || target.isDead) return { enabled: false, reason: 'No target' };
  if (chebyshev(player.position, target.position) > range) return { enabled: false, reason: 'Out of range' };
  if (player.ap < apCost) return { enabled: false, reason: `Need ${apCost} AP` };
  return { enabled: true, reason: '' };
}

function tileTechniqueState(player, cell, grid, occupied, apCost, range, { allowOccupied = false } = {}) {
  if (!cell || !grid?.isWalkable?.(cell.x, cell.y)) return { enabled: false, reason: 'Blocked' };
  if (!allowOccupied && occupied?.has?.(`${cell.x},${cell.y}`)) return { enabled: false, reason: 'Occupied' };
  if (!allowOccupied && cell.x === player.position.x && cell.y === player.position.y) return { enabled: false, reason: 'Occupied' };
  if (chebyshev(player.position, cell) > range) return { enabled: false, reason: 'Out of range' };
  if (player.ap < apCost) return { enabled: false, reason: `Need ${apCost} AP` };
  return { enabled: true, reason: '' };
}

function firearmAttack(player) {
  return player.getAttack?.('sidearm')
    ?? (player.attacks ?? []).find((attack) => isRangedAttack(attack))
    ?? null;
}

function meleeAttack(player) {
  return player.getAttack?.('melee')
    ?? (player.attacks ?? []).find((attack) => isMeleeAttack(attack))
    ?? null;
}

function pushDestination(player, target, grid, occupied) {
  if (!target?.position || !player?.position) return null;
  const dx = Math.sign(target.position.x - player.position.x);
  const dy = Math.sign(target.position.y - player.position.y);
  if (dx === 0 && dy === 0) return null;
  const cell = { x: target.position.x + dx, y: target.position.y + dy };
  if (!grid?.isWalkable?.(cell.x, cell.y)) return null;
  if (occupied?.has?.(`${cell.x},${cell.y}`)) return null;
  return cell;
}

function isHumanLike(target) {
  const tags = new Set(target?.tags ?? []);
  return tags.has('human') || tags.has('cultist') || target?.faction === 'ash-cartel' || target?.faction === 'choir-open-wound';
}

function isHostLike(target) {
  const tags = new Set(target?.tags ?? []);
  return tags.has('host') || target?.faction === 'the-host';
}

function isCleanseableStatus(status) {
  return !(status?.id === 'fatigued' && status?.data?.lockedBy === 'field-stimulant');
}

function moveAction({ player, grid, occupied, cell }) {
  if (!cell || !grid?.isWalkable?.(cell.x, cell.y)) {
    return { id: 'move', kind: 'move', label: 'Move', cell, enabled: false, reason: 'Blocked' };
  }
  const path = findPath(grid, player.position, cell, occupied);
  if (!path || path.length <= 0) {
    return { id: 'move', kind: 'move', label: 'Move', cell, enabled: false, reason: 'No path' };
  }
  const cost = path.length * player.moveCost;
  if (player.ap < cost) return { id: 'move', kind: 'move', label: 'Move', cell, enabled: false, reason: `Need ${cost} AP` };
  return { id: 'move', kind: 'move', label: `Move ${cost} AP`, cell, enabled: true, reason: '' };
}

function reloadAction(player, inventory, attack) {
  const state = inventory?.reloadStateForAttack?.(attack);
  if (!state) return { id: 'reload', kind: 'reload', label: 'Reload', enabled: false, reason: 'No ranged weapon selected' };
  const label = `Reload ${state.reloadAp} AP`;
  if (state.full) return { id: 'reload', kind: 'reload', label, enabled: false, reason: 'Magazine full' };
  if (!state.reserve) return { id: 'reload', kind: 'reload', label, enabled: false, reason: 'No ammunition' };
  if (player.ap < state.reloadAp) return { id: 'reload', kind: 'reload', label, enabled: false, reason: `Need ${state.reloadAp} AP` };
  return { id: 'reload', kind: 'reload', label, attackId: attack.id, enabled: true, reason: '' };
}

function bindWoundsAction(player, inventory) {
  if (!inventory?.has?.('field-dressing')) {
    return { id: 'bind-wounds', kind: 'bind-wounds', label: 'Bind Wounds', enabled: false, reason: 'No dressing' };
  }
  if (player.hp >= player.maxHp) {
    return { id: 'bind-wounds', kind: 'bind-wounds', label: 'Bind Wounds', enabled: false, reason: 'No wounds' };
  }
  return { id: 'bind-wounds', kind: 'bind-wounds', label: 'Bind Wounds', enabled: true, reason: '' };
}

function withAttackPreview(action, preview) {
  if (!preview) return action;
  const label = [
    action.label,
    preview.chanceText,
    preview.damageText
  ].filter(Boolean).join(' ');
  if (!preview.enabled) {
    return {
      ...action,
      label,
      enabled: false,
      reason: preview.reason || action.reason
    };
  }
  return {
    ...action,
    label,
    enabled: true,
    reason: '',
    hint: [...(preview.tags ?? []), ...(preview.damageTags ?? [])].join(' ')
  };
}
