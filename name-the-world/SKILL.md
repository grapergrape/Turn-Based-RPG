---
name: name-the-world
description: Create, revise, and audit player-facing character, family, institution, and place names for this RPG. Use whenever adding or changing a proper name, renaming cast members, reviewing names for generic AI patterns, separating display names from stable content IDs, or checking cultural consistency across factions and social classes.
---

# Name the World

Build names from the setting's social history. Do not choose a name only because
it sounds gothic, futuristic, or dramatic.

## Required reading

Before naming, read:

- `references/naming-register.md` for the accepted traditions, faction strata,
  blocked defaults, and construction rules.
- `references/retcon-ledger.json` when revising an existing name or checking the
  current cast. Treat its `id` values as compatibility contracts.
- the relevant cast, location, faction, and lore sources named by `AGENTS.md`.
- `anti_ai_slop_writing_skill/SKILL.md` because names are player-facing text.

## Workflow

1. Identify the stable content ID and every authoritative source that emits the
   name. Never derive a new stable ID from a revised display name.
2. Classify the bearer by institution, class, household, migration history,
   occupation, and generation. Use the matching register in the reference.
3. Decide whether the culture would use a baptismal name, household name,
   patronymic, occupational byname, place byname, monastic name, regnal name, or
   service designation. Titles are separate from birth names.
4. Build a short candidate slate from attested biblical, Greek Christian, Late
   Latin, or Roman forms. Check the actual form before using it. Never make a
   word look Latin by adding a decorative suffix.
5. Compare the candidate against neighboring characters, prominent places,
   factions, items, and the blocked-default list. Similar spelling, cadence, or
   initials count as a collision when players could confuse them.
6. Prefer an ordinary name with a clear social reason over a unique fantasy
   name. Repeated common given names are allowed when households, titles, or
   occupations distinguish the people.
7. Record the choice in `references/retcon-ledger.json` with the stable ID, old
   display, replacement, stratum, household or institution, and source basis.
8. Edit authoritative generators and source data first. Regenerate derived JSON,
   then update direct data, narrative docs, tests, and player-facing references.
9. Run `node name-the-world/scripts/audit-names.mjs`, the relevant generators,
   `npm run check`, and `npm test`.

## Compatibility rules

- Keep existing actor, dialogue, quest, flag, spawn, object, and save IDs unless
  a separate save migration is part of the request.
- An old personal name may remain inside a lowercase legacy ID. Do not show that
  ID to the player and do not reuse it as a source for new display text.
- New-character creation must not supply a canonical default name. A temporary
  role label may support developer starts, but normal confirmation requires a
  valid player-entered name.
- Existing saves keep the player's stored custom name.
- Use ASCII characters supported by the bitmap font. Apostrophes and spaces are
  acceptable. Do not ship diacritics that render as blanks.

## Review standard

Reject a name when any of these is true:

- it appears on the blocked-default list without an explicit canon exemption;
- it is a near-copy of another major proper noun;
- it combines fashionable fantasy sounds without a social or linguistic basis;
- it gives every member of an institution the same cadence;
- it treats a title as a surname or appends fake Latin decoration;
- it changes a stable ID merely to make the ID match the new display name;
- it is missing from the retcon ledger or contradicts the recorded stratum.

Do not use an AI-name frequency list as a substitute for judgment. It is a
warning surface. The positive test is whether the name could have reached this
person through family, church, work, law, or migration.
