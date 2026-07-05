import { chebyshev } from '../combat/CombatSystem.js';
import { findPath } from '../world/Pathfinder.js';
import { normalizeProgression } from './Progression.js';

export function buildContextActionsForTarget({
  player,
  target,
  enemies = [],
  grid,
  occupied = new Set(),
  techniqueDefs = {},
  inventory = null,
  objectName = (object) => object?.name ?? 'Object'
} = {}) {
  if (!player || !target) return [];
  if (target.type === 'combatant' && enemies.includes(target.actor)) {
    return [
      ...basicAttackActions(player, target.actor),
      ...knownActiveTechniqueActions({ player, techniqueDefs, targetType: 'enemy', target: target.actor })
    ];
  }
  if (target.type === 'self') {
    return [
      reloadAction(),
      bindWoundsAction(player, inventory),
      ...knownActiveTechniqueActions({ player, techniqueDefs, targetType: 'self', target: player })
    ];
  }
  if (target.type === 'move') {
    return [
      moveAction({ player, grid, occupied, cell: target.cell }),
      ...knownActiveTechniqueActions({ player, techniqueDefs, targetType: 'tile', cell: target.cell })
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

function basicAttackActions(player, target) {
  return (player.attacks ?? []).map((attack) => {
    const state = attackState(player, attack, target);
    return {
      id: `attack:${attack.id}`,
      kind: 'attack',
      label: attack.name,
      attackId: attack.id,
      target,
      enabled: state.enabled,
      reason: state.reason
    };
  });
}

function knownActiveTechniqueActions({ player, techniqueDefs, targetType, target = null, cell = null }) {
  const progression = normalizeProgression(player.progression);
  const actions = [];
  for (const techniqueId of progression.techniques) {
    const technique = techniqueDefs?.[techniqueId];
    if (!technique || technique.type !== 'active') continue;
    const targets = Array.isArray(technique.targets) ? technique.targets : ['enemy'];
    if (!targets.includes(targetType)) continue;
    if (technique.id === 'aimed-shot' && targetType === 'enemy') {
      actions.push(aimedShotAction(player, technique, target));
      continue;
    }
    actions.push({
      id: `technique:${technique.id}`,
      kind: 'technique',
      techniqueId: technique.id,
      label: technique.name,
      target,
      cell,
      enabled: false,
      reason: 'Not ready yet'
    });
  }
  return actions;
}

function aimedShotAction(player, technique, target) {
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
  const extraAp = 1;
  const state = attackState(player, attack, target, extraAp);
  return {
    id: `technique:${technique.id}`,
    kind: 'technique',
    techniqueId: technique.id,
    label: technique.name,
    attackId: attack.id,
    target,
    extraAp,
    damageMultiplier: 1.25,
    enabled: state.enabled,
    reason: state.reason
  };
}

function attackState(player, attack, target, extraAp = 0) {
  if (!attack) return { enabled: false, reason: 'No attack' };
  if (attack.broken) return { enabled: false, reason: 'Needs repair' };
  if (!target || target.isDead) return { enabled: false, reason: 'No target' };
  if (chebyshev(player.position, target.position) > attack.range) return { enabled: false, reason: 'Out of range' };
  const cost = attack.apCost + extraAp;
  if (player.ap < cost) return { enabled: false, reason: `Need ${cost} AP` };
  return { enabled: true, reason: '' };
}

function firearmAttack(player) {
  return player.getAttack?.('sidearm')
    ?? (player.attacks ?? []).find((attack) => attack.range > 1)
    ?? null;
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

function reloadAction() {
  return { id: 'reload', kind: 'reload', label: 'Reload', enabled: false, reason: 'No reload needed' };
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
