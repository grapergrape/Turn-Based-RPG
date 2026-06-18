# anti_ai_slop_writing_skill

A vendored, self-contained writing skill that **any AI/code assistant must apply
to all player-facing text** in this repo (dialogue, item/enemy/actor descriptions,
level intros/briefings/logs, UI strings, barks).

- The rules live in [`SKILL.md`](./SKILL.md). Start there.
- It is made binding from the repo root: see the **Player-facing writing** rule in
  `../AGENTS.md` (read by Codex and other agents) and the writing-rules pointers in
  `../docs/CONTENT_PIPELINE.md`, `../docs/systems/dialogue.md`, and
  `../docs/story/story-dialogue-workflow.md`.

Headline rule: **no em-dashes, no `--`, no `—`** in player-facing text. Rewrite
with periods, commas, colons, or restructuring. See the dash-rewrite guide in
`SKILL.md`.

Adapted from **jalaalrd/anti-ai-slop-writing**
(https://github.com/jalaalrd/anti-ai-slop-writing), vendored here so it works
offline and applies to every agent directly rather than as an optional command.
