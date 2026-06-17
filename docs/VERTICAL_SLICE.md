# Vertical Slice Plan

This project should grow through small playable slices, not giant unfinished systems.

## Rule

Do not build a large RPG framework before there is a playable loop.

A playable slice is better than ten half-finished systems.

## Slice 0: Repository foundation

Goal: clean local-hostable app and structure.

Must have:

- `npm run dev` starts a local server.
- `index.html` loads the game.
- Canvas draws something.
- `npm run check` validates basic JSON.
- Repo docs explain structure.

Done when:

- A new contributor can run the demo from the README.

## Slice 1: Exploration prototype

Goal: player can move around a tile map.

Must have:

- One JSON map.
- One player actor.
- Grid movement.
- Collision against walls.
- Camera or fixed viewport.
- Pixelated rendering style.

Avoid:

- Inventory.
- Full quest system.
- Complex pathfinding.
- Huge maps.

## Slice 2: One turn-based encounter

Goal: basic tactical combat exists.

Must have:

- One enemy.
- Turn order.
- Basic movement cost.
- Basic attack.
- HP/damage/death.
- Win condition.
- Lose condition.

Enemy suggestion:

- `host-penitent-bastion`: slow, defensive Host creature created by the Vale Imprint.

Avoid:

- Dozens of abilities.
- Complex AI.
- Status-effect bloat.

## Slice 3: One interaction and one dialogue

Goal: the player can talk to an NPC or inspect an object.

Must have:

- One interactable object or NPC.
- One dialogue JSON file.
- Simple dialogue UI.
- One meaningful choice, even if small.

Good example:

- A Free City gate guard asks whether the player is carrying Host-contaminated salvage.

Avoid:

- Branching epic dialogue trees.
- Voice acting.
- Reputation system before it matters.

## Slice 4: One quest

Goal: a tiny quest with start, objective, and completion.

Must have:

- Quest accepted.
- Objective tracked.
- Quest completed.
- Reward or consequence.

Good example:

- Recover a sample from a quarantined chapel basement.

Avoid:

- Full journal polish.
- Dozens of quest states.
- Procedural quest generation.

## Slice 5: Save/load

Goal: player progress can persist locally.

Must have:

- Save current map.
- Save player position.
- Save basic quest state.
- Load from browser storage.

Avoid:

- Cloud saves.
- Multiple profiles unless needed.

## Slice 6: First real demo area

Goal: combine exploration, combat, dialogue, and quest into one coherent playable area.

Must have:

- One small settlement or ruin with a bounded secondary area.
- One faction presence.
- One Host threat.
- One dialogue chain or readable investigation packet.
- Multiple small combat pulls that do not all aggro at once.
- One quest.
- One lore clue tied to The Host or Vale Imprint, without explaining the full mystery.

Suggested demo area:

- A quarantined chapel on the road to Hallowfen where a Choir cell has left teachings, a camp, separated cultist groups, and a hidden service cellar.

## Scope traps to avoid

Do not start with:

- Huge open world.
- Character creator.
- Ten factions with full questlines.
- Procedural everything.
- Full inventory economy.
- Crafting.
- Skill trees.
- Base building.
- Multiplayer.
- Mod tools.
- Full-screen cinematic system.

Those can come later if the core loop is fun.
