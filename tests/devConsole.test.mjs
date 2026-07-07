import assert from 'node:assert/strict';

import { devConsoleEnabled, installDevConsole } from '../src/core/DevConsole.js';
import { Entity } from '../src/entities/Entity.js';

function makeGame() {
  const player = new Entity({
    id: 'mara-vey',
    name: 'Mara Vey',
    type: 'player',
    stats: { hp: 20, maxHp: 20, actionPoints: 6 },
    attacks: [{ id: 'melee', name: 'Knife', apCost: 2, damage: 3, range: 1 }],
    position: { x: 1, y: 1 },
    progression: { level: 1, build: 'field-agent' }
  });
  return {
    mode: 'explore',
    player,
    enemies: [],
    pathQueue: [],
    pendingExploreTarget: null,
    preCombatTarget: null,
    turnManager: { active: false },
    grid: {
      isInside: (x, y) => x >= 0 && y >= 0 && x < 6 && y < 6,
      isWalkable: (x, y) => x >= 0 && y >= 0 && x < 6 && y < 6
    },
    _refreshPlayerAttacks() {},
    _startCombat() {
      this.mode = 'combat';
    },
    _clearCombatTechniquesState() {}
  };
}

{
  assert.equal(devConsoleEnabled(new URL('http://localhost:4173/?playtest=1')), true);
  assert.equal(devConsoleEnabled(new URL('http://localhost:4173/')), false);
  assert.equal(devConsoleEnabled(new URL('https://example.com/?playtest=1')), false);
}

{
  const target = {};
  const api = installDevConsole(makeGame(), { enabled: true, target });

  assert.equal(target.hostDebug, api);
  assert.equal(api.game().player.name, 'Mara Vey');
  assert(api.builds().includes('breaker'));

  const created = api.createBuild('breaker', { level: 6 });
  assert.equal(created.player.build.id, 'breaker');
  assert.equal(created.player.level, 6);
  assert(created.player.techniques.includes('shove'));
  assert(created.player.topFields.some((field) => field.id === 'unarmed'));

  assert(api.createBuild('field-agent').player.techniques.includes('field-measure'));
  assert(api.createBuild('investigator').player.techniques.includes('case-file'));
  assert(api.createBuild('field-confessor').player.techniques.includes('stilling-litany'));
  assert(api.createBuild('engineer').player.techniques.includes('wire-snare'));
  assert(api.createBuild('purifier').player.techniques.includes('censure-spark'));

  const moved = api.teleport(2, 3);
  assert.deepEqual(moved.player.position, { x: 2, y: 3 });

  const combat = api.encounter('test');
  assert.equal(combat.mode, 'combat');
}

{
  const target = {};
  const api = installDevConsole(makeGame(), { enabled: false, target });

  assert.equal(api, null);
  assert.equal(target.hostDebug, undefined);
}
