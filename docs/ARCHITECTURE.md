# Architecture

This document defines the intended shape of the project so the repo does not become unmaintainable as the RPG grows.

## Core goal

Build a local-hostable JavaScript top-down turn-based RPG that can grow from a small playable demo into a larger content-heavy game without becoming a pile of hardcoded systems.

The project should stay:

- Easy to run locally.
- Easy to understand after weeks away.
- Data-driven where possible.
- Modular without being over-engineered.
- Friendly to AI assistants, but not dependent on them.

## Top-level structure

```text
/
├── AGENTS.md
├── README.md
├── index.html
├── package.json
├── assets/
├── data/
├── docs/
├── scripts/
├── src/
└── tests/
```

### `assets/`

Stores art, audio, fonts, UI sprites, tilesets, portraits, effects, and other static game files.

Rules:

- Do not put source code here.
- Do not put JSON game logic here unless it is truly asset metadata.
- Use clear names, for example `tileset_ruined_city_01.png`, not `newnewtilesfinal.png`.
- Keep generated exports separate from raw source files.

### `data/`

Stores game content in JSON or another documented data format.

Examples:

- Maps.
- Actors.
- Enemies.
- Items.
- Abilities.
- Encounters.
- Dialogue.
- Quests.
- Faction reputation values.

Rules:

- Content belongs here, not scattered through source files.
- Every data object should have a stable `id`.
- IDs should use lowercase kebab-case, for example `host-penitent-bastion`.
- Do not duplicate the same data in multiple places unless there is a documented reason.

### `docs/`

Stores design and maintenance documentation.

Important docs:

- `ARCHITECTURE.md`: repo and system boundaries.
- `CONTENT_PIPELINE.md`: how data and assets are structured.
- `TECH_DECISIONS.md`: decisions about tools, dependencies, rendering, and architecture.
- `VERTICAL_SLICE.md`: small playable milestone plan.
- `LORE_INTEGRATION.md`: how the setting should be represented in game systems.
- `lore/the_host_story_bible.md`: setting canon.
- `maps/README.md`: act-separated map-planning packages and child-map
  registries.

Map planning documents use
`docs/maps/act-N/<main-level-id>/main/` for the main-map reference and
`docs/maps/act-N/<main-level-id>/submaps/` for connected interiors, dungeons,
and other helper maps. These are design references only. Playable map data
remains under `data/levels/`.

### `scripts/`

Stores local development scripts.

Examples:

- Static dev server.
- Data validators.
- Asset checks.
- Build helpers later.

Rules:

- Scripts should be boring and clear.
- Do not hide complicated build behavior here without documenting it.

### `src/`

Stores runtime game code.

Suggested structure:

```text
src/
├── main.js
├── audio/
├── core/
├── render/
├── world/
├── combat/
├── entities/
├── ui/
└── util/
```

## Source module responsibilities

### `src/main.js`

Entry point only.

Allowed responsibilities:

- Find the canvas element.
- Load initial data.
- Create the `Game` object.
- Start the game.
- Display a fatal startup error if initialization fails.

Not allowed:

- Combat logic.
- Rendering logic beyond setup.
- Hardcoded map or enemy data.
- Large event systems.
- Big global variables.

### `src/core/`

Game orchestration and generic runtime systems.

Examples:

- `Game.js`
- `GameLoop.js`
- `Input.js`
- `AssetLoader.js`
- `ContentLoader.js`
- `DialogueConditions.js`
- `DialogueEffects.js`
- `JournalState.js`
- `LootSession.js`
- `TradeSession.js`

The core layer coordinates systems but should not contain setting-specific lore.
`Game.js` remains the coordinator for input, mode changes, combat flow, level
state, and render-state building. Reusable runtime rules that do not need to own
the whole game instance belong in focused modules such as loot, trade, journal,
dialogue conditions, and dialogue effects.

Run persistence is split under `src/core/save/`:

- `SaveSchema.js` owns the envelope version, slot identifiers, structural
  validation, safe content references, and sequential migration registry.
- `SaveCodec.js` creates and reads checksummed JSON envelopes.
- `SaveRepository.js` owns IndexedDB transactions. It does not know game rules.
- `SaveCoordinator.js` owns manual-save policy, three-slot autosave rotation,
  import replacement, compatibility status, and serialized writes.
- `GameSaveRuntime.js` captures and restores Game state and routes title, pause,
  save-management, import, and export intent.

Snapshots contain run state and stable content references, not copied level,
quest, dialogue, or journal definitions. On load, `LevelLoader.js` resolves the
saved item and visited-level references against the current `data/` tree. This
keeps compatible saves on current content while the schema migration layer
handles renamed or reshaped references.

Weapon state follows the same boundary. `Inventory.js` owns the player's two
ready weapon instances, condition, and loaded ammunition. Shared schema
normalization lives in `combat/WeaponRules.js`; enemy item references and their
finite magazines live in `combat/ActorWeaponLoadout.js`. Catalog content stays
in `data/items/`, and combat receives normalized attacks without hardcoded lore
or item ids.

Developer fresh-map starts use `PlaytestProfile.js`. It resolves generic,
inheritable checkpoint data from `data/playtests/` and passes one normalized
seed into the ordinary `Game.boot()` path. The seed is applied only on a fresh
boot or restart. Normal level transitions preserve the resulting run state and
do not reapply it. Playtest jumps do not receive a save coordinator, so their
state cannot overwrite the normal IndexedDB run.

### `src/audio/`

Dependency-free browser audio synthesis and playback.

`WorldAudioRuntime.js` owns Web Audio setup, procedural ambient buffers,
physical one-shot recipes, distance and stereo attenuation, voice limits, and
the small persisted volume setting. Level data chooses generic profiles and
places their bounds. The audio runtime does not know location names, quests, or
factions. Audio unlocks only after a browser gesture and degrades to silence
when Web Audio is unavailable.

### `src/render/`

Canvas drawing and visual presentation.

Examples:

- `CanvasRenderer.js`
- `Camera.js`
- `SpriteSheet.js`
- `Animation.js`
- `UIRenderer.js`
- `PixelPrimitives.js`
- `SpriteAtlas.js`

Rules:

- Renderer receives world/entity state and draws it.
- Renderer should not decide game rules.
- Renderer should not mutate combat outcomes.

Large render surfaces can keep public facade modules when that keeps imports
stable. `UIRenderer.js` delegates panel drawing to `src/render/ui/`;
`PixelPrimitives.js` re-exports category modules under
`src/render/primitives/`; and `SpriteAtlas.js` assembles sprite baking from
modules under `src/render/sprites/`.

The renderer uses a 640x480 logical design grid over a 1280x960 backing canvas.
`StaticSceneCache.js` owns the bounded camera-following floor and flat-decal
surface. `PropSpriteCache.js` owns tightly cropped native rasters for unchanged
volumetric props. Its prepare/composite split lets the visible model, contact
mask, cast mask, and hover rim share one exact raster. Animated entries use a
visible-state signature; continuous timelines are quantized to hard-pixel frame
steps. Work-responsive entries keep their base raster in that cache and expose
a separate live overlay for paper, water, tools, loads, cloth, or machinery
feedback.

`ShadowMaskCache.js` reads those rasters and lazy actor frames into binary
hard-pixel contact, projected cast, and outline masks under one 24 MiB LRU
budget. Outdoor casts are first unioned on a native viewport layer and then
composited once at the level sun alpha, so overlaps never become darker. Indoor
maps skip that cast layer. Depth rendering pairs each contact mask with its
model so occlusion fading affects both together. `hoveredWorldTarget` in the
render state identifies the exact actor or object and action; only that target
receives a one-native-pixel semantic-color rim and, when necessary, four pixels
at its separate use cell. Projection, camera state, gameplay positions, UI
layout, and input mapping stay in logical coordinates.

### `src/world/`

Maps, tile grids, collision, pathfinding, spatial queries, and world-state logic.

Examples:

- `Grid.js`
- `MapState.js`
- `Pathfinder.js`
- `Zone.js`
- `PatrolSystem.js`
- `TableauSystem.js`
- `NpcActivity.js`
- `StealthRuntime.js`

Rules:

- World logic knows what tiles are walkable.
- World logic does not draw.
- World logic does not contain UI code.

`NpcActivity.js` is the shared content contract for short civilian work. It
normalizes motion, prop response, duration, frame timing, and optional sound
ids without knowing any settlement content. `PatrolSystem.js` triggers those
activities at ordinary route stops. `TableauSystem.js` coordinates two or more
actors through reserved gathering cells, staggered work, homeward return, and
deterministic cooldown. Transient tableau positions are not save authority;
stable saves capture a reserved participant at the home cell recorded when the
scene began.

### `src/combat/`

Turn-based combat systems.

Examples:

- `TurnManager.js`
- `ActionResolver.js`
- `StatusEffect.js`
- `AbilityTargeting.js`

Rules:

- Combat systems should use data-defined abilities and stats.
- Combat systems should return results that rendering/UI can present.
- Do not hardcode enemy-specific behavior unless it is represented as reusable AI/action logic.

### `src/entities/`

Entity and actor models.

Examples:

- `Entity.js`
- `Actor.js`
- `Party.js`
- `FactionReputation.js`

Rules:

- Entities hold state.
- Systems operate on entities.
- Avoid giant inheritance trees. Prefer simple objects and small classes.

### `src/companions/`

Reusable companion state and progression rules.

The first vertical slice uses one persistent field attendant. Its definition
lives under `data/companions/`, while `CompanionSystem.js` owns recruitment,
upgrade prerequisites, costs, stat application, run snapshots, and reboot
state. `GameDroneRuntime.js` coordinates exploration, shrine registration, and
journal intent. `GameDroneCombatRuntime.js` coordinates manual turns, active
abilities, reactions, and temporary field devices.

Rules:

- Companion definitions and upgrade nodes remain data-driven.
- A companion is an entity with an explicit `team`, `control`, and `ownerId`.
- General combat code reasons about teams. It must not special-case a named
  drone model.
- Renderers consume companion entities and dynamic props. They do not purchase
  upgrades or resolve abilities.
- Run persistence snapshots the companion separately from level-local actors.

### `src/ui/`

HUD, menus, inventory, dialogue UI, combat UI, and tooltips.

Rules:

- UI presents state and sends player intent.
- UI should not secretly change game rules.

### `src/util/`

Small helper functions that are truly reusable.

Rules:

- Do not let `util/` become a junk drawer.
- If a helper only applies to combat, keep it in `combat/`.
- If a helper only applies to rendering, keep it in `render/`.

## Runtime data flow

A clean basic flow:

```text
Input -> Game -> World/Combat Systems -> Entity State -> Renderer/UI
```

Example:

1. Player presses an arrow key.
2. `Input` records an intent.
3. `Game` consumes the intent.
4. `Grid` checks whether the target tile is walkable.
5. `Entity` position updates.
6. `Renderer` draws the updated state.

Keep this direction clear. Do not let the renderer directly consume keyboard events and move characters.

Save flow remains similarly one-way:

```text
Game state -> snapshot -> schema and checksum -> coordinator -> IndexedDB
IndexedDB -> checksum and migration -> snapshot -> content reload -> Game state
```

The renderer only presents save status. It never reads browser storage. A
failed write leaves the previous transaction intact. A failed in-session load
attempts to restore the pre-load snapshot before falling back to the title
screen.

## Content loading flow

```text
data/*.json -> ContentLoader/fetch -> Game state objects -> Systems -> Renderer/UI
```

Rules:

- JSON content should be validated by scripts.
- JSON content should not include executable code.
- Source systems should gracefully report missing content instead of failing silently.

## File naming

Use:

- Classes/modules: `PascalCase.js`, for example `GameLoop.js`.
- Simple helper modules: `camelCase.js`, for example `clamp.js`.
- Data files: `kebab-case.json`, for example `host-penitent-bastion.json`.
- Asset files: `kebab-case`, with descriptive prefixes, for example `sprite-player-militia-idle.png`.

## Anti-patterns to avoid

Avoid these early:

- A giant global `state` object modified from everywhere.
- Combat logic inside rendering code.
- Rendering code inside entity classes.
- Copy-pasted enemy behavior.
- Content hardcoded inside source files.
- A huge inheritance hierarchy like `Enemy -> Monster -> HostMonster -> Penitent -> PenitentElite`.
- Adding a framework to solve simple state problems.
- Premature ECS architecture before there are enough entity types to justify it.
- Building a full dialogue editor before one dialogue exists.
- Building a full quest engine before one quest exists.

## Scaling path

Grow in this order:

1. Static grid rendering.
2. Player movement.
3. Collision.
4. One enemy.
5. Turn order.
6. Basic attack.
7. Damage/death.
8. Simple UI.
9. One dialogue.
10. One quest.
11. Save/load.
12. Multiple maps.
13. Inventory.
14. Abilities/status effects.
15. Faction reputation.
16. More content.

Avoid building large systems before they have at least one real content use.
