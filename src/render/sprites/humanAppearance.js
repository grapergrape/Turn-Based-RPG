import { PALETTE } from '../palette.js';

import { bakeActor } from './spriteBake.js';

import { CUT_STYLE, CHOIR_STYLE } from './hostCreatures.js';

import { SURVIVOR_CHILD_STYLE, SURVIVOR_MAN_STYLE, SURVIVOR_WOMAN_STYLE, drawHumanModelDetails } from './humanModels.js';



const HUMAN_BODY_PARTS = Object.freeze({
  average: Object.freeze({ width: 42, height: 62, style: Object.freeze({}) }),
  compact: Object.freeze({ width: 42, height: 62, style: Object.freeze({ shoulders: 13, waist: 8 }) }),
  sturdy: Object.freeze({ width: 44, height: 62, style: Object.freeze({ shoulders: 15, waist: 11 }) }),
  heavy: Object.freeze({ width: 46, height: 62, style: Object.freeze({ shoulders: 18, waist: 14, torsoLength: 17, legLength: 21 }) }),
  broad: Object.freeze({ width: 48, height: 64, style: Object.freeze({ shoulders: 21, waist: 12, torsoLength: 18, legLength: 23, armSize: 3 }) }),
  lean: Object.freeze({ width: 40, height: 64, style: Object.freeze({ shoulders: 12, waist: 7, torsoLength: 17, legLength: 25 }) }),
  gaunt: Object.freeze({ width: 38, height: 62, style: Object.freeze({ shoulders: 12, waist: 7, torsoLength: 17, legLength: 24, hunch: 3 }) }),
  teen: Object.freeze({ width: 38, height: 56, style: Object.freeze({ shoulders: 12, waist: 7, torsoLength: 14, legLength: 19 }) }),
  child: Object.freeze({ width: 36, height: 50, style: Object.freeze({}) }),
  'old-stooped': Object.freeze({ width: 44, height: 64, style: Object.freeze({ shoulders: 14, waist: 9, legLength: 21, hunch: 8 }) }),
  'old-bent': Object.freeze({ width: 42, height: 60, style: Object.freeze({ shoulders: 13, waist: 8, torsoLength: 16, legLength: 21, hunch: 6 }) }),
  'old-small': Object.freeze({ width: 40, height: 60, style: Object.freeze({ shoulders: 11, waist: 8, torsoLength: 16, legLength: 20, hunch: 5 }) })
});

const HUMAN_OUTFIT_PARTS = Object.freeze({
  'settlement-shawl': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    accent: 'bare-brown',
    style: Object.freeze({
      campBase: 'shawl',
      coatHi: PALETTE.hostBone,
      coat: PALETTE.clothTan,
      coatLo: PALETTE.stoneDust,
      pants: PALETTE.stoneDark
    })
  }),
  'settlement-quartermaster': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    accent: 'bare-brown',
    style: Object.freeze({
      campBase: 'shawl',
      campKit: 'quartermaster',
      coatHi: PALETTE.stoneDust,
      coat: PALETTE.stoneMid,
      coatLo: PALETTE.clothDark
    })
  }),
  'settlement-work-coat': Object.freeze({
    base: 'man',
    modelBase: 'survivor',
    accent: 'bare-brown',
    style: Object.freeze({
      campKit: 'settler',
      coatHi: PALETTE.stoneLight,
      coat: PALETTE.stoneMid,
      coatLo: PALETTE.stoneDark,
      pants: PALETTE.clothDark
    })
  }),
  'settlement-runner': Object.freeze({
    base: 'man',
    modelBase: 'survivor',
    body: 'lean',
    accent: 'dark-hood',
    style: Object.freeze({
      campKit: 'runner',
      coatHi: PALETTE.stoneDust,
      coat: PALETTE.stoneLight,
      coatLo: PALETTE.stoneDark,
      pants: PALETTE.clothBlueDark
    })
  }),
  'settlement-cook': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    body: 'sturdy',
    accent: 'bare-light',
    style: Object.freeze({
      campBase: 'shawl',
      campKit: 'cook',
      coatHi: PALETTE.clothTan,
      coat: PALETTE.rustDark,
      coatLo: PALETTE.clothDark
    })
  }),
  'settlement-mender': Object.freeze({
    base: 'man',
    modelBase: 'survivor',
    accent: 'bare-grey',
    style: Object.freeze({
      campKit: 'mender',
      coatHi: PALETTE.stoneDust,
      coat: PALETTE.stoneMid,
      coatLo: PALETTE.clothDark,
      pants: PALETTE.stoneDark
    })
  }),
  'settlement-water-carrier': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    accent: 'blue-cloth',
    style: Object.freeze({
      campBase: 'shawl',
      campKit: 'water',
      coatHi: PALETTE.clothBlue,
      coat: PALETTE.clothBlueDark,
      coatLo: PALETTE.void,
      pantsHi: PALETTE.stoneLight,
      pants: PALETTE.stoneMid
    })
  }),
  'settlement-chapel-hand': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    accent: 'bare-light',
    style: Object.freeze({
      campBase: 'shawl',
      campKit: 'chapel-hand',
      coatHi: PALETTE.stoneDust,
      coat: PALETTE.clothDark,
      coatLo: PALETTE.void,
      pants: PALETTE.stoneDark
    })
  }),
  'settlement-nurse': Object.freeze({
    base: 'woman',
    modelBase: 'survivor',
    body: 'compact',
    accent: 'pale-hood',
    style: Object.freeze({
      campBase: 'shawl',
      campKit: 'nurse',
      coatHi: PALETTE.hostBone,
      coat: PALETTE.stoneDust,
      coatLo: PALETTE.stoneDark
    })
  }),
  'settlement-child-blue': Object.freeze({
    base: 'child',
    modelBase: 'survivor',
    body: 'child',
    accent: 'bare-light',
    style: Object.freeze({
      campBase: 'child',
      campKit: 'blue-child',
      coatHi: PALETTE.stoneLight,
      coat: PALETTE.clothBlueDark,
      coatLo: PALETTE.void
    })
  }),
  'settlement-child-chalk': Object.freeze({
    base: 'child',
    modelBase: 'survivor',
    body: 'child',
    accent: 'bare-brown',
    style: Object.freeze({
      campBase: 'child',
      campKit: 'chalk-child',
      coatHi: PALETTE.clothTan,
      coat: PALETTE.stoneMid,
      coatLo: PALETTE.clothDark
    })
  }),
  'choir-red-robe': Object.freeze({
    base: 'choir',
    modelBase: 'choir',
    accent: 'bone-cowl',
    style: Object.freeze({
      coatHi: PALETTE.hostBone,
      coat: PALETTE.clothRed,
      coatLo: PALETTE.rustDark,
      pants: PALETTE.clothDark
    })
  }),
  'choir-dark-robe': Object.freeze({
    base: 'choir',
    modelBase: 'choir',
    accent: 'dark-cowl',
    style: Object.freeze({
      coatHi: PALETTE.stoneDust,
      coat: PALETTE.clothDark,
      coatLo: PALETTE.void,
      pants: PALETTE.clothDark,
      hunch: 4
    })
  }),
  'red-tithe-leathers': Object.freeze({
    base: 'cutthroat',
    modelBase: 'cutthroat',
    accent: 'rust-cowl',
    style: Object.freeze({
      coatHi: PALETTE.rustLight,
      coat: PALETTE.rustMid,
      coatLo: PALETTE.rustDark,
      pants: PALETTE.clothDark
    })
  })
});

const HUMAN_ACCENT_PARTS = Object.freeze({
  'bare-brown': Object.freeze({ style: Object.freeze({ hair: PALETTE.woodDark, hairHi: PALETTE.woodLight, bareHead: true, maskedHead: false }) }),
  'bare-grey': Object.freeze({ style: Object.freeze({ hair: PALETTE.stoneDark, hairHi: PALETTE.stoneDust, bareHead: true, maskedHead: false }) }),
  'bare-light': Object.freeze({ style: Object.freeze({ hair: PALETTE.woodLight, hairHi: PALETTE.clothTan, bareHead: true, maskedHead: false }) }),
  'dark-hood': Object.freeze({ style: Object.freeze({ hood: PALETTE.clothDark, hoodHi: PALETTE.stoneDust, bareHead: false, maskedHead: false }) }),
  'pale-hood': Object.freeze({ style: Object.freeze({ hood: PALETTE.clothTan, hoodHi: PALETTE.hostBone, bareHead: false, maskedHead: false }) }),
  'blue-cloth': Object.freeze({ style: Object.freeze({ hair: PALETTE.woodDark, hairHi: PALETTE.woodMid, hood: PALETTE.clothBlueDark, hoodHi: PALETTE.clothBlue, bareHead: true, maskedHead: false }) }),
  'bone-cowl': Object.freeze({ style: Object.freeze({ hood: PALETTE.clothDark, hoodHi: PALETTE.hostBone, bareHead: false, maskedHead: true }) }),
  'dark-cowl': Object.freeze({ style: Object.freeze({ hood: PALETTE.clothDark, hoodHi: PALETTE.stoneDust, bareHead: false, maskedHead: true }) }),
  'rust-cowl': Object.freeze({ style: Object.freeze({ hood: PALETTE.clothDark, hoodHi: PALETTE.rustMid, bareHead: false, maskedHead: true }) })
});

const HUMAN_GEAR_PARTS = Object.freeze({
  ledger: Object.freeze({}),
  'crate-pack': Object.freeze({}),
  cane: Object.freeze({}),
  'tool-roll': Object.freeze({}),
  'bandage-sling': Object.freeze({}),
  'medicine-bag': Object.freeze({}),
  'water-jars': Object.freeze({}),
  'message-tube': Object.freeze({}),
  'long-apron': Object.freeze({}),
  'prayer-cord': Object.freeze({}),
  'scarred-face': Object.freeze({}),
  'shoulder-plate': Object.freeze({}),
  'rope-coil': Object.freeze({}),
  'tally-tags': Object.freeze({}),
  'child-token': Object.freeze({}),
  'candle-tray': Object.freeze({}),
  'throat-glass': Object.freeze({}),
  'sacrament-flesh': Object.freeze({}),
  'bone-scroll': Object.freeze({}),
  veil: Object.freeze({}),
  chain: Object.freeze({}),
  'ash-mask': Object.freeze({}),
  'confessor-staff': Object.freeze({}),
  'knife-belt': Object.freeze({}),
  'raider-cleaver': Object.freeze({}),
  'thin-pack': Object.freeze({})
});

export const HUMAN_BODY_IDS = Object.freeze(Object.keys(HUMAN_BODY_PARTS));

export const HUMAN_OUTFIT_IDS = Object.freeze(Object.keys(HUMAN_OUTFIT_PARTS));

export const HUMAN_ACCENT_IDS = Object.freeze(Object.keys(HUMAN_ACCENT_PARTS));

export const HUMAN_GEAR_IDS = Object.freeze(Object.keys(HUMAN_GEAR_PARTS));

const DEFAULT_HUMAN_APPEARANCE = Object.freeze({
  body: 'average',
  outfit: 'settlement-work-coat',
  gear: Object.freeze([]),
  accent: 'bare-brown'
});

function baseStyleForOutfit(base) {
  switch (base) {
    case 'woman':
      return SURVIVOR_WOMAN_STYLE;
    case 'child':
      return SURVIVOR_CHILD_STYLE;
    case 'choir':
      return CHOIR_STYLE;
    case 'cutthroat':
      return CUT_STYLE;
    default:
      return SURVIVOR_MAN_STYLE;
  }
}

function normalizeHumanGear(gear) {
  if (!Array.isArray(gear)) return [];
  const requested = new Set(gear.filter((id) => typeof id === 'string' && HUMAN_GEAR_PARTS[id]));
  return HUMAN_GEAR_IDS.filter((id) => requested.has(id));
}

function normalizeHumanAppearance(appearance = {}) {
  const source = appearance && typeof appearance === 'object' && !Array.isArray(appearance)
    ? appearance
    : {};
  const outfit = typeof source.outfit === 'string' && HUMAN_OUTFIT_PARTS[source.outfit]
    ? source.outfit
    : DEFAULT_HUMAN_APPEARANCE.outfit;
  const outfitPart = HUMAN_OUTFIT_PARTS[outfit];
  const bodyDefault = outfitPart.body ?? DEFAULT_HUMAN_APPEARANCE.body;
  const accentDefault = outfitPart.accent ?? DEFAULT_HUMAN_APPEARANCE.accent;
  const body = typeof source.body === 'string' && HUMAN_BODY_PARTS[source.body]
    ? source.body
    : bodyDefault;
  const accent = typeof source.accent === 'string' && HUMAN_ACCENT_PARTS[source.accent]
    ? source.accent
    : accentDefault;
  const gear = normalizeHumanGear(source.gear);
  return Object.freeze({ body, outfit, gear: Object.freeze(gear), accent });
}

function humanAppearanceToken(value) {
  return String(value).replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'plain';
}

export function isHumanAppearance(appearance) {
  return Boolean(
    appearance &&
    typeof appearance === 'object' &&
    !Array.isArray(appearance) &&
    (
      appearance.body !== undefined ||
      appearance.outfit !== undefined ||
      appearance.gear !== undefined ||
      appearance.accent !== undefined
    )
  );
}

export function spriteIdForHumanAppearance(appearance = {}) {
  const normalized = normalizeHumanAppearance(appearance);
  const gearKey = normalized.gear.length > 0 ? normalized.gear.map(humanAppearanceToken).join('-') : 'plain';
  return [
    'human-composite',
    humanAppearanceToken(normalized.body),
    humanAppearanceToken(normalized.outfit),
    humanAppearanceToken(normalized.accent),
    gearKey
  ].join('-');
}

export function deriveHumanAppearanceStyle(appearance = {}) {
  const normalized = normalizeHumanAppearance(appearance);
  const bodyPart = HUMAN_BODY_PARTS[normalized.body];
  const outfitPart = HUMAN_OUTFIT_PARTS[normalized.outfit];
  const accentPart = HUMAN_ACCENT_PARTS[normalized.accent];
  const style = {
    ...baseStyleForOutfit(outfitPart.base),
    ...outfitPart.style,
    ...bodyPart.style,
    ...accentPart.style,
    modelBase: outfitPart.modelBase ?? 'survivor',
    modelKits: normalized.gear,
    decorate: drawHumanModelDetails
  };
  return Object.freeze({
    width: bodyPart.width,
    height: bodyPart.height,
    style: Object.freeze(style),
    appearance: normalized
  });
}

export function bakeHumanAppearance(appearance = {}) {
  const model = deriveHumanAppearanceStyle(appearance);
  return bakeActor(model.width, model.height, model.style);
}
