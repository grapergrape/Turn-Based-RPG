# Anti-AI-Slop Writing (MANDATORY for player-facing text)

Vendored, self-contained writing skill. **Any AI/code assistant** working in this
repo — Codex, Claude, ChatGPT, Copilot, anything — **must apply this skill to all
player-facing text** before writing or editing it. No exceptions, no opt-in.

Adapted for this project from **jalaalrd/anti-ai-slop-writing**
(https://github.com/jalaalrd/anti-ai-slop-writing). Vendored so it works offline
and binds every agent directly; see that repo for the upstream source.

---

## When this applies

Apply it to anything a player can read in-game or that ships as narrative:

- `data/dialogue/*.json` — node lines and choice labels
- `data/levels/*.json` — `intro`, `briefing`, `combatIntro`, trigger `intro`, object `log`
- `data/items/*.json`, `data/enemies/*.json`, `data/actors/*.json` — `description`, `background`
- Any UI string, bark, readout, or log line written in code

Lore/design docs under `docs/` should follow it too, but player-facing text is
non-negotiable.

---

## The hard rules (these are the obvious "AI wrote this" tells)

1. **NO em-dashes. NO `--`. NO `—`.** This is the single biggest tell and the
   reason this skill exists. Do not use a dash to join clauses or drop an aside.
   Rewrite instead (see the dash-rewrite guide below). In this project the bitmap
   font also renders `—` as a stray `-` and `--` as a broken double hyphen, so it
   looks bad *and* reads as AI slop.
2. **No "rule of three."** Avoid the reflexive triple ("ordered, monumental, and
   watched", "find the cell, end it, move on" stacked over and over). One or two
   beats. Vary it.
3. **No hedging seesaw.** Don't qualify, counter-qualify, then re-qualify. Commit
   to a statement.
4. **Vary sentence length.** Do not write paragraph after paragraph of same-length
   sentences. Short. Then a longer one that breathes. Then short again.
5. **No corporate-pep / essay-transition tone** in fiction. No "Moreover",
   "Furthermore", "It's worth noting", "In a world where…", "Ultimately".
6. **No invented facts.** No fabricated numbers, fake quotes, or made-up history
   that contradicts `docs/lore/the_host_story_bible.md`.
7. **Plain punctuation.** No `…` ellipsis sprinkled for mood (one, rarely). No
   exclamation-mark spam. No emoji, no markdown, no hashtags in player text.

## The dash-rewrite guide (do this every time you reach for `--`)

A dash almost always wants to be one of these:

- **A period.** Two sentences. `He is not a man. Not anymore.`
- **A comma**, for a light aside. `The altar, still warm, holds the bowl.`
- **A colon:** when the second half explains the first. `One lesson: open the body.`
- **Parentheses ()**, for a true aside.
- **A full restructure** so the dash is not needed at all. Usually the best fix.

Example. Bad: `You walk the ash roads -- you find the cell -- you put it down.`
Good: `You walk the ash roads. You find the cell. You put it down.`

## Banned / suspect vocabulary (rewrite to plain words)

delve, tapestry, landscape (as metaphor), testament, vibrant, pivotal, intricate,
myriad, realm, navigate (as metaphor), foster, leverage, robust, seamless,
nuanced, multifaceted, underscore, bustling, whisper of (cliché), dance of,
symphony of, beacon of, treasure trove, ever-evolving, fast-paced, game-changer.

## Banned phrases / openers

"In today's …", "It's worth noting", "It's important to remember", "Not just X,
but Y", "At the end of the day", "Needless to say", "Rest assured", "Certainly,",
"Moreover,", "Additionally,", "Furthermore,", "In conclusion,", "Ultimately,",
"That said,", "Whether you're … or …".

## Voice for THIS project

Grim, plain, concrete, period-correct gothic sci-fi horror. Short declaratives.
Sensory, specific nouns over abstractions. Let dread come from what is described,
not from adjectives. A weary cult-breaker, a frightened priest, and a cult that
believes its own gospel should each sound like themselves, not like a press release.

## Self-check before you finish any player-facing text

- [ ] Zero `--`, `—`, em-dashes. (Search the file. If you find one, rewrite it.)
- [ ] No banned word / phrase / opener slipped in.
- [ ] Sentence lengths vary; no wall of identical clauses.
- [ ] No reflexive rule-of-three.
- [ ] No fabricated facts; consistent with the story bible.
- [ ] It sounds like a person in this world wrote it, not an assistant.

If you cannot honor this, do not ship the text.
