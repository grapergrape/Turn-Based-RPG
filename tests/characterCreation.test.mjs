import assert from 'node:assert/strict';

import {
  CHARACTER_CUSTOMIZATION_FIELDS,
  PRIMARY_ASSIGNMENT_BASE,
  PRIMARY_ASSIGNMENT_CAP,
  PRIMARY_ASSIGNMENT_FLAG,
  PRIMARY_ASSIGNMENT_POINTS,
  applyCustomizationText,
  changeCustomizationOption,
  changePrimaryAssignmentValue,
  characterNameIsValid,
  createCustomizationState,
  createPrimaryAssignmentState,
  customizationCanConfirm,
  customizationResult,
  primaryAssignmentCanConfirm,
  primaryAssignmentResult
} from '../src/core/CharacterCreation.js';
import { Game } from '../src/core/Game.js';
import { Entity } from '../src/entities/Entity.js';

function mockCanvas() {
  return {
    width: 640,
    height: 480,
    style: {},
    addEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 640, height: 480 }; },
    getContext() { return mockCtx(); }
  };
}

function mockCtx() {
  return new Proxy({ imageSmoothingEnabled: false }, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return () => {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  });
}

globalThis.window = { addEventListener() {} };
globalThis.document = { createElement: () => mockCanvas() };

function buildGateGame() {
  const game = new Game({
    canvas: mockCanvas(),
    levelPath: './data/levels/ash_chapel_breach.json',
    atlas: {},
    statusElement: null,
    bootOptions: { skipIntro: true }
  });
  game.ready = true;
  game.anim = { tick: 0, bob: 0, flicker: 0, pulse: 0 };
  game.areaTitleTimer = 0;
  game.effects = [];
  game.speakingProps = [];
  game.enemies = [];
  game.npcs = [];
  game.groundItems = [];
  game.moving = null;
  game.pathQueue = [];
  game.mode = 'intro';
  game.uiScreen = null;
  game.log = [];
  game.flags = new Set();
  game.inventory = { equipmentSnapshot: () => ({}), itemDefs: {} };
  game.player = new Entity({
    id: 'mara-vey',
    name: 'Censure Agent',
    type: 'player',
    stats: { hp: 14, maxHp: 14, actionPoints: 6 },
    progression: { level: 1, xp: 0, build: 'field-agent' }
  });
  game.briefing = [['Page']];
  game.briefingTitle = 'FIELD WRIT';
  game.briefingPage = 0;
  game.briefingNextPrompt = 'ENTER CONTINUE';
  game.briefingLastPrompt = 'ENTER CONTINUE';
  game.briefingSkipPrompt = 'ESC SKIP';
  game.briefingMarksIntro = true;
  game.input = {
    consume: () => ['confirm'],
    consumeClick: () => null,
    consumeText: () => []
  };
  return game;
}

function namedCustomizationState() {
  return {
    ...createCustomizationState(),
    name: 'Ruth Faber'
  };
}

{
  assert.equal(characterNameIsValid('Ruth Faber'), true);
  assert.equal(characterNameIsValid("Tobias D'Rufus"), true);
  assert.equal(characterNameIsValid('A'), false);
  assert.equal(characterNameIsValid('Bad_Name'), false);
  assert.equal(characterNameIsValid('This Name Is Far Too Long'), false);
}

{
  const breast = CHARACTER_CUSTOMIZATION_FIELDS.find((field) => field.id === 'breastSize');
  const groin = CHARACTER_CUSTOMIZATION_FIELDS.find((field) => field.id === 'penisSize');
  assert.equal(breast.label, 'Breast Scale');
  assert.equal(groin.label, 'Groin Scale');
  assert.deepEqual(
    CHARACTER_CUSTOMIZATION_FIELDS.map((field) => field.id),
    [
      'name',
      'genderModel',
      'skinTone',
      'age',
      'faceShape',
      'faceMark',
      'hairColor',
      'hairStyle',
      'facialHair',
      'bodyType',
      'stature',
      'posture',
      'anatomy',
      'breastSize',
      'penisSize'
    ]
  );
  assert.equal(CHARACTER_CUSTOMIZATION_FIELDS.find((field) => field.id === 'hairStyle').options.length, 8);
  assert.equal(CHARACTER_CUSTOMIZATION_FIELDS.find((field) => field.id === 'facialHair').options.length, 6);
  assert.equal(CHARACTER_CUSTOMIZATION_FIELDS.find((field) => field.id === 'faceMark').options.length, 5);
}

{
  let state = createCustomizationState({ name: 'Saved Agent' });
  assert.equal(state.name, '');
  assert.equal(customizationCanConfirm(state), false);
  state = applyCustomizationText(state, [
    { type: 'char', value: 'R' },
    { type: 'char', value: 'u' },
    { type: 'char', value: 't' },
    { type: 'char', value: 'h' }
  ]);
  const result = customizationResult(state);
  assert.equal(result.name, 'Ruth');
  assert.equal(result.appearance.genderModel, 'female');
  assert.equal(result.appearance.bodyType, 'medium');
  assert.equal(result.appearance.stature, 'average');
  assert.equal(result.appearance.posture, 'upright');
  assert.equal(result.appearance.age, 'adult');
  assert.equal(result.appearance.faceShape, 'oval');
  assert.equal(result.appearance.faceMark, 'none');
  assert.equal(result.appearance.breastSize, 5);
  assert.equal(result.appearance.penisSize, 0);
}

{
  assert.throws(
    () => customizationResult(createCustomizationState()),
    /Name must be 2 to 18 letters\./
  );
}

{
  let state = namedCustomizationState();
  const change = (fieldId, amount) => {
    state.selectedIndex = CHARACTER_CUSTOMIZATION_FIELDS.findIndex((field) => field.id === fieldId);
    state = changeCustomizationOption(state, amount);
  };
  change('age', 1);
  change('faceShape', 1);
  change('faceMark', 3);
  change('hairStyle', 4);
  change('facialHair', 3);
  change('bodyType', 1);
  change('stature', 1);
  change('posture', 1);
  const result = customizationResult(state);
  assert.equal(result.appearance.age, 'weathered');
  assert.equal(result.appearance.faceShape, 'broad');
  assert.equal(result.appearance.faceMark, 'burn-scar');
  assert.equal(result.appearance.hairStyle, 'braid');
  assert.equal(result.appearance.facialHair, 'goatee');
  assert.equal(result.appearance.bodyType, 'stocky');
  assert.equal(result.appearance.stature, 'tall');
  assert.equal(result.appearance.posture, 'guarded');
}

{
  const base = namedCustomizationState();
  for (const field of CHARACTER_CUSTOMIZATION_FIELDS.filter((entry) => entry.kind === 'option')) {
    for (const option of field.options) {
      const result = customizationResult({
        ...base,
        appearance: { ...base.appearance, [field.id]: option.id }
      });
      assert.equal(result.appearance[field.id], option.id, `${field.id} should preserve ${option.id}`);
    }
  }
}

{
  let state = namedCustomizationState();
  state.selectedIndex = CHARACTER_CUSTOMIZATION_FIELDS.findIndex((field) => field.id === 'breastSize');
  state = changeCustomizationOption(state, 1);
  assert.equal(state.appearance.breastSize, 6);
  state = changeCustomizationOption(state, -10);
  assert.equal(state.appearance.breastSize, 0);
  const result = customizationResult(state);
  assert.equal(result.appearance.breastSize, 0);
}

{
  let state = namedCustomizationState();
  assert.equal(state.appearance.genderModel, 'female');
  assert.equal(state.appearance.anatomy, 'vulva');
  state.selectedIndex = CHARACTER_CUSTOMIZATION_FIELDS.findIndex((field) => field.id === 'penisSize');
  state = changeCustomizationOption(state, 1);
  assert.equal(state.appearance.genderModel, 'female');
  assert.equal(state.appearance.anatomy, 'penis');
  assert.equal(state.appearance.penisSize, 1);
}

{
  let state = namedCustomizationState();
  state.selectedIndex = CHARACTER_CUSTOMIZATION_FIELDS.findIndex((field) => field.id === 'genderModel');
  state = changeCustomizationOption(state, 1);
  assert.equal(state.appearance.genderModel, 'male');
  assert.equal(state.appearance.breastSize, 1);
  assert.equal(state.appearance.penisSize, 5);
}

{
  let state = createPrimaryAssignmentState();
  assert.equal(state.pointsRemaining, PRIMARY_ASSIGNMENT_POINTS);
  assert.ok(Object.values(state.values).every((value) => value === PRIMARY_ASSIGNMENT_BASE));
  for (let i = 0; i < 8; i += 1) state = changePrimaryAssignmentValue(state, 1);
  assert.equal(state.values.body, PRIMARY_ASSIGNMENT_CAP);
  assert.equal(state.pointsRemaining, PRIMARY_ASSIGNMENT_POINTS - 4);
  assert.equal(primaryAssignmentCanConfirm(state), false);
}

{
  const game = buildGateGame();
  game.briefingAfter = { openScreen: 'character-customization' };
  game.update(0);
  assert.equal(game.uiScreen, 'character-customization');
  assert.equal(game.mode, 'explore');
}

{
  const game = buildGateGame();
  game.briefingMarksIntro = false;
  game.briefingAfter = { openScreen: 'primary-assignment' };
  game.update(0);
  assert.equal(game.uiScreen, 'primary-assignment');
  assert.equal(game.primaryAssignment.pointsRemaining, PRIMARY_ASSIGNMENT_POINTS);
}

{
  const game = buildGateGame();
  game.mode = 'explore';
  game.uiScreen = 'character-customization';
  game.characterCreation = createCustomizationState(game.player);
  game.input = {
    consume: () => ['interact'],
    consumeClick: () => null,
    consumeText: () => [{ type: 'char', value: 'e' }]
  };
  game.update(0);
  assert.equal(game.uiScreen, 'character-customization');
  assert.equal(game.player.name, 'Censure Agent');
  assert.equal(game.characterCreation.name, 'e');
}

{
  const game = buildGateGame();
  const object = {
    id: 'fouled-font',
    kind: 'fouled-font',
    x: 3,
    y: 3,
    interact: { type: 'note', log: 'Font.' }
  };
  let targetSeen = null;
  game.mode = 'explore';
  game.uiScreen = null;
  game.player.moveTo(2, 2);
  game.grid = {
    isInside: (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8,
    isWalkable: () => true
  };
  game.level = { interactables: [object] };
  game.hiddenTiles = new Set();
  game._executeExploreTarget = (target) => { targetSeen = target; };
  game.input = {
    consume: () => ['interact'],
    consumeClick: () => null,
    consumeText: () => []
  };
  game.update(0);
  assert.equal(targetSeen?.type, 'object');
  assert.equal(targetSeen?.object, object);
}

{
  const game = buildGateGame();
  game.mode = 'explore';
  game.uiScreen = 'primary-assignment';
  game.primaryAssignment = createPrimaryAssignmentState(game.player);
  game.primaryAssignment.values = {
    body: 7,
    agility: 7,
    eye: 6,
    intelligence: 3,
    religion: 3,
    voice: 3,
    nerve: 3
  };
  game.primaryAssignment.pointsRemaining = 0;
  game.input = {
    consume: () => ['confirm'],
    consumeClick: () => null,
    consumeText: () => []
  };
  game.update(0);
  const assigned = primaryAssignmentResult({ values: game.player.progression.basePrimaries });
  assert.equal(game.flags.has(PRIMARY_ASSIGNMENT_FLAG), true);
  assert.equal(game.player.progression.primaryPoints, 0);
  assert.deepEqual(assigned, game.player.progression.primaries);
  assert.equal(game.uiScreen, null);
}
