// Shared, content-facing contract for civilian work loops. Level data names a
// physical motion and optional prop/audio responses; rendering and audio map
// those stable ids to their own implementation details.

export const NPC_ACTIVITY_MOTIONS = Object.freeze([
  'reach',
  'pump',
  'mark',
  'lift',
  'kneel'
]);

export const NPC_ACTIVITY_RESPONSES = Object.freeze([
  'none',
  'paper',
  'water',
  'tools',
  'hoist',
  'scale',
  'load',
  'cloth',
  'flame'
]);

export const NPC_ACTIVITY_SOUNDS = Object.freeze([
  'chalk-scratch',
  'paper-turn',
  'cup-set',
  'water-pour',
  'pump-stroke',
  'metal-scrape',
  'tool-tap',
  'hoist-chain',
  'crate-shift',
  'scale-clack',
  'cloth-snap',
  'burner-tick'
]);

const MOTION_SET = new Set(NPC_ACTIVITY_MOTIONS);
const RESPONSE_SET = new Set(NPC_ACTIVITY_RESPONSES);
const SOUND_SET = new Set(NPC_ACTIVITY_SOUNDS);

const MOTION_RENDER_STATE = Object.freeze({
  reach: 'interact',
  pump: 'workPump',
  mark: 'workMark',
  lift: 'workLift',
  kneel: 'workKneel'
});

const MOTION_FRAME_COUNT = Object.freeze({
  reach: 6,
  pump: 8,
  mark: 6,
  lift: 8,
  kneel: 6
});

export function normalizeNpcActivity(value, {
  defaultDuration = 2.4,
  minDuration = 0.8,
  maxDuration = 12
} = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const target = typeof value.target === 'string' && value.target.trim() !== ''
    ? value.target.trim()
    : null;
  if (!target) return null;

  const authoredDuration = Number.isFinite(value.duration) && value.duration > 0
    ? value.duration
    : defaultDuration;
  const motion = MOTION_SET.has(value.motion) ? value.motion : 'reach';
  const response = RESPONSE_SET.has(value.response) ? value.response : 'none';
  const sound = SOUND_SET.has(value.sound) ? value.sound : null;

  return {
    target,
    duration: Math.max(minDuration, Math.min(maxDuration, authoredDuration)),
    motion,
    response,
    ...(sound ? { sound } : {})
  };
}

export function activityRenderState(activity) {
  return MOTION_RENDER_STATE[activity?.motion] ?? MOTION_RENDER_STATE.reach;
}

export function activityFrameCount(activity) {
  return MOTION_FRAME_COUNT[activity?.motion] ?? MOTION_FRAME_COUNT.reach;
}

export function activityFrameIndex(activity, progress) {
  const count = activityFrameCount(activity);
  const normalized = Math.max(0, Math.min(1, Number(progress) || 0));
  return Math.min(count - 1, Math.floor(normalized * count));
}

export function activitySoundFrame(activity, frameIndex) {
  if (!activity?.sound) return false;
  const count = activityFrameCount(activity);
  if (count >= 8) return frameIndex === 2 || frameIndex === 6;
  return frameIndex === 2;
}

export function isNpcActivityMotion(value) {
  return MOTION_SET.has(value);
}

export function isNpcActivityResponse(value) {
  return RESPONSE_SET.has(value);
}

export function isNpcActivitySound(value) {
  return SOUND_SET.has(value);
}
