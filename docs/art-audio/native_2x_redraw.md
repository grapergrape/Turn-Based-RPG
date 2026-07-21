# Native 2x Redraw Contract

Status: complete and verified

Baseline date: 2026-07-17; current inventory verified 2026-07-21

## Objective

Render the game at a native 1280x960 backing resolution and redraw every
player-visible surface so it uses the added pixel density. The result must be
comfortable at 100 percent Chrome zoom while preserving the current tactical
camera, map footprint, actor proportions, and interface layout.

This is not complete when the old 640x480 image has merely been enlarged. A
completed family must contain deliberate one-native-pixel decisions that were
impossible at the old resolution, such as finer material edges, facial marks,
cloth seams, small type accents, narrow highlights, and controlled dithering.

## Rendering contract

| Property | Logical value | Native backing value |
|---|---:|---:|
| Full frame | 640x480 | 1280x960 |
| World viewport | 640x384 | 1280x768 |
| Command panel | 640x96 | 1280x192 |
| Floor diamond | 64x32 | 128x64 |
| Wall height | 64 | 128 |
| Smallest authored pixel | 0.5 logical px | 1 native px |

Gameplay, projection, camera, UI layout, and hit testing remain in logical
coordinates. The main render context applies a 2x transform. This keeps combat
range, pathfinding, interaction footprints, map framing, and UI targets stable.

Actor metadata also remains logical. Actor frame canvases have 2x backing
dimensions and are drawn into explicit logical destination rectangles. Cropped
actor sources, such as dialogue portraits, convert their source rectangles to
native pixels.

## Memory and performance constraints

The largest current level projects to 7456x3840 logical pixels. A full RGBA
floor canvas at native 2x would retain about 437 MiB. That is rejected.

The static floor layer uses a camera-following cache with a 192 px horizontal
and 160 px vertical logical margin. At the normal viewport this is 1024x704
logical pixels, or 2048x1408 physical pixels, about 11 MiB of raw RGBA storage.
It rebuilds only after the camera crosses the buffered window.

Actor frames are lazy. Building the atlas defines frame lists but does not
allocate every state, facing, and frame. A frame is baked at native resolution
when first used and then retained. This prevents a fourfold startup-memory jump
across the whole atlas.

Volumetric props use a separate native raster cache. Each visible state is
rendered once into a reusable scratch surface, cropped to the exact touched
bounds, and retained under a 64 MiB soft byte budget and 1,024-entry limit.
Depth sorting still happens per prop, so actors can pass in front of and behind
cached scenery normally. Animated catalog entries use bounded visible-state
keys. Fire, Host pulses, door states, ground-item motion, and the eight authored
tumbleweed poses therefore reuse exact prepared rasters without freezing their
animation. Seeded surface noise depends on the prop seed, not its screen
position, so detail no longer reshuffles while the camera moves.

Prepared prop rasters and active actor frames also feed a dedicated hard-pixel
shadow-mask cache. Contact, projected cast, and hover-outline masks share a
24 MiB soft budget. The visible prop cache remains independently capped at
64 MiB.

Acceptance budgets:

- No full-map native floor canvas.
- Static cache backing dimensions may not exceed 2048x1408 at the standard
  viewport unless this document is updated with measured justification.
- Atlas construction must allocate no frame canvases before a frame is used.
- Main canvas, floor cache, and actor canvases must have smoothing disabled.
- The prop raster cache must stay within its soft 64 MiB budget after it has at
  least one other entry available for eviction. One individually oversized
  sprite may temporarily exceed that soft limit so it remains drawable.
- Animated catalog entries may retain only exact, bounded visible-state
  rasters. A time value by itself is not a valid cache key.
- The shadow-mask cache must remain at or below 24 MiB.
- Camera movement through a cache boundary must not expose a seam or blank row.
- The live game must reach exploration without a page exception.

## Baseline inventory

The current 2026-07-21 inventory contains:

- 233 registered catalog kinds, including 204 volumetric kinds and 29 flat
  kinds.
- 74 actor atlas identities.
- 22 floor families.
- 39 levels.
- 63,346 placed floor cells, catalog cells, objects, and ground items across
  those levels.
- 47,351 floor placements.
- 3,438 wall placements.
- Seven primary animation states, eight facings, and ten death frames per
  standard actor family.
- HUD, loading, briefing, character customization, primary assignment,
  inventory, loot, trade, dialogue, context action, and six journal sections.

Counts are gates, not estimates. If content is added during the migration, the
new art joins the same audit before completion.

## Redraw order

### 1. Rendering foundation

- Native canvas and logical-coordinate transform.
- Logical pointer mapping.
- Bounded native floor cache.
- Lazy native actor frames.
- Native-aware cropped image sources.
- Configuration and regression tests.

### 2. High-frequency ground and boundaries

- All floor styles and floor grime.
- Walls and connected wall systems.
- Ash trees, scrub, wheat, fences, logs, stumps, and other high-count outdoor
  pieces.
- Floor decals, roads, tracks, thresholds, and map-edge treatments.

### 3. Structures and interiors

- Every structure, roof, wall fixture, doorway, stair, window, and gate.
- Furniture, storage, machinery, chapel fittings, domestic clutter, and field
  props.
- Lights, gore, ritual marks, creatures, and story set pieces.

### 4. Actors

- Every atlas identity.
- Every state and facing.
- Player appearance combinations and equipment overlays.
- Attack reach, hit reactions, interactions, and death settling.
- Dialogue portrait crops and UI paper dolls.

### 5. Interface

- Shared panel frame, insets, rivets, texture, bars, pips, arrows, cursor, and
  bitmap glyphs.
- HUD in exploration and combat.
- Loading and briefing.
- Character customization and primary assignment.
- Inventory and its action, split, and repair subpanels.
- Loot, trade, dialogue, context actions, hover labels, area title.
- Journal map, notes, factions, character, scars, and techniques.

## Per-asset definition of done

A static kind is complete only when:

1. Its existing silhouette and anchor remain correct at gameplay scale.
2. It contains intentional native-pixel detail, not only 2x2 legacy blocks.
3. It uses only the project palette.
4. Its upper-left lighting and ground contact remain readable.
5. All variants, seeds, orientations, open states, consumed states, and
   connected-edge states render without exceptions.
6. It has detached-canvas evidence.
7. At least one real scene verifies its depth, palette, scale, and contact.

An actor identity is complete only when:

1. All configured states and eight facings have the expected frame count.
2. Native details remain stable through animation and do not shimmer randomly.
3. Feet remain planted, attacks retain reach, hit frames shift weight, and
   deaths retain body mass.
4. Human anatomy and equipment remain proportionate and non-chibi.
5. Host forms preserve the Vale Imprint and their human origin.
6. Dialogue crops and paper-doll uses select the correct native source area.
7. Detached sheets and live scenes cover idle, locomotion, attack, hit,
   interaction, and death.

An interface screen is complete only when:

1. It is readable at 100 percent browser zoom.
2. Borders, glyphs, icons, and focus states use native one-pixel craft where
   useful while retaining the established hard-pixel CRPG language.
3. No browser font, smooth gradient, blur, or fractional physical pixel leaks
   into the surface.
4. Mouse hit boxes still match the visible controls.
5. Empty, full, disabled, selected, scrolling, and modal states are captured.

## Verification matrix

### Automated checks

- `npm run check` after every source or data batch.
- `npm test` after every rendering-system batch and before each audit milestone.
- Native contract test for backing dimensions, logical input, lazy actor
  allocation, and bounded static caching.
- Catalog execution for every registered kind across six seeds and required
  runtime states.
- Palette-only raster audit for every detached static and actor capture.
- Raster scan that proves each completed asset family contains intentional
  one-native-pixel detail.
- Camera-boundary test that compares overlapping pixels before and after cache
  rebuilds.
- UI hit-region tests at 100 and 200 percent CSS presentation.

### Detached visual review

- Every static kind, grouped by catalog category.
- Every floor style.
- Every ground-item model.
- Every actor identity in all states and facings.
- Player appearance extremes and representative equipment combinations.
- Every UI screen and modal substate.

### Live-scene review

- One full-map or stitched review for every level.
- Representative gameplay crops for every visual biome and interior material.
- Every large set piece in its authored scene.
- Exploration, stealth, combat, dialogue, inventory, trade, loot, journal,
  character creation, loading, and briefing flows.
- Cache crossings on the largest outdoor maps.
- Canvas fit and pointer alignment at common browser viewports.

### Evidence and scoring

Evidence belongs under a dated folder in `.ai/visual-audit/`. Scores and found
problems are appended to `docs/art-audio/visual_design_audit.md`. A score below
the repository art standard remains an open redraw item. A clean automated test
does not override a visible defect, and a strong screenshot does not override
a broken state or interaction.

## Completion evidence

The first live native render is
`.ai/visual-audit/2026-07-17-native-2x-foundation/chapel-runtime-1280x960.png`.
It verifies:

- 1280x960 backing dimensions.
- 1280x960 CSS dimensions at 100 percent zoom.
- Exploration reached with no page exception.
- One 2048x1408 floor cache for a 1024x704 logical window.
- Logical camera position and UI layout preserved.

The completed redraw is covered by these dated evidence sets:

- `.ai/visual-audit/2026-07-17-native-2x-floors/`
- `.ai/visual-audit/2026-07-17-native-2x-walls/`
- `.ai/visual-audit/2026-07-17-native-2x-fixtures/`
- `.ai/visual-audit/2026-07-17-native-2x-buildings/`
- `.ai/visual-audit/2026-07-17-native-2x-furniture/`
- `.ai/visual-audit/2026-07-17-native-2x-props/`
- `.ai/visual-audit/2026-07-17-native-2x-plants/`
- `.ai/visual-audit/2026-07-17-native-2x-decals/`
- `.ai/visual-audit/2026-07-17-native-2x-symbols-gore/`
- `.ai/visual-audit/2026-07-17-native-2x-creatures/`
- `.ai/visual-audit/2026-07-17-native-2x-actors/`
- `.ai/visual-audit/2026-07-17-native-2x-ui/`
- `.ai/visual-audit/2026-07-17-native-2x-levels/`
- `.ai/visual-audit/2026-07-17-native-2x-runtime/`
- `.ai/visual-audit/2026-07-17-native-2x-performance/`

Final automated coverage records:

- 200 catalog kinds across six seeds, 18 floor styles, and 19 ground-item
  models pass palette and native-detail checks.
- 39,600 generated actor frames across every configured model, state, facing,
  and death frame pass sizing, palette, silhouette, and native-detail checks.
- 51 UI states pass logical-size, backing-size, bounds, palette, bitmap-font,
  and native-detail checks.
- All 39 levels boot through the real game renderer at a 1280x960 backing and
  CSS size with browser scale 1, then pass both runtime-crop and complete-map
  visual review.
- Fourteen real-browser flow checks cover keyboard screens, interaction labels,
  dialogue, trade, loot, combat pathing, speech, combat effects, pointer mapping
  at two CSS scales, level transition, and inventory persistence.
- All 1,044 non-flat catalog variants match their direct transparent render
  exactly through the prop cache. All 39 cached level frames are byte-stable
  across repeated warm renders.
- In headless Chrome's software-canvas diagnostic, representative and previous
  worst-case scenes sustain the 60 Hz requestAnimationFrame cadence. Warm
  renderer averages range from 3.33 to 5.24 ms. The hidden catacombs fall from
  243,403 instrumented canvas calls before prop caching to 7,884 after it.

The first uncached render of the densest scene remains a one-time cold cost of
roughly 140 ms in the same software-canvas environment because it builds both
the camera floor window and visible prop rasters. Subsequent frames stay within
the measured budget. Precomposing translucent polygon edges and contact shadows
changes finite-precision scene blending on at most 3.32 percent of frame pixels
versus the uncached diagnostic path. Detached sprites remain pixel-identical,
cached frames are stable, and the reviewed differences are edge blending rather
than missing or shifted art. Hardware and browser differences still warrant
ordinary release testing, but no migration-specific redraw item remains open.
