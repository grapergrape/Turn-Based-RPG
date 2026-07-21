// Shared combat presentation and runtime rules for player-controlled companion
// actives. Companion content owns which effect a purchased node grants; this
// table owns the generic targeting contract used by combat and the ability UI.

export const COMPANION_ACTION_RULES = Object.freeze({
  'ability-overcharge': { ap: 4, range: 4, target: 'enemy', label: 'Overcharge' },
  'ability-arc-sweep': { ap: 5, range: 2, target: 'enemy', label: 'Arc Sweep' },
  'ability-ram': { ap: 2, range: 1, target: 'enemy', label: 'Ram' },
  'ability-guard-stance': { ap: 2, range: 0, target: 'self', label: 'Guard Stance' },
  'ability-dressing-arm': { ap: 3, range: 1, target: 'ally', label: 'Dressing Arm', cooldown: 2 },
  'ability-clean-line': { ap: 2, range: 1, target: 'ally', label: 'Clean Line' },
  'ability-repair-foam': { ap: 3, range: 0, target: 'self', label: 'Repair Foam', cooldown: 2 },
  'ability-stimulant-needle': { ap: 3, range: 1, target: 'ally', label: 'Stimulant Needle', once: true },
  'ability-marking-beam': { ap: 2, range: 6, target: 'enemy', label: 'Marking Beam' },
  'ability-ghost-light': { ap: 2, range: 5, target: 'tile', label: 'Ghost Light' },
  'ability-shadow-screen': { ap: 3, range: 0, target: 'self', label: 'Shadow Screen', cooldown: 3 },
  'deploy-med-station': { ap: 4, range: 1, target: 'tile', label: 'Med Station' },
  'deploy-sensor-stake': { ap: 3, range: 1, target: 'tile', label: 'Sensor Stake' },
  'deploy-folding-screen': { ap: 3, range: 1, target: 'tile', label: 'Folding Screen' },
  'deploy-snare-pod': { ap: 3, range: 2, target: 'tile', label: 'Snare Pod' },
  'deploy-arc-sentry': { ap: 4, range: 1, target: 'tile', label: 'Arc Sentry' },
  'deploy-relay-pylon': { ap: 3, range: 1, target: 'tile', label: 'Relay Pylon' }
});
