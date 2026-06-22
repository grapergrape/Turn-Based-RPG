# Dialogue System

The first runtime dialogue pass exists for the Ash Chapel slice. It supports
short readout scenes, up to five numbered choices, log effects, quest-stage
updates, simple same-level teleport effects, `showBriefing` interlude effects,
and `loadLevel` effects for secret entrances that move to a separate JSON level.
Story and dialogue authoring should still start in
`docs/story/story-dialogue-workflow.md` before moving playable lines into
`data/dialogue/`.

All dialogue lines are player-facing, so they must follow
`anti_ai_slop_writing_skill/SKILL.md`: no em-dashes / `--` / `—`, no AI-tell
vocabulary, varied sentence length. Rewrite, do not dash.

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

This shape is intentionally narrow. Add speakers, reputation, companion
reactions, or skill checks only when a playable scene needs them. Conditional
nodes and story flags already exist (see below).

`showBriefing` opens the same full-screen black card renderer used by the
opening writ. Use it for act cards or major field reports, not ordinary notes.
Its `pages` array is always shown. Optional `conditionalPages` entries carry
normal dialogue `conditions` plus a `page`, so personal outcome text only appears
after the player has earned it.

Ambient NPC lines are authored on enemy spawns as `ambient` arrays, not as full
dialogue nodes. Use them for short overheard teachings, warnings, or routines
before combat. They should not explain the plot or reveal information the player
has not earned.

## Conditional nodes and story flags

Information must be earned. A node should not reveal something the player has not
yet found. Dialogue nodes can be gated on run-global flags so a hint only appears
once its source has actually been read.

- A note's `start` node can set a flag when it is shown:
  `"effects": { "setFlag": "read-warden-journal" }`. Setting a flag is idempotent
  (it is a Set), so re-reading a note is harmless. One-shot effects (`log`,
  `kill`, `loadLevel`, `questUpdate`) stay on choices, where they fire once on
  selection.
- Any node can require flags or a quest stage with `conditions`, and redirect to
  another node with `else` when they are not met:

```json
"start": {
  "conditions": { "flag": "read-warden-journal" },
  "else": "sealed",
  "lines": ["... his journal placed the key behind a loose stone ..."]
},
"sealed": {
  "lines": ["... it will not give without the key; he hid it somewhere ..."]
}
```

`conditions` supports `flag` (one required), `flags` (all required), and
`questStages` (`{ "quest-id": "stage" }`). Flags are run-global: they survive
level transitions within a run and clear on a fresh start (R). The worked example
is the warden's wall safe (`ash-chapel-warden-safe-locked`), which only names the
key's hiding place after the warden's journal (`ash-chapel-warden-journal`, which
sets the flag) has been read.

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
- Can dialogue choices test field ratings, scars, Trace, faction clearances, or companion presence?
