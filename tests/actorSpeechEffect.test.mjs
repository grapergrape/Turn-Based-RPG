import assert from 'node:assert/strict';

import { validateDialogueEffects } from '../scripts/validation/dialogueValidator.mjs';
import { errors } from '../scripts/validation/validationContext.mjs';
import { DialogueEffects } from '../src/core/DialogueEffects.js';
import { Game } from '../src/core/Game.js';
import { Entity } from '../src/entities/Entity.js';

function actor(id, name, position) {
  return new Entity({
    id,
    name,
    type: id === 'mara-vey' ? 'player' : 'npc',
    stats: { hp: 8, maxHp: 8, actionPoints: 0 },
    position
  });
}

function buildSpeechRuntime() {
  const player = actor('mara-vey', 'Test Agent', { x: 1, y: 1 });
  const speaker = actor('camp-refugee', 'Camp Refugee', { x: 3, y: 1 });
  speaker.spawnId = 'camp-refugee-west';
  speaker.ambient = ['Still no sign of the writ.'];
  speaker.ambientIndex = 0;
  speaker.ambientTimer = 0;

  const bystander = actor('camp-bystander', 'Camp Bystander', { x: 2, y: 2 });
  bystander.ambient = ['Keep the cookfire low.'];
  bystander.ambientIndex = 0;
  bystander.ambientTimer = 0;

  const game = Object.create(Game.prototype);
  Object.assign(game, {
    player,
    enemies: [],
    npcs: [speaker, bystander],
    speakingProps: [],
    flags: new Set(),
    hiddenTiles: new Set(),
    mode: 'explore',
    uiScreen: 'dialogue',
    dialogueActor: speaker,
    ambientSpeechCooldown: 0
  });
  game.dialogueEffects = new DialogueEffects(game);
  return { game, player, speaker, bystander };
}

{
  const { game, speaker } = buildSpeechRuntime();
  game.dialogueActor = null;
  speaker.speech = { text: 'The old line.', ttl: 1 };
  game.dialogueEffects.apply({
    actorSpeech: {
      target: 'camp-refugee-west',
      lines: ['The replacement line.']
    }
  });
  assert.equal(speaker.speech, null, 'a scripted queue replaces current speech');
  assert.deepEqual(speaker.actorSpeechQueue.lines, ['The replacement line.']);

  game.dialogueEffects.apply({
    actorSpeech: {
      target: 'camp-refugee-west',
      lines: ['The final line.']
    }
  });
  assert.deepEqual(
    speaker.actorSpeechQueue.lines,
    ['The final line.'],
    'a new queue replaces the pending queue'
  );
}

{
  const { game, player, speaker, bystander } = buildSpeechRuntime();
  game.dialogueEffects.apply({
    actorSpeech: {
      target: 'speaker',
      lines: [
        'There. The writ was under my blanket.',
        'The ducats were in my left boot.'
      ],
      initialDelay: 0.5,
      interval: 0.25,
      ttl: 1
    }
  });

  assert.deepEqual(speaker.actorSpeechQueue.lines, [
    'There. The writ was under my blanket.',
    'The ducats were in my left boot.'
  ]);
  assert.equal(speaker.speech, null);

  game._advanceAmbientSpeech(5);
  assert.equal(speaker.actorSpeechQueue.delay, 0.5, 'an open dialogue pauses the initial delay');

  game.uiScreen = null;
  game.hiddenTiles.add(`${speaker.x},${speaker.y}`);
  game._advanceAmbientSpeech(5);
  assert.equal(speaker.actorSpeechQueue.delay, 0.5, 'a hidden actor keeps the queue paused');

  game.hiddenTiles.clear();
  player.moveTo(20, 20);
  game._advanceAmbientSpeech(5);
  assert.equal(speaker.actorSpeechQueue.delay, 0.5, 'distance keeps the queue paused');

  player.moveTo(1, 1);
  game._advanceAmbientSpeech(0.2);
  assert.ok(Math.abs(speaker.actorSpeechQueue.delay - 0.3) < 0.0001);
  assert.equal(bystander.speech, null, 'ordinary ambient waits behind an observed scripted queue');

  game._advanceAmbientSpeech(0.3);
  assert.equal(speaker.speech.text, 'There. The writ was under my blanket.');
  assert.equal(speaker.speech.kind, 'actor-speech');
  assert.equal(speaker.speech.ttl, 1);

  game.uiScreen = 'dialogue';
  game._advanceAmbientSpeech(0.75);
  assert.equal(speaker.speech.ttl, 1, 'an open UI pauses a visible scripted line');

  game.uiScreen = null;
  game.hiddenTiles.add(`${speaker.x},${speaker.y}`);
  game._advanceAmbientSpeech(0.75);
  assert.equal(speaker.speech.ttl, 1, 'visibility also pauses the active line');

  game.hiddenTiles.clear();
  game._advanceAmbientSpeech(0.5);
  assert.equal(speaker.speech.ttl, 0.5);
  game._advanceAmbientSpeech(0.5);
  assert.equal(speaker.speech, null);
  assert.equal(speaker.actorSpeechQueue.delay, 0.25);

  game._advanceAmbientSpeech(0.1);
  assert.ok(Math.abs(speaker.actorSpeechQueue.delay - 0.15) < 0.0001);
  assert.equal(speaker.speech, null);
  game._advanceAmbientSpeech(0.16);
  assert.equal(speaker.speech.text, 'The ducats were in my left boot.');

  game._advanceAmbientSpeech(1);
  assert.equal(speaker.speech, null);
  assert.equal(speaker.actorSpeechQueue, undefined, 'the queue clears after the last line');

  speaker.ambientTimer = 999;
  bystander.ambientTimer = 0;
  game._advanceAmbientSpeech(0);
  assert.equal(
    bystander.speech.text,
    'Keep the cookfire low.',
    'ordinary ambient resumes after completion'
  );
}

errors.length = 0;
validateDialogueEffects('actor-speech-valid.json', {
  actorSpeech: {
    target: 'speaker',
    lines: ['The writ was under the blanket.'],
    initialDelay: 0,
    interval: 0.25,
    ttl: 1.5
  }
}, 'effects');
assert.deepEqual(errors, []);

errors.length = 0;
validateDialogueEffects('actor-speech-invalid.json', {
  actorSpeech: {
    target: '',
    lines: [],
    initialDelay: -1,
    interval: -0.25,
    ttl: 0
  }
}, 'effects');
assert.equal(errors.some((error) => error.includes('actorSpeech.target must be a non-empty string')), true);
assert.equal(errors.some((error) => error.includes('actorSpeech.lines must be a non-empty array')), true);
assert.equal(errors.some((error) => error.includes('actorSpeech.initialDelay must be zero or greater')), true);
assert.equal(errors.some((error) => error.includes('actorSpeech.interval must be zero or greater')), true);
assert.equal(errors.some((error) => error.includes('actorSpeech.ttl must be greater than zero')), true);
