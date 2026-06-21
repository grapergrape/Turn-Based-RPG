# Project Memory: Assets

## Canonical Asset State

All runtime-drawn art is standardized under one skill. The binding standard for
everything visible (animated actors, terrain, walls, buildings, interiors,
furniture, plants, props, decals, gore, ritual marks, creatures, lights, and the
interface) is **`game_art_skill/SKILL.md`**, mandatory per `AGENTS.md`. It
absorbs the former `character_creature_art_skill` (now a redirect stub). It
defines the engine reality, palette and ramps, the iso projection, the sprite
catalog workflow, the human standard (small real people, reference: Mara Vey),
the monster standard (Vale Imprint body horror grown from a person and still
human-sized, goat/ram skulls, butterflied-open ribcages, black-gold kept thin and
under the skin, bone language, asymmetry), satanic imagery, gore, the animated
actor/animation system, the rule that terrain owns light, and UI development.

Audio style and the asset file pipeline are still open. UI now has a documented
standard inside the art skill (Section 17).

## Current Direction

All art follows `game_art_skill/SKILL.md`. Other asset decisions should be
documented in `docs/art-audio/` and summarized here once durable.

## Open Questions

- What visual style should the game use?
- What music and sound direction fits the world?
- What file naming conventions should assets follow?
- What resolution, tile size, sprite size, or UI scale should be used?
