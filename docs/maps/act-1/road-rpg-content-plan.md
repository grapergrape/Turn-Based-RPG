# Long Ash Road and Censure Road Camp RPG Content Plan

This plan covers `long-ash-road-approach` and `censure-road-camp`, including
their connected interiors. It follows a read-only audit of runtime data,
generators, progression math, interaction systems, dialogue, loot, collision,
and current full-map renders.

Implementation results and pass-by-pass evidence are recorded in the
[runtime review](./road-rpg-runtime-review.md).

The objective is not to fill every empty tile. It is to make observation,
training, prior discoveries, and equipment choices change what the player can
learn or recover. Critical travel and quest completion retain a no-stat route.

## Baseline

| Package | Runtime area | Current systemic content | Main gap |
| --- | ---: | --- | --- |
| Long Ash main map | 11,200 tiles, 2,376 objects | 9 containers, 13 Search objects, 4 locks, 7 ground stacks, 8 enemies, 1 living NPC | Most objects remain scenery, but each road branch now has authored anchors |
| Long Ash full package | 10 maps, 2,558 objects | 21 containers, 15 Search objects, 9 locks, 16 ground stacks, 13 enemies | Loot and checks still lean toward the Bell mystery maps |
| Camp main map | 3,500 tiles, 407 objects | 13 NPCs, no containers, locks, Search checks, enemies, or ground loot | Professions and visible stores do not create gameplay |
| Camp full package | 9 maps, 451 objects | 1 Search check and no loot | Seven tent interiors have no interactions at all |

Thirty-three camp props already look like crates, barrels, or satchels. The
plan converts selected existing props instead of adding indiscriminate clutter.

## Gate calibration

Character creation has 8,135 legal primary spreads. Ordinary fields begin in
the range 27 to 63. The player's scar bonuses put Host Signs, Containment, and
Purgation Tools in the range 32 to 68.

| Gate | Intended use | Legal starting builds that pass an ordinary field check |
| ---: | --- | ---: |
| 40 | Broad discovery | 90.2 percent |
| 45 | Accessible build expression | 71.7 percent |
| 50 | Meaningful specialization | 37.1 percent |
| 55 | Focused build | 11.7 percent |
| 60 | Rare specialist | 0.9 percent |
| 63 | Creation-cap field build | 0.1 percent |

Scar-bonused fields use a threshold five points higher when the intended
rarity is the same. Direct primary checks use 4, 5, 6, and 7. A threshold of 7
requires the player to max that single primary at creation. Later primary
points allow failed optional checks to be revisited.

Rules for every gate:

1. The result is deterministic and the UI shows rating and threshold.
2. Failure leaves the method available for a later return.
3. No check blocks the only route through a level or quest.
4. A successful discovery is one-shot and records a durable flag.
5. New Act I evidence stays local: altered procedure, staged remains, broken
   bells, and inconsistent Censure records. It does not reveal the Host's
   origin, Father Vale, Europa, Seneca, or the Stilling mechanism.

## Foundation work

| ID | Change | Location | Reason |
| --- | --- | --- | --- |
| F1 | Preflight inventory effects before completing a Search method | `src/core/Game.js`, runtime tests | A full pack currently consumes a successful search without granting its reward or flags |
| F2 | Accumulate visited-level journal findings during a run | `src/core/Game.js`, `src/core/JournalState.js`, tests | Flagged findings currently disappear when the player changes level |
| F3 | Give existing satchels, crates, and barrels a looted state | `src/render/primitives/propsChapel.js`, `src/render/primitives/furniture.js`, `src/render/spriteCatalog.js` | Empty containers need an immediate hard-pixel state change |
| F4 | Validate stable content IDs, methods, rewards, and legal thresholds | level validators and target-level tests | Generated content must fail loudly when a reference or gate drifts |

No new dependency, loot randomizer, skill engine, or renderer registry is
needed. Loot remains authored and deterministic, so save and reload cannot
reroll a container.

## Long Ash Road content manifest

The main generator remains authoritative. Main-map work belongs in
`scripts/gen-long-ash-road.mjs`, followed by regeneration of
`data/levels/long_ash_road_approach.json`.

| ID | Anchor | Gate | Durable result | Physical payoff |
| --- | --- | --- | --- | --- |
| L01 | Robbed charcoal carter at `(118,47)` | Speech 40 | A plain account of the robbery and road closure | Marks the north-cart lead |
| L02 | Same carter | Medicine 45 | Recognize a wheel-crush injury from the theft | A truthful timeline and camp medic report |
| L03 | Same carter | Guile 55 | Catch a lie about the stripped cart | Location of a concealed cart knot |
| L04 | Carbo water pump `(15,52)` | Engineering 40 | Identify deliberate grit in the pump collar | Farm supply flag |
| L05 | Carbo farm cart `(26,47)` | Search 45 | Recover the direction and number of drag marks | Kill-site linkage |
| L06 | Carbo father `(27,51)` | Medicine 40 | Separate the first wounds from postmortem damage | Basic family timeline |
| L07 | Carbo father `(27,51)` | Host Signs 60 | Identify a defensive pattern the killers tried to erase | Expert family finding |
| L08 | Carbo tool rack `(34,53)` | Security 50 | Open the bent tool coffer without breaking it | Dressing and gear scrap |
| L09 | Same tool coffer | Body 7 | Force the coffer's warped hinge | Same optional loot, with a loud result flag |
| L10 | Stripped cart `(104,50)` | Search 40 | Find the hidden axle cord | Cart trail and camp porter report |
| L11 | Stripped cart `(104,50)` | Engineering 55 | Read the break sequence and false wheel failure | Proof that the cart was stopped deliberately |
| L12 | Stable cult corpse near `(103,32)` | Medicine 45 | Distinguish killing wounds from later animal damage | Basic kill-site finding |
| L13 | Same corpse | Host Signs 60 | Establish that no fresh opening began at this site | Expert kill-site finding |
| L14 | Stable wolf corpse near `(104,34)` | Doctrine 50 | Recognize prayer knots tied after death | Evidence of staged Censure symbolism |
| L15 | Old bell marker `(121,63)` | Engineering 45 | Identify tool marks from deliberate clapper removal | Bell clerk report |
| L16 | Old bell marker `(121,63)` | Doctrine 50 | Read the erased peal rule in the mounting scars | Doctrinal discrepancy finding |
| L17 | New bell-side satchel `(124,62)` | Search 55 | Find the cache below loose road stone | Entry roll, road chit, and ducats |
| L18 | Jeremiah Fullo grave cluster `(129..138,49..53)` | Medicine 45 | Compare calcification order across the bodies | Graveyard timeline |
| L19 | Same grave cluster | Containment 60 | Identify the safe handling error in the old burial | Camp evidence report |
| L20 | Same grave cluster | Host Signs 65 | Detect a synchronized response pattern | Expert Bell finding |
| L21 | New stopped warden cart at `(113,23)` | Search 45 | Recover its route strip | North-spur lead and light supplies |
| L22 | Warden route post near `(116,18)` | Doctrine 45 | Notice a peal code removed from the posted rule | Cross-map Sabina response |
| L23 | New broken supply barrel at `(55,62)` | Search 40 | Find a dry inner stave | Beans and a dressing |
| L24 | New concealed forest cache at `(145,25)` | Search 63 | Follow three nearly erased placement signs | Rare but light specialist cache |
| L25 | Existing Carbo forest stash `(83,31)` | Eleazar reward flag, then Search 40 | The stash is no longer visibly free before Eleazar reveals it | Existing Carbo reward |
| L26 | Overturned cart at `(77,35)` | Guile 45, Medicine 45, or Host Signs 50 | Read a Stage IV lure before entering its reach | One free sidearm shot before the ambush turn |
| L27 | Deborah's overturned cart at `(77,35)` | Accept Deborah's account, then survive the ambush | Recover the flat purse beneath the cart bed | Twenty ducats and the disputed return choice |

The new carter is the only added living road NPC. Her role is narrow: she
links the central dead zone, the stripped cart, and camp professions. Her
optional account is a short local quest and does not explain the larger bell or
road-office mystery.

### Stage IV cart ambush

The western road site belongs to a Host encounter. A prone old woman calls
from beneath Deborah Carbo's overturned charcoal cart at `(76,35)`. The visible body is a prop
until the dialogue commits to combat, then a conscious deceptive Stage IV takes
its place. Four dormant Stage IV Runners enter from `(74,31)`, `(77,30)`,
`(70,35)`, and `(82,39)`.

The causal trail begins outside the calcified graveyard. A red-cuffed cult band
robs Deborah, injures her with the cart wheel, and takes the cart north. Host wolves
strike the band at the existing kill site. Dead cultists and wolves remain
there, while bare tracks and the charcoal cart continue west. The infected
survivors preserve the robbery's method and reuse the stolen cart as a traveler
trap. The wolves do not operate the lure.

Guile 45 catches the changing account. Medicine 45 reads the unweighted leg.
Host Signs 50 sees the black-gold line under the jaw. Any successful read grants
a guaranteed sidearm hit for normal five damage, no AP cost, and normal weapon
wear. The Stage IV begins at 9 HP, so the shot wounds rather than removes it.
Walking in without a read places the player at `(77,36)` before combat. Every route
ends in the same five-enemy encounter.

The lure has 5 AP and a 3 AP, 2 damage grip. Each Runner has 4 HP, 7 AP, and a
4 AP, 2 damage rake. Runner movement uses the fast combat step cadence. The
encounter reveals Deborah's flat purse beneath the broken cart bed. It contains the
twenty ducats she named. Returning them opens her revised claim that the purse
held twenty-five. Paying the extra five, refusing, or threatening her all close
the account without the reward she promised.

Stage IV is the Censure label used by the UI and enemy records. It does not mean
feral by definition and it does not imply Choir membership. Here the Host uses
one person's practiced deception while pushing four other bodies into a running
attack. All five retain human scale and show Vale-Imprint bone, prayer, and
black-gold motifs.

## Censure Road Camp content manifest

Exterior work belongs in `scripts/gen-censure-road-camp.mjs`, followed by
regeneration of `data/levels/censure_road_camp.json`. Tent interiors remain
directly authored JSON.

| ID | Anchor | Gate | Durable result | Payoff or reaction |
| --- | --- | --- | --- | --- |
| C01 | Writ board `(14,25)` | Search 40 | Notice an erased road name | Philip can identify who removed it |
| C02 | Writ board `(14,25)` | Guile 50 | Distinguish an official correction from a forged one | Forgery finding |
| C03 | Bell mast `(32,16)` | Engineering 40 | Read a recent rope splice | Sabina compares it with the old bell |
| C04 | Bell mast `(32,16)` | Doctrine 45 | Reconstruct the omitted peal | Doctrinal discrepancy finding |
| C05 | Cyprian at the drill yard | Melee 40 or Unarmed 40 | Complete one practical drill route | First drill flag |
| C06 | Center range target `(59,25)` | Firearms 45 | Read and repeat the useful shot pattern | Second drill flag |
| C07 | Same target | Eye 7 | Notice the clerk's hidden correction mark | Max-primary finding and one relic round |
| C08 | Drill satchel `(48,28)` | Both drill flags | Open the earned issue bundle | Rounds and a dressing |
| C09 | Quartermaster table `(23,31)` | Search 45 | Find a weight mismatch in the issue ledger | Baruch and Ruth report route |
| C10 | Ruth dialogue | Command 50 | Obtain a lawful field issue | Opens one sanctioned supply crate |
| C11 | Ruth dialogue | Guile 60 | Forge an issue seal | Opens the same supplies and records the fraud |
| C12 | Sealed issue crate `(31,30)` | Ruth issue flag | Claim the recorded bundle | Beans, dressing, rounds, and ducats |
| C13 | Joanna's field kit `(59,43)` | Medicine 45 | Identify a reused dressing packet | Medic finding and safe replacement |
| C14 | Same kit | Host Signs 60 | Identify the stain Joanna has isolated | Expert medic report |
| C15 | Evidence shed door `(59,40)` | Containment 50 | Classify the least dangerous evidence sack | Melchior report credit |
| C16 | Same shed | Host Signs 60 | Identify a mislabeled active packet | Expert evidence finding |
| C17 | Same shed | Nerve 7 | Hold the sounding sack steady long enough to count | Max-primary evidence finding, no contraband loot |
| C18 | Baruch dialogue | Engineering 45 and Long Ash cart flag | Give the actual break sequence | Porter acknowledgment and ducats |
| C19 | Joanna dialogue | Medicine 45 and Long Ash medical flag | Give a defensible casualty timeline | Dressing and report flag |
| C20 | Melchior dialogue | Containment 50 and Long Ash Host flag | Correct his evidence classification | Report flag |
| C21 | Sabina dialogue | Doctrine 45 and Long Ash bell flag | Compare both missing peal rules | Joined bell finding |
| C22 | Philip dialogue | Guile 45 and writ-board flag | Name the clerk who altered the board | Writ finding |
| C23 | Augustine dialogue | Doctrine 45 | Challenge the tariff from his own rule | Alternate chit route |
| C24 | Augustine dialogue | Speech 45 | Negotiate a confession without payment | Alternate chit route |
| C25 | Augustine dialogue | Guile 55 | Conceal the money trail | Alternate chit route with a future-risk flag |
| C26 | Aquila dialogue | Doctrine 45 | Answer by doctrine, not form trivia | Route authorization path |
| C27 | Aquila dialogue | Search 45 | Present three consistent field observations | Route authorization path |
| C28 | Aquila dialogue | Command 55 | Demand an operational ruling | Route authorization path |
| C29 | Aquila dialogue | Three verified profession reports | Submit a joined field report | Route authorization without a single high field |
| C30 | Form C-17 or plain field account | No stat gate | Retain a patient no-build route | The plain account authorizes travel; a perfect form adds bonus gear |
| C31 | Quarters kit `(19,41)` | Search 45 | Find a previous occupant's false bottom | Personal cache and ownership warning |
| C32 | Latrine barrel area `(25,44)` | Search 40 | Find a dry contraband wrap | Small abandoned cache |
| C33 | Supply barrel `(44,35)` | Body 7 | Lift a collapsed iron band intact | Max-primary salvage cache |

The current east-gate travel condition changes from the perfect-form flag to
the general route-authorization flag. Perfect Form C-17 completion remains a
superior outcome, not the only campaign route.

## Tent interior content

| Interior | Existing anchor | New interaction |
| --- | --- | --- |
| Preceptor | File crate `(9,5)` | Search 55 reveals a corrected route order; Doctrine 55 explains the correction |
| Quartermaster | Storage crate `(8,3)` | The exterior issue flag exposes the lawful claim container |
| Supply | Crates `(3,3)` and `(8,3)`, barrel `(4,6)` | Search 45 finds a misplaced relief bundle; Guile 55 identifies a false stock mark |
| Medic | Supply crate `(8,6)` | Medicine 45 recovers one safe dressing; Host Signs 60 marks one packet for Melchior |
| Quarters | Barrel `(8,6)` | Search 45 follows the false-bottom clue from the exterior kit |
| Sutler | Satchel `(4,5)` and crate `(8,5)` | Search 40 finds a dropped tally; Guile 55 catches Judith's altered price mark |
| Writ chapel | Lectern `(6,4)` and orders `(7,6)` | Doctrine 45 reconstructs the missing peal clause |
| Evidence tent | Existing Augustine chest `(8,3)` | Keep Search 45 and add downstream Naomi and Aquila acknowledgment |

Interior discoveries point back to the exterior NPC responsible for that
space. They do not turn unattended lawful stores into free loot rooms.

## Loot manifest and carry budget

The player begins with about 2.2 kg of free capacity. Currency is weightless and most
new stacks weigh 0.1 to 0.3 kg. Containers permit partial looting, so the player
can leave heavy or unwanted supplies behind.

| Package | Source | Planned contents | Approximate weight |
| --- | --- | --- | ---: |
| Long Ash | Warden cart crate | 4 ducats, 1 bean, 1 relic round | 0.4 kg |
| Long Ash | Carbo tool coffer | 1 dressing, 2 gear scrap | 0.8 kg |
| Long Ash | Kill-site satchel | 2 ducats, 1 road chit | 0.1 kg |
| Long Ash | Bell-side satchel | 4 ducats, 1 entry roll, 1 road chit | 0.4 kg |
| Long Ash | Dry-stave barrel | 1 bean, 1 dressing | 0.5 kg |
| Long Ash | Forest specialist cache | 8 ducats, 2 rounds, 1 saint token | 0.3 kg |
| Camp | Earned drill satchel | 2 rounds, 1 dressing | 0.4 kg |
| Camp | Lawful issue crate | 1 bean, 1 dressing, 1 round, 3 ducats | 0.6 kg |
| Camp | Medic replacement packet | 1 dressing | 0.2 kg |
| Camp | Quarters false bottom | 3 ducats, 1 road chit, 1 saint token | 0.2 kg |
| Camp | Latrine contraband wrap | 2 ducats, 1 gear scrap | 0.3 kg |
| Camp | Collapsed-band barrel | 1 gear scrap, 1 bean | 0.6 kg |

Existing road containers remain. The infected-cave reward will be reviewed
against the new distribution, but no reward is reduced solely to make the new
containers look better.

## Cross-map response graph

```text
Long Ash bell evidence       -> Sabina -> joined bell report     -> Aquila
Long Ash casualty evidence   -> Joanna -> medical report        -> Aquila
Long Ash Host evidence       -> Melchior -> containment report    -> Aquila
Long Ash cart evidence       -> Baruch -> route report          -> Aquila
Camp writ and stock evidence -> Philip or Ruth report            -> Aquila
Three verified reports       -> general route authorization    -> east gate
Plain field account         -> general route authorization    -> east gate
Form C-17 perfect completion -> bonus issue bundle             -> east gate
```

This graph gives discoveries a second use. A road check does not end with a
log line. It changes a later conversation and can contribute to a practical
campaign outcome.

## One hundred implementation and review passes

Passes 1 through 50 cover Long Ash. Passes 51 through 100 cover the camp. A
pass is complete only when its stated evidence exists. Static composition
captures are not substitutes for live checks where UI, state, or travel is the
subject.

| Pass | Review target | Required evidence |
| ---: | --- | --- |
| 1 | Long Ash generator baseline | Generated JSON matches the generator |
| 2 | Whole-map route | Spawn reaches camp exit and every connected entrance |
| 3 | North spur | Warden cart and route post break the 26-tile inert run |
| 4 | Central road | Carter scene is visible without blocking the road |
| 5 | West farm approach | New anchors do not shorten or obstruct the branch |
| 6 | Southern field | Dry-stave barrel has a readable shoulder placement |
| 7 | Northeast woods | Specialist cache is concealed but has a legal use cell |
| 8 | Carter silhouette | Existing human art reads at road scale |
| 9 | Carter idle scene | Actor, cart, and path depth-sort correctly |
| 10 | Carter Speech gate | 39 fails, 40 succeeds, result persists |
| 11 | Carter Medicine gate | 44 fails, 45 succeeds, result persists |
| 12 | Carter Guile gate | 54 fails, 55 succeeds, result persists |
| 13 | Pump Engineering gate | 39 fails, 40 succeeds |
| 14 | Farm-cart Search gate | 44 fails, 45 succeeds |
| 15 | Carbo Medicine gate | Basic result does not reveal expert result |
| 16 | Carbo Host Signs gate | 59 fails, 60 succeeds |
| 17 | Tool-coffer Security gate | 49 fails, 50 succeeds |
| 18 | Tool-coffer Body gate | 6 fails, 7 succeeds |
| 19 | Tool-coffer alternatives | Either route opens one shared reward only once |
| 20 | Stripped-cart Search gate | 39 fails, 40 succeeds |
| 21 | Stripped-cart Engineering gate | 54 fails, 55 succeeds |
| 22 | Cart evidence continuity | Carter and Baruch branches recognize the flag |
| 23 | Kill-site Medicine gate | 44 fails, 45 succeeds |
| 24 | Kill-site Host Signs gate | 59 fails, 60 succeeds |
| 25 | Wolf Doctrine gate | 49 fails, 50 succeeds |
| 26 | Corpse variation | Cultists, wolves, and Holts no longer repeat one account |
| 27 | Old-bell Engineering gate | 44 fails, 45 succeeds |
| 28 | Old-bell Doctrine gate | 49 fails, 50 succeeds |
| 29 | Bell-side Search gate | 54 fails, 55 succeeds |
| 30 | Bell evidence continuity | Sabina recognizes both road flags |
| 31 | Grave Medicine gate | 44 fails, 45 succeeds |
| 32 | Grave Containment gate | 59 fails, 60 succeeds |
| 33 | Grave Host Signs gate | 64 fails, 65 succeeds |
| 34 | Existing grave reward | Original Search 40 path still works |
| 35 | Warden-cart Search gate | 44 fails, 45 succeeds |
| 36 | Route-post Doctrine gate | 44 fails, 45 succeeds |
| 37 | Barrel Search gate | 39 fails, 40 succeeds |
| 38 | Forest-capstone Search gate | 62 fails, 63 succeeds |
| 39 | Carbo stash visibility | Hidden before Eleazar and usable after his reveal |
| 40 | Long Ash loot IDs | Every item and count validates |
| 41 | Long Ash carry behavior | Partial loot works with a nearly full pack |
| 42 | Full-pack search | Failed inventory transfer does not consume the method |
| 43 | Satchel open state | Full and empty renders differ clearly |
| 44 | Crate open state | Full and empty renders differ clearly |
| 45 | Barrel open state | Full and empty renders differ clearly |
| 46 | Long Ash journal | Every successful evidence flag adds one finding |
| 47 | Journal transition | Findings remain after entering a child map |
| 48 | Journal return | Findings remain after returning to the road |
| 49 | Long Ash live scene | Player can complete one easy and one specialist route |
| 50 | Long Ash acceptance | Full map, collision, content, writing, and state pass |
| 51 | Camp generator baseline | Generated JSON matches the generator |
| 52 | Whole-camp route | Spawn reaches all NPCs, tents, and east gate |
| 53 | Writ-board Search gate | 39 fails, 40 succeeds |
| 54 | Writ-board Guile gate | 49 fails, 50 succeeds |
| 55 | Bell-mast Engineering gate | 39 fails, 40 succeeds |
| 56 | Bell-mast Doctrine gate | 44 fails, 45 succeeds |
| 57 | Bell cross-map branch | Sabina distinguishes local and road evidence |
| 58 | Cyprian Melee route | 39 fails, 40 succeeds |
| 59 | Cyprian Unarmed route | 39 fails, 40 succeeds |
| 60 | Drill route exclusivity | Either combat field grants the first drill flag once |
| 61 | Range Firearms gate | 44 fails, 45 succeeds |
| 62 | Range Eye gate | 6 fails, 7 succeeds |
| 63 | Earned drill satchel | Appears only after both drill flags |
| 64 | Quartermaster-table Search | 44 fails, 45 succeeds |
| 65 | Ruth Command route | 49 fails, 50 succeeds |
| 66 | Ruth Guile route | 59 fails, 60 succeeds and records fraud |
| 67 | Issue route exclusivity | One issue bundle can be claimed once |
| 68 | Joanna Medicine gate | 44 fails, 45 succeeds |
| 69 | Joanna Host Signs gate | 59 fails, 60 succeeds |
| 70 | Joanna road report | Long Ash casualty flag changes her response |
| 71 | Melchior Containment gate | 49 fails, 50 succeeds |
| 72 | Melchior Host Signs gate | 59 fails, 60 succeeds |
| 73 | Evidence Nerve gate | 6 fails, 7 succeeds |
| 74 | Evidence ownership | No active evidence becomes free loot |
| 75 | Baruch road report | Cart evidence changes his response and reward |
| 76 | Philip writ report | Board evidence changes his response |
| 77 | Augustine Doctrine route | 44 fails, 45 succeeds |
| 78 | Augustine Speech route | 44 fails, 45 succeeds |
| 79 | Augustine Guile route | 54 fails, 55 succeeds and records risk |
| 80 | Augustine no-stat route | Required chit remains obtainable without a field gate |
| 81 | Aquila Doctrine route | 44 fails, 45 succeeds |
| 82 | Aquila Search route | 44 fails, 45 succeeds with observations present |
| 83 | Aquila Command route | 54 fails, 55 succeeds |
| 84 | Aquila report route | Three profession reports authorize travel |
| 85 | Plain field account | No-stat account authorizes travel without completing the form |
| 86 | Form C-17 perfection | Perfect result grants only the superior bonus |
| 87 | East-gate locked state | No authorization means no travel choice |
| 88 | East-gate unlocked state | Any authorization route enables travel |
| 89 | Preceptor interior | File crate checks are reachable and persistent |
| 90 | Quartermaster interior | Lawful issue container follows its flag |
| 91 | Supply interior | Stock-mark checks are reachable and persistent |
| 92 | Medic interior | Packet checks are reachable and persistent |
| 93 | Quarters interior | False-bottom chain and cache work once |
| 94 | Sutler interior | Tally and price-mark findings reach Judith |
| 95 | Writ chapel interior | Missing clause finding reaches Sabina or Philip |
| 96 | Evidence interior | Existing Augustine chest remains correct at Search 45 |
| 97 | Camp container states | Satchel, crate, and barrel empty states read in scene |
| 98 | Camp journal transition | Camp and road findings coexist after tent travel |
| 99 | Live skill-to-travel route | Discovery, NPC report, Aquila, and east gate work in sequence |
| 100 | Combined acceptance | Both packages pass checks, live review, art review, and writing self-check |

## Acceptance commands and artifacts

At minimum:

```bash
npm run check
node tests/longAshRoadLevel.test.mjs
node tests/censureRoadCampLevel.test.mjs
node tests/censureRoadAuthorization.test.mjs
node tests/roadRpgContent.test.mjs
node tests/searchSystem.test.mjs
node tests/dialogueInventoryEffects.test.mjs
node tests/levelTransitions.test.mjs
node tests/progression.test.mjs
node tests/catalogRender.test.mjs
```

New focused tests will cover persistent findings, full-pack search retry,
cross-map reports, threshold boundaries, stable generated content, container
state art, reachability, and the general route-authorization flag.

Visual evidence will live under
`.ai/visual-audit/long-ash-censure-rpg-passes/`. Detached captures cover pixel
construction and state variants. Live captures cover interaction UI, journal
persistence, NPC reactions, container consumption, and east-gate travel.
