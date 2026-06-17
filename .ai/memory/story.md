# Project Memory: Story

## Canonical Story State

The canon setting is **The Host** continuity in `docs/lore/the_host_story_bible.md`. The game is a far-future, local-hostable, top-down turn-based RPG about Earth roughly 130 years after the Descent, when the infected vessel _Eschaton's Mercy_ seeded Earth with the Europa organism now called The Host.

Core canon:

- The alien organism is commonly called **The Host**.
- Every Earthborn Host strain descends from the sample that infected Father Marius Vale.
- The **Vale Imprint** is the inherited psychic-biological pattern that makes Host transformations religious body horror instead of random alien mutation.
- The first apocalypse stopped during **the Stilling**, but the Stilling was an artificial lock created by Dr. Elian Sorell to trap The Host inside the Vale Imprint.
- The campaign begins when the player's field squad investigates Hallowfen and finds an _Eschaton's Mercy_ data core warning that the lock is failing and no one must find the priest.

## Current Direction

Use `docs/story/` as the game-facing story layer:

- `docs/story/world.md` - current era, timeline, regions, factions, tone, and open story questions.
- `docs/story/characters.md` - player premise, companions, faction leaders, recurring antagonists, and old-world figures.
- `docs/story/quests.md` - five-act campaign structure, witness quests, faction questlines, companion hooks, and endings.
- `docs/story/story-dialogue-workflow.md` - story/dialogue authoring workflow, scene packet format, and rules for keeping dialogue tied to quest beats.

Story and dialogue should be written together as scene packets. Each packet names the quest, location, speakers, player state, purpose, pressure, choices, sample lines, consequences, dependencies, and open questions. Do not write final dialogue only in `docs/story/quests.md`, and do not write isolated dialogue with no quest beat or consequence.

Runtime dialogue belongs in future `data/dialogue/` files only after a conversation needs to run in-game. Until then, keep authoring in `docs/story/` and keep system requirements in `docs/systems/dialogue.md`.

Use `docs/enemies/` for hostile faction and boss design:

- `docs/enemies/factions.md` - The Host, Choir, Ash Cartels, Remnant, Compact, Penitent Engines, Free City militias, Bloomborn hostility cases, and hazards.
- `docs/enemies/bosses.md` - Hallowfen Tribunal, Lazarus Subject, Bell Below, Rooted Witness, Canticle's Choir, Sorell, the First Icon, and other boss concepts.

Use `docs/maps/README.md` as the canonical location index for Hallowfen, Ash Roads, Veyr's Gate, Sanctum Aurelian, Meridian Vault, Low Harrow, Cinder Parish, Glassmarket, Pale Orchard, Black Reliquary, Woundfall, Saint Origen Deep Bore, and Europa.

Current title candidate from discussion: **The Vale Imprint** is stronger than **The Host** as a game title, while The Host should remain the organism's common name.

## Open Questions

- Is the final game title **The Vale Imprint**, or is that a subtitle?
- Is the player character named and voiced, or a configurable field-squad leader?
- Which faction, if any, initially funds the player's squad?
- Which companions are mandatory versus optional?
- Can companions leave or die permanently based on faction choices?
- Which Act II witness quest is first, or can the player choose the order?
- Does the shipped endgame stay on Earth, include direct Europa contact, or reserve Europa for expansion?
- Which ending, if any, becomes canon for future stories?
