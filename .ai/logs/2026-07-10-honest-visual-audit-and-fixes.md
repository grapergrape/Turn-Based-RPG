# 2026-07-10: Honest visual re-audit, customization fix, P0 art fixes

## What happened

- Re-baselined the visual audit honestly (4 = average). The 2026-07-03 "all
  272 rows at 9/10" claim was rejected by play testing; the new audit lives in
  `docs/art-audio/visual_design_audit.md` with per-family scores, fixes, and a
  prioritized backlog.
- Fixed the character-customization-invisible-in-game bug at the bake level
  (`src/render/sprites/spriteBake.js`): open hood shows real hair/scalp, beards
  render hooded, bust reads through the coat via silhouette buckets, and the
  equipped vest / harness strap / pendant now actually paint (they were styled
  but never drawn). 6 of 9 creation fields now visibly change the clothed
  in-game sprite (anatomy/groin legitimately sit under clothing).
- Redesigned the four worst assets: fallen Opened Saint (was a shrunken cartoon
  skeleton), stone stairwell (was an oval ring of sticks), broken bell (was a
  red tarp read), bone pile (was white confetti). Desaturated the wheat-field
  floor base and replaced the floating bone-white "+" on all five plant kinds
  with lashed twig prayer charms.
- Added reusable review harnesses under `.ai/map-review/`:
  `preview-catalog.html` (whole catalog by category, `kinds=`/`prop=` params),
  `preview-player-variants.html` (creation traits, clothed + bare). Documented
  the headless-chrome workflow in `game_art_skill/SKILL.md` Section 19 and
  added Section 22 (honest scoring rubric + failure modes) so weaker agents
  can run the same loop.
- Evidence sheets: `.ai/visual-audit/honest-2026-07-10-*.png`.

## Verification

`npm test` (45 suites) and `npm run check` pass.

## Open backlog (see audit doc for the full list)

hay-rick, host-growth, chapel-font, field-harrow, graveyard-wall, skeleton,
graveyard-earth dashes, cave-river stripes, ground-item blue guide color,
bell-rope fray, bone-pile mound contrast.

## Second pass (same session, user asked to clear the whole backlog)

Fixed and render-verified: host-growth (rooted mound), graveyard-wall (massed
masonry + courses), devil-target (bold crude devil + shot holes), chapel-font
(taller, lit basin, defaced cross), field-harrow (timber lattice over slim
tines), bell-rope (coiled slack instead of fray-claw), bone-pile (bigger
mound), wall-stair-door (lit mouth treads), blood-sigil + ritual-circle
(rustMid wet edges), ash-sapling (fuller crown), corpse (face + split legs),
cobweb (husk + higher alpha), skeleton (decay stain + rags). Judgment calls
recorded in the audit doc: scrub-bush and the texture decals stay subtle on
purpose. `npm test` and `npm run check` pass.

## Third pass: high-frequency surface

Ranked kinds by placement count across all levels; uplifted the dominant
visual surface: wheat-clump (878 uses; prevailing wind lean, snapped stalks,
Host-gold grain), farm-fence (488; snapped-rail variant, ash drifts, prayer
cords), both hearths (banked embers + soot), sealed-storage-crate (stencil +
wax seal), broken-pew (hymn sheet / dropped prayer cord). Method recorded in
the audit doc: "what did people leave here" details, seeded variants for
mass-placed kinds. Tests and content check pass.

## Fourth pass: lighting

ash_chapel_breach was the only level with no mood config; added the cold-stone
family mood so the candle clusters read as warm islands. wash-tub water got
its story tint. Confirmed dining/settlement/counter pieces already carry
authored leavings and re-rated them at working zoom. Full-map capture of Long
Ash Road verifies the landscape: ashen fields, wind-combed wheat, varied
fences.

## Fifth pass: window light pools + last quiet middle

Added the window-light-pool kind (cold stepped-band daylight, mullion shadow,
dust motes; drawn after mood multiply) and placed it under all 7 chapel
windows in the breach nave and bell room. Low-stool and dining-bench got their
"left here" traces (whittling shavings + abandoned tin cup; a child's chalk
game). All tests and content check pass.

## Sixth pass: campfire flame + close-review corrections

Campfire flame rebuilt as a tapered ragged column (was a straight lit
pillar). Saint-statue and calcified-headstones re-rated upward on close
review: both are fully authored (beheaded stump + chip halo; snapped
calcified bodies as grave markers) and their low gallery scores were
distance artifacts, not design faults.

## Seventh pass: farm-tool cluster

field-cart loaded with sacks + tarp (4->6); tool-rack shows the ghost of a
taken tool (4->5.5); rubble-pile gained a carved saint's hand (5->6); cobweb
alpha raised. All verified in renders.

## Eighth pass: quiet ground

Floor story marks and chip runs were stamped on every tile (wallpaper).
Gated them per-style to ~1/3-1/2 of tiles; mud-track glints intermittent
while ruts stay continuous. Camp scene verified: props now carry the
composition. Tests + check pass.

## Ninth pass: exemplar polish + full scene coverage

Standing cross-martyr pushed to 9.5: carve strips on the thigh (the
sacrament harvest), wet drip, pin-light glint on the post. Catacombs and
infected cave scene-captured and reviewed; every level archetype verified
today. Tests + check pass.

## Tenth pass: set pieces storied

Bell crack now opens to a bitten lip with the fallen chunk below + ringing
tally (7.5->8.5); stairwell gained climbing ash footprints + censure chalk
tally (7->8). Saint's story-on-the-body method, applied outward.

## Eleventh pass: UI re-review

Re-scored the UI family (the one gap in the re-baseline) from evidence
captures: honest 7. Cohesive era chrome; the recorded route to 9-10 is NPC
dialogue portraits, status-panel icon language, and panel-field texture.

## Twelfth pass: dialogue talking heads

Speaker portrait plate added above the dialogue window (actor's baked sprite
as a 2.4x bust in a riveted frame). speakerSpriteId threads through
GameDialogueRuntime; props stay text-only; unknown ids degrade gracefully.
preview-dialogue.html harness drives the real UIRenderer. UI 7 -> 8.

## Thirteenth pass: faces

Shared head painter upgraded (browline, nose hint, lit cheekbone, face draws
last) so all ~60 actors gain readable faces at world AND portrait scale.
Humans 6.5 -> 7.

## Fourteenth pass: story marks

Quarantine sign got the Remnant's barred red cross (5->6.5); chalk drawing
brightened and now shows the two catacombs children hand in hand watching
the ringed world (4->6).

## Fifteenth pass: sacrament and issue kit

Ritual bowls now show the drying flesh strips the quest text describes
(5->6.5); field satchel got its Censure issue-stamp (5->6).

## Sixteenth pass: gore close review

Victim trio verified fully authored at close render (carved star + throat
cross; lashed post + living grate light); family re-credited 5.5 -> 6.5.
Confirmed: zero unauthored pieces remain anywhere in the catalog.

## Seventeenth pass: censure camp set

Tent billet tally, bedroll keepsakes, crate pry gouges + stencil. Camp
furniture now carries daily-life traces (6-6.5 across the set).

## Eighteenth pass: farm yard

Dead bird in the feed trough (5.5->6); axe left standing in the chopping
block by the woodpile (5.5->6.5). Interrupted lives, told in props.

## Nineteenth pass: the road remembers

Stump heartwood weeps black-gold (5.5->6); coat wool snagged on the scrub
(5->5.5); locked farm doors carry the Remnant's chalk seal (5->6). A
misplaced automated insert (would have crashed wheeled props) was caught by
the render-verify loop before it shipped.

## Twentieth pass: wilderness props

Fallen log sawn-end rings + gold seep (5.5->6); stalagmite drip line +
flowstone base (5.5->6).

## Twenty-first pass: tail closed

Wagon wheel snapped spoke + rust bleed; flagstone pry bar. Milestone: every
asset that can hold a 6 at its size now scores 6+; only intentional texture
decals and size-capped minis sit below, with rationale recorded.

## Twenty-second pass: the graveyard speaks

Stone tomb: scratches climbing the INSIDE rim (6->7). Tomb slab: twig cross
+ chit offering (6->6.5).

## Twenty-third pass: most-placed story props

Bone-niche Choir-arranged variant (1 in 4; radiant femurs + pinned skull);
calcified-penitent touch-worn shoulder. 137 + 44 placements uplifted.

## Twenty-fourth pass

Training dummy split seam + parked knife; tent flap red ward; lectern's cut
chain + torn page. All render-verified.

## Twenty-fifth pass: the working edge

Damaged altar: knife grooves at the slab lip + blood soak lines down the
face (6.5->7.5). The rite centerpiece now shows its use.

## Twenty-sixth pass: what the chapel endured

Column votive wax; door axe bites at the bar bracket; safe scorch halo +
drill scars. All render-verified.

## Twenty-seventh pass: descents and rations

Catacomb mouth hand-groove + candle stub; bone marker burial tally; barrel
rain line + shared cup. Render-verified.

## Twenty-eighth pass: shortages and warnings

Pantry tipped jar + droppings; stash fingertip wear; barricade painted
barred cross + turn-back arrow. Render-verified.

## Twenty-ninth pass: shut houses and measured dark

Farm blocks: seeded boarded-window ward (1 in 5). Cave mouth: staked
guide-rope that stops. Render-verified after one misplaced-insert fix.

## Thirtieth pass: drips, directions, nests

Stalactite drip bead + landing spot; sign post letter ticks + torn second
board; plow caked share + bird's nest. Render-verified.

## Thirty-first pass: the graveyard keeps count

Split-open plot variant (1 in 5); prayer-cord generations up the remnant
cross; pilgrim candle stubs at the saint statue. Render-verified.

## Thirty-second pass: interrupted kitchens

Prep table knife mid-chop; counter floured handprint; headstone ring on a
cord. One undefined-variable slip caught by the gallery ERR trap and fixed.

## Thirty-third pass: last sub-6 rows closed

Stair-door light wedge + rope; host-growth absorbed fingers; skeleton
crawling reach. Milestone: every named row now 6+.

## Thirty-fourth pass: second strokes on the 7s

Fallen martyr: dropped knife + overturned bowl (7->7.5). Crossroad brother:
prayer cords along the wing arms (7.5->8). Chapel banner: re-stitched corner
(7->7.5).

## Thirty-fifth pass: tongues, aim, and what came down

Bell clapper thrown with cut strap (8.5->9); quarrel dead centre in the
devil (7->7.5); descending heavier prints on the stairwell (8->8.5).

## Thirty-sixth pass: hollows, meals, and shrines

Hay-rick sleeping hollow; dining table set for a crowd that stood up at
once; ash-tree wayside-shrine variant (1 in 6, 379 placements).

## Thirty-seventh pass: the rite, the crow, the paperwork

Dead cultist's unfinished sigil; the crow on the scarecrow brother; writ
papers under a river stone. Render-verified.

## Thirty-eighth pass: policy, standards, and mercy

Chalk ring around cleared wolf remains; mirror shard at the wash-tub; shoes
set neatly beside the bound victim's post. Render-verified.

## Thirty-ninth pass: what they carried

Snapped spear in the wolf; bread beside the corpse; candle coin at the
grave body. Render-verified.

## Fortieth pass: precautions

Stake wedging the wolf's jaws; salt over the ribsplit carcass; the guard's
horn beside the cult victim's reaching hand. Render-verified.

## Forty-first pass: session close

Bench initials; hearth pot with standing spoon; window parchment pane.
Session ended at user request after 41 passes. All tests + content check
green. Work left UNCOMMITTED in the working tree by design - commit is the
next action for whoever picks this up.

## Forty-fourth pass: bell-stair alignment (2026-07-11, continued session)

New goal dimension: review map layouts and prop orientations. Started with the
named case, "the staircase isn't aligned with the wall."

Root cause: the `stone-stairwell` was a tall free-standing masonry portal
drawn at a floor tile's centre, duplicating the adjacent `wall-stair-door` and
floating. Rewrote it as a low grounded worn *threshold landing* (orientation-
aware via `oriented()`, +A axis points at the door), and skipped its sun-shadow
(flush stone). Removed the breach landing entirely: (30,3) is a one-tile wall
pocket where any low prop is fully occluded by the flanking walls that draw in
front of it (proven with a debug locator spike). The `wall-stair-door` there
reads as the stair alone. Bell-room landing (5,9) kept (orient `nw`, sits on
open floor in front of a back wall, not occluded).

Verify loop: node draw-call smoke across all 4 orients; isolation render on the
real chapel floor + mood; debug-locator to prove in-scene tile position;
scene crops of both placements. `npm test` (45 suites) + `npm run check`
(199 JSON) green. New dev harness `.ai/map-review/preview-stairwell.html`.

Layout lesson recorded in audit doc: in this depth-sorted iso, low props belong
on open floor; a floor prop boxed in by walls of greater x+y is invisible.
Still UNCOMMITTED by design.

## Forty-fifth pass: stone floor de-scribbled (2026-07-11)

Dominant surface. Two mark systems (chip run + diagonal crack + horizontal chip
mark) all fired on the same ~45% of tiles, clumping into scribble. Cut the
crack to ~25%, decorrelated and mostly hairline; dropped the always-on chip
mark. Added rare broken-flagstone recesses (~1 in 13: dirt/rubble pit, lit
break-lip) for real ruined-chapel character. Verified at 4x and at game scale
in the breach nave with mood. stone floor 6 -> 7.5. Tests + check green.
New harness preview-floor.html. Still UNCOMMITTED.

## Forty-sixth pass: remaining over-marked floors (2026-07-11)

packed-earth (barn/sheds/camp): BASE cell stamped footprints+furrows+7 scratch
lines+chips+bone flecks on EVERY tile - rewrote to decorrelated per-trace gates
(seed%3/4/5/6), quiet ground between; story overlay trimmed to 25% tent-stake
holes, dropped bright diagonal. ash-gravel: base already gravelled, dropped the
12 redundant overlay chips for a sparse drag/scuff at 25%. cave-stone: base
already fractures, replaced 3 redundant overlay cracks with occasional damp
seep / bone fleck at 25%. Verified in-scene: storage shed + infected cave.
All 6->7.5 / 6.5->7.5. Tests + check green. Still UNCOMMITTED.

Extended pass 46: graveyard-earth (tally scratches were on EVERY tile - gated to
~15%, seams to 80% so the plot grid varies) and road-shoulder (60%/6-chips ->
35%/3-chips, hairline crack). Reviewed forest-floor, mud-track, ash-road,
farm-plank, wheat-field, furrow-field - all read fine as-is. Six floor styles
de-scribbled total (stone, packed-earth, ash-gravel, cave-stone, graveyard-earth,
road-shoulder). Tests + check green.

## Forty-seventh pass: stone floor -> fitted masonry (2026-07-11)

Pushed the dominant surface 7.5 -> 8.5. Added a faint fitted-flag bevel (upper-
left lit stoneDust@0.13, lower-right shadow outline@0.22) replacing the old
random single-edge joint + random-side edge-wear, so every flag reads as laid
bevelled stone with depth. Added a 3rd darker base tone and a zone-scale
soot/damp bloom (whole 2x2 zones darken) for big soft shapes. Verified at 4x and
in the breach nave at game scale with mood. Tests + check green. UNCOMMITTED.

## Forty-eighth pass: stone walls -> fitted masonry (2026-07-11)

Walls = largest interior pixel area. drawIsoWallBlock drew each face as one flat
plane. Added drawStoneBlockTones: weathers ~35% of the course/seam-grid blocks a
shade lighter/darker under the course lines, so faces read as many fitted aged
stones. Close tones, minority of blocks -> weathering not checkerboard. Applies
to every stone interior at zero data cost. stone wall 7.5 -> 8.5. Verified in
breach nave. Tests + check green. UNCOMMITTED.

## Forty-ninth pass: crash bug in calcified-crossroad-brother (2026-07-11)

Catalog creature sweep surfaced "ERR side is not defined". drawThrownRoadOfferings
referenced side/shoulderY (locals of the caller drawCalcifiedCrossroadBrother) -
a polished-shoulder detail pasted into the wrong function. Kind is placed in
long_ash_road_approach and the live renderer doesn't try/catch prop draws, so it
crashed that level's bake. Moved the 2 px back into the brother fn after the
torso; dropped from the offerings helper. Added tests/catalogRender.test.mjs
(wired into npm test): renders all 131 kinds x 6 seeds/orients vs a mock ctx,
asserts none throw. All 131 clean. Full suite (46 tests) + check green. UNCOMMITTED.

## Fiftieth pass: wheat-clump, the most-placed asset (2026-07-11)

Placement census: wheat-clump = 878 instances (top by far; ash-tree 374,
scrub-bush 261). Reshaped its grain heads from flat 3-4px blocks into narrow
bristled spindles that nose over with the wind, taper to a point, and splay awns;
snapped-stalk heads droop to a point. Gold Host-grain still accents 1 in 5.
wheat-clump ~7 -> ~8. Verified across 6 seeds. Tests + check green. UNCOMMITTED.

## Fifty-first pass: dead canopy thinned (2026-07-11)

ash-tree (374 placements, 2nd-most-placed) foliage read as solid cotton puffs.
Punched 3 ash-eaten deep-shadow gaps into the shared leafClump primitive so
dead crowns thin to holes. Consistent across ash-tree/scrub-bush/ash-sapling,
no regression. ash-tree ~7.5 -> ~8. Tests + check green. UNCOMMITTED.

## Fifty-second pass: skeleton pose variation (2026-07-11)

skeleton (191 placements) only varied by flip -> copy-paste read. Added seed
variation: spine length 8-10, ribs 3-5, disarticulation spread, flung limb
angles, optional scavenger-dragged bone (40%), crawl-reach now 60% not always.
skeleton ~7 -> ~8. bone-niche (137) reviewed, already good, left as-is.
Tests + check green. UNCOMMITTED.

## Fifty-third pass: cobweb made visible (2026-07-11)

cobweb (52) had good structure but dark stoneDust strands on a dark floor read
as a faint scratch. Recoloured spokes to bone-pale hostBone (dusty silk catches
light), catch-rings to stoneDust, alpha 0.9->0.8. Now reads as a web with a
wrapped husk. cobweb ~7 -> ~8. bone-pile(48) + calcified-penitent(44) reviewed,
already clean, left as-is. Tests(46) + check green. UNCOMMITTED.

## Fifty-fourth pass: cracked-column drums (2026-07-11)

cracked-column: flat dark shaft, near-identical copies. Gave each of 4 drum
sections a seed-keyed shade off the base (wall-style masonry weathering) on the
central face, keeping lit-left/shade-right modelling. Reads as stacked drums,
copies differ. ~7 -> ~8. quarantine-sign + ritual sigils reviewed, read fine.
Tests(46) + check green. UNCOMMITTED.

## Fifty-fifth pass: irregular flagstone slabs (2026-07-11)

stone floor 8.5 -> 9. Grouped tiles into multi-tile slabs (2x2, staggered brick
courses) via a pure-function slabId so neighbours agree on shared edges. Bevel
joints draw ONLY at slab boundaries; a slab shares one base tone. The rigid
one-tile grid is gone - reads as a grand laid stone-slab floor. Verified at 4x
and in the breach nave at game scale. Tests(46) + check green. UNCOMMITTED.

## Fifty-sixth pass: natural-floor atmospheric depth (2026-07-11)

Added the stone floor's zone-scale bloom (broad low-alpha shadow, ~1 zone in 6)
to cave-stone and packed-earth so whole patches darken under soft wet/trodden
shadow - atmospheric depth to match stone, no per-tile clutter. cave-stone +
packed-earth 7.5 -> 8. Floor family now coherent (stone 9, cave/packed 8).
Verified in infected cave. Tests(46) + check green. UNCOMMITTED.

## Fifty-seventh pass: bell chamber hero pass (2026-07-11)

Bespoke per-scene detail on the payoff scene (sparse, unlike the dense nave).
Hand-placed under the cracked bell: rubble (shaken mount), blood-stain (it came
down on someone), floor-crack (impact), blood-sigil (mourner's mark). The bell
now reads as having FALLEN and killed; composition leads player->rope->bell.
bell chamber ~8 -> ~9. Tests(46) + check(199) green. UNCOMMITTED.

## Fifty-eighth pass: stone floor -> 9.5 exemplar (2026-07-11)

Added traffic-worn polish (soft 2-layer sheen toward light, keyed to slab, ~1 in
5 slabs) - the lived-in read. Stone floor now carries the full exemplar stack
(irregular slabs, boundary bevels, per-slab tone, zone stains, broken flags,
worn polish, calm damage): 9 -> 9.5. Second exemplar alongside the Opened Saint.
Verified in breach nave. Tests(46) + check(199) green. UNCOMMITTED.
