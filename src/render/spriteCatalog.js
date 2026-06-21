// The sprite catalog: the single source of truth for every renderable object
// `kind` in the world (walls, fixtures, structures, furniture, decals, ritual
// marks, gore, creatures, lights). It is the engine's prop registry.
//
// Why this exists
// ---------------
// A 90s-style tile engine grows by accumulating reusable building blocks (wall
// blocks, fixtures, furniture, plants, chairs, ...). Without a registry, each
// new block has to be wired into a giant switch in the renderer, a separate
// flat/volume Set, and the content validator, with no place that lists what
// exists. This file replaces all of that: ONE table that the renderer, the
// flat/volumetric split, and scripts/check-content.mjs all read.
//
// How to add a new block or prop (do it here, in one place)
// ---------------------------------------------------------
//   1. Write its draw function in PixelPrimitives.js, in the section that
//      matches its CATEGORY (signature: draw(ctx, cx, cy, seed, opts)).
//   2. Add ONE entry below: `kind: { draw, category, layer, flat?, block? }`.
//   3. Use the `kind` string in level data (a legend tile for a non-interactive
//      block, or an authored object for anything that needs interact/loot).
// That is the whole workflow. No renderer edits, no Set edits.
//
// Entry contract
// --------------
//   draw(ctx, cx, cy, seed, c)  cx,cy = screen pixel center of the tile.
//                               c = { prop, anim, pulse, flicker, player }.
//   category   one of CATEGORY.* (organization + docs only; not behavior).
//   layer      depth band within a tile for the painter's sort: 0 = walls and
//              wall-set blocks, 2 = free-standing volumetric props. Flat decals
//              are drawn in an earlier floor pass and ignore this.
//   flat       true = a flat ground decal, drawn in the floor pass.
//   block      true = a wall-grid block (rendered as / into a wall block). A
//              `wall-*` kind is a block by convention.

import * as P from './PixelPrimitives.js';
import { PALETTE } from './palette.js';
import { WALL_HEIGHT } from './renderConfig.js';

export const CATEGORY = {
  TERRAIN: 'terrain-block', // raw structural blocks: walls
  FIXTURE: 'fixture',       // a feature set INTO a wall block: window, safe, stash
  STRUCTURE: 'structure',   // free-standing architecture: columns, altars, barricades, bells
  FURNITURE: 'furniture',   // placed objects: pews, crates, barrels, lecterns, banners, satchels
  PROP: 'prop',             // misc small props: rubble piles, bone piles, caches
  DECAL: 'decal',           // flat ground marks: blood, dust, cracks, scraps
  RITUAL: 'ritual',         // satanic / ritual imagery: sigils, circles, pentagrams
  GORE: 'gore',             // corpses and blood bodies
  CREATURE: 'creature',     // Host victims / monsters rendered as world props
  LIGHT: 'light',           // emissive props: candles, campfires
  PLANT: 'plant'            // greenery (none yet; reserved for future biomes)
};

// Convenience for the most common entry: a single P.drawX(ctx, cx, cy, seed).
const simple = (fn, category, layer = 2) => ({
  category, layer, draw: (ctx, x, y, seed) => fn(ctx, x, y, seed)
});
// An orientation-aware prop: forwards the authored facing as opts.orient so one
// draw function can render at any of the four iso facings (see ORIENTS /
// isoFrame in PixelPrimitives.js). Use this instead of `simple` for any piece
// that reads opts.orient.
const oriented = (fn, category, layer = 2) => ({
  category, layer, draw: (ctx, x, y, seed, c) => fn(ctx, x, y, seed, { orient: c.prop.orient })
});
// A flat ground decal that takes (ctx, cx, cy, seed).
const decal = (fn) => ({ category: CATEGORY.DECAL, layer: 0, flat: true, draw: (ctx, x, y, seed) => fn(ctx, x, y, seed) });

export const SPRITE_CATALOG = {
  // --- Terrain blocks (tile-driven walls) --------------------------------
  'wall': {
    category: CATEGORY.TERRAIN, layer: 0, block: true,
    draw: (ctx, x, y, seed, c) => P.drawIsoWallBlock(ctx, x, y, c.prop.height ?? WALL_HEIGHT, seed)
  },
  'wall-broken': {
    category: CATEGORY.TERRAIN, layer: 0, block: true,
    draw: (ctx, x, y, seed, c) => P.drawIsoWallBlock(ctx, x, y, c.prop.height ?? Math.round(WALL_HEIGHT * 0.55), seed)
  },

  // --- Wall fixtures (a feature set into the SW face of a wall block) -----
  // Block first, then the fixture overlay, at the same cell. A fixture that
  // carries loot/locks (safe, stash) is placed as an authored object on a wall
  // cell; a purely visual fixture (window) can be a legend tile.
  'wall-window': {
    category: CATEGORY.FIXTURE, layer: 0, block: true,
    draw: (ctx, x, y, seed, c) => {
      P.drawIsoWallBlock(ctx, x, y, c.prop.height ?? WALL_HEIGHT, seed);
      P.drawChapelWindow(ctx, x, y, seed, { dim: c.prop.dim, flicker: c.flicker });
    }
  },
  'wall-safe': {
    category: CATEGORY.FIXTURE, layer: 0, block: true,
    draw: (ctx, x, y, seed, c) => {
      P.drawIsoWallBlock(ctx, x, y, c.prop.height ?? WALL_HEIGHT, seed);
      P.drawWallSafe(ctx, x, y, seed, { opened: c.prop.opened || c.prop.consumed });
    }
  },
  'wall-stash': {
    category: CATEGORY.FIXTURE, layer: 0, block: true,
    draw: (ctx, x, y, seed, c) => {
      P.drawIsoWallBlock(ctx, x, y, c.prop.height ?? WALL_HEIGHT, seed);
      P.drawWallStash(ctx, x, y, seed, { opened: c.prop.opened || c.prop.consumed });
    }
  },

  // --- Structures (free-standing architecture) ---------------------------
  'cracked-column': simple(P.drawCrackedColumn, CATEGORY.STRUCTURE),
  'saint-statue': simple(P.drawSaintStatue, CATEGORY.STRUCTURE),
  'stone-tomb': simple(P.drawStoneTomb, CATEGORY.STRUCTURE),
  'quarantine-barricade': simple(P.drawQuarantineBarricade, CATEGORY.STRUCTURE),
  'broken-bell': simple(P.drawBrokenBell, CATEGORY.STRUCTURE),
  'quarantine-sign': simple(P.drawQuarantineSign, CATEGORY.STRUCTURE),
  'chapel-double-door': {
    category: CATEGORY.STRUCTURE, layer: 18,
    draw: (ctx, x, y, seed, c) => {
      const opened = Boolean(c.prop.opened || c.prop.consumed);
      const start = c.prop.openedAt;
      const progress = opened
        ? (start == null ? 1 : Math.max(0, Math.min(1, ((c.anim?.tick ?? 0) - start) / 0.56)))
        : 0;
      P.drawChapelDoubleDoor(ctx, x, y, seed, {
        opened,
        progress,
        leaf: c.prop.doorLeaf,
        wallPlane: c.prop.wallPlane
      });
    }
  },
  'damaged-altar': {
    category: CATEGORY.STRUCTURE, layer: 2,
    draw: (ctx, x, y, seed, c) => P.drawDamagedAltar(ctx, x, y, seed, c.pulse)
  },

  // --- Furniture (placed objects) ----------------------------------------
  'broken-pew': simple(P.drawBrokenPew, CATEGORY.FURNITURE),
  'rusted-reliquary': simple(P.drawRustedReliquary, CATEGORY.FURNITURE),
  'field-satchel': simple(P.drawFieldSatchel, CATEGORY.FURNITURE),
  'rusted-crate': simple(P.drawRustedCrate, CATEGORY.FURNITURE),
  'sealed-storage-crate': simple(P.drawSealedStorageCrate, CATEGORY.FURNITURE),
  'canvas-tent': simple(P.drawCanvasTent, CATEGORY.FURNITURE),
  'camp-bedroll': simple(P.drawCampBedroll, CATEGORY.FURNITURE),
  'settlement-table': simple(P.drawSettlementTable, CATEGORY.FURNITURE),
  'low-stool': simple(P.drawLowStool, CATEGORY.FURNITURE),
  // Orientation-aware refectory pieces (reuse one texture at any iso facing).
  'dining-table': oriented(P.drawDiningTable, CATEGORY.FURNITURE),
  'dining-bench': oriented(P.drawDiningBench, CATEGORY.FURNITURE),
  'kitchen-counter': oriented(P.drawKitchenCounter, CATEGORY.FURNITURE),
  'kitchen-hearth': simple(P.drawKitchenHearth, CATEGORY.FURNITURE),
  'pantry-shelf': simple(P.drawPantryShelf, CATEGORY.FURNITURE),
  'wash-tub': simple(P.drawWashTub, CATEGORY.FURNITURE),
  'chapel-banner': simple(P.drawChapelBanner, CATEGORY.FURNITURE),
  'prayer-lectern': simple(P.drawPrayerLectern, CATEGORY.FURNITURE),
  'ritual-bowl': simple(P.drawRitualBowl, CATEGORY.FURNITURE),
  'chapel-font': simple(P.drawChapelFont, CATEGORY.FURNITURE),
  'rusted-barrel': {
    category: CATEGORY.FURNITURE, layer: 2,
    draw: (ctx, x, y, seed, c) => P.drawRustedBarrel(ctx, x, y, seed, {
      ladder: c.prop.interact?.type === 'secret-exit' || c.prop.interact?.type === 'secret-entrance'
    })
  },

  // --- Props (misc small props, caches) ----------------------------------
  'rubble-pile': simple(P.drawRubblePile, CATEGORY.PROP),
  'bone-pile': simple(P.drawBonePile, CATEGORY.PROP),
  'bone-niche': simple(P.drawBoneNiche, CATEGORY.PROP), // wall ossuary shelf of skulls + bones
  'loose-flagstone': simple(P.drawLooseFlagstone, CATEGORY.PROP), // a floor stash block
  'blue-ball': {
    category: CATEGORY.PROP, layer: 2,
    draw: (ctx, x, y, seed, c) => {
      if (!c.prop.consumed) P.drawBlueBall(ctx, x, y, seed);
    }
  },
  'ground-item': {
    category: CATEGORY.PROP, layer: 2,
    draw: (ctx, x, y, seed, c) => {
      const now = c.anim?.tick ?? 0;
      const dropDuration = c.prop.dropDuration ?? 0.38;
      const pickupDuration = c.prop.pickupDuration ?? 0.24;
      const drop = c.prop.droppedAt == null
        ? 1
        : Math.max(0, Math.min(1, (now - c.prop.droppedAt) / dropDuration));
      const pickup = c.prop.pickupStart == null
        ? 0
        : Math.max(0, Math.min(1, (now - c.prop.pickupStart) / pickupDuration));
      if (c.prop.consumed && pickup >= 1) return;
      P.drawGroundItem(ctx, x, y, seed, {
        model: c.prop.model,
        count: c.prop.count,
        drop,
        pickup
      });
    }
  },

  // --- Lights (emissive props) -------------------------------------------
  'candle-cluster': {
    category: CATEGORY.LIGHT, layer: 2,
    draw: (ctx, x, y, seed, c) => {
      P.drawWarmLightPool(ctx, x, y, seed, c.flicker);
      P.drawCandleCluster(ctx, x, y, seed, c.flicker);
    }
  },
  'campfire': {
    category: CATEGORY.LIGHT, layer: 2,
    draw: (ctx, x, y, seed, c) => P.drawCampfire(ctx, x, y, seed, c.flicker)
  },

  // --- Host growth (effect) ----------------------------------------------
  'host-growth': {
    category: CATEGORY.CREATURE, layer: 2,
    draw: (ctx, x, y, seed, c) => {
      P.drawShadowBlob(ctx, x, y + 2, 30, 14);
      P.drawHostGrowth(ctx, x, y, seed, c.pulse);
    }
  },

  // --- Gore (corpses, blood bodies) --------------------------------------
  'corpse': simple(P.drawCorpseSilhouette, CATEGORY.GORE),
  'cult-victim': simple(P.drawCultVictim, CATEGORY.GORE),
  'skeleton': simple(P.drawSkeleton, CATEGORY.GORE),

  // --- Creatures (Host victims / monsters rendered as world props) -------
  'cross-martyr': {
    category: CATEGORY.CREATURE, layer: 2,
    draw: (ctx, x, y, seed, c) => P.drawCrossMartyr(ctx, x, y, seed, {
      pulse: c.pulse,
      flicker: c.flicker,
      killed: c.prop.killed,
      dead: c.prop.dead,
      released: c.prop.released,
      fall: c.prop.released
        ? (c.prop.fallStart != null ? Math.min(1, ((c.anim?.tick ?? 0) - c.prop.fallStart) / 0.7) : 1)
        : 0,
      dim: c.prop.dim
    })
  },
  'bound-victim': {
    category: CATEGORY.CREATURE, layer: 2,
    draw: (ctx, x, y, seed, c) => P.drawBoundVictim(ctx, x, y, seed, {
      pulse: c.pulse, flicker: c.flicker, killed: c.prop.killed, dim: c.prop.dim
    })
  },
  'calcified-penitent': simple(P.drawCalcifiedPenitent, CATEGORY.CREATURE),

  // --- Ritual imagery ----------------------------------------------------
  'choir-pentagram': simple(P.drawChoirPentagram, CATEGORY.RITUAL), // wall-mounted, but drawn as a prop overlay
  // Flat ritual marks live in the decal block below (blood-sigil, ritual-circle).

  // --- Flat ground decals (drawn in the floor pass) ----------------------
  'blood-stain': decal((ctx, x, y, seed) => P.drawNoisePixels(ctx, x - 18, y - 8, 36, 16, [PALETTE.hostRed, PALETTE.rustDark], 0.16, seed)),
  'road-dust': decal((ctx, x, y, seed) => P.drawNoisePixels(ctx, x - 30, y - 11, 60, 22, [PALETTE.stoneDust, PALETTE.stoneMid], 0.1, seed)),
  'glass-debris': decal((ctx, x, y, seed) => P.drawNoisePixels(ctx, x - 18, y - 8, 36, 16, [PALETTE.hostBone, PALETTE.stoneLight], 0.07, seed)),
  'dust': decal((ctx, x, y, seed) => P.drawNoisePixels(ctx, x - 22, y - 9, 44, 18, [PALETTE.stoneDust], 0.05, seed)),
  'rubble-decal': decal((ctx, x, y, seed) => P.drawRubbleCluster(ctx, x, y, seed, 9)),
  'floor-crack': decal((ctx, x, y, seed) => P.drawCracks(ctx, x, y, seed, 5)),
  'scorch-mark': decal((ctx, x, y, seed) => P.drawScorchMark(ctx, x, y, seed)),
  'wax-stain': decal((ctx, x, y, seed) => P.drawWaxStain(ctx, x, y, seed)),
  'paper-scraps': decal((ctx, x, y, seed) => P.drawPaperScraps(ctx, x, y, seed)),
  'chalk-drawing': decal((ctx, x, y, seed) => P.drawChalkDrawing(ctx, x, y, seed)),
  'machine-oil': decal((ctx, x, y, seed) => P.drawMachineOil(ctx, x, y, seed)),
  'cobweb': decal((ctx, x, y, seed) => P.drawCobweb(ctx, x, y, seed)),
  'blood-sigil': { category: CATEGORY.RITUAL, layer: 0, flat: true, draw: (ctx, x, y, seed) => P.drawBloodSigil(ctx, x, y, seed) },
  'ritual-circle': { category: CATEGORY.RITUAL, layer: 0, flat: true, draw: (ctx, x, y, seed) => P.drawRitualCircle(ctx, x, y, seed) }
};

// Derived views (kept in sync automatically; never maintain a second list).
export const FLAT_KINDS = new Set(
  Object.entries(SPRITE_CATALOG).filter(([, v]) => v.flat).map(([k]) => k)
);
export const BLOCK_KINDS = new Set(
  Object.entries(SPRITE_CATALOG).filter(([, v]) => v.block).map(([k]) => k)
);

export function getSprite(kind) {
  return SPRITE_CATALOG[kind] ?? null;
}
export function isFlatKind(kind) {
  return FLAT_KINDS.has(kind);
}
export function layerFor(kind) {
  return SPRITE_CATALOG[kind]?.layer ?? 2;
}
