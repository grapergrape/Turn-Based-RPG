# Story and Dialogue Workflow

This file defines where narrative work goes before the game has runtime quest and dialogue data.

> Any line that will become player-facing must follow
> `anti_ai_slop_writing_skill/SKILL.md` (no em-dashes / `--` / `—`, no AI-tell
> phrasing). Apply it while drafting, not only at the end.

## Where to Write

Use these files for design work:

- `docs/story/world.md` for regions, factions, history, tone, and world rules.
- `docs/story/characters.md` for companions, faction leaders, recurring NPCs, motives, relationships, and dialogue notes.
- `docs/story/quests.md` for campaign arcs, quest beats, objectives, branching outcomes, and consequences.
- `docs/story/story-dialogue-workflow.md` for the authoring workflow and scene packet format.
- `docs/systems/dialogue.md` for dialogue rules, future runtime shape, and UI/system requirements.

Do not write final dialogue only inside `docs/story/quests.md`. A quest beat without dialogue pressure is too abstract. Dialogue without a quest beat floats outside gameplay.

When runtime dialogue exists, move playable dialogue data to `data/dialogue/` and keep `docs/story/` as the design source. Until then, write compact scene packets in the story docs.

## Canon Order

Use this order when resolving conflicts:

1. `docs/lore/the_host_story_bible.md`
2. `docs/LORE_INTEGRATION.md`
3. `docs/story/world.md`
4. `docs/story/characters.md`
5. `docs/story/quests.md`
6. `docs/story/story-dialogue-workflow.md`
7. `docs/systems/dialogue.md`
8. Future runtime data under `data/dialogue/` and `data/quests/`

If dialogue contradicts the story bible, fix the dialogue. If a quest needs a canon change, update the story bible deliberately before writing scenes around the change.

## Writing Unit

Write story and dialogue as a **scene packet**.

A scene packet is the smallest useful narrative unit. It contains one playable situation, one pressure, the characters present, the dialogue purpose, and the consequences. This keeps story and dialogue tied to gameplay.

Use scene packets for:

- quest openings,
- companion recruitment,
- faction negotiations,
- moral decisions,
- combat barks that reveal stakes,
- post-combat consequences,
- exploration discoveries with character reactions.

Do not start by writing long screenplay pages. Start with the packet, then expand only the lines the scene needs.

## Scene Packet Template

```text
## Scene: [short title]

Quest: [quest or act]
Location: [map or region]
Characters: [speakers and silent pressure characters]
Player State: [required prior choice, faction status, item, companion, or Trace state]

Purpose:
[One or two sentences. What changes because this scene exists?]

Pressure:
[What makes the scene hard: time, law, infection, guilt, hunger, faction force, companion conflict.]

Voice Card for Each Named Speaker:
- Background: [work, household, class, faction, and place]
- Present pressure: [what this person needs from this exchange]
- Social tactic: [how this person handles the listener]
- Working vocabulary: [concrete nouns and verbs natural to this person]
- Syntax range: [how calm and pressured speech differ]
- Avoidance: [what this person will not name plainly]
- Private contradiction: [where conduct weakens the stated position]

Player Choice:
- [choice A]
- [choice B]

Exchange Shape:
[Describe who takes the initiative and why this scene needs its particular
shape. A correction, refusal, bargain, interruption, test, or story may replace
a question and answer.]

Necessary Turns:
- [turn that changes information, pressure, or trust]
- [turn that creates the player decision or consequence]

Sample Lines:
- Speaker: "Line."
- Speaker: "Line."

Consequences:
- [quest state]
- [reputation or faction effect]
- [companion reaction]
- [world state or later callback]

Dependencies:
- [canon file, character entry, location, system, or data need]

Open Questions:
- [only questions blocking implementation]
```

## Dialogue Rules

Dialogue should be short enough to survive inside a tactical RPG.

Compact does not mean identical. Do not standardize named NPC scenes into an
opening work gesture, one question, a two-line answer, and generic back and exit
choices. Derive the graph from the exchange pressure. A busy clinician may make
the player choose one need. A suspicious driver may question the player first.
A teacher may refuse to explain until the player reads the evidence.

Write lines that do at least one job:

- reveal a fact,
- apply pressure,
- expose a motive,
- force a choice,
- mark a consequence,
- show how a faction thinks,
- change how the player reads a character.

Cut lines that only restate mood.

Good line:

```text
Victorinus: "There are six children in that cellar. There are three thousand people behind this gate. Choose your mercy carefully."
```

Weak line:

```text
Victorinus: "This is a dark and difficult time for all of us."
```

## Tone Checks

Before keeping a scene, check these:

- Does it show one practical need: water, food, law, shelter, medicine, road access, quarantine, truth, or survival?
- Does at least one person have a defensible reason?
- Does the dialogue avoid generic zombie, generic cult, and generic evil-church language?
- Does a Host scene follow the Vale Imprint?
- Does the scene put story pressure into a player choice, route, fight, cost, or later callback?
- Does the player learn something specific?

## Quest and Dialogue Pairing

Every quest entry should have at least these dialogue anchors:

- **Entry scene:** why the player is involved.
- **Pressure scene:** what makes the obvious solution costly.
- **Choice scene:** where the player chooses or commits.
- **Consequence scene:** who reacts after the choice.

A small side quest can use four short scenes. A main quest can have more, but each added scene must change information, pressure, or consequence.

## Character Dialogue Notes

Character entries in `docs/story/characters.md` should include dialogue constraints when a character becomes active in scenes:

- the work, household, class, faction, and place that formed them,
- what they need from the current exchange,
- the social tactic they use on a listener,
- the concrete vocabulary they reach for,
- how their syntax changes under pressure,
- what they refuse to say plainly,
- the contradiction between their stated belief and conduct.

Keep these notes short. Compare nearby speakers before drafting. At least two
meaningful voice axes should separate each neighbor, and a line moved to another
named speaker should require revision. A profession noun or catchphrase does not
count as a full voice.

For a location-wide pass, read conversations in player order and then group them
by generator. Search repeated prose, explanatory tails, clipped sentence runs,
choice labels, and graph shapes. Repeated `Leave` or `Back` labels may be useful
interface language. Repeated authored questions and identical NPC loops are not.

## Future Runtime Data

When dialogue becomes playable, add `data/dialogue/` only after one scene needs to run in-game.

Runtime dialogue files should reference:

- stable dialogue ID,
- quest ID,
- speaker IDs,
- conditions,
- nodes,
- choices,
- consequences,
- optional bark lines.

Do not hardcode conversations in JavaScript. Systems should load dialogue by ID and apply consequences through quest, faction, companion, or world-state data.
