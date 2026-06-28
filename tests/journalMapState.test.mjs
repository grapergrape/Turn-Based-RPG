import assert from 'node:assert/strict';

import {
  buildJournalMapState,
  revealExploredMapCells
} from '../src/core/JournalMapState.js';
import { Grid } from '../src/world/Grid.js';

const mapData = {
  id: 'test-map',
  name: 'Test Map',
  width: 6,
  height: 5,
  tileSize: 64,
  tiles: [
    '######',
    '#....#',
    '#....#',
    '#....#',
    '######'
  ],
  legend: {
    '#': { kind: 'wall', walkable: false },
    '.': { kind: 'floor', walkable: true }
  }
};

const grid = new Grid(mapData);
grid.addBlocked(2, 2);

const hiddenTiles = new Set(['3,2']);
const revealed = revealExploredMapCells({
  grid,
  origin: { x: 2, y: 2 },
  hiddenTiles,
  radius: 1
});

assert.equal(revealed.has('2,2'), true);
assert.equal(revealed.has('1,1'), true);
assert.equal(revealed.has('3,2'), false);

const exploredCells = new Set([...revealed, '1,3', '2,1']);
const state = buildJournalMapState({
  grid,
  level: { id: mapData.id, name: mapData.name },
  player: { name: 'Mara Vey', position: { x: 2, y: 2 } },
  exploredCells,
  hiddenTiles,
  questDefs: {
    test: { id: 'test', title: 'Test Writ' }
  },
  isQuestUpdateActive: (update) => update?.quest === 'test' && update.stage === 'next',
  objectName: (object) => object.name ?? object.kind ?? 'Object',
  interactables: [
    {
      id: 'quest-object',
      kind: 'paper-scraps',
      name: 'Ledger',
      x: 1,
      y: 1,
      interact: { questUpdate: { quest: 'test', stage: 'next' } }
    },
    {
      id: 'unseen-dialogue',
      kind: 'paper-scraps',
      name: 'Unseen Note',
      x: 4,
      y: 3,
      interact: { dialogue: 'test-dialogue' }
    },
    {
      id: 'hidden-search',
      kind: 'paper-scraps',
      name: 'Hidden Search',
      x: 2,
      y: 2,
      mapMarker: false,
      interact: { search: { methods: [] } }
    },
    {
      id: 'search-object',
      kind: 'paper-scraps',
      name: 'Searchable Note',
      x: 1,
      y: 2,
      interact: { search: { methods: [] } }
    },
    {
      id: 'secret-object',
      kind: 'paper-scraps',
      name: 'Secret Note',
      x: 3,
      y: 2,
      mapMarker: { kind: 'note', label: 'Secret Note', reveal: 'always' }
    }
  ],
  actors: [
    {
      id: 'talker',
      name: 'Talker',
      position: { x: 1, y: 3 },
      dialogue: 'talker-dialogue'
    }
  ],
  combatTriggers: [
    {
      id: 'fight-trigger',
      encounter: 'fight',
      x: 2,
      y: 1
    },
    {
      id: 'cleared-trigger',
      encounter: 'cleared',
      x: 1,
      y: 2,
      mapMarker: { kind: 'danger', label: 'Cleared Risk', reveal: 'always' }
    }
  ],
  resolveEncounterId: (id) => id,
  encounterHasLiving: (id) => id === 'fight'
});

assert.equal(state.width, 6);
assert.equal(state.height, 5);
assert.equal(state.cells.find((cell) => cell.key === '2,2').type, 'blocked');
assert.equal(state.cells.find((cell) => cell.key === '3,2').hidden, true);

const markerKinds = new Set(state.markers.map((marker) => marker.kind));
assert.equal(markerKinds.has('player'), true);
assert.equal(markerKinds.has('quest'), true);
assert.equal(markerKinds.has('search'), true);
assert.equal(markerKinds.has('dialogue'), true);
assert.equal(markerKinds.has('danger'), true);
assert.equal(state.markers.some((marker) => marker.label === 'Unseen Note'), false);
assert.equal(state.markers.some((marker) => marker.label === 'Hidden Search'), false);
assert.equal(state.markers.some((marker) => marker.label === 'Secret Note'), false);
assert.equal(state.markers.some((marker) => marker.label === 'Cleared Risk'), false);
