const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_YEAR_AFTER_DESCENT = 130;
const DEFAULT_FIELD_DAY = 1;
const DEFAULT_START_MINUTE = 8 * 60;
const GAME_MINUTES_PER_REAL_SECOND = 2;

const PHASES = [
  { id: 'deep-night', label: 'DEEP NIGHT', start: 0 },
  { id: 'dawn', label: 'DAWN', start: 5 * 60 },
  { id: 'morning', label: 'MORNING', start: 7 * 60 },
  { id: 'noon', label: 'NOON', start: 11 * 60 },
  { id: 'afternoon', label: 'AFTERNOON', start: 13 * 60 },
  { id: 'dusk', label: 'DUSK', start: 18 * 60 },
  { id: 'night', label: 'NIGHT', start: 20 * 60 },
  { id: 'deep-night', label: 'DEEP NIGHT', start: 22 * 60 }
];

export function createGameClock(seed = {}) {
  return normalizeClock({
    yearAfterDescent: seed.yearAfterDescent ?? DEFAULT_YEAR_AFTER_DESCENT,
    fieldDay: seed.fieldDay ?? seed.day ?? DEFAULT_FIELD_DAY,
    minuteOfDay: seed.minuteOfDay ?? DEFAULT_START_MINUTE,
    minuteCarry: seed.minuteCarry ?? 0
  });
}

export function cloneGameClock(clock) {
  return createGameClock(clock);
}

export function advanceGameClock(clock, deltaSeconds, scale = GAME_MINUTES_PER_REAL_SECOND) {
  const next = clock ? normalizeClock(clock) : createGameClock();
  const delta = Math.max(0, finiteNumber(deltaSeconds, 0));
  const rate = Math.max(0, finiteNumber(scale, GAME_MINUTES_PER_REAL_SECOND));
  const rawMinutes = next.minuteCarry + delta * rate;
  const wholeMinutes = Math.floor(rawMinutes);
  next.minuteCarry = rawMinutes - wholeMinutes;
  if (wholeMinutes > 0) addClockMinutes(next, wholeMinutes);
  return next;
}

export function buildClockReadout(clock) {
  const safe = clock ? normalizeClock(clock) : createGameClock();
  const phase = phaseForMinute(safe.minuteOfDay);
  return {
    yearAfterDescent: safe.yearAfterDescent,
    fieldDay: safe.fieldDay,
    minuteOfDay: safe.minuteOfDay,
    phase: phase.id,
    phaseLabel: phase.label,
    timeLabel: formatTime(safe.minuteOfDay),
    dateLabel: `FIELD DAY ${safe.fieldDay}, YEAR ${safe.yearAfterDescent} AFTER DESCENT`
  };
}

export function phaseForMinute(minuteOfDay) {
  const minute = normalizeMinute(minuteOfDay);
  let current = PHASES[0];
  for (const phase of PHASES) {
    if (minute >= phase.start) current = phase;
    else break;
  }
  return current;
}

function addClockMinutes(clock, minutes) {
  const total = clock.minuteOfDay + Math.max(0, Math.floor(finiteNumber(minutes, 0)));
  const extraDays = Math.floor(total / MINUTES_PER_DAY);
  clock.minuteOfDay = total % MINUTES_PER_DAY;
  clock.fieldDay += extraDays;
}

function normalizeClock(clock) {
  const minuteOfDay = normalizeMinute(clock.minuteOfDay);
  const yearAfterDescent = Math.max(1, Math.floor(finiteNumber(clock.yearAfterDescent, DEFAULT_YEAR_AFTER_DESCENT)));
  const fieldDay = Math.max(1, Math.floor(finiteNumber(clock.fieldDay, DEFAULT_FIELD_DAY)));
  const minuteCarry = Math.max(0, Math.min(0.999999, finiteNumber(clock.minuteCarry, 0)));
  return { yearAfterDescent, fieldDay, minuteOfDay, minuteCarry };
}

function normalizeMinute(value) {
  const minute = Math.floor(finiteNumber(value, DEFAULT_START_MINUTE));
  return ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

function formatTime(minuteOfDay) {
  const minute = normalizeMinute(minuteOfDay);
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
