# The Host RPG

A local-hostable JavaScript top-down turn-based RPG with pixelated graphics, gothic sci-fi horror, faction politics, and tactical party-based exploration/combat.

The game is set in a future where humanity's religious-technological civilization collapsed after a Europa drilling mission brought back an alien organism now called **The Host**. Because the first infected human was Father Marius Vale, all Earthborn Host transformations follow **the Vale Imprint**: hellish religious body horror instead of random alien mutation.

## Can this be built with JavaScript and local hosting?

Yes. This repo is designed as a browser-based JavaScript game that can run locally through a small static server. The starting version uses:

- Browser JavaScript modules.
- Canvas 2D rendering.
- JSON content under `data/`.
- Static assets under `assets/`.
- A no-dependency Node local server in `scripts/serve.mjs`.

This keeps the project simple while still allowing a full top-down RPG structure to grow over time.

## Local development

Requirements:

- Node.js installed.

Run locally:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:8080
```

Run basic repository/content checks:

```bash
npm run check
```

## Repo map

```text
/
├── AGENTS.md                 # Instructions for Codex/AI assistants
├── README.md                 # This file
├── index.html                # Browser entry point
├── package.json              # Local scripts
├── assets/                   # Sprites, tilesets, audio, UI art
├── data/                     # Game content as JSON
├── docs/                     # Architecture, lore, content pipeline, decisions
├── scripts/                  # Local server and validators
├── src/                      # Runtime game code
└── tests/                    # Future tests
```

## Current demo

The starter demo loads:

- `data/maps/demo-map.json`
- `data/actors/player.json`
- `data/enemies/host-penitent-bastion.json`

It draws a simple tile grid on Canvas and lets the player move with arrow keys or WASD. This is intentionally minimal. The point is to establish a clean project shape before adding combat, dialogue, inventory, quests, art, and save files.

## Development philosophy

Build the game as vertical slices:

1. One map.
2. One player unit.
3. One enemy.
4. One turn system.
5. One interaction.
6. One dialogue.
7. One quest.
8. One save/load path.

Do not build ten incomplete systems before one full playable loop exists.

## Important docs

Read these before expanding the project:

- `docs/ARCHITECTURE.md`
- `docs/CONTENT_PIPELINE.md`
- `docs/TECH_DECISIONS.md`
- `docs/VERTICAL_SLICE.md`
- `docs/LORE_INTEGRATION.md`
- `docs/lore/the_host_story_bible.md`
