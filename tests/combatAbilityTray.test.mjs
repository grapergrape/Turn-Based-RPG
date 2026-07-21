import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { drawCombatAbilityTray } from '../src/render/ui/CombatAbilityRenderer.js';
import {
  combatAbilityAt,
  combatAbilityCardBox,
  combatAbilityNavBox,
  combatAbilityTrayBox,
  visibleCombatAbilities
} from '../src/ui/combatAbilityLayout.js';

function pointIn(box) {
  return { x: box.x + Math.floor(box.w / 2), y: box.y + Math.floor(box.h / 2), button: 0 };
}

function playerActor() {
  const actor = {
    id: 'player',
    type: 'player',
    x: 2,
    y: 2,
    position: { x: 2, y: 2 },
    pxOffset: { x: 0, y: 0 },
    ap: 6,
    hp: 7,
    maxHp: 10,
    isDead: false,
    progression: { techniques: ['aimed-shot', 'stabilize', 'trip-mine'] },
    attacks: [{ id: 'sidearm', name: 'Sidearm', apCost: 3, damage: 4, range: 5, mode: 'ranged' }],
    getAttack(id) {
      return id === 'sidearm' ? this.attacks[0] : null;
    }
  };
  return actor;
}

{
  const player = playerActor();
  const enemy = { id: 'enemy', type: 'enemy', name: 'Road Guard', x: 3, y: 2, position: { x: 3, y: 2 }, isDead: false };
  const used = [];
  const logs = [];
  const context = Object.assign(Object.create(Game.prototype), {
    mode: 'combat',
    uiScreen: null,
    moving: null,
    player,
    enemies: [enemy],
    techniqueDefs: {
      'aimed-shot': { id: 'aimed-shot', name: 'Aimed Shot', type: 'active', targets: ['enemy'] },
      stabilize: { id: 'stabilize', name: 'Stabilize', type: 'active', targets: ['self'] },
      'trip-mine': { id: 'trip-mine', name: 'Trip Mine', type: 'active', targets: ['tile'] }
    },
    turnManager: { isPlayerTurn: () => true, current: () => player },
    renderer: {
      toScreen: () => ({ x: 320, y: 190 }),
      toGrid: () => ({ x: 3, y: 2 })
    },
    grid: {
      isInside: (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8,
      isWalkable: () => true
    },
    _activeControlledActor: () => player,
    _isCellHidden: () => false,
    _interactionTargetAtCell(cell) {
      if (cell.x === enemy.x && cell.y === enemy.y) return { type: 'combatant', actor: enemy, cell };
      if (cell.x === player.x && cell.y === player.y) return { type: 'self', actor: player, cell };
      return { type: 'move', cell };
    },
    _contextActionsForTarget(target) {
      if (target.type === 'self') {
        return [{ id: 'technique:stabilize', kind: 'technique', techniqueId: 'stabilize', target: player, enabled: true }];
      }
      if (target.type === 'combatant') {
        return [{ id: 'technique:aimed-shot', kind: 'technique', techniqueId: 'aimed-shot', target: enemy, enabled: true }];
      }
      if (target.type === 'move') {
        return [{ id: 'technique:trip-mine', kind: 'technique', techniqueId: 'trip-mine', cell: target.cell, enabled: true }];
      }
      return [];
    },
    _executeContextAction: (action) => used.push(action.id),
    _log: (line) => logs.push(line),
    contextActionMenu: null,
    combatAbilityTargeting: null,
    combatAbilityTrayPage: 0
  });

  let tray = context._buildCombatAbilityTray();
  assert.deepEqual(tray.entries.map((entry) => entry.name), ['Aimed Shot', 'Stabilize', 'Trip Mine']);
  assert.equal(tray.entries[0].detail, '4 AP ENEMY', 'aimed shot shows its complete AP cost');
  assert.equal(tray.entries[1].detail, '2 AP SELF');

  assert.equal(context._handleCombatAbilityTrayClick(pointIn(combatAbilityCardBox(tray, 0))), true);
  assert.equal(context.combatAbilityTargeting.abilityId, 'aimed-shot', 'enemy active enters target mode');
  assert.equal(context._handleCombatAbilityTargetClick({ x: 500, y: 200, button: 0 }), true);
  assert.deepEqual(used, ['technique:aimed-shot']);
  assert.equal(context.combatAbilityTargeting, null);

  tray = context._buildCombatAbilityTray();
  assert.equal(context._handleCombatAbilityTrayClick(pointIn(combatAbilityCardBox(tray, 1))), true);
  assert.deepEqual(used, ['technique:aimed-shot', 'technique:stabilize'], 'self active executes from its card');

  tray = context._buildCombatAbilityTray();
  context._handleCombatAbilityTrayClick(pointIn(combatAbilityCardBox(tray, 2)));
  assert.equal(context.combatAbilityTargeting.abilityId, 'trip-mine');
  assert.equal(context._handleCombatAbilityTargetClick({ x: 0, y: 0, button: 2 }), true);
  assert.equal(context.combatAbilityTargeting, null, 'right click cancels ability targeting');

  tray = context._buildCombatAbilityTray();
  context._handleCombatAbilityTrayClick(pointIn(combatAbilityCardBox(tray, 2)));
  const targets = context._combatAbilityTargetCells();
  assert.ok(targets.valid.has('1,1'), 'tile active exposes valid target cells');
  assert.equal(logs.length, 0);
}

{
  const player = playerActor();
  const drone = {
    id: 'drone', type: 'companion', control: 'player', team: 'player', name: 'Pip',
    x: 2, y: 3, position: { x: 2, y: 3 }, pxOffset: { x: 0, y: 0 }, ap: 6, isDead: false
  };
  const enemy = { id: 'enemy', type: 'enemy', name: 'Choir Guard', x: 3, y: 3, position: { x: 3, y: 3 } };
  const used = [];
  const definition = {
    branches: [{ id: 'test', name: 'Test', nodes: [
      { id: 'guard-node', name: 'Guard Node', effect: 'ability-guard-stance' },
      { id: 'beam-node', name: 'Beam Node', effect: 'ability-marking-beam' }
    ] }]
  };
  const context = Object.assign(Object.create(Game.prototype), {
    mode: 'combat', uiScreen: null, moving: null, player, companions: [drone], enemies: [enemy],
    companionRun: { upgrades: ['guard-node', 'beam-node'] },
    droneCombatState: { cooldowns: new Map(), usedAbilities: new Set() },
    combatDeployables: [],
    turnManager: { isPlayerTurn: () => true, current: () => drone },
    renderer: { toScreen: () => ({ x: 320, y: 190 }), toGrid: () => ({ x: 3, y: 3 }) },
    grid: { isInside: () => true },
    _activeControlledActor: () => drone,
    _companionDefinition: () => definition,
    _droneActionCost: (_effect, cost) => cost,
    _droneActionRange: (_effect, range) => range,
    _droneDeployableLimit: () => 1,
    _interactionTargetAtCell: (cell) => ({ type: 'combatant', actor: enemy, cell }),
    _buildDroneContextActions(target) {
      if (target.actor === drone) {
        return [{ id: 'drone:ability-guard-stance', kind: 'drone-action', effect: 'ability-guard-stance', target: drone, enabled: true }];
      }
      return [{ id: 'drone:ability-marking-beam', kind: 'drone-action', effect: 'ability-marking-beam', target: enemy, enabled: true }];
    },
    _executeDroneAction: (action) => { used.push(action.effect); return true; },
    _log() {},
    contextActionMenu: null,
    combatAbilityTargeting: null,
    combatAbilityTrayPage: 0
  });

  let tray = context._buildCombatAbilityTray();
  assert.deepEqual(tray.entries.map((entry) => entry.name), ['Guard Stance', 'Marking Beam']);
  context._handleCombatAbilityTrayClick(pointIn(combatAbilityCardBox(tray, 0)));
  assert.deepEqual(used, ['ability-guard-stance']);

  tray = context._buildCombatAbilityTray();
  context._handleCombatAbilityTrayClick(pointIn(combatAbilityCardBox(tray, 1)));
  assert.equal(context.combatAbilityTargeting.abilityId, 'ability-marking-beam');
  context._handleCombatAbilityTargetClick({ x: 500, y: 200, button: 0 });
  assert.deepEqual(used, ['ability-guard-stance', 'ability-marking-beam']);
}

{
  const tray = {
    anchor: { x: 320, y: 190 },
    page: 0,
    entries: Array.from({ length: 6 }, (_, index) => ({
      id: `ability-${index}`,
      name: `Ability ${index + 1}`,
      detail: '2 AP ENEMY',
      enabled: true
    }))
  };
  assert.equal(visibleCombatAbilities(tray).length, 4);
  const box = combatAbilityTrayBox(tray);
  assert.ok(box.x >= 4 && box.y >= 4 && box.x + box.w <= 636 && box.y + box.h <= 380);
  assert.deepEqual(combatAbilityAt(pointIn(combatAbilityNavBox(tray, 1)), tray), { kind: 'page', direction: 1 });

  const labels = [];
  drawCombatAbilityTray({}, { ...tray, prompt: 'AIMED SHOT: SELECT ENEMY' }, {
    rect() {},
    detailRect() {},
    text(_ctx, value) { labels.push(value); },
    clip(value, length) { return String(value).slice(0, length); }
  }, pointIn(combatAbilityCardBox(tray, 0)));
  assert.ok(labels.includes('AIMED SHOT: SELECT ENEMY'));
  assert.ok(labels.includes('Ability 1'));
  assert.ok(labels.includes('2 AP ENEMY'));
}

console.log('combatAbilityTray: player, drone, targeting, paging, and hard-pixel rendering passed');
