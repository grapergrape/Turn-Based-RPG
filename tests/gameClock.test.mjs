import assert from 'node:assert/strict';

import {
  advanceGameClock,
  buildClockReadout,
  createGameClock,
  phaseForMinute
} from '../src/core/GameClock.js';

let clock = createGameClock({ fieldDay: 3, minuteOfDay: 23 * 60 + 58 });
clock = advanceGameClock(clock, 30);
let readout = buildClockReadout(clock);
assert.equal(readout.fieldDay, 4);
assert.equal(readout.timeLabel, '00:58');
assert.equal(readout.dateLabel, 'FIELD DAY 4, YEAR 130 AFTER DESCENT');
assert.equal(readout.phaseLabel, 'DEEP NIGHT');

const seeded = createGameClock({ yearAfterDescent: 131, fieldDay: 12, minuteOfDay: 8 * 60 + 5 });
readout = buildClockReadout(seeded);
assert.equal(readout.dateLabel, 'FIELD DAY 12, YEAR 131 AFTER DESCENT');
assert.equal(readout.timeLabel, '08:05');
assert.equal(readout.phaseLabel, 'MORNING');

assert.equal(phaseForMinute(5 * 60).label, 'DAWN');
assert.equal(phaseForMinute(18 * 60).label, 'DUSK');
assert.equal(phaseForMinute(22 * 60).label, 'DEEP NIGHT');
