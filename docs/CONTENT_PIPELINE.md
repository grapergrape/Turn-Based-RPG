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
└── quests/
```

Future folders can include:

```text
data/
├── abilities/
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
  "onVictory": { "questUpdate": { "quest": "investigate-ash-chapel-cult", "stage": "complete" } },
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
  add one entry there and a draw function (see the art skill, Section 8b). Kinds
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
  `loot`), the altar (`type: "altar"` with `triggersCombat`), a readable note
  (`type: "note"`), or a hidden ladder (`type: "secret-entrance"` /
  `type: "secret-exit"`). Interactions can reference `dialogue` by id and apply
  a `questUpdate`.
- `quests` lists runtime quest ids loaded from `data/quests/`.
- `dialogue` lists runtime dialogue ids loaded from `data/dialogue/`.
- Enemy spawns can define `encounter` to group nearby enemies into one combat
  pull. If omitted, the spawn gets its own encounter.
- NPC spawns live under `spawns.npcs` and reference actor ids from
  `data/actors/`. They render, block movement, speak ambient lines, and can be
  given dialogue, but they do not enter combat targeting or victory checks.
  Spawn `conditions` can use dialogue conditions such as `flag` or
  `flagsAbsent` to show NPCs only after a run-state change.
- Enemy spawns can define `ambient` as short overheard lines. These draw as
  subtitles above the NPC during exploration when the player is nearby.
- Enemy spawns can define `dialogue` to make a living enemy talkable in explore
  mode. The id must also appear in the level `dialogue` list so the loader brings
  the scene in. Optional `talkRadius` controls manual E/Enter reach, and optional
  `dialogueTriggerRadius` opens the dialogue automatically when the player steps
  close enough. Use `aggroRadius: 0` when dialogue should happen before combat.
- `combatTriggers` defines authored trigger zones. Each trigger should name an
  `encounter`, use grid coordinates, set a `radius`, and include short `intro`
  lines. Combat only activates living enemies in that encounter.
- `combatIntro` is a fallback list of log lines shown when an encounter has no
  trigger-specific intro.
- `onVictory.questUpdate` updates the active quest after all enemies in the
  level are defeated.
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
  "description": "Restores 4 HP. Consumed on use.",
  "use": { "effect": "heal", "amount": 4 }
}
```

Rules:

- `id`, `name`, and `type` are required.
- `weight` is required and uses kilograms. It must be zero or greater.
- Equippable items define `equipment.slot`. Valid item slots are `clothes`,
  `armor`, `boots`, `helmet`, `trinket`, and `ring`.
- Ring items can be worn in either actor slot, `ring1` or `ring2`.
- Loot in level objects references items by `id`.

## Actor data

Current actor files live in `data/actors/`.

Minimal actor shape:

```json
{
  "id": "player",
  "name": "Unnamed Militia Scout",
  "type": "player",
  "stats": {
    "hp": 24,
    "maxHp": 24,
    "actionPoints": 6
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
- `inventory` is optional. Player actors can define a starting pack with
  `maxCarryWeight`, item stacks, and equipped item ids.
- Actor equipment slots are `clothes`, `armor`, `boots`, `helmet`, `trinket`,
  `ring1`, and `ring2`.
- Avoid putting long dialogue or lore paragraphs inside actor stat files. Use dialogue/lore files later.

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
  "tags": ["host", "vale-imprint", "tank"]
}
```

Rules:

- Enemies should express gameplay role through tags and stats.
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
      "description": "Search the quarantine chapel."
    }
  ]
}
```

Rules:

- `id`, `title`, `initialStage`, and `stages` are required.
- Every stage needs `id` and `description`.
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
item, dialogue, and quest shape. Expand it whenever new required data formats
are added.
