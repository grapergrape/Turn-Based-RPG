// Recurring surface tableaux. The generator resolves each target to a clear,
// adjacent reservation cell, so runtime content stays stable even when nearby
// dressing shifts.

function participant(actor, target, motion, response, sound, slotPreference, delay = 0) {
  return Object.freeze({
    actor,
    slotPreference,
    delay,
    activity: Object.freeze({ target, duration: 6.4, motion, response, sound })
  });
}

export const ASH_ROAD_SOUTH_TABLEAUX = Object.freeze([
  Object.freeze({
    id: 'arrival-registration-handoff',
    center: Object.freeze({ x: 39, y: 69 }),
    activationRadius: 18,
    startDelay: 7,
    cooldown: Object.freeze({ min: 34, max: 46 }),
    participants: Object.freeze([
      participant('ash-road-south-sela-marr', 'ash-road-south-arrival-board', 'mark', 'paper', 'chalk-scratch', 0),
      participant('ash-road-south-jori-cade', 'ash-road-south-receiving-register', 'mark', 'paper', 'paper-turn', 3, 0.7),
      participant('ash-road-south-eren-holt', 'ash-road-south-arrival-water-point', 'lift', 'water', 'cup-set', 5, 1.2)
    ]),
    barks: Object.freeze([
      Object.freeze({ at: 1.1, actor: 'ash-road-south-eren-holt', text: 'Fire Seven. Nine cups, eleven mouths.' }),
      Object.freeze({ at: 3.7, actor: 'ash-road-south-sela-marr', text: 'Nine hooks marked. Two cups wait on the hearth.' })
    ])
  }),
  Object.freeze({
    id: 'water-court-queue',
    center: Object.freeze({ x: 72, y: 53 }),
    activationRadius: 19,
    startDelay: 11,
    cooldown: Object.freeze({ min: 38, max: 52 }),
    participants: Object.freeze([
      participant('ash-road-south-bera-tol', 'ash-road-south-public-taps-east', 'lift', 'water', 'water-pour', 2),
      participant('ash-road-south-jani-kes', 'ash-road-south-public-taps-west', 'pump', 'water', 'pump-stroke', 5, 0.5),
      participant('ash-road-south-mera-hask', 'ash-road-south-water-court-issue-south-measure-notice-board-72-55', 'mark', 'paper', 'chalk-scratch', 0, 1)
    ]),
    barks: Object.freeze([
      Object.freeze({ at: 0.8, actor: 'ash-road-south-mera-hask', text: 'Blue chalk first. Two jars at the east tap.' }),
      Object.freeze({ at: 3.2, actor: 'ash-road-south-jani-kes', text: 'East tap ready. Keep the neck cloth dry.' })
    ])
  }),
  Object.freeze({
    id: 'morrow-freight-loading',
    center: Object.freeze({ x: 27, y: 52 }),
    activationRadius: 20,
    startDelay: 15,
    cooldown: Object.freeze({ min: 42, max: 58 }),
    participants: Object.freeze([
      participant('ash-road-south-benne-korr', 'ash-road-south-bonded-load-hoist', 'lift', 'hoist', 'hoist-chain', 1),
      participant('ash-road-south-mott-rell', 'ash-road-south-yard-scale', 'lift', 'scale', 'scale-clack', 4, 0.8),
      participant('ash-road-south-gann-tare', 'ash-road-south-freight-loading-bay-south-measure-return-stall-24-53', 'lift', 'load', 'crate-shift', 6, 1.4)
    ]),
    barks: Object.freeze([
      Object.freeze({ at: 0.9, actor: 'ash-road-south-benne-korr', text: 'Brake set. Bring the rear strap.' }),
      Object.freeze({ at: 3.8, actor: 'ash-road-south-mott-rell', text: 'The floor is wet. Add one measure for the drag.' })
    ])
  }),
  Object.freeze({
    id: 'charity-bandage-handoff',
    center: Object.freeze({ x: 103, y: 69 }),
    activationRadius: 17,
    startDelay: 9,
    cooldown: Object.freeze({ min: 36, max: 50 }),
    participants: Object.freeze([
      participant('ash-road-south-joss-marr', 'ash-road-south-charity-service-counter', 'lift', 'cloth', 'cloth-snap', 0),
      participant('ash-road-south-seli-ruun', 'ash-road-south-charity-water', 'kneel', 'water', 'water-pour', 3, 0.5),
      participant('ash-road-south-mila-esh', 'ash-road-south-charity-linen-court-south-measure-repair-rack-100-69', 'lift', 'cloth', 'cloth-snap', 6, 1)
    ]),
    barks: Object.freeze([
      Object.freeze({ at: 1, actor: 'ash-road-south-joss-marr', text: 'Boiled strip. Dry hands only.' }),
      Object.freeze({ at: 3.4, actor: 'ash-road-south-seli-ruun', text: 'Fold it twice. Rhoda needs the narrow wrap.' })
    ])
  }),
  Object.freeze({
    id: 'compact-clinic-screening',
    center: Object.freeze({ x: 119, y: 29 }),
    activationRadius: 21,
    startDelay: 13,
    cooldown: Object.freeze({ min: 40, max: 56 }),
    participants: Object.freeze([
      participant('ash-road-south-rin-quor', 'ash-road-south-compact-wash', 'kneel', 'water', 'water-pour', 1),
      participant('ash-road-south-evin-sael', 'ash-road-south-compact-screening-south-measure-notice-board-116-27', 'mark', 'paper', 'paper-turn', 4, 0.7),
      participant('ash-road-south-dessa-olt', 'ash-road-south-compact-clean-vessels', 'lift', 'water', 'cup-set', 6, 1.2)
    ]),
    barks: Object.freeze([
      Object.freeze({ at: 0.9, actor: 'ash-road-south-rin-quor', text: 'Wrist first. Keep the blood card clean.' }),
      Object.freeze({ at: 3.5, actor: 'ash-road-south-evin-sael', text: 'No cough since dawn. Write that before the fever count.' })
    ])
  }),
  Object.freeze({
    id: 'old-gate-weighing',
    center: Object.freeze({ x: 75, y: 32 }),
    activationRadius: 18,
    startDelay: 17,
    cooldown: Object.freeze({ min: 44, max: 60 }),
    participants: Object.freeze([
      participant('ash-road-south-orsa-veck', 'ash-road-south-return-shelf', 'lift', 'load', 'crate-shift', 0),
      participant('ash-road-south-noll-dast', 'ash-road-south-old-gate-scale', 'mark', 'scale', 'scale-clack', 3, 0.6),
      participant('ash-road-south-tal-uren', 'ash-road-south-screening-stage-09', 'mark', 'paper', 'chalk-scratch', 6, 1.1)
    ]),
    barks: Object.freeze([
      Object.freeze({ at: 1, actor: 'ash-road-south-noll-dast', text: 'Thirty-eight. Cord and seal agree.' }),
      Object.freeze({ at: 3.6, actor: 'ash-road-south-orsa-veck', text: 'Left shelf. The clinic crate stays under blue cord.' })
    ])
  })
]);
