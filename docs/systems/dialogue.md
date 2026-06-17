# Dialogue System

The runtime dialogue system has not been implemented yet. Story and dialogue authoring should follow `docs/story/story-dialogue-workflow.md` until the game has a data-driven dialogue loader.

## Current Authoring Rule

Write story and dialogue together as **scene packets** in the story docs. A scene packet ties a quest beat to speakers, pressure, choices, sample lines, and consequences.

Use:

- `docs/story/quests.md` for quest structure and required scene anchors.
- `docs/story/characters.md` for speaker motives, relationships, and voice constraints.
- `docs/story/story-dialogue-workflow.md` for scene packets and line-writing rules.

Do not put final conversations in JavaScript. Do not write isolated dialogue that has no quest beat, consequence, or exploration purpose.

## Dialogue Requirements

A dialogue scene should define:

- stable scene title,
- quest or act,
- location,
- speakers,
- required player state,
- scene purpose,
- pressure,
- player choices,
- sample lines,
- consequences,
- dependencies,
- open questions.

## Future Runtime Shape

When the first playable conversation is needed, add `data/dialogue/` and keep one JSON file per dialogue or scene group.

A future dialogue file should contain:

```json
{
  "id": "hallowfen-kess-cellar",
  "quest": "hallowfen-silence",
  "location": "hallowfen-chapel",
  "speakers": ["marshal-confessor-odran-kess", "player"],
  "conditions": {
    "requires": ["hallowfen-council-found"]
  },
  "nodes": {
    "start": {
      "speaker": "marshal-confessor-odran-kess",
      "text": "There are six children in that cellar. There are three thousand people behind this gate. Choose your mercy carefully.",
      "choices": [
        { "text": "Open the cellar.", "next": "open-cellar" },
        { "text": "Hold the seal.", "next": "hold-seal" }
      ]
    }
  },
  "consequences": {
    "open-cellar": ["remnant-trust-down", "lio-approval-up"],
    "hold-seal": ["remnant-trust-up", "survivors-lost"]
  }
}
```

This shape is a starting point. Update `docs/CONTENT_PIPELINE.md` and the validator before treating it as a required schema.

## Dialogue Tone

Dialogue should sound grounded, desperate, political, and specific.

Use concrete pressure:

- gate ledgers,
- quarantine seals,
- water rights,
- food stores,
- field medicine,
- confession law,
- road tolls,
- exposed survivors,
- contaminated relics.

Avoid:

- generic cult speeches,
- generic zombie outbreak jokes,
- clean religion-bad science-good arguments,
- lines that only restate dread,
- lore lectures with no player pressure.

## Open Questions

- What runtime dialogue schema should the first playable conversation use?
- How are consequences applied: quest flags, faction reputation, companion approval, world state, or all four?
- Does the player character speak as a defined voice, selected intent, or silent protagonist?
- How are combat barks stored?
- Can dialogue choices test Keeps, Virtues, Trace, faction clearances, or companion presence?
