export const ASH_ROAD_SOUTH_SOUNDSCAPE = Object.freeze({
  maxDistance: 20,
  maxOneShots: 4,
  activityCues: Object.freeze([
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
  ]),
  ambientBeds: Object.freeze([
    Object.freeze({
      id: 'arrival-canvas-bed',
      profile: 'receiving-canvas',
      bounds: Object.freeze({ x0: 14, y0: 62, x1: 45, y1: 79 }),
      gain: 0.19
    }),
    Object.freeze({
      id: 'water-court-bed',
      profile: 'waterworks',
      bounds: Object.freeze({ x0: 47, y0: 44, x1: 81, y1: 64 }),
      gain: 0.22
    }),
    Object.freeze({
      id: 'morrow-yard-bed',
      profile: 'freight-yard',
      bounds: Object.freeze({ x0: 5, y0: 29, x1: 46, y1: 61 }),
      gain: 0.18
    }),
    Object.freeze({
      id: 'rope-rows-bed',
      profile: 'rope-rows',
      bounds: Object.freeze({ x0: 81, y0: 17, x1: 128, y1: 65 }),
      gain: 0.17
    })
  ])
});
