# Those Who Heard the Bell

Parent package: [Long Ash Road Approach](../../README.md). Child-map registry:
[Long Ash Road Approach Submaps](../README.md).

## Status

This plan was implemented for the two graveyard chapels on the Long Ash Road
Approach on 2026-07-12. The approved story remains locked. Later work may refine
coordinates after scene renders, but it must not change the people, revelation,
decision, or consequence structure recorded here.

The quest is an optional Act I mystery. It is never required to advance the
Hallowfen route. Its design reference is the layered discovery and later
reactivity of a strong CRPG secret, not the story or puzzle content of another
game.

## Approved story lock

The two chapels hold one mystery in separate halves:

- The Vigil Chapel preserves the human truth.
- The Mortuary Chapel hides the official truth.
- Together they reveal that the calcified graveyard dead can still perceive
  the world, that a road office measured their responses, and that something
  near Hallowfen has started calling to them again.

Before the Stilling, families kept watch beside their dead in the Vigil Chapel.
Afterward, Keziah Fullo became caretaker of the new graveyard. Her brother Jeremiah
was among the eleven calcified people planted upright in the ash.

Road officials classified them as remains. Keziah believed they could still hear
her. She recorded every response in a hidden Book of Kept Names. The specific
mourning ring concealed at Jeremiah Fullo's grave belonged to Keziah and opens her
compartment without damage.

The Vigil Chapel contains twelve candle cups, though only eleven calcified
people stand outside. One cup has been hammered flat. Keziah's register contains
twelve names. The missing person is Sapphira Rufa.

The Mortuary Chapel once washed and prepared bodies. After the Stilling, the
first road wardens converted its lower room into an examination house. They
tested responses to bells, familiar voices, prayer, and pain. Publicly they
called every movement settling. Their measurements show deliberate responses.

Sapphira Rufa produced the strongest result. His head turned toward Hallowfen before
its bells sounded. The wardens removed him from the graveyard and sealed him in
a listening niche beneath the mortuary. Old measurements stopped decades ago.
Fresh scratches show that he has begun turning north again.

The optional test remains exact:

- One strike produces movement beneath the stone.
- A second strike lets Host Signs, Medicine, or existing Trace recognize
  deliberate breathing or hear Sapphira.
- A third strike begins to thaw him.
- Containment or Doctrine can quiet him. Keziah's cadence and mortuary quieting
  salt provide guaranteed noncombat routes.
- Breaking the niche or attempting a crude extraction releases a human-sized
  Host form as an optional encounter.

The central line remains:

> The bell below us rang first.

The combined discovery proves four things without explaining Europa, Father
Vale, the Vale Imprint, or the true mechanism of the Stilling:

- The calcified people are still aware.
- An institution that became part of the modern Holy Remnant knew.
- Sapphira responded to Hallowfen before its physical bells rang.
- The condition that held them still is weakening.

The three final decisions remain exact:

- Keep the vigil. Reseal and quiet Sapphira when he still lives, restore the twelve
  names, and hide Keziah's register again.
- Perform censure. Destroy Sapphira and provide the location of the other eleven to
  the Remnant.
- Take the evidence. Preserve Keziah's register and the examination docket for
  later use, leaving Sapphira sealed unless the player has already disturbed him.

If the player kills Sapphira before making the records decision, the same three
outcome flags remain available. Later dialogue must acknowledge that keeping a
vigil cannot undo the killing.

## Experience contract

The secret follows these rules:

- Either chapel may be entered first.
- No failed check permanently blocks the story.
- The Jeremiah grave clue, the register, the body descriptions, the tags, and the
  docket each provide useful information on their own.
- Specialized fields shorten routes or preserve evidence. They do not replace
  exploration.
- The strongest dusk scene is optional. Daytime completion remains possible.
- Sapphira carries no loot. Killing him is never the profitable answer by itself.
- Immediate containers hold believable field supplies. Unique rewards arrive
  later through people and institutions reacting to the chosen outcome.
- The quest cracks official doctrine without explaining the hidden cosmology.

## Level graph

```text
Long Ash Road Approach
  Vigil Chapel
  Mortuary Chapel
    Listening Vault
```

Planned level ids and files:

- `long-ash-vigil-chapel` in
  `data/levels/long_ash_vigil_chapel.json`
- `long-ash-mortuary-chapel` in
  `data/levels/long_ash_mortuary_chapel.json`
- `long-ash-listening-vault` in
  `data/levels/long_ash_listening_vault.json`

The chapel interiors are spatial abstractions, as are the existing farm
interiors. They should still feel small. The Vigil Chapel has one narrow room.
The Mortuary Chapel has a larger working floor. The Listening Vault has a single
chair facing a sealed niche.

## Exterior integration

The chapel art and core graveyard geometry remain unchanged. The Censure
attendant shrine stands on the open cemetery earth between the chapel fronts.

- Vigil Chapel footprint: `x130..131`, `y45..46`.
- Vigil entry apron: `x131`, `y47`.
- Mortuary Chapel footprint: `x141..142`, `y44..46`.
- Mortuary entry apron: `x142`, `y47`.
- Censure attendant shrine: `x136`, `y48`.
- Existing catacomb mouth: `x143`, `y48`.

Each entry apron becomes a nonblocking interaction object using the existing
graveyard path-stone art. Clicking it opens a short door dialogue and loads the
corresponding interior. This preserves the exterior façades, roofs, and aligned
doors that are already rendered as connected chapel blocks.

Map markers appear only after the player explores the graveyard. The catacomb
mouth remains inert until it is opened from inside the Listening Vault. It then
becomes a two-way shortcut between the graveyard and the lower room.

Exterior interaction ids:

- `long-ash-vigil-chapel-entry`
- `long-ash-mortuary-chapel-entry`
- `long-ash-mortuary-catacomb-mouth`

## Vigil Chapel layout

Size: 10 by 9 tiles.

Player entry: `x4`, `y7`.

Exterior return: paired door leaves at `x4..5`, `y8`.

```text
   0123456789
00 ##W#R#W###
01 #........#
02 P..cF.cB.#
03 #........#
04 #...C.L..#
05 #........#
06 A........#
07 #...>....#
08 ####DD####
```

Layout key:

- `W`: dim chapel window.
- `R`: wall rack with twelve candle cups and one crushed cup.
- `P`: Keziah's concealed wall panel.
- `c`: candle cluster on a waxed floor patch.
- `F`: small chapel font.
- `B`: cut bell rope and empty clapper hook.
- `C`: Keziah's gravekeeper chair, facing the candle rack.
- `L`: prayer lectern.
- `A`: wall alms box.
- `>`: return transition target.
- `D`: chapel door leaves.

The middle aisle stays open. Keziah's chair sits off center so the player can
stand where she sat without blocking the route. Low props remain away from the
front wall line so the isometric painter does not hide them.

### Vigil Chapel interaction flow

The candle rack is readable on first entry. It establishes twelve cups and one
crushed place before the player knows why.

Keziah's panel supports four approaches:

- Use the mourning ring from Jeremiah's grave. This requires both
  `looted-ilyen-marr-grave` and one `mourning-ring`. The ring is not consumed.
- Search 40 finds the soot-lined seam and opens the panel intact.
- Doctrine 40 restores the omitted vigil line and releases the prayer catch.
- Body 4 forces the stone. The compartment opens, but several register pages
  tear at the binding.

The Body route sets `heard-bell-register-damaged`. Every route sets
`heard-bell-vigil-panel-opened` and one route flag for later dialogue.

The compartment is a story interaction, not a normal loot container. Pack
capacity must never prevent reading the register. It contains the Book of Kept
Names, the removed clapper, Keziah's notes, and her waxed name slips.

Reading the register sets `heard-bell-register-read`. It does not immediately
put the book in the inventory. The book remains in the wall until the final
records decision.

After reading it, the candle rack gains name choices:

- Speak Susanna Niger's name. One stone tooth clicks outside. Set
  `heard-bell-lysa-answered`.
- Speak Jeremiah Fullo's name. Packed ash shifts at his grave and reveals the
  Gravekeeper's Brass Key. Set `heard-bell-ilyen-answered` and add
  `gravekeeper-brass-key` once.
- Speak another kept name. The room remains still, preserving uncertainty.

The key is a quiet bypass for the Mortuary Chapel counterweight. Security and
Engineering remain valid alternatives.

### Locked player-facing Keziah excerpts

Keziah's voice rule:

- Background: gravekeeper and surviving sister.
- Pressure: protect the calcified without giving the road office language it
  can use against them.
- Vocabulary: wax, chairs, teeth, ash, cloth, names, and bells.
- Syntax: practical observations followed by rare personal admissions.
- Avoidance: she does not call them alive because that word would bring fire.

Keep these approved excerpts:

> I asked Aaron if the stone still hurt. Two cracks came through the chair beneath my hand, and I did not ask him again.

> Susanna heard the bell while the rope was still in my fist. She struck her teeth until I cut out the clapper.

> Jeremiah knew my step. The ash moved at his feet before I touched the gate.

## Mortuary Chapel layout

Size: 14 by 11 tiles.

Player entry: `x6`, `y9`.

Exterior return: paired door leaves at `x6..7`, `y10`.

```text
   01234567890123
00 ###T###S##W###
01 #......s.....#
02 #............#
03 #..b......b..#
04 #............#
05 L.t...M......C
06 #....dd......#
07 #..P......I..#
08 #............#
09 #.....>......#
10 ######DD######
```

Layout key:

- `T`: brass identification tag board.
- `S`: concealed counterweight door in the north wall.
- `s`: stair landing, hidden until the counterweight opens.
- `W`: dim chapel window.
- `b`: stone preparation bier.
- `L`: road warden lockbox set into the west wall.
- `t`: wash tub.
- `M`: mortuary washing table.
- `C`: linen cabinet set into the east wall.
- `d`: floor drains and old wash marks.
- `P`: preparation prayer lectern.
- `I`: worn saint statue.
- `>`: exterior return target.
- `D`: chapel door leaves.

The washing table owns the center of the room but leaves a two-tile circulation
path around it. The biers remain separated so each reads as a working surface,
not a row of treasure chests.

### Mortuary tag puzzle

The tag board uses three symbols already visible on the named graveyard bodies:

- A broken circle belongs to Sister Monica.
- An opened ribcage belongs to Thomas Silo.
- A bell-shaped mouth belongs to Susanna Niger.

The Book of Kept Names states the matching order. A player who inspected the
bodies can solve it without the book. Host Signs 40 identifies that the symbols
record transformed anatomy rather than causes of death.

Correctly matching all three sets `heard-bell-tags-matched` and opens the
counterweight route. A wrong answer returns the board to its first position
without consuming anything or locking the puzzle.

The concealed stair also supports these bypasses:

- Use `gravekeeper-brass-key` with no check.
- Security 40 walks the old mortuary pins.
- Engineering 40 releases the counterweight through its inspection slot.

Each bypass sets its own route flag and then sets
`heard-bell-mortuary-stair-opened`. The player may descend immediately or finish
searching the upper room.

## Listening Vault layout

Size: 15 by 15 tiles.

Player entry: `x7`, `y13`.

Mortuary return: `x7`, `y14`.

```text
   012345678901234
00 ###############
01 #######S#######
02 #######D#######
03 #.............#
04 #.............#
05 #.............#
06 #....B....K...#
07 #.....www.....#
08 #..A...w......#
09 #......C......#
10 #...........O.#
11 #..c.......c..#
12 #.............#
13 #......>......#
14 #######E#######
```

Layout key:

- `S`: Sapphira Rufa inside a one-tile hidden niche.
- `D`: sealed niche door linked to door group `sava-listening-niche`.
- `A`: examiner's assay case.
- `B`: listening bell apparatus.
- `K`: examination docket on its lectern.
- `w`: copper listening wires laid across the floor.
- `C`: restraint chair facing the niche.
- `c`: small candle clusters.
- `O`: ash-choked shortcut to the exterior catacomb mouth.
- `>`: return landing.
- `E`: stair exit to the Mortuary Chapel.

The niche cell at `x7`, `y1` is a hidden region while its door remains closed.
This keeps Sapphira, his floor, and his combat marker out of the scene until the
player deliberately opens the niche.

The room uses no gore scatter. Its horror comes from measurement marks, chair
wear, copper pins, and the fact that every tool faces one person in a wall.

The apparatus is offset west of the niche axis. The cells from `x7`, `y3`
through `x7`, `y8` remain open, giving the player a straight retreat lane after
the seal opens and room to circle either side. The restraint chair at `x7`,
`y9` preserves the room's sightline and provides a later light-cover branch.
With the niche open, the floor has 140 walkable combat cells instead of the
former 70.

Opening the shortcut at `x12`, `y10` sets
`heard-bell-catacomb-mouth-opened` and returns the player beside the exterior
mouth at `x143`, `y49`. After that flag is set, the exterior mouth can load the
Listening Vault at `x11`, `y10`.

### Docket and combined truth

The docket sits in the open because the wardens believed the locked vault was
enough protection. Reading it sets `heard-bell-docket-read`.

Examiner voice rule:

- Background: road mortuary clerk trained to record bodies as inventory.
- Pressure: preserve the measurements while obeying the order that forbids the
  word woke.
- Vocabulary: subjects, pins, copies, seals, response widths, and transfers.
- Syntax: numbered findings and corrective office language.
- Avoidance: pain and intention appear only as approved mechanical terms.

Keep this approved line:

> Subject Seven responded before the bell was struck. Brother Joel wrote "woke" in the first copy, so I burned it and replaced the word with "settled."

When both `heard-bell-register-read` and `heard-bell-docket-read` are present,
the second document read sets `heard-bell-truth-joined` and advances the quest to
`judge-vigil`.

Inspecting the sealed niche sets `heard-bell-sava-found`. This flag is separate
from quest stage so a player who reaches the vault first does not lose progress
or stage XP.

### Listening test

The bell apparatus is usable after the docket is read or Sapphira's niche is
inspected. Each strike is a deliberate dialogue choice.

First strike:

- Set `heard-bell-test-first`.
- The floor transmits one movement from inside the niche.
- The player may stop without penalty.

Second strike:

- Set `heard-bell-test-second`.
- Host Signs 40 recognizes anticipation rather than an echo.
- Medicine 40 identifies a slow deliberate breath.
- Trace 1 or higher hears Sapphira's approved line.
- A clean character feels the sentence as a measured vibration without words.

Third strike:

- Set `heard-bell-test-third` and `heard-bell-sava-thawing`.
- The niche seal cracks.
- Security 40 or Body 4 can now open it.
- Opening the niche reveals its hidden region and starts encounter
  `sava-listening-niche`.

Quiet routes become available after the second strike:

- Containment 40 applies the old pins in the safe order.
- Doctrine 40 recites Keziah's recovered cadence against the test bell.
- One `mortuary-quieting-salt` may be consumed.
- Reading Keziah's intact register unlocks a guaranteed cadence route with no
  field requirement.

Successful quieting sets `heard-bell-sava-quieted`. It does not prove that Sapphira
is safe. It proves only that he has stopped responding for now.

Opening the niche reveals an authored, roughly human-sized Host enemy. Sapphira
remains a person under the change. His design uses a long calcified face, one
broken bone arc, prayer-fused fingers on one hand, and a rib seam beginning to
open on only one side. Thin black-gold veins remain under the skin. He is not a
large boss, a clean golem, or a source of environmental light.

Killing him sets `heard-bell-sava-killed`. His body has no loot.

## Optional dusk scene

Once `heard-bell-truth-joined` is set, the player may sit in Keziah's chair and
choose to wait for dusk. The interaction advances the clock to 18:00, shows one
brief interlude, and sets `heard-bell-dusk-witnessed`.

Approved interlude text:

> The Vigil Chapel has no clapper. Its bell moves once.

> A crack passes through the graveyard. Eleven faces turn a fraction toward the north.

If Sapphira still lives:

> Stone answers beneath the mortuary floor.

If Sapphira has already been killed:

> Nothing answers below. The empty niche holds the silence.

This scene grants 10 XP once. It is atmosphere and confirmation, not a required
quest stage.

## Quest data

Quest id: `those-who-heard-the-bell`.

Title: `Those Who Heard the Bell`.

The quest loads when the player enters either chapel. The exterior level does
not list it, so a player who ignores both buildings does not receive a journal
entry.

Stages:

- `investigate-chapels`, initial. Task: `Search the graveyard chapels.`
  Description: `The smaller chapel keeps twelve candle places for eleven
  calcified dead. The mortuary has its own count.`
- `judge-vigil`, 50 XP. Task: `Find Sapphira Rufa and decide what remains.`
  Description: `Keziah Fullo kept twelve names. The road office buried Sapphira
  beneath the mortuary after he turned toward Hallowfen's bells.`
- `complete`, 50 XP. Task: `The twelve have been judged.` Description: `You
  chose what the road will remember about the twelve.`

The quest stage stays broad because discovery order is free. Flags record exact
clues and routes. Joining the two records advances to `judge-vigil`, even when
the player found Sapphira first. Any final outcome advances to `complete`.

## Flag registry

Every flag uses the `heard-bell-` prefix. The three outcome flags are mutually
exclusive. Tests must enforce that no dialogue path can set more than one.

### Discovery flags

- `heard-bell-vigil-entered`
- `heard-bell-mortuary-entered`
- `heard-bell-vigil-panel-opened`
- `heard-bell-vigil-panel-opened-ring`
- `heard-bell-vigil-panel-opened-search`
- `heard-bell-vigil-panel-opened-doctrine`
- `heard-bell-vigil-panel-forced`
- `heard-bell-register-damaged`
- `heard-bell-register-read`
- `heard-bell-lysa-answered`
- `heard-bell-ilyen-answered`
- `heard-bell-tags-matched`
- `heard-bell-stair-opened-key`
- `heard-bell-stair-opened-security`
- `heard-bell-stair-opened-engineering`
- `heard-bell-mortuary-stair-opened`
- `heard-bell-catacomb-mouth-opened`
- `heard-bell-noisy-lockbox`
- `heard-bell-docket-read`
- `heard-bell-truth-joined`
- `heard-bell-sava-found`
- `heard-bell-dusk-witnessed`

### Sapphira state flags

- `heard-bell-test-first`
- `heard-bell-test-second`
- `heard-bell-test-third`
- `heard-bell-sava-thawing`
- `heard-bell-sava-quieted`
- `heard-bell-sava-killed`
- `heard-bell-sava-resealed`
- `heard-bell-sava-left-sealed`

`heard-bell-sava-quieted` and `heard-bell-sava-killed` cannot both be set on the
same route. Opening the niche after quieting requires a separate warning choice
and clears the quiet state in runtime object state. If the flag system remains
add-only, later conditions treat `heard-bell-sava-killed` as authoritative.

### Outcome flags

- `heard-bell-resolved`
- `heard-bell-resolved-vigil`
- `heard-bell-resolved-censure`
- `heard-bell-resolved-evidence`

Supporting consequence flags:

- `heard-bell-names-restored`
- `heard-bell-register-rehidden`
- `heard-bell-censure-report-filed`
- `heard-bell-censure-report-acknowledged`
- `heard-bell-graveyard-purge-requested`
- `heard-bell-records-carried`
- `heard-bell-evidence-copied`
- `heard-bell-evidence-surrendered`

### Delayed reward flags

- `heard-bell-vigil-reward-claimed`
- `heard-bell-censure-reward-claimed`
- `heard-bell-evidence-reward-claimed`

## Final decision effects

### Keep the vigil

Default effects when Sapphira lives:

- Set `heard-bell-resolved`.
- Set `heard-bell-resolved-vigil`.
- Set `heard-bell-sava-quieted`.
- Set `heard-bell-sava-resealed`.
- Set `heard-bell-names-restored`.
- Set `heard-bell-register-rehidden`.
- Advance the quest to `complete`.

The Book of Kept Names and examination docket remain in their rooms. No unique
item is granted immediately.

If Sapphira was killed earlier, the same outcome remains available. Do not set
`heard-bell-sava-resealed`. The resolution line and later Mercy dialogue state
plainly that names were restored after Sapphira died.

### Perform censure

If Sapphira still lives, the choice commits the player to opening the niche and
destroying him. Combat is the physical cost of the decision. After Sapphira is dead,
the records interaction completes the report.

Final effects:

- Set `heard-bell-resolved`.
- Set `heard-bell-resolved-censure`.
- Set `heard-bell-censure-report-filed`.
- Set `heard-bell-graveyard-purge-requested`.
- Ensure `heard-bell-sava-killed` is present.
- Advance the quest to `complete`.

The player does not receive the Remnant reward at the graveyard. The report must
travel through the road office first.

### Take the evidence

Effects:

- Set `heard-bell-resolved`.
- Set `heard-bell-resolved-evidence`.
- Set `heard-bell-records-carried`.
- Set `heard-bell-sava-left-sealed` if Sapphira still lives.
- Add one `book-of-kept-names`.
- Add one `mortuary-examination-docket`.
- Advance the quest to `complete`.

This choice must preflight carry capacity before setting flags. The two records
weigh 0.4 kg together. If the pack is full, the dialogue tells the player to
make room and leaves the choice available.

## Delayed rewards and callbacks

Material rewards arrive later. The outcome flag is the source of truth. A claim
flag prevents duplication.

### Vigil reward

Location: a Mercy Order hospice in Hallowfen, preferably during Sister Perpetua
Aquila's first substantial scene.

Conditions:

- `heard-bell-resolved-vigil`
- absence of `heard-bell-vigil-reward-claimed`

Reward package:

- One `keepers-vigil-cord`.
- Two `field-dressing`.
- A later Mercy dialogue clearance for calcified or partially opened patients.

Set `heard-bell-vigil-reward-claimed` when accepted. If Sapphira was killed before
the vigil decision, Perpetua still gives the cord but names the contradiction.

### Censure reward

Location: Censure Road Camp after the player has reached the Hallowfen
checkpoint lead. Preceptor Aquila files the report. Sutler Judith issues the bundle,
matching the camp's existing delayed reward pattern.

Conditions:

- `heard-bell-resolved-censure`
- `heard-bell-censure-report-filed`
- `heard-bell-censure-report-acknowledged`
- absence of `heard-bell-censure-reward-claimed`

Reward package:

- One `road-purgation-writ`.
- Three `relic-rounds`.
- One `field-dressing`.
- Ten `ducat`.

Set `heard-bell-censure-reward-claimed` when the bundle is taken. The writ acts
as a later item-gated clearance for one field burn without a chapel court.

### Evidence reward

Location: the Lumen Compact presence in Hallowfen's Water Ledger Quarter. Dr.
Theophilus Celsus or a field assistant examines the records without explaining the Vale
Imprint.

Conditions:

- `heard-bell-resolved-evidence`
- both record items in the pack
- absence of `heard-bell-evidence-reward-claimed`

The player chooses one later transaction:

- Allow a copy. Keep both records, receive one `calibrated-listening-pin` and
  one `compact-suppressant`. Set `heard-bell-evidence-copied`.
- Surrender the originals. Remove both records with `requireAll`, receive the
  same two items plus twelve `ducat`. Set
  `heard-bell-evidence-surrendered`.

Both transactions set `heard-bell-evidence-reward-claimed`. A damaged register
changes Theophilus's dialogue but does not remove the unique reward.

## Item plan

### Existing item reused

`mourning-ring`

- The grave search at Jeremiah Fullo remains the canonical source for Keziah's ring.
- The panel route requires the grave-loot flag as well as the item, preventing
  the player's generic starting mourning ring from silently replacing Keziah's.
- The ring is not consumed.

### Immediate new items

`gravekeeper-brass-key`

- Name: `Gravekeeper's Brass Key`
- Type: `key`
- Rarity: `uncommon`
- Weight: `0.1`
- Ground model: `key`
- Purpose: quiet bypass for the Mortuary Chapel counterweight.
- Description: `A short brass key worn smooth at the bow. Candle soot fills one
  tooth, and pale stone dust fills another.`

`book-of-kept-names`

- Name: `Book of Kept Names`
- Type: `evidence`
- Rarity: `rare`
- Weight: `0.2`
- Ground model: `paper`
- Purpose: physical record granted only by the evidence outcome.
- Description: `Keziah Fullo's burial register. Each name has a candle mark beside
  it. The twelfth mark was crushed into the paper with a thumbnail.`

`mortuary-examination-docket`

- Name: `Mortuary Examination Docket`
- Type: `evidence`
- Rarity: `rare`
- Weight: `0.2`
- Ground model: `paper`
- Purpose: physical official record granted only by the evidence outcome.
- Description: `A road office docket that calls movement settling and pain
  response contraction. The last transfer points north.`

`mortuary-quieting-salt`

- Name: `Mortuary Quieting Salt`
- Type: `tool`
- Rarity: `uncommon`
- Weight: `0.1`
- Ground model: `dressing`
- Purpose: guaranteed consumable route for quieting Sapphira.
- Description: `Waxed paper folded around bitter grey salt. The label orders a
  pinch at the tongue and another at the bell hinge.`

### Delayed reward items

`keepers-vigil-cord`

- Name: `Keeper's Vigil Cord`
- Type: `trinket`
- Rarity: `rare`
- Weight: `0.1`
- Ground model: `necklace`
- Equipment slot: `trinket`
- Purpose: Mercy Order recognition and later patient dialogue routes.
- Description: `Black grave cord with twelve waxed knots. Mercy sisters know the
  promise it records: remember the name before judging the body.`

`road-purgation-writ`

- Name: `Road Purgation Writ`
- Type: `clearance`
- Rarity: `rare`
- Weight: `0`
- Ground model: `paper`
- Purpose: item-gated authority for one later field burn route.
- Description: `Preceptor Aquila's seal authorizes one field burn without waiting
  for a chapel court. The casualty line has already been ruled neat.`

`calibrated-listening-pin`

- Name: `Calibrated Listening Pin`
- Type: `tool`
- Rarity: `rare`
- Weight: `0.1`
- Ground model: `shard`
- Purpose: Lumen recognition and later calcified-tissue investigation routes.
- Description: `A Lumen needle tuned to catch movement inside calcified tissue.
  Its warning is cut beside the scale: do not call silence death.`

No new item grants raw combat power in this slice. Later dialogue and technique
requirements may reference the three reward items. Do not add a general
reputation system only for this quest.

## Container and chest manifest

There are four lootable containers. Story documents are excluded from normal
loot so pack capacity cannot interrupt the reveal.

### Vigil alms box

Location: Vigil Chapel, `x0`, `y6`.

Presentation: wall-set wooden alms box with a shallow false tray.

Access: unlocked. Search 25 reveals the false tray before looting.

Contents:

- Three `ducat`.
- One `tarnished-saint-token`.

Log: `Three old ducats and a rubbed saint token sit under a mat of candle
stubs.`

### Mortuary linen cabinet

Location: Mortuary Chapel, `x13`, `y5`.

Presentation: wall cabinet with rotten folded linen and three sealed packets.

Access: unlocked.

Contents:

- Two `field-dressing`.
- One `mortuary-quieting-salt`.

Log: `The linen has rotted around three sealed packets. Two still bear field
dressing stamps. The third smells of bitter salt.`

### Road warden lockbox

Location: Mortuary Chapel, `x0`, `y5`.

Presentation: small wall safe with the early road-office seal.

Access routes:

- Security 40 with `censure-entry-roll`.
- Doctrine 40 identifies the standardized diocesan pay catch and opens it.
- Body 4 pries the hinge and sets `heard-bell-noisy-lockbox` on failure.

Contents:

- Six `ducat`.
- Two `relic-rounds`.
- One `road-warden-chit`.

Log: `The lockbox holds road pay, two blessed cartridges, and a brass chit
stamped for the old gate.`

### Examiner's assay case

Location: Listening Vault, `x3`, `y8`.

Presentation: narrow metal field case with measurement scratches on the lid.

Access: Security 40 or Search 40. Failure never affects Sapphira.

Contents:

- Four `ducat`.
- One `field-dressing`.
- One `relic-rounds`.

Log: `A dressing and one cartridge remain in the examiner's case. Four ducats
lie under the measurement slate.`

### Immediate loot total

The complete optional route contains:

- Thirteen `ducat`.
- Three `field-dressing`.
- Three `relic-rounds`.
- One `road-warden-chit`.
- One `tarnished-saint-token`.
- One `mortuary-quieting-salt`.

This is a modest supply return for three small interiors. No armor, weapon, or
rare combat consumable appears in a chest. The later outcome rewards carry the
long-term value.

## Journal findings

Add flag-gated findings to the three interior levels. Duplicate text should be
avoided when quest stages already state the same fact.

- On `heard-bell-register-read`: `Keziah Fullo recorded deliberate responses from
  the calcified people in the graveyard.`
- On `heard-bell-docket-read`: `The road office measured those responses and
  filed them as settling.`
- On `heard-bell-truth-joined`: `Sapphira Rufa reacted to Hallowfen before its bells
  sounded.`
- On `heard-bell-resolved-vigil`: `The twelve names remain together. The
  listening niche is quiet for now.`
- On `heard-bell-resolved-censure`: `The road office has the graveyard location.
  A purgation order will follow.`
- On `heard-bell-resolved-evidence`: `Keziah's register and the mortuary docket
  are in your pack.`

## Required dialogue files

Keep each file focused on one interaction or scene packet:

- `long-ash-vigil-chapel-entry`
- `long-ash-vigil-chapel-exit`
- `long-ash-vigil-panel`
- `long-ash-book-of-kept-names`
- `long-ash-vigil-name-rack`
- `long-ash-mortuary-chapel-entry`
- `long-ash-mortuary-chapel-exit`
- `long-ash-mortuary-tags`
- `long-ash-mortuary-stair`
- `long-ash-mortuary-docket`
- `long-ash-listening-test`
- `long-ash-sava-niche`
- `long-ash-heard-bell-judgment`
- `long-ash-vigil-dusk-watch`
- `long-ash-listening-shortcut`
- `long-ash-listening-shortcut-return`

Delayed reward choices should extend the future Perpetua, Preceptor Aquila, Judith,
and Theophilus dialogue files instead of creating floating reward dispensers.

## Art and prop plan

Reuse these existing kinds:

- `wall`, `wall-window`, `wall-stash`, `wall-safe`, `wall-stair-door`
- `stone-stairwell`, `chapel-double-door`, `chapel-font`
- `prayer-lectern`, `saint-statue`, `stone-tomb`, `wash-tub`
- `candle-cluster`, `wax-stain`, `paper-scraps`, `floor-crack`

Add only the story-specific pieces that cannot read correctly through an
existing prop:

- `vigil-candle-rack`, a wall fixture with twelve cups and one crushed cup.
- `gravekeeper-chair`, oriented furniture with worn arms and a low human seat.
- `mortuary-washing-table`, oriented stone furniture with a shallow channel.
- `mortuary-drain`, a flat floor decal in stone and rust ramps.
- `mortuary-tag-board`, a wall fixture with three readable brass symbols.
- `listening-apparatus`, a structure containing the bell tongue and copper pin
  frame.
- `listening-wire`, a flat rust-colored floor decal.
- `sealed-listening-niche`, a door fixture with closed and opened states.

For Sapphira's encounter, add a dedicated animated actor style and verify all
facings and states. His body remains human-sized. The niche and candles own the
room's light. Sapphira has no baked backlight or glow beyond a tiny living wound
after thawing.

Every new kind is registered once in `src/render/spriteCatalog.js`, with drawing
code in the appropriate `src/render/primitives/` module exported through
`PixelPrimitives.js`.

## Small runtime extensions

The optional Sapphira reveal needs one reusable dialogue effect:

`openDoorGroup`

Behavior:

- Accept one door-group id.
- Open every linked object using the existing door-group helper.
- Refresh passability and hidden regions.
- Apply before `startCombat` when both effects appear on one choice.

This keeps the niche data-driven and avoids a second combat-only copy of the
Listening Vault. Document the effect in `docs/CONTENT_PIPELINE.md` and validate
that its value is a nonempty string.

Do not add quest-specific JavaScript. The renderer and combat systems must not
know who Sapphira or Keziah are.

Dialogue reward effects also need atomic capacity checks. Extend the existing
inventory preflight so an effect with item additions refuses the whole choice
when the pack cannot hold the complete bundle. Flags, quest updates, and claim
markers must not apply before the inventory check succeeds. This protects the
evidence choice and all three delayed reward bundles, while fixing the same loss
risk for existing dialogue rewards.

## Implementation file plan

Content and data:

- Update `scripts/gen-long-ash-road.mjs` with the two entry apron interactions
  and the activated catacomb-mouth callback.
- Regenerate `data/levels/long_ash_road_approach.json`.
- Add the three interior level files.
- Add `data/quests/those-who-heard-the-bell.json`.
- Add the immediate and delayed item files.
- Add the focused dialogue files.
- Extend future faction dialogues only when their locations exist.

Runtime and validation:

- Add the generic `openDoorGroup` effect callback.
- Make dialogue inventory additions preflight capacity before any other effect
  is applied.
- Extend dialogue-effect validation for that field.
- Add any new static kinds through the sprite catalog.
- Add Sapphira's enemy data and encounter only after the niche scene works without
  combat.

Documentation:

- Keep this plan linked from the Long Ash Road Approach submap registry.
- Update `docs/CONTENT_PIPELINE.md` only for the generic effect.
- Add the new items to the appropriate item documentation when implemented.
- Record the locked story premise in `.ai/memory/story.md`.

## Implementation order

1. Add quest, items, dialogue stubs, and exterior transitions.
2. Build the Vigil Chapel with its panel, register, names, and alms box.
3. Build the Mortuary Chapel with tags, containers, and stair routes.
4. Build the Listening Vault with docket, test, quiet routes, and judgment.
5. Add `openDoorGroup`, the niche reveal, and Sapphira's optional encounter.
6. Add the three outcome flags and delayed reward hooks.
7. Add journal findings, map markers, and return-state dialogue.
8. Render each new prop alone and each room in scene.
9. Run the complete check suite.

## Verification and tests

Automated checks must cover:

- Both exterior entry aprons exist at the approved coordinates and remain
  nonblocking.
- All three level grids have correct row lengths, valid spawns, and working
  return transitions.
- Every object kind is registered once.
- Every item and dialogue reference resolves.
- The panel can be opened through the ring, Search, Doctrine, or Body route.
- Only the Body route sets `heard-bell-register-damaged`.
- Both document orders can reach `heard-bell-truth-joined`.
- The tag puzzle and all three counterweight routes reach the vault.
- The third bell strike alone permits niche opening.
- Quieting does not start combat.
- Opening the niche reveals the hidden cell before combat starts.
- A full pack cannot consume an outcome or reward choice without granting its
  complete item bundle.
- Sapphira has no loot.
- Exactly one outcome flag is set on completion.
- Each delayed reward requires its outcome flag and absence of its claim flag.
- Evidence surrender removes both documents atomically.
- The quest never gates the Hallowfen main route.
- New player-facing files contain no em dash or doubled hyphen.

Visual evidence must include:

- Isolated renders for every new static kind.
- One in-scene capture of each interior.
- A niche-closed and niche-open Listening Vault capture.
- Sapphira at gameplay scale in every facing if he becomes an actor.
- A final Long Ash graveyard capture showing both chapel entry targets without
  disturbing the approved exterior art.

Run `npm run check` after implementation. The quest is complete only when all
routes survive a fresh run and a level-transition return.

## Acceptance criteria

The finished secret succeeds when a player can ignore it, partially understand
it, or follow it to the end without encountering a dead route. A careful player
connects eleven bodies, twelve candles, two records, and one missing name. A
specialist recognizes the truth earlier. A forceful player damages evidence but
can still finish.

The final choice must feel like a judgment about people and risk. Immediate
loot supports the expedition. Later rewards prove that the road remembers what
the player chose.
