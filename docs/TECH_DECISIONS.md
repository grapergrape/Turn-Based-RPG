# Technical Decisions

This file records why the project uses certain technical choices. Update it whenever the repo adopts a new dependency, rendering approach, build tool, or major architecture change.

## Decision 001: Browser JavaScript modules

**Choice:** Use standard browser JavaScript modules under `src/`.

**Why:**

- Easy to run locally.
- No build step required at the start.
- Good enough for early prototypes and vertical slices.
- Keeps the project understandable.

**Tradeoff:**

- No TypeScript checking yet.
- No bundling/minification yet.
- Some browser module paths must be explicit.

**Review later when:**

- The codebase becomes large enough that type checking prevents real bugs.
- Build optimization matters.
- Asset bundling becomes necessary.

## Decision 002: Canvas 2D first

**Choice:** Use Canvas 2D rendering.

**Why:**

- Fits pixelated top-down RPG graphics.
- Simple mental model.
- No engine lock-in.
- Enough for tile maps, sprites, UI, and tactical combat.

**Tradeoff:**

- More custom work than using a game engine.
- Animation and camera systems must be built intentionally.
- Very large maps may need batching/culling later.

**Review later when:**

- Rendering performance becomes a bottleneck.
- Lighting/shader effects become essential.
- The game needs complex animation tooling.

## Decision 003: No dependency by default

**Choice:** Start with no runtime dependencies.

**Why:**

- Prevents dependency bloat.
- Keeps local hosting simple.
- Makes the architecture visible instead of hidden inside frameworks.

**Tradeoff:**

- We must write basic systems ourselves.
- Some tooling conveniences are missing early.

**Rule:**

Any new package must be justified in this file with:

- Package name.
- Problem it solves.
- Why simple code cannot solve it.
- Risks or lock-in.

## Decision 004: Data-driven content

**Choice:** Keep maps, actors, enemies, and future content in `data/`.

**Why:**

- Allows non-engine content editing.
- Prevents hardcoded quest/enemy sprawl.
- Makes validation possible.
- Helps AI assistants safely add content without touching engine code.

**Tradeoff:**

- Need content loaders and validators.
- JSON schemas must be documented.

## Decision 005: No full ECS yet

**Choice:** Use simple classes/objects for now, not a full Entity Component System.

**Why:**

- The early game does not need ECS complexity.
- A small RPG prototype benefits from direct, readable code.
- Premature ECS often creates boilerplate before gameplay exists.

**Review later when:**

- Many entity types share complex composable behavior.
- Status effects, equipment, AI, and interactions become difficult to model directly.

## Decision 006: Local static server

**Choice:** Use `scripts/serve.mjs`, a small Node static server.

**Why:**

- Browser modules generally need HTTP serving instead of opening `index.html` directly.
- Avoids installing Vite or another dev server at the start.
- Keeps `npm run dev` simple.

**Tradeoff:**

- No hot reload.
- No bundling.
- No dev overlay.

**Review later when:**

- Hot reload would save significant time.
- Asset processing is needed.
- TypeScript/bundling is adopted.

## Decision 007: Runtime-baked isometric pixel art

**Choice:** Keep the current slice's art as Canvas 2D runtime-baked sprites and props, drawn at native 640x480 scale.

**Why:**

- The playable slice can establish scale, camera distance, animation timing, and palette before external asset production begins.
- Runtime-baked frames keep all current assets original and inspectable in source.
- Eight-facing actors and hard-banded lighting can be tested without adding a build step.

**Current constraints:**

- Use 64x32 isometric floor diamonds and a 384 px world viewport.
- Draw actor frames at native pixel resolution. Do not smooth-scale sprite sheets.
- Keep movement frame-quantized so walking reads as low-fps isometric CRPG animation.
- If the project later imports PNG sprite sheets, they must match the same pivot, frame count, facing names, and nearest-neighbor render rules.

**Review later when:**

- A real asset pipeline exports PNG sheets from an art tool.
- Sprite memory or startup bake time becomes a measurable problem.
- Animation authoring needs per-frame metadata that is too awkward to keep in code.

## Decision 008: Explicit attack mode for reach weapons

**Choice:** Allow an optional `mode` field on weapon attacks with `melee` and
`ranged` as the valid values.

**Why:**

- Attack range is distance, not weapon category.
- A two-cell pike thrust must remain melee for hit chance, damage, cover, and
  line-of-fire rules.
- One shared classifier prevents combat, AI, context actions, and previews from
  disagreeing about the same attack.

**Compatibility:**

Attacks without `mode` keep the previous range-based classification. Range 1
is melee and longer range is ranged. Existing content therefore needs no bulk
migration.

**Tradeoff:**

Reach melee still checks intervening blocking cells, but it does not use firearm
cover or range penalties. New weapon content should declare `mode` whenever its
category cannot be inferred safely from range.

## Decision 009: Native 2x art with a logical design grid

**Choice:** Render to a 1280x960 backing canvas while retaining the established
640x480 logical coordinate system. Runtime-drawn art may use half-logical-pixel
increments, which become single physical pixels.

This supersedes Decision 007's 640x480 backing-resolution constraint. Its
runtime-baked art, isometric scale, pivot, facing, and nearest-neighbor rules
remain in force.

**Why:**

- The game was too small to play comfortably without 200 percent browser zoom.
- A true 2x backing store provides four times the pixels for faces, materials,
  silhouettes, type, and UI edges.
- Keeping gameplay coordinates logical avoids a risky rewrite of combat,
  collision, projection, camera framing, and hit regions.
- Canvas 2D and the no-build local-hosting model remain sufficient.

**Memory controls:**

- Floors and flat decals use a bounded native-resolution camera cache rather
  than a full-map native canvas.
- Unchanged volumetric props use tightly cropped per-prop native rasters under
  a 64 MiB soft budget and a 1,024-entry limit. Animated catalog entries bypass
  this cache, and depth sorting remains per prop.
- Actor frames are generated lazily at native resolution and retained on use.
- Actor metadata and draw destinations remain logical.

**Tradeoff:**

- Rendering code must distinguish logical destination coordinates from native
  source pixels when it crops an offscreen canvas.
- Old art initially appears as exact 2x blocks until each family receives a
  deliberate native-detail pass.
- Visual verification expands to every catalog kind, actor state, UI screen,
  and level because scale defects can hide in source cropping and cache edges.
- The first frame in a dense scene pays a one-time raster-build cost. Warm
  frames replace tens of thousands of primitive calls with bounded drawImage
  operations.

The implementation and acceptance matrix are documented in
`docs/art-audio/native_2x_redraw.md`.

## Decision 010: Instance weapons with two flexible ready slots

**Choice:** Represent equippable weapons as condition-bearing inventory instances in two generic ready slots. Store loaded ammunition on the weapon instance and reserve ammunition as ordinary stackable items.

**Why:**

- Two copies of one weapon can have different condition and magazine state.
- Any category can occupy either slot without adding category-specific paper-doll rules.
- Weapon data can provide several bounded attack modes without duplicating combat abilities.
- Finite ammunition, reload AP, repair wear, ground drops, trades, and saved state all share one inventory authority.
- Semantic roles let techniques request a melee, sidearm, firearm, or ranged attack without depending on an instance-specific runtime id.

**Content boundary:**

Weapon names, provenance, attacks, magazines, and ammunition families live in `data/items/`. `src/combat/WeaponRules.js` normalizes the schema. `src/core/Inventory.js` owns player weapon instances. `src/combat/ActorWeaponLoadout.js` adapts the same item definitions for enemy references. Combat consumes the resulting runtime attacks and does not know catalog item ids.

**Compatibility:**

Legacy `sidearm` and `melee` equipment slots and the singular `weapon.attack` object still load. New content uses `weapon1`, `weapon2`, `equipment.slot: "weapon"`, and `weapon.attacks`.

**Tradeoff:**

Runtime attack ids are not authored ids. UI, techniques, and tests that need a category must resolve semantic roles. Weapon balance also gains two persistent pressures, condition and ammunition, which must be tuned together.

## Decision 011: One persistent manually controlled field attendant

**Choice:** Add a generic companion entity contract and ship one persistent
Utility Drone Mark I as the first implementation. The player controls its turn
directly. Its upgrade tree is data-driven and its run state persists separately
from level-local actors.

**Why:**

- The mechanic build needs a full tactical identity, not an automatic damage
  proc attached to the player.
- A manually controlled turn makes position, cover, healing, lures, and field
  devices legible and lets non-engineer builds use the attendant as support.
- Explicit `team`, `control`, and `ownerId` fields give enemy AI, hazards, turn
  order, rendering, and future companions one shared contract.
- A separate run snapshot lets the attendant cross level transitions without
  being authored into every map spawn list.

**Content boundary:**

The model, base attack, economy arrays, branch ratings, node copy, effects, and
prerequisites live in `data/companions/`. Generic recruitment, purchase, and
snapshot rules live in `src/companions/`. Game runtime modules translate the
effect ids into combat and exploration behavior. The shrine ritual and South
Measure service-part placements remain authored location content.

**Combat contract:**

Turn order is player, living player-controlled companions, then enemies.
Enemies select among reachable player-team actors by path distance, health
ratio, and a player-favoring final tie. A disabled attendant is skipped and does
not cause defeat. Victory reboots it at 35 percent maximum HP.

**Tradeoff:**

This is not yet a general party roster, equipment screen, or companion dialogue
framework. The first model has a dedicated effect vocabulary. Add a broader
ability registry only when a second companion proves that the effects need to
be shared.

## Decision 012: Software-backed runtime Canvas 2D

**Choice:** Request `willReadFrequently: true` when creating every runtime 2D
canvas context, including the visible canvas, static terrain cache, prop cache,
and lazily baked actor frames. This standards-defined context attribute selects
a software-backed Canvas2D path. The renderer does not perform pixel readbacks.

**Why:**

- Accelerated Canvas2D repeatedly caused AMDGPU protection faults and graphics
  ring resets in Firefox during ordinary play.
- A mixed backend would copy cached rasters between CPU and GPU surfaces. One
  shared software backend keeps the visible canvas and its sources consistent.
- The game already bounds its expensive work with camera, prop, and lazy actor
  caches, so stability is worth the additional CPU cost.

**Tradeoff:**

- Canvas rasterization uses more CPU and may benchmark slower on systems where
  accelerated Canvas2D is reliable.
- The browser may still use its compositor to present the final canvas, but the
  game's drawing commands and raster caches no longer require accelerated
  Canvas2D.
- Preserve the 1280x960 backing store, 640x480 logical grid, hard pixels, and
  existing cache budgets when tuning performance.

## Decision 013: Versioned single-run saves in IndexedDB

**Choice:** Keep one active run in browser IndexedDB with one manual record and
three rotating autosave records. Each record is a versioned, checksummed JSON
envelope. The same envelope can be exported to or imported from a local JSON
file.

**Why:**

- IndexedDB supports transactional replacement without adding a dependency or
  server requirement.
- A manual record plus three recovery points protects against a bad checkpoint
  without introducing profiles or a large slot-management system.
- JSON export provides a player-controlled backup outside browser storage.
- A format version and sequential migrations make structural compatibility an
  explicit engineering decision.
- The package game version records provenance. A package-version difference is
  shown to the player but does not reject a structurally compatible save.

**Save boundary:**

The snapshot stores player and companion state, inventory instances, quest and
flag progress, the field clock, visited-level deltas, actor state, explored
cells, ground items, and stable content references. Authored content remains in
`data/` and is reloaded from the current build. It is not copied into saves.

**Safety and recovery:**

- SHA-256 detects truncated or altered records before restore.
- Imported level paths and item identifiers are constrained to local data
  namespaces before they can reach `fetch`.
- A newer save format is incompatible until a migration exists. An older
  supported format is migrated and rewritten with a fresh checksum.
- Writes are queued in one tab and committed in IndexedDB transactions. Failed
  writes preserve the previous record.
- Saving is allowed only in stable exploration or victory state. Combat gets a
  checkpoint immediately before it starts and another after it ends.
- Starting a new run does not erase the old run until the first new snapshot is
  committed successfully.

**Tradeoff:**

This is one local run, not cloud sync, account storage, or a multi-profile
system. Concurrent tabs are not coordinated beyond IndexedDB transaction
semantics, so players should keep one gameplay tab active.

## Decision 014: Data-driven fresh-map playtest checkpoints

**Choice:** Use versioned checkpoint data under `data/playtests/` for direct
developer starts. A URL selects a profile and target level. The target receives
one coherent prior-campaign state through the normal boot path.

**Why:**

- Later maps depend on flags, quest stages, evidence, and persistent companion
  state earned in earlier regions.
- Enabling every flag is invalid because many interactions require one flag to
  be present and a completion or reporting flag to be absent.
- Shared checkpoint inheritance keeps campaign history out of engine code and
  avoids duplicating the same prior state for every interior.
- Using normal condition evaluation makes a playtest representative of the
  shipped game after it starts.

**Safety boundary:**

The `fresh` profile covers every current level, but it cannot seed a flag
produced by the target level or its referenced dialogue. Validation enforces
that boundary and checks all level, item, quest, stage, technique, and flag
references. Profile starts do not attach IndexedDB saves.

**Tradeoff:**

One fresh profile represents one canonical prior history. Testing mutually
exclusive histories requires another named profile or an explicit targeted
fixture. Adding a level also requires adding its fresh-profile mapping before
content validation passes.

## Decision 015: Procedural local soundscape and shared civilian work contract

**Choice:** Use one data-driven civilian activity shape across patrol stops and
coordinated tableaux. Generate the first environmental soundscape with the
browser Web Audio API instead of shipping audio files or adding a dependency.

**Why:**

- A small set of physical motions can serve many content-defined jobs without
  placing location lore in movement, rendering, or audio code.
- Coordinated scenes need temporary cell reservations and return-to-home rules,
  which belong in world logic rather than actor scripts embedded in `Game.js`.
- Procedural beds and short material cues keep the local-hostable slice small
  while establishing useful distance, panning, cooldown, and polyphony rules
  for later recorded assets.
- Separating a responsive prop's live detail from its cached base avoids
  rebuilding a complex static object for every animation frame.

**Content boundary:**

Level data owns activity targets, durations, motions, visible responses, cue
ids, tableau participants, timing, barks, and ambient-zone bounds. Generic ids
and frame timing live in `src/world/NpcActivity.js`; coordination lives in
`TableauSystem.js`; hard-pixel responses live with the render primitives; and
audio synthesis lives in `src/audio/WorldAudioRuntime.js`.

**Tradeoff:**

The procedural sound is intentionally restrained and textural. It is not a
replacement for final recorded ambience, voice, or a music system. Browsers
also require a user gesture before sound begins. The data contract is designed
so recorded buffers can replace individual profiles or cues later without
changing maps or NPC routines.

## Decision 016: Raster-derived hard-pixel world shadows

**Choice:** Derive contact, daylight-cast, and hover-outline masks from the
exact prepared prop raster or active actor atlas frame. Require every sprite
catalog kind to resolve an explicit shadow profile. Keep generated masks in a
dedicated 24 MiB LRU cache and union outdoor casts on one native viewport layer.

**Why:**

- Generic ovals and category-sized diamonds contradicted the authored feet,
  supports, wheels, roots, prone bodies, and asymmetric Host silhouettes.
- Using the visible raster as authority keeps shadows correct across seed,
  orientation, open state, animation, death pose, and equipment changes.
- One cast layer gives overlapping objects a constant-alpha union instead of
  progressively darker intersections.
- The same alpha source can provide a one-native-pixel interaction rim without
  blur, bloom, a persistent icon, or a second authored outline asset.

**Rendering contract:**

`PropSpriteCache` prepares and composites a tightly cropped raster under its
existing 64 MiB budget. `ShadowMaskCache` stores the compact source alpha and
derived binary masks under 24 MiB. Contact masks sample an authored ground band
or a reviewed full/custom silhouette and expand by no more than one native
pixel. Casts project opaque pixels with integer raster math using the existing
level sun offsets. Indoor levels never receive outdoor projection. Occlusion
fades a prop and its contact and cast coverage together.

**Tradeoff:**

The first view of a dense scene pays for alpha reads and mask construction, and
animated transitions need visible-state cache keys. Typed-array builders,
bounded caches, and hard-pixel timeline quantization keep the measured cold and
warm costs inside the native 1280x960 targets. Any new renderable kind must now
choose a correct profile or document why one or both channels are `none`.
