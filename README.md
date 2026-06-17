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

You play **Mara Vey**, a **cult-breaker of the Ashen Censure** — the Holy
Remnant's quiet office for hunting and burning blasphemous Host-cults. After a
grim opening writ that sets up the job (years of clearing cults along the ash
roads, and a rising tide of them that no one will explain), you are dropped into
a ruined quarantine chapel on the old road toward **Hallowfen**. The area works
as a first-area sample: multiple small combats, looting, an investigation quest,
in-lore secrets, a hidden cellar, a moral choice with foreshadowed consequences,
and background lore that points at the Hallowfen outbreak and the unexplained
surge of cults without explaining the larger cause. (The state teaches that this
is Hell invading and that it fights God's war; almost no one knows otherwise.
What is really happening is dev canon in `docs/lore/`, not something in-game
text reveals.)

The chapel is laid out as a real ruined basilica — a **narthex** entrance, a
columned **nave** with broken pews, a railed **sanctuary**, a west **side-chapel**
where the Choir keep their camp, and an east **service room** — so it reads as
architecture rather than an open field.

The slice contains:

- A grim, paged **opening writ** (the Field Writ of the Ashen Censure) that
  establishes the cult-breaker premise before the chapel loads.
- Type-specific **corpses**: cleared enemies fall as readable bodies on the
  ground (a Choir cultist crumples into bloodied red robes by a dropped knife; a
  Host penitent collapses into a black-gold icon with scattered halo-bone), so a
  cleared room reads at a glance and looting is easy to find.
- Long readouts (the cross, the ledger, the notes) are fully **scrollable**, so
  no script is ever truncated.
- An isometric, low-resolution scene: volumetric walls and broken interior
  walls, a colonnade, broken pews, rubble, guttering candles, campfire debris,
  chapel relics, corpses, a cracked quarantine sign, and a corrupted altar.
- The **Choir of the Open Wound** worship the Host as divine. Their devotion is
  written across the chapel as overt infernal iconography: a ground rite-circle,
  blood-daubed inverted-cross sigils, banners stitched with inverted crosses, and
  rings of ritual candles.
- The centerpiece: **The Opened Saint**, a Host-victim hammered to a cross behind
  the altar and backlit by a tall window of sourceless light, his ribs splayed
  and his flesh sliced for sacrament. He still half-lives and whispers. When the
  Choir are dead you may **cut him down or leave him** — a choice the game tells
  you will have consequences.
- Multiple spread encounters: Choir cultists at the altar rite, a campfire group
  in the side-chapel, and an east-side watcher with a **Host-Touched Penitent**.
  Trigger zones are separated so one fight does not pull the whole chapel.
- Ambient cultist and prop subtitles, written as overheard teaching and ritual
  rather than lore summaries.
- A quest, **Investigate the Ash Chapel Cult**, with ledger evidence pointing
  toward Hallowfen while keeping the deeper cause mysterious.
- In-lore secrets to find: a child's hidden bright-metal fragment under a loose
  flagstone, a scratched confession on a column, a child's chalk drawing of
  Europa, a Lumen Compact medicine crate, and a Penitent Engine's wheel-rut.
- Lootable reliquary and field-satchel containers.
- A separate secret cellar level, rendered colder and darker than the nave, where
  the Choir keep the **next victim** hammered up for after the first is eaten,
  plus a dead road warden, a buried reliquary, and an ossuary heap.
- An Explore mode and an AP-based turn combat mode with win / lose / restart.

### Controls

Explore mode:

- **Left-click** a tile: walk there (path-finds around obstacles, turning to face
  each step); or `WASD` / Arrow keys: single step (no AP cost)
- `E` / `Enter`: interact with the object you are on or beside
- `1` / `2`: choose dialogue options when a readout offers choices
- Arrow keys / `W` `S`: scroll a long readout that does not fit (a `▼` and an
  `UP/DN SCROLL` hint appear when there is more to read)
- `Enter` / click: advance the opening writ; `Esc`: skip it
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
chapel, open the Rusted Reliquary and the Field Satchel for loot, read the Cult
Ledger, and inspect the split barrel near the south wall. Combat begins when
you **interact with the corrupted altar / Host growth**, or when you
**approach a local encounter group**. Only that group joins the current fight.
Win by clearing the chapel encounters; you lose if Mara reaches 0 HP. Press `R`
at any time to restart.

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

The floor is drawn as broad worn-stone wear zones rather than a contrasting
checkerboard, and each level can carry a **mood** (a multiplied floor tint, a
flat ambient wash, and a vignette strength) so the cellar reads colder and
darker than the nave above it. The horror set-pieces — the backlit crucified
Opened Saint and his window, the ground rite-circle, the blood sigils, the
guttering candle clusters — are all built from the same seeded pixel
primitives drawn at runtime; props in front of the player fade to a cutaway so
interior walls never hide the figure.

Actors are drawn as directional animated models. Each baked sprite has **eight
isometric facings**, four-frame idles, eight-frame walk cycles, six-frame
attacks, four-frame hit reactions, interact frames, and a ten-frame death
collapse. Mara is 42x62 px and the Choir cultists use a 44x64 px hooded ritual
sprite (bloodied stole, a bone rite-knife, a held strip of pale sacrament-flesh).
The Host-Touched Penitent is a hulking 64x92 px body-horror sprite: a broken bone
halo, a screaming horned skull, a ribcage splayed open like chapel doors over a
glowing black-gold wound, shoulder thorns, and elongated bone prayer-arms. Cleared
actors leave type-specific corpses on the ground.

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
