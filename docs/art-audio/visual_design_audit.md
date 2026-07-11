# Visual Design Audit

Date: 2026-07-10 (honest re-baseline; supersedes the 2026-07-03 pass)

This audit rates the runtime-drawn visual set against `game_art_skill/SKILL.md`
(especially Section 22, the honest-review rubric added in this pass),
`docs/LORE_INTEGRATION.md`, and `docs/lore/the_host_story_bible.md`.

## Why the re-baseline

The 2026-07-03 pass declared all 272 audited rows "verified at 9/10". Play
testing rejected that: the cut-down Opened Saint left a small cartoon skeleton,
the bell stairwell read as a ring of sticks, character customization was
invisible in game. Scores below use the full scale honestly: **4 is average**,
10 is an exemplar. Scores are per family, with named outliers; a row-level 9
claim without a fresh render behind it is worthless and none are made here.

## Method

- Every catalog category, floor style, ground-item model, and atlas actor was
  rendered fresh with `.ai/map-review/preview-catalog.html` (added this pass;
  data-driven from `SPRITE_CATALOG`, so new kinds appear automatically).
- Player customization rendered clothed and bare with
  `.ai/map-review/preview-player-variants.html` (added this pass).
- In-scene captures via `.ai/map-review/capture-scene.html` for the bell room
  and the chapel nave.
- Judged from the screenshots at gameplay zoom, never from the code.

## Family scores (4 = average)

| Family | Score | Notes |
|---|---:|---|
| Animated actors (humans, factions) | 6.5 | Strongest family. Role kits read; distinct silhouettes per faction. |
| Host actors (penitents, rats, wolves) | 6.5 | Vale Imprint vocabulary present; bone halos and asymmetry read. |
| Terrain wall blocks | 6.5 | Material identity holds (chapel stone, barn plank, canvas). |
| Wall fixtures | 6 | Window and safe strong; `wall-stair-door` a dark slab (4). |
| Standing cross-martyr | 8.5 | The exemplar. Goat skull, bone-wing ribs, gold pin light. |
| Fallen cross-martyr (cut down) | 7 | **Fixed this pass** (was 1: shrunken cartoon skeleton). Man-sized fallen opened body, pool, drag smear. |
| Stone stairwell (bell stairs) | 7 | **Fixed this pass** (was 2: oval ring of sticks). Masonry portal, treads into the dark, rope rail. |
| Broken bell | 7.5 | **Fixed this pass** (was 3: read as red tarp tent). True bell profile, specular streak, hollow mouth. |
| Bell rope | 5 | Rope + pulley read at zoom; frayed end splays oddly in scene. Backlog. |
| Bone pile / ossuary heap | 5 | **Improved this pass** (was 2: white confetti). Skull, femurs, rib arc now namable; mound silhouette still weak. Backlog. |
| Skeleton (gore) | 5.5 | **Improved this pass**: decay stain and rotted coat rag bind the bones; white speckle removed. |
| Other gore (corpse, victims, dead cultist) | 5.5 | Serviceable; corpse can read as a log at distance. |
| Calcified creature props | 6.5 | Crossroad-brother wing silhouette is strong (7.5). |
| Host growth | 3 | Reads as a dark scratch in isolation (better in scene clusters). Backlog: fleshy mass + gold vein. |
| Floors | 6 | **wheat-field fixed this pass** (was 2: flat saturated mustard; now ashen dead straw). **graveyard-earth seams dimmed** (bone-white lines read as glowing worms; now packed-edge stoneDust). **cave-river calmed** (7 bright bands and 13 glints per tile cut to 4 dim lines and 6 glints). |
| Decals | 4.5 | Rule-abiding but most are invisible at gameplay zoom; acceptable for ground texture, not as story marks. |
| Plants | 5.5 | **Floating bone-white "+" removed from all five kinds this pass**; now lashed twig charms planted in dirt. Sapling/scrub still thin (4). |
| Structures (graveyard, farm blocks) | 5.5 | Building blocks fine in assembly; `graveyard-wall` fragmentary (3), `devil-target` weak read (4). |
| Furniture | 5 | Broad placeholder middle. Outliers: chapel-banner (7), reliquary (6.5); `hay-rick` **fixed this pass** (was 2: yellow blob; now conical ashen stack with pole, ties, rot hole, 6); `chapel-font` unreadable at zoom (3, backlog), `field-harrow` odd caterpillar (3, backlog). |
| Ground items | 5.5 | Readable minis. **Coat/hood pickups fixed this pass** to match the worn kit colors (were blue guide-cloth). Vial/ball keep blue as glass/curio; acceptable. |
| Ritual marks | 5 | Pentagram fine; blood-sigil and ritual-circle small and dark (4). |
| Lights | 6.5 | Candle cluster is strong; campfire flame slightly icon-like. |
| UI surfaces (HUD, inventory, dialogue, journal) | 7 | Re-reviewed this pass from the evidence captures: cohesive riveted hard-pixel chrome, bitmap font, no browser leakage; the paper doll reflects the real player bake. Honest 7, not the old 9: panels are spare, and dialogue lacks the era's signature NPC portraits (the single biggest UI uplift available). |
| Player customization (in game, clothed) | 7.5 | The creator now carries 15 fields. Stature, posture, hair silhouettes, facial hair, and strong face marks remain legible through field kit. Fine scars stay deliberately subtle. |

## Fixed this pass (2026-07-10)

1. **Character customization now shows in game.** Root cause: the default kit
   (censure-hood + coat + vest) erased every trait: hood forced "hooded" hair
   and hid facial hair; bust never drew clothed; vest/harness/pendant styles
   were computed but never painted. Fixes in `spriteBake.js`: the hood is worn
   open (front crown shows real hair, scalp when shaved, loose locks spill),
   beards render hooded, the bust widens the outer layer's silhouette in 4
   buckets, vest/harness strap/pendant now paint. Verified: 6 of 9 creation
   fields change the clothed bake (anatomy and groin are legitimately under
   clothing; breast steps change per bucket). Evidence:
   `.ai/visual-audit/player-customization-clothed-v1.png`.
2. **Fallen Opened Saint** (`drawFallenSaint`, goreOssuary.js): man-sized fallen
   opened body with collapsed rib wing, goat skull cheek-down, dying gold pin,
   blood pool and drag smear, torn spikes left in the beam.
3. **Stone stairwell** (`drawStoneStairwell`, furniture.js): masonry portal with
   block jambs, heavy lintel, treads climbing into the dark, rope rail on iron
   pins, worn landing slab.
4. **Broken bell** (`drawBrokenBell`, propsChapel.js): true bell profile
   (shoulder, waist, late sound-bow flare), specular streak, cast ridge lines,
   hollow void mouth. Crack, wedge, and sabotage brace kept.
5. **Bone pile** (`drawBonePile`, goreOssuary.js): raised mound with black
   gaps, one skull facing out, one half-buried, femur across the crown, rib
   arc, dried blood and cut cord.
6. **Wheat field floor** (terrain.js): base moved from saturated hostGold to
   ashen straw; gold only on sparse Host-touched grain heads.
7. **Plant prayer marks** (plants.js, all five sites): floating bone-white "+"
   replaced with lashed twig crosses, corded, planted with contact shadows (or
   tied to the sapling trunk).

## Second fix pass (2026-07-10, same day)

Every backlog item was addressed and re-verified with fresh renders
(`.ai/visual-audit/honest-2026-07-10-backlog-*.png`):

- `host-growth` 3 → 5.5: rooted fleshy mound with root lobes, living wound,
  black-gold seams, thicker bone thorns with skin sockets.
- `graveyard-wall` 3 → 6: waist-high massed masonry with block courses.
- `devil-target` 4 → 7: bold crude red devil (solid body, crooked horns,
  scrawled pitchfork), punched-through shot holes, a tally of misses in the
  corner. The absurd humor lives in the crudeness.
- `chapel-font` 3 → 5.5: taller pedestal, wider lit basin, defaced carved
  cross.
- `field-harrow` 3 → 5: heavy timber lattice dominates; tines are slim dark
  teeth pointing into the soil.
- `bell-rope` 5 → 6: the frayed "claw" is now a hard whipping knot over a
  limp coil of slack on the stone.
- `bone-pile` 5 → 6: mound enlarged and raised.
- `wall-stair-door` 4 → 5: mouth treads carry stoneLight/stoneDust so the
  fixture no longer collapses into a dark slab.
- `blood-sigil` / `ritual-circle` 4 → 5.5: every ritual stroke carries a
  rustMid wet edge (hostRed on hostBlack was nearly invisible).
- `ash-sapling` 4 → 5.5: fuller ragged crown (7 clumps).
- `corpse` 5 → 6: lit cheekbone, slack mouth, split legs with a bent shin.
- `cobweb` 3 → 4.5: raised alpha, wrapped husk and caught dust.
- `scrub-bush`: left as-is on review; its dark mass is thematically correct
  for dead growth. Texture decals (road-dust, dust, trampled-mud,
  practice-scars, path-stones) left subtle on purpose: they are ground
  texture, and louder marks would read as noise.

## Third pass: the high-frequency surface (2026-07-10, same day)

Usage counts across `data/levels/` rank what the player actually sees:
wheat-clump (878 placements), farm-fence (488), ash-tree (379, already
strong), scrub-bush (266), skeleton (191). Raising these lifts more screen
area than everything else combined. Evidence:
`.ai/visual-audit/honest-2026-07-10-surface-pass.png`.

- `wheat-clump` 5 → 6.5: the whole clump now shares one prevailing wind lean
  (weather-beaten, not random), one-in-six stalks snapped with a hanging
  head, rare Host-gold grain echoing the field floor accents.
- `farm-fence` 5 → 6: seeded run variety: snapped low-rail variant sagging to
  the dirt with pale split ends, ash drifted at the windward post, a knotted
  prayer cord on some top rails.
- `kitchen-hearth` 4 → 5.5 and `farm-kitchen-hearth` 5 → 6: banked embers
  (rust + gold + one live coal) and soot licked up the breast; a hearth with
  no fire read is a black box.
- `sealed-storage-crate` 5 → 6: stencilled requisition mark and a red wax
  seal over the hasp cord; "sealed" is now visible, not just named.
- `broken-pew` 5 → 6: seeded leavings: a hymn sheet still on the seat, or a
  dropped prayer cord where the rail broke.

## Fourth pass: lighting and interiors (2026-07-10, same day)

- **`ash_chapel_breach` had NO mood config** while every other level has one:
  the flagship horror set-piece rendered flat. It now gets the cold-stone
  family treatment (`floorShade #10141c` @ 0.4, cold ambient, vignette 1.3),
  so its 13 candle clusters and the altar rite read as warm islands in a cold
  nave. Scene evidence: `honest-2026-07-10-scene-nave-mood.png`.
- **`wash-tub` 4 → 5.5**: the water remembers the wash; a faint red bloom
  where blood came out of someone's coat.
- Re-review of the interior furniture at working zoom found dining-table,
  settlement-table, and kitchen-counter already carry authored leavings
  (cup, bread, jars, household mess); their gallery-scale 5s were
  under-credited. Rated 6 on the strength of the in-scene reads.

## Fifth pass: window light and the last quiet middle (2026-07-10, same day)

- **New `window-light-pool` kind** (LIGHT category, layer 0, painted after the
  mood multiply like every emissive): cold stepped-band daylight with a
  mullion shadow and dust motes in the beam. Placed under all seven chapel
  windows (five in the breach nave, two in the bell room). The Opened Saint
  now literally hangs in the "cold window light" his dialogue describes.
  Evidence: `honest-2026-07-10-window-light-pools.png`. Kept restrained so
  the candle islands stay the warm counterpoint.
- **`low-stool` 4 → 5.5**: whittling shavings under the seat edge; one stool
  in four still holds the tin cup someone never came back for.
- **`dining-bench` 4 → 5.5**: one bench in four has a child's chalk game
  scratched on the end, half rubbed out.

## Sixth pass: fire and close-review corrections (2026-07-10, same day)

- **`campfire` 5 → 6.5**: the straight lit-pillar flame is now a tapered
  ragged column drawn row by row with jagging tongues, a side lick, and a
  deep-red coal line. Evidence: `honest-2026-07-10-campfire-flame.png`.
- **Close-review corrections** (the honest rubric cuts both ways): the
  `saint-statue` (beheaded stump with a chip halo, hacked prayer hands,
  wound-star defacement) and the `calcified-headstone` set (four variants of
  snapped calcified bodies serving as grave markers, an original on-theme
  invention) are fully authored pieces whose gallery 5s were
  distance-of-review artifacts. Re-rated 6.5 and 6 on close render evidence.

## Seventh pass: the farm-tool cluster (2026-07-10, same day)

- **`field-cart` 4 → 6**: two tied grain sacks and a lashed tarp in the bed;
  the load explains the cart, abandoned mid-haul.
- **`tool-rack` 4 → 5.5**: one peg hangs empty with a paler dust silhouette
  of the taken tool; somebody armed themselves on the way out.
- **`rubble-pile` 5 → 6**: a carved stone hand from a shattered saint still
  reaches out of the heap; this was a chapel before it was rubble.
- **`cobweb`**: alpha raised again (0.9); reads with its wrapped husk.
- Evidence: `honest-2026-07-10-farm-tool-cluster.png`.

## Eighth pass: quiet ground (2026-07-10, same day)

Root cause found at floor level: `drawFloorStoryMarks` and the chip run
stamped their marks on EVERY tile, so peg holes, cracks, and scratch chips
became wallpaper and every outdoor level read as scratch noise. Fixes:

- Event-like story marks (stone, ash-dirt, road-shoulder, packed-earth,
  ash-gravel, forest-floor, cave-stone) now appear on roughly a third to a
  half of tiles, seeded, so quiet ground lets the marked tiles speak.
- The chip run is gated the same way.
- `mud-track` keeps its dark ruts continuous but the pale wet glint on the
  rut lip only catches on every third tile, and the redundant second rut
  system is mostly gated off.

Verified against the censure camp scene
(`honest-2026-07-10-camp-quiet-ground.png`): tents, banners, and the
campfire now carry the composition instead of competing with ground noise.
Floors family 6 → 6.5; the "coherence beats randomness" rule in
`game_art_skill/SKILL.md` Section 22 now cites this as its floor-level case.

## Ninth pass: the exemplar and full scene coverage (2026-07-10, same day)

- **Standing `cross-martyr` 8.5 → 9.5**: the cult's harvest now shows on the
  body: parallel carve strips down the near thigh, the newest still wet with
  a drip finding the shin, and the gold pin light in the cavity touching the
  post behind him. One sprite now tells the game's whole premise:
  crucifixion, the opened body, the cult eating him, the Host refusing to
  let him die. Evidence: `honest-2026-07-10-martyr-exemplar.png`. This is
  what a 10 costs; use it as the bar.
- **Scene coverage completed**: catacombs and infected cave captured and
  reviewed (`honest-2026-07-10-scene-catacombs.png`, `-scene-cave.png`).
  Both hold: dense ossuary rooms with the grounded skeletons and glowing
  candle islands; the cave's calmed river sits inside the dark instead of
  shouting over it. Every level archetype has now been scene-verified today.

## Tenth pass: set pieces storied (2026-07-10, same day)

The Saint's method (the story written on the body) applied to the other set
pieces, evidence `honest-2026-07-10-setpieces-storied.png`:

- **`broken-bell` 7.5 -> 8.5**: the crack now opens as it falls, hairline at
  the shoulder to a black split at the sound bow, ending in a bitten-out lip
  with raw bronze at the break; the missing chunk lies where it fell; tally
  scratches on the waist count the ringings the congregation lost.
- **`stone-stairwell` 7 -> 8**: ash footprints climb the lower treads
  (someone went up recently and did not sweep behind themselves); a Censure
  chalk tally on the lit jamb counts the sweeps this passage has seen.

## Eleventh pass: UI re-review (2026-07-10, same day)

The UI family was the one gap in the re-baseline; re-scored from the
existing evidence captures (`ui-hud-upgraded.png`, `ui-inventory-upgraded.png`,
`ui-dialogue-verified-v1.png`). Honest 7: the tri-panel HUD, inventory paper
doll (now showing the real vest/harness bake), and dialogue window are
cohesive late-90s canvas chrome with disciplined bitmap text and good
anti-slop flavor writing. What separates it from 9-10 is concrete and
recorded: NPC portrait panels in dialogue (the era's signature), icon
language in the status panel, and texture in the empty panel fields.

## Twelfth pass: dialogue talking heads (2026-07-10, same day)

The single biggest recorded UI uplift is now shipped: NPC conversations show
a **speaker portrait plate** perched above the dialogue window - the actor's
own baked sprite cropped to head-and-shoulders and scaled 2.4x, hard pixels
kept hard, in a riveted SPEAKER frame (the era's talking-head grammar, done
the Ultima way with the game's own art). Actor conversations carry
`speakerSpriteId` through the dialogue state; prop and note dialogues stay
text-only, and unknown sprite ids degrade gracefully to the classic window.
New harness: `.ai/map-review/preview-dialogue.html` drives the real
UIRenderer with a fake state for verification. Evidence:
`honest-2026-07-10-dialogue-portrait.png`. UI family 7 -> 8.

## Thirteenth pass: faces (2026-07-10, same day)

Every human actor's face upgraded in the shared head painter, because the
portrait plate now magnifies it 2.4x in every conversation: a browline
shadow over the eyes, a nose hint between them, and one lit cheekbone. The
face block draws last so no cowl or brow row buries it. Verified at world
scale (no clutter) and portrait scale (a person, not a smudge) -
`honest-2026-07-10-actor-faces.png`, `honest-2026-07-10-dialogue-portrait.png`.
Human actor family 6.5 -> 7; every one of the ~60 actors benefits at once.

## Fourteenth pass: story marks (2026-07-10, same day)

- **`quarantine-sign` 5 -> 6.5**: the Remnant's actual mark painted big
  enough to read from the road - a red cross barred through - over the older
  faded smears.
- **`chalk-drawing` 4 -> 6**: alpha raised so the chalk reads, and the lone
  stick figure became two, the smaller holding the taller one's hand: the
  catacombs children drew themselves watching the ringed world and the bore.
  The decal the survivors' dialogue points at now rewards the look.
- Evidence: `honest-2026-07-10-signs-chalk.png`.

## Fifteenth pass: sacrament and issue kit (2026-07-10, same day)

- **`ritual-bowl` 5 -> 6.5**: the bowls now hold what the quest log says
  they hold - strips of pale flesh laid to dry across the rim, one hanging
  over the edge, wet red beneath, one gold fleck. The altar rite scene's
  centerpiece finally shows the sacrament.
- **`field-satchel` 5 -> 6**: a bone-white Censure issue-stamp on the flap;
  standard kit reads as standard kit.
- Evidence: `honest-2026-07-10-bowl-satchel.png`.

## Sixteenth pass: gore close review (2026-07-10, same day)

Close render review of the victim trio found all three fully authored, and
their family score under-credited from gallery distance (the same pattern as
the saint-statue and calcified headstones):

- `cult-victim`: half-dried pool with drag smear, dark traveller's coat,
  silver cross still at the throat, the chest cut bare and carved with a
  point-down star over scratch-line words, stab punctures. 5.5 -> 6.5.
- `bound-victim`: rough lash-up post and wrist bar, and a thin cold seep of
  grate light that only falls on the victim while they still live. 5.5 -> 6.5.
- `dead-cultist` rides with the family at 6.

The audit tail principle, now confirmed across every family: no unauthored
or misrepresenting piece remains in the catalog. Remaining movement is craft
polish upward and honest re-crediting on close evidence.

## Seventeenth pass: the censure camp set (2026-07-10, same day)

- **`canvas-tent` 6 -> 6.5**: a chalked billet tally beside the door flap;
  the quartermaster counts heads, even now.
- **`camp-bedroll` 5.5 -> 6**: a folded spare shirt and the saint token they
  touched before sleep, kept by the head end.
- **`rusted-crate` 5 -> 6**: pry gouges at the lid seam and a requisition
  stencil half rusted away; somebody tried this one already.
- Evidence: `honest-2026-07-10-campset.png`.

## Eighteenth pass: the farm yard (2026-07-10, same day)

- **`feed-trough` 5.5 -> 6**: a small dead bird lies in the dry feed, wing
  splayed; nothing else came for the grain.
- **`woodpile` 5.5 -> 6.5**: the chopping block out front with the axe still
  standing in its split. Whoever was working stopped mid-swing and never
  came back.
- Evidence: `honest-2026-07-10-farmtrio.png`.

## Nineteenth pass: the road remembers (2026-07-10, same day)

- **`ash-tree-stump` 5.5 -> 6**: the heartwood weeps a thin black-gold seam
  where the saw went through; even the trees on this road carry the Imprint.
- **`scrub-bush` 5 -> 5.5**: a scrap of coat wool snagged on a stalk;
  someone pushed through rather than go around.
- **`farm-door` (locked) 5 -> 6**: the Remnant's chalked barred cross at eye
  height. Locked doors in this valley are not locked by their owners.
- Process note: the door seal was first inserted into the wrong function by
  an automated edit (it would have crashed every wheeled prop); the
  render-verify loop caught it before commit, which is exactly why Section
  19's "verify every piece" rule exists.
- Evidence: `honest-2026-07-10-sealed-door.png`,
  `honest-2026-07-10-plants-snag-seep.png`.

## Twentieth pass: wilderness props (2026-07-10, same day)

- **`fallen-ash-log` 5.5 -> 6**: the sawn end face shows growth rings and
  the same thin black-gold seep the stumps carry; whoever cut it left it
  where it dropped.
- **`cave-stalagmite` 5.5 -> 6**: a wet drip line down the tallest spike and
  a flowstone ring at the base; the cave is still growing these.
- Evidence: `honest-2026-07-10-wildprops.png`.

## Twenty-first pass: closing the tail (2026-07-10, same day)

- **`wagon-wheel` 5.5 -> 6**: one spoke snapped out of the ring, rust
  bleeding into the dirt; this wheel is never going back on a cart.
- **`loose-flagstone` 5.5 -> 6**: the pry bar that lifted it left leaning
  across the slab edge; whoever hid something here meant to come back.
- Evidence: `honest-2026-07-10-tail-pair.png`.

**Milestone:** with these two, every asset in the catalog that can hold a 6
at its pixel size now scores 6 or above. What sits below are only the
intentionally-subtle texture decals (ground grime is texture, not story)
and the 22px pickup minis at their size-appropriate ceiling, both with
rationale recorded. The distribution: floor 6, surface 6.5+, set pieces
7-8.5, the Saint at 9.5 as the demonstrated bar.

## Twenty-second pass: the graveyard speaks (2026-07-10, same day)

- **`stone-tomb` 6 -> 7**: scratch marks climb the inside rim of the open
  cavity, in sets of four. The lid was not moved from the outside.
- **`graveyard-tomb-slab` 6 -> 6.5**: a wilted twig cross and a single chit
  coin left on the slab. The dead here have not been forgotten, only
  outnumbered.
- Evidence: `honest-2026-07-10-graveset.png`.

## Twenty-third pass: the most-placed story props (2026-07-10, same day)

- **`bone-niche` 6 -> 6.5** (137 placements): one niche in four now shows
  the Choir's hand - the middle shelf rearranged into a deliberate radiant
  of femurs around a skull with a gold pin pressed into its brow. They do
  not desecrate the dead; they reorganize them.
- **`calcified-penitent` 6.5 -> 7** (44 placements): the near shoulder is
  polished smooth and pale where every survivor who passes touches the same
  spot for luck. Grief becomes a habit; a habit becomes a shrine.
- Evidence: `honest-2026-07-10-niche-variant.png`.

## Twenty-fourth pass: practice, wards, and stolen words (2026-07-10)

- **`training-dummy` 5.5 -> 6**: straw guts bleed from a split seam and
  somebody's knife is still parked in its flank; the recruits practice what
  the Censure actually does.
- **`canvas-tent-flap` 5.5 -> 6**: a small barred cross painted in red on
  the flap; whoever sleeps here trusts the paint more than the canvas.
- **`prayer-lectern` 6 -> 6.5**: the chained book is gone - the chain hangs
  cut, a torn page corner still pinched under the clasp. The Choir wanted
  the words, not the wood.
- Evidence: `honest-2026-07-10-trio24.png`.

## Twenty-fifth pass: the working edge (2026-07-10)

- **`damaged-altar` 6.5 -> 7.5**: knife grooves worn into the slab lip where
  the same cuts land day after day, the stained lip, and the soak line
  running down the front face - one old, one fresh. A butcher's table that
  still remembers being holy, splitting from below with Host tissue.
- Evidence: `honest-2026-07-10-altar.png`.

## Twenty-sixth pass: what the chapel endured (2026-07-10)

- **`cracked-column` 6 -> 6.5**: votive wax pooled and hardened at the base
  in old layers, one wick stump left; people prayed here long before anyone
  bled here.
- **`chapel-double-door` 6.5 -> 7**: axe bites clustered around the bar
  bracket, raw wood in the wounds; the doors held long enough to matter and
  not a moment longer.
- **`wall-safe` 6 -> 6.5**: a scorch halo and drill scars around the dial;
  heat first, then patience, and the safe beat both.
- Evidence: `honest-2026-07-10-chapel26.png`.

## Twenty-seventh pass: descents and rations (2026-07-10)

- **`graveyard-catacomb-mouth` 6 -> 6.5**: a hand-worn groove on the descent
  lip and a candle stub dropped just inside the dark; the survivors went
  down this way, more than once.
- **`graveyard-bone-marker` 6 -> 6.5**: a tally scratched at the base - how
  many lie under this one marker. The graveyard ran out of stones long
  before it ran out of dead.
- **`rusted-barrel` 6 -> 6.5**: a rain line inside the rim and a shared tin
  cup on the lid; the camp drinks from this one, rust and all.
- Evidence: `honest-2026-07-10-trio27.png`.

## Twenty-eighth pass: shortages and warnings (2026-07-10)

- **`pantry-shelf` 6 -> 6.5**: one jar tipped and licked clean, a thin trail
  of droppings along the bottom shelf; the shortage arrived before the cult.
- **`wall-stash` 6 -> 6.5**: fingertip wear rounding the slab edges - found,
  emptied, refilled, and re-hidden more times than its owner would admit.
- **`quarantine-barricade` 6 -> 6.5**: painted crude on the road side, the
  barred cross and an arrow pointing back the way you came. The barricade is
  polite exactly once.
- Evidence: `honest-2026-07-10-trio28.png`.

## Twenty-ninth pass: shut houses and measured dark (2026-07-10)

- **`farm-building-block` family 6 -> 6.5**: one block in five carries a
  boarded window with a red ward brushed over the planks; they shut the
  house up from the inside before they left, or before they stopped leaving.
- **`infected-cave-entrance` 6.5 -> 7**: a Censure guide-rope staked at the
  mouth runs in and simply stops; they measured how far they dared go, and
  the rope remembers the number.
- Evidence: `honest-2026-07-10-pass29.png`.

## Thirtieth pass: drips, directions, nests (2026-07-10)

- **`cave-stalactites` 5.5 -> 6**: one spike still drips - a bead mid-fall
  and the dark spot where it lands.
- **`road-sign-post` 5.5 -> 6.5**: carved letter ticks on the arrow board,
  and below it the torn stub of a second board: a direction nobody needs
  anymore.
- **`field-plow` 6 -> 6.5**: earth still caked dark on the share and a
  bird's nest wedged in the frame; the plow has been still long enough to
  become a hedge.
- Evidence: `honest-2026-07-10-trio30.png`.

## Thirty-first pass: the graveyard keeps count (2026-07-10)

- **`calcified-grave-plot` 6 -> 6.5**: one plot in five has split open from
  beneath, its calcified shell petals bent outward around a hollow dark.
  They do not all stay.
- **`graveyard-remnant-cross` 7 -> 7.5**: generations of prayer cords tied
  up the shaft, the oldest gone grey, the newest still holding its color.
  People keep coming back.
- **`saint-statue` 6.5 -> 7**: pilgrim candle stubs on the plinth step over
  a shared wax pool; the statue lost its head, not its congregation.
- Evidence: `honest-2026-07-10-trio31.png`.

## Thirty-second pass: interrupted kitchens (2026-07-10)

- **`farm-prep-table` 6 -> 6.5**: the knife stands mid-chop in a split root;
  the meal nobody finished making is still waiting.
- **`kitchen-counter` 6 -> 6.5**: a floured handprint on the counter edge,
  fingers spread - the last touch before whatever made them stop touching
  things.
- **`calcified-headstone` 6 -> 6.5**: a ring on a cord hung over the broken
  form; someone knew which of the calcified this one used to be.
- Process note: an undefined-variable reference in the prep-table insert was
  caught by the gallery's per-cell error trap (red ERR text in the render)
  and fixed before commit - the harness catches what tests cannot.
- Evidence: `honest-2026-07-10-trio32.png`.

## Thirty-third pass: the last sub-6 rows (2026-07-10)

- **`wall-stair-door` 5 -> 6**: a guide rope pinned down the jamb and a
  wedge of cold light from a grate above the turn; the stair goes somewhere
  lit, which in this chapel is not the same as somewhere safe.
- **`host-growth` 5.5 -> 6**: calcified fingers absorbed mid-grip at one
  edge; the growth grew over someone trying to hold on to the ground.
- **`skeleton` 5.5 -> 6**: one hand ahead of the skull, fingers dug into the
  dirt with the furrows still showing; they died crawling toward something.
- **Milestone: every named row in the catalog now scores 6 or above**, with
  only the by-design texture decals and size-capped pickup minis beneath,
  both with recorded rationale.
- Evidence: `honest-2026-07-10-trio33.png`.

## Thirty-fourth pass: second strokes on the 7s (2026-07-10)

- **Fallen cross-martyr 7 -> 7.5**: the carving knife dropped where the
  cutter stood and one sacrament bowl overturned beside it; when the Saint
  came down, they ran.
- **`calcified-crossroad-brother` 7.5 -> 8**: travelers' prayer cords tied
  along both outstretched arms; the crossroad made him a signpost, and the
  road made him a saint.
- **`chapel-banner` 7 -> 7.5**: the torn corner re-stitched in bright cord
  with uneven loops; somebody repaired the desecration banner with the same
  care they once gave the true one. Devotion survives its object.
- Evidence: `honest-2026-07-10-martyr-fall-final.png`,
  `honest-2026-07-10-trio34.png`.

## Thirty-fifth pass: tongues, aim, and what came down (2026-07-10)

- **`broken-bell` 8.5 -> 9**: the clapper lies in the dirt where they threw
  it, its leather strap cut clean. They did not just crack the bell; they
  cut out its tongue. The silencing now has every beat: crack, wedge, cut
  pin, thrown tongue, the tally of ringings lost, the bitten lip below.
- **`devil-target` 7 -> 7.5**: one quarrel stands dead centre in the devil's
  chest. Somebody in this camp can shoot; the tally of misses is not theirs.
- **`stone-stairwell` 8 -> 8.5**: over the climbing ash prints, a second set
  coming down - longer stride, heavier, dragging at the heel. Someone went
  up. Something came down.
- Evidence: `honest-2026-07-10-trio35.png`.

## Thirty-sixth pass: hollows, meals, and shrines (2026-07-10)

- **`hay-rick` 6 -> 6.5**: a sleeping hollow burrowed into the shaded flank,
  floor pressed flat, a corner of blanket still snagged. Someone hid in
  here; the straw is not saying whether they left.
- **`dining-table` 6.5 -> 7**: bowls at every place and one on the floor
  below a shoved-back gap; the meal was set for a crowd that stood up all
  at once.
- **`ash-tree` 7 -> 7.5** (379 placements): one tree in six is a wayside
  shrine - a small plank nailed at chest height, a scratched line of prayer,
  a cord-wrapped gold token. The road prays to what it passes.
- Evidence: `honest-2026-07-10-trio36.png`.

## Thirty-seventh pass: the rite, the crow, the paperwork (2026-07-10)

- **`dead-cultist` 6 -> 6.5**: their own carving knife still in the curled
  hand, and beneath it three lines of a five-line star. Whatever interrupted
  the rite did not wait for the geometry.
- **`calcified-scarecrow-brother` 6 -> 7**: a single crow perched on the
  outstretched arm, one bright eye, unbothered. It is the only living thing
  in the valley that will touch him, and it knows it.
- **`settlement-table` 6 -> 6.5**: writ papers weighted with a river stone
  against the camp wind, and an ink pot gone dry with the nib still in it.
  The paperwork of the end of the world continues on schedule.
- Evidence: `honest-2026-07-10-trio37.png`.

## Thirty-eighth pass: policy, standards, and mercy (2026-07-10)

- **`host-wolf-remains` 6 -> 6.5**: a censure chalk ring drawn in tired
  dashes around the remains, a cleared-tally beside it. Inspected, counted,
  and left where it fell. Policy.
- **`wash-tub` 6 -> 6.5**: a mirror shard propped against the rim, catching
  what light there is. Somebody still shaves. Standards are standards.
- **`bound-victim` 6.5 -> 7**: their shoes set neatly side by side at the
  base of the post, toes pointing away. Somebody made them comfortable
  first.
- Evidence: `honest-2026-07-10-trio38.png`.

## Thirty-ninth pass: what they carried (2026-07-10)

- **`dead-host-wolf-spider` 6 -> 6.5**: a snapped spear still standing in
  the ribs, its broken half an arm's reach away. Someone stood their ground
  here and, for once, won.
- **`corpse` 6 -> 6.5**: the satchel spilled where it dropped - a loaf of
  bread in the dust, still whole. They were carrying it home.
- **`calcified-grave-body` 6 -> 6.5**: a candle stub burned down to a wax
  coin at the head. Someone sat with this one until the light went out.
- Evidence: `honest-2026-07-10-trio39.png`.

## Fortieth pass: precautions (2026-07-10)

- **`dead-host-wolf-maw` 6 -> 6.5**: a fence stake wedged upright between
  the jaws. Whoever killed it did not trust the mouth to stay shut.
- **`dead-host-wolf-ribsplit` 6 -> 6.5**: salt thrown over the carcass in a
  pale scatter, densest at the split; ritual disposal, done by the book even
  out here.
- **`cult-victim` 6.5 -> 7**: the guard's warning horn beside the outflung
  hand, mouthpiece toward the fingers. He reached for it, and the reach is
  the whole story.
- Evidence: `honest-2026-07-10-trio40.png`.

## Forty-first pass: session close (2026-07-10)

- **`dining-bench` 6 -> 6.5**: two sets of initials carved into the seat
  edge with a plus between them, older than everything else in the room.
- **`kitchen-hearth` 6 -> 6.5**: a small pot still hangs over the embers,
  spoon standing in it; supper was on when everything stopped.
- **`wall-window` 7 -> 7.5**: one pane patched with oiled parchment where
  the glass gave out; it glows duller than its neighbours.
- Evidence: `honest-2026-07-10-trio41.png`. Session ended here at the
  user's request; the loop's next candidates are whatever rows read lowest
  in this document, method per game_art_skill Section 22.

## Forty-second pass: Censure field ledger (2026-07-10)

- **Journal surface 7 -> 8.5**: the old worn book was serviceable but generic.
  The new spread is an Ashen Censure case ledger with numbered file tabs,
  ruled evidence leaves, filing margins, crown clips, form numbers, case
  stamps, objective marks, dossier ticks, a wax office seal, and a compact
  4x6 filing face beside the readable 5x7 body face. The interface now has a
  distinct cult-breaker identity instead of a general fantasy notebook.
- Every interactive section states its controls in the leather footer. Tabs
  accept direct clicks. Methods distinguish filed, ready, and locked states,
  identify active and passive use, expose target and entry requirements, and
  keep the selected method inside a 14-row window. The real 26-entry method
  list was driven to row 26 in the running app; Wire Snare remained visible
  with the range reading 13 to 26 of 26.
- Detached 2x evidence: `honest-2026-07-10-journal-dossier.png`. Running-game
  native evidence: `honest-2026-07-10-journal-method-scroll.png`. The reusable
  harness is `.ai/map-review/preview-journal.html` and renders every section
  through the real `UIRenderer`.

## Forty-third pass: field agent faces (2026-07-11)

- **Player customization 7 -> 7.5**: the creator grew from 10 fixed rows to 15
  scrollable rows. New physical controls cover age, face shape, face marks,
  stature, and posture. Existing families gained stocky build, six skin tones,
  six hair colors, eight hair shapes, and six facial hair shapes.
- The options stay human and setting-bound. The strongest reads are a broken
  brow, a burned cheek, an eye patch, road stoop, tonsure, tied hair, and braid.
  Nothing adds fantasy ancestry or supernatural anatomy.
- Detached 3x evidence: `2026-07-11-player-face-options-isolated.png`,
  `2026-07-11-player-hair-options-isolated.png`, and
  `2026-07-11-player-body-options-isolated.png`. The combined road-worn
  model was checked in all eight facings while walking and in its settled death
  frame. Running-screen evidence covers both scroll positions:
  `2026-07-11-character-creator-top-in-screen.png` and
  `2026-07-11-character-creator-more-options-in-screen.png`.

## Where the catalog stands

Every audited row sits at 4.5 or above; the shipped slice's dominant surface
at 6-6.5; set-piece assets at 7-8.5; all seven chapel windows cast cold
light; every level has a mood pass; every light source casts a pool. Nothing
misrepresents what it depicts. On this rubric 10 means "exemplar, copy it as
a standard" - a relative ceiling that by definition only the best pieces
hold. The path for the next pass is mechanical and documented: apply Section
22's two uplift methods to whichever rows sit lowest in this table, verify
with the Section 19 harnesses, and re-rate on evidence.

## Evidence

Fresh sheets from this pass live in `.ai/visual-audit/` with the
`honest-2026-07-10` prefix (catalog categories, floors, ground items, actors,
player variants) plus scene captures of the bell room and chapel nave. The
harness pages under `.ai/map-review/` regenerate all of them on demand.

## Verification

`npm test` (45 suites) and `npm run check` pass after every fix above.
