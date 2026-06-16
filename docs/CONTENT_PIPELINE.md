# Content Pipeline

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
├── maps/
├── actors/
└── enemies/
```

Future folders can include:

```text
data/
├── abilities/
├── dialogue/
├── encounters/
├── factions/
├── items/
├── quests/
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
  }
}
```

Rules:

- `id` is stable.
- `name` is display text.
- `type` tells systems how to treat the actor.
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

## Dialogue data later

When dialogue is added, use a separate folder such as `data/dialogue/`.

Do not hardcode conversations into JavaScript. A simple future shape could be:

```json
{
  "id": "veyres-gate-guard-intro",
  "speaker": "gate-guard",
  "nodes": {
    "start": {
      "text": "State your business before the bells change.",
      "choices": [
        { "text": "We need entry.", "next": "entry" },
        { "text": "We are leaving.", "next": "end" }
      ]
    }
  }
}
```

## Quest data later

When quests are added, keep them data-driven and simple.

A future shape could be:

```json
{
  "id": "pale-orchard-sample",
  "title": "Fruit of the Pale Orchard",
  "stages": [
    {
      "id": "accepted",
      "description": "Recover a fruit sample from the Pale Orchard."
    },
    {
      "id": "returned",
      "description": "Return the sample to the buyer."
    }
  ]
}
```

Do not build a huge quest engine until there is one complete quest that needs it.

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

The current validator parses JSON files and checks basic map/actor/enemy shape. Expand it whenever new required data formats are added.
