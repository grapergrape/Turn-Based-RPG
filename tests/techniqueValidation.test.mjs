import assert from 'node:assert/strict';
import { join } from 'node:path';

import { validateTechnique } from '../scripts/validation/techniqueValidator.mjs';
import {
  errors,
  referencedItemIds,
  referencedTechniqueIds,
  seenTechniqueIds
} from '../scripts/validation/validationContext.mjs';

function file(name) {
  return join(process.cwd(), 'data', 'techniques', name);
}

function reset() {
  errors.length = 0;
  seenTechniqueIds.clear();
  referencedTechniqueIds.clear();
  referencedItemIds.clear();
}

const validActive = {
  id: 'test-active',
  name: 'Test Active',
  type: 'active',
  targets: ['enemy'],
  requirements: {
    fieldRatings: { firearms: 45 },
    primaries: { nerve: 5 }
  },
  summary: 'Test summary.'
};

const validPassive = {
  id: 'test-passive',
  name: 'Test Passive',
  type: 'passive',
  targets: ['self'],
  requirements: {
    anyFieldRatings: { medicine: 40, containment: 40 }
  },
  summary: 'Test summary.'
};

reset();
validateTechnique(file('test-active.json'), validActive);
validateTechnique(file('test-passive.json'), validPassive);
assert.deepEqual(errors, []);

reset();
validateTechnique(file('bad-field.json'), {
  ...validActive,
  id: 'bad-field',
  requirements: { fieldRatings: { imaginaryField: 45 } }
});
assert(errors.some((error) => error.includes('unknown field rating "imaginaryField"')));

reset();
validateTechnique(file('bad-primary.json'), {
  ...validActive,
  id: 'bad-primary',
  requirements: { primaries: { luck: 5 } }
});
assert(errors.some((error) => error.includes('unknown primary "luck"')));

reset();
validateTechnique(file('bad-type.json'), {
  ...validActive,
  id: 'bad-type',
  type: 'burst'
});
assert(errors.some((error) => error.includes('type must be one of active, passive')));

reset();
validateTechnique(file('duplicate-one.json'), validActive);
validateTechnique(file('duplicate-two.json'), validActive);
assert(errors.some((error) => error.includes('duplicate technique id "test-active"')));
