import { chebyshev } from '../../combat/CombatSystem.js';
import { isMeleeAttack, isRangedAttack } from '../../combat/AttackMode.js';
import { TECHNIQUE_AP_COSTS, TECHNIQUE_RANGES } from '../../combat/TechniqueRules.js';
import { companionAbilityNodes } from '../../companions/CompanionSystem.js';
import { COMPANION_ACTION_RULES } from '../../companions/CompanionActionRules.js';
import { normalizeProgression } from '../Progression.js';
import { VIEWPORT_HEIGHT } from '../../render/renderConfig.js';
import {
  combatAbilityAt,
  combatAbilityPageCount
} from '../../ui/combatAbilityLayout.js';
import { installGameMethods } from './installGameMethods.js';

const TARGET_ORDER = Object.freeze(['enemy', 'ally', 'self', 'tile', 'object']);
const TARGET_LABELS = Object.freeze({
  enemy: 'ENEMY',
  ally: 'ALLY',
  self: 'SELF',
  tile: 'TILE',
  object: 'OBJECT'
});

class GameCombatAbilityRuntime {
  _buildCombatAbilityTray() {
    if (this.mode !== 'combat' || this.uiScreen || this.moving || !this.turnManager?.isPlayerTurn?.()) return null;
    const actor = this._activeControlledActor?.() ?? this.player;
    if (!actor || actor.isDead) return null;
    const entries = this._combatAbilityEntriesFor(actor);
    if (entries.length === 0) return null;

    const pageCount = combatAbilityPageCount({ entries });
    const page = Math.max(0, Math.min(Math.trunc(this.combatAbilityTrayPage ?? 0), pageCount - 1));
    const selected = this._combatAbilityTargetingEntry(actor, entries);
    const anchor = this.renderer?.toScreen?.(actor.x, actor.y, actor.pxOffset) ?? { x: 320, y: 192 };
    return {
      actor: {
        x: actor.x,
        y: actor.y,
        pxOffset: { x: actor.pxOffset?.x ?? 0, y: actor.pxOffset?.y ?? 0 }
      },
      anchor,
      entries,
      page,
      pageCount,
      selectedAbilityId: selected?.id ?? null,
      prompt: selected ? `${selected.name}: SELECT ${selected.targetPrompt}` : ''
    };
  }

  _combatAbilityEntriesFor(actor) {
    return actor?.type === 'companion'
      ? this._droneCombatAbilityEntries(actor)
      : this._playerCombatAbilityEntries(actor);
  }

  _playerCombatAbilityEntries(actor) {
    const progression = normalizeProgression(actor?.progression);
    const firearm = playerFirearm(actor);
    const melee = playerMelee(actor);
    const selfActions = typeof this._techniqueActionsForTarget === 'function'
      ? this._techniqueActionsForTarget({ type: 'self', actor, cell: actor.position })
      : typeof this._contextActionsForTarget === 'function'
        ? this._contextActionsForTarget({ type: 'self', actor, cell: actor.position })
        : [];
    const entries = [];

    for (const techniqueId of progression.techniques) {
      const definition = this.techniqueDefs?.[techniqueId];
      if (!definition || definition.type !== 'active') continue;
      const targets = normalizedTargets(definition.targets, ['enemy']);
      const baseCost = TECHNIQUE_AP_COSTS[techniqueId];
      const cost = techniqueId === 'aimed-shot' && firearm
        ? firearm.apCost + baseCost
        : baseCost;
      let enabled = Number.isFinite(cost);
      let reason = enabled ? '' : 'NOT READY';

      if ((techniqueId === 'aimed-shot' || techniqueId === 'overwatch') && !firearm) {
        enabled = false;
        reason = 'NEEDS FIREARM';
      } else if (techniqueId === 'guard-break' && !melee) {
        enabled = false;
        reason = 'NEEDS MELEE';
      } else if (targets.length === 1 && targets[0] === 'self') {
        const action = selfActions.find((candidate) => candidate.techniqueId === techniqueId);
        enabled = Boolean(action?.enabled);
        reason = action?.reason ? String(action.reason).toUpperCase() : enabled ? '' : 'NOT READY';
      } else if (enabled && actor.ap < cost) {
        enabled = false;
        reason = `NEED ${cost} AP`;
      }

      const labels = targetLabels(targets);
      entries.push({
        id: `technique:${techniqueId}`,
        ownerType: 'player',
        abilityId: techniqueId,
        name: definition.name,
        targets,
        targetLabel: labels.compact,
        targetPrompt: labels.prompt,
        cost,
        range: playerTechniqueRange(techniqueId, firearm),
        enabled,
        reason,
        detail: enabled ? `${cost} AP ${labels.compact}` : reason
      });
    }
    return entries;
  }

  _droneCombatAbilityEntries(actor) {
    const definition = this._companionDefinition?.();
    const selfActions = typeof this._buildDroneContextActions === 'function'
      ? this._buildDroneContextActions({ type: 'combatant', actor, cell: actor.position })
      : [];
    const entries = [];

    for (const node of companionAbilityNodes(definition, this.companionRun)) {
      const rule = COMPANION_ACTION_RULES[node.effect];
      if (!rule) continue;
      const targets = [rule.target];
      const cost = this._droneActionCost?.(node.effect, rule.ap) ?? rule.ap;
      let enabled = actor.ap >= cost;
      let reason = enabled ? '' : `NEED ${cost} AP`;
      const cooldown = this.droneCombatState?.cooldowns?.get?.(node.effect) ?? 0;

      if (enabled && rule.cooldown && cooldown > 0) {
        enabled = false;
        reason = `COOLDOWN ${cooldown}`;
      } else if (enabled && rule.once && this.droneCombatState?.usedAbilities?.has?.(node.effect)) {
        enabled = false;
        reason = 'SPENT';
      } else if (enabled && node.effect.startsWith('deploy-') &&
          (this.combatDeployables?.length ?? 0) >= (this._droneDeployableLimit?.() ?? 1)) {
        enabled = false;
        reason = 'RACK FULL';
      } else if (rule.target === 'self') {
        const action = selfActions.find((candidate) => candidate.effect === node.effect);
        enabled = Boolean(action?.enabled);
        reason = action?.reason ? String(action.reason).toUpperCase() : enabled ? '' : 'NOT READY';
      }

      const labels = targetLabels(targets);
      entries.push({
        id: `drone:${node.effect}`,
        ownerType: 'companion',
        abilityId: node.effect,
        name: rule.label,
        targets,
        targetLabel: labels.compact,
        targetPrompt: labels.prompt,
        cost,
        range: this._droneActionRange?.(node.effect, rule.range) ?? rule.range,
        enabled,
        reason,
        detail: enabled ? `${cost} AP ${labels.compact}` : reason
      });
    }
    return entries;
  }

  _handleCombatAbilityTrayClick(click) {
    const tray = this._buildCombatAbilityTray();
    const hit = combatAbilityAt(click, tray);
    if (!hit) return false;
    if (click.button !== 0) {
      this._clearCombatAbilityTargeting();
      return true;
    }
    if (hit.kind === 'page') {
      const pageCount = combatAbilityPageCount(tray);
      this.combatAbilityTrayPage = (tray.page + hit.direction + pageCount) % pageCount;
      return true;
    }
    if (hit.kind !== 'ability') return true;

    const entry = hit.entry;
    this.contextActionMenu = null;
    if (this.combatAbilityTargeting?.abilityId === entry.abilityId &&
        this.combatAbilityTargeting?.ownerType === entry.ownerType) {
      this._clearCombatAbilityTargeting();
      return true;
    }
    if (entry.enabled === false) {
      if (entry.reason) this._log(entry.reason);
      return true;
    }

    const actor = this._activeControlledActor?.() ?? this.player;
    if (entry.targets.length === 1 && entry.targets[0] === 'self') {
      const action = this._combatAbilityActionForTarget(entry, this._combatAbilitySelfTarget(actor));
      if (!action) {
        this._log('Ability is not ready.');
        return true;
      }
      if (action.enabled === false) {
        if (action.reason) this._log(action.reason);
        return true;
      }
      this._clearCombatAbilityTargeting();
      this._executeCombatAbilityAction(entry, action);
      return true;
    }

    this.combatAbilityTargeting = {
      actorId: actor.id,
      ownerType: entry.ownerType,
      abilityId: entry.abilityId
    };
    return true;
  }

  _handleCombatAbilityTargetClick(click) {
    const actor = this._activeControlledActor?.() ?? this.player;
    const entry = this._combatAbilityTargetingEntry(actor);
    if (!entry) {
      if (this.combatAbilityTargeting) this._clearCombatAbilityTargeting();
      return false;
    }
    if (click.button === 2) {
      this._clearCombatAbilityTargeting();
      return true;
    }
    if (click.button !== 0 || click.y >= VIEWPORT_HEIGHT) return true;

    const cell = this.renderer.toGrid(click.x, click.y);
    if (!this.grid.isInside(cell.x, cell.y)) return true;
    const target = this._interactionTargetAtCell(cell, 'combat');
    const action = this._combatAbilityActionForTarget(entry, target);
    if (!action) {
      this._log(combatAbilityInstruction(entry));
      return true;
    }
    if (action.enabled === false) {
      if (action.reason) this._log(action.reason);
      return true;
    }

    this._clearCombatAbilityTargeting();
    this._executeCombatAbilityAction(entry, action);
    return true;
  }

  _executeCombatAbilityAction(entry, action) {
    return entry.ownerType === 'companion'
      ? this._executeDroneAction(action)
      : this._executeContextAction(action);
  }

  _combatAbilityActionForTarget(entry, target, options = {}) {
    if (!entry || !target) return null;
    if (entry.ownerType === 'companion') {
      return this._buildDroneContextActions?.(target)
        ?.find((action) => action.effect === entry.abilityId) ?? null;
    }
    const actions = this._techniqueActionsForTarget?.(target, options)
      ?? this._contextActionsForTarget?.(target)
      ?? [];
    return actions.find((action) => action.techniqueId === entry.abilityId) ?? null;
  }

  _combatAbilitySelfTarget(actor) {
    return actor?.type === 'companion'
      ? { type: 'combatant', actor, cell: actor.position }
      : { type: 'self', actor, cell: actor.position };
  }

  _combatAbilityTargetingEntry(actor = null, entries = null) {
    const targeting = this.combatAbilityTargeting;
    const controlled = actor ?? this._activeControlledActor?.() ?? this.player;
    if (!targeting || !controlled || targeting.actorId !== controlled.id) return null;
    const available = entries ?? this._combatAbilityEntriesFor(controlled);
    return available.find((entry) =>
      entry.ownerType === targeting.ownerType && entry.abilityId === targeting.abilityId
    ) ?? null;
  }

  _combatAbilityTargetCells() {
    const actor = this._activeControlledActor?.() ?? this.player;
    const entry = this._combatAbilityTargetingEntry(actor);
    if (!entry || !Number.isFinite(entry.range) || entry.range < 1) return null;
    const valid = new Set();
    const invalid = new Set();
    const range = Math.max(1, Math.trunc(entry.range));
    const actionOptions = {};
    if (entry.ownerType === 'player') {
      this._refreshPlayerAttacks?.();
      actionOptions.refreshAttacks = false;
      actionOptions.occupied = this._occupiedSet?.(this.player) ?? new Set();
    }

    for (let y = actor.y - range; y <= actor.y + range; y += 1) {
      for (let x = actor.x - range; x <= actor.x + range; x += 1) {
        if (!this.grid.isInside(x, y) || chebyshev(actor.position, { x, y }) > range) continue;
        if (this._isCellHidden?.(x, y)) continue;
        const target = this._interactionTargetAtCell({ x, y }, 'combat');
        const action = this._combatAbilityActionForTarget(entry, target, actionOptions);
        if (!action) continue;
        const key = `${x},${y}`;
        if (action.enabled === false) invalid.add(key);
        else valid.add(key);
      }
    }
    return { valid, invalid };
  }

  _combatAbilityCursorInfo(point) {
    if (this.mode !== 'combat' || !point) return null;
    const tray = this._buildCombatAbilityTray();
    const hit = combatAbilityAt(point, tray);
    if (hit?.kind === 'ability') {
      return {
        x: point.x,
        y: point.y,
        state: 'ui',
        text: `${hit.entry.name}: ${hit.entry.detail}`
      };
    }
    if (hit) return { x: point.x, y: point.y, state: 'ui', text: null };

    const actor = this._activeControlledActor?.() ?? this.player;
    const entry = this._combatAbilityTargetingEntry(actor);
    if (!entry || point.y >= VIEWPORT_HEIGHT) return null;
    const cell = this.renderer.toGrid(point.x, point.y);
    if (!this.grid.isInside(cell.x, cell.y)) {
      return { x: point.x, y: point.y, state: 'blocked', text: entry.targetPrompt };
    }
    const target = this._interactionTargetAtCell(cell, 'combat');
    const action = this._combatAbilityActionForTarget(entry, target);
    if (!action) {
      return { x: point.x, y: point.y, state: 'blocked', text: `SELECT ${entry.targetPrompt}` };
    }
    if (action.enabled === false) {
      return {
        x: point.x,
        y: point.y,
        state: 'blocked',
        text: action.reason ? String(action.reason).toUpperCase() : 'NOT READY'
      };
    }
    const targetName = action.target?.name ?? (action.cell ? `TILE ${action.cell.x},${action.cell.y}` : entry.targetPrompt);
    return { x: point.x, y: point.y, state: action.target ? 'attack' : 'use', text: `${entry.name}: ${targetName}` };
  }

  _clearCombatAbilityTargeting({ resetPage = false } = {}) {
    this.combatAbilityTargeting = null;
    if (resetPage) this.combatAbilityTrayPage = 0;
  }
}

function normalizedTargets(value, fallback) {
  const requested = Array.isArray(value) && value.length > 0 ? value : fallback;
  const unique = new Set(requested.filter((target) => TARGET_ORDER.includes(target)));
  return TARGET_ORDER.filter((target) => unique.has(target));
}

function targetLabels(targets) {
  const labels = targets.map((target) => TARGET_LABELS[target] ?? String(target).toUpperCase());
  return {
    compact: labels.join('/'),
    prompt: labels.join(' OR ')
  };
}

function playerFirearm(actor) {
  return actor?.getAttack?.('sidearm')
    ?? (actor?.attacks ?? []).find((attack) => isRangedAttack(attack))
    ?? null;
}

function playerMelee(actor) {
  return actor?.getAttack?.('melee')
    ?? (actor?.attacks ?? []).find((attack) => isMeleeAttack(attack))
    ?? null;
}

function playerTechniqueRange(techniqueId, firearm) {
  if (techniqueId === 'aimed-shot') return firearm?.range ?? 0;
  if (techniqueId === 'overwatch') return firearm?.range ?? TECHNIQUE_RANGES.overwatch;
  return TECHNIQUE_RANGES[techniqueId] ?? 0;
}

function combatAbilityInstruction(entry) {
  const key = entry.targets.join(',');
  if (key === 'enemy') return 'Choose an enemy.';
  if (key === 'ally') return 'Choose the agent or attendant.';
  if (key === 'tile') return 'Choose a tile.';
  if (key === 'enemy,tile') return 'Choose an enemy or tile.';
  return `Choose ${entry.targetPrompt.toLowerCase()}.`;
}

export function installGameCombatAbilityRuntime(GameClass) {
  installGameMethods(GameClass, GameCombatAbilityRuntime);
}
