import assert from 'node:assert/strict';

import {
  chooseCombatStartBark,
  combatStartBarkLines
} from '../src/combat/CombatBarks.js';

{
  const level = {
    combatStartBarks: [
      'Level line one.',
      'Level line two.'
    ]
  };
  const trigger = {
    combatStartBarks: [
      'Trigger line.'
    ]
  };

  assert.deepEqual(combatStartBarkLines({ level }), ['Level line one.', 'Level line two.']);
  assert.deepEqual(combatStartBarkLines({ level, trigger }), ['Trigger line.']);
}

{
  const first = { id: 'first', isDead: false };
  const second = { id: 'second', isDead: false };
  const picked = chooseCombatStartBark({
    combatants: [first, second],
    lines: ['Line A.', 'Line B.'],
    random: () => 0.99
  });

  assert.equal(picked.speaker, second);
  assert.equal(picked.line, 'Line B.');
}

{
  assert.equal(chooseCombatStartBark({
    combatants: [{ id: 'dead', isDead: true }],
    lines: ['Line.'],
    random: () => 0
  }), null);
  assert.equal(chooseCombatStartBark({
    combatants: [{ id: 'alive', isDead: false }],
    lines: [],
    random: () => 0
  }), null);
}
