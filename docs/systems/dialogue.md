# Dialogue System

The first runtime dialogue pass exists for the Ash Chapel slice. It supports
short readout scenes, one or two numbered choices, log effects, quest-stage
updates, simple same-level teleport effects, and `loadLevel` effects for secret
entrances that move to a separate JSON level. Story and dialogue authoring
should still start in `docs/story/story-dialogue-workflow.md` before moving
playable lines into `data/dialogue/`.

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

## Runtime Shape

Keep one JSON file per dialogue or scene group.

Current dialogue files contain:

```json
{
  "id": "ash-chapel-barrel-ladder",
  "title": "Split Barrel",
  "nodes": {
    "start": {
      "lines": ["The barrel is nailed to the floor."],
      "choices": [
        {
          "label": "Descend",
          "effects": {
            "log": "You descend through the barrel into the cellar.",
            "loadLevel": {
              "path": "./data/levels/ash_chapel_cellar.json",
              "player": { "x": 12, "y": 13 }
            },
            "questUpdate": { "quest": "investigate-ash-chapel-cult", "stage": "cellar-found" }
          },
          "close": true
        }
      ]
    }
  }
}
```

This shape is intentionally narrow. Add conditions, speakers, reputation,
companion reactions, or skill checks only when a playable scene needs them.

Ambient NPC lines are authored on enemy spawns as `ambient` arrays, not as full
dialogue nodes. Use them for short overheard teachings, warnings, or routines
before combat. They should not explain the plot or reveal information the player
has not earned.

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

- Does the player character speak as a defined voice, selected intent, or silent protagonist?
- How are later consequences applied: faction reputation, companion approval, world state, or all three?
- Can dialogue choices test Keeps, Virtues, Trace, faction clearances, or companion presence?
