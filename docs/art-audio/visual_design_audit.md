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
  for the player actor's approximately 50px visible body. The two-cell footprints, aligned
  cemetery-wall openings, buttresses, lancets, and compact chapel silhouettes
  remain unchanged.
- **Evidence**: detached connected-footprint comparisons with the real player
  atlas frame, `2026-07-12-graveyard-vigil-chapel-mara-scale.png` and
  `2026-07-12-graveyard-mortuary-chapel-mara-scale.png`; fresh real-level crop
  `2026-07-12-graveyard-mortuary-chapel-human-scale-scene.png`.

## Sixty-fourth pass: Sapphira Rufa carries his shape through motion (2026-07-12)

- **Sapphira Rufa boss sprite 8 to 9**: the long calcified human face, broken
  aureole, one-sided rib opening, fused prayer hand, dragging shroud, and
  overlong rake arm now persist across all eight facings. Rear views no longer
  fall back to a generic robed Host.
- **Attack and walk 8 to 9**: the rake has a cocked wind-up, a direction-correct
  three-finger impact, a readable recovery, and a slight lag opposite the
  planted walk. Hit frames shift the body's weight instead of flashing a static
  icon.
- **Death and corpse 7 to 9**: the ten-frame collapse keeps both feet planted
  before one knee buckles. A calcified neck and torn collar keep the first fall
  key continuous. The final full-width body retains Sapphira's ribs, prayer hand,
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
  and full target line all remain inside the status frame, including when the player
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
| Sapphira Rufa boss sprite | 9 | All facings and authored states, detached and live |
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
- **State integrity**: Sapphira's niche, locks, encounter, flags, dialogue, loot,
  judgment outcomes, and victory effect are unchanged. Both Mortuary routes
  and the graveyard shortcut now arrive on valid cells in the larger room.
- **Evidence**: detached full-room and player-scale captures
  `2026-07-13-listening-vault-expanded-final-closed-detached.png` and
  `2026-07-13-listening-vault-expanded-final-human-scale-detached.png`; live
  captures `2026-07-13-listening-vault-expanded-final-closed-live.png` and
  `2026-07-13-listening-vault-expanded-final-open-combat-live.png`.

## Historical Ash Road South surface shell review (2026-07-14, superseded)

Evidence re-audited on 2026-07-19 shows that records 01 through 90 were not 90
separate design iterations. They contain 67 detached static views and 23
synthetic geometry stress frames, no real-runtime surface capture, no source or
state manifest, and only a small number of implementation states. The images
remain useful history for roof-registration work. They are not current visual
acceptance evidence and do not count toward the later 200-check identity audit.
In particular, the former approval of tents, campfires, bedrolls, generic grave
earth, forest borders, and scattered camp dressing is revoked.

This audit covers only the 130 by 80 Ash Road South surface. It deliberately
excludes the planned helper maps, residents, faction scenes, combat states, and
quests. The spatial reference is
`docs/maps/act-1/ash-road-south/main/planning-map.png`.
Every numbered capture uses the real level loader, sprite atlas, catalog, floor
renderer, depth sort, and mood pass through `.ai/map-review/capture-scene.html`.

The valid evidence set is `.ai/visual-audit/ash-road-south/pass-01.png` through
`pass-50.png`. Detached final evidence is in
`catalog-buildings-final.png` and `catalog-landmarks-final.png` in the same
folder. The player actor appears in passes 42, 44, and 45 for human-scale checks.

| Pass | Focus | Finding or response |
|---:|---|---|
| 1 | Whole-map baseline | The district order matched the planning image, but Rope Rows, the clinic, and the arrival canvas were over-massed. |
| 2 | South approach | Permanent canvas tile blocks made the arrival fringe read as warehouses. |
| 3 | Water Court | The court route was clear, but the condenser lacked landmark weight. |
| 4 | Morrow yard | Wagons, grain cages, freight roofs, and the medicine cart established the west work district. |
| 5 | Rope Rows and charity edge | Housing read as a few large slabs instead of a repaired settlement. |
| 6 | Clinic and grave strip | The clinic dominated the east side and the original graves were too quiet at district scale. |
| 7 | Relief annex | The L-shaped industrial shell and damaged apron held their intended north-west silhouette. |
| 8 | Old measure gates | Screening lanes, admission booth, and transport platform remained distinct and traversable. |
| 9 | Water Court close view | Settling tanks and taps separated correctly, but the central machine still read as ordinary equipment. |
| 10 | First refined whole map | Smaller clinic footprints, 17 house clusters, and free-standing arrival tents restored the reference hierarchy. |
| 11 | Refined Rope Rows | Short courts and cross-lanes broke up the housing mass without losing density. |
| 12 | Refined arrival fringe | Tents, fires, bedrolls, and picket clutter read as newer shelter on mud. |
| 13 | Refined clinic | Pale Compact buildings became a subordinate precinct instead of the map's largest landmark. |
| 14 | Water Court comparison | The revised district was open enough for an assembly, but the condenser remained undersized. |
| 15 | Condenser revision | A wider base, taller governor housing, and tighter tanks and taps gave the court a usable centre. |
| 16 | Whole-map composition | North-south spine, west work loop, and east resident loop were readable in one frame. |
| 17 | North verge | The locked road throat was clear, but the original chain silhouette was too narrow for the road. |
| 18 | Grave and clinic relationship | The cemetery occupied the correct ground without crowding Compact circulation. |
| 19 | Annex apron | Loading space, hoists, rubble, and forest boundary preserved an abandoned repair-yard read. |
| 20 | Screening yard | Frames provided lane rhythm and cover while the admission booth remained the local anchor. |
| 21 | Morrow freight yard | Freight objects formed work clusters with continuous drive lanes. |
| 22 | South chain approach | The chain object did not yet visually span the campaign road. |
| 23 | Charity edge | One continuous worn-canvas field read as a large mat rather than a treatment edge. |
| 24 | Collapsed drain | The culvert silhouette, rubble fan, and edge placement were immediately legible. |
| 25 | Full central spine | Widened north and south chains now crossed their road throats without obscuring the route. |
| 26 | West loop | The arrival fringe, Morrow yard, annex, and gates formed one continuous exploration circuit. |
| 27 | East loop | Charity pads, Rope Rows, clinic, graves, and gates returned cleanly to the Water Court. |
| 28 | South composition | Arrival shelter stayed west of the road while the condenser remained visible on the inward route. |
| 29 | Gate-to-court sightline | Road shoulders, court machinery, and side-loop entries separated cleanly. |
| 30 | Water Court at one-to-one scale | Condenser panels, tanks, tap rails, sump, and ration board held hard-pixel detail. |
| 31 | Northern Rope Rows | House spacing, laundry, pumps, and clinic contrast remained readable through depth sorting. |
| 32 | Southern Rope Rows | Measure Hall retained its civic red roof without swallowing the smaller homes. |
| 33 | Grave-strip district view | The cemetery still read too empty because each mound occupied too little visual area. |
| 34 | Final west loop composition | Work buildings and open freight lanes held a clear silhouette at map scale. |
| 35 | Old gates close view | Booth, frames, benches, and return shelf occupied distinct depth layers. |
| 36 | Medicine-cart yard | Freight wagons and grain cages read as equipment rather than generic crate clutter. |
| 37 | Annex and freight relation | Both industrial footprints remained separate and the loop between them stayed open. |
| 38 | Arrival fringe close view | Tent scale, campfire spacing, and mud dressing supported a temporary edge without replacing the town. |
| 39 | Charity and drain relation | Two treatment pads, six cots, four tents, and the culvert formed separate readable clusters. |
| 40 | Second whole-map review | All ten planned surface districts were identifiable by material and silhouette. |
| 41 | Enlarged grave plots | Longer mounds, brighter ridges, and covered markers made the burial rows visible at district scale. |
| 42 | South chain at player scale | Wide posts, sagging chain, board, player actor, and road throat shared a coherent scale. |
| 43 | North chain at player scale | The locked boundary read clearly against forest and road without implying an open exit. |
| 44 | Water Court with player | The condenser dominated a person without becoming building-sized; court props retained useful gaps. |
| 45 | Rope Rows with player | Homes read as small repaired buildings around human-width lanes, not chibi huts or giant halls. |
| 46 | Final west coverage | Relief and freight silhouettes, work-loop continuity, and arrival contrast passed without further change. |
| 47 | Final east coverage | Graves, clinic, homes, Hall, charity pads, and drain kept the reference's north-to-south order. |
| 48 | Final south coverage | The outer camps, return chain, Water Court, and both loop entries remained legible together. |
| 49 | Final north and centre coverage | Annex, gates, clinic, grave strip, court, and Rope Rows maintained distinct values and roof colors. |
| 50 | Final whole-map acceptance | The rendered map preserved the planning image's district placement, central road, paired loops, and landmark hierarchy. |

### Final scoped scores

| Category | Score | Basis |
|---|---:|---|
| Planning-image fidelity | 8.5 | All ten surface districts, central spine, paired loops, and edge landmarks preserve the reference placement |
| District silhouette | 8.5 | Relief rust, Compact canvas, rowhouse timber, civic red, grave earth, and arrival mud separate at whole-map scale |
| Landmark readability | 8.5 | Condenser, screening frames, freight yard, chains, graves, clinic, Hall, and culvert survive district crops |
| Human scale | 8 | Player comparisons at the chains, Water Court, and Rope Rows retain grounded adult proportions |
| Pixel craft and palette | 8.5 | Hard pixels, project palette ramps, upper-left highlights, contact shadows, and no smooth effects |
| Traversal readability | 9 | Central spine and both loops are visually continuous and backed by route assertions |
| Overall surface shell | 8.5 | Strong authored settlement shell with intentional space reserved for later residents and story states |

No scoped category is below 8. The main limitation is intentional: this is a
surface shell, so population, faction occupation, dialogue staging, combat
cover states, and helper-map doors will be judged when those slices are built.

## Historical Ash Road South connected-surface review: records 51 to 70 (2026-07-15)

This continuation isolates roof, wall, floor-transition, and depth-sort
registration on the existing Ash Road South surface. Passes 51 to 63 use the
detached catalog harness at enlarged hard-pixel scale. Passes 64 to 70 use the
real level loader, catalog, floor renderer, actor atlas, depth sort, and mood
pass. The evidence is `.ai/visual-audit/ash-road-south/pass-51.png` through
`pass-70.png`.

| Pass | Focus | Finding or response |
|---:|---|---|
| 51 | Six building styles, 4 by 3 footprints | Wall faces shared the 64 by 32 grid, but every 72 by 40 roof cell overlapped its neighbors and read as a stack of separate slabs. |
| 52 | Eight-cell x-axis runs | Roof course endpoints missed the next cell by four pixels in both screen axes. Bright eave ribs exposed the mismatch. |
| 53 | Eight-cell y-axis runs | The same overlap produced repeated cross-ribs and a dark internal channel on narrow rowhouse and freight footprints. |
| 54 | Eight by two annex and Hall | Repeated internal rims made continuous industrial roofs read as tiled platforms. |
| 55 | Two by eight clinic and booth | Wall courses stayed aligned, confirming that the fault was isolated to roof geometry, shade, and edge ownership. |
| 56 | First corrected 4 by 3 comparison | Exact 64 by 32 roof diamonds removed overlap. A five-pixel fascia restored the eave while remaining registered to the wall cap. Roof-local patches replaced screen-horizontal rectangles. |
| 57 | Corrected x-axis runs | Surface courses joined, but an internal rear edge still appeared on each cell because the x-minus and y-minus edge conditions were crossed. |
| 58 | Corrected y-axis runs | The reciprocal repeated edge confirmed the axis-mapping fault. |
| 59 | Corrected eight by two footprints | Large roofs had continuous fill and texture, while their remaining bright ribs isolated edge ownership as the final defect. |
| 60 | Corrected two by eight footprints | Fascia, wall tops, patches, and flecks stayed on their planes; no floating roof noise remained. |
| 61 | Final x-axis runs | Swapping rear-edge ownership removed every internal rim. Three roof courses continue from end to end without a pixel offset. |
| 62 | Final y-axis runs | The second grid axis also forms one continuous roof with only true exterior perimeter lines. |
| 63 | Final six-style catalog | Rowhouse, annex, clinic, freight, Hall, and booth materials all preserve the same corrected geometry without losing their palette identity. |
| 64 | Relief annex live L-shape | Courses and fascia follow both concave corners without cracks, overlaps, floating pixels, or depth-sort leaks. |
| 65 | Morrow yard live crop | Both freight footprints align with their walls and remain distinct from wagons, cages, roads, and the annex behind them. |
| 66 | Compact clinic live crop | Pale roof courses remain continuous across the damaged L footprint and the detached treatment building. Floor boundaries meet wall bases cleanly. |
| 67 | Northern Rope Rows live crop | Seventeen small-house clusters keep separate silhouettes while every individual roof reads as one repaired plane. |
| 68 | Southern Rope Rows and Hall | The red civic roof and surrounding dark rowhouses retain clean wall joins at district scale. |
| 69 | Old gates and central spine | Admission-booth roof registration survives the open screening-yard depth stack; road and gravel transitions remain unobstructed. |
| 70 | Whole-map acceptance | Corrected roofs preserve the established district hierarchy, paired loops, central road, and landmark silhouettes. No map-scale regression was found. |

### Alignment result

| Category | Score | Basis |
|---|---:|---|
| Roof-to-wall registration | 9.5 | Roof and wall caps now share exact tile endpoints, with a separate fascia supplying thickness |
| Connected edge ownership | 9.5 | All four grid directions are asserted in code and confirmed on straight, rectangular, and concave footprints |
| Surface texture alignment | 9 | Courses join across cells; patches and flecks use roof-local coordinates and remain inside the plane |
| Live depth sorting | 9 | Annex corners, freight blocks, clinic, rowhouses, Hall, and booth show no internal edge leakage |
| Whole-map preservation | 9 | District massing, traversal lanes, palette separation, and landmark hierarchy remain intact |

The fixed geometry is covered by `tests/southMeasureBuildingArt.test.mjs`, which
asserts shared roof endpoints, correct x-minus and y-minus edge ownership, and
the absence of perimeter edges on an interior cell.

## Historical Ash Road South alignment review: records 71 to 90 (2026-07-15)

This continuation checks the corrected building system at larger scale and
then follows it through every authored building district. Passes 71 to 80 use
the detached catalog with long rectangular stress footprints. Passes 81 to 90
use the real level loader, tile renderer, sprite catalog, actor atlas, depth
sort, and mood pass. The evidence is
`.ai/visual-audit/ash-road-south/pass-71.png` through `pass-90.png`.

| Pass | Focus | Finding or response |
|---:|---|---|
| 71 | Rowhouse, 8 by 3 | Roof boards, fascia, front-wall trim, and side-wall braces remain on their planes. No horizontal roof offset appears. |
| 72 | Relief annex, 8 by 3 | Industrial wall courses meet at cell boundaries and the roof remains one continuous surface. |
| 73 | Compact clinic, 8 by 3 | Pale roof boards and wall bands retain exact registration at the strongest value contrast in the set. |
| 74 | Morrow freight house, 8 by 3 | Roof courses align with the freight wall cap while braces and shutters stay inside each face. |
| 75 | Measure Hall, 8 by 3 | The red roof exposes no internal edge, shifted course, or fascia step across the long run. |
| 76 | Admission booth, 8 by 3 | The shallow booth wall and dark roof preserve the same five-pixel fascia without a side shift. |
| 77 | Rowhouse, 12 by 1 x-axis | All three roof courses continue through eleven joins at the same pixel endpoints. |
| 78 | Rowhouse, 1 by 12 y-axis | Parallel roof boards remain distinct while the shared footprint edge draws no internal perimeter. |
| 79 | Clinic, 12 by 1 x-axis | Bright roof edges confirm continuous course alignment across the full stress run. |
| 80 | Clinic, 1 by 12 y-axis | Wall panels, roof boards, and the outer rim stay registered over the reciprocal grid axis. |
| 81 | Relief annex live footprint | The complete L-shaped annex keeps clean roof and wall joins at district scale. |
| 82 | Relief annex concave corners | Enlarged inspection finds no crack, overlap, floating patch, or repeated inner rim at either cutout. |
| 83 | Morrow freight yard | Both authored freight footprints remain aligned among wagons, cages, hoists, and crossing roads. |
| 84 | Compact precinct | The damaged clinic L-shape and detached treatment building retain clean edges against gravel and canvas. |
| 85 | Northern Rope Rows | The small-house set keeps separate silhouettes without leaking roof edges through nearby props. |
| 86 | Southern Rope Rows and Hall | The Hall and surrounding rowhouses preserve roof alignment through the densest live depth stack. |
| 87 | Burial tool shed | The first review exposed overlapping farm-roof cells on the only remaining farm-style building. The shed now uses a South Measure burial style with exact 64 by 32 roof cells; the recapture is clean. |
| 88 | South chain and road edge | Road, shoulder, fence, gate posts, and chain meet the south map boundary without a texture gap or horizontal jump. |
| 89 | North chain and road edge | The reciprocal boundary preserves the same road and shoulder registration against the forest edge. |
| 90 | Final whole map | The burial-shed correction does not change district massing, paired loops, landmark hierarchy, or the accepted surface silhouette. |

### Result after pass 90

The six original South Measure styles and the new burial-shed style now share
one exact-grid building geometry. The audit found one remaining overlapping
roof system on this map and removed it without changing the farm buildings on
Long Ash Road. `tests/southMeasureBuildingArt.test.mjs` now checks every South
Measure wall height for a five-pixel fascia, zero horizontal roof-to-wall
offset, shared endpoints on both grid axes, and continuous roof courses along
their run direction. `tests/ashRoadSouthLevel.test.mjs` prevents the burial shed
from reverting to the older farm-roof kind.

The entrance follow-up used real canvas clicks. Clicking the south chain walks
the player to its use marker and opens the Censure Road return dialogue. Clicking the
north chain walks the player to the reciprocal marker and opens its sealed-road
inspection. The collapsed drain now opens the Relief Drain through its visible
culvert mouth and lands the player on a clear inward-facing tile. The surface level
test covers every cell in the boundary-gate click footprints. All nine helper
maps and their remaining surface entrances are now implemented and reviewed
below.

## South Measure helper maps: 100-pass runtime audit (2026-07-15)

This audit covers the nine Ash Road South helper maps, their shared interior
art, all reciprocal travel endpoints, the prior-map Censure approach, and live
arrival continuity. The complete numbered ledger is
`docs/maps/act-1/ash-road-south/submaps/runtime-review.md`. Evidence is stored
in `.ai/visual-audit/ash-road-south-submaps/`, including one hundred numbered
passes, five contact sheets, nine full-map captures, fifteen gate-frontage
captures, and preserved before-state findings.

Passes 1 to 12 isolate shared walls, doors, hatches, pipes, railings, furniture,
machinery, beds, partitions, and the Intake Clerk wicket. Passes 13 to 96 cover
the nine complete helper maps. Passes 97 to 100 use the live game to check the
Censure Road progression gate, Ash Road South arrival, civil-stair arrival, and
culvert arrival.

Two visual faults were found and corrected during the passes:

- The Relief Drain used a one-axis texture where two channel branches crossed.
  A dedicated `relief-channel-junction` floor now draws both fitted axes and a
  central sump.
- The clinic entrance initially stood as a loose screening frame in the queue
  yard. The surface now has a Compact intake wing, with the clinic door set
  directly into its south-west frontage.

A final semantic connector audit caught four facing-only errors that the static
gate captures could not reveal. Returns through the collapsed culvert, repair
trench, annex service hatch, and annex floor hatch now face away from the gate
cell and into the destination route. This geometry rule is enforced in both the
generator and the helper-map contract test.

| Category | Score | Basis |
|---|---:|---|
| Runtime planning-image fidelity | 8.5 | All nine plans retain their locked room hierarchy, plot anchors, and material identity |
| Wall, door, and floor registration | 9.5 | Both wall planes and all engineered floor axes remain aligned in detached and full-map captures |
| Shared game identity | 9 | Masonry, canvas, freight timber, civic timber, domestic timber, and cellar spaces share palette, scale, light, and shadow rules |
| Gate orientation and frontage | 9.5 | Fifteen gate contexts and thirty travel endpoints preserve approach, arrival, and facing continuity |
| Traversal readability | 10 | Every inbound arrival reaches every interaction by cardinal movement, with connector clearance enforced in tests |
| Plot alignment | 9 | Records, pump, Clerk, clinic, Hall, freight, hidden household, and charity spaces occupy their authored locations |
| Overall helper-map package | 9 | The full set is coherent, traversable, reciprocal, and ready for later actor and quest-state population |

No scoped category is below 8. The geometry review was completed before the
population pass. The nine helper maps now also carry their authored NPCs,
encounters, readable records, one loose pickup each, and one reachable
loot-bearing container each. The geometry and travel contracts remain covered
independently so later content work cannot hide a broken route or connector.

## All-map RPG detail pass (2026-07-16)

This continuation applies the RPG-detail requirements to the complete current
level set after the numbered district and helper-map reviews above. It covers
all 33 files under `data/levels/`, including outdoor districts, tents, chapels,
caves, utility spaces, farm interiors, civic interiors, and cellars.

The first inspection used one full-map capture per level in
`.ai/visual-audit/2026-07-16-all-level-baseline/`. New portable clutter was
then checked on a detached canvas and in a live scene in
`.ai/visual-audit/2026-07-16-field-clutter/`. Fourteen final runtime crops in
`.ai/visual-audit/2026-07-16-rpg-detail-pass/` cover outdoor roads, forest,
camp lanes, tents, chapels, farm interiors, and South Measure interiors at
normal gameplay scale.

The final authored set contains:

- 49 loose ground-item stacks across 33 levels, with at least one reachable
  stack on every level.
- 62 loot-bearing containers, with at least one reachable container on every
  level.
- 85 dead-grass tufts across the three outdoor levels.
- 168 rubble decals, 31 rubble piles, and 22 floor cracks.
- 40 rusted barrels, 19 rusted crates, 25 sealed storage crates, 20 field
  satchels, 6 field backpacks, 6 small pouches, and 5 rusted reliquaries.

The field backpack, small pouch, and dead grass are reusable catalog kinds.
The backpack and pouch have distinct closed and opened states. Their rendering
uses hard pixel geometry, palette colors, upper-left material lighting, and
contact shadows. No creature lighting or smooth canvas effects were introduced.

The review found and corrected four placement and narrative-clarity problems:

- One camp grass tuft sat on worn canvas instead of roadside ground. It now
  joins the lower-road grass cluster.
- A field dressing and loose ducats sat beside separate hidden Long Ash Road
  caches. Both pickups moved so ordinary exploration does not disclose secret
  cache locations.
- Several Censure tent additions read like unrestricted theft from active
  quarters. Names, logs, and quantities now identify condemned, retired,
  unclaimed, spent, or written-off stores. The quartermaster's issued crate
  remains permission-gated.
- Three container logs contradicted their automatic pickup behavior or referred
  to internal encounter labels. The logs now describe what the player can
  actually see and what the interaction actually does.

| Category | Score | Basis |
|---|---:|---|
| Portable container silhouette | 7.5 | Backpack, satchel, pouch, crate, barrel, and reliquary remain distinct at normal zoom |
| Opened-state readability | 7 | Backpack, pouch, crate, and reliquary show a visible state change without smooth effects |
| Ground-item readability | 6.5 | Small pickups remain legible against road, grass, timber, masonry, and cave floors |
| Outdoor texture integration | 7 | Grass, rubble, cracks, and roadside clutter break broad surfaces without closing routes |
| RPG environmental density | 7.5 | Every level now rewards inspection while interiors preserve their authored room hierarchy |
| Interaction clarity | 7.5 | Stable IDs, collision checks, reachability checks, and restrained loot descriptions support predictable use |

`tests/allMapsRpgDetail.test.mjs` locks the complete 33-level contract. It
checks stable and globally unique pickup IDs, known item references, positive
counts, walkable placement, collision avoidance, reachability, container
availability, outdoor clutter minimums, and the player-facing dash rule.
`tests/catalogRender.test.mjs` renders every registered kind in every required
state, including the new field clutter and opened reliquary.

## Stage IV cart ambush (2026-07-17)

This review covers the overturned field cart, the prone lure, the conscious
Stage IV actor, and both Stage IV Runner clothing variants. Detached-canvas
evidence is stored in
`.ai/visual-audit/2026-07-17-stage-iv-cart-ambush/isolated-props-final.png` and
the `isolated-actors-*-final.png` captures. Runtime evidence is stored in
`scene-pre-ambush-final.png` and `scene-combat-final.png` in the same folder.

The first pass exposed a dim cart wheel, an oversized fused hand on the lure,
and runner heads that read as generic skulls. The final pass added a brighter
wood rim and cart bed, reduced the fused hand, and gave each runner a clearly
asymmetric ram horn. The actors were checked facing north, east, southeast,
and northwest, then in attack and death states.

| Category | Score | Basis |
|---|---:|---|
| Overturned cart silhouette | 6.5 | The raised wheel, tipped bed, rails, and broken ground wheel distinguish the wreck at gameplay scale |
| Prone lure readability | 6 | The coat, head, extended arm, and contact shadow read as an adult under the cart, though the deliberately subdued palette keeps it from becoming a map beacon |
| Stage IV lure actor | 7 | The figure remains recognizably elderly and human while the jaw seam, broken crescent, rib wound, fused hand, and uneven horn carry the Vale Imprint |
| Stage IV Runner family | 7 | Human-sized bodies, separate road and ash clothing, prayer-bound arms, rib openings, raking hands, and asymmetric ram horns remain distinct from generic undead |
| Facings and combat states | 7 | Four checked facings preserve mass and motifs, the attack extends the rake clearly, and death retains the body's original volume |
| Runtime encounter composition | 7 | The quiet cart and prone figure occupy the approach before the trigger; after it springs, the five actors form a readable road encirclement without overlapping the hidden prop |

No scoped category is below 6. The subdued prop is intentional bait, while the
combat silhouettes carry the stronger readability burden.

## Stage IV Runner anatomy redesign (2026-07-18)

This review supersedes the Runner-family score above. The oversized opened
mask, shoulder rack, low dragging arm, and small chest wound were replaced with
a starved human silhouette: a small ruined head on an exposed neck, narrow
shoulders, thin raised arms, a torso-length butterflied ribcage, torn coat
panels, and one opened ankle. The road and ash variants share the anatomy but
retain separate clothing and opposing asymmetry. The fallen state now keeps the
long body, small head, raking hands, and open ribs instead of reverting to the
generic Host corpse.

Detached evidence is stored under
`.ai/visual-audit/2026-07-18-stage-iv-runner-redesign/`. The eight
`idle-*-final.png` sheets cover every facing for both variants. The state and
attack sheets cover movement, combat, interaction, hit, stealth, and death.
Runtime evidence is `scene-ambush-final.png`, captured from the authored Long
Ash Road cart encounter with its dormant combatants revealed.

| Category | Score | Basis |
|---|---:|---|
| Runner silhouette | 8 | Small head, long neck, narrow body, raised angular arms, and exposed ribs read before clothing detail at gameplay scale |
| Vale Imprint body horror | 8 | The person remains visible beneath a full opened chest, tendon-thin limbs, one horn bud, one scapular thorn, a small wound, and restrained black-gold seams |
| Facing and state continuity | 7.5 | All eight facings retain the same anatomy; walk, attack, stealth, hit, and interaction poses stay within the frame without regaining the old large mask |
| Fallen form | 7.5 | The corpse preserves human length and the opened rib fan, with a dead dark wound and no state-swap shrinkage |
| Runtime encounter composition | 8 | Four gaunt figures remain legible around the cart without becoming larger or brighter than the human lure and roadside terrain |

No scoped category is below 7.5. Side views necessarily compress one half of
the rib fan, but separate high and low reaching arms keep the Runner readable in
profile.

## Old Pilgrim Way and Processional Pike (2026-07-17)

This review covers the complete six-level Old Pilgrim Way package and the new
ground model for the Processional Pike. Evidence is stored in
`.ai/visual-audit/2026-07-17-old-pilgrim-way/`.

The level captures use the runtime level loader, floor renderer, sprite atlas,
catalog, depth sort, and mood pass. They cover the road surface, Hill Church,
Closure Stair, Novitiate Quarters, Trial Galleries, and Sealed Chapter. The pike
was checked both on a detached ground-item plate and beside the player in the live
Sealed Chapter scene.

| Category | Score | Basis |
|---|---:|---|
| Surface route and field hierarchy | 8 | The long road remains dominant, two dead-field masses read as encounter ground, and the hill branch separates cleanly from the north route |
| Hill Church readability | 8 | Nave, raised apse, side rooms, and public entrance retain distinct footprints without exposing the concealed descent |
| Underground progression | 8 | The pressure stair, residential quarters, four trial wings, and final chapter each have a separate spatial identity |
| Ordinary-dead staging | 7.5 | Skeleton groups are visible in the closure, residential, and chapter spaces without reading as enemies or fresh gore |
| Processional Pike ground model | 7 | The long shaft, iron head, upper-left highlight, and contact plate remain readable at normal loot scale |
| Palette and pixel craft | 8 | All additions use project palette colors, hard pixel geometry, upper-left lighting, and contact shadows with no smooth effects |
| Overall package | 8 | The optional dungeon reads as one continuous institutional descent and the pike fits the established inventory-world scale |

No scoped category is below 7. The pike is deliberately compact enough to fit
the one-cell ground-item footprint, while its diagonal shaft preserves the
polearm silhouette. The runtime capture confirms that it remains legible beside
an adult actor and does not resemble a firearm or oversized fantasy spear.

Evidence files:

- `surface.png`
- `hill-church.png`
- `closure-stair.png`
- `novitiate-quarters.png`
- `trial-galleries.png`
- `sealed-chapter.png`
- `pike-preview.png`
- `pike-runtime.png`

## Old Pilgrim Way twenty-pass refinement (2026-07-17)

This follow-up review covers the RPG-density pass across the road, church,
closure stair, novitiate quarters, trial galleries, and sealed chapter. Fresh
evidence is stored in
`.ai/visual-audit/2026-07-17-old-pilgrim-way-20-pass/`.

The detached sheet checks seven new catalog kinds: procession shrine, opened
pilgrim remains, institutional cot, memorial tablet, closure control, trial
frame, and Processional Pike rack. Runtime captures cover the surface before and
after combat, both field and camp crops, church discovery and return states,
the complete buried route, three trial states, and the opened Oath Armory.

The audit found one physical overlap between the manual release wheel and the
nun who died operating it. The body now rests on the adjacent cell with both
hands directed toward the wheel. This keeps the causal tableau legible and
leaves the interactive mechanism unobscured.

| Category | Score | Basis |
|---|---:|---|
| Long-road hierarchy | 8 | Procession shrines, field edges, camp clusters, hospice traces, and the hill branch add rhythm without filling the deliberate empty stretches |
| Camp and aftermath reactivity | 8.5 | Four South Measure outcomes alter camp equipment, while combat victory replaces bait staging with transformed remains, ordinary dead, a moved cart, and salvage |
| Ecclesiate institutional identity | 8.5 | Hospice, closure, dormitory, trial, and chapter props share material language while retaining distinct functions |
| Ordinary-dead storytelling | 8.5 | Body placement, clothing cues, failed work positions, and dry-water evidence explain the entrapment without underground enemies or Host growth |
| Trial silhouette and state readability | 8 | Five mechanisms differ at map scale, and their idle, kept, and broken states remain distinguishable in runtime crops |
| Reward presentation | 8 | The separate Oath Armory, custom rack, sealed aid chest, and empty claimed state give the pike a credible discovery context |
| Palette and pixel craft | 8.5 | New art uses palette colors, hard pixel geometry, upper-left highlights, material ramps, and contact shadows |
| Overall twenty-pass package | 8.5 | Every pass leaves a visible, mechanical, investigative, combat, or return-state result across the six-map route |

No scoped category is below 8. The surface remains intentionally broad. Local
density is concentrated at the road camp, field incident, church branch, and
buried rooms so the route preserves its old pilgrimage scale.

Evidence files:

- `00-art-sheet.png`
- `01-surface-closed.png`
- `02-surface-aftermath.png`
- `03-church-discovery.png`
- `04-church-return.png`
- `05-closure-stair.png`
- `06-novitiate-quarters.png`
- `07-trials-idle.png`
- `08-trials-intact.png`
- `09-trials-forced.png`
- `10-sealed-chapter.png`
- `11-road-camp.png`
- `12-field-aftermath.png`
- `13-trials-west-intact.png`
- `14-trials-east-forced.png`
- `15-oath-armory.png`

## Native 2x migration baseline (2026-07-17)

This is a migration baseline, not a completion claim. Fresh evidence is stored
in `.ai/visual-audit/2026-07-17-native-2x-baseline/`. The first live native
foundation render is stored in
`.ai/visual-audit/2026-07-17-native-2x-foundation/chapel-runtime-1280x960.png`.

The baseline renders the current 640x480 artwork at an exact 2x presentation.
It confirms that the established composition, silhouettes, UI layout, palette,
and hard edges survive enlargement. It also exposes the central shortfall: the
image still consists almost entirely of 2x2 physical pixel blocks and therefore
does not yet use the new density for added information.

| Category | Score | Basis |
|---|---:|---|
| Existing composition at 2x | 8 | Chapel framing, prop density, depth sorting, and HUD hierarchy survive unchanged |
| Existing silhouette readability | 8 | Humans, walls, furniture, Host pieces, and item families remain distinct at the larger presentation |
| Hard-pixel integrity | 10 | The baseline is crisp and contains no smoothing from the native transform |
| Native-detail utilization | 1 | Almost every authored source pixel remains a uniform 2x2 block; this is the redraw work still outstanding |
| Naive full-map memory viability | 1 | The largest projected map would require about 437 MiB for one native RGBA floor canvas |
| Bounded-cache foundation | 8 | The live chapel holds one 2048x1408 cache, reaches exploration, and shows no visible crop or seam in the captured view |
| 100 percent browser readability | 8 | The 1280x960 canvas is comfortable without Chrome zoom, with the existing tactical composition intact |

The native-detail score remains deliberately low until each family has fresh
detached and in-scene evidence. The foundation must not be mistaken for the
proper redraw.

## Native 2x redraw completion (2026-07-17)

The proper redraw is complete. The final audit covers the complete static
catalog, floor and item families, every configured actor frame, the interface,
all 39 runtime levels, all 39 complete map compositions, real interaction
flows, cache stability, and warm-frame performance. Evidence is stored in the
dated `.ai/visual-audit/2026-07-17-native-2x-*` folders and indexed in
`docs/art-audio/native_2x_redraw.md`.

The performance pass found that direct replay of the denser native primitives
could exceed 200,000 canvas calls per frame. Unchanged volumetric props now use
tightly cropped native rasters while fire, candles, opening doors, Host pulses,
and moving ground items remain live. Seeded material noise was also detached
from screen coordinates, eliminating camera-driven texture shimmer. The final
catalog cache audit compares 1,044 non-flat kind and seed combinations with
their direct transparent renders and finds exact pixel parity.

| Category | Score | Basis |
|---|---:|---|
| Native-detail utilization | 9 | All 200 catalog kinds, 18 floors, 19 ground-item models, actor families, and UI states contain deliberate one-native-pixel decisions rather than uniform 2x2 enlargement |
| Static-world craft | 9 | Walls, fixtures, structures, furniture, plants, props, decals, gore, ritual marks, lights, and set pieces retain anchors and silhouettes across six-seed detached review and all authored scenes |
| Actor redraw | 8.5 | 39,600 generated frames cover every configured state, facing, and death sequence with stable anatomy, equipment, Host motifs, palette, and foot anchors |
| Interface redraw | 8.5 | 51 UI states retain bitmap text, hard panel construction, logical hit regions, modal bounds, and readable native edge detail at 100 percent zoom |
| Runtime composition | 9 | All 39 levels pass real-renderer crops and fully opened whole-map review without clipping, orphaned props, depth failures, or smoothing |
| Interaction integrity | 9 | Fourteen browser checks cover keyboard screens, highlights, dialogue, trade, loot, combat, overlays, two pointer scales, transition, and inventory persistence |
| Performance and memory | 9 | Bounded floor and prop caches, lazy actor frames, 3.33 to 5.24 ms warm renders, and a sustained 60 Hz headless software-canvas cadence keep the fourfold backing-pixel increase practical |
| 100 percent browser readability | 9 | The canvas presents at 1280x960 CSS and backing dimensions at browser scale 1, removing the need for 200 percent Chrome zoom on a fitting display |

No scoped category is below 8.5. The densest scene retains a one-time cold
raster-build cost of roughly 140 ms in the headless software-canvas profile,
then remains inside the warm-frame budget. Transparent cached sprites are
pixel-identical to direct renders. Full-scene precomposition changes alpha-edge
rounding on at most 3.32 percent of pixels; all reviewed differences stay on
polygon edges and contact shadows, with no missing or shifted art. Final release
testing should still sample target hardware, but the native redraw itself has
no open visual or functional defect from this audit.

## Weapon system visual pass (2026-07-18)

This review covers the 16 shared ground and inventory silhouettes used by the
100-weapon catalog, the two ready slots, ammunition readouts, and the selected
weapon detail panel. Fresh evidence is stored in
`.ai/visual-audit/2026-07-18-weapons/`.

The detached sheet renders every weapon model on project floor tiles at native
hard-pixel scale. The runtime captures use the real game loader and renderer.
One opens the player's actual field pack with a partially loaded accelerator sidearm
and matching reserve armatures. The other places six representative weapons on
the camp road beside the player, existing props, surface texture, and the normal HUD.

| Category | Score | Basis |
|---|---:|---|
| Ballistic silhouette families | 8 | Sidearm, compact automatic, carbine, rifle, shotgun, support, and precision profiles differ through overall length, stock, barrel, and feed geometry |
| Accelerator silhouette families | 8 | Copper coil blocks and pale armature channels separate accelerator sidearms, rifles, and rail rifles from cartridge weapons without glow effects |
| Melee silhouette families | 8 | Knife, sword, axe, blunt, pike, and converted tool profiles remain recognizable inside the one-cell loot footprint |
| Palette and pixel craft | 9 | Every model uses project palette ramps, hard native pixels, upper-left highlights, and a grounded contact plate with no blur or smooth gradient |
| Runtime ground readability | 8 | Six mixed weapons remain distinct from the player, camp furniture, road grain, and one another at ordinary gameplay zoom |
| Inventory presentation | 8.5 | Icons, ready-slot labels, condition, loaded and reserve ammunition, reload control, weight, and description fit the existing field-pack hierarchy |
| Overall weapon presentation | 8 | A bounded set of silhouettes supports the full catalog while material accents, proportions, names, stats, and descriptions carry individual identity |

No scoped category is below 8. The support gun, rail rifle, and pike retain the
widest silhouettes, while compact weapons remain visibly smaller. Accelerator
identity comes from physical coils and armature channels rather than colored
energy beams, preserving both setting canon and the restrained palette.

Evidence files:

- `isolated-ground-models.png`
- `live-inventory.png`
- `live-ground-weapons.png`

## Deborah Carbo account scene link (2026-07-18)

This pass reuses registered hard-pixel assets to connect Deborah's robbed roadside
scene with the Stage IV cart ambush. Fresh evidence is stored in
`.ai/visual-audit/2026-07-18-edda-account/`. The detached sheet covers the
wheel, sacks, overturned cart, purse, and prone lure. Scene captures use the
real level loader, floor treatment, depth sort, actor atlas, and flag-based
visibility. Live game captures verify the disputed count and threat response at
the native 1280 by 960 interface size.

| Category | Score | Basis |
|---|---:|---|
| Roadside theft read | 8 | The missing cart reads through Deborah's position beside the spilled sacks and detached wheel |
| Cross-scene continuity | 8.5 | Charcoal and the hub clue carry the cart identity west. Red cloth carries the robber identity through the kill site and ambush |
| Trap and purse readability | 8 | The prone lure remains the first read before combat, while the warm leather purse becomes distinct beneath the cart after the lure flag clears |
| Palette and pixel craft | 9 | Every reused prop retains palette-only ramps, hard native pixels, upper-left highlights, and contact shadows |
| Dialogue screen fit | 9 | The twenty-five-ducat dispute, all three choices, journal update notice, and longest threat response fit the bitmap UI without clipping or browser text |
| Overall account presentation | 8.5 | The physical scene, quest state, and dialogue outcome now tell one causal story at ordinary gameplay scale |

No scoped category is below 8.

Evidence files:

- `isolated-props.png`
- `edda-roadside-scene.png`
- `ambush-trap-scene.png`
- `ambush-sprung-scene.png`
- `live-spared-account.png`
- `live-disputed-count.png`
- `live-threat-response.png`

## South Measure helper maps: current-source 200-pass identity acceptance (2026-07-19)

This review supersedes the earlier South Measure helper-map 100-pass section
only as current visual-identity acceptance. The earlier geometry, frontage,
connector, and correction history remains valid.

The canonical set at `.ai/visual-audit/ash-road-south-200-passes/` contains
exactly 200 captures for each of nine maps, or 1,800 total: 1,260
`detached-crop`, 360 `native-runtime-focus`, and 180 `broad-composition`
records. Its certifying `report.json` records `complete-and-validated`, 1,800
unique views, 1,800 unique exact PNG hashes, 1,800 unique paths, and 90 contact
sheets. Source hashes bind the evidence to the audited level files.

Manual review passes all 180 criteria, 20 per map, across every one of the 1,800
records. The maps now separate at a glance through their rendered composition:
the Intake is defended civic processing and pumps; the Drain is a depressed
polluted channel and raised walk; the Annex is a machine floor ending in a
burned bay; Freight is dispatch, weighbridge, cages, and bonded storage; the
Clinic is an orderly canvas ward with cold service and isolation; the Hall is
an open civic school, council, kitchen, and records room; Varo House is a
crowded repair household; Hidden Rows is three concealed homes around shared
water and heat; and the Charity Cellar is a dense medical reserve with an
evidence bench and screened patient.

| Category | Result | Basis |
|---|---|---|
| Current-source coverage | PASS | Nine maps at exactly 200 records each |
| Evidence independence | PASS | 1,800 unique view definitions, PNG hashes, and screenshot paths |
| Multi-scale review | PASS | Detached detail, native runtime focus, and broad composition all represented |
| Map identity | PASS | Every map retains a distinct function, silhouette, material hierarchy, and authored concept read without labels |
| Manual acceptance | PASS | 180 of 180 criteria pass, with ten records supporting every criterion |
| Automated verification | PASS | Manual-ledger validator, `npm run check`, and full `npm test` pass |

The canonical validator reports:
`manual review validated: 9 maps, 180 PASS criteria, 1,800 screenshot records`.

## Ash Road South surface: current-source 200-pass identity acceptance (2026-07-19)

This acceptance covers only the 130 by 80 Ash Road South surface. The nine
helper maps are outside its scope and were not changed. It supersedes the
historical surface-shell acceptance above, whose reused Censure camp kit and
synthetic evidence no longer represent the current map.

The canonical evidence is
`.ai/visual-audit/ash-road-south-200/evidence-v7/`. It contains exactly 200
configured checks, 200 unique exact PNG hashes, and ten manually inspected
contact sheets. Source and served-source hashes bind every record to the final
generator, generated level, rendering primitives, catalog, palette, runtime,
and audit script. The evidence families are 20 matched Censure comparisons, 50
isolated-art checks, 60 district compositions, 40 real-runtime traversal
checks, 20 time-of-day checks, and ten outcome-state checks.

Earlier captures remain as correction history. The mixed-source v3 capture was
rejected automatically. The v4 and v5 reviews exposed weak floor, building,
prop, and district identity. The v6 review still rejected receiving crops that
lost their water-service connection and grave crops that lost their shed and
memorial anchor. V7 was captured only after those exact player-scale
compositions were corrected. Three independent range reviews then inspected
all individual V7 PNGs and returned 70 of 70, 70 of 70, and 60 of 60 passing
records. The final manifest contains one concrete visible finding for every
pass.

| Category | Result | Basis |
|---|---|---|
| Censure separation | PASS | Matched views show permanent civic massing, measured boundaries, water infrastructure, freight systems, and burial work instead of tents, loose campfires, bedrolls, and camp clutter |
| Location-owned art | PASS | Four South Measure floor families and the surface building, boundary, water, intake, freight, relief, household, and burial kits render through distinct draw functions and silhouettes |
| Reuse budget | PASS | No placed visual kind overlaps a non-South-Measure map; only `ash-road` and `road-shoulder` continue across the campaign boundary, covering 537 of 10,400 cells, or 5.16 percent |
| District composition | PASS | Arrival, receiving, Charity Cot, Water Court, old gates, Morrow yard, relief annex, Compact precinct, Rope Rows, grave strip, and north verge remain readable from tight through whole-map framing |
| Runtime traversal | PASS | Forty routed captures keep civic or work-system anchors visible while the player crosses the surface, including the receiving and screening sequences |
| Lighting and outcomes | PASS | Twenty dawn-to-night captures and ten state variants retain hard-pixel readability, correct environmental lighting, and distinct physical changes |
| Manual acceptance | PASS | 200 of 200 pass-specific findings pass against the exact captured image hashes |
| Automated verification | PASS | Identity guards, route checks, full `npm test`, `npm run check`, and the strict evidence verifier pass |

The canonical verifier reports:
`verified 200 passes, 200 unique PNGs, 10 contact sheets, 200 reviewed, 200 passed, final approval yes`.

## Ash Road South prop-anatomy correction (2026-07-20)

A direct gameplay review rejected several props that the 200-pass acceptance
had passed too generously. The freight wagon was a closed rectangular bed with
two detached square wheel marks. Nearby shelters, fences, water hardware, and
civic fixtures repeated the same stacked-prism construction. Their names were
different, but their silhouettes did not convincingly describe their jobs.

This correction judges the rebuilt pieces at ordinary scene scale and on
detached floor patches. Scores use the audit's honest scale, where 4 is average.

| Family | Before | Current | Visible basis |
|---|---:|---:|---|
| Freight wagon | 2 | 7.5 | Twin shafts, a connected chassis and axle, round spoked wheels, a raised bed, side rails, a brake lever, and an irregular sack-and-tarp load replace the box with floating wheels |
| Receiving edge | 3 | 7 | The shelter is an open lean-to with a bench and torn curtain; hearths have individual stone rings, crossed fuel, tripods, and kettles; boundary runs use crooked posts and sagging cable |
| Water and yard hardware | 3 | 7 | Public taps terminate over an open trough, animal water uses its own low trough variant, the pipe gantry is continuous pipework, and the cast hand pump terminates over a catch bucket |
| Civic and household fixtures | 3.5 | 6.5 | The returns point is an open trestle register with a hanging balance, the census board has a physical hood and hanging tallies, and household vessels have shouldered profiles rather than box bodies |
| Portable service gear | 2.5 | 7 | The drainage pack is now a soft shouldered canvas load with straps, buckles, a side pocket, and a coiled hose instead of a rigid chair-shaped case |
| Scene coherence | 4 | 7 | At gameplay scale, silhouette and connected anatomy now identify each object before its interaction label does |

Fresh evidence:

- `.ai/visual-audit/ash-road-south-yard-props-isolated-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-wagon-yard-scene-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-arrival-props-isolated-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-arrival-scene-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-return-register-isolated-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-census-board-isolated-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-household-vessels-isolated-2026-07-20.png`

## Ash Road South remaining prop-anatomy correction (2026-07-20)

A follow-up inventory reviewed all 529 placed surface objects and found eight
remaining weak families. The high-count burial, screening, and drainage pieces
still produced the wrong repeated read. Several one-off civic pieces also
depended on a named interaction to explain a box, table, chair, or floor
scatter. This pass rebuilds those families and includes the two lower-priority
pieces in the same correction.

| Family | Before | Current | Visible basis |
|---|---:|---:|---|
| Burial plots | 2.5 | 7 | Flat broken earth, loose clods, crosswise tool marks, and four separate marker traditions replace raised sled-like beds |
| Screening rails | 3 | 7.5 | Each authored object is now one two-post rope barrier; parallel authored runs form lanes instead of every cell drawing a cage |
| Drain reeds | 3 | 6.5 | Thin leaning stalks, long seed heads, broken stems, wet root mats, and shared water lines replace square-headed broom clumps |
| Condenser and settling vats | 2 | 8 | A bowed cylindrical condenser with fins, a gauge, a ladder, and asymmetric downpipe replaces the reliquary box; open raster-oval vats now expose water, rake arms, inlet pipes, overflow, and wall ladders |
| Medicine trolley | 2.5 | 7.5 | Two shallow trays sit on an open frame with connected axles, large spoked wheels, a push bar, dressings, basin, bottle, and hanging satchel |
| Charity canopies | 3 | 7 | Four slender posts support one torn patched roof with daylight, a separate cot, an offset wash bowl, a hanging water bag, and one partial curtain |
| Water lesson | 2 | 7 | A depth-sorted sloped board on open trestles holds an intake grate, settling bowl, clean jar, linked pipe, stage plates, and a worn teaching trace |
| Brass-hook memorial | 3 | 7.5 | One crooked rising hook, hanging burial tags, a bowed chain, tied prayer strip, recessed ledger, and votive cup replace the tool-stall rail |
| Whole-map repetition | 3 | 7 | Grave fields read as burial ground, screening rows read as civil queue lanes, and reed runs read as wet boundaries at normal traversal scale |

Fresh detached evidence:

- `.ai/visual-audit/ash-road-south-props-repeated-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-props-service-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-props-civic-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-scene-graves-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-scene-screening-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-scene-queue-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-scene-waterworks-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-scene-medicine-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-scene-charity-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-full-map-models-final-2026-07-20.png`

Fresh real-runtime evidence:

- `.ai/visual-audit/ash-road-south-runtime-graves-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-runtime-screening-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-runtime-waterworks-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-runtime-medicine-final-2026-07-20.png`
- `.ai/visual-audit/ash-road-south-runtime-charity-final-2026-07-20.png`

## Ash Road South ten-pass material and identity rebuild (2026-07-21)

This review supersedes the surface's earlier broad visual acceptance where it
conflicts with direct native-scale inspection. The new baseline showed that
the map's overall composition was sound, but too many buildings, berm cells,
rails, machines, and props still read as single-color squares joined together.
Several neighboring materials also shared nearly identical value ramps, so
their shading described logical tiles more strongly than physical construction.

Fresh evidence is stored in
`.ai/visual-audit/2026-07-21-ash-road-south-10-pass/`. Each numbered capture was
taken after its named correction, and the final map was captured again after
the last repetition cleanup.

| Pass | Correction | Visible result |
|---:|---|---|
| 1 | Material ramps | Lime aggregate, cold iron, and fired clay gain separate dark, middle, and light ramps, establishing one construction language without flattening every surface into one hue |
| 2 | Building anatomy and texture | Seven building families gain roof seams, patched membranes, masonry courses, braces, vents, stains, rivets, and edge wear that follow their own planes |
| 3 | Arrival and boundary | The south chain gate becomes a landmark of unequal pylons, pulley gear, counterweight, gauge plates, chain, and repaired boundary work |
| 4 | District floors | Civic lime slab, freight clay and iron yard, household service brick, burial earth, and blue iron drainage separate the map's uses at a glance |
| 5 | Waterworks machinery | Condenser, settling vats, screening frames, pumps, and pipe supports share riveted iron, lime bases, clay collars, gauges, bracing, and visible water handling |
| 6 | District silhouettes | Annex exhausts, the freight lifting scale, booth lane signal, clinic ventilator, hall standard, and burial shed profile make rooflines identify their districts |
| 7 | Repeated street kit | Queue rails, fences, water vessels, notices, pumps, and reeds gain seeded repair states, sag, missing parts, braces, tied cloth, mineral staining, and density changes |
| 8 | Human wear | Foot traffic, washers, chain drag, boot marks, doorstep tallies, and sparse work traces connect surface texture to actual local activity |
| 9 | Graves and outskirts | Household burial offerings, grave construction, quieter vegetation, buried pipe mouths, and connected intake berm faces replace repeated box fields |
| 10 | Whole-map cleanup | Remaining cell outlines, frequent square berm patches, over-regular repairs, and competing high-frequency marks are reduced in the final overview |

The completed map now has a consistent South Measure identity: pale lime civic
works, blue-black iron drainage, fired-clay household and freight surfaces,
patched permanent buildings, and visible water-accounting hardware. The same
material vocabulary changes by district function, while upper-left highlights,
lower-right shade, contact shadows, and hard native pixels stay consistent.

The separately requested tumbleweed feature sits outside the ten numbered
passes. Ten nonblocking anchors occupy open verge and approach lanes. Each weed
uses a seeded 15 to 25 second cycle with a 3.4 to 4.6 second gust, eight discrete
rolling transforms, short hops, alternating travel, a moving contact shadow,
and a persistent resting pose. Broken outer arcs, an irregular twig lattice,
forked growth, and an off-center knot keep it from reading as a wheel.

Key evidence:

- `baseline-arrival.png`, `baseline-waterworks.png`, `baseline-rows.png`
- `pass-01-material-ramps.png` through `pass-09-graves-outskirts.png`
- `pass-10-final-map-retry.png`
- `final-buildings-detached.png`
- `final-street-kit-detached.png`
- `tumbleweed-detached.png`
- `tumbleweed-in-scene-close.png`

Automated coverage verifies distinct local models and floor families, animated
gust and rest signatures, ten nonblocking staggered tumbleweed anchors,
palette-safe native detail, generated-level integrity, and full project content.
Both `npm run check` and the complete `npm test` suite pass on the audited source.

## Ash Road South settlement-life passes (2026-07-21)

This audit covers the five additions layered over the initial civilian-routine
pass. Fresh evidence lives in
`.ai/visual-audit/2026-07-21-ash-road-south-liveliness-passes-02-06/`.
The detached sheets use the current actor atlas and catalog draw functions. The
six scene captures come from the running game at native backing resolution,
with each tableau in its perform phase.

The first runtime capture was rejected. Water Court, the freight yard, Charity
Cot, and the Compact sent participants to targets spread across too much of the
district. They behaved correctly but read as unrelated solo jobs. The final
capture retargets those actors to nearby boards, hoists, scales, wash points,
linen racks, and loading furniture. The same review also rejected generic road
dust, paper, oil, wax, and sack art in the density pass. Three new flat South
Measure families now describe tally scraps, work grit, and local service
stains without borrowing another map's kit.

Scores use the audit's honest scale, where 4 is average.

| Category | Score | Visible basis |
|---|---:|---|
| Four work motions | 6.5 | Pumping and marking keep both hands occupied, lifting carries weight across the torso, and kneeling changes the whole silhouette; the small human scale makes the shortest hand travel deliberately subtle |
| Eight prop responses | 6 | Paper shifts, water falls, tools strike, chain travels, scale needles swing, loads settle, cloth lifts, and the burner flame changes; several responses are intentionally small enough to remain attached detail rather than effect icons |
| Tableau coherence | 7 | All six final captures keep three workers and their physical targets inside one readable work cluster, with short local barks tied to the task |
| Selective density | 7 | Thirty-six grouped objects reinforce registration, water issue, loading, weighing, clinical screening, and linen service while the long connecting streets remain quieter |
| Runtime reliability | 8 | The browser report records six perform phases, eighteen correct slots, live actor and prop frames, four unlocked ambient beds, twelve cues, six completed cycles, and zero leaked reservations or activities |
| Overall settlement life | 7 | Repeated solo idles are replaced by a mix of routes, physical jobs, local group work, material evidence, and restrained sound without turning every screen into constant motion |

Key evidence:

- `detached-work-motions.png`
- `detached-prop-responses.png`
- `runtime-tableau-01-arrival-registration-handoff.png`
- `runtime-tableau-02-water-court-queue.png`
- `runtime-tableau-03-morrow-freight-loading.png`
- `runtime-tableau-04-charity-bandage-handoff.png`
- `runtime-tableau-05-compact-clinic-screening.png`
- `runtime-tableau-06-old-gate-weighing.png`
- `runtime-report.json`

## Ash Road South complete placed-prop review (2026-07-21)

This pass inventories every authored Ash Road South object that is neither an
actor nor a building shell. The level contains 575 such placements across 47
catalog kinds, plus eight loose pickups using six ground-item models. The berm
kind also renders through the level legend, producing 1,154 loaded berm cells
in addition to its six explicit object records.

The fresh baseline rejected thirteen families. The common failure was not a
lack of detail. Thick black pipe bands, bright blue bodies, oversized wheel
symbols, tall rectangular frames, and repeated box anatomy made unrelated
objects resemble toys, arcade gates, chairs, or small machines. The correction
uses thinner iron, small functional color accents, recognisable loads, and
silhouettes built from the object's physical job. Scores use the honest scale
where 4 is average and 10 is an exemplar.

| Model | Placed | Score | Decision and visible read |
|---|---:|---:|---|
| `measure-boundary-fence` | 113 | 6.5 | Keep. Crooked posts, repaired rails, and open gaps read as an old civic boundary. |
| `south-measure-queue-rail` | 93 | 6.5 | Keep. Two posts and sagging rope form lanes without enclosing every tile. |
| `south-measure-drain-reeds` | 73 | 6.5 | Keep. Thin wet-root clusters and broken stalks read as drainage growth. |
| `measure-grave-plot` | 30 | 7 | Keep. Flat disturbed earth and four marker traditions remain readable burial work. |
| `south-measure-water-vessels` | 29 | 4 to 6.5 | Redrawn. Freight cans become bowed iron and clay casks on a timber skid; clinic blocks become lidded ceramic jars and an enamel basin; household vessels remain mismatched hand-carried crockery. |
| `intake-screening-frame` | 17 | 4 to 6.5 | Redrawn. A removable slatted trash rack between two anchored uprights replaces the four-rail airport-checkpoint silhouette. Functional attachments remain secondary. |
| `south-measure-repair-rack` | 14 | 6.5 | Keep. Sawbuck ends, ridge beam, named tools, and hose coil read as an open repair rack. |
| `south-measure-notice-board` | 13 | 6 | Keep. Posts, hood, paper layers, hanging census tags, and sealed braces remain physical boards rather than UI panels. |
| `charity-cot` | 10 | 2.5 to 7 | Redrawn. A long low mattress, four legs, pillow, folded blanket, and short iron head rail replace the upright chair-like privacy panel. |
| `mesh-cage-panel` | 10 | 6 | Keep. Woven diagonal mesh, structural posts, and bonded plate read at native scale. |
| `south-measure-hand-pump` | 10 | 4.5 to 6 | Corrected. The cast body keeps its pump handle, pivot, falling spout, and catch bucket while pipe bands, valve hardware, and blue material area are reduced. |
| `south-measure-tumbleweed` | 10 | 7 | Keep. Broken arcs, twig lattice, off-centre knot, moving shadow, and discrete roll poses avoid a wheel read. |
| `south-measure-pipe-gantry` | 9 | 3.5 to 6 | Corrected. Thinner iron mains, smaller collars, a restrained return line, and a lever valve replace the thick target-wheel and crossed playground frame. |
| `grain-cage` | 8 | 4 to 6 | Redrawn. Three tied sacks now rise above a low slatted freight bin; shortened posts and rails no longer resemble a prison bed. |
| `laundry-line` | 8 | 4.5 to 6.5 | Redrawn. The ordinary line now carries a shirt, uneven towel, and separate trouser legs instead of three signal-like rectangles. |
| `south-measure-return-stall` | 8 | 6.5 | Keep. Trestle counter, hanging balance, bonded cage, key rack, and return load preserve variant-specific jobs. |
| `south-measure-sleeping-pallet` | 8 | 6 | Keep. Low bedding, pillow, folded cover, and personal token read as floor-level sleeping places. |
| `wash-wall` | 8 | 6 | Keep. Tiled upright backing, header cistern, taps, and drain trough give the fixture one clear sanitation function. |
| `south-measure-door` | 7 | 6 | Keep. Wall-plane alignment, braces, hinges, material variants, and open states are legible. |
| `cloth-partition` | 6 | 6 | Keep. Clinic, domestic, and isolation cloth hang at distinct heights with gaps and soft hems. |
| `fixed-hoist` | 6 | 7 | Keep. Broad bridge, splayed legs, chain, pulley, and suspended bearing block read as lifting equipment. |
| `service-pipe-run` | 6 | 3.5 to 6 | Corrected. Floor runs sit lower with thinner rust pipe, smaller collars, quieter saddles, and a compact valve lever instead of a wheeled toy-cart profile. |
| `shared-oven` | 6 | 3.5 to 7 | Redrawn. A broad masonry dome, arched fire mouth, soot, short flue, embers, and leaning bread peel replace the square glowing kiosk. |
| `south-measure-berm-block` | 6 explicit | 6 | Keep in scene. Connected lime and iron faces form civic retaining work; an isolated connected cell is intentionally almost featureless. |
| `south-measure-tally-scraps` | 6 | 6 | Keep. Layered paper slips, marks, and dropped binding read as handled records. |
| `south-measure-work-grit` | 6 | 5.5 | Keep quiet. Filings, fasteners, and a dragged tool line support work nodes without becoming loot icons. |
| `freight-wagon` | 5 | 7.5 | Keep. Shafts, chassis, axles, spoked wheels, bed rails, brake, sacks, and tarp make the strongest ordinary vehicle on the map. |
| `service-hatch` | 5 | 6 | Keep. Recessed frame, open lid, ladder or hatch insert, and dark shaft read from both orientations. |
| `south-measure-grave-family-rail` | 5 | 6 | Keep. Unequal posts, sagging cord, punched tags, and family variation support the grave plots. |
| `relief-machine` | 4 | 4 to 6 | Corrected. Wheel outlines and cranks are smaller, cooling valves lose bright blue gear treatment, and the pump jig uses a lever crank; motor, drum, shaft, and plinth now dominate. |
| `south-measure-receiving-shelter` | 4 | 6.5 | Keep. Open lean-to, bench, torn curtain, notice, and daylight underneath read as temporary civic shelter. |
| `south-measure-service-stain` | 4 | 5.5 | Keep quiet. Lye, oil, and mineral variants remain low-contrast material evidence. |
| `south-measure-storage` | 4 | 6 | Keep. Chest, open record shelf, and locked cabinet variants retain distinct masses and contents. |
| `freight-scale` | 3 | 6 | Keep. Low claim pad, standing dial, and worn deck remain clear weigh-station hardware. |
| `public-tap-stand` | 3 | 4 to 6.5 | Corrected. Thin iron mast and manifold, three faucets, small gauge plate, stone trough, bucket, and water surface replace the blue arcade-machine silhouette. |
| `south-measure-arrival-hearth` | 3 | 6.5 | Keep. Splayed tripod, hung pot, fire bed, and grounded shadow read as a shared cooking point. |
| `south-measure-charity-canopy` | 2 | 7 | Keep. Four posts, patched roof, separate cot, wash bowl, water bag, and partial curtain form an open treatment bay. |
| `south-measure-service-pack` | 2 | 4 to 6.5 | Corrected. A tied blanket roll reinforces the backpack silhouette while the former eye-like blue hose coil is reduced to a small strapped fitting. |
| `south-measure-settling-vat` | 2 | 7 | Keep. Open oval rim, visible water, rake arm, overflow elbow, gauge, and ladder describe the process. |
| `south-measure-water-lesson` | 2 | 6 | Keep. Sloped board, intake grate, settling bowl, clean jar, linked channel, and pointer read as a physical demonstration. |
| `collapsed-culvert` | 1 | 6 | Keep. Masonry mouth, dark channel, broken edge, and rubble make a grounded obstruction. |
| `north-chain-gate` | 1 | 7 | Keep. Unequal pylons, counterweight, pulley, sagging chain, and road throat make a strong landmark. |
| `south-chain-gate` | 1 | 7 | Keep. The paired campaign gate retains the same mechanical anatomy and distinct repair state. |
| `south-measure-brass-hook-memorial` | 1 | 7 | Keep. Crooked hook, tags, bowed chain, prayer strip, ledger, and votive cup make the unusual silhouette intentional. |
| `south-measure-medicine-cart` | 1 | 4 to 6 | Corrected. A wider two-shelf pushcart, iron wheels, extended handle, bandages, enamel basin, bottle, and dark satchel replace the compact drone-like cluster. |
| `south-measure-sample-burner` | 1 | 6.5 | Keep. Shielded fire chamber, offset retort, high exhaust, sample chute, and small quench bowl read as clinical disposal equipment. |
| `water-condenser` | 1 | 7.5 | Keep. Bowed tank, fins, ladder, gauge, concrete bed, and asymmetric downpipe remain the water court landmark. |

Ground models were also reviewed on their actual dark pickup backplate. `food`,
`chit`, `dressing`, `rounds`, and `token` score 6; `shard` scores 5.5 because its
small pale silhouette is necessarily the least specific. All six remain clear
loot rather than environmental furniture, use palette-only hard pixels, and
retain a grounded shadow.

Fresh before-and-after evidence is stored in
`.ai/visual-audit/2026-07-21-ash-road-south-prop-audit/`. It includes the full
126-entry real-variant sheet, six focused detached sheets, all district scene
crops, live runtime views of every corrected family, and the six-model ground
item sheet.

## Whole-game world art and shape-aware shadow closure (2026-07-21)

This is the current-source acceptance record for world art. It supersedes all
earlier family scores and scoped acceptance scores when they describe an asset
that still exists in the current catalog. The older sections remain above as a
rejection and revision history. This closure does not claim external review.
One implementation reviewer inspected the unlabeled sheets before revealing
the stable kind IDs.

### Current inventory and evidence order

The closure covers 39 levels, 233 catalog kinds, 204 volumetric catalog kinds,
74 actor atlas identities, 22 floor families, and 33 ground-item models. Of the
catalog kinds, 225 are placed by current level objects or tile legends. The
remaining eight still pass detached rendering and shadow-contract tests so
future placement cannot bypass the gate.

Review order was:

1. Unlabeled native 1x sheets.
2. The same unlabeled sheets displayed at 2x.
3. White silhouette-only sheets.
4. Grayscale value sheets.
5. Stable kind identity reveal.
6. A real runtime frame and a complete-map composition for every level.

The machine-readable record is
`.ai/visual-audit/2026-07-21-shadow-overhaul/asset-review.json`. It contains one
record per catalog kind, actor identity, floor family, and ground-item model.
Each placed catalog record includes placement count, the reviewer read,
material result, use-side result, ordinary-human confusion result, contact and
cast-shadow result, score, and evidence paths. It also contains SHA-256 hashes
for all 303 captured PNGs.

### Gated map waves

| Wave | Levels | Native runtime | Complete composition | Minimum ordinary asset | Minimum actor, landmark, or encounter creature |
|---|---:|---|---|---:|---:|
| Ash Road South and helpers | 10 | Pass | Pass | 7 | 8 |
| Long Ash Road and interiors | 10 | Pass | Pass | 7 | 8 |
| Censure Road Camp and tents | 9 | Pass | Pass | 7 | 8 |
| Ash Chapel | 4 | Pass | Pass | 7 | 8 |
| Old Pilgrim Way | 6 | Pass | Pass | 7 | 8 |

The lowest accepted score is deliberately the gate, not a rounded family
average. Ordinary placed catalog art and floors bottom out at 7. All 74 actors,
all encounter creatures, and the named landmark set bottom out at 8. Humans
retain small heads, continuous torsos, jointed limbs, and boots. Vegetation,
machines, furniture, barriers, and Host forms retain different primary
silhouettes. Materials remain distinguishable by both value and construction.

The complete-map sheets confirm the intended composition hierarchy. Roads,
channels, wall runs, work clusters, and interiors continue across cell seams.
Outdoor wear is grouped into lanes, drainage, work spills, ritual sites, and
habitation traces. Indoor scenes use local authored light without inheriting
the outdoor projection.

Primary evidence:

- `.ai/visual-audit/2026-07-21-shadow-overhaul/catalog-unlabeled/`
- `.ai/visual-audit/2026-07-21-shadow-overhaul/silhouette-sheets/`
- `.ai/visual-audit/2026-07-21-shadow-overhaul/value-sheets/`
- `.ai/visual-audit/2026-07-21-shadow-overhaul/actors/`
- `.ai/visual-audit/2026-07-21-shadow-overhaul/runtime-levels/`
- `.ai/visual-audit/2026-07-21-shadow-overhaul/full-maps/`
- `.ai/visual-audit/2026-07-21-shadow-overhaul/contact-runtime-levels-*.png`
- `.ai/visual-audit/2026-07-21-shadow-overhaul/contact-full-maps-*.png`

### Shadow and targeting acceptance

Every catalog entry now resolves both a contact and cast profile. Flat decals
use reviewed `none` profiles. Grounded volumetric art derives contact from its
actual prepared raster ground band or full silhouette. Connected blocks,
airborne models, prone bodies, wall fixtures, and unusual structures use
explicit custom or reviewed `none` profiles. Contact expansion is at most one
native pixel and is never blurred.

Outdoor cast masks project opaque pixels from the current prop raster or actor
frame with integer math. The viewport layer unions overlaps before applying
the level's existing sun alpha, so overlaps do not become darker diamonds.
Indoor maps do not use the outdoor projection. Occluding props apply the same
fade to model, contact, and cast coverage. No production or audit-harness call
to a generic oval, rectangle, or diamond shadow helper remains.

The runtime interaction capture verifies the action-colored one-native-pixel
rim around the physical target, four restrained pixels at a separate use cell,
mouse hit testing, keyboard fallback targeting, Tab labels, 1x and 2x CSS
pointer mapping, combat targeting, UI screens, overlays, and a real level
transition. Evidence and the 16-step report are in
`.ai/visual-audit/2026-07-21-shadow-overhaul/runtime-interaction/`.

### Performance acceptance

The authoritative performance profile uses isolated headless Chrome
software-canvas runs at a native 1280 by 960 backing size and includes the two
densest outdoor levels plus representative camp, interior, bell, and catacomb
scenes.

| Level | Cold render ms | Warm average ms | RAF render average ms | Shadow cache MiB | Prop cache MiB |
|---|---:|---:|---:|---:|---:|
| Ash Road South | 38.8 | 5.09 | 2.86 | 1.73 | 2.45 |
| Long Ash Road Approach | 121.7 | 5.46 | 3.31 | 3.03 | 4.79 |
| Censure Road Camp | 137.0 | 5.54 | 3.06 | 5.38 | 10.55 |
| Old Pilgrim Novitiate Quarters | 82.9 | 3.49 | 1.80 | 2.97 | 7.54 |
| Ash Chapel Bell Room | 85.5 | 4.23 | 1.82 | 3.92 | 9.89 |
| Ash Chapel Hidden Catacombs | 168.6 | 5.07 | 2.87 | 8.24 | 19.14 |

The worst warm average is 5.54 ms against a 6 ms gate. The worst cold render
is 168.6 ms against a 200 ms gate. The largest observed shadow cache is
8.24 MiB against its 24 MiB cap, and the largest observed prop cache is
19.14 MiB against its 64 MiB cap. The authoritative raw report is
`.ai/visual-audit/2026-07-21-shadow-overhaul/performance-final/report.json`.
