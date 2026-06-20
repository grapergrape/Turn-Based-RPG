import assert from 'node:assert/strict';

import {
  FIELD_RATINGS,
  awardExperience,
  buildCharacterSheet,
  calculateFieldRating,
  experienceProgress,
  experienceRewardForEncounter,
  experienceRewardForActor,
  levelFromXp,
  normalizeProgression,
  questStageExperience,
  questStageExperienceKey,
  scaleStatsForProgression,
  xpForLevel
} from '../src/core/Progression.js';

const firearms = FIELD_RATINGS.find((field) => field.id === 'firearms');
const hostSigns = FIELD_RATINGS.find((field) => field.id === 'hostSigns');

{
  const progression = normalizeProgression({
    primaries: {
      eye: 8,
      agility: 5,
      nerve: 3
    }
  });
  assert.equal(calculateFieldRating(progression, firearms), 53);
}

{
  const progression = normalizeProgression({
    primaries: {
      eye: 8,
      religion: 5,
      nerve: 5
    },
    scars: [
      { id: 'heard-the-choir-below', name: 'Heard the Choir Below', rank: 1, modifiers: { hostSigns: 5 } }
    ]
  });
  assert.equal(calculateFieldRating(progression, hostSigns), 62);
}

{
  const sheet = buildCharacterSheet({
    name: 'Mara Vey',
    role: 'Cult-Breaker, Ashen Censure',
    progression: {
      primaries: {
        body: 10,
        agility: 10,
        eye: 10,
        intelligence: 10,
        religion: 10,
        voice: 10,
        nerve: 10
      },
      fieldModifiers: { firearms: 20 },
      scars: []
    }
  });
  assert.equal(sheet.fields.find((field) => field.id === 'firearms').value, 100);
  assert.equal(sheet.primaries.length, 7);
  assert.equal(sheet.fields.length, 17);
}

{
  assert.equal(xpForLevel(1), 0);
  assert.equal(xpForLevel(2), 100);
  assert.equal(xpForLevel(3), 300);
  assert.equal(levelFromXp(299), 2);
  assert.equal(levelFromXp(300), 3);
  assert.equal(experienceProgress({ level: 2, xp: 150, build: 'field-agent' }).nextLevelXp, 300);
}

{
  const progression = normalizeProgression({
    level: 3,
    build: 'gunhand',
    primaries: {
      body: 3,
      agility: 3,
      eye: 3,
      intelligence: 3,
      religion: 3,
      voice: 3,
      nerve: 3
    }
  });
  assert.equal(progression.level, 3);
  assert.equal(progression.primaries.eye, 4);
  assert.equal(progression.build.label, 'Gunhand');
}

{
  const stats = scaleStatsForProgression(
    { hp: 10, maxHp: 10, actionPoints: 5, moveCost: 1 },
    { level: 6, build: 'engineer' }
  );
  assert.equal(stats.maxHp, 15);
  assert.equal(stats.hp, 15);
  assert.equal(stats.actionPoints, 6);
}

{
  const stats = scaleStatsForProgression(
    { hp: 4, maxHp: 10, actionPoints: 5, moveCost: 1 },
    { level: 1, build: 'field-agent' }
  );
  assert.equal(stats.maxHp, 10);
  assert.equal(stats.hp, 4);
}

{
  let refreshed = false;
  const actor = {
    progression: { level: 1, xp: 0, build: 'field-agent' },
    refreshProgressionStats() { refreshed = true; }
  };
  const result = awardExperience(actor, 100);
  assert.equal(result.level, 2);
  assert.equal(result.primaryPoints, 1);
  assert.equal(refreshed, true);
}

{
  assert.equal(experienceRewardForActor({
    type: 'enemy',
    tags: ['host', 'vale-imprint'],
    progression: { level: 1, build: 'host-threat' }
  }), 30);
  assert.equal(experienceRewardForActor({
    type: 'enemy',
    tags: ['elite'],
    progression: { level: 3, build: 'breaker', complexity: 'elite' }
  }), 120);
  assert.equal(experienceRewardForActor({
    type: 'enemy',
    tags: ['boss'],
    progression: { level: 3, build: 'breaker', xpReward: 275 }
  }), 275);
  assert.equal(experienceRewardForEncounter([
    { type: 'enemy', tags: ['rat'], progression: { level: 1, build: 'host-threat' } },
    { type: 'enemy', tags: ['tank'], progression: { level: 2, build: 'breaker' } }
  ]), 80);
}

{
  const quest = {
    id: 'test-quest',
    stages: [
      { id: 'active', description: 'Start' },
      { id: 'found', description: 'Found', xp: 25 },
      { id: 'complete', description: 'Done', reward: { xp: 75 } }
    ]
  };
  assert.equal(questStageExperience(quest, 'active'), 0);
  assert.equal(questStageExperience(quest, 'found'), 25);
  assert.equal(questStageExperience(quest, 'complete'), 75);
  assert.equal(questStageExperienceKey('test-quest', 'found'), 'test-quest:found');
}
