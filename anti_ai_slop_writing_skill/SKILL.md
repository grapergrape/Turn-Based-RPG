---
name: anti-ai-slop-writing
description: Review, write, and revise player-facing RPG text so it has natural sentence movement, distinct character voices, situation-specific dialogue structures, and concrete in-world diction. Use for dialogue, choices, barks, narration, journals, logs, descriptions, quest text, UI copy, and corpus-wide narrative audits, especially when speakers sound interchangeable or generated text repeats clipped sentences, stock transitions, or one conversation template.
---

# Anti-AI-Slop Writing

Apply this skill to every player-facing line in this repository. Treat clean
punctuation as the minimum. The real standard is a cast whose members think,
speak, evade, and argue differently.

## Scope

Review all text a player can read:

- dialogue lines and choice labels in `data/dialogue/`
- level intros, briefings, combat intros, object text, and trigger logs
- item, enemy, actor, companion, technique, and quest copy
- barks, readouts, journal updates, map labels, and UI strings in code
- generators and content sources that emit any of the above

Apply the same standard to narrative design docs. When generated files are
involved, edit the authoritative source and regenerate. Never polish generated
JSON while leaving the generator unchanged.

## Non-negotiable failures

Do not ship any of these:

1. An em dash or doubled hyphen in player-facing text. Rewrite the sentence.
2. Stock assistant language, corporate prose, or essay transitions.
3. An ornamental rule of three used for rhythm instead of meaning.
4. A clipped ladder of short statements used as the default dramatic voice.
5. One dialogue skeleton reused across a cast with only nouns changed.
6. Named speakers whose lines survive a name swap without revision.
7. Invented facts that conflict with the story bible or established state.

Three required facts may still appear together when the content demands them.
State them plainly and avoid turning nearby prose into matching triples.

## Work in this order

### 1. Find the source of truth

Locate the runtime data, generator, cast ledger, quest contract, and relevant
canon before editing. Preserve IDs, conditions, effects, flags, items, and quest
transitions unless the request changes them.

### 2. Classify the text surface

Choose the form before choosing the words:

- spoken dialogue
- player choice
- neutral observation
- character-filtered observation
- field report, ledger, prayer, note, warning, or other diegetic document
- system feedback or reusable UI affordance

Do not apply dialogue mannerisms to system text. Do not make a frightened note
sound like a neutral inspection. Reusable interface labels such as `Leave` or
`Back` may repeat because consistency helps the player. Authored prose and
character-specific choices do not receive that exemption.

### 3. Write a private voice card

Before drafting a named speaker, record these decisions in the nearest cast or
story source, or in the generator when that is the authoritative source:

- **Background:** Which work, household, class, faction, and place formed them?
- **Present pressure:** What do they need from this exchange right now?
- **Social tactic:** Do they instruct, bargain, flatter, accuse, test, confess,
  gossip, evade, or make the listener do the verbal work?
- **Working vocabulary:** Which concrete nouns and verbs come naturally?
- **Syntax range:** What happens to their sentences when calm, busy, or afraid?
- **Avoidance:** Which fact or feeling will they circle instead of naming?
- **Private contradiction:** What do they claim that their behavior weakens?

Do not reduce a voice to a verbal gimmick. An accent, repeated catchphrase, or
profession word does not make a character distinct by itself.

### 4. Compare the local cast

Place the voice cards for characters in the same location side by side. Separate
each neighboring speaker on at least two meaningful axes, such as social tactic,
syntax, degree of certainty, relationship to authority, or what they refuse to
name. Shared local vocabulary is useful. Shared rhetorical behavior is not.

Use two tests:

- **Name-swap test:** Move a line to another named speaker. If it still fits,
  rewrite it or decide why both people genuinely share that speech.
- **Silhouette test:** Hide names and job titles from several exchanges. A reader
  should still infer who is speaking from priorities and verbal behavior, not
  from a catchphrase pasted into every line.

### 5. Choose a scene shape from the pressure

Let the situation control the conversation graph. Possible shapes include a
refused question, an unsolicited instruction, a correction, a price negotiation,
a story that keeps dodging its point, an interrogation, an interruption by work,
or an answer that closes one subject and exposes another.

Do not give many NPCs this universal frame:

1. Narration describes the NPC handling a work object.
2. The player asks one topic question.
3. The NPC gives two explanatory quotations.
4. The player chooses `Ask about something else` or `Let them return to work`.

Changing the work object does not change that voice. Vary node count, initiative,
answer length, follow-up ownership, exit language, and whether the speaker ever
answers directly. Keep graphs compact, but make their compactness situational.

### 6. Draft for speech acts, not lore delivery

Every line should do something to the other person: warn, conceal, bargain,
correct, recruit, delay, shame, comfort, or force a decision. Deliver necessary
facts through that action. Cut lines that merely explain the setting in the
same polished register.

Let people misremember small things, restart a sentence, answer the dangerous
part indirectly, or use a concrete example instead of a thesis. Do not add such
features mechanically. Natural speech is uneven because attention and motive
are uneven.

## Sentence movement

Short sentences are allowed. A run of them must belong to a speaker and a
moment, not to the author’s default setting.

Flag a clipped ladder when several nearby units have most of these traits:

- similar length
- repeated subject-first declaratives
- isolated fragments that only simulate gravity
- repeated openings such as `I did`, `It is`, `They came`, or `No more`
- an explanatory tail such as `That is what`, `That is why`, or `This is the part`
- the same rhythm recurring in unrelated speakers, notes, and narration

Bad default cadence:

`Safe. Good. That is good. The road holds. We can move.`

Mechanic under pressure:

`Pressure held through the west joint. I do not trust the patch, but it will
carry until morning if nobody leans on the valve.`

Parent hearing the same news:

`Then my boys sleep downstairs tonight. Wake me if that joint starts knocking.`

The revision works because each person values different evidence and performs a
different social action. It is not a formula for making every sentence longer.

Vary how sentences are built, not by following a preset short-long-short pattern.
Use coordination, subordination, interruption, fragments, or silence only when
the speaker’s thought and pressure call for them.

## Diction and punctuation

Prefer specific physical nouns and active verbs over atmosphere labels. Let the
world’s dread come from what happened to a body, ledger, machine, meal, grave,
or household.

Rewrite these suspect words and phrases unless their literal use is necessary:

`delve`, `tapestry`, metaphorical `landscape`, `testament`, `vibrant`, `pivotal`,
`intricate`, `myriad`, `realm`, metaphorical `navigate`, `foster`, `leverage`,
`robust`, `seamless`, `nuanced`, `multifaceted`, `underscore`, `bustling`,
`whisper of`, `dance of`, `symphony of`, `beacon of`, `treasure trove`,
`ever-evolving`, `fast-paced`, `game-changer`.

Do not use these stock transitions or openers:

`In today's`, `It's worth noting`, `It's important to remember`, `Not just X,
but Y`, `At the end of the day`, `Needless to say`, `Rest assured`, `Certainly`,
`Moreover`, `Additionally`, `Furthermore`, `In conclusion`, `Ultimately`,
`That said`, `Whether you're`.

Use periods, commas, colons, question marks, and parentheses. Use an ellipsis
only when the actual omission or trailing speech matters. Avoid exclamation-mark
spam, emoji, markdown, and hashtags in player text.

When a dash seems necessary, decide whether the thought needs a period, a comma,
a colon, parentheses, or a complete restructure. Do not replace every dash with
two abrupt sentences. Read the resulting paragraph aloud for rhythm.

## Project voice

Keep the setting grim, concrete, and intimate. The Host and the Vale Imprint
produce religious body horror, but people still talk about meals, shifts, debts,
children, tools, grudges, and what must be done before dark. Do not make every
speaker solemn. Humor may be dry, cruel, nervous, practical, or absent according
to the person and scene. Avoid modern quips and generic evil-church language.

Faction membership shapes assumptions, not a shared monologue. A Censure clerk,
field medic, frightened novice, and veteran can disagree in syntax as well as
policy. Likewise, poverty does not give every civilian the same blunt fragments.

## Corpus review

Do not approve a large text pass by reading files in isolation.

Run `node anti_ai_slop_writing_skill/scripts/audit-player-text.mjs` from the
repository root before and after a corpus pass. Add `--json` for machine-readable
output, `--verbose` to print every lead, or `--hard-only` for continuous checks.
The audit fails on forbidden dash forms and reports cadence, phrase, label, and
graph repetition for human review.

1. Inventory every player-facing surface and its authoritative source.
2. Group dialogue by location, faction, profession, and generator.
3. Search exact repeated prose, repeated sentence openings, explanatory tails,
   three-beat constructions, and clusters of short declaratives.
4. Separate intentional UI repetition from authored-language repetition.
5. Compare conversation topology and navigation labels across named NPCs.
6. Read adjacent characters in sequence, then compare distant characters who
   should sound unlike one another.
7. Inspect choice labels as writing. They should express player intent clearly
   without echoing one stock question in every conversation.
8. Regenerate content and repeat the audit on shipped JSON.

Treat automated findings as review leads except for hard punctuation and banned
phrase failures. A detector cannot know whether terse speech belongs to a
terrified guard. It can show that the same terse speech appears in a medic, a
child, and a century-old report.

## Structural narrative guardrails

Use the corpus-level findings in the StoryScope study of 61,608 stories as
review prompts, not as a mechanical recipe for making prose look human. Surface
style edits do not repair a story whose narrative habits remain unchanged.

During upstream story review, look for clusters of these tendencies:

- themes, motives, or morals explained after the scene has already shown them;
- one clean causal track in which every event exists to serve the main plot;
- embodied sensations attached to every emotion whether or not the viewpoint
  would notice the body then;
- dialogue that defaults to explicit philosophy instead of local pressure;
- conflicts and endings resolved more neatly than the established costs allow;
- summaries that close ambiguity before characters have earned certainty.

Do not add a subplot, rumor, dream, flashback, interruption, unresolved ending,
or conflicting account merely to defeat a detector. Use one only when it grows
from an existing person, institution, material pressure, or gap in knowledge.
The goal is stronger narrative causality and human attention, not statistical
camouflage.

## Self-check

### Line and scene

- [ ] No em dash or doubled hyphen appears in player-facing text.
- [ ] No stock assistant phrase or ornamental triple remains.
- [ ] Sentence structure follows the speaker’s thought, not a rhythm formula.
- [ ] The scene has a specific pressure and each line performs an action.
- [ ] Facts, effects, and canon remain correct.

### Character and document

- [ ] Every named speaker has a private voice card.
- [ ] Calm and pressured syntax differ without becoming a gimmick.
- [ ] The name-swap and silhouette tests pass.
- [ ] Each document sounds written for its actual purpose and reader.

### Cast and corpus

- [ ] Neighboring NPCs differ on more than profession nouns.
- [ ] Conversation graphs do not reuse one authored skeleton across the cast.
- [ ] Repeated prose and choice labels have been reviewed in context.
- [ ] Generated output was audited after regeneration.
- [ ] Representative scenes were read aloud or played in sequence.

If any check fails, revise before shipping.
