# Content Pipeline

> Writing rule: any player-facing text you add to `data/` (dialogue, descriptions,
> level intros/briefings/logs, UI strings) must follow
> `anti_ai_slop_writing_skill/SKILL.md`. Hard ban on em-dashes / `--` / `—`;
> rewrite instead. See also `AGENTS.md` -> "Player-facing writing".

The RPG should be content-driven. Systems live in `src/`; game content lives in `data/`; art and audio live in `assets/`.

This keeps the project editable and prevents every new enemy, map, or item from requiring source-code changes.

## Content principles

1. Every game content object gets a stable `id`.
2. IDs use lowercase kebab-case.
3. Source code should load content by ID, not by display name.
4. Display names can change; IDs should rarely change.
5. JSON should be human-readable and formatted with two spaces.
6. Avoid duplicating stats. Use shared templates later if duplication becomes painful.
7. Start simple. Do not create a huge schema before the game needs it.

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
  `furrow-field`, `forest-floor`, `graveyard-earth`, `farm-plank`, and
  `packed-earth`.
- Levels can optionally set `mood` for scene-wide visual treatment. Existing
  keys are `floorShade`, `floorShadeAlpha`, `ambient`, `ambientAlpha`, and
  `vignette`. Outdoor daylight maps can also set `mood.sun.enabled: true` with
  `shadowOffsetX`, `shadowOffsetY`, and `shadowAlpha` to add short hard-pixel
  cast shadows from an upper-left sun. Omit `mood.sun` for the original
  no-sun-shadow behavior.

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
  its draw function, category, depth layer, and whether it is a flat decal or a
  wall block. That file (not a list here) is authoritative; to add a new kind,
  add one entry there and a draw function (see `game_art_skill/SKILL.md`,
  Section 5). Kinds
  group into terrain blocks (`wall`, `wall-broken`), wall fixtures
  (`wall-window`, `wall-safe`, `wall-stash`), structures, furniture, props,
  lights, gore, creatures, ritual marks, and flat ground decals.
- Wall fixtures are blocks drawn into a wall cell. A purely visual one (a window)
  can be a legend tile letter. One that carries loot or a lock (a safe, a stash)
  is an authored object placed on a wall cell with `blocking: true` and an
  `interact`; the loader skips the default wall behind any `wall-*` object so the
  block is not drawn twice. The player reaches it from the floor tile in front.
- `blocking: true` makes the object's tile impassable (collision uses the same
  rule in explore and combat).
- `interact` (optional) can mark a loot container (`type: "container"` with
  `loot`), a dead body (`type: "corpse"` with optional `loot`), the altar
  (`type: "altar"` with `triggersCombat`), a readable note (`type: "note"`), a
  passable door (`type: "door"`), or a hidden ladder
  (`type: "secret-entrance"` / `type: "secret-exit"`). Interactions can
  reference `dialogue` by id and apply a `questUpdate`.
- Corpse loot uses the same inventory and carry-weight rules as containers, but
  the body stays visible and can still open its inspect dialogue after looting.
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
- Field and primary checks are deterministic. Current rating greater than or
  equal to `dc` succeeds. Lower rating fails and leaves the lock shut.
- `successLog`, `failLog`, and `unavailableLog` are optional player-facing log
  text. Keep them short and follow the writing rules at the top of this file.
- `success` and `failure` can use the same effect shape as dialogue choices,
  such as `log`, `setFlag`, `inventory`, `questUpdate`, `xp`, or `startCombat`.
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
  Exterior `farm-door` objects on farm building wall cells should define it;
  interior exit `farm-door` objects omit it and use the floor-door path.
- Farm building exteriors on Long Ash Road use separate generator tile chars and
  block kinds so each footprint has its own silhouette: `H` maps to
  `farmhouse-building-block`, `B` maps to `barn-building-block`, `T` maps to
  `tool-shed-building-block`, `S` maps to `storage-shed-building-block`, and
  `G` maps to `grain-shed-building-block`. These are wall-grid blocks, not
  authored objects. Keep the footprint source in `scripts/gen-long-ash-road.mjs`.
- Farm building interiors use separate wall-grid block kinds so they do not
  reuse chapel stone: `farmhouse-interior-wall`, `barn-interior-wall`, and
  `shed-interior-wall`.
- `farm-door.variant` selects both wall-mounted exterior door art and interior
  floor-door art. Valid values are `"farmhouse"`, `"barn"`,
  `"storage-shed"`, `"grain-shed"`, and `"tool-shed"`. Exterior doors usually
  pair `variant` with `wallPlane`; interior exit doors keep the same `variant`
  and omit `wallPlane`.
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
  `dining-table`, `dining-bench`, `kitchen-counter`, and `farm-prep-table`);
  other kinds ignore it.
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
  `flagsAbsent` to show NPCs only after a run-state change.
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
      { "x": 5, "y": 13 },
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
- Enemy spawns can define `dialogue` to make a living enemy talkable in explore
  mode. The id must also appear in the level `dialogue` list so the loader brings
  the scene in. Optional `talkRadius` controls manual E/Enter reach, and optional
  `dialogueTriggerRadius` opens the dialogue automatically when the player steps
  close enough. Use `aggroRadius: 0` when dialogue should happen before combat.
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
          "page": ["Selka starts counting people by name instead of by hiding place."]
        }
      ],
      "lastPrompt": "ENTER: CONTINUE",
      "skipPrompt": "ESC: CLOSE"
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
  "weight": 0.2,
  "groundModel": "dressing",
  "description": "Restores 4 HP. Consumed on use.",
  "use": { "effect": "heal", "amount": 4 }
}
```

Rules:

- `id`, `name`, and `type` are required.
- `weight` is required and uses kilograms. It must be zero or greater.
- `groundModel` is required so the item has drop and pickup art. Current models
  are `ball`, `boots`, `coat`, `hood`, `vest`, `ring`, `necklace`, `key`,
  `token`, `chit`, `paper`, `vial`, `dressing`, `rounds`, `shard`, and `food`.
- Equippable items define `equipment.slot`. Valid item slots are `clothes`,
  `armor`, `boots`, `helmet`, `trinket`, and `ring`.
- Ring items can be worn in either actor slot, `ring1` or `ring2`.
- `type: "currency"` items such as `ducat` are ordinary stackable inventory
  items with `weight: 0`. Traders should price goods in ducats.
- Loot in level objects, corpse objects, enemy files, and enemy spawns
  references items by `id`.
- Optional level `groundItems` entries can place an item directly on a walkable
  tile: `{ "item": "field-dressing", "count": 1, "x": 10, "y": 8 }`.

## Actor data

Current actor files live in `data/actors/`.

Minimal actor shape:

```json
{
  "id": "player",
  "name": "Unnamed Militia Scout",
  "type": "player",
  "appearance": {
    "genderModel": "female",
    "bodyType": "medium",
    "skinTone": "tan",
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
  writes `genderModel`, `bodyType`, `skinTone`, `hairColor`, `hairStyle`, and
  `facialHair`, plus `breastSize` and `penisSize` as 0 to 10 values.
  `genderModel` is visual model selection, not a pronoun field. It changes the
  baked animated player model family. Legacy `bodyFrame` and `anatomy` values
  still load for old data. Anatomy and breast detail render only when the player
  has no clothes equipped; equipped clothes cover them. New player data should
  use the explicit customization fields.
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
- Actor equipment slots are `clothes`, `armor`, `boots`, `helmet`, `trinket`,
  `ring1`, and `ring2`.
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
- Choice `effects` can log text, teleport the player within a level, load
  another level, and update a quest.
- Node and choice `conditions` can gate content with `flag`, `flags`,
  `notFlag`, `flagsAbsent`, `questStages`, `scar`, `scars`, `notScar`,
  `scarsAbsent`, `scarRanks`, `fieldRatings`, `traceMin`, and `traceMax`.
  `fieldRatings` maps field rating ids to minimum 0 to 100 values. `scarRanks`
  maps scar ids to minimum ranks.

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
- Every stage needs `id` and `description`. `task` is optional display text for
  the journal.
- Stage `xp` is optional and awards that much XP the first time the stage is
  reached by a quest update. Initial stages should normally omit `xp` or use
  `0`, because loading a quest is not task completion.
- The current quest runtime tracks one active stage per quest.
- Keep quest consequences simple until a second quest needs reputation,
  companion, or world-state changes.

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
item, dialogue, quest, and technique shape. Expand it whenever new required data
formats are added.

`scripts/check-content.mjs` is the entry point. Focused validators live under
`scripts/validation/` so level shape, dialogue shape, item shape, technique
shape, render catalog checks, and text rules can grow without turning the entry
point into the whole pipeline.
