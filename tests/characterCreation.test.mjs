import assert from 'node:assert/strict';

import {
  PRIMARY_ASSIGNMENT_BASE,
  PRIMARY_ASSIGNMENT_CAP,
  PRIMARY_ASSIGNMENT_FLAG,
  PRIMARY_ASSIGNMENT_POINTS,
  applyCustomizationText,
  changePrimaryAssignmentValue,
  characterNameIsValid,
  createCustomizationState,
  createPrimaryAssignmentState,
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
    name: 'Mara Vey',
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

{
  assert.equal(characterNameIsValid('Mara Vey'), true);
  assert.equal(characterNameIsValid("Oren D'Vale"), true);
  assert.equal(characterNameIsValid('A'), false);
  assert.equal(characterNameIsValid('Bad_Name'), false);
  assert.equal(characterNameIsValid('This Name Is Far Too Long'), false);
}

{
  let state = createCustomizationState({ name: 'Mara Vey' });
  state = applyCustomizationText({ ...state, name: '' }, [
    { type: 'char', value: 'J' },
    { type: 'char', value: 'o' },
    { type: 'char', value: ' ' },
    { type: 'char', value: 'V' },
    { type: 'char', value: 'e' },
    { type: 'char', value: 'y' }
  ]);
  const result = customizationResult(state);
  assert.equal(result.name, 'Jo Vey');
  assert.equal(result.appearance.genderModel, 'female');
  assert.equal(result.appearance.bodyType, 'medium');
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
  assert.equal(game.player.name, 'Mara Vey');
  assert.equal(game.characterCreation.name, 'Mara Veye');
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
