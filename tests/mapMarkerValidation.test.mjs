import assert from 'node:assert/strict';

import { validateLevel } from '../scripts/validation/levelValidator.mjs';
import { errors } from '../scripts/validation/validationContext.mjs';

function baseLevel(overrides = {}) {
  return {
    id: 'map-marker-test',
    name: 'Map Marker Test',
    intro: 'Test intro.',
    width: 5,
    height: 5,
    tileSize: 64,
    tiles: [
      '#####',
      '#...#',
      '#...#',
      '#...#',
      '#####'
    ],
    legend: {
      '#': { kind: 'wall', walkable: false },
      '.': { kind: 'floor', walkable: true }
    },
    spawns: {
      player: { x: 1, y: 1 },
      enemies: [],
      npcs: []
    },
    objects: [],
    ...overrides
  };
}

errors.length = 0;
validateLevel('/tmp/map-marker-valid.json', baseLevel({
  spawns: {
    player: { x: 1, y: 1 },
    enemies: [
      { id: 'red-tithe-cutthroat', x: 2, y: 1, mapMarker: false }
    ],
    npcs: [
      { actor: 'mara-vey', x: 3, y: 1, mapMarker: { kind: 'dialogue', reveal: 'always' } }
    ]
  },
  objects: [
    { kind: 'paper-scraps', x: 1, y: 2, mapMarker: { label: 'Warden Safe', kind: 'locked' } }
  ],
  combatTriggers: [
    { id: 'test-trigger', encounter: 'test', x: 2, y: 2, mapMarker: { kind: 'danger' } }
  ]
}));
assert.deepEqual(errors, []);

errors.length = 0;
validateLevel('/tmp/map-marker-invalid.json', baseLevel({
  objects: [
    { kind: 'paper-scraps', x: 1, y: 2, mapMarker: { label: '', kind: 'bad', reveal: 'later' } },
    { kind: 'paper-scraps', x: 2, y: 2, mapMarker: true }
  ]
}));
assert.equal(errors.some((error) => error.includes('objects[].mapMarker.kind')), true);
assert.equal(errors.some((error) => error.includes('objects[].mapMarker.reveal')), true);
assert.equal(errors.some((error) => error.includes('objects[].mapMarker.label')), true);
assert.equal(errors.some((error) => error.includes('must be false or an object')), true);
