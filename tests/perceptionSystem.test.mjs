import assert from 'node:assert/strict';

import { Grid } from '../src/world/Grid.js';
import {
  SUSPICION_SEVERITY,
  SUSPICION_STATES,
  canSeeActor,
  nextSuspicionState,
  noticeSuspiciousAction,
  resolveStealthCheck,
  suspicionDc,
  visionConeCells
} from '../src/world/PerceptionSystem.js';

const level = {
  id: 'perception-test',
  name: 'Perception Test',
  width: 6,
  height: 4,
  tileSize: 64,
  tiles: [
    '......',
    '......',
    '......',
    '......'
  ],
  legend: {
    '.': { kind: 'floor', walkable: true }
  }
};

{
  const grid = new Grid(level);
  const observer = { position: { x: 2, y: 2 }, facing: 'e', perception: { visionRadius: 4, coneDegrees: 90 } };
  const target = { position: { x: 4, y: 0 } };
  assert.equal(canSeeActor(observer, target, { grid }).canSee, true);

  observer.facing = 'w';
  const blockedByCone = canSeeActor(observer, target, { grid });
  assert.equal(blockedByCone.canSee, false);
  assert.equal(blockedByCone.reason, 'cone');
}

{
  const grid = new Grid(level);
  const observer = { position: { x: 1, y: 1 }, facing: 'e', perception: { visionRadius: 5, coneDegrees: 120 } };
  const target = { position: { x: 4, y: 1 } };

  grid.addBlocked(2, 1);
  const blocked = canSeeActor(observer, target, { grid });
  assert.equal(blocked.canSee, false);
  assert.equal(blocked.reason, 'blocked');

  grid.removeBlocked(2, 1);
  assert.equal(canSeeActor(observer, target, { grid }).canSee, true);
}

{
  const grid = new Grid(level);
  const observer = { position: { x: 1, y: 2 }, facing: 'e', perception: { visionRadius: 5, coneDegrees: 100 } };
  grid.addBlocked(3, 2);

  const cone = new Set(visionConeCells(observer, { grid }).map((cell) => cell.key));
  assert.equal(cone.has('2,2'), true);
  assert.equal(cone.has('3,2'), true);
  assert.equal(cone.has('4,2'), false);
}

{
  const grid = new Grid(level);
  const observer = { position: { x: 1, y: 1 }, facing: 'w', perception: { hearingRadius: { low: 2, high: 6 } } };
  const target = { position: { x: 4, y: 1 } };

  assert.equal(noticeSuspiciousAction(observer, target, { severity: SUSPICION_SEVERITY.LOW, grid }).noticed, false);
  const heard = noticeSuspiciousAction(observer, target, { severity: SUSPICION_SEVERITY.HIGH, grid });
  assert.equal(heard.noticed, true);
  assert.equal(heard.reason, 'heard');
}

{
  const weakObserverDc = suspicionDc(SUSPICION_SEVERITY.MEDIUM, { observerRating: 25 });
  const sharpObserverDc = suspicionDc(SUSPICION_SEVERITY.MEDIUM, { observerRating: 75 });
  assert.equal(weakObserverDc < sharpObserverDc, true);

  const success = resolveStealthCheck({
    severity: SUSPICION_SEVERITY.LOW,
    stealthRating: 70,
    observerRating: 25,
    roll: 0.1
  });
  assert.equal(success.success, true);
  assert.equal(success.dc < 50, true);

  const failure = resolveStealthCheck({
    severity: SUSPICION_SEVERITY.HIGH,
    stealthRating: 45,
    observerRating: 75,
    roll: 0.9
  });
  assert.equal(failure.success, false);
  assert.equal(failure.dc > 75, true);
}

{
  assert.equal(
    nextSuspicionState({ severity: SUSPICION_SEVERITY.LOW, success: false }),
    SUSPICION_STATES.WATCHING
  );
  assert.equal(
    nextSuspicionState({
      severity: SUSPICION_SEVERITY.LOW,
      success: false,
      currentState: SUSPICION_STATES.WATCHING
    }),
    SUSPICION_STATES.INVESTIGATING
  );
  assert.equal(
    nextSuspicionState({ severity: SUSPICION_SEVERITY.MEDIUM, success: false }),
    SUSPICION_STATES.INVESTIGATING
  );
  assert.equal(
    nextSuspicionState({ severity: SUSPICION_SEVERITY.HIGH, success: false }),
    SUSPICION_STATES.ALERTED
  );
}
