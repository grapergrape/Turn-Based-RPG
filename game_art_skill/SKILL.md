---
name: game-art-standard
version: 1.0.0
description: MANDATORY single standard for ALL runtime-drawn art in this repo. Read before drawing or editing anything visible: animated actors (src/render/SpriteAtlas.js), static world art (props, terrain, walls, buildings, interiors, furniture, plants, decals, gore, ritual marks, creatures, lights) registered in src/render/spriteCatalog.js with draw functions in src/render/PixelPrimitives.js, and the interface (src/render/UIRenderer.js, src/ui/*). Covers the engine reality, palette and ramps, the iso projection, the human and Host-monster figure standard, the prop/block catalog workflow, animation, and UI development. This supersedes and absorbs character_creature_art_skill.
---

# Game Art Standard (MANDATORY)

This is the one art skill for the project. Any AI or human MUST apply it before
drawing or editing anything a player can see: a character or creature sprite, a
wall, a floor, a building or room interior, a piece of furniture, a plant, a
prop, a corpse, a ritual mark, a light, or any part of the interface.

It exists so there is one quality bar and one visual language. A model, prop, or
panel added by a weaker agent must sit beside Mara Vey, the Opened Saint, and the
existing CRPG interface without looking flatter, blockier, cleaner, brighter, or
more modern. This skill absorbs the old `character_creature_art_skill`; that file
now redirects here.

Be concrete. Follow the numbers, the named palette colors, and the named draw
functions. When unsure, copy the structure of an existing exemplar (Section 18)
rather than inventing.

---

## 0. Scope, what to read, and related skills

This skill applies whenever you touch any of:

- `src/render/SpriteAtlas.js` — animated actors (player, NPCs, enemies, rats).
- `src/render/PixelPrimitives.js` — every static draw function (terrain, walls,
  fixtures, structures, furniture, props, decals, gore, ritual, creatures, lights).
- `src/render/spriteCatalog.js` — the registry that maps a `kind` string to a
  draw function, category, depth layer, and flat/block flags.
- `src/render/palette.js` — the color source of truth.
- `src/render/IsometricRenderer.js` — the scene compositor (how art is placed).
- `src/render/UIRenderer.js`, `src/ui/dialogueLayout.js`,
  `src/ui/journalLayout.js` — the interface.
- `src/render/isoMath.js`, `src/render/renderConfig.js` — projection and constants.
- any new visible figure, block, decal, or panel, and its placement in `data/`.

Before editing, read this whole file, then read the exact draw function, `style`
object, or layout you are about to change, then read one exemplar from Section 18.

Related skills (still binding):

- `anti_ai_slop_writing_skill/SKILL.md` — ALL player-facing text (names,
  descriptions, logs, UI strings). Hard ban on em-dashes / `--` / `—`. The UI
  font cannot even render a dash cleanly (Section 17).
- `late90s_isometric_crpg_skill/SKILL.md` — high-level art direction, review
  language, and production prompts for the era and mood. Use it for direction and
  critique; use THIS skill for how the running engine actually draws.
- `docs/lore/the_host_story_bible.md`, `docs/LORE_INTEGRATION.md` — canon for the
  Host and the Vale Imprint, which the monster standard (Section 12) enforces.

---

## 1. The engine reality (hard technical frame)

These are not preferences. The renderer enforces them (`renderConfig.js`,
`IsometricRenderer.js`).

- Internal resolution is 640x480. The world viewport is the top 640x384; the
  command panel is the bottom 640x96 (`VIEWPORT`, `UI_PANEL`). The buffer is
  upscaled with whole-number nearest-neighbor scaling and
  `imageSmoothingEnabled` is `false` everywhere. So: **hard pixels only.** Every
  edge is a stair-step. Nothing is anti-aliased.
- The world is isometric: 64x32 floor diamonds, walls 64px tall
  (`TILE_WIDTH`, `TILE_HEIGHT`, `WALL_HEIGHT`). Figures are SMALL. A human is
  about 50 to 64px tall at native size and is seen at roughly 2x to 3x. Detail
  you cannot read at that size is wasted or noise.
- Everything visible is built from `PALETTE` (Section 2) plus the primitives in
  `PixelPrimitives.js`. Do NOT introduce colors that are not in `palette.js`.
  If a material truly needs a new color, add it to `palette.js` deliberately and
  say why. No inline hex in draw code except the existing rare cases (a few alpha
  washes in `UIRenderer.js`, the parchment palette).
- NO smooth gradients. NO alpha-blended soft shadows used as shading. NO blur,
  bloom, glow filters, or modern post. Shade with hard color bands and 2px dither
  (`drawDitherRect`, `drawNoisePixels`, the `dither` helper, manual `px` rows).
- Determinism: any per-figure randomness MUST come from `rngFrom(hash2D(seed,
  ...))`, never `Math.random()`. The scene props are re-drawn every frame and
  must never shimmer. The static floor is baked once; actors are redrawn each
  frame from pre-baked canvas frames.

---

## 2. Palette and ramps

The full palette lives in `src/render/palette.js`. Families:

```text
void / outline            near-black bases and 1px outlines
stoneDark/Mid/Light/Dust  cold grey-browns: stone, ash, calcified flesh, dust
rustDark/Mid/Light        oxidized iron, leather, dried blood
woodDark/Mid/Light        timber, posts, crosses, pews, the journal cover
clothDark/Red/Tan         fabric: coats, robes, stoles, bandages
clothBlueDark/Blue        the one cool fabric accent (water carriers, runners)
skinDark/Mid/Light        human skin
hostBlack/Red/Gold/Bone   the Host: black flesh, wound-red, black-gold, bone
flash / ember / hostGlow  RARE bright accents: muzzle flash, embers, live wound
ui*                       interface only, never on world figures (Section 17)
```

Every material is a 3 to 4 step ramp: **hi, mid, lo, dk**. Light comes from the
upper-left, so the lit edge is the top/left and the shade is the bottom/right.
Be consistent across the whole figure or prop.

- Actors (`SpriteAtlas.js`): set `style.<name>Hi`, `style.<name>`,
  `style.<name>Lo`, `style.<name>Dk` and read them through `ramp(style, name)`,
  which returns `{ hi, mid, lo, dk }`. Existing ramps: `coat`, `pants`, `skin`,
  `hair`/`hood`, `boot`. Far limbs draw one ramp-step darker
  (`drawJointedLimb(..., far=true)`).
- Static art (`PixelPrimitives.js`): pick 3 to 4 palette colors per material and
  band them by hand. A flat single-color fill is a bug, not a style.

Bright accents (`flash`, `ember`, `hostGlow`) are tiny and rare: a candle tip, a
muzzle flash, a single living wound. Never fill an area with them.

Contact shadow is mandatory: call `drawShadowBlob(ctx, cx, cy + n, w, h)` under
any figure or free-standing prop that stands or lies on the ground. The actor
renderer adds one automatically (`drawShadowBlob` sized from sprite width). A
free prop with no shadow floats and fails review.

---

## 3. The projection and how draw functions are called

`isoMath.js` projects the logical grid to screen space.

- `gridToScreen(x, y, z, origin)` maps a grid cell to the screen-pixel CENTER of
  its floor diamond; `z` raises the point up (height). Outputs are integer-rounded.
- `sortKey(x, y, zLayer)` is the painter's depth key: `(x + y) * 8 + zLayer`.
  Larger `x + y` (further down-screen) draws later; `zLayer` breaks ties so a
  prop sits on top of its own floor tile. The catalog `layer` feeds this.
- `computeSceneBounds(w, h)` sizes the baked scene canvas and the origin. The
  whole map floor is baked once; the camera blits a sub-region and volumetric
  props plus actors are drawn over it in one depth-sorted pass.

Every static draw function has the signature:

```js
draw(ctx, cx, cy, seed, opts)   // cx, cy = screen-pixel CENTER of the tile
```

When the renderer calls through the catalog it passes
`c = { prop, anim, pulse, flicker, player }` as the last argument, so a draw can
read authored state (`c.prop.opened`, `c.prop.height`, `c.prop.dim`,
`c.prop.killed`, ...) and animation (`c.pulse`, `c.flicker`, `c.anim.tick`).
Plain props get a thin wrapper that only forwards `(ctx, cx, cy, seed)`.

Wall-face helpers (for fixtures that sit on the angled SW wall face):
`swFaceTop(cx, cy, x)` and `swFaceBot(cx, cy, x)` give the top/bottom screen Y of
the wall's SW face at a given screen X; `faceBand(...)` fills a band across it.

---

## 4. The two art systems

There are exactly two ways art enters the world. Know which one you are in.

- **A. Static world art** = `PixelPrimitives.js` draw functions registered as a
  `kind` in `spriteCatalog.js`. This is everything that is NOT an animated actor:
  terrain blocks, walls, wall fixtures, structures, furniture, props, ground
  items, decals, ritual marks, gore, lights, plants, and Host growths/creatures
  that live as world props (the cross-martyr, bound victim, calcified penitent).
  Sections 5 to 14.
- **B. Animated actors** = a `style` object plus `decorate` hook in
  `SpriteAtlas.js`, baked into directional frames and drawn from the atlas by
  `spriteId`. This is the player, NPCs, living enemies, and the Host rats.
  Section 15.

Both obey Sections 1, 2, 3, and 16. Pick the right system: a thing that walks and
fights is an actor; a thing that sits in place (even if it pulses) is a prop.

---

## 5. The block and prop catalog (how to add any building block)

Everything in system A is a `kind` string registered ONCE in
`spriteCatalog.js`. That file is the single source of truth: the renderer, the
flat-vs-volumetric split (`FLAT_KINDS`), the block set (`BLOCK_KINDS`), and the
content validator all read it. There is no per-kind `switch` and no second list.

This is how the engine grows. A 90s tile game is a library of reusable blocks
(walls, doors, windows, chairs, tables, plants, fixtures). Add them HERE, once,
and the next level just drops the `kind` into its data.

**The taxonomy** (`CATEGORY` in `spriteCatalog.js`):

```text
terrain-block  raw structural blocks (walls). tile-driven, layer 0, block:true
fixture        a feature set INTO a wall block (window, safe, stash). layer 0, block
structure      free-standing architecture (columns, altars, tombs, bells, barricades)
furniture      placed objects (pews, crates, barrels, lecterns, tents, bedrolls, banners)
prop           misc small props and caches (rubble, bone piles, flagstone, ground-item)
decal          FLAT ground marks (blood, dust, cracks, wax, scraps). drawn in the floor pass
ritual         satanic marks (pentagram, blood sigil, ritual circle)
gore           corpses and blood bodies (corpse, cult-victim, skeleton)
creature       Host victims/monsters rendered as props (cross-martyr, bound-victim, calcified-penitent, host-growth)
light          emissive props (candle-cluster, campfire)
plant          greenery (none yet; reserved, see Section 9)
```

**To add a new block or prop (the whole workflow):**

1. Write its draw function in `PixelPrimitives.js`, in the section that matches
   its category. Signature `draw(ctx, cx, cy, seed, opts)`. Obey Sections 1, 2,
   3, 16: palette only, ramp + dither, a contact shadow on free-standing props,
   NO baked light, seeded variation via `hash2D`/`rngFrom`.
2. Add ONE entry to `SPRITE_CATALOG`. Use the `simple(fn, CATEGORY.X)` helper for
   a plain `(ctx, cx, cy, seed)` prop, `decal(fn)` for a flat ground mark, or a
   full `{ draw, category, layer, flat?, block? }` literal when the draw needs
   state/animation from `c = { prop, anim, pulse, flicker, player }`:

   ```js
   'reading-chair': simple(P.drawReadingChair, CATEGORY.FURNITURE),
   'ash-puddle':    decal((ctx, x, y, seed) => P.drawAshPuddle(ctx, x, y, seed)),
   'altar': { category: CATEGORY.STRUCTURE, layer: 2,
              draw: (ctx, x, y, seed, c) => P.drawDamagedAltar(ctx, x, y, seed, c.pulse) },
   ```
3. Use the `kind` in level data (`data/levels/*.json`): a legend tile letter for
   a non-interactive block, or an authored `objects[]` entry for anything that
   needs `interact`/loot/`blocking`. `npm run check` FAILS if a level uses a
   `kind` that is not in the catalog (or a non-walkable legend block that is not
   in the catalog), so typos and unrenderable kinds are caught, not silently
   dropped.

That is the entire workflow. No renderer edits, no Set edits.

**Blocks vs fixtures vs props vs decals:**

- A BLOCK fills a wall cell and is drawn as / into a wall block (layer 0). Mark
  it `block: true` and name it `wall-*` by convention. A purely visual block (a
  window) can be a legend tile letter. A block that must carry loot or a lock (a
  safe, a stash) is an authored OBJECT placed on a wall cell instead, because
  tiles cannot carry an `interact`. The loader skips the default wall behind any
  `wall-*` object, so the block is not drawn twice.
- A FIXTURE draws onto the SW face of the wall block, AFTER `drawIsoWallBlock`,
  using `swFaceTop`/`swFaceBot`/`faceBand` so it sits flush on the angled stone.
  It MUST read against the stoneMid wall: a dark recess frame, a lit top edge,
  and a bright or brass accent. Study `drawChapelWindow`, `drawWallSafe`,
  `drawWallStash`. Do NOT draw a fixture in plain wall-stone tones with no recess
  or accent; it disappears into the wall.
- A PROP is a free-standing object at layer 2. A DECAL is a flat floor mark
  (`flat: true`), drawn in the baked floor pass and ignoring `layer`.

**Orientation-aware props (reuse one texture at any facing):** a free-standing
piece whose footprint has a long axis or a clear front (tables, benches,
counters, beds, shelves, anything that can sit either way along a wall) should
support the four isometric facings so it can be reused at different places and
orientations from data, not redrawn per rotation. Author it once on the
`isoFrame` / `orientedBox` helpers in `PixelPrimitives.js`: `isoFrame(cx, cy,
orient)` gives a rotated local footprint frame (`point(la, lb, h)` in tile
units), and `orientedBox` draws a raised box on that footprint. The four facings
are `'se'` (default), `'sw'`, `'nw'`, `'ne'` (the screen direction the front
points). Crucially, `orientedBox` colors faces by SCREEN position (lower-left =
lit ramp, lower-right = shade, cap = top), so the light stays upper-left in every
facing and a rotated copy never looks lit from the wrong side (Section 16). Put
asymmetric top detail (plates, an oven mouth, a cutting board) in LOCAL frame
coords via `frame.point(...)` so it rotates with the piece. Register the kind
with `oriented(P.drawX, CATEGORY.FURNITURE)` (not `simple`) so the catalog
forwards `c.prop.orient` as `opts.orient`; level data then sets `"orient"` on the
object. Exemplars: `drawDiningTable`, `drawDiningBench`, `drawKitchenCounter`.

**DON'T:** add a `case` to a renderer switch (there isn't one); keep a second
hardcoded list of kinds; bake a window/light pool/god-ray into a creature or
prop (Section 16); or mirror an oriented prop with a raw `ctx.scale(-1, 1)`
(that swaps the lit and shaded faces, breaking upper-left light). Use the
orientation frame instead.

---

## 6. Terrain and ground

The floor is baked once into the static scene (`rebuildStaticScene`), not drawn
per frame. Per cell:

- `drawRuinedStoneFloorCell(ctx, cx, cy, gx, gy)` draws a dirty stone diamond.
  It is seeded off the grid coords so each tile differs without shimmering. This
  is the floor; do not replace it with a flat fill.
- Near walls and props, `drawFloorGrime(ctx, cx, cy, seed, intensity)` adds
  localized grime. The renderer raises intensity by `#wallPressure` (how many of
  the 4 neighbors are walls or out of bounds). Grime hugs structure; it is not
  uniform speckle across the room.
- Flat decals (`FLAT_KINDS`) are baked on top of the floor in the same pass:
  `blood-stain`, `road-dust`, `glass-debris`, `dust`, `rubble-decal`,
  `floor-crack`, `scorch-mark`, `wax-stain`, `paper-scraps`, `chalk-drawing`,
  `machine-oil`, `cobweb`, plus the flat ritual marks `blood-sigil` and
  `ritual-circle`. Decals are built from `drawNoisePixels`, `drawCracks`,
  `drawRubbleCluster`, `drawScorchMark`, etc. Keep density low (most are 0.05 to
  0.16) so the floor reads as aged stone, not TV static.
- Per-level mood multiplies a cold or warm shade over the whole baked floor
  (`mood.floorShade`, `floorShadeAlpha`) and can wash the air
  (`mood.ambient`, `ambientAlpha`) and deepen the edge vignette (`mood.vignette`).
  Use mood to make a cellar read colder than a nave; do not tint individual props
  to fake it.

Authoring rule: dirt, grime, cracks, blood, dust, and damage are HAND-PLACED and
story-driven. Scatter them where something happened (a murder, a spill, a
collapse), not evenly.

---

## 7. Walls, buildings, houses, and interiors

A "house", room, or chapel interior is built from three layers of level data,
not from one big drawing:

1. **The tile grid + legend** define the shell. `#` is `wall` (full height),
   other letters map to `floor` or special blocks. Example legend entries:
   `"#": { "kind": "wall", "walkable": false }`,
   `"b": { "kind": "wall-broken", "walkable": false, "height": 30 }`,
   `".": { "kind": "floor", "walkable": true }`. Walls are drawn by
   `drawIsoWallBlock(ctx, cx, cy, heightPx, seed)`; `wall-broken` passes a shorter
   height (about 55% of `WALL_HEIGHT`, or an explicit `height`). The floor under a
   wall cell is skipped because the block covers it.
2. **Fixtures set into walls**: `wall-window`, `wall-safe`, `wall-stash`. These
   draw the wall block first, then the fixture on the SW face. Windows are a
   legend tile or object; safes and stashes are authored objects on a wall cell
   with `interact`/loot. This is how you put a barred window, an alcove, or a
   hidden safe into a room.
3. **Free-standing interior architecture and furniture as objects**: columns
   (`cracked-column`), altars (`damaged-altar`), fonts (`chapel-font`), statues
   (`saint-statue`), tombs (`stone-tomb`), bells (`broken-bell`), barricades
   (`quarantine-barricade`), signs (`quarantine-sign`), lecterns
   (`prayer-lectern`), pews (`broken-pew`), reliquaries, crates, barrels, tents
   (`canvas-tent`), bedrolls (`camp-bedroll`), banners (`chapel-banner`), bone
   niches, etc. Place them on floor tiles with `blocking: true` where they should
   stop movement.

To build a new room or building type:

- Lay the shell in `tiles`/`legend` (keep rows equal to `width`, rows count equal
  to `height`). Use `wall-broken` and rubble decals to imply a breach.
- Drop interior structure and furniture as `objects[]` with grid coords.
- Add light sources as props (Section 10), never baked into a wall or creature.
- If a building needs a new architectural piece (a door, a staircase block, a
  hearth, a counter, a shelf), add it as a new `kind` per Section 5, in the
  STRUCTURE or FURNITURE section of `PixelPrimitives.js`. Build it from the same
  stone/wood/rust ramps and give it a clear silhouette and a contact shadow.

The renderer fades any wall or prop that sits within one tile in FRONT of the
player to ~0.4 to 0.5 alpha (`#occludingPropAlpha`) so interiors cut away instead
of hiding the figure. You do not implement this; just know tall blocks will go
semi-transparent near the player, so a wall must still read when faded.

Occlusion and depth are handled by the catalog `layer` and `sortKey`. Walls and
wall-set blocks are layer 0; free props are layer 2; actors are layer 3 (1 when
dead). If a new prop sorts wrong against actors, check its `layer`, not the
renderer.

---

## 8. Furniture, props, caches, and ground items

Furniture and props follow the catalog workflow (Section 5). Patterns to copy:

- Build the body from stone/wood/rust ramps with hard bands and a little dither;
  add a `drawShadowBlob` under it; seed small variation (a tilted plank, a dent)
  off `hash2D` so repeated copies are not identical.
- A container or cache that opens reads its state from `c.prop.opened` /
  `c.prop.consumed` and draws an open lid / empty interior (see `drawWallSafe`,
  `drawWallStash`, `drawRustedBarrel` with the `ladder` option for secret exits).
- Ground items (`ground-item` kind) are dropped/picked-up loot. `drawGroundItem`
  animates a drop and pickup off `c.prop.droppedAt`/`pickupStart` and `c.anim.tick`,
  and dispatches to a per-model glyph. Item `groundModel` must be one of the
  current models: `ball`, `boots`, `coat`, `hood`, `vest`, `ring`, `necklace`,
  `key`, `token`, `chit`, `paper`, `vial`, `dressing`, `rounds`, `shard`. To add a
  new item silhouette, add a `drawGroundX` and a case in `drawGroundItemModel`,
  then document the new model name in `docs/CONTENT_PIPELINE.md`.

Keep furniture small and readable in silhouette at gameplay zoom; greebles that
vanish at 2x are wasted.

---

## 9. Plants and greenery (reserved category)

The `PLANT` category exists in the catalog but has no entries yet. The world is
ash-choked post-collapse gothic horror, so greenery is rare, sick, and tied to
the setting. When you add the first plant:

- Register it as `CATEGORY.PLANT` per Section 5 and build it from the existing
  palette: dead growth in `stoneDust`/`woodDark`/`rustDark`; the rare living
  thing in muted tones, never a bright clean green (there is no green in the
  palette, and that is on purpose).
- Host-touched growth already exists as `host-growth` / `drawHostGrowth` (black
  flesh, `hostGold` veins, a small pulsing wound). Sick fungal or Host-fed plants
  should read as that family, not as cheerful flora.
- Keep the horror tone: roots through a corpse, mold on a wet wall, a fouled
  herb bed. No lush gardens. A contact shadow is still mandatory.

---

## 10. Lights and emissive props

Light is its own category and is owned by terrain and props, never by creatures
(Section 16). Existing lights:

- `candle-cluster`: draws a `drawWarmLightPool` (hard-banded pool, no gradient)
  then `drawCandleCluster`, both driven by `c.flicker`.
- `campfire`: `drawCampfire(ctx, cx, cy, seed, c.flicker)`.
- Window light is part of the `wall-window` fixture (`drawChapelWindow`), which
  takes `dim` and `flicker`.

A light pool is built from a few hard translucent void/warm bands, not a radial
gradient. Flicker is a 2-state toggle (`anim.flicker`, see Section 15), not a
smooth fade. A new light source (a brazier, a lantern, a guttering torch) is a
new `kind` in the LIGHT section that emits its own small pool and obeys the
flicker timing.

---

## 11. The human standard (reference: Mara Vey)

Humans must read as tiny real people, never blocks, never chibi. Silhouette
first: if the black-only outline does not read as the role, no detail will save
it.

Native proportions (the values Mara uses; stay close):

```text
Total height        50-64 px        Shoulder width   13-18 px
Head height         8-10 px         Waist width      8-10 px
Torso height        14-18 px        Leg length       22-26 px
Boots               3-6 px          Hands            2-3 px clusters
Weapon thickness    1-3 px
```

Construction rules:

- Small head. Narrow, slightly sloped shoulders. Jointed limbs
  (`drawJointedLimb`), not stiff rectangles. Legs taper into readable boots
  (`drawBoot`). Use `taperedSpan` for the torso and head so nothing is a flat box.
- Clothing in layers with asymmetry: a coat with a tail (`coatTail`), a scarf low
  on the neck, one strap across the chest, a belt with a pouch or holster on one
  side. Asymmetry is what stops a figure reading as a toy.
- Skin uses the `skin` ramp. Cloth is `clothDark`/`clothTan`. Leather and straps
  are `rust*`. Bone (`hostBone`) only as a tiny accent on a human (a token, a
  button), never as a face.
- Head: a small `taperedSpan` of skin under a hood (cloth) or hair. The face is
  mostly shadow with 1 to 2px eyes and a hint of jaw. Never a big round ball,
  never detailed eyes or a mouth at this scale.
- Tiny metal glints (1px `stoneLight`/`hostBone`/`flash`) on the head, a
  shoulder, the boots, the weapon sell "downsampled real person."
- 8 facings (`FACING_META`), poses in `POSES` (idle, walk, attack, hit,
  interact), planted feet in the walk cycle (no sliding), a subtle idle, and a
  flat readable corpse via `drawDeath`.

Mara is equipment-driven: her `style` is composed from worn gear in
`deriveMaraStyle` / `composeMaraStyle`. If you change her body, the fully-dressed
look must still match her established sprite (Section 15 covers the equipment
system). NPC survivors reuse `SURVIVOR_*` styles plus per-character `campKit`
decorations.

Human DON'T: cube/block head, oversized head, chibi, noodle limbs, perfectly
symmetric clean gear, flat single-color fills, faces with real detail, smooth
shading.

---

## 12. The monster standard (the Vale Imprint)

Canon law, from `docs/lore/the_host_story_bible.md` and `AGENTS.md`: every Host
creature is **something trying to be holy and failing horribly**. It is human
material reshaped into an infernal religious icon. It is never a generic zombie,
never a random alien, never cute. If it looks like a neat fantasy golem or a
clean mascot, it is wrong.

The body-horror vocabulary. Use 3 to 5 of these per creature, not all:

- bone halos, broken and asymmetric, behind or around the skull
- hands fused at the palms into permanent prayer
- a ribcage cracked down the sternum and butterflied open (the two rib-halves
  spread wide like wings of bone) over a wet cavity with one small wound in it
- tendrils worked out of an opening, tapering and curling, with a wet lit edge
- exposed nerves or veins like red scripture
- black-gold tissue: thin `hostGold` veins and seams, mostly UNDER the skin, on
  human skin (`skinDark`/`skinMid`) or near-black `hostBlack` flesh
- bone-thorns erupting from shoulders and spine, snapped and uneven
- false wings, mouth clusters, or a second screaming maw with bone teeth
- a face stretched into an agony mask
- a goat or ram skull and horns (Section 12b) for fully opened heads
- calcification: pale `stoneDust`/`hostBone`, veins drained to `stoneDark`, no
  glow, frozen mid-gesture (the Stilling caught it)
- wet vestment-flesh hanging like robes, embedded ship-metal or steel plating,
  stained-glass eye clusters
- the whole body bent into a cruciform or kneeling pose

Color language for the Host:

```text
flesh            human skin (skinDark/skinMid) for victims; hostBlack for fully turned
wound / blood    hostRed
black-gold       hostGold (thin veins/seams under the skin, halo glints; a bead or
                 two at a fresh wound, never a flood)
bone / thorn     hostBone (skull, halo, teeth, thorns), shaded with void
living wound     hostGlow or flash, ONLY as a small pulsing core
calcified        stoneDust / hostBone body, stoneDark dead veins, NO glow
```

The single wound: most living Host forms have one glowing black-gold wound that
pulses (drive it off `pose.bob` or the `pulse`/`flicker` opts). Dead or calcified
forms: the wound is sunken and grey, no glow, no pulse.

**Asymmetry is mandatory.** One horn intact, the other snapped to a stump. The
halo whole on one side, splintered on the other. One arm fused across the chest,
the other dragging on the floor. Symmetry and clean repetition are exactly what
make a Host creature read as a goofy golem. Break every pair. (The one exception
is a butterflied ribcage, symmetric on purpose: the wings of bone spread evenly
from the split sternum. Keep the rest of the body asymmetric around it.)

**It is made from a person.** Unless a form has been fully consumed, it should
still read as a human being the horror has grown THROUGH: keep the human
silhouette, human skin, human limbs and proportions, and keep it roughly
human-sized. The dread is that you can still see the man under it. (The Penitent
Bastion / `PEN_STYLE` is the deliberately larger, further-gone exception; even it
keeps a human pose under the growth.)

**Black-gold is a trace, not a flood.** The transformation is bodily: bone,
growth, opened flesh, reshaped anatomy. The black-gold is the lit wiring of it,
not a substance pouring out. Thin veins and seams mostly under the skin, a small
wound core, a few faint glints. A bead or two may well at a fresh opening. Do NOT
have it gushing, weeping in streaks, or oozing off the body.

### 12b. Goat and ram skull heads (the standard "opened" head)

A neat bone ball with two little stubs reads as a golem. A fully opened Host head
must read as a **goat or ram skull**:

- Elongated skull, taller and longer than wide. A long muzzle that drops forward
  and down, not a round cranium. The muzzle is the silhouette tell.
- Big horns: ram horns curl back and down in a spiral, goat horns sweep up and
  out. Draw them RIDGED (3 to 4 notches) and ASYMMETRIC: one long and intact, the
  other broken to a jagged stump.
- Eyes set wide and angled into deep sockets: hollow `void`, or a horizontal
  rectangular goat pupil in `hostGold`, with `flash`/`hostGlow` only if alive.
- A long narrow jaw hanging open or broken off-line, with a row of flat bone
  teeth (`hostBone` over a `void` gap).
- Bone tone `hostBone`; shade sockets, muzzle seam, and under the jaw with
  `void`/`hostBlack`. A little `hostGold` may glint in sockets and cracks; no
  streaks down the face.

Rough sizes for a large crucified head (~16 to 22px native): muzzle 6 to 9px,
horns 6 to 12px, sockets 2 to 3px, teeth 1px over a 3 to 5px gap. Scale down for
smaller creatures. Stage by infection level: early victim keeps a human head;
mid-stage shows a bud of bone or one starting horn over a still-human face; fully
opened shows the skull.

---

## 13. Satanic and ritual imagery

The Choir of the Open Wound marks ground and bodies. Every mark is rough and
hand-daubed (paint, blood, carving), never a clean vector shape.

- Wound-star: a point-DOWN (inverted) five-line pentagram inside a rough ring,
  `hostRed` paint with `hostGold` bleed where it eats stone, plus drips. See
  `drawChoirPentagram`. One vertex points straight down.
- Inverted cross: an upright with the crossbar set LOW. See `drawBloodSigil`,
  `drawChapelBanner`, `drawRitualCircle`.
- Ritual circle: a double blood ring around an inverted cross with bone markers
  at the cardinal points.
- Carved-into-flesh: a point-down star plus scratch-line "words" cut in `hostRed`
  on a bared patch of pale skin. See `drawCultVictim`.

Goat heads and inverted stars are the two strongest "this is the Choir" signals.
Use them where the cult has worked.

---

## 14. Gore

Gore is brutal but placed and story-driven, never a random red mess.

- Blood pool: a `drawIsoDiamond` in `rustDark` at ~0.85 alpha (dried) with a
  smaller `hostRed` center (fresher), then `drawNoisePixels` spatter around it.
  A drag smear is a short trailing line of `px`.
- Fresh blood is `hostRed`. Dried is `rustDark`. Old Host seep is
  `hostGold`/`hostBlack`.
- Stab wounds are `void` punctures with a single `hostRed` pixel. Cuts are
  `rustDark`/`hostRed` lines. Carved sigils sit on bared `skinMid` skin.

See `drawCultVictim` and `drawCalcifiedPenitent` for the reference treatment.

---

## 15. Animated actors (the SpriteAtlas system)

Actors are baked into tiny native-resolution canvas frames per state and facing,
then drawn from the atlas by `spriteId`. Movement is quantized to the frames and
positions snap to whole pixels.

**The shape of an actor.** An actor is a `style` object plus body proportions and
a `decorate(args)` hook. Copy `MARA_BODY`, `CUT_STYLE`, or `SURVIVOR_MAN_STYLE`:

```text
shoulders, waist, torsoLength, legLength, headHeight   proportions (px)
legSize, armSize                                        limb thickness
coatTail, hunch                                         silhouette tweaks
<name>Hi/<name>/<name>Lo/<name>Dk                       ramps: coat, pants, skin, boot
hair/hairHi, hood/hoodHi, belt, weapon, pendant         accents
bareHead / maskedHead / hostHead                        head mode flags
decorate(args)                                          actor-specific pixel clusters
```

The base body (`drawActorBase`) handles legs, boots, torso (`drawTorso`), arms,
head (`drawSmallHead`), and the attack/hit/reach poses. `decorate` adds the parts
unique to this actor (harness, stole, prayer-arms, satchels) and receives
`{ ctx, px, linePx, dither, meta, facing, pose, style, cx, footY, hipY,
shoulderY, headY, torso }`.

**Facings and poses.** 8 facings (`FACINGS`/`FACING_META`) with per-facing
`view` (front/three/side/back), `side`, and `bodyTurn`. `viewScale` narrows side
views. `POSES` defines frame lists for `idle` (4), `walk` (8, planted feet),
`attack` (6), `hit` (4), `interact` (6). `drawDeath` bakes 10 frames of a flat,
readable corpse that differs per archetype (Host collapses to a black-gold icon
with scattered halo bone; a cultist crumples into robes by a dropped knife; a
human falls in her coat).

**Heads.** `drawSmallHead` branches on `hostHead` (stretched agony mask / opening
skull, broken horn, one hollow eye and one gold pin), `maskedHead` (cowl with a
dark slit), or the default human head (`bareHead` shows skin and a lit brow; with
a hood the crown is dark cloth). Pick the flag that matches the archetype.

**Baking and registering.** `bakeActor(w, h, style)` bakes all states/facings and
the death set into an atlas entry `{ width, height, anchorX, anchorY, frames,
death }`. Register it in `buildSpriteAtlas()` under a key, and the actor's
`spriteId` in `data/actors|enemies/*.json` MUST match that key. Current sizes:
Mara and adult survivors 42x62, children 36x50, choir/cutthroat 44x64, the
Penitent 64x92, Host rats 54x42. `getFrame(atlas, spriteId, state, facing, i)`
resolves a frame (state `dead` reads the death set).

**Non-biped actors.** The Host rats are baked by `bakeHostRat(variant, drawBody)`
with their own body builders (`drawSixLeggedRat`, `drawThroatMawRat`,
`drawTendrilWalkerRat`) and `drawRatDeath`. They still use `FACING_META`/`POSES`,
a contact shadow, and the Host palette. Copy this pattern for any new
multi-limbed or non-humanoid creature instead of forcing it through `drawActorBase`.

**Equipment-driven look (Mara).** `deriveMaraStyle(equipment, itemDefs)` composes
the style from worn items: each item's own `visual` block wins, then
`MARA_ITEM_VISUALS`, then a generic per-slot look. Empty slots fall back to a
stripped look (dark shirt, no vest, bare feet, bare head) so removing gear is
always visible. To make a new item change the sprite, give the item JSON a
`visual` block (e.g. `{ "coat": "stoneDust", "coatHi": "hostBone", "coatTail": 7 }`
using palette color names). The inventory paper doll reads the SAME atlas entry,
so the dressed figure in the pack matches the one in the world. `bakeMara` is
re-run whenever gear changes.

**Animation timing (from `Game.js`, all derived from `anim.tick` in seconds):**

```text
anim.idleFrame = floor(tick / 0.35) % 4   slow breathing idle
anim.bob       = floor(tick / 0.5)  % 2    1px body bob; many host wounds pulse off this
anim.flicker   = floor(tick / 0.13) % 2    fast 2-state candle/window flicker
anim.pulse     = floor(tick / 0.6)  % 2    slow 2-state wound/altar pulse
```

These are 2-state (or 4-state) toggles, not smooth interpolation. A living wound
swaps between `hostGold` and `hostGlow`/`flash` on `pulse`; a candle swaps tones
on `flicker`. Actors also receive `pxOffset` for smooth tween between tiles
(handled by the renderer; you do not animate position in the sprite). Effects
(`muzzle`, `slash`, `spark`, floating combat text) are drawn separately by
`#drawEffects` in `flash`/`ember`.

To add a new animated actor: add a `style` (or a rat-style body builder), a
`decorate`, register in `buildSpriteAtlas()`, set the data `spriteId` to match,
and verify all 8 facings and every state plus the death set.

---

## 16. Terrain owns light, not creatures (hard rule)

A creature or prop model must read on its own, lit from the upper-left like
everything else. Do NOT bake an environmental light source into a creature so it
becomes a backlit black cutout.

- Windows, light pools, candle clusters, braziers, campfires, and god-rays are
  TERRAIN or separate LIGHT props placed in the scene (`wall-window`,
  `candle-cluster`, `campfire`, `drawWarmLightPool`). They are owned by level
  data and the static scene, not by a monster's draw function.
- A creature MAY have its own small emissive detail: a glowing wound, a gold
  glint in the eye sockets, an ember on a censer. It may NOT carry an
  architectural light fixture.
- Never ship a figure that is a flat `hostBlack`/`void` silhouette with no
  internal structure. Even a dark Host form must show ribs, veins, bone edges,
  and a skull. If you remove a backlight, add internal lit edges (`hostBone` rim,
  `hostGold` veins) so the model still reads.

---

## 17. UI development (for everyone, especially lesser models)

The interface is drawn directly to the 640x480 canvas with hard pixels in
`UIRenderer.js` (plus layout in `src/ui/dialogueLayout.js` and
`src/ui/journalLayout.js`). No browser fonts for UI, no arcs, no gradients, no
vector icons. If you are a smaller model doing UI work, follow this section
literally and copy the existing private helpers.

**Golden rules**

1. Colors come ONLY from the `ui*` palette family (`uiDark`, `uiPanel`,
   `uiBorderDark`, `uiBorderLight`, `uiText`, `uiDim`, `uiGood`, `uiWarn`,
   `uiBad`) plus `void`/`outline`, and a few documented alpha washes and the
   `PARCHMENT` table for the journal book. Never paint UI with world figure
   colors (skin, host, cloth) except where the existing design already does
   (the journal uses wood/cloth tones for the leather cover; the seal uses
   host/cloth red).
2. Everything is integer-pixel rects via the private `#rect(ctx, x, y, w, h,
   color)`. Do not call `ctx.arc`, gradients, or `ctx.fillText` for UI chrome.
3. Text is a hand-built bitmap font (`FONT`, 5x7 glyphs). Draw with
   `#text(ctx, str, x, y, color, scale)`; measure with `#textWidth(str, scale)`;
   fit with `#wrap(str, maxChars)` and `#clip(str, max)`. Advance is `6*scale`
   px per glyph.
4. `#normalize` upper-cases text, converts smart quotes, and turns any dash
   (`–`/`—`) into a plain `-`, then strips unsupported characters. The font has
   no lowercase. This is why player-facing text must follow
   `anti_ai_slop_writing_skill/SKILL.md`: an em-dash renders as a lone `-` and
   reads as AI slop. Write around dashes; do not rely on `#normalize` to hide them.
5. Browser `ctx.font` text is used ONLY for two in-world overlays drawn by the
   scene compositor: actor speech bubbles and floating combat numbers
   (`9px`/`11px "Courier New"`). All panel/menu/HUD text uses the bitmap `#text`.

**The building blocks (reuse these, do not reinvent):**

```text
#panelTexture(box)        riveted dark metal panel fill (the command bar)
#window(box, title)       framed window: outline, lit top/left, dark bottom/right,
                          a title strip with two #rivet glyphs
#inset(box)               a recessed well (darker, inverted bevel) for content
#bar(x,y,w,h,ratio,color) a segmented value bar (HP)
#apPips(x,y,ap,maxAp)     action-point pips
#rivet(x,y)               a 4x4 brass rivet
#scrollArrow(x,y,dir,c)   a small solid scroll triangle
#cursorBox / #cursorLine  cursor glyph parts
#text / #textWidth / #wrap / #clip / #formatWeight   text helpers
```

**Screens and where they live:**

- HUD (always on): `#drawHud` builds the bottom panel with three windows,
  `MESSAGE LOG` (`LOG_BOX`), `STATUS` (`STATUS_BOX`), `COMMAND` (`COMMAND_BOX`).
  Status shows name/role, an HP bar, mode, and either combat AP/action/target or
  the pack weight.
- Inventory (`#drawInventory`, `INVENTORY_BOX`): items list, a live paper-doll
  (`#drawPaperDoll` draws the real `idle/s/0` atlas frame at 2x so equipped gear
  shows), a gear-slot column, and a detail well. Footer lists the key bindings.
- Journal (`#drawJournal`): a worn leather book with section tabs and two
  parchment pages, using the `PARCHMENT` palette and `JOURNAL_BOOK` /
  `JOURNAL_ARROW_BOXES` geometry from `journalLayout.js`. Sections: quests,
  findings, factions codex, character sheet, scars. Page-turn is a hand-drawn
  folded strip (`#journalPageTurn`).
- Dialogue (`#drawDialogue`): layout comes from `buildDialogueLayout` in
  `dialogueLayout.js` (`DIALOGUE_BOX`, line heights, scroll, options). Render the
  body lines, scroll arrows, and the response options well.
- Briefing (`drawBriefing`): the full-screen opening writ, paged amber text.
- Area title (`#drawAreaTitle`), hover text (`#drawHoverText`), and the mouse
  cursor (`#drawCursor`, states: move, inspect, talk, use, loot, attack,
  blocked) are world-overlay UI.

**To add or change UI:**

- Geometry constants (box positions) live as module consts in `UIRenderer.js`,
  or in the `ui/` layout modules when input code also needs them (dialogue and
  journal hit-testing read the same layout). Put shared geometry in the layout
  module, not duplicated.
- Build the frame with `#window`/`#inset`, fill text with `#text`/`#wrap`/`#clip`,
  values with `#bar`/`#apPips`/`#journalValueBar`. Keep 1px lit/dark bevels
  consistent: lit on top/left, dark on bottom/right.
- Respect the panel split: the world is `VIEWPORT` (top 384px), the command bar
  is `UI_PANEL` (bottom 96px). Full-screen menus dim the world first
  (`#screenBackdrop`).
- New glyphs: extend `FONT` with a 7-row, 5-wide `'0'/'1'` pattern. New cursor
  states: add a branch in `#drawCursor`. New icon: draw it from rects, do not
  import an image.

---

## 18. The quality bar and the exemplars

All art shares: the palette, ramp-and-dither shading, the scale, upper-left
light, a contact shadow, and silhouette-first discipline. A new piece must not
look flatter, blockier, cleaner, or brighter than these references. Study the
closest one before adding anything.

```text
Human (the bar for people)      MARA_BODY + drawMaraDetails (SpriteAtlas.js)
Survivor NPCs + per-role kit    SURVIVOR_* styles + drawSurvivorVariantDetails
Living humanoid enemy            CUT_STYLE / CHOIR_STYLE + their decorate hooks
Fully opened Host actor          PEN_STYLE + drawHostDetails (goat head, butterflied chest)
Non-humanoid Host creature       drawSixLeggedRat / drawThroatMawRat / drawTendrilWalkerRat
Murder scene + carved sigil      drawCultVictim
Calcified body horror + chains   drawCalcifiedPenitent
Crucified Host w/ goat skull     drawCrossMartyr
Satanic marks                    drawChoirPentagram, drawBloodSigil, drawRitualCircle
Wall + fixtures                  drawIsoWallBlock, drawChapelWindow, drawWallSafe, drawWallStash
Structure / furniture            drawCrackedColumn, drawDamagedAltar, drawBrokenPew, drawRustedBarrel
Floor + grime + decals           drawRuinedStoneFloorCell, drawFloorGrime, drawCracks
Terrain light                    drawChapelWindow, drawCandleCluster, drawWarmLightPool, drawCampfire
Interface                        UIRenderer #window / #inset / #drawStatus / #drawJournal
```

---

## 19. Workflow and verification

**Add an animated actor:** add a `style` (Section 15) copying `MARA_BODY` /
`CUT_STYLE`, or a rat-style body builder; add its `decorate`; register in
`buildSpriteAtlas()`; set the `spriteId` in `data/` to match the atlas key.

**Add a static block, fixture, structure, furniture, prop, decal, ritual, gore,
creature, light, or plant:** write `export function drawX(ctx, cx, cy, seed,
opts = {})` in the matching section of `PixelPrimitives.js`; add ONE entry to
`SPRITE_CATALOG` (Section 5); use the `kind` in level data.

**Add or change UI:** Section 17. Reuse `#window`/`#inset`/`#text`; keep
geometry in `UIRenderer.js` consts or the `ui/` layout modules.

**Verify EVERY new or changed piece two ways, then run checks:**

1. Isolated render: import the module on a DETACHED canvas (never appended to the
   running page), draw the figure or prop at 2x to 3x on a dark floor tone, and
   screenshot it. For UI, render the panel onto a 640x480 canvas. Do not inject a
   visible canvas into the running game.
2. In-scene: place it in a level (or open the screen) and screenshot it in
   context with its shadow and neighbors. The dev server is `npm run dev`.
3. Run `npm run check`. It validates the tile grids, required slice content, and
   that every object `kind` and every non-walkable legend block is registered in
   the sprite catalog. Player-facing names and logs follow the anti-slop skill.

---

## 20. Do and Don't

DO: hard pixels; palette ramps; dither and hard bands; light from upper-left; a
contact shadow on everything that touches the ground; silhouette first; register
every new `kind` once in the sprite catalog; seed variation via
`hash2D`/`rngFrom`; asymmetry and broken pairs on monsters; goat or ram skulls
for fully opened Host heads; one small pulsing wound; terrain owns the light;
build UI from `#rect`/`#text` and the `ui*` palette; verify at 2x to 3x before
shipping.

DON'T: smooth gradients, alpha shading, blur, or bloom; colors outside
`palette.js` (or `ui*`/`PARCHMENT` for UI); block, cube, chibi, or golem shapes;
symmetric clean monsters; neat icon skulls with two tidy stubs; pure-black
silhouette blobs with no internal structure; light fixtures baked into a creature;
detailed faces; random untold gore; a renderer `switch` or a second list of
kinds; bright clean green plants; em-dashes or `--`/`—` in any player-facing or
UI text; `ctx.fillText`/`arc`/gradients for panel chrome; shipping a piece you
have not looked at on screen.

---

## 21. Self-check before you finish

- [ ] Reads as the right thing in silhouette alone, at gameplay zoom.
- [ ] Only `palette.js` colors (or `ui*`/`PARCHMENT` for interface). No smooth
      gradients, no blur, no bloom.
- [ ] 3 to 4 step ramp per material; lit upper-left, shaded lower-right.
- [ ] Contact shadow present on anything standing or lying on the ground.
- [ ] Static art: registered as ONE `kind` in `spriteCatalog.js`, right category
      and layer, flat/block flags correct; seeded variation, no shimmer.
- [ ] Human: small head, layered asymmetric gear, jointed limbs, real-person
      proportions. Not blocky, not chibi.
- [ ] Monster: Vale Imprint vocabulary (3 to 5 motifs), asymmetry and broken
      pairs, goat/ram skull if fully opened, one small wound, black-gold thin and
      under the skin (not gushing), bone language. Not a clean golem.
- [ ] Host victim: still reads as a human being opened up (human skin,
      silhouette, proportions, roughly human-sized), not a hulking beast.
- [ ] Animated actor: all 8 facings, every state, and the death set bake and
      read; `spriteId` matches the atlas key; pulse/flicker use the 2-state toggles.
- [ ] No environmental light baked into a figure; not a flat black cutout.
- [ ] UI: built from `#rect`/`#text` and the `ui*` palette; bevels consistent;
      text fits via `#wrap`/`#clip`; no browser-font chrome; no dashes.
- [ ] Sits beside the Section 18 exemplars without looking flatter, blockier,
      cleaner, or brighter.
- [ ] Looked at on a detached-canvas render AND in a real scene/screen.
      `npm run check` passes. Player-facing text follows the anti-slop skill.

If you cannot honor this, do not ship the art.
