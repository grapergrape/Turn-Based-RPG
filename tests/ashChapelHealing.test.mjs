import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { meetsDialogueConditions } from '../src/core/DialogueConditions.js';
import { DialogueEffects } from '../src/core/DialogueEffects.js';
import { Inventory } from '../src/core/Inventory.js';

const readJson = async (relativePath) => JSON.parse(
  await readFile(new URL(relativePath, import.meta.url), 'utf8')
);

const [hanneDialogue, catacombs] = await Promise.all([
  readJson('../data/dialogue/ash-chapel-catacombs-hanne.json'),
  readJson('../data/levels/ash_chapel_catacombs.json')
]);

const treatmentChoices = ['start', 'hideout'].map((nodeId) => {
  const choice = hanneDialogue.nodes[nodeId].choices.find(
    (entry) => entry.label === 'Pay 1 ducat for treatment'
  );
  assert.ok(choice, `${nodeId} offers Joanna's treatment`);
  return choice;
});

for (const choice of treatmentChoices) {
  assert.equal(choice.conditions.playerWounded, true);
  assert.equal(choice.effects.inventory.requireAll, true);
  assert.deepEqual(choice.effects.inventory.remove, [{
    item: 'ducat',
    count: 1,
    failLog: 'Joanna needs 1 ducat before she opens the clean cloth.'
  }]);
  assert.deepEqual(choice.effects.heal, { target: 'player', amount: 'full' });
  assert.equal(choice.next, 'treatment-complete');
}

const hanneSpawn = catacombs.spawns.npcs.find(
  (spawn) => spawn.actor === 'catacombs-survivor-hanne'
);
assert.ok(hanneSpawn, 'Joanna is present in the chapel catacombs');
assert.equal(hanneSpawn.dialogue, hanneDialogue.id);
assert.equal(hanneSpawn.dialogueRepeat, true);

assert.equal(meetsDialogueConditions(
  { playerWounded: true },
  { playerWounded: () => true }
), true);
assert.equal(meetsDialogueConditions(
  { playerWounded: true },
  { playerWounded: () => false }
), false);

const itemDefs = {
  ducat: {
    id: 'ducat',
    name: 'Ducat',
    type: 'currency',
    rarity: 'common',
    weight: 0,
    groundModel: 'chit',
    description: 'Stamped trade coin.'
  }
};

function buildTreatmentRuntime({ hp = 5, ducats = 1 } = {}) {
  const logs = [];
  const player = {
    hp,
    maxHp: 14,
    isDead: false,
    heal(amount) {
      const before = this.hp;
      this.hp = Math.min(this.maxHp, this.hp + amount);
      return this.hp - before;
    }
  };
  const game = {
    flags: new Set(),
    player,
    inventory: new Inventory(itemDefs, { maxCarryWeight: 10 })
  };
  if (ducats > 0) game.inventory.add('ducat', ducats);
  const effects = new DialogueEffects(game, {
    log: (line) => logs.push(line),
    syncInventoryOrder() {},
    clampInventorySelection() {}
  });
  return { effects, game, logs, player };
}

const treatment = treatmentChoices[0].effects;

{
  const { effects, game, logs, player } = buildTreatmentRuntime();
  assert.equal(effects.apply(treatment), false);
  assert.equal(player.hp, player.maxHp);
  assert.equal(game.inventory.count('ducat'), 0);
  assert.deepEqual(logs, ['Joanna washes the wound and binds it tight. HP restored.']);
}

{
  const { effects, game, logs, player } = buildTreatmentRuntime({ ducats: 0 });
  assert.equal(effects.apply(treatment), true);
  assert.equal(player.hp, 5);
  assert.equal(game.inventory.count('ducat'), 0);
  assert.deepEqual(logs, ['Joanna needs 1 ducat before she opens the clean cloth.']);
}

{
  const { effects, game, logs, player } = buildTreatmentRuntime({ hp: 14 });
  assert.equal(effects.apply(treatment), true);
  assert.equal(player.hp, 14);
  assert.equal(game.inventory.count('ducat'), 1);
  assert.deepEqual(logs, ['No wounds need treatment.']);
}
