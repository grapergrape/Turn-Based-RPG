# Content Pipeline

> Writing rule: any player-facing text you add to `data/` (dialogue, descriptions,
> level intros/briefings/logs, UI strings) must follow
> `anti_ai_slop_writing_skill/SKILL.md`. Hard ban on em-dashes / `--` / `—`;
> rewrite instead. See also `AGENTS.md` -> "Player-facing writing".

The RPG should be content-driven. Systems live in `src/`; game content lives in `data/`; art and audio live in `assets/`.

This keeps the project editable and prevents every new enemy, map, or item from requiring source-code changes.

## Proper names and stable IDs

Create and revise proper names with `name-the-world/SKILL.md`. The accepted
register mixes biblical, Greek Christian, Late Latin, and Roman forms according
to household, institution, occupation, and class. It does not organize cultures
around Adriatic names or decorative pseudo-Latin endings.

`name-the-world/references/retcon-ledger.json` records each revised display name
against its stable compatibility ID. Generators must accept or declare the ID
explicitly. They must not slug a current display name into an actor, dialogue,
spawn, object, quest, flag, or save ID. A legacy ID may contain an old lowercase
name, but that ID is opaque and never shown to the player.

Normal character creation begins with an empty name field and cannot confirm
until the player enters a valid name. Developer fixtures may use a role label.
Existing save snapshots continue to restore their stored custom player name.

Run `node name-the-world/scripts/audit-names.mjs` after changing names or named
content. The audit checks actor data against the ledger, retired and blocked
display names, the protected Father Marius Vale anchor, ASCII rendering, stable
South Measure IDs, and the blank new-character default.

## Content principles

1. Every game content object gets a stable `id`.
2. IDs use lowercase kebab-case.
3. Source code should load content by ID, not by display name.
4. Display names can change; IDs should rarely change.
5. JSON should be human-readable and formatted with two spaces.
6. Avoid duplicating stats. Use shared templates later if duplication becomes painful.
7. Start simple. Do not create a huge schema before the game needs it.

## Save compatibility for content authors

Save files contain stable IDs, current and visited level paths, and runtime
deltas. They do not preserve authored quest, journal, dialogue, item, or level
definitions. A loaded run resolves those references from the current `data/`
tree.

Consequences for content changes:

- Display text and balance values can change without changing the save format.
- Do not rename a visited level file, item ID, quest ID, stage ID, actor spawn
  ID, object state key, encounter ID, or flag casually. Existing saves may
  reference it.
- When a stable reference must change, increase `SAVE_FORMAT_VERSION` in
  `src/core/save/SaveSchema.js` and register a migration from every supported
  preceding format. Migrations may rewrite payload references and must advance
  exactly one version.
- A `package.json` version change records which build wrote a save. It is not a
  substitute for a save-format migration.
- Keep level save identities deterministic. Authored object IDs and actor
  `spawnId` values are preferred over position-derived fallback identities.

The save format is runtime infrastructure and does not add a new authored data
folder. `npm run check` still validates the source content; `saveSystem.test.mjs`
validates the persistence contract and migration behavior.

## Fresh-map playtest profiles

Developer arrival state lives under `data/playtests/`, separate from saves and
runtime level JSON. The `fresh` profile is selected with
`?level=<level-file-or-alias>&playtest=fresh`. It covers every current level and
is never read by a normal title-screen run.

A profile contains shared `checkpoints` and one entry in `levels` for each
level file. Checkpoints may inherit through `extends`. A level selects one
checkpoint and may add the small amount of access state needed when that level
is opened directly. Resolved state can contain:

- `flags` and `clearFlags`;
- `questStages` and optional `questReached`;
- `inventory.items` plus `maxCarryWeight`;
- `progression`, including `techniques: "all"` for the current technique index;
- `companionRun` for a companion already recruited before the target map;
- `clock` and `requiredLevelPaths`.

Inventory entries are merged by item id. A child entry with count zero removes
an inherited playtest addition, which represents an item consumed before a
later checkpoint. `requiredLevelPaths` loads prior quest and journal definitions
without copying authored content into the profile.

Companion state uses the same run shape as save snapshots: definition id,
recruitment and ritual state, name, health, upgrades, upgrade points, and level
reward tracking. A map that owns companion recruitment must begin without that
state. Checkpoints after the recruitment include it and any awarded service
items.

The profile is an arrival checkpoint, not a bag of every possible flag. A
target level must never receive a flag that it or one of its referenced
dialogues sets or clears. Its discoveries, reports, rewards, and endings begin
unresolved. Earlier mutually exclusive outcomes must select one coherent
campaign history. `npm run check` enforces profile coverage, inheritance,
references, quest stages, and the target-owned flag boundary.

## Current data folders

```text
data/
├── levels/
├── maps/
├── actors/
├── enemies/
├── items/
├── dialogue/
├── techniques/
├── playtests/
└── quests/
```

Future folders can include:

```text
data/
├── encounters/
├── factions/
└── status-effects/
```

Add a new folder only when there is real content for it.

## Map data

Current map files live in `data/maps/`.

Minimal map shape:

```json
{
  "id": "demo-map",
  "name": "Demo Map",
  "width": 15,
  "height": 10,
  "tileSize": 32,
  "tiles": [
    "###############",
    "#.............#",
    "#.............#",
    "###############"
  ],
  "legend": {
    "#": { "kind": "wall", "walkable": false },
    ".": { "kind": "floor", "walkable": true }
  },
  "spawns": {
    "player": { "x": 2, "y": 2 },
    "enemies": [
      { "id": "host-penitent-bastion", "x": 10, "y": 6 }
    ]
  }
}
```

Rules:

- `tiles.length` must equal `height`.
- Each tile row length must equal `width`.
- Every tile character must exist in `legend`.
- Coordinates are grid coordinates, not pixels.
- Do not put rendering colors in map files long term. The current demo may use simple colors until art exists.
- Level legend entries can optionally set `floor` to select a baked outdoor or
  indoor floor style while keeping the usual `kind` and `walkable` fields. If
  omitted, the renderer uses the original ruined stone style. Current floor
  styles are `stone`, `ash-dirt`, `ash-road`, `road-shoulder`, `wheat-field`,
  `furrow-field`, `forest-floor`, `graveyard-earth`, `farm-plank`,
  `packed-earth`, `mud-track`, `ash-gravel`, `worn-canvas`, `cave-stone`, and
  `cave-river`. The Ash Road South surface owns `south-measure-slab`,
  `south-measure-yard`, `south-measure-row`, and
  `south-measure-grave-strip`; these are location identity, not general-purpose
  replacements for stone, road, or grave floors. South Measure also uses the
  engineered channel styles `relief-channel-x`, `relief-channel-y`, and
  `relief-channel-junction`. The junction style is required where both channel
  axes meet so relief lines do not paint across one another as a false seam.
- Levels can optionally set `mood` for scene-wide visual treatment. Existing
  keys are `floorShade`, `floorShadeAlpha`, `ambient`, `ambientAlpha`, and
  `vignette`. Outdoor daylight maps can also set `mood.sun.enabled: true` with
  `shadowOffsetX`, `shadowOffsetY`, and `shadowAlpha`. The offsets are an integer
  silhouette-projection vector at each catalog profile's `referenceHeight`, not
  the dimensions of a generic diamond. The renderer unions all opaque cast
  pixels into one viewport mask and composites it once at `shadowAlpha`. This
  also opts the scene into clock-based dawn and night washes. Indoor levels omit
  `mood.sun`, so their authored ambient tint and vignette stay stable as the
  field clock advances.
- On sun-enabled outdoor maps, the run clock adds the moving time of day
  treatment after level mood. The journal date is generated by
  `src/core/GameClock.js` as a field day in Year 130 After Descent. Do not
  hardcode dates into level text unless a specific note, ledger, or dialogue
  line needs its own authored date.

### Location identity before implementation

Every new main map must define its own visual identity before objects are
scattered into it. Record the following in the location package under
`docs/maps/`:

- three or more location-owned material or floor families;
- a location-owned boundary silhouette;
- at least three district masses or work systems that remain identifiable in a
  label-free whole-map view;
- one dominant landmark and one human-scale identity cluster at the arrival;
- a short continuity-kit list for the few models or floors that intentionally
  cross from an adjacent map;
- a forbidden-kit list naming recognizable models, decals, and textures from
  prior locations that would collapse the new map into an old one.

Reuse is not harmless just because an object receives a new content ID. A new
kind wired to an old draw function is still reused art. Identity review must
compare rendered silhouettes and materials as well as JSON kind names. Shared
campaign infrastructure such as a road may continue across a boundary, but it
must have an explicit cell or placement budget and cannot become the new map's
dominant surface language.

Generated levels should add a fast regression test that scans both placed
objects and actually used legend cells against previous maps. Location-owned
kinds must not leak into unrelated maps, and borrowed kinds must stay within
the declared continuity budget. For a large map, also assert district-scoped
clusters so global object counts cannot pass while one district becomes an
empty prop field.

## Map planning documents

Planning images and spatial design notes live under `docs/maps/`, separate from
runtime JSON. Organize them by campaign act and main playable location:

```text
docs/maps/act-N/<main-level-id>/
├── README.md
├── main/planning-map.png
└── submaps/
    ├── README.md
    └── <submap-or-group-id>/
        ├── README.md
        └── planning-map.png
```

The location README links the runtime main level, generator, visual reference,
and child-map registry. The registry lists every implemented and planned child
map, even before that child has artwork or JSON. Only create a child folder when
it has a real image or substantial design notes. Keep the canonical image name
`planning-map.png`; use Git history instead of filename revision suffixes.

Files under `docs/maps/` are never runtime dependencies. Level JSON and its
generator remain authoritative for coordinates, collision, and transitions.

### Generated South Measure package

The Ash Road South surface is generated by `scripts/gen-ash-road-south.mjs`.
Its surface life content is split into three small authored modules:
`scripts/content/ash-road-south-routines.mjs` owns object-linked civilian work
stops, `ash-road-south-tableaux.mjs` owns recurring coordinated scenes, and
`ash-road-south-inspections.mjs` owns the thirty environmental inspections.
`ash-road-south-soundscape.mjs` defines the four district beds and the allowed
physical work cues. Edit those sources and regenerate the level instead of
editing `data/levels/ash_road_south.json` by hand.
Its nine helper maps and all thirty reciprocal connector dialogue endpoints are
generated by `scripts/gen-south-measure-submaps.mjs`, using authored text from
`scripts/content/south-measure-submap-content.mjs`. Helper actors, enemies,
barks, and conversations are generated by
`scripts/gen-south-measure-population.mjs` from the two
`scripts/content/south-measure-population.mjs` and
`scripts/content/south-measure-dialogues.mjs` modules. Rebuild in surface,
population, then helper-map order because the helper generator validates its
surface destinations and places referenced population records.

The helper generator writes these authoritative runtime levels:

- `data/levels/south_measure_intake_undercroft.json`
- `data/levels/south_measure_relief_drain.json`
- `data/levels/south_measure_relief_maintenance_annex.json`
- `data/levels/south_measure_morrow_freight_house.json`
- `data/levels/south_measure_compact_clinic.json`
- `data/levels/south_measure_measure_hall.json`
- `data/levels/south_measure_varo_house.json`
- `data/levels/south_measure_hidden_rows.json`
- `data/levels/south_measure_charity_cellar.json`

`tests/southMeasureHelperMaps.test.mjs` locks their dimensions, physical gate
cells, reachable use cells, wall planes or hatch orientations, destination
coordinates, arrival facings, and all fifteen reciprocal connector pairs. Each
helper map also authors one contextual opened-state container and one reachable
loose common supply through `groundItems`. The generator and contract test lock
those stable pickup ids, placements, contents, collision, and reachability. The
planning references and full connector ledger live under
`docs/maps/act-1/ash-road-south/submaps/`.

### Generated Old Pilgrim Way package

Run `node scripts/gen-old-pilgrim-way.mjs` after changing
`scripts/content/old-pilgrim-way-content.mjs`. The generator writes the road
surface, five connected church and novitiate levels, and their supporting
actors, enemy, items, quests, and dialogues. These six runtime levels are:

- `data/levels/old_pilgrim_way.json`
- `data/levels/old_pilgrim_hill_church.json`
- `data/levels/old_pilgrim_closure_stair.json`
- `data/levels/old_pilgrim_novitiate_quarters.json`
- `data/levels/old_pilgrim_trial_galleries.json`
- `data/levels/old_pilgrim_sealed_chapter.json`

`tests/oldPilgrimWayLevel.test.mjs` locks their dimensions, route connections,
discovery checks, trial states, ordinary-dead requirements, encounter count,
South Measure outcome carryover, rewards, and return shortcut. Runtime JSON is
generated output. Make authored content changes in the source module.

## Level data

Levels live in `data/levels/`. A level extends the minimal map shape with scene
objects, spawns, dialogue, quests, and optional encounter trigger zones. The
current playable slice uses `ash_chapel_breach.json` for the chapel and
`ash_chapel_cellar.json` for the hidden cellar below it.

Shape:

```json
{
  "id": "ash-chapel-breach",
  "name": "Ash Chapel Breach",
  "intro": "Short flavour line shown on load.",
  "width": 18,
  "height": 14,
  "tileSize": 64,
  "quests": ["investigate-ash-chapel-cult"],
  "dialogue": ["ash-chapel-cult-ledger"],
  "tiles": ["##################", "..."],
  "legend": { "#": { "kind": "wall", "walkable": false }, ".": { "kind": "floor", "walkable": true } },
  "spawns": {
    "player": { "actor": "mara-vey", "x": 8, "y": 12 },
    "npcs": [
      {
        "actor": "catacombs-survivor-oren",
        "x": 18,
        "y": 4,
        "dialogue": "ash-chapel-catacombs-oren",
        "dialogueRepeat": true,
        "ambient": ["Keep the little ones near the stair."]
      }
    ],
    "enemies": [
      {
        "id": "choir-flesh-eater",
        "x": 4,
        "y": 4,
        "encounter": "nave-rite",
        "ambient": ["Chew slow. Let the lesson find the throat."]
      },
      { "id": "host-touched-penitent", "x": 10, "y": 2, "encounter": "east-watch" }
    ]
  },
  "combatTriggers": [
    { "id": "nave-trigger", "encounter": "nave-rite", "x": 8, "y": 3, "radius": 2, "intro": ["A line shown when this encounter starts."] }
  ],
  "levelTransitions": [
    {
      "id": "cellar-stair-transition",
      "x": 12,
      "y": 8,
      "clickAreas": [
        { "x0": 10, "y0": 5, "x1": 13, "y1": 7 }
      ],
      "loadLevel": {
        "path": "./data/levels/ash_chapel_cellar.json",
        "player": { "x": 12, "y": 13 }
      }
    }
  ],
  "combatIntro": ["A line shown when combat starts."],
  "onVictory": { "questUpdate": { "quest": "investigate-ash-chapel-cult", "stage": "cult-broken" } },
  "objects": [
    { "kind": "broken-pew", "x": 6, "y": 5, "blocking": true },
    { "kind": "rusted-reliquary", "x": 2, "y": 4, "blocking": true,
      "interact": { "type": "container", "log": "...", "loot": [ { "item": "relic-rounds", "count": 2 } ] } },
    { "kind": "damaged-altar", "x": 8, "y": 1, "blocking": true,
      "interact": { "type": "altar", "triggersCombat": true, "dialogue": "ash-chapel-altar-rite", "log": ["line one", "line two"] } },
    { "kind": "rusted-barrel", "x": 12, "y": 8, "blocking": true,
      "interact": { "type": "secret-entrance", "dialogue": "ash-chapel-barrel-ladder", "log": "..." } },
    { "kind": "blood-stain", "x": 3, "y": 6 }
  ]
}
```

Rules:

- `objects[].kind` selects a renderable kind from the **sprite catalog**
  (`src/render/spriteCatalog.js`), the single source of truth for every kind:
  its draw function, category, depth layer, shadow contract, and whether it is a
  flat decal or a wall block. That file (not a list here) is authoritative; to add a new kind,
  add one entry there and a draw function (see `game_art_skill/SKILL.md`,
  Section 5). Kinds
  group into terrain blocks (`wall`, `wall-broken`), wall fixtures
  (`wall-window`, `wall-safe`, `wall-stash`), structures, furniture, props,
  lights, gore, creatures, ritual marks, and flat ground decals.
- Every catalog entry resolves an explicit `shadow` object. `contact.mode` is
  `ground-band`, `full-silhouette`, `custom`, or `none`; it also records native
  `depth`, zero-or-one-pixel `spread`, logical offsets, `alphaScale`, and the
  alpha threshold used to exclude authored light pools. `cast.mode` is
  `silhouette`, `custom`, or `none`, with `referenceHeight`, `alphaScale`, and
  its alpha threshold. Flat decals resolve both channels to reviewed `none`.
  Wall fixtures, hanging art, connected architecture, airborne models, prone
  bodies, and lights use named custom or reviewed-none profiles. Do not draw a
  shadow inside a primitive. The runtime derives both masks from the exact
  prepared raster or active actor frame.
- Wall fixtures are blocks drawn into a wall cell. A purely visual one (a window)
  can be a legend tile letter. One that carries loot or a lock (a safe, a stash)
  is an authored object placed on a wall cell with `blocking: true` and an
  `interact`; the loader skips the default wall behind any `wall-*` object so the
  block is not drawn twice. The player reaches it from the floor tile in front.
- `blocking: true` makes the object's tile impassable (collision uses the same
  rule in explore and combat).
- `hiddenUntilOpened: true` keeps an authored prop concealed until an object in
  its shared `doorGroup` opens. The floor remains visible, so use this for a
  secret prop on an ordinary floor cell rather than for a hidden room.
- `hiddenWhenFlags`, `disabledWhenFlags`, and `closedWhenFlags` accept a flag id
  or list of flag ids. Any matching run flag respectively conceals the prop,
  removes it from targeting and map markers, or forces an opened object closed.
  Use these for physical consequences that must survive level transitions,
  such as taking a document or resealing a compartment.
- `visibleWhenFlags` accepts a flag id or list of flag ids and conceals the prop
  until any listed flag is present. A blocking prop stops blocking while it is
  concealed. Use this for mutually exclusive outcome dressing and opened route
  markers that appear after a settlement decision.
- `cover` is optional on level objects and legend entries. Valid values are
  `"none"`, `"light"`, and `"hard"`. Most cover should come from
  `src/render/spriteCatalog.js`, where the prop kind is already registered.
  Use JSON `cover` only to override a specific placement. Cover affects ranged
  hit chance and line of fire, not movement. `light` cover gives a smaller hit
  penalty than `hard` cover. Open passable doors stop providing cover.
- `interact` (optional) can mark a loot container (`type: "container"` with
  `loot`), a dead body (`type: "corpse"` with optional `loot`), the altar
  (`type: "altar"` with `triggersCombat`), a readable note (`type: "note"`), a
  passable door (`type: "door"`), or a hidden ladder
  (`type: "secret-entrance"` / `type: "secret-exit"`). Interactions can
  reference `dialogue` by id and apply a `questUpdate`.
- `interact.logVariants` can replace the ordinary `interact.log` with the first
  entry whose standard dialogue `conditions` pass. Each entry has
  `{ "conditions": {...}, "log": "..." }`. Keep the ordinary `log` as a
  fallback for runs that match no variant. This is intended for physical
  evidence that changes after a quest or settlement outcome, not for granting
  additional loot.
- Corpse loot uses the same inventory and carry-weight rules as containers, but
  the body stays visible and can still open its inspect dialogue after looting.
- Interactable objects can define `clickAreas` rectangles when raised or wide
  art inverse-projects to cells other than the object's logical `x` and `y`.
  Clicking any covered cell targets the object, while movement and interaction
  range still use its logical cell. Keep that logical cell walkable or adjacent
  to reachable floor. Exact actors, corpses, and objects take priority over a
  click area.
- `interactionMarker` can set the grid cell used by the nearby green brackets.
  Use it when the logical approach cell is not the visual center of the object,
  such as a wall-mounted door above a walkable apron.
- `levelTransitions` is an optional array of walk-on level exits. Each entry has
  a stable `id`, a walkable `x` and `y` tile, and a `loadLevel` object with the
  target `path` plus the destination player tile. Use this for open thresholds
  where stepping onto the tile should move the player. Optional `clickAreas`
  rectangles can cover nearby visual footprint cells and route clicks to the
  walkable transition tile. The level change still fires only after the player
  reaches `x` and `y`. Use `interact` plus dialogue when the player must inspect,
  unlock, search, or choose before changing levels.
- `loadLevel.player.facing` is optional for both level transitions and dialogue
  effects. When present, it sets the actor's arrival direction after the move.
  Valid values are `n`, `ne`, `e`, `se`, `s`, `sw`, `w`, and `nw`. Author it at
  doors, hatches, and road gates so the actor faces into the destination and not
  back into a blocking wall.
- `interact.lock` can gate any interaction behind a deterministic fieldcraft
  panel. The runtime shows the lock through the normal dialogue UI, then resolves
  the selected method from item possession, a field rating, or a primary
  attribute. Opening the lock is deterministic. If the method succeeds and
  `unlocks` is not `false`, the object is marked unlocked and the normal
  interaction runs. A door opens when the lock succeeds and clears its blocking
  cell from pathing. Successful Security picks can still make a separate
  durability roll for the Censure Entry Roll.

```json
{
  "kind": "wall-safe",
  "x": 24,
  "y": 0,
  "blocking": true,
  "name": "Warden's Wall Safe",
  "interact": {
    "type": "container",
    "lock": {
      "id": "warden-wall-safe-lock",
      "title": "Warden's Wall Safe",
      "lines": [
        "The strongbox is set into the old wall. Grit packs the keyhole, but the pins still sit where they should."
      ],
      "methods": [
        {
          "id": "warden-key",
          "label": "Use the warden's key",
          "requiresItem": "warden-safe-key",
          "successLog": "The warden's key turns hard. The safe opens."
        },
        {
          "id": "pick-keyway",
          "label": "Work the keyway",
          "requiresItem": "censure-entry-roll",
          "field": "security",
          "dc": 50,
          "successLog": "You clear the grit and walk the pins open.",
          "failLog": "The pins hold. Another hard try may chew the keyway."
        },
        {
          "id": "pry-hinge",
          "label": "Pry the hinge",
          "primary": "body",
          "dc": 7,
          "failLog": "The hinge holds. The noise travels through the stone.",
          "failure": { "setFlag": "noisy-safe-attempt" }
        }
      ]
    },
    "dialogue": "ash-chapel-warden-safe",
    "loot": [{ "item": "relic-rounds", "count": 2 }]
  }
}
```

Lock rules:

- `methods` must contain one to four entries. The fifth dialogue choice is
  reserved for leaving the lock shut.
- A method with `requiresItem` is shown only when the item is in the pack.
- A method with `field` uses a field rating id from `src/core/Progression.js`
  and a `dc` from 0 to 100. A method with `primary` uses a primary id and a
  `dc` from 0 to 10.
- Security lockpicking methods use `censure-entry-roll`. If a Security method
  omits `requiresItem`, the runtime still treats the Censure Entry Roll as
  required. After a successful Security pick, the current Security rating is
  the percent chance that one roll survives. If the check breaks the tool, one
  `censure-entry-roll` is removed from the pack.
- Set `requiresSecurityTool: false` only when the authored mechanism can be
  worked bare-handed and the route is intentionally a Security rating check
  without the Censure Entry Roll.
- Field and primary checks are deterministic. Current rating greater than or
  equal to `dc` succeeds. Lower rating fails and leaves the lock shut.
- `successLog`, `failLog`, and `unavailableLog` are optional player-facing log
  text. Keep them short and follow the writing rules at the top of this file.
- `success` and `failure` can use the same effect shape as dialogue choices,
  such as `log`, `setFlag`, `inventory`, `questUpdate`, `xp`, or `startCombat`.
- A dialogue `questUpdate` may be one `{ quest, stage, log }` object or an array
  of those objects. Use the array form when one player decision advances a main
  quest and a side quest at the same time.
- Effects may use `setFlag` and `clearFlag` as either one flag id or an array.
  Clearing a flag is intended for reversible choices that have not reached
  their final decision point, such as returning an uninstalled quest part.
- Set `unlocks: false` for an inspection method that gives information without
  opening the object. Set `openOnSuccess: false` when the method should unlock
  the object but require a second click to use it.
- `interact.search` adds an optional Search panel to an interactable object.
  Search is for evidence, hidden loot, track reads, route hints, corpse checks,
  and scene interpretation. It should not gate required quest progress.

```json
{
  "kind": "corpse",
  "x": 15,
  "y": 24,
  "name": "Dead Settlement Guard",
  "interact": {
    "type": "corpse",
    "log": "A settlement guard lies beside the intake barricade.",
    "loot": [{ "item": "ducat", "count": 2 }],
    "search": {
      "title": "Dead Settlement Guard",
      "lines": ["The ash and blood still hold a readable edge."],
      "useLabel": "Inspect the guard",
      "methods": [
        {
          "id": "read-blood-trail",
          "label": "Read the blood trail",
          "dc": 40,
          "successLog": "The blood under his shoulder is dragged backward.",
          "failLog": "The dried blood gives you nothing useful.",
          "success": { "setFlag": "searched-dead-guard" }
        }
      ]
    }
  }
}
```

Search rules:

- `methods` must contain one to three entries. The normal inspect, loot, or use
  choice and the leave choice use the remaining dialogue slots.
- A method defaults to the `search` field rating if it omits `field` and
  `primary`. It may name another field rating with `field`, or one primary
  attribute with `primary`.
- Field checks use `dc` from 0 to 100. Primary checks use `dc` from 0 to 10.
- Checks are deterministic. Current rating greater than or equal to `dc`
  succeeds. Lower rating fails.
- Successful methods are one-shot by default and stay complete while the run
  preserves that level state. Use `repeat: true` only for safe informational
  checks that do not grant repeatable rewards.
- `successLog`, `failLog`, and `unavailableLog` are optional player-facing log
  text. Keep them short and follow the writing rules at the top of this file.
- Runtime Search results prefix successful checks with `SUCCESS:` and failed
  checks with `FAILED:`. Do not include those labels in JSON logs.
- `success` and `failure` use the same effect shape as dialogue choices, such
  as `log`, `setFlag`, `inventory`, `questUpdate`, `xp`, or `startCombat`.
- `useLabel` and `leaveLabel` can override the normal object-use choice and
  close choice. If omitted, the runtime builds a label from the object type.
- Doors use authored objects with `interact.type: "door"` and `blocking: true`.
  When opened, the runtime sets `opened`, starts `openedAt` for the prop
  animation, and removes the cell from the grid blocker set. Grouped door leaves
  share a `doorGroup`; picking either leaf opens every object in that group.
  `chapel-double-door` leaves must define `doorLeaf: "north"` or
  `doorLeaf: "south"` so the two panels swing apart.
- `wallPlane` is for art that mounts flush on a wall (double doors, future barred
  gates), as opposed to `orient` below which rotates free-standing floor props.
  Values are `"se"` and `"sw"`: in this projection a wall runs along exactly one
  of two ground directions and shows exactly one clean slanted face, and the
  plane names which one (`"se"` = the up-right face of a wall running along +y,
  `"sw"` = the up-left face of a wall running along +x). It therefore also fixes
  the run direction, so a wall fixture can never come out as a flat horizontal
  face: match the plane to the wall the doorway is cut into. Use it so a door's
  rails, jambs, and opening frame follow the same plane as the surrounding wall.
  Every `farm-door` belongs on a non-walkable wall cell and must define it.
  Interior exits on the south boundary wall normally use `"sw"`, because that
  wall runs along +x. The player uses the door from the adjacent floor cell.
- Farm building exteriors on Long Ash Road use separate generator tile chars and
  block kinds so each footprint has its own silhouette: `H` maps to
  `farmhouse-building-block`, `B` maps to `barn-building-block`, `T` maps to
  `tool-shed-building-block`, `S` maps to `storage-shed-building-block`, and
  `G` maps to `grain-shed-building-block`. These are wall-grid blocks, not
  authored objects. Keep the footprint source in `scripts/gen-long-ash-road.mjs`.
- Farm building interiors use separate wall-grid block kinds so they do not
  reuse chapel stone: `farmhouse-interior-wall`, `barn-interior-wall`, and
  `shed-interior-wall`.
- `farm-door.variant` selects the wall-mounted door art. Valid values are
  `"farmhouse"`, `"barn"`,
  `"storage-shed"`, `"grain-shed"`, and `"tool-shed"`. Exterior doors usually
  pair `variant` with the plane of their exposed building face. Interior exits
  use the same variant and the plane of their boundary wall.
- `wallSide` (optional, `"near"` default or `"far"`) picks which of the wall's
  two parallel faces the fixture hangs on. `"near"` is the camera-facing front;
  `"far"` is the back face one tile-thickness behind it, which is visible through
  a doorway opening so the door reads as mounted on the far/lobby side of the
  wall. Only meaningful inside an opening (a solid wall hides its far face).
- Free-standing props can define `orient` to rotate the same art to any of the
  four isometric facings: `"se"` (default), `"sw"`, `"nw"`, `"ne"`. This is how
  one texture is reused at different places and orientations (a long table run
  along either diagonal, a counter facing the room or the wall). The facing
  names the screen direction the prop's front points. Only kinds registered with
  the `oriented()` helper in `src/render/spriteCatalog.js` read it (currently
  `dining-table`, `dining-bench`, `kitchen-counter`, `farm-prep-table`,
  `farm-bed`, `grain-bin`, `farm-workbench`, `stable-divider`, and the existing
  oriented field, graveyard, and stair pieces); other kinds ignore it.
  Lighting stays correct at every facing because the renderer colors faces by
  screen position, so a rotated copy is never lit from the wrong side. To make a
  new kind orientation-aware, give its draw function an `opts.orient` and build
  it on the `isoFrame` / `orientedBox` helpers in `PixelPrimitives.js`, then
  register it with `oriented(...)` (see `game_art_skill/SKILL.md`, Section 5).
- Tall cover props use catalog canopy metadata instead of extra collision cells.
  For example, `ash-tree` is a single `blocking: true` object at the trunk tile.
  Its drawn canopy spreads over nearby floor cells, and the renderer fades that
  tree when the player is inside its cataloged canopy radius. `wheat-clump` uses
  the same fade path as walkable waist-high field cover, but it does not set
  `blocking`. Do not block every canopy-covered or wheat-covered cell unless
  the trunk, stump, fence, wall, or another grounded object should actually stop
  movement.
- `hiddenRegions` is a top-level array for rooms or cells that should stay
  unseen until a grouped door opens. Each entry needs an `id`, a `doorGroup`, and
  a rectangular grid area via `x`, `y`, `width`, and `height`. While hidden, the
  runtime skips that region's floor bake, flat decals, props, actors, ground
  items, hover targets, movement previews, ambient speech, and combat triggers.
  The area becomes visible when any door object in the matching `doorGroup` is
  opened.

```json
{
  "hiddenRegions": [
    {
      "id": "east-watch-room",
      "doorGroup": "east-watch-double-door",
      "x": 32,
      "y": 9,
      "width": 6,
      "height": 7
    }
  ]
}
```
- The journal map is generated from the live level grid, blocking objects,
  current player position, explored cells, dialogue sources, quest updates, and
  combat triggers. It does not use a separate minimap image or a per-level map
  reference. Unexplored cells are black on the journal map. Hidden regions stay
  black until their linked door group opens. For a wall fixture, set
  `interactionMarker` to the reachable floor cell in front of it so the
  automatic exit marker does not sit inside the wall.
- Objects, enemy spawns, NPC spawns, and combat triggers can define
  `mapMarker` to control the automatic journal map marker. Use `false` to hide
  an automatic marker. Use an object to override marker text or type:

```json
{
  "mapMarker": {
    "label": "Warden's Safe",
    "kind": "locked",
    "reveal": "explored"
  }
}
```

  Valid `kind` values are `quest`, `dialogue`, `exit`, `locked`, `search`,
  `danger`, and `note`. Valid `reveal` values are `explored` and `always`.
  A marker can also define `conditions` using the same flags, quest stages,
  inventory, scars, field ratings, and Trace gates as dialogue. The marker is
  omitted while those conditions are unmet. Use this for temporary objective
  marks that should appear only during a specific story state.
  A marker inside an active `hiddenRegions` rectangle stays hidden even if
  `reveal` is `always`.
- `quests` lists runtime quest ids loaded from `data/quests/`.
- `dialogue` lists runtime dialogue ids loaded from `data/dialogue/`.
- Enemy spawns can define `encounter` to group nearby enemies into one combat
  pull. If omitted, the spawn gets its own encounter.
- Enemy and NPC spawns can define `appearance` to override the actor or enemy
  file body, outfit, gear, or accent for that placed character. Use this to vary
  repeated human cultists, guards, refugees, or townspeople without duplicating
  their combat stats or dialogue data. `spriteId` still exists for fixed atlas
  entries such as Host creatures and special hand-authored sprites.
- NPC spawns live under `spawns.npcs` and reference actor ids from
  `data/actors/`. They render, block movement, speak ambient lines, and can be
  given dialogue, but they do not enter combat targeting or victory checks.
  Spawn `conditions` can use dialogue conditions such as `flag` or
  `flagsAbsent` to show NPCs or enemies only after a run-state change. Enemy
  conditions are applied before combat and victory checks.
- Enemy spawns can define `ambient` as short overheard lines. These draw as
  subtitles above the NPC during exploration when the player is nearby.
- Enemy files or spawns can define `aggro` as short alert barks. When that enemy
  starts combat or raises an alarm, the runtime shows one bark above the actor.
  A spawn `aggro` list overrides the enemy file list.
- Enemy spawns can define `facing`, `perception`, and `patrol` for exploration
  awareness. Facing uses the eight actor facings: `e`, `se`, `s`, `sw`, `w`,
  `nw`, `n`, and `ne`. `perception.visionRadius` is measured in tiles,
  `perception.coneDegrees` sets the forward vision cone, and sight uses the same
  blocking rules as movement, so walls, closed doors, and blocking props stop
  vision and cut the red cone overlay. The player presses `C` to crouch into
  sneak mode. Red vision cones are shown only while crouched. Click and keyboard
  movement use the crouched sneak animation while sneak mode is active. Holding
  `Shift` during any active move step makes that step sprint until Shift is
  released, including click-to-move paths already in progress. Movement does not
  roll unless the player is inside an enemy's visible cone. When a roll is
  needed, the player's Stealth field checks against a DC derived from the action
  severity and the observer's Search rating. Sneaking is low suspicion, walking
  is medium suspicion, and sprinting is high suspicion. Loud actions such as
  gunfire can still use hearing. Optional `perception.ratingBonus`,
  `perception.dcBonus`, and `perception.hearingRadius` tune special guards
  without changing the engine. A level can set defaults with `enemyVisionRadius`,
  `enemyVisionCone`, and `enemyHearingRadius`.

```json
{
  "id": "choir-throat-singer",
  "x": 4,
  "y": 14,
  "facing": "ne",
  "encounter": "west-camp",
  "perception": {
    "visionRadius": 8,
    "coneDegrees": 115,
    "ratingBonus": 8
  },
  "aggro": [
    "There. Breath in the aisle.",
    "Close the road door."
  ],
  "patrol": {
    "mode": "loop",
    "delay": [1.0, 2.1],
    "path": [
      { "x": 4, "y": 14 },
      {
        "x": 5,
        "y": 13,
        "activity": {
          "target": "west-camp-repair-rack",
          "duration": 2.8,
          "motion": "kneel",
          "response": "tools",
          "sound": "tool-tap"
        }
      },
      { "x": 6, "y": 12 },
      { "x": 5, "y": 13 }
    ]
  }
}
```

- Enemy and NPC spawns can define `patrol`. A bare array is treated as
  `patrol.path`. A missing patrol, empty path, or one-point path means the actor
  stands still. `patrol.path` needs at least two walkable route points. `mode`
  can be `loop`, `pingpong`, or `once`. `delay` controls the random pause at each
  route point before the actor walks toward the next point. Patrol dwell is
  clamped to a minimum of 2.4 seconds so guards do not pace back and forth too
  quickly. Use a number for a small random range around that average, `[min,
  max]` for an explicit range, or `{ "min": 2.4, "max": 4.0 }`. `startDelay`
  sets the initial wait and can be zero. `onComplete` uses the normal dialogue
  effect shape when a `once` patrol reaches its final route point.
  `removeOnComplete: true` removes the actor from the current level after those
  effects fire, useful for someone exiting through a stair or door. Actors walk
  tile by tile toward the next route point without waiting between every tile.
  Investigation uses the same movement pathing toward the last suspicious tile,
  then the enemy resumes the authored patrol.
- A route point can define `activity` with a stable object id in `target` and a
  `duration` from 0.8 to 12 seconds. The route point must be a walkable cell
  directly adjacent to that object. On arrival the actor faces the target and
  performs the authored motion before continuing the route. Valid `motion`
  values are `reach`, `pump`, `mark`, `lift`, and `kneel`. Valid prop `response`
  values are `none`, `paper`, `water`, `tools`, `hoist`, `scale`, `load`,
  `cloth`, and `flame`. The optional `sound` must use a cue declared by the
  level soundscape. The renderer keeps the unchanged base prop cached and draws
  its short response as a live hard-pixel layer. A target hidden by current run
  flags is skipped for that circuit.
- A level can define recurring `tableaux` for work that needs several NPCs to
  gather and act together. Each tableau has a stable `id`, `center`,
  `activationRadius`, `startDelay`, deterministic `cooldown`, two or more
  `participants`, and optional timed `barks`. Every participant references an
  NPC `actor`, a clear reserved `slot`, an optional stagger `delay`, and the
  same `activity` shape used by patrols. Slots must be adjacent to their target
  objects. The runtime pauses those actors' patrols, reserves all work cells,
  gathers the group, performs each motion, returns everyone to their previous
  cell and facing, then releases the reservations. Combat, a blocking screen,
  or an unavailable participant cancels the scene safely.
- A level `soundscape` can provide `maxDistance`, `maxOneShots`, an
  `activityCues` allowlist, and `ambientBeds`. Each bed has a stable `id`, a
  generic procedural `profile`, rectangular tile `bounds`, and a `gain` from 0
  to 1. Current profiles are `receiving-canvas`, `waterworks`, `freight-yard`,
  and `rope-rows`. Audio stays local and dependency-free. The runtime applies
  distance attenuation, stereo placement, source cooldowns, bounded polyphony,
  and lower gain while a blocking screen is open.
- Enemy spawns can define `dialogue` to make a living enemy talkable in explore
  mode. The id must also appear in the level `dialogue` list so the loader brings
  the scene in. Optional `talkRadius` controls manual E/Enter reach, and optional
  `dialogueTriggerRadius` opens the dialogue automatically when the player steps
  close enough. Use `aggroRadius: 0` when dialogue should happen before combat.
- Enemy spawns can set `dormantUntilCombat: true` for an authored reveal. A
  dormant enemy is excluded from rendering, collision, patrols, perception,
  ambient speech, and player targeting. Starting its named encounter activates
  every living dormant enemy assigned to that encounter. Use this for actors
  that replace a prop or enter from concealed positions, not as general stealth.
- A level can define `combatStartBarks` as a compact array of spoken lines for
  combat entry. When combat begins and no enemy has already barked an alarm, the
  runtime picks one living enemy from that encounter and one line from the
  collection. A `combatTrigger` can define its own `combatStartBarks` to override
  the level collection for that encounter. Keep collections small and voice-safe:
  the validator caps each collection at 12 lines.
- `combatTriggers` defines authored encounter zones and intro text. Each trigger
  should name an `encounter`, use grid coordinates, set a `radius`, and include
  short `intro` lines. Stealth now owns normal enemy aggro, so these zones do not
  force combat by default. Set `forceCombat: true` only for a scripted fight that
  must start even when the player is outside all enemy cones.
- A combat trigger can define `dialogue`. The dialogue id must also appear in the
  level `dialogue` list. Entering the trigger radius opens that scene once while
  the encounter still has living enemies, including dormant ones. The dialogue
  decides when combat begins through its effects.
- `combatIntro` is a fallback list of log lines shown when an encounter has no
  trigger-specific intro.
- `onVictory` uses the same effect shape as dialogue choices. At minimum this
  slice keeps `onVictory.questUpdate` to advance the active quest after all
  enemies in the level are defeated. It can also set story flags such as
  `setFlag` for later dialogue gates.
- Dialogue choice effects can use `loadLevel` to move to another level while
  preserving the run state:

```json
{
  "effects": {
    "loadLevel": {
      "path": "./data/levels/ash_chapel_cellar.json",
      "player": { "x": 12, "y": 13 }
    }
  }
}
```

- Dialogue choice effects can use `startCombat` to begin a named encounter from
  dialogue:

```json
{
  "effects": {
    "log": "The entrance Choir spread apart and come at you.",
    "startCombat": "entrance-catechism"
  }
}
```

`startCombat` also accepts an object when the scene grants an authored opening
attack. `target` resolves an enemy spawn id first, while `attackId` names one of
the player's currently equipped attacks. `guaranteedHit` skips the hit roll and
`spendAp: false` preserves the player's opening turn. Range, line of fire, and
weapon readiness still apply. A successful attack deals the weapon's normal
damage and applies normal condition wear. `failureLog` is shown if the attack
cannot be made, then combat begins normally.

```json
{
  "effects": {
    "startCombat": {
      "encounter": "long-ash-stage-iv-cart-ambush",
      "openingAttack": {
        "target": "long-ash-stage-iv-lure",
        "attackId": "sidearm",
        "guaranteedHit": true,
        "spendAp": false,
        "failureLog": "The sidearm is not ready."
      }
    }
  }
}
```

- Dialogue choice effects can use `openDoorGroup` to open every object in an
  authored door group. Passability and hidden regions refresh before combat if
  the same effect also defines `startCombat`:

```json
{
  "effects": {
    "openDoorGroup": "sava-listening-niche",
    "startCombat": "sava-listening-niche"
  }
}
```

- Dialogue choice effects can use `showBriefing` to open a full-screen black
  briefing or interlude card using the same renderer as the opening writ.
  `pages` are always shown. `conditionalPages` add pages only when their
  dialogue conditions pass:

```json
{
  "effects": {
    "showBriefing": {
      "title": "ACT I: THE HALLOWFEN",
      "pages": [["The bell answers above the ceiling."]],
      "conditionalPages": [
        {
          "conditions": { "flag": "survivors-returning-chapel" },
          "page": ["Susanna starts counting people by name instead of by hiding place."]
        }
      ],
      "lastPrompt": "ENTER: CONTINUE",
      "skipPrompt": "ESC: CLOSE"
    }
  }
}
```

- Dialogue choice effects can use `clock` to move the run clock for optional
  waits or interludes. `minuteOfDay` sets an exact time from 0 to 1439.
  `advanceToMinuteOfDay` waits forward to that time and advances the field day
  if the time has already passed. `nextDay: true` advances the field day before
  applying the minute. `showBriefing.afterBriefing.clock` uses the same shape
  when an interlude should return the player later:

```json
{
  "effects": {
    "clock": { "advanceToMinuteOfDay": 1380 },
    "showBriefing": {
      "title": "AFTER LAST BELL",
      "pages": [["The camp settles into night watch."]],
      "afterBriefing": {
        "clock": { "nextDay": true, "minuteOfDay": 480 }
      }
    }
  }
}
```

- Dialogue choice effects can add or remove quest items from the pack:

```json
{
  "effects": {
    "inventory": {
      "add": [{ "item": "mirels-lucky-necklace", "count": 1 }],
      "remove": [{ "item": "blue-ball", "count": 1 }]
    }
  }
}
```

  Item additions are capacity-checked as one bundle before logs, flags, quest
  updates, removals, or additions apply. Planned removals count toward the
  available capacity. If the complete bundle does not fit, the current choice
  remains open and no part of its effect is applied.

- Dialogue choice effects can grant explicit XP:

```json
{
  "effects": {
    "xp": 50
  }
}
```

- Dialogue choice effects can use `moveActor` to send the current dialogue
  speaker or a named actor along a one-shot route. `target: "speaker"` is the
  default. The route is authored as grid points after the actor's current
  position. Optional `onComplete` fires normal effects when the actor reaches the
  last point. Use `removeOnComplete: true` when the actor should leave the
  current level after arriving:

```json
{
  "effects": {
    "moveActor": {
      "target": "speaker",
      "path": [{ "x": 30, "y": 3 }],
      "removeOnComplete": true,
      "onComplete": {
        "setFlag": "runner-at-stair",
        "log": "The runner reaches the stair."
      }
    }
  }
}
```

- Dialogue choice effects can use `actorSpeech` for a one-shot sequence of
  overhead lines after the dialogue closes. `target: "speaker"` is the default;
  `player`, an actor id, a spawn id, or an actor name can select someone else.
  `initialDelay` waits before the first line. `interval` is the silent gap after
  each line expires, and `ttl` controls how long each line stays visible. All
  three values are measured in seconds. Delays default to zero, while `ttl`
  defaults to the normal ambient speech lifetime:

```json
{
  "effects": {
    "actorSpeech": {
      "target": "speaker",
      "lines": [
        "There. The writ was under my blanket.",
        "The ducats were in my left boot."
      ],
      "initialDelay": 0.35,
      "interval": 0.4,
      "ttl": 2.4
    }
  }
}
```

  The sequence advances only during exploration, with no UI open, while the
  actor is revealed and within ten tiles of the player. Its timers pause when
  those conditions fail. Scripted lines keep their authored order and take
  priority over ordinary ambient speech until the sequence finishes. Applying
  another `actorSpeech` effect to the same actor replaces the pending sequence.

- The validator (`npm run check`) requires: valid tile grids, in-bounds player
  starts, main chapel encounter groups with spread trigger zones, required
  slice enemy ids, required interactables, a Cult Ledger note, a separate cellar
  secret exit, a Dead Road Warden corpse with loot, enough chapel props/decals,
  and richer secret-area loot. It also checks that every object `kind` and every
  non-walkable legend block is registered in the sprite catalog, so a typo'd or
  unrenderable kind fails the build instead of silently drawing nothing.

## Item data

Items live in `data/items/`, one file per id.

```json
{
  "id": "field-dressing",
  "name": "Field Dressing",
  "type": "consumable",
  "rarity": "common",
  "weight": 0.2,
  "groundModel": "dressing",
  "description": "Restores 4 HP. Consumed on use.",
  "use": { "effect": "heal", "amount": 4 }
}
```

Rules:

- `id`, `name`, `type`, and `rarity` are required.
- `rarity` controls loot color grades in inventory, loot, and trade screens.
  Current grades are `common`, `uncommon`, `rare`, `epic`, and `legendary`.
- Optional `build` marks the character build an item is tuned for. It must match
  a build profile id from `src/core/Progression.js`, such as `road-ghost`.
- `weight` is required and uses kilograms. It must be zero or greater.
- `groundModel` is required so the item has drop and pickup art. Current models
  are `ball`, `boots`, `coat`, `hood`, `vest`, `ring`, `necklace`, `key`,
  `token`, `chit`, `paper`, `vial`, `dressing`, `rounds`, `shard`, `food`, and
  `ribguard`. Weapon models are `sidearm`, `accelerator-sidearm`, `smg`,
  `carbine`, `rifle`, `shotgun`, `support-gun`, `precision-rifle`,
  `accelerator-rifle`, `rail-rifle`, `knife`, `sword`, `axe`, `blunt`, `pike`,
  and `tool-weapon`.
- Equippable items define `equipment.slot`. Valid item slots are `clothes`,
  `armor`, `boots`, `helmet`, `weapon`, `trinket`, and `ring`. Legacy weapon
  slots `sidearm` and `melee` still load, but new content must use `weapon`.
- Ring items can be worn in either actor slot, `ring1` or `ring2`.
- Weapon items use `type: "weapon"`, `equipment.slot` set to `weapon`, a
  `weapon.weaponClass`, one or more `weapon.attacks`, and a `condition` block.
  Catalog entries also define `catalogGroup`, `subtype`, and `provenance`.
  Example:

```json
{
  "id": "censure-sidearm",
  "name": "Censure Sidearm",
  "type": "weapon",
  "rarity": "common",
  "weight": 1.1,
  "groundModel": "sidearm",
  "equipment": { "slot": "weapon" },
  "catalogGroup": "ballistic-pistol",
  "subtype": "autoloading pistol",
  "provenance": {
    "era": "Remnant issue",
    "origin": "Ashen Censure",
    "factions": ["ashen-censure"]
  },
  "weapon": {
    "weaponClass": "ballistic-pistol",
    "roles": ["ranged", "firearm", "sidearm"],
    "handedness": "one",
    "attacks": [
      {
        "id": "single-shot",
        "name": "Single Shot",
        "mode": "ranged",
        "apCost": 3,
        "damage": 4,
        "range": 4,
        "accuracyBonus": 0,
        "ammoCost": 1,
        "conditionWear": 1
      }
    ],
    "magazine": {
      "ammoFamily": "sidearm-cartridge",
      "capacity": 7,
      "defaultLoaded": 7,
      "reloadAp": 2
    }
  },
  "condition": { "max": 100, "default": 92 },
  "description": "A short player-facing item description."
}
```

- `weapon.attacks[].mode` is optional and accepts `melee` or `ranged`. Explicit
  mode is authoritative for hit chance, damage scaling, line of fire, cover,
  context actions, and AI attack selection. This permits reach weapons such as
  the Processional Pike to use `mode: "melee"` with `range: 2` without gaining
  firearm behavior. Older attacks without a mode retain the legacy rule:
  range 1 is melee and range greater than 1 is ranged.
- `weapon.roles` supplies stable semantic categories for techniques and input.
  Runtime attack ids are instance-specific, so content must not depend on an
  equipped attack retaining its local data id.
- `weapon.magazine` is required for ranged catalog weapons. `ammoFamily` must
  match exactly one item with `type: "ammo"` and `ammo.family`. `capacity`,
  `defaultLoaded`, and `reloadAp` are non-negative integers, with positive
  capacity and reload AP.
- Optional attack fields are `accuracyBonus`, `ammoCost`, `conditionWear`, and
  `requiresStationary`. Modes stay within these bounded rules rather than
  embedding effects or executable behavior.
- The full roster, balance bands, ammunition families, Act I distribution, and
  accelerator canon are documented in `docs/systems/weapons.md`.

- Condition-bearing weapons are individual pack entries, not stacks. A weapon can
  repair another weapon with the same `weapon.weaponClass`. An exact item id
  match repairs more condition. Repair uses the player's `engineering` field
  rating.
- `type: "currency"` items such as `ducat` are ordinary stackable inventory
  items with `weight: 0`. Traders should price goods in ducats.
- Loot in level objects, corpse objects, enemy files, and enemy spawns
  references items by `id`.
- Optional level `groundItems` entries can place an item directly on a walkable
  tile: `{ "id": "cellar-loose-dressing", "item": "field-dressing", "count": 1, "x": 10, "y": 8 }`.
  Give every authored pickup a stable map-scoped `id`; index-derived runtime
  fallbacks are for compatibility, not durable content authoring. Keep the cell
  clear of objects, actor spawns, and transitions, and make it reachable from
  the player start.
- Every current playable level keeps at least one reachable loose pickup and one
  loot-bearing container. `tests/allMapsRpgDetail.test.mjs` audits that contract
  across the complete `data/levels/` set, including item references, counts,
  collisions, reachability, and stable pickup ids.
- Outdoor RPG dressing uses authored clusters instead of uniform noise. The
  three current outdoor levels each include `dead-grass-tuft`,
  `field-backpack`, and `small-pouch` objects. Portable loot containers use a
  normal `interact.type: "container"` payload and rely on the sprite catalog for
  their opened state.

## Actor data

Current actor files live in `data/actors/`.

Minimal actor shape:

```json
{
  "id": "player",
  "name": "Free Cities Scout",
  "type": "player",
  "appearance": {
    "genderModel": "female",
    "bodyType": "medium",
    "stature": "average",
    "posture": "upright",
    "skinTone": "tan",
    "age": "adult",
    "faceShape": "oval",
    "faceMark": "none",
    "hairColor": "brown",
    "hairStyle": "cropped",
    "facialHair": "none",
    "breastSize": 5,
    "penisSize": 0
  },
  "stats": {
    "hp": 24,
    "maxHp": 24,
    "actionPoints": 6
  },
  "progression": {
    "level": 1,
    "xp": 0,
    "build": "field-agent",
    "primaryPoints": 0,
    "activeTechniquePoints": 0,
    "passiveTechniquePoints": 0,
    "techniques": [],
    "primaries": {
      "body": 3,
      "agility": 3,
      "eye": 3,
      "intelligence": 3,
      "religion": 3,
      "voice": 3,
      "nerve": 3
    },
    "trace": 0,
    "iconRisk": "not-assessed",
    "scarPoints": 0,
    "scars": [
      {
        "id": "failed-quarantine",
        "name": "Failed Quarantine",
        "rank": 1,
        "modifiers": { "containment": 5 }
      }
    ]
  },
  "inventory": {
    "maxCarryWeight": 10,
    "items": [
      { "item": "field-dressing", "count": 1 }
    ],
    "equipment": {
      "clothes": "censure-field-coat",
      "ring1": "iron-vow-ring"
    }
  }
}
```

Rules:

- `id` is stable.
- `name` is display text.
- `type` tells systems how to treat the actor.
- `spriteId` is optional. When present, it must match a key in
  `src/render/SpriteAtlas.js`. When omitted, the actor id is used as the sprite
  key.
- Player `appearance` is optional sprite-baking metadata. Character creation
  writes `genderModel`, `bodyType`, `stature`, `posture`, `skinTone`, `age`,
  `faceShape`, `faceMark`, `hairColor`, `hairStyle`, `facialHair`, and `anatomy`,
  plus `breastSize` and `penisSize` as 0 to 10 values. `genderModel` is visual
  model selection, not a pronoun field. It changes the baked frame (shoulders,
  waist, hip flare) and resets `anatomy` and the size sliders to that model's
  defaults. The player can then set `anatomy` to any of `vulva`, `penis`,
  `intersex`, or `smooth` regardless of model. Legacy `bodyFrame` values still
  load for old data. Anatomy detail renders only when the player has no clothes
  equipped. Bust scale still changes the clothed silhouette. Hair, facial hair,
  face marks, stature, and posture remain readable through the field kit. New
  player data should use the explicit customization fields.
- Current player option ids are: `skinny`, `medium`, `stocky`, `fat`, and `buff`
  for `bodyType`; `short`, `average`, and `tall` for `stature`; `upright`,
  `guarded`, and `stooped` for `posture`; `fresh`, `adult`, `weathered`, and
  `elder` for `age`; `narrow`, `oval`, `broad`, and `long` for `faceShape`; and
  `none`, `split-brow`, `cheek-scar`, `burn-scar`, and `eye-patch` for
  `faceMark`. Hair and skin option ids are exported by `src/render/SpriteAtlas.js`
  and validated by `npm run check` so actor data cannot silently request a
  missing visual.
- Human NPCs and human enemies can also use composable appearance fields:
  `body`, `outfit`, `gear`, and `accent`. These bake a unique sprite at level
  load. Example: `{ "body": "broad", "outfit": "settlement-work-coat", "gear":
  ["shoulder-plate", "rope-coil"], "accent": "bare-brown" }`.
- `body` controls proportions, `outfit` controls the base clothing silhouette,
  `gear` adds visible tools or carried items, and `accent` controls hair, hood,
  or cowl treatment. Keep gear arrays short enough to read at map scale.
- `progression` is optional. Player and companion actors can define the current
  character sheet here.
- `progression.level` is an integer 1 or greater unless progression
  configuration defines a cap. `progression.xp` is cumulative.
- `progression.build` must match a build profile id from
  `src/core/Progression.js`. If omitted, runtime actors get a small default
  build based on actor type and tags.
- `progression.primaryPoints` stores unspent level-up Primary Points. The level
  1 primary assignment screen writes starting primaries from a 3/10 baseline
  with 14 assignment points and a 7/10 starting cap. It does not consume
  `primaryPoints`.
- `progression.activeTechniquePoints` and `progression.passiveTechniquePoints`
  store unspent technique points.
- `progression.techniques` stores learned technique ids from `data/techniques/`.
- `progression.primaries` uses all seven primary ids from
  `src/core/Progression.js`, each rated from 0 to 10.
- `progression.primaryBonuses` can store spent Primary Point bonuses later. Do
  not edit field ratings directly.
- `progression.scars[].modifiers` keys must match field rating ids from
  `src/core/Progression.js`. Values add to the derived 0 to 100 field rating.
- `progression.trace` must match a defined Trace stage. `iconRisk` can stay
  `not-assessed` until the story has earned a stronger reveal.
- `inventory` is optional. Player actors can define a starting pack with
  `maxCarryWeight`, item stacks, and equipped item ids.
- `trade` is optional. `trade.currency` names the payment item and `trade.stock`
  contains `{ "item", "count", "price" }` entries offered to the player.
  Optional `trade.buys` entries contain `{ "item", "price" }` offers for items
  the player may sell. Add `"keep": 1` when the trader should accept only
  spare copies. Items absent from `trade.buys` cannot be sold to that trader,
  and equipped copies are always protected.
- Actor equipment slots are `clothes`, `armor`, `boots`, `helmet`, `weapon1`,
  `weapon2`, `trinket`, `ring1`, and `ring2`. Legacy `sidearm` and `melee`
  loadouts migrate into the two ready slots.
- Avoid putting long dialogue or lore paragraphs inside actor stat files. Use dialogue/lore files later.
- Character customization opens after the opening briefing. The level 1 primary
  assignment gate opens after the chapel bell and Act I briefing.

## Technique data

Runtime techniques live in `data/techniques/`, one file per technique plus
`data/techniques/index.json` for the load manifest.

Minimal technique shape:

```json
{
  "id": "aimed-shot",
  "name": "Aimed Shot",
  "type": "active",
  "targets": ["enemy"],
  "requirements": {
    "fieldRatings": {
      "firearms": 45
    }
  },
  "summary": "Spend extra care on one firearm attack. Accuracy matters more than speed."
}
```

Rules:

- `id`, `name`, `type`, `requirements`, and `summary` are required.
- `type` must be `active` or `passive`.
- `targets` can include `enemy`, `self`, `tile`, and `object`.
- `requirements.primaries` maps primary ids to minimum 1 to 10 values.
- `requirements.fieldRatings` maps field ids to required 0 to 100 ratings. All
  listed fields must pass.
- `requirements.anyFieldRatings` maps field ids to required 0 to 100 ratings.
  At least one listed field must pass.
- `requirements.items` references item ids from `data/items/`.
- `requirements.equipmentSlots` references actor equipment slots.
- `requirements.scars` references scar ids or scar tags.
- Active techniques appear in the right-click contextual combat menu only when
  learned and relevant to the clicked target. Unknown techniques are hidden.
- Passive techniques are learned from the journal and apply later as modifiers
  or conditional effects.
- Builds do not grant or lock techniques. Requirements do.

Current runtime technique effects:

- `aimed-shot` is an enemy-targeted firearm attack with extra AP, improved hit
  chance, and higher base damage.
- `study-target` is an enemy-targeted mark that applies the `studied` status.
- `field-measure` prepares the player and improves the next attack.
- `overwatch` targets an enemy or tile and stores a one-round reaction shot.
- `trip-mine` targets a nearby free tile and creates an encounter-only hazard.
- `burn-line` targets a nearby free tile or occupied enemy cell and creates
  encounter-only burning ground along a short lane.
- `shove` pushes or staggers an adjacent enemy and applies `off-balance`.
- `guard-break` is a close attack that applies `guard-broken` on hit.
- `stabilize` removes immediate bad statuses and heals the player.
- `field-stimulant` grants immediate AP once per encounter and applies
  locked stimulant `fatigued`.
- `name-the-error` rattles a human-like enemy and drains AP.
- `stilling-litany` suppresses a Host enemy and drains AP.
- `rally` clears morale pressure, refunds 1 AP, and applies `rallied`.
- `feint` applies `off-balance` to an adjacent human-like enemy.
- `wire-snare` snares a target, drains AP, and leaves it off balance.
- `censure-spark` applies direct flame and `burning`, with longer burn duration
  against Host enemies.
- `fade-back` moves the player up to 2 tiles and applies `faded`.
- `seal-tile` targets a nearby free tile or occupied enemy cell and places a
  containment hazard that applies `sealed` and drains AP.
- `quarantine-line` targets a nearby free tile or occupied enemy cell and places
  a short containment lane that applies `suppressed` and drains AP.
- `case-file` improves `study-target` and refunds part of its AP cost.
- `steady-hands` reduces the practical hit chance loss from wounds.
- `hard-seal` extends player-created burn lines.
- `riposte` grants one free close counterattack per round after an adjacent
  enemy misses.
- `surgeons-nerve` improves `stabilize` and adds `braced`.
- `low-step` discounts the first combat move each round and ignores non-mine
  floor hazards.
- `ambush-mark` applies `studied` after a successful sneak opening.

Statuses and combat hazards are source-defined systems today, not JSON content.
Do not add `data/status-effects/` until multiple content files need to author or
tune statuses directly.

## Enemy data

Current enemy files live in `data/enemies/`.

Minimal enemy shape:

```json
{
  "id": "host-penitent-bastion",
  "name": "Penitent Bastion",
  "type": "enemy",
  "faction": "the-host",
  "stats": {
    "hp": 18,
    "maxHp": 18,
    "actionPoints": 4
  },
  "progression": {
    "level": 1,
    "build": "host-threat",
    "complexity": "hardened",
    "xpReward": 40
  },
  "tags": ["host", "vale-imprint", "tank"]
}
```

Rules:

- Enemies should express gameplay role through tags and stats.
- `spriteId` is optional. When present, it must match a key in
  `src/render/SpriteAtlas.js`. Use it for Host creatures and fixed special
  sprites.
- Human enemies can define `appearance` with the same `body`, `outfit`, `gear`,
  and `accent` fields as actors. Repeated enemy placements can override
  `appearance` in level `spawns.enemies[]` when one archetype needs several
  human models.
- Human enemies may define `weapons` as item references. Each entry has
  `{ "item": "weapon-id", "loaded": 5, "reserve": 10 }`. `loaded` and
  `reserve` are optional zero or greater integers. The catalog weapon supplies
  attacks, magazine capacity, and reload AP. Host body attacks should remain in
  `attacks` and must not be disguised as equipment.
- A repeated enemy placement can override `spriteId` in `spawns.enemies[]` to
  select authored visual variants while retaining one shared stat and attack
  record.
- `progression` is optional for enemies. If present, it can be compact:
  `level`, `build`, `complexity`, and optional `xpReward` are enough. If
  omitted, the loader supplies a level-one build from existing tags and combat
  XP derives complexity from tags such as `minion`, `rat`, `tank`, `elite`, and
  `boss`.
- Enemy complexity ids are defined in `src/core/Progression.js`: `minion`,
  `standard`, `hardened`, `elite`, and `boss`.
- `xpReward` overrides the default encounter XP reward for that enemy.
- `loot` is optional on an enemy file. A spawn in `spawns.enemies[]` can also
  define `loot` to override the file default for that placed enemy. Dead enemies
  can be looted once, then their corpse remains inspectable if it has `inspect`.
- Lore-heavy descriptions can be added as `description`, but keep them concise.
- Host enemies must follow the Vale Imprint rules in `docs/LORE_INTEGRATION.md`.

## Dialogue data

Runtime dialogue lives in `data/dialogue/`, one file per scene or readout.

Author dialogue first as scene packets in `docs/story/story-dialogue-workflow.md`.
Move dialogue to `data/dialogue/` only when one scene needs to run in-game.
Do not hardcode conversations into JavaScript. Current shape:

```json
{
  "id": "ash-chapel-barrel-ladder",
  "title": "Split Barrel",
  "nodes": {
    "start": {
      "lines": ["The barrel is nailed to the floor."],
      "choices": [
        {
          "label": "Descend",
          "effects": {
            "log": "You descend through the barrel into the cellar.",
            "loadLevel": {
              "path": "./data/levels/ash_chapel_cellar.json",
              "player": { "x": 12, "y": 13 }
            },
            "questUpdate": { "quest": "investigate-ash-chapel-cult", "stage": "cellar-found" }
          },
          "close": true
        }
      ]
    }
  }
}
```

Rules:

- `id`, `title`, `nodes`, and `nodes.start` are required.
- Each node needs a non-empty `lines` array.
- A node may have one to five choices. Number keys `1` through `5` choose them.
- A choice may set `tone` to `normal`, `quiet`, `commit`, or `danger` for its
  response color. Use this only when the consequence is clearer to the author
  than to the renderer. Combat starts infer `danger`, completed quest decisions
  infer `commit`, and effect-free exits infer `quiet` when `tone` is omitted.
- Choice `effects` can log text, teleport the player within a level, load
  another level, update a quest, and add or remove inventory items.
- Node and choice `conditions` can gate content with `flag`, `flags`,
  `notFlag`, `flagsAbsent`, `flagsAtLeast`, `questStages`, `scar`, `scars`, `notScar`,
  `scarsAbsent`, `scarRanks`, `fieldRatings`, `items`, `itemsMax`,
  `playerWounded`, `traceMin`, and `traceMax`. Set `playerWounded` to `true` to
  show a choice only while the player is below maximum HP, or `false` to require
  full HP. `fieldRatings` maps field rating ids to minimum
  0 to 100 values. `scarRanks` maps scar ids to minimum ranks. `items` maps
  item ids to required minimum counts, while `itemsMax` maps item ids to maximum
  counts. `flagsAtLeast` has the shape `{ "count": 2, "of": ["clue-a",
  "clue-b", "clue-c"] }` and passes when the player has any listed threshold
  of those flags. Use it for evidence sets where the order of discovery should
  not matter.
- Inventory effects can set `requireAll: true` when every listed `remove` entry
  must be present before any other effect on that choice is applied. Use this
  for payments so a failed removal does not still set flags or advance quests.
- Dialogue effects can restore a positive fixed amount of HP or fill the target
  to maximum HP. A healing effect is checked before inventory payment, so an
  invalid treatment cannot consume its fee:

```json
{
  "conditions": { "playerWounded": true },
  "effects": {
    "inventory": {
      "requireAll": true,
      "remove": [{ "item": "ducat", "count": 1 }]
    },
    "heal": { "target": "player", "amount": "full" }
  }
}
```

## Quest data

Runtime quests live in `data/quests/`, one file per quest.

Current shape:

```json
{
  "id": "investigate-ash-chapel-cult",
  "title": "Investigate the Ash Chapel Cult",
  "initialStage": "active",
  "stages": [
    {
      "id": "active",
      "task": "Search the quarantine chapel.",
      "xp": 0,
      "description": "Search the quarantine chapel."
    }
  ]
}
```

Rules:

- `id`, `title`, `initialStage`, and `stages` are required.
- Optional `unlockedBy` uses dialogue-condition fields such as `flag`,
  `flagsAtLeast`, or `questStages`. The quest still tracks state while hidden,
  but it does not appear in the journal until the condition passes.
- Every stage needs `id` and `description`. `task` is optional display text for
  the journal.
- Stage `xp` is optional and awards that much XP the first time the stage is
  reached by a quest update. Initial stages should normally omit `xp` or use
  `0`, because loading a quest is not task completion.
- The current quest runtime tracks one active stage per quest.
- Keep quest consequences simple until a second quest needs reputation,
  companion, or world-state changes.

## Companion data

Persistent companion definitions live in `data/companions/`. The index file
lists every definition loaded by the runtime:

```json
{
  "ids": ["utility-drone-mark-i"]
}
```

A companion definition uses normal actor fields for `id`, `name`, `type`,
`spriteId`, `team`, `control`, `stats`, `tags`, and `attacks`. It also declares
`communication`, `serviceItem`, `upgradeEconomy`, and `branches`.

`communication.mode` declares whether the actor is nonverbal or can speak.
`communication.signals` maps stable event ids to short player-facing sounds.
The Utility Drone Mark I is nonverbal. Its bubbles and log cues contain only
machine noises, never dialogue.

`upgradeEconomy` contains the recruitment point grant, points gained per player
level, eight point costs, eight service-part costs, and five field-rating
thresholds. Every branch has an `id`, display `name`, rating rule, and exactly
eight ordered nodes. A node has:

- a globally unique `id`;
- a tier from 1 through 5;
- a player-facing `name` and `description`;
- a stable effect id interpreted by companion runtime rules;
- zero or more prerequisite node ids in `requires`.

The current Utility Drone Mark I has six branches and 48 nodes. Core, Energy,
Bulwark, and Fieldworks use Engineering. Medical uses the higher of Engineering
and Medicine. Veil uses the higher of Engineering and Stealth. Costs and rating
thresholds are derived from node order, so content must not duplicate them on
individual nodes.

Companion service parts are ordinary validated item records. They can appear in
container loot and are removed transactionally when an upgrade is installed.
Installing is unavailable during combat and requires a second confirmation in
the journal because it is permanent for the run.

`scripts/validation/companionValidator.mjs` checks the index, actor fields,
branch count, node count, unique ids, prerequisite references, economy arrays,
communication mode and signals, and render sprite id. Expand that validator
before adding another companion shape.

## Asset organization

Suggested folders:

```text
assets/
├── sprites/
├── tilesets/
├── audio/
└── ui/
```

Naming examples:

```text
assets/sprites/player-militia-idle.png
assets/sprites/host-penitent-bastion-idle.png
assets/tilesets/ruined-city-01.png
assets/audio/ui-select.ogg
assets/ui/dialogue-frame.png
```

Rules:

- Use descriptive names.
- Do not use spaces in file names.
- Keep pixel art resolution intentional.
- Use nearest-neighbor/pixelated display in rendering.
- Do not mix raw source art and exported game assets unless documented.

## Validation

Run:

```bash
npm run check
```

The current validator parses JSON files and checks map, level, actor, enemy,
item, dialogue, quest, technique, and companion shape. Expand it whenever new
required data formats are added. It also resolves every authored `loadLevel`
destination against the complete level set. A destination fails validation if
the level is missing or its arrival tile is non-walkable, occupied by an actor,
or covered by a blocking object, including a conditionally visible blocker.

`scripts/check-content.mjs` is the entry point. Focused validators live under
`scripts/validation/` so level shape, dialogue shape, item shape, technique
shape, render catalog checks, and text rules can grow without turning the entry
point into the whole pipeline.
