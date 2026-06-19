# Project Memory: Story

## Canonical Story State

The canon setting is **The Host** continuity in `docs/lore/the_host_story_bible.md`. The game is a far-future, local-hostable, top-down turn-based RPG about Earth roughly 130 years after the Descent, when the infected vessel _Eschaton's Mercy_ seeded Earth with the Europa organism now called The Host.

Core canon:

- The alien organism is commonly called **The Host**.
- Every Earthborn Host strain descends from the sample that infected Father Marius Vale.
- The **Vale Imprint** is the inherited psychic-biological pattern that makes Host transformations religious body horror instead of random alien mutation.
- The first apocalypse stopped during **the Stilling**, but the Stilling was an artificial lock created by Dr. Elian Sorell to trap The Host inside the Vale Imprint.
- The Stilling both calcified the existing Bloom-era Host (frozen mid-change, faintly conscious, not dead, like Vale and the Pale Orchard) and left an ongoing lock that stops infection from chaining into a new Bloom. New infections after the Stilling still transform victims but do not calcify and cannot spread on their own unless fed. As the lock fails, calcified hosts can thaw and fresh infection can catch again.
- The Choir of the Open Wound is retconned as a recently emerged, unknown Host-cult (last few years), distinct from the common older Host/satanic cults the Censure has always burned. The protagonist is an experienced cult-breaker meeting THIS cult for the first time and investigates it; its name and doctrine are discovered in play (the Ash Chapel cult ledger reveals the name). Its rapid, coordinated emergence is a symptom of the failing lock. Player-facing slice text must not pre-name the Choir in narration; narration calls them "the cult" until the ledger reveal.
- Hallowfen is the walled Earthside crash scar the Holy Remnant calls holy ground. Its checkpoint bell towers, not the town itself, are the first Act I silence.
- Act I begins with the Hallowfen wall crisis: expose or survive a Choir-held checkpoint, enter through that checkpoint or a smuggler tunnel, and decide whether Hallowfen survives the siege.
- The data-core mystery comes after Hallowfen's fate is settled. The core carries Sorell's damaged warning that the lock is failing, that Sorell cannot repair it, and that the listener must find the Three Witnesses through puzzle clues rather than exact coordinates.
- Act II is the largest act: towns, side quests, faction courts, companion arcs, and the Three Witnesses. The Witnesses reveal Father Vale as first contact, show that early Host forms were not only Hell-shaped, and prove Sorell created the lock while calcifying into it.
- Act III narrows around the Choir's way of life and Ysolde's total-immersion rite. The Pontifex is abducted, a moon sigil is left behind, and the Choir tries to manifest Satan by lowering a symbolically worthy body into harvested Host matter.
- Act IV resolves Woundfall, Vale, and Sorell. Sorell is fused into the lock chamber. Vale tortures Sorell because Sorell turned Vale's fear into humanity's prison. The final choice is about the cost of preserving, breaking, replacing, or renewing that lock.
- The originality guardrail is documented in `docs/story/originality.md`: the story may use familiar CRPG structures, but its spine is first contact through Vale, the Vale Imprint, Sorell's lock, the Choir's false Satan, and the final moral crime scene.

## Current Direction

Use `docs/story/` as the game-facing story layer:

- `docs/story/world.md` - current era, timeline, regions, factions, tone, and open story questions.
- `docs/story/characters.md` - player premise, companions, faction leaders, recurring antagonists, and old-world figures.
- `docs/story/quests.md` - four-act campaign structure, witness quests, faction questlines, companion hooks, and endings.
- `docs/story/originality.md` - originality audit, genre-drift risks, and checks for keeping quests specific to this setting.
- `docs/story/story-dialogue-workflow.md` - story/dialogue authoring workflow, scene packet format, and rules for keeping dialogue tied to quest beats.

Story and dialogue should be written together as scene packets. Each packet names the quest, location, speakers, player state, purpose, pressure, choices, sample lines, consequences, dependencies, and open questions. Do not write final dialogue only in `docs/story/quests.md`, and do not write isolated dialogue with no quest beat or consequence.

Runtime dialogue belongs in future `data/dialogue/` files only after a conversation needs to run in-game. Until then, keep authoring in `docs/story/` and keep system requirements in `docs/systems/dialogue.md`.

Use `docs/enemies/` for hostile faction and boss design:

- `docs/enemies/factions.md` - The Host, Choir, Ash Cartels, Remnant, Compact, Penitent Engines, Free City militias, Bloomborn hostility cases, and hazards.
- `docs/enemies/bosses.md` - Hallowfen Gate Cantor, Hallowfen Tribunal, Lazarus Subject, Bell Below, Rooted Witness, Canticle's Choir, Sorell, the First Icon, and other boss concepts.

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
