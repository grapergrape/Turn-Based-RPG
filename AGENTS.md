# AGENTS.md

Guidance for Codex, ChatGPT, and any AI/code assistant working in this repository.

This project is a local-hostable JavaScript top-down turn-based RPG with pixelated graphics, inspired by classic isometric/top-down CRPGs while using this project's original setting: **The Host**, **the Vale Imprint**, religious sci-fi body horror, fractured post-collapse city politics, and tactical party-based exploration/combat.

## Read first

Before making changes that touch story, game systems, data formats, quests, enemies, factions, or project structure, read these files:

- `docs/ARCHITECTURE.md`
- `docs/CONTENT_PIPELINE.md`
- `docs/TECH_DECISIONS.md`
- `docs/LORE_INTEGRATION.md`
- `docs/lore/the_host_story_bible.md`

When making code changes, also inspect the exact files you plan to modify before editing them.

## Player-facing writing — MANDATORY (anti-AI-slop)

Before you write or edit **any text a player can read** (dialogue, item/enemy/actor
descriptions, level `intro`/`briefing`/`combatIntro`/trigger intros/object `log`,
UI strings, barks, readouts), you **must** apply the rules in
**`anti_ai_slop_writing_skill/SKILL.md`**. This is not optional and not a slash
command; it binds every agent (Codex especially) directly.

Headline rule, because it is the worst tell: **NO em-dashes, NO `--`, NO `—`** in
player-facing text. Rewrite with periods, commas, colons, or restructured
sentences (see the dash-rewrite guide in the skill). Do not ship player-facing
text until it passes the skill's self-check.

## World naming — MANDATORY

Before you add or revise any player-facing character, family, institution, or
place name, apply **`name-the-world/SKILL.md`**. Build names from the documented
biblical, Greek Christian, Late Latin, and Roman social registers. Do not use an
invented phonetic gimmick as a substitute for culture.

Keep stable content and save IDs independent from display names. Record every
retcon in `name-the-world/references/retcon-ledger.json`, preserve legacy IDs as
opaque compatibility keys, and run
`node name-the-world/scripts/audit-names.mjs` before shipping named content.
Father Marius Vale and the Vale Imprint are the sole protected Vale anchor.

## Game art — MANDATORY

Before you draw or edit **anything a player can see** (an animated actor in
`src/render/SpriteAtlas.js`; any hand-built terrain, wall, building, interior,
furniture, plant, prop, decal, creature, corpse, gore, sigil, or light in
`src/render/PixelPrimitives.js` + `src/render/spriteCatalog.js`; or the interface
in `src/render/UIRenderer.js` and `src/ui/*`), you **must** apply
**`game_art_skill/SKILL.md`**. It is the single combined art standard, so a
weaker agent's sprite, prop, or panel still sits beside the player actor, the Opened
Saint, and the existing CRPG interface. (It absorbs the former
`character_creature_art_skill`, which now redirects to it.)

Headline rules: hard pixels only (no smooth gradients, blur, or bloom); only
colors from `src/render/palette.js` (the `ui*` family for interface); shade with
ramps and dither; light from the upper-left and a contact shadow on everything
on the ground; humans read as small real people, never blocky or chibi; Host
monsters are Vale Imprint body horror grown from a person and still human-sized
(broken bone halos, prayer-fused hands, butterflied-open ribcages, thin
black-gold veins kept under the skin not gushing, goat or ram skulls for fully
opened heads), always asymmetric, never clean golems; environmental light
(windows, glows) belongs to terrain, never baked into a creature; every static
`kind` is registered once in the sprite catalog; UI is built from hard rects and
the bitmap font, never browser-font chrome. Verify every piece on a
detached-canvas render and in a real scene or screen before shipping.

## Non-negotiable project rules

1. **Keep the repo boring and maintainable.** Do not create clever, over-engineered structures. Prefer clear folders, clear names, and small modules.
2. **Do not turn `src/main.js` into a god file.** Game loop, rendering, input, combat, world data, entities, UI, and content loading must stay separated.
3. **Use data-driven content.** Maps, actors, enemies, items, dialogue, quests, and encounters should live under `data/` as readable JSON or another documented data format. Code should run systems; data should define content.
4. **Do not hardcode lore or content into engine systems.** A renderer should not know what the Holy Remnant is. A combat system should not know what a Penitent Bastion is except through data.
5. **No random new dependencies.** If adding a package, document why in `docs/TECH_DECISIONS.md`. Prefer no-dependency browser JavaScript until there is a real need.
6. **Canvas 2D first.** Do not migrate to WebGL, Phaser, Pixi, React, Electron, or a large engine without an explicit technical decision document.
7. **No massive rewrites.** Make small, testable changes. Do not replace the architecture because one feature is awkward.
8. **No asset dumping.** Sprites, tilesets, audio, and UI art belong under `assets/`, not `src/`. Generated, temporary, or huge raw files should not be committed unless intentionally documented.
9. **No TODO graveyard.** Use short TODOs only when attached to a specific nearby issue. Prefer `docs/VERTICAL_SLICE.md` for planned work.
10. **Run checks before finishing.** At minimum run `npm run check` after editing data or source files.
11. **Player-facing text follows the anti-AI-slop skill.** Apply `anti_ai_slop_writing_skill/SKILL.md` to all player-readable text. Hard ban on em-dashes / `--` / `—`. Rewrite, do not dash.
12. **Register renderable kinds in the sprite catalog.** Every drawable object `kind` (walls, wall fixtures, structures, furniture, props, decals, creatures, lights) is registered once in `src/render/spriteCatalog.js`, with its draw function living in `PixelPrimitives.js`. Add new building blocks there, never by editing a renderer switch or a second list of kinds. See `game_art_skill/SKILL.md` Section 5.
13. **Names follow the world-naming skill.** Apply `name-the-world/SKILL.md`, keep display names separate from stable IDs, update the retcon ledger, and run the naming audit.

## Canon and tone rules

The setting uses the following canon:

- The alien organism is called **The Host**.
- The inherited transformation pattern is called **the Vale Imprint**.
- Every Earthborn Host strain descends from the sample that infected Father Marius Vale.
- Because of the Vale Imprint, Host transformations are always hellish religious body horror forms, not random aliens or generic zombies.
- The Host may not be morally evil, but it reproduces a priest's inherited vision of damnation.
- The world is gothic sci-fi, religious horror, political survival drama, and tactical expedition fiction.

Avoid:

- Goofy faction names.
- Marvel-style quips during horror scenes.
- Generic zombie apocalypse writing.
- Clean good-faction-versus-evil-faction morality.
- Random alien monster designs that ignore the Vale Imprint.
- Replacing the setting with Fallout, Warhammer, Event Horizon, Dead Space, or any other existing IP.

Inspirations can guide mood, but all shipped content must be original.

## Repo structure rules

Use this top-level layout:

```text
/
├── AGENTS.md                 # AI/project guidance
├── README.md                 # Human project overview and local dev instructions
├── index.html                # Browser entry point
├── package.json              # Local scripts, no unnecessary dependencies
├── assets/                   # Sprites, tilesets, audio, UI art
├── data/                     # JSON content: maps, actors, enemies, items, quests
├── docs/                     # Architecture, lore, planning, decisions
├── scripts/                  # Local dev and validation scripts
├── src/                      # Runtime JavaScript source
└── tests/                    # Test docs and future automated tests
```

Inside `src/`, keep responsibilities separated:

```text
src/
├── main.js                   # Small entry point only
├── core/                     # Game orchestration, loop, input, asset loading
├── render/                   # Canvas drawing, camera, animation later
├── world/                    # Grid, maps, collision, pathfinding later
├── combat/                   # Turn order, actions, status effects later
├── entities/                 # Actor/entity models, components later if needed
├── ui/                       # Menus, HUD, dialogue UI later
└── util/                     # Tiny reusable helpers only
```

## Definition of done

A change is done when:

- It is placed in the correct folder.
- It follows existing naming and module boundaries.
- It does not introduce hidden global state unless explicitly justified.
- It updates docs when it changes architecture, data formats, or lore canon.
- It keeps the app local-hostable.
- It passes `npm run check`.
- It does not leave broken demo content.

## How to add a feature safely

1. Identify the smallest vertical slice of the feature.
2. Put reusable logic in `src/`, content in `data/`, and assets in `assets/`.
3. Keep rendering, game rules, and content definitions separate.
4. Add or update validation if you introduce new data shape.
5. Update `docs/CONTENT_PIPELINE.md` if the format changes.
6. Update `docs/VERTICAL_SLICE.md` if scope or milestones change.

## AI assistant behavior

When asked to implement something:

1. Inspect relevant files first.
2. State the intended file changes briefly.
3. Make the smallest useful change.
4. Do not invent new lore that contradicts `docs/lore/the_host_story_bible.md`.
5. Do not silently add dependencies.
6. Run the project checks.
7. Summarize changed files and any remaining risks.
