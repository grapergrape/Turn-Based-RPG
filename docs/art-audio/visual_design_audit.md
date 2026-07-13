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

## Forty-fourth pass: the bell stair, aligned (2026-07-11)

First layout/orientation pass, prompted by "the staircase isn't aligned with
the wall." The stair is two objects: a `wall-stair-door` (the lit stair mouth
cut into the wall face - already the strongest read) and a `stone-stairwell`
landing on the adjacent floor tile.

- **stone-stairwell 8.5 -> 9.5 (as a landing)**: the prop was a tall free-
  standing masonry portal that duplicated the wall door and floated, because
  its base sat in the middle of the floor while the real stair is cut into the
  wall beside it. Rebuilt as what it actually is - a low, grounded, worn
  threshold flagstone: a full-tile `orientedBox` with a lit masonry lip, a
  foot-polished channel, a dropping recess at the door edge, ash boot-tracks,
  an iron guide-ring, and a censure chalk tally. Made orientation-aware
  (`oriented(...)`), so the local +A axis - the polished path and the drop -
  always points at the door. Added to `SUN_SHADOW_SKIP_KINDS` (a flush stone
  should not cast a blob shadow).
- **Layout fix, breach (30,3) landing removed**: the breach placement is a
  one-tile-deep wall pocket. Every low prop there is fully occluded by the
  flanking walls that draw in front of it (verified with a debug locator: the
  prop renders exactly on its tile but the pocket walls paint over it). A
  landing cannot be seen there, so the redundant landing object was deleted;
  the `wall-stair-door` at (31,3) carries the same interact and reads as the
  stair on its own.
- **Bell room (5,9) landing kept, orient `nw`**: that placement sits on open
  floor in front of a back-facing wall door, so it is not occluded and the
  worn threshold reads (lit lip + recess visible against the dark chamber).
- Lesson recorded for the orientation sweep: in this depth-sorted iso, a floor
  prop in a pocket surrounded by walls of greater `x+y` is occluded from the
  camera; low props belong on open floor, tall structures where they poke above
  the front wall line. Detached evidence:
  `2026-07-11-stairwell-landing-orients.png` (all four orients on the real
  chapel floor + mood) and `2026-07-11-bell-landing-in-scene.png`.

## Forty-fifth pass: the floor stops scribbling (2026-07-11)

Highest placement-count surface in the game: `drawRuinedStoneFloorCell` (the
`stone` default, every chapel and most interiors), sitting at 6.

- **stone floor 6 -> 7.5**: the busyness came from two mark systems firing on
  the *same* ~45% of tiles (`seed % 20 < 9`) - a chip run, a wide diagonal
  crack, and an always-on horizontal chip mark all stacked, leaving the rest
  bare and the whole surface reading as scribble. Cut the crack to ~25% of
  tiles, decorrelated (`seed % 4 === 0`), hairline by default and wide only
  occasionally; dropped the always-on chip mark. The ground is now quiet enough
  that damage reads as damage.
- **New character: broken flagstones.** ~1 tile in 13 is a missing flag - a
  shallow recess of packed dirt and rubble with a lit break-lip and a dark far
  rim, seated below the floor plane. Rare enough to be an event, not texture;
  it gives the ruined chapel real "the floor gave out here" storytelling
  instead of uniform tiling.
- Verified clean at 4x (`floor-stone` before/after) and, decisively, at game
  scale in the breach nave with the mood wash and every prop in place
  (`2026-07-11-breach-nave-new-floor.png`): calmer, storied, coherent. New dev
  harness `.ai/map-review/preview-floor.html` renders any floor style as a
  patch, clean or moodied.

## Forty-sixth pass: the rest of the over-marked floors (2026-07-11)

Same principle as pass 45, applied to the other busy surfaces.

- **packed-earth 6 -> 7.5** (barn, sheds, camp): the BASE cell was the culprit -
  it stamped footprints, two-to-three furrow lines, up to seven bright clothTan
  scratch lines, four chips, seven bone-flecks AND ground-scratches on *every
  tile*. Rewrote it so each trace fires on a decorrelated subset (`seed % 3/4/5/6`),
  leaving quiet trodden ground between events; trimmed the story overlay to just
  the tent-stake holes at 25% and dropped its always-on bright diagonal.
- **ash-gravel 6.5 -> 7.5**: the base cell already carries the gravel, so the
  story overlay's twelve extra chips on 65% of tiles were pure noise. Replaced
  with a sparse drag-scratch or boot-scuff on ~25% of tiles.
- **cave-stone 6.5 -> 7.5**: the base rock already fractures; the overlay's three
  extra cracks on 65% of tiles doubled them up. Replaced with an occasional damp
  seep (dark low-alpha pool + one wet glint) or a dropped bone-fleck.
- **graveyard-earth 6.5 -> 7.5**: tally scratches were stamped on *every* tile
  (no gate) - pure wallpaper. A scratched grave-count is a specific act, so it
  now fires on ~15% of tiles; burial seams still imply the plot grid but a fifth
  of tiles stay undisturbed so the grid is not perfectly uniform.
- **road-shoulder 6.5 -> 7.5**: dropped from 60% marked with a wide crack + six
  chips to ~35% with a hairline and three chips, so loose stones gather in spots
  instead of coating the verge. forest-floor, mud-track, ash-road, farm-plank,
  wheat-field and furrow-field were reviewed and read acceptably as-is.
- Verified at 5x and in-scene at game scale: the storage shed (packed-earth now
  quiet trodden dirt, props read clean) and the infected cave (cave-stone calm
  rock, the river pool and Imprint creatures carry the scene). Evidence:
  `2026-07-11-scene-shed-floor.png`, `2026-07-11-scene-cave-floor.png`.

## Forty-seventh pass: the stone floor becomes masonry (2026-07-11)

Pushing the dominant surface past "calm" toward exemplar.

- **stone floor 7.5 -> 8.5**: added a faint **fitted-flag bevel** - every flag
  now catches the upper-left light on its top two edges (stoneDust @ 0.13) and
  drops into shadow on its lower-right two (outline @ 0.22), so the floor reads
  as laid, bevelled masonry with real depth instead of flat diamonds. This
  replaced the old random single-edge "implied joint" and the random-side
  `drawFloorEdgeWear`, which were inconsistent tile-to-tile. Added a third
  (darker) base tone to the wear-zone rotation and a **zone-scale bloom** (whole
  2x2 zones occasionally darken under one broad soot/damp stain) so the floor
  carries big soft shapes, not only per-tile spots.
- The result reads like a premium late-90s CRPG stone floor (fitted flagstones,
  large stained areas, the occasional broken flag) while staying quiet enough to
  sit under props. Verified at 4x and in the breach nave at game scale with mood
  (`2026-07-11-breach-nave-beveled-floor.png`).

## Forty-eighth pass: the walls become fitted stone (2026-07-11)

Walls are the largest pixel area in every interior; the stone wall block
(`drawIsoWallBlock`) drew each face as one flat plane with course/seam lines on
top, so it read as a single slab rather than laid stone.

- **stone wall 7.5 -> 8.5**: added `drawStoneBlockTones` - it weathers ~35% of
  the individual blocks (the grid already implied by the courses at
  v=0.2/0.38/0.57/0.75/0.9 and seams at u=0.16/0.34/0.51/0.69/0.86) a shade
  lighter or darker than the base fill, painted under the course lines. Close
  tones and a minority of blocks, so it reads as the weathering of fitted stone,
  not a checkerboard. Applies everywhere the stone wall block is used (every
  chapel and stone interior) at zero data cost.
- With passes 45-47, the whole chapel now reads coherently premium: bevelled
  flagstone floor + weathered coursed-masonry walls + storied props. Verified in
  the breach nave at game scale (`2026-07-11-breach-walls-blocktone.png`).

## Forty-ninth pass: a crash caught in the catalog sweep (2026-07-11)

While surveying the creature gallery for weak props, the `calcified-crossroad-
brother` cell rendered "ERR side is not defined" - a real `ReferenceError`.

- **Bug**: `drawThrownRoadOfferings(ctx, cx, cy, seed)` referenced `side` and
  `shoulderY`, which are locals of the *caller* (`drawCalcifiedCrossroadBrother`),
  not parameters of the offerings helper. A "polished shoulder" detail had been
  pasted into the wrong function. The kind is placed in `long_ash_road_approach`,
  and the live renderer does not wrap prop draws in try/catch, so this threw
  during that level's scene bake - a shipped crash, not just a gallery glitch.
- **Fix**: moved the two polished-shoulder pixels back into the brother function
  after the torso rows (where `side`/`shoulderY` are in scope) and dropped them
  from the offerings helper. The sign-brother now renders: a body calcified at a
  crossroads, arms spread as a signpost, ribs bared - strong body-horror.
- **Guard**: added `tests/catalogRender.test.mjs` (wired into `npm test`), which
  executes every one of the 131 catalog draw functions across 6 seeds/orients
  against a permissive mock context and asserts none throw. A misplaced free
  variable can no longer ship silently. Confirmed all 131 kinds render clean.

## Fiftieth pass: the most-placed asset in the game (2026-07-11)

A placement census across all levels put `wheat-clump` first by a wide margin -
**878 instances** (next were ash-tree 374, scrub-bush 261). It is the outdoor
equivalent of the floor, so its read sets the tone of every field.

- **wheat-clump ~7 -> ~8**: the grain heads were flat 3-4px blocks on sticks -
  matchsticks with square lollipops. Reshaped each into a narrow bristled
  spindle that noses over with the shared wind lean, tapers to a point, and
  splays a couple of fine awns off the crown; the snapped-stalk heads now droop
  to a point too. The gold Host-touched grain still accents one in five. A field
  of them now reads as weather-beaten dead wheat rather than sticks. Verified in
  the plant gallery across six seeds (`2026-07-11-wheat-clump-heads.png`).

## Fifty-first pass: thinning the dead canopy (2026-07-11)

- **ash-tree ~7.5 -> ~8** (374 placements, 2nd-most-placed): the leaf clumps
  read as solid cotton puffs. Punched three ash-eaten gaps of deep shadow into
  every `leafClump` (the shared foliage primitive), so the dead crowns read as
  thinning to holes rather than full summer foliage. Because it lives in the
  shared primitive, ash-sapling and any scrub foliage thin consistently too -
  verified across ash-tree, scrub-bush and ash-sapling with no regression.

## Fifty-second pass: 191 skeletons, no longer one stamp (2026-07-11)

- **skeleton ~7 -> ~8** (191 placements, most-placed gore): the draw only varied
  by a left/right `flip` - every body was otherwise the same pose, so a field of
  them read as copy-paste. Added seed-driven variation: spine length (8-10
  vertebrae), rib count (3-5), a disarticulation `spread` factor, per-bone flung
  limb angles, an optional scavenger-dragged long-bone off to the side (40%),
  and the crawl-reach hand now appears on ~60% rather than always. Verified
  varied across six seeds (`2026-07-11-skeleton-varied.png`).
- **bone-niche** (137 placements) reviewed and left as-is: it already reads as a
  masonry ossuary recess of stacked skulls and long-bones, with per-seed
  arrangement variation.

## Fifty-third pass: the web you can actually see (2026-07-11)

- **cobweb ~7 -> ~8** (52 placements): the web had good bones - corner anchor,
  five spokes, two catch-rings, a wrapped husk - but the strands were dark
  `stoneDust` on a dark floor, so it vanished into a faint scratch. Recoloured
  the structural spokes to bone-pale `hostBone` (dusty silk catches light) with
  the finer catch-rings a shade darker in `stoneDust`, and softened the alpha to
  0.8 so it stays delicate. It now reads as a web with something wrapped in it.
- **bone-pile (48)** and **calcified-penitent (44)** reviewed and left as-is -
  both read cleanly (a mound of skulls and long-bones; a body turned to bone
  with a broken halo), no longer the "goofy pile" of the original complaint.

## Fifty-fourth pass: columns as stacked drums (2026-07-11)

- **cracked-column ~7 -> ~8**: the shaft was one flat dark post and copies were
  near-identical. Gave each of its four drum sections a seed-keyed shade off the
  base fill (the same masonry-weathering read as the walls), painted on the
  central face so the lit-left / shaded-right modelling holds. Columns now read
  as stacked stone drums and no two weather alike.
- **choir-pentagram, blood-sigil, ritual-circle, quarantine-sign** reviewed and
  left as-is - the ritual sigils read clearly (inverted pentagram with gold
  nodes and blood runs; blood mark), and the sign posts its barred cross.

## Fifty-fifth pass: irregular flagstones (2026-07-11)

Pushing the dominant surface from "very good" toward exemplar.

- **stone floor 8.5 -> 9**: the last thing holding it to a tile grid was that
  every flag was exactly one tile. Grouped tiles into multi-tile **slabs** (2
  wide, 2 tall, staggered like brick courses every other row) via a `slabId`
  that is a pure function of the coordinates - so a tile and its neighbour
  always agree on whether the edge between them is a joint. The fitted-flag
  bevel now draws ONLY on slab boundaries and a whole slab shares one base tone,
  so adjacent tiles read as one large laid stone with light raking across it.
  The rigid one-tile diamond grid is gone; the chapel floor now reads as a grand
  stone-slab floor. Verified at 4x and in the breach nave at game scale
  (`2026-07-11-breach-nave-slab-floor.png`). The remaining gap to a literal 9.5
  is hand-authored hero detail (traffic-worn paths tied to real door lines),
  which is a per-level art-direction task rather than a primitive change.

## Fifty-sixth pass: atmospheric depth for the natural floors (2026-07-11)

The chapel stone floor got a zone-scale bloom in pass 47 that the natural-ground
floors never received, leaving them a step flatter.

- **cave-stone 7.5 -> 8, packed-earth 7.5 -> 8**: added the same zone-scale bloom
  (a broad low-alpha shadow spanning several tiles on ~1 zone in 6) so whole
  patches of cave and tent/shed floor darken under one soft wet/trodden shadow.
  This adds atmospheric depth to match the stone floor without adding any
  per-tile marks (it is soft shape, not clutter). Verified in the infected cave
  at game scale (`2026-07-11-cave-bloom.png`). The floor family is now coherent:
  stone 9, cave/packed-earth 8, the rest 7.5-8.

## Fifty-seventh pass: the bell chamber, a hero scene (2026-07-11)

The one place bespoke per-scene detail improves rather than clutters: the bell
chamber is the payoff of the named stairwell, and (unlike the densely dressed
breach nave) it was sparse - the cracked bell hung over bare floor with no story
of its fall.

- **bell chamber ~8 -> ~9**: hand-placed a tight cluster of hero decals directly
  beneath the bell - masonry shaken loose from the mount (rubble), a blood
  stain where it came down on someone, an impact floor-crack radiating out, and
  a mourner's blood-sigil left at the spot. The cracked rust bell now reads as a
  thing that FELL and killed, and the composition leads the eye from the player
  up the rope to the bell. This is art-direction on one sparse scene, the level
  where the last half-point genuinely lives - not a primitive change and not
  applied to already-dense scenes. Verified at game scale
  (`2026-07-11-bell-chamber-hero.png`).

## Fifty-eighth pass: the floor reaches exemplar (2026-07-11)

- **stone floor 9 -> 9.5**: added traffic-worn polish - whole slabs on the old
  walking lines catch a soft two-layer sheen toward the light, keyed to the slab
  so a whole stone glows rather than a single tile. This is the lived-in read
  that separates a grand floor from a merely tidy one. The stone floor now
  carries the full exemplar stack: irregular multi-tile slabs, bevelled joints
  only at boundaries, per-slab tone, zone-scale stains, rare broken flags,
  worn-smooth polish, and calm hairline damage - the top of what procedural
  pixel-art flooring reaches in a 640x480 buffer. It joins the Opened Saint as a
  second 9.5 exemplar the rest of the catalog can be measured against. Verified
  in the breach nave at game scale (`2026-07-11-stone-floor-9-5.png`).

## Where the catalog stands

After the 2026-07-11 passes (44-56), the whole game surface has moved up. The
dominant environment: `stone` floor 9.5 (exemplar: irregular multi-tile
flagstone slabs, bevelled joints only at slab boundaries, per-slab tone,
zone-scale stains, rare broken flags, traffic-worn polish),
stone wall 8.5 (per-block weathering on coursed masonry), cave-stone and
packed-earth 8 (zone-scale atmospheric bloom), the other over-marked floors 7.5
(quiet ground, marks as events).
The most-placed props, worked by placement census: wheat-clump 8 (878 - nodding
awned heads), ash-tree 8 (374 - thinned dead canopy), skeleton 8 (191 - seed-
varied pose + scavenger drags), cobweb 8 (52 - pale readable web); bone-niche,
bone-pile and calcified-penitent reviewed and already clean. Set-piece assets
sit at 7-9.5 (Opened Saint 9.5), the remaining mid-tier props at 7-8.5, every
audited row at 4.5+. All 131 catalog kinds render without error (regression-
tested in `tests/catalogRender.test.mjs`); all seven chapel windows cast cold
light; every level has a mood pass; every light source casts a pool. Nothing
misrepresents what it depicts, and nothing crashes.

The chapel now reads coherently premium end to end - bevelled flagstone floor,
weathered coursed-masonry walls, storied props, cold window light. On this
rubric 10 means "exemplar, copy it as a standard" - a relative ceiling that by
definition only the best pieces hold, so a literal 9.5 on all ~130 runtime-drawn
kinds is not a finite end-state; it is continued incremental polish. The next
rows to lift are the natural-ground floors (packed-earth/gravel/cave at 7.5,
which resist a masonry bevel) and any mid-tier prop that still reads flat -
apply Section 22's methods, verify with the Section 19 harnesses, re-rate on
evidence.

## Evidence

Fresh sheets from this pass live in `.ai/visual-audit/` with the
`honest-2026-07-10` prefix (catalog categories, floors, ground items, actors,
player variants) plus scene captures of the bell room and chapel nave. The
harness pages under `.ai/map-review/` regenerate all of them on demand.

## Verification

`npm test` (45 suites) and `npm run check` pass after every fix above.

## Fifty-ninth pass: north graveyard chapels (2026-07-12)

- **graveyard mortuary and vigil chapels: new 7.5**: added two connected 4x3
  chapel blocks immediately behind the Long Ash graveyard's north wall. Cold
  coursed masonry, pointed mortuary recesses, a dark slate roof, and an
  asymmetric bell cot make them read as cemetery buildings rather than oversized
  tombs. Their surrounding forest clutter was cleared only in the narrow
  roofline, so both landmarks remain visible without sacrificing a grave or
  aisle.
- **roof silhouette 6.5 to 7.5 in scene**: the first capture made the broad
  roof read too flat. Added a short raised gable ridge along the wall-facing
  slope, with a stoneDust upper edge and dark opposing edge, running into the
  bell cot. The ridge breaks the slab read at gameplay scale without adding
  windows or lights.
- **Evidence**: detached catalog render
  `2026-07-12-graveyard-chapels-isolated.png`; real Long Ash Road scene crop
  `2026-07-12-graveyard-chapels-north-wall.png`. The mortuary is the stronger
  landmark; the smaller vigil reads as a second chapel, not a plot or shed.

## Sixtieth pass: lived-in Long Ash farm interiors (2026-07-12)

- **farm bed: new 8**: a narrow timber frame, compressed straw mattress,
  patched quilt, tall headboard, and slippers read as a working family's bed at
  gameplay scale. Three beds now form one sleeping wall in the farmhouse.
- **grain sacks and grain bin: new 7.5 and 8**: sack piles use tied necks,
  stitched seams, slumped weight, and a dull grain spill. Open board bins show
  grain beneath a heavy rim, with a scoop across the top. The grain shed now
  reads by function before any label is visible.
- **farm workbench: new 8**: the raised peg rail, hanging tools, fixed vise,
  hammer, saw, loose nails, and one glove give it a distinct tool-work
  silhouette. Paired benches form the tool shed's repair wall, while one bench
  anchors the barn machinery bay.
- **stable divider: new 7.5**: a solid hoof board, paired rails, heavy posts,
  and a tied halter read as livestock partitions. Connected runs now divide the
  barn into three feed and hay bays beside a clear cart aisle.
- **five interior layouts: 4 to 7.5 or 8**: the old layouts placed isolated
  objects across oversized empty shells. The farmhouse now separates sleeping,
  pantry, dining, kitchen, and wash use. The barn separates stalls from farm
  machinery. Storage sits around reachable perimeter aisles, while the grain
  and tool sheds carry dense single-purpose inventories. The entrance path and
  every clue or container remain reachable.
- **Evidence**: detached renders
  `2026-07-12-farm-interior-furniture-isolated-v2.png`,
  `2026-07-12-farm-workbench-stable-isolated-v1.png`, and
  `2026-07-12-stable-divider-isolated-v1.png`; real scene renders
  `2026-07-12-farmhouse-interior-after-v1.png`,
  `2026-07-12-barn-interior-after-v1.png`,
  `2026-07-12-storage_shed-interior-after-v1.png`,
  `2026-07-12-grain_shed-interior-after-v1.png`, and
  `2026-07-12-tool_shed-interior-after-v1.png`.

## Sixty-first pass: ten-pass graveyard chapel rebuild (2026-07-12)

- **Pass 1, baseline 5.5**: the original connected 4x3 blocks read as broad
  mausoleums. The doors occupied corner modules and the roofs behaved like
  tiled slabs.
- **Pass 2, proportion**: reduced both buildings to narrow two-cell naves.
- **Pass 3, structural alignment**: derived both roof slopes directly from the
  wall-top diamonds. Eaves, gable ends, and the shared ridge now meet without
  offsets.
- **Pass 4, entrance alignment**: split one pointed double door across the
  exact centre seam of each two-cell facade and removed the inner buttress that
  had divided the opening.
- **Pass 5, roof silhouette**: replaced the solid tower with a pierced ridge
  bell cot containing a visible rusted bell.
- **Pass 6, wall depth**: added stepped corner buttresses, gable coping, and a
  continuous masonry plinth.
- **Pass 7, chapel identity**: added a centred gable oculus and one tall pointed
  lancet per nave bay.
- **Pass 8, materials**: replaced the roof checker grid and uniform noise with
  parallel slate courses, staggered joints, ridge caps, and isolated broken
  slates. Wall joints now stagger by course.
- **Pass 9, scale**: made the vigil chapel a compact 2x2 oratory and retained a
  2x3 mortuary nave. Slightly taller bell cots survive gameplay zoom.
- **Pass 10, site integration**: opened the cemetery wall directly across each
  door and laid a two-tile-deep stone apron without removing or moving a grave.
- **Final score 8.5**: both buildings now read immediately as small cemetery
  chapels. Door, gable, ridge, bell cot, buttresses, lancets, and footprint share
  one coherent isometric construction. The mortuary remains the stronger
  landmark, while the vigil is clearly the smaller companion building.
- **Evidence**: detached connected-footprint renders
  `2026-07-12-graveyard-vigil-chapel-isolated.png` and
  `2026-07-12-graveyard-mortuary-chapel-isolated.png`; final real-level render
  `2026-07-12-graveyard-chapels-final-scene.png`, with close scene crops
  `2026-07-12-graveyard-vigil-chapel-final.png` and
  `2026-07-12-graveyard-mortuary-chapel-final.png`.

## Sixty-second pass: farm interior exit alignment (2026-07-12)

- **interior exit placement: 3 to 8**: all five farm exit doors previously used
  the free-standing floor treatment one cell in front of the south wall. Their
  rectangular faces fought the room's diagonal construction and appeared to
  float. Each exit now occupies its actual boundary wall cell and uses the
  `sw` wall plane, so its jambs, sill, braces, and threshold share the same
  45-degree face as the surrounding boards. The player still enters on the
  adjacent floor cell and can use the door immediately.
- **Evidence**: detached wall-plane render
  `2026-07-12-farm-wall-door-isolated-v1.png`; real scene renders
  `2026-07-12-farmhouse-interior-wall-door-v1.png`,
  `2026-07-12-barn-interior-wall-door-v1.png`,
  `2026-07-12-storage_shed-interior-wall-door-v1.png`,
  `2026-07-12-grain_shed-interior-wall-door-v1.png`, and
  `2026-07-12-tool_shed-interior-wall-door-v1.png`.

## Sixty-third pass: player-scale chapel entrances (2026-07-12)

- **chapel human scale 8.5 to 9**: raised the vigil wall from 34px to 48px and
  the mortuary wall from 40px to 52px. Their pointed door recesses now begin
  close to the eave, providing roughly 46px and 50px of centreline clearance
  for Mara's approximately 50px visible body. The two-cell footprints, aligned
  cemetery-wall openings, buttresses, lancets, and compact chapel silhouettes
  remain unchanged.
- **Evidence**: detached connected-footprint comparisons with the real Mara
  atlas frame, `2026-07-12-graveyard-vigil-chapel-mara-scale.png` and
  `2026-07-12-graveyard-mortuary-chapel-mara-scale.png`; fresh real-level crop
  `2026-07-12-graveyard-mortuary-chapel-human-scale-scene.png`.

## Sixty-fourth pass: Sava Rell carries his shape through motion (2026-07-12)

- **Sava Rell boss sprite 8 to 9**: the long calcified human face, broken
  aureole, one-sided rib opening, fused prayer hand, dragging shroud, and
  overlong rake arm now persist across all eight facings. Rear views no longer
  fall back to a generic robed Host.
- **Attack and walk 8 to 9**: the rake has a cocked wind-up, a direction-correct
  three-finger impact, a readable recovery, and a slight lag opposite the
  planted walk. Hit frames shift the body's weight instead of flashing a static
  icon.
- **Death and corpse 7 to 9**: the ten-frame collapse keeps both feet planted
  before one knee buckles. A calcified neck and torn collar keep the first fall
  key continuous. The final full-width body retains Sava's ribs, prayer hand,
  rake arm, shroud mass, and broken aureole with no living glow.
- **Evidence**: all eight
  `2026-07-12-sava-pass-07-idle-*.png` and
  `2026-07-12-sava-pass-07-attack-impact-*.png` facings, the wind-up, recovery,
  walk, hit, death, and corpse state captures, plus
  `2026-07-12-sava-pass-07-live-combat.png` in the real Vault scene.

## Sixty-fifth pass: the two chapels and the room below them (2026-07-12)

- **Vigil Chapel 8 to 9**: twelve aged candle cups, one crushed place, tied name
  slips, the gravekeeper's worn chair, cut bell rope, loose pages, wax, and a
  fully concealed register give the room one clear identity. Its closed secret
  leaves ordinary stone rather than a black floor tell.
- **Mortuary Chapel 8 to 9**: two receiving biers, a measured washing slab,
  folded cloth, paired drains, a tag board made from hanging brass plates,
  examination case, saint, records, and one motivated working light make it a
  functioning body office rather than a generic chapel room.
- **Listening Vault 8 to 9**: the apparatus now has a receiving bed, shouldered
  bell, driven striker, measurement slip, restraint chair, assay case, wire
  paths, machine oil, and chair wear. The opened niche keeps its stone mass and
  slid seal leaves. An occluded candle that read as a floating flame was
  removed.
- **State integrity**: exact story, flags, item manifests, rewards, collision,
  and routes are unchanged. Closed and opened states were both checked through
  the running game.
- **Evidence**: `2026-07-12-heard-bell-pass-09-props-isolated-closed.png`,
  `2026-07-12-heard-bell-pass-09-niche-isolated-open.png`, and the six
  `2026-07-12-heard-bell-pass-09-*-live-{closed,open}.png` room captures.

## Sixty-sixth pass: Those Who Heard the Bell UI (2026-07-12)

The first independent review held this scoped slice at 8. Its six objections
were resolved and independently re-reviewed before the 9 score was recorded.

- **Dialogue hierarchy 8 to 9**: hard-pixel number plates and conservative
  consequence colors separate ordinary, quiet, committing, and dangerous
  responses. Quiet choices retain the established active green instead of
  blending into narrative copy or reading as disabled grey. Short
  exchanges compact around their content and stay anchored above the HUD, while
  long five-choice conversations keep the full scrolling geometry.
- **Combat information 8 to 9**: HP, AP, attack name, chance or failure reason,
  and full target line all remain inside the status frame, including when Mara
  has a status effect. Stale area-title banners are suppressed during combat so
  they do not compete with a boss reveal.
- **Evidence**: detached
  `2026-07-12-heard-bell-pass-10-dialogue-isolated.png` and
  `2026-07-12-heard-bell-pass-10-combat-hud-isolated.png`; live
  `2026-07-12-heard-bell-pass-10-central-line-ui-final.png`,
  `2026-07-12-heard-bell-pass-10-warning-ui-final.png`,
  `2026-07-12-heard-bell-pass-10-judgment-ui-final.png`, and
  `2026-07-12-heard-bell-pass-10-combat-hud-final.png`.

## Scoped 2026-07-12 scores

These rows apply only to the named story slice. They do not replace the broader
family scores at the top of this audit.

| Slice | Score | Basis |
|---|---:|---|
| Sava Rell boss sprite | 9 | All facings and authored states, detached and live |
| Those Who Heard the Bell chapel rooms and secret props | 9 | Three rooms, closed and opened states, detached and live |
| Those Who Heard the Bell dialogue and combat UI | 9 | High-load decisions, status-plus-attack HUD, detached and live |

## Sixty-seventh pass: a fightable Listening Vault (2026-07-13)

- **Combat layout 7 to 9**: the vault grows from 11 by 12 to 15 by 15 tiles.
  Opening the niche now exposes 140 walkable combat cells instead of 70. The
  niche approach has five immediate retreat cells instead of two, and the
  `x7`, `y3..8` lane remains clear before the chair introduces light cover.
- **Examination chain 8 to 9**: the apparatus moves west of the retreat lane,
  and four copper-wire cells carry its line toward the restraint chair. The
  case and docket remain readable. Two candle stations mark the lower room
  without filling the new flanking space with decorative clutter. The shortcut
  opening sits far enough inside the east side to remain visible at gameplay
  scale.
- **State integrity**: Sava's niche, locks, encounter, flags, dialogue, loot,
  judgment outcomes, and victory effect are unchanged. Both Mortuary routes
  and the graveyard shortcut now arrive on valid cells in the larger room.
- **Evidence**: detached full-room and player-scale captures
  `2026-07-13-listening-vault-expanded-final-closed-detached.png` and
  `2026-07-13-listening-vault-expanded-final-human-scale-detached.png`; live
  captures `2026-07-13-listening-vault-expanded-final-closed-live.png` and
  `2026-07-13-listening-vault-expanded-final-open-combat-live.png`.
