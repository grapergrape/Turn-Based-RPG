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

## Current demo: Ash Chapel Breach

The demo loads `data/levels/ash_chapel_breach.json` and its referenced actors,
enemies, and items. It is a small, complete vertical slice rendered as a
**grimy isometric pixel-art CRPG scene** rather than a flat tile board.

You play **Mara Vey**, a Free City scout, exploring a ruined quarantine chapel
on the road to Veyr's Gate. The slice contains:

- An isometric, low-resolution scene: a ruined chapel with volumetric walls,
  broken pews, rubble, dead candles, a corpse and a cracked quarantine sign, and
  a corrupted altar with pulsing Host growth.
- Two enemies: a **Red Tithe Cutthroat** (Ash Cartel raider) and a
  **Host-Touched Penitent** (an early-stage Host victim bent by the Vale Imprint
  into a broken kneeling penitent, per the religious body horror canon).
- Three lootable / interactable objects and a small inventory.
- An Explore mode and an AP-based turn combat mode with win / lose / restart.

### Controls

Explore mode:

- **Left-click** a tile: walk there (path-finds around obstacles, turning to face
  each step); or `WASD` / Arrow keys: single step (no AP cost)
- `E` / `Enter`: interact with the object you are on or beside
- `I`: open or close the field pack inventory screen
- `H`: use a Field Dressing (restores 4 HP)
- `Esc` / `Enter`: close an open inventory or readout panel
- `R`: restart
- `G`: toggle the debug grid (off by default)

Combat mode:

- **Left-click** a tile to walk there (1 AP per tile, stops when AP runs out), or
  `WASD` / Arrow keys for single steps
- `1`: ready melee, `2`: ready sidearm
- `Tab`: cycle target, or **left-click an enemy** to target it
- `Space` / `Enter`: attack the selected target
- `E`: end turn
- `I`: open or close the field pack inventory screen
- `H`: use a Field Dressing
- `Esc` / `Enter`: close an open inventory or readout panel
- `R`: restart

### How exploration and combat work

You start in **Explore mode**; combat does not begin on load. Walk through the
chapel, open the Rusted Reliquary and the Field Satchel for loot, and read the
scene. Combat begins when you **interact with the corrupted altar / Host
growth**, or when you **approach the altar area or an enemy**. On the first
turn-based round, initiative is fixed: Mara, then the Cutthroat, then the
Penitent. Win by defeating both enemies; you lose if Mara reaches 0 HP. Press
`R` at any time to restart.

### About the art

All art is **original, procedurally drawn / hand-authored pixel art** generated
at runtime on Canvas 2D (no external image assets, no copied material). The
target is the general presentation of late-1990s isometric post-apocalyptic
CRPGs: a fixed 640x480 internal buffer upscaled with crisp nearest-neighbor
scaling, 64x32 isometric floor tiles, a player-centered scrolling camera, a
muted desaturated palette, hard-banded lighting, volumetric props, grounded
human-proportioned sprites, and a heavy brown/brass UI layer with a message log,
status panel, command panel, field pack screen, readout panel, hover labels, and
drawn cursor states. UI text is rendered with a small bitmap font on the same
low-resolution canvas as the game view. None of it copies any existing game's
assets, names, maps, palette, UI, or designs.

Actors are drawn as directional animated models. Each baked sprite has **eight
isometric facings**, four-frame idles, eight-frame walk cycles, six-frame
attacks, four-frame hit reactions, interact frames, and a ten-frame death
collapse. Mara is 42x62 px, the cutthroat is 44x64 px, and the Host-touched
penitent is 52x68 px.

Sprites are drawn directly at native resolution with clustered pixels, small
ramps, hard rim pixels, and dithered fabric or flesh texture. The renderer does
not smooth-scale sprites. Movement is quantized to the eight walk frames so the
screen cadence stays low-fps and old-school. Combat shows a move path with an
AP cost under the cursor rather than flooding every reachable tile.

The older `data/maps/demo-map.json`, `data/actors/player.json`, and
`data/enemies/host-penitent-bastion.json` remain in the repo as reference
content but are no longer loaded by the game.

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
