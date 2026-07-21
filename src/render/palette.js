// Central colour palette for the whole game.
//
// Everything visible is built from these muted, dirty colours. The discipline
// here is deliberate: no bright cartoon colours, no clean flat grey floor, no
// smooth gradients. Shadows and lighting are produced with dithering and hard
// colour bands (see PixelPrimitives.js), not alpha gradients.

export const PALETTE = {
  void: '#050505',
  outline: '#0a0807',

  stoneDark: '#15130e',
  stoneMid: '#2a261c',
  stoneLight: '#433c2c',
  stoneDust: '#5c513a',

  rustDark: '#2a160e',
  rustMid: '#6a321d',
  rustLight: '#9a5630',

  // South Measure material ramps. These distinguish its old civic limewash,
  // cold relief iron, and fired-clay repairs from generic stone and rust.
  // Each stays muted enough to sit inside the established ash-road palette.
  limeDark: '#25261d',
  limeMid: '#484a3a',
  limeLight: '#74745b',

  ironDark: '#111619',
  ironMid: '#2b3335',
  ironLight: '#626b66',

  clayDark: '#2b1710',
  clayMid: '#62351f',
  clayLight: '#9b5a34',

  woodDark: '#1f140d',
  woodMid: '#3a2616',
  woodLight: '#54381f',

  clothDark: '#241d19',
  clothRed: '#7a241f',
  clothTan: '#a69371',
  clothBlueDark: '#172635',
  clothBlue: '#2d4f6a',

  skinDark: '#4a3025',
  skinMid: '#8a5e43',
  skinLight: '#c39a70',

  hostBlack: '#090606',
  hostRed: '#3b0d0c',
  hostGold: '#8a692c',
  hostBone: '#b8aa83',

  // Brief accent colours for combat feedback only — kept tiny and rare.
  flash: '#f4e7c0',
  ember: '#c4632a',
  hostGlow: '#b88a2e',

  uiDark: '#0d0b09',
  uiPanel: '#1a130f',
  uiBorderDark: '#3a2d22',
  uiBorderLight: '#7a644b',
  uiText: '#c8b99a',
  uiDim: '#887a63',
  uiGood: '#6f8a4c',
  uiSuccess: '#5f7446',
  uiWarn: '#b8862e',
  uiRare: '#3f638c',
  uiEpic: '#76518a',
  uiLegendary: '#c4632a',
  uiFailure: '#7e2c21',
  uiBad: '#9a3322',

  // Journal-only paper ramp. Kept here so the filing pages follow the same
  // central palette discipline as every other visible interface surface.
  uiPaperInk: '#1c150f',
  uiPaperInkDim: '#51432d',
  uiPaperFox: '#8e6738',
  uiPaperLow: '#8f7b50',
  uiPaperRule: '#aa9564',
  uiPaperBase: '#bdab7d',
  uiPaperFlap: '#c8b681',
  uiPaperHigh: '#d4c493'
};
