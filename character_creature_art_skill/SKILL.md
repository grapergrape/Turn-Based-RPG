---
name: character-creature-art-standard
version: 1.0.0
description: MANDATORY standard for every visible figure in this repo. Read before drawing or editing any human sprite (src/render/SpriteAtlas.js) or any hand-built prop/creature (src/render/PixelPrimitives.js). Defines how humans look, how Host monsters look (Vale Imprint body horror, gore, satanic imagery, goat/ram skulls), the shared quality bar, and the rule that terrain owns light, not creatures.
---

# Character and Creature Art Standard (MANDATORY)

Any AI or human working in this repo MUST apply this skill before drawing or
editing a visible figure: a player/NPC/enemy sprite, a creature, a corpse, or a
hand-built character prop. The goal is one quality bar and one visual language,
so a model added by a weaker agent still sits beside Mara Vey and the Opened
Saint without looking flatter, blockier, cleaner, or brighter.

This skill is concrete on purpose. Follow the numbers and the named palette
colors. When in doubt, copy the structure of an existing exemplar (Section 8)
rather than inventing.

---

## 0. When this applies and what to read

Applies when you touch any of:

- `src/render/SpriteAtlas.js` (animated actors: player, NPCs, enemies)
- `src/render/PixelPrimitives.js` (props, creatures, corpses, gore, sigils)
- `src/render/palette.js` (the color source of truth)
- any new visible figure or its level placement

Before editing, read this whole file, then read the exact draw function or
`style` object you are about to change, then read one exemplar from Section 8.
Player-facing names and descriptions also follow
`anti_ai_slop_writing_skill/SKILL.md` (no em-dashes).

---

## 1. The engine reality (hard technical frame)

These are not preferences. The renderer enforces them.

- Internal resolution is 640x480 (`renderConfig.js`). The world viewport is the
  top 640x384. The buffer is upscaled with whole-number nearest-neighbor
  scaling, and `imageSmoothingEnabled` is `false` everywhere. So: **hard pixels
  only.** Every edge is a stair-step. Nothing is anti-aliased.
- The world is isometric: 64x32 floor diamonds, walls 64px tall. Figures are
  SMALL. A human is about 50 to 64px tall at native size and is seen on screen
  at roughly 2x to 3x. Detail you cannot read at that size is wasted or noise.
- Everything visible is built from `PALETTE` (Section 2) plus the primitives in
  `PixelPrimitives.js`. Do NOT introduce colors that are not in `palette.js`.
  If a material truly needs a new color, add it to `palette.js` deliberately and
  say why. No inline hex in draw code except the existing rare cases.
- NO smooth gradients. NO alpha-blended soft shadows used as shading. NO blur,
  bloom, glow filters, or modern post. Shade with hard color bands and 2px
  dither (`drawDitherRect`, `drawNoisePixels`, manual `px` rows).
- Determinism: any randomness MUST come from `rngFrom(hash2D(seed, ...))`, never
  `Math.random()`. The scene is re-drawn every frame and must never shimmer.

---

## 2. Palette and ramps

The full palette lives in `src/render/palette.js`. Families:

```text
void / outline            near-black bases and 1px outlines
stoneDark/Mid/Light/Dust  cold grey-browns: stone, ash, calcified flesh, dust
rustDark/Mid/Light        oxidized iron, leather, dried blood
woodDark/Mid/Light        timber, posts, crosses, pews
clothDark/Red/Tan         fabric: coats, robes, stoles, bandages
skinDark/Mid/Light        human skin
hostBlack/Red/Gold/Bone   the Host: black flesh, wound-red, black-gold, bone
flash / ember / hostGlow  RARE bright accents: muzzle flash, embers, live wound
ui*                       interface only, never on world figures
```

Every material is a 3 to 4 step ramp: **hi, mid, lo, dk**. Light comes from the
upper-left, so the lit edge is the top/left and the shade is the bottom/right.
Be consistent across the whole figure.

- Actors (`SpriteAtlas.js`): set `style.<name>Hi`, `style.<name>`,
  `style.<name>Lo`, `style.<name>Dk` and read them through `ramp(style, name)`,
  which returns `{ hi, mid, lo, dk }`. Existing ramps: `coat`, `pants`, `skin`,
  `hair`/`hood`. Far limbs are drawn one ramp-step darker (`drawJointedLimb(...,
  far=true)`).
- Props (`PixelPrimitives.js`): pick 3 to 4 palette colors per material and band
  them by hand. A flat single-color fill is a bug, not a style.

Bright accents (`flash`, `ember`, `hostGlow`) are tiny and rare: a candle tip, a
muzzle flash, a single living wound. Never fill an area with them.

Contact shadow is mandatory: call `drawShadowBlob(ctx, cx, cy + n, w, h)` under
any figure that stands or lies on the ground. A figure with no shadow floats and
fails review.

---

## 3. The human standard (reference: Mara Vey)

Humans must read as tiny real people, never blocks, never chibi. Silhouette
first: if the black-only outline does not read as the role, no detail will save
it.

Native proportions (the values Mara uses; stay close):

```text
Total height        50-64 px        Shoulder width   14-18 px
Head height         8-10 px         Waist width      8-10 px
Torso height        14-18 px        Leg length       22-26 px
Boots               3-6 px          Hands            2-3 px clusters
Weapon thickness    1-3 px
```

Construction rules:

- Small head. Narrow, slightly sloped shoulders. Jointed limbs
  (`drawJointedLimb`), not stiff rectangles. Legs taper into readable boots.
- Clothing in layers with asymmetry: a coat with a tail, a scarf low on the
  neck, one strap across the chest, a belt with a pouch or holster on one side.
  Asymmetry is what stops a figure reading as a toy.
- Skin uses the `skin` ramp. Cloth is `clothDark`/`clothTan`. Leather and straps
  are `rust*`. Bone (`hostBone`) only as a tiny accent on a human (a token,
  a button), never as a face.
- Head: a small `taperedSpan` of skin under a hood (cloth) or hair. The face is
  mostly shadow with 1 to 2px eyes and a hint of jaw. Never draw a big round
  ball, never draw detailed eyes or a mouth at this scale.
- Tiny metal glints (1px `stoneLight`/`hostBone`/`flash`) on the head, a
  shoulder, the boots, the weapon. This sells "downsampled real person."
- 8 facings (`FACING_META`), poses in `POSES` (idle, walk, attack, hit,
  interact), planted feet in the walk cycle (no sliding), a subtle idle, and a
  flat readable corpse via `drawDeath`.

Mara is equipment-driven: her `style` is composed from worn gear in
`deriveMaraStyle`. If you change her body, the fully-dressed look must still
match her established sprite. See `[[player-facing-anti-slop-writing]]` only for
her text, not her art.

Human DON'T: cube/block head, oversized head, chibi, noodle limbs, perfectly
symmetric clean gear, flat single-color fills, faces with real detail, smooth
shading.

---

## 4. The monster standard (the Vale Imprint)

Canon law, from `docs/lore/the_host_story_bible.md` and `AGENTS.md`: every Host
creature is **something trying to be holy and failing horribly**. It is human
material reshaped into an infernal religious icon. It is never a generic zombie,
never a random alien, never cute. If it looks like a neat fantasy golem or a
clean mascot, it is wrong.

The body-horror vocabulary. Use 3 to 5 of these per creature, not all of them:

- bone halos, broken and asymmetric, behind or around the skull
- hands fused at the palms into permanent prayer
- a ribcage cracked down the sternum and butterflied open (the two rib-halves
  spread wide like wings of bone) over a wet cavity with one small wound deep in it
- tendrils worked out of an opening, tapering and curling, with a wet lit edge
- exposed nerves or veins like red scripture
- black-gold tissue: thin `hostGold` veins and seams, mostly UNDER the skin, on
  human skin (`skinDark`/`skinMid`) or near-black `hostBlack` flesh
- bone-thorns erupting from shoulders and spine, snapped and uneven
- false wings, mouth clusters, or a second screaming maw with bone teeth
- a face stretched into an agony mask
- a goat or ram skull and horns (Section 4b) for fully opened heads
- calcification: pale `stoneDust`/`hostBone`, veins drained to `stoneDark`, no
  glow, frozen mid-gesture (the Stilling caught it)
- wet vestment-flesh hanging like robes, embedded ship-metal or steel plating
  (for a turned Penitent Engine), stained-glass eye clusters
- the whole body bent into a cruciform or kneeling pose

Color language for the Host:

```text
flesh            human skin (skinDark/skinMid) for victims; hostBlack for fully turned forms
wound / blood    hostRed
black-gold       hostGold (thin veins and seams under the skin, halo glints; a
                 bead or two at a fresh wound, never a flood)
bone / thorn     hostBone (skull, halo, teeth, thorns), shaded void
living wound     hostGlow or flash, ONLY as a small pulsing core
calcified        stoneDust / hostBone body, stoneDark dead veins, NO glow
```

The single wound: most living Host forms have one glowing black-gold wound that
pulses (drive it off `pose.bob` or the `pulse`/`flicker` opts). Dead or
calcified forms: the wound is sunken and grey, no glow, no pulse.

**Asymmetry is mandatory.** One horn intact, the other snapped to a stump. The
halo whole on one side, splintered on the other. One arm fused across the chest,
the other dragging on the floor. Symmetry and clean repetition are exactly what
make a Host creature read as a "goofy golem." Break every pair. (The one exception
is a butterflied ribcage, which is symmetric on purpose: the wings of bone spread
evenly from the split sternum. Keep the rest of the body asymmetric around it.)

**It is made from a person.** Unless a form has been fully consumed, it should
still read as a human being the horror has grown THROUGH: keep the human
silhouette, human skin (`skinDark`/`skinMid`), human limbs and proportions, and
keep the figure roughly human-sized. The dread is that you can still see the
man under it. A Host victim is not a hulking beast or a black demon; it is a
person opened up.

**Black-gold is a trace, not a flood.** The transformation is bodily: bone,
growth, opened flesh, reshaped anatomy. The black-gold is the lit wiring of it,
not a substance pouring out. Draw it as thin veins and seams mostly under the
skin, a small wound core, a few faint glints. A bead or two may well at a fresh
opening. Do NOT have it gushing, weeping in streaks, or oozing off the body.

---

## 4b. Goat and ram skull heads (the standard "opened" Host head)

A neat bone ball with two little stubs reads as a golem. A fully opened Host
head must read as a **goat or ram skull**. Build it like this:

- Elongated skull, taller and longer than it is wide. A long muzzle that drops
  forward and down (goats have a long face), not a round cranium. The muzzle is
  the silhouette tell.
- Big horns: ram horns curl back and down in a spiral, goat horns sweep up and
  out. Draw them RIDGED (3 to 4 notches along the length) and ASYMMETRIC: one
  long and intact, the other broken to a jagged stump.
- Eyes set wide and angled into deep sockets. Either hollow `void`, or a
  horizontal rectangular goat pupil (goats have horizontal slit pupils) in
  `hostGold`, with `flash`/`hostGlow` only if the thing is alive.
- A long narrow jaw hanging open or broken off-line, with a row of flat bone
  teeth (`hostBone` pixels over a `void` gap).
- Bone tone is `hostBone`. Shade the socket hollows, the muzzle seam, and under
  the jaw with `void`/`hostBlack`. A little `hostGold` may glint in the sockets
  and cracks; do not run it in streaks down the face.

Rough sizes for a large crucified head (~16 to 22px tall native): muzzle 6 to
9px long, horns 6 to 12px, sockets 2 to 3px, teeth row 1px tall over a 3 to 5px
gap. Scale down for smaller creatures.

Staging by infection level: an early victim keeps a human head; a mid-stage
victim shows a bud of bone or one starting horn over a still-human face; a fully
opened Host shows the goat or ram skull.

---

## 5. Satanic and ritual imagery

The Choir of the Open Wound marks ground and bodies. Keep every mark rough and
hand-daubed (paint, blood, carving), never a clean vector shape.

- Wound-star: a point-DOWN (inverted) five-line pentagram inside a rough ring,
  `hostRed` paint with `hostGold` bleed where it eats the stone, plus drips. See
  `drawChoirPentagram`. One vertex points straight down.
- Inverted cross: an upright with the crossbar set LOW. See `drawBloodSigil`,
  `drawChapelBanner`, `drawRitualCircle`.
- Ritual circle: a double blood ring around an inverted cross with bone markers
  at the cardinal points.
- Carved-into-flesh: a point-down star plus scratch-line "words" cut in
  `hostRed` on a bared patch of pale skin. See `drawCultVictim`.

Goat heads and inverted stars are the two strongest "this is the Choir" signals.
Use them where the cult has worked.

---

## 6. Gore

Gore is brutal but placed and story-driven, never a random red mess.

- Blood pool: a `drawIsoDiamond` in `rustDark` at ~0.85 alpha (dried) with a
  smaller `hostRed` center (fresher), then `drawNoisePixels` spatter in
  `hostRed`/`rustDark` around it. A drag smear is a short trailing line of `px`.
- Fresh blood is `hostRed`. Dried is `rustDark`. Old Host seep is
  `hostGold`/`hostBlack`.
- Stab wounds are `void` punctures with a single `hostRed` pixel. Cuts are
  `rustDark`/`hostRed` lines. Carved sigils sit on bared `skinMid` skin.

See `drawCultVictim` and `drawCalcifiedPenitent` for the reference treatment.

---

## 7. Terrain owns light, not creatures (hard rule)

A creature or prop model must read on its own, lit from the upper-left like
everything else. Do NOT bake an environmental light source into a creature so
the creature becomes a backlit black cutout.

- Windows, light pools, candle clusters, braziers, and god-rays are TERRAIN or
  separate props placed in the scene: `chapel-window`, `candle-cluster`,
  `drawWarmLightPool`, `drawCampfire`. They are owned by the level data and the
  static scene, not by a monster's draw function.
- A monster MAY have its own small emissive detail: a small glowing wound, a
  gold glint in the eye sockets, an ember on a censer. It may NOT carry an
  architectural light fixture.
- Never ship a figure that is a flat `hostBlack`/`void` silhouette with no
  internal structure. Even a dark Host form must show ribs, veins, bone edges,
  and a skull. If you remove a backlight, add internal lit edges (`hostBone`
  rim, `hostGold` veins) so the model still reads as a model.

---

## 8. The quality bar and the exemplars

All models share: the palette, the ramp-and-dither shading, the scale, the
upper-left light, a contact shadow, and silhouette-first discipline. A new model
must not look flatter, blockier, cleaner, or brighter than these references.
Study the closest one before you add anything:

- Human (the bar for people): `MARA_BODY` + `drawMaraDetails` in `SpriteAtlas.js`.
- Murder scene and carved sigil: `drawCultVictim`.
- Calcified body horror, chains, restraint: `drawCalcifiedPenitent`.
- Fully opened Host crucifixion with a goat skull: `drawCrossMartyr`.
- Satanic marks: `drawChoirPentagram`, `drawBloodSigil`, `drawRitualCircle`.
- Terrain light: `drawChapelWindow`, `drawCandleCluster`, `drawWarmLightPool`.

Cutthroat/Choir/Penitent enemy styles (`CUT_STYLE`, `CHOIR_STYLE`, `PEN_STYLE`)
show how the actor `style` system carries a monster.

---

## 8b. The block and prop catalog: how to add a reusable building block

Everything the world draws that is NOT an actor sprite (walls, fixtures,
structures, furniture, decals, ritual marks, gore, creatures, lights) is a
`kind` string, and every `kind` is registered ONCE in
`src/render/spriteCatalog.js`. That file is the single source of truth: the
renderer, the flat-vs-volumetric split, and the content validator all read it.
There is no per-kind `switch` to edit and no second list of kinds to keep in
sync.

This is how the engine grows. A 90s tile game is a library of reusable blocks
(walls, doors, windows, chairs, tables, plants, fixtures). Add them HERE, in one
place, and the next level just drops the `kind` into its data.

**The taxonomy** (`CATEGORY` in `spriteCatalog.js`):

```text
terrain-block  raw structural blocks (walls). tile-driven, layer 0
fixture        a feature set INTO a wall block (window, safe, stash). layer 0
structure      free-standing architecture (columns, altars, barricades, bells)
furniture      placed objects (pews, crates, barrels, lecterns, banners, chairs)
prop           misc small props and caches (rubble piles, bone piles, flagstone)
decal          FLAT ground marks (blood, dust, cracks, scraps). drawn on the floor
ritual / gore / creature / light / plant   as named
```

**To add a new block or prop (the whole workflow):**

1. Write its draw function in `PixelPrimitives.js`, in the section that matches
   its category. The signature is ALWAYS `draw(ctx, cx, cy, seed, opts)`;
   `(cx, cy)` is the screen-pixel centre of the tile. Obey Sections 1, 2, and 7
   (palette only, ramp + dither, a contact shadow, NO baked light, seeded
   variation via `hash2D`/`rngFrom`).
2. Add ONE entry to `SPRITE_CATALOG`. Use the `simple(...)` helper for a plain
   `(ctx, cx, cy, seed)` prop, `decal(...)` for a flat ground mark, or a full
   `{ draw, category, layer, flat?, block? }` literal when the draw needs
   animation/state from `c = { prop, anim, pulse, flicker }`:

   ```js
   'reading-chair': simple(P.drawReadingChair, CATEGORY.FURNITURE),
   'ash-puddle':    decal((ctx, x, y, seed) => P.drawAshPuddle(ctx, x, y, seed)),
   ```
3. Use the `kind` in level data. `npm run check` FAILS if a level uses a `kind`
   that is not in the catalog (or a non-walkable legend block that is not in the
   catalog), so typos and unrenderable kinds are caught, not silently dropped.

That is the entire workflow. No renderer edits.

**Blocks (the wall grid) vs props (free objects):**

- A BLOCK fills a wall cell and is drawn as / into a wall block (layer 0). Mark
  it `block: true` and name it `wall-*` by convention. A purely visual block (a
  window) can be a legend tile letter. A block that must carry loot or a lock (a
  safe, a stash) is an authored OBJECT placed on a wall cell instead, because
  tiles cannot carry an `interact`. The loader skips the default wall behind any
  `wall-*` object, so the block is not drawn twice.
- A FIXTURE draws onto the SW face of the wall block, AFTER `drawIsoWallBlock`,
  using `swFaceTop(cx, cy, x)` / `swFaceBot(cx, cy, x)` so it sits flush on the
  angled stone. It MUST read against the stoneMid wall: a dark recess frame, a
  lit top edge, and a bright or brass accent. Study `drawChapelWindow`,
  `drawWallSafe`, `drawWallStash`. Do NOT draw a fixture in plain wall-stone
  tones with no recess or accent; it disappears into the wall.
- A PROP is a free-standing object at layer 2 (pews, crates, the cross). A DECAL
  is a flat floor mark (`flat: true`), drawn in the baked floor pass.

**DON'T:**

- DON'T add a `case` to a renderer switch. There isn't one any more.
- DON'T keep a second hardcoded list of kinds (a flat set, a decal set, a "valid
  kinds" array). Derive it from the catalog.
- DON'T bake a window, light pool, or god-ray into a creature or prop draw
  function (Section 7); light belongs to terrain and fixtures.

---

## 9. Workflow: how to add or edit a model

Animated actor (walks and fights):

1. Add a `style` object in `SpriteAtlas.js`, copying the shape of `MARA_BODY` or
   `CUT_STYLE`: proportions, color ramps, `belt`/`weapon`, flags
   (`hostHead`, `maskedHead`, `bareHead`), and a `decorate(ctx, ...)` function
   for the parts unique to this actor.
2. Register it in `buildSpriteAtlas()`. The actor's `spriteId` in `data/` must
   match the atlas key.

Static prop, creature, corpse, or sigil:

1. Add `export function drawX(ctx, cx, cy, seed, opts = {})` in
   `PixelPrimitives.js`. Use seeded RNG, a `drawShadowBlob`, palette ramps, and
   hard bands or dither. Support state via `opts` (`{ opened }`, `{ killed }`,
   `{ dim }`) and animation via `pulse`/`flicker` for living things.
2. Add a `case 'x':` in `IsometricRenderer.#drawProp`. Pass the right opts. Flat
   floor decals also go in the `FLAT_KINDS` set; volumetric figures do not.

Verify EVERY new or changed model two ways, then run checks:

1. Isolated render: import the module on a DETACHED canvas (never appended to
   the page), draw the figure at 2x to 3x on a dark floor tone, and screenshot
   it. Do not inject a visible canvas into the running game.
2. In-scene: place it in a level and screenshot it in context with its shadow
   and neighbors.
3. Run `npm run check`. Player-facing names/logs follow the anti-slop skill.

---

## 10. Do and Don't

DO: hard pixels; palette ramps; dither and hard bands; light from upper-left; a
contact shadow on everything; silhouette first; asymmetry and broken pairs on
monsters; goat or ram skulls for fully opened Host heads; one small pulsing
wound; terrain owns the light; verify at 2x to 3x before shipping.

DON'T: smooth gradients, alpha shading, blur, or bloom; colors outside
`palette.js`; block, cube, chibi, or golem shapes; symmetric clean monsters;
neat icon skulls with two tidy stubs; pure-black silhouette blobs with no
internal structure; light fixtures baked into a creature; detailed faces; random
untold gore; shipping a model you have not looked at on screen.

---

## 11. Self-check before you finish a model

- [ ] Reads as the right thing in silhouette alone, at gameplay zoom.
- [ ] Only `palette.js` colors. No smooth gradients, no blur, no bloom.
- [ ] 3 to 4 step ramp per material; lit upper-left, shaded lower-right.
- [ ] Contact shadow present.
- [ ] Human: small head, layered asymmetric gear, jointed limbs, real-person
      proportions. Not blocky, not chibi.
- [ ] Monster: Vale Imprint vocabulary (3 to 5 motifs), asymmetry and broken
      pairs, goat/ram skull if fully opened, one small wound, black-gold kept to
      thin veins and glints (not gushing), bone language. Not a clean golem.
- [ ] Host victim: still reads as a human being opened up (human skin,
      silhouette, proportions, roughly human-sized), not a hulking beast.
- [ ] No environmental light baked into the figure; not a flat black cutout.
- [ ] Sits beside the Section 8 exemplars without looking flatter, blockier,
      cleaner, or brighter.
- [ ] Looked at on a detached-canvas render AND in a real scene. `npm run check`
      passes.

If you cannot honor this, do not ship the model.
