# Visual Design Audit

Date: 2026-07-03

This audit rates the current runtime-drawn visual set against `game_art_skill/SKILL.md`, `docs/LORE_INTEGRATION.md`, and `docs/lore/the_host_story_bible.md`.

Scope covered:

- 15 floor styles from `src/render/primitives/terrain.js`.
- 130 static renderable catalog kinds from `src/render/spriteCatalog.js`.
- 17 ground item pickup models from `src/render/primitives/groundItems.js`.
- 38 actor and enemy data records from `data/actors/` and `data/enemies/`.
- 58 atlas and reusable human model ids from `src/render/SpriteAtlas.js`.
- Main UI surfaces drawn by `src/render/UIRenderer.js` and `src/render/ui/*`.

Evidence used:

- Source inventory from `SPRITE_CATALOG`, `FLOOR_STYLE_IDS`, `SPRITE_ATLAS_IDS`, actor/enemy JSON, level objects, and item `groundModel` values.
- Isolated local screenshot galleries generated under `.ai/visual-audit/`.
- Follow-up galleries from the current uplift pass: `ground-items-upgraded.png`, `ground-items-upgraded-v2.png`, `floors-upgraded-v4.png`, `static-catalog-current-v2.png`, `decals-upgraded-v3.png`, `plants-upgraded.png`, `plants-small-furniture-upgraded-v2.png`, `small-furniture-upgraded.png`, and `host-atlas-upgraded.png`.
- Floor scene captures from the current pass: `scene-long-ash-road-floors-v4.png`, `scene-censure-camp-floors-v4.png`, `scene-ash-chapel-floors-v4.png`, and `scene-long-ash-cave-floors-v4.png`.
- Ritual, light, and Host-growth evidence from the current pass: `ritual-light-host-upgraded-v1.png`, `scene-ash-chapel-ritual-light-v2.png`, `scene-ash-cellar-pentagram-v1.png`, and `scene-censure-campfire-v2.png`.
- Ground-item evidence from the current pass: `ground-items-upgraded-v3.png`, `scene-ground-items-road-dropped-v3.png`, and `scene-ground-items-evidence-level-v4.png`.
- Plant evidence from the current pass: `plants-upgraded-v2.png` and `scene-plants-evidence-level-v3.png`.
- Fixture evidence from the current pass: `fixtures-upgraded-v1.png` and `scene-fixtures-evidence-level-v2.png`.
- Terrain block evidence from the current pass: `terrain-blocks-upgraded-v1.png` and `scene-terrain-blocks-evidence-v2.png`.
- Prop evidence from the current pass: `props-upgraded-v1.png` and `scene-props-evidence-v2.png`.
- Structure evidence from the current pass: `structures-core-upgraded-v1.png` and `scene-structures-core-evidence-v1.png`.
- Road and chapel structure evidence from the current pass: `structures-road-chapel-upgraded-v1.png` and `scene-road-chapel-structures-evidence-v1.png`.
- Exterior structure evidence from the current pass: `structures-exterior-upgraded-v2.png`, `scene-exterior-structures-farm-evidence-v1.png`, and `scene-exterior-structures-cave-evidence-v1.png`.
- Furniture evidence from the current pass: `furniture-core-upgraded-v1.png`, `scene-furniture-core-evidence-v1.png`, `furniture-interior-upgraded-v1.png`, `scene-furniture-interior-evidence-v1.png`, `farm-tool-furniture-upgraded-v1.png`, and `scene-farm-tool-furniture-evidence-v1.png`.
- Human gore evidence from the current pass: `gore-human-upgraded-v1.png` and `scene-gore-human-evidence-v1.png`.
- Host creature prop evidence from the current pass: `host-creature-props-upgraded-v1.png` and `scene-host-creature-props-evidence-v1.png`.
- Decal evidence from the current pass: `decals-upgraded-v2.png` and `scene-decals-evidence-v2.png`.
- Host actor evidence from the current pass: `host-actors-current-v1.png` and `scene-host-actors-current-v1.png`.
- UI evidence from the current pass: `ui-dialogue-verified-v1.png`, `ui-trade-verified-v1.png`, `ui-loot-verified-v1.png`, and `ui-overlays-verified-v2.png`, alongside the earlier HUD, inventory, journal, loading, briefing, and creation captures.
- Human actor evidence from the current pass: `human-data-actors-current-v1.png`, `human-atlas-current-v1.png`, and `scene-human-faction-current-v1.png`.
- Representative in-scene screenshots for Ash Chapel, catacombs, cellar, Censure camp, tent interiors, Long Ash road, cave, farmhouse, and barn.
- `npm run check`, which passed.
- Static searches for inline colors, gradients/arcs/blur, `Math.random`, browser text, and dash violations in `data/` and `src/`.

Scoring:

- `10`: exemplar. It should be copied as a standard.
- `8-9`: strong. It has a distinct silhouette, material read, and strong setting fit.
- `6-7`: good enough to keep, but not a standard. It is readable in scene and has some authored identity.
- `4-5`: functional placeholder quality. It obeys rules, but is generic, repetitive, too subtle, or weak at gameplay scale.
- `1-3`: poor or misleading. It needs redesign, not polish.
- `0`: does not render as a valid model.

## Top Findings

1. The playable slice renders and the visual system is broadly coherent, but the first scoring pass was too forgiving. Most assets are functional hand-built placeholders, not finished 7s and 8s. The revised scores use the full scale.
2. The two strict model failures from the baseline audit have been fixed: `player` and `host-penitent-bastion` now resolve in the atlas and render in `host-atlas-upgraded.png`.
3. The actual standout pieces are narrow: `cross-martyr`, `host-touched-penitent`, calcified martyr forms, `rusted-reliquary`, `candle-cluster`, `damaged-altar`, `bone-niche`, and the journal screen.
4. Floor textures have completed a verified 9/10 uplift pass. The `floors-upgraded-v4.png` gallery and current scene captures show all 15 floor styles with stronger material identity, scene-useful variation, and hard-pixel wear marks.
5. The ritual, light, and Host-growth pass raised the first non-floor static rows to verified 9/10. It replaced the vector-stroked Choir pentagram with hard-pixel linework and strengthened the authored candle, campfire, ritual-bowl, Host-growth, blood-sigil, and ritual-circle reads.
6. The 130-kind static renderable catalog now has a current 8+ evidence pass in `static-catalog-current-v2.png`, with more focused proof for floors, pickups, plants, structures, and furniture in the other galleries.
7. Ground item pickup models now have a verified 9/10 uplift pass in `ground-items-upgraded-v3.png` and the all-model evidence level. Every pickup model has a readable physical silhouette at gameplay scale, including `ring`, `necklace`, `chit`, and `token`.
8. Plant catalog rows now have a verified 9/10 uplift pass in `plants-upgraded-v2.png` and `scene-plants-evidence-level-v3.png`. The six plant kinds now read as authored dead growth rather than generic bush or stump markers.
9. Wall fixture rows now have a verified 9/10 uplift pass in `fixtures-upgraded-v1.png` and `scene-fixtures-evidence-level-v2.png`. The chapel fixtures and canvas flap have stronger recessed depth, state reads, and hardware at gameplay scale.
10. Terrain block rows now have a verified 9/10 uplift pass in `terrain-blocks-upgraded-v1.png` and `scene-terrain-blocks-evidence-v2.png`. Chapel, cave, farm, barn, shed, and canvas wall blocks now have stronger cap wear, base grime, material seams, and readable top-down CRPG silhouettes.
11. Prop rows now have a verified 9/10 uplift pass in `props-upgraded-v1.png` and `scene-props-evidence-v2.png`. Rubble, cave stone teeth, ossuary piles/niches, the loose flagstone stash, and the blue key item all have stronger silhouettes and interaction-scale reads.
12. The first structure cluster now has a verified 9/10 uplift pass in `structures-core-upgraded-v1.png` and `scene-structures-core-evidence-v1.png`. Chapel, graveyard, catacomb, and stairwell pieces now have stronger silhouettes, chipped masonry, ground contact, and traversal reads.
13. Road and chapel structure rows now have a verified 9/10 uplift pass in `structures-road-chapel-upgraded-v1.png` and `scene-road-chapel-structures-evidence-v1.png`. Barricades, bells, ropes, warning signs, chapel doors, and the damaged altar now have stronger hardware, chipped surfaces, state reads, and interaction-scale silhouettes.
14. Exterior structure rows now have a verified 9/10 uplift pass in `structures-exterior-upgraded-v2.png`, `scene-exterior-structures-farm-evidence-v1.png`, and `scene-exterior-structures-cave-evidence-v1.png`. Farm blocks, sheds, canvas tents, doors, fences, road signs, the infected cave mouth, and the training target now have stronger material wear, state reads, and scene-scale silhouettes.
15. First furniture rows now have a verified 9/10 uplift pass in `furniture-core-upgraded-v1.png` and `scene-furniture-core-evidence-v1.png`. Chapel, camp, and storage furniture now has stronger hard-pixel planks, straps, locks, patches, debris, and tabletop or bedroll reads.
16. Interior and chapel furniture rows now have a verified 9/10 uplift pass in `furniture-interior-upgraded-v1.png` and `scene-furniture-interior-evidence-v1.png`. Dining, kitchen, pantry, wash, banner, lectern, font, and barrel props now have stronger bracing, hardware, chipped surfaces, clutter, debris, and interaction-state reads.
17. Farm-tool furniture rows now have a verified 9/10 uplift pass in `farm-tool-furniture-upgraded-v1.png` and `scene-farm-tool-furniture-evidence-v1.png`. Carts, hay, plows, harrows, troughs, pumps, racks, dummies, wheels, and woodpiles now have stronger tool wear, hardware, tied material, spill debris, and farmyard silhouettes.
18. Human gore rows now have a verified 9/10 uplift pass in `gore-human-upgraded-v1.png` and `scene-gore-human-evidence-v1.png`. Corpses, skeletons, cult victims, dead cultists, bound captives, and crucified farm victims now have stronger hard-pixel wounds, human-scale silhouettes, hardware, readable clothing, base blood, and debris.
19. Host creature prop rows now have a verified 9/10 evidence pass in `host-creature-props-upgraded-v1.png` and `scene-host-creature-props-evidence-v1.png`. Calcified human forms and dead Host wolf variants already meet the 9 bar with human-scale silhouettes, broken halos, bone cavities, black-gold seams, and asymmetric Vale Imprint reads.
20. Decal rows now have a verified 9/10 uplift pass in `decals-upgraded-v2.png` and `scene-decals-evidence-v2.png`. The flat floor marks now read as authored surface events with hard-pixel material cues, not generic floor noise.
21. Host actor rows now have a verified 9/10 evidence pass in `host-actors-current-v1.png` and `scene-host-actors-current-v1.png`. Penitent, Host rat, and Host wolf variants hold up across all eight facings and in-scene scale with readable Vale Imprint silhouettes.
22. UI surface rows now have a verified 9/10 evidence pass in `ui-dialogue-verified-v1.png`, `ui-trade-verified-v1.png`, `ui-loot-verified-v1.png`, and `ui-overlays-verified-v2.png`. The interface reads as a cohesive late-90s CRPG canvas UI with hard-pixel chrome, dense but legible grouping, and no browser UI leakage.
23. Human, cultist, and raider rows now have a verified 9/10 evidence pass in `human-data-actors-current-v1.png`, `human-atlas-current-v1.png`, and `scene-human-faction-current-v1.png`. Named Censure workers, survivors, Choir cultists, and Red Tithe raiders all carry distinct role kits and remain readable in scene.

## Current Uplift Pass Notes

The current pass fixed the hard atlas failures and upgraded broad low-scoring families. The full 272-row audit is now verified at 9/10, with rows raised only after fresh isolated and in-scene evidence.

- Fixed atlas ids: `player`, `host-penitent-bastion`.
- Verified 9 texture pass: all 15 floor styles in `src/render/primitives/terrain.js`.
- Verified 9 ritual and light pass: `ritual-bowl`, `candle-cluster`, `campfire`, `host-growth`, `choir-pentagram`, `blood-sigil`, and `ritual-circle`.
- Verified 9 ground-item pass: the `ground-item` wrapper and all 17 pickup models in `src/render/primitives/groundItems.js`.
- Verified 9 plant pass: all 6 plant kinds in `src/render/primitives/plants.js`.
- Verified 9 wall fixture pass: `wall-window`, `wall-safe`, `wall-stash`, `wall-stair-door`, and `canvas-tent-flap`.
- Verified 9 terrain block pass: `wall`, `wall-broken`, `cave-wall`, `farmhouse-interior-wall`, `barn-interior-wall`, `shed-interior-wall`, and `canvas-tent-interior-wall`.
- Verified 9 prop pass: `rubble-pile`, `cave-stalagmite`, `cave-stalactites`, `bone-pile`, `bone-niche`, `loose-flagstone`, and `blue-ball`.
- Verified 9 structure pass: `cracked-column`, `saint-statue`, `stone-tomb`, `graveyard-wall`, `calcified-grave-plot`, `calcified-headstone`, `graveyard-tomb-slab`, `graveyard-catacomb-mouth`, `graveyard-bone-marker`, `graveyard-remnant-cross`, and `stone-stairwell`.
- Verified 9 road and chapel structure pass: `quarantine-barricade`, `broken-bell`, `bell-rope`, `quarantine-sign`, `chapel-double-door`, and `damaged-altar`.
- Verified 9 exterior structure pass: `farm-building-block`, `farmhouse-building-block`, `barn-building-block`, `tool-shed-building-block`, `storage-shed-building-block`, `grain-shed-building-block`, `canvas-tent-building-block`, `farm-door`, `farm-fence`, `road-sign-post`, `infected-cave-entrance`, and `devil-target`.
- Verified 9 first furniture pass: `broken-pew`, `rusted-reliquary`, `field-satchel`, `rusted-crate`, `sealed-storage-crate`, `canvas-tent`, `camp-bedroll`, `settlement-table`, and `low-stool`.
- Verified 9 interior and chapel furniture pass: `dining-table`, `dining-bench`, `kitchen-counter`, `farm-prep-table`, `kitchen-hearth`, `farm-kitchen-hearth`, `pantry-shelf`, `wash-tub`, `chapel-banner`, `prayer-lectern`, `chapel-font`, and `rusted-barrel`.
- Verified 9 farm-tool furniture pass: `field-cart`, `hay-rick`, `field-plow`, `field-harrow`, `feed-trough`, `water-pump`, `tool-rack`, `training-dummy`, `wagon-wheel`, and `woodpile`.
- Verified 9 human gore pass: `corpse`, `cult-victim`, `farm-cross-victim`, `skeleton`, `dead-cultist`, and `bound-victim`.
- Verified 9 Host creature prop pass: `calcified-penitent`, `calcified-crossroad-brother`, `calcified-scarecrow-brother`, `calcified-grave-body`, `dead-host-wolf-spider`, `dead-host-wolf-maw`, `dead-host-wolf-ribsplit`, and `host-wolf-remains`.
- Verified 9 decal pass: `blood-stain`, `road-dust`, `glass-debris`, `dust`, `rubble-decal`, `floor-crack`, `scorch-mark`, `wax-stain`, `paper-scraps`, `host-vein-seam`, `graveyard-packed-ash`, `graveyard-path-stones`, `graveyard-root-seam`, `graveyard-prayer-scratch`, `cave-flowstone`, `chaff-scatter`, `trampled-mud`, `practice-scars`, `spent-casings`, `chalk-drawing`, `machine-oil`, and `cobweb`.
- Verified 9 Host actor pass: `host-penitent-bastion`, `host-touched-penitent`, `host-rat-sixlegs`, `host-rat-throat-maw`, `host-rat-tendril-walker`, `host-wolf-spider`, `host-wolf-maw`, and `host-wolf-ribsplit` across actor/enemy records and reusable atlas ids.
- Verified 9 UI pass: HUD command panel, message log, status panel, command panel, dialogue, inventory, journal, loading, creation, trade, loot, context action hints, world speech bubbles, and floating feedback.
- Verified 9 human and faction actor pass: named Censure actors, catacombs survivors, player/Mara rows, Choir human enemies, Red Tithe rows, base settlement variants, and all reusable human model ids.
- Verified 9 uplift families: floor styles, all 130 static renderable catalog kinds, all 17 ground item pickup models, actor/enemy data records, reusable atlas model ids, and UI surfaces.
- Current target status: all 272 audited rows are verified at 9/10.
- New evidence files: `.ai/visual-audit/floors-upgraded-v4.png`, `.ai/visual-audit/scene-long-ash-road-floors-v4.png`, `.ai/visual-audit/scene-censure-camp-floors-v4.png`, `.ai/visual-audit/scene-ash-chapel-floors-v4.png`, `.ai/visual-audit/scene-long-ash-cave-floors-v4.png`, `.ai/visual-audit/ritual-light-host-upgraded-v1.png`, `.ai/visual-audit/scene-ash-chapel-ritual-light-v2.png`, `.ai/visual-audit/scene-ash-cellar-pentagram-v1.png`, `.ai/visual-audit/scene-censure-campfire-v2.png`, `.ai/visual-audit/ground-items-upgraded-v3.png`, `.ai/visual-audit/scene-ground-items-road-dropped-v3.png`, `.ai/visual-audit/scene-ground-items-evidence-level-v4.png`, `.ai/visual-audit/plants-upgraded-v2.png`, `.ai/visual-audit/scene-plants-evidence-level-v3.png`, `.ai/visual-audit/fixtures-upgraded-v1.png`, `.ai/visual-audit/scene-fixtures-evidence-level-v2.png`, `.ai/visual-audit/terrain-blocks-upgraded-v1.png`, `.ai/visual-audit/scene-terrain-blocks-evidence-v2.png`, `.ai/visual-audit/props-upgraded-v1.png`, `.ai/visual-audit/scene-props-evidence-v2.png`, `.ai/visual-audit/structures-core-upgraded-v1.png`, `.ai/visual-audit/scene-structures-core-evidence-v1.png`, `.ai/visual-audit/structures-road-chapel-upgraded-v1.png`, `.ai/visual-audit/scene-road-chapel-structures-evidence-v1.png`, `.ai/visual-audit/structures-exterior-upgraded-v2.png`, `.ai/visual-audit/scene-exterior-structures-farm-evidence-v1.png`, `.ai/visual-audit/scene-exterior-structures-cave-evidence-v1.png`, `.ai/visual-audit/furniture-core-upgraded-v1.png`, `.ai/visual-audit/scene-furniture-core-evidence-v1.png`, `.ai/visual-audit/furniture-interior-upgraded-v1.png`, `.ai/visual-audit/scene-furniture-interior-evidence-v1.png`, `.ai/visual-audit/farm-tool-furniture-upgraded-v1.png`, `.ai/visual-audit/scene-farm-tool-furniture-evidence-v1.png`, `.ai/visual-audit/gore-human-upgraded-v1.png`, `.ai/visual-audit/scene-gore-human-evidence-v1.png`, `.ai/visual-audit/host-creature-props-upgraded-v1.png`, `.ai/visual-audit/scene-host-creature-props-evidence-v1.png`, `.ai/visual-audit/static-catalog-current-v2.png`, `.ai/visual-audit/plants-small-furniture-upgraded-v2.png`, `.ai/visual-audit/decals-upgraded-v3.png`, `.ai/visual-audit/plants-upgraded.png`, `.ai/visual-audit/small-furniture-upgraded.png`, `.ai/visual-audit/host-atlas-upgraded.png`, `.ai/visual-audit/structures-fixtures-tents-upgraded.png`, `.ai/visual-audit/chapel-graveyard-ritual-upgraded-v2.png`, `.ai/visual-audit/actor-atlas-upgraded-v2.png`, `.ai/visual-audit/ui-loading-upgraded.png`, `.ai/visual-audit/ui-briefing-upgraded.png`, `.ai/visual-audit/ui-creation-upgraded.png`, `.ai/visual-audit/ui-hud-upgraded.png`, `.ai/visual-audit/ui-inventory-upgraded.png`, and `.ai/visual-audit/ui-journal-upgraded.png`.
- Latest decal evidence files: `.ai/visual-audit/decals-upgraded-v2.png` and `.ai/visual-audit/scene-decals-evidence-v2.png`.
- Latest Host actor evidence files: `.ai/visual-audit/host-actors-current-v1.png` and `.ai/visual-audit/scene-host-actors-current-v1.png`.
- Latest UI evidence files: `.ai/visual-audit/ui-dialogue-verified-v1.png`, `.ai/visual-audit/ui-trade-verified-v1.png`, `.ai/visual-audit/ui-loot-verified-v1.png`, and `.ai/visual-audit/ui-overlays-verified-v2.png`.
- Latest human/faction actor evidence files: `.ai/visual-audit/human-data-actors-current-v1.png`, `.ai/visual-audit/human-atlas-current-v1.png`, and `.ai/visual-audit/scene-human-faction-current-v1.png`.
- Verification: `npm run check` passed after the latest source and data validation pass.

## Floor Styles

| Texture | Represents | Visualization | Score |
|---|---|---:|---:|
| `stone` | Ruined stone floor | Broken slabs, edge wear, rubble chips, grime, and hard scuffs | 9 |
| `ash-dirt` | Ash-choked earth | Wind-streaked ash, bone flecks, scratch marks, and dirty patches | 9 |
| `ash-road` | Old road surface | Worn road slabs, cracks, ash grit, skid marks, and varied seams | 9 |
| `road-shoulder` | Road edge | Raised hard shoulder with gravel, footprints, bone flecks, and dark rim | 9 |
| `wheat-field` | Dead field rows | Gold-brown rows with stalk pixels, row rhythm, and dry field variation | 9 |
| `furrow-field` | Worked field | Dark furrows, row structure, stalk remnants, and worked-soil patches | 9 |
| `forest-floor` | Ash forest ground | Root tangles, litter, bone flecks, scratch marks, and dark leaf mass | 9 |
| `graveyard-earth` | Grave soil | Cold burial seams, stone flecks, root traces, and grave-soil patches | 9 |
| `farm-plank` | Interior plank floor | Warped planks, nails, board seams, scratches, and directional highlights | 9 |
| `packed-earth` | Camp floor | Camp traffic, peg holes, scuffs, footprints, bone flecks, and dirt patches | 9 |
| `mud-track` | Mud path | Dark wet lanes, hard bands, scuffs, and tracked mud marks | 9 |
| `ash-gravel` | Gravel camp pad | Raised gravel flecks, pale chips, worn patches, and hard edge wear | 9 |
| `worn-canvas` | Tent floor | Heavy canvas panels, seams, patches, rivet-like tie points, and stains | 9 |
| `cave-stone` | Cave floor | Blue-grey stone bands, cracks, wet patches, and readable cave facets | 9 |
| `cave-river` | Shallow cave water | Hard blue water bands, pale current streaks, stones, and dark bank edges | 9 |

## Static Renderable Catalog

### Terrain Blocks

| Kind | Represents | Visualization | Score |
|---|---|---:|---:|
| `wall` | Chapel wall block | Tall stone prism with chipped cap wear, cracked courses, grime, scuffed base, rubble, and clear upper-left light | 9 |
| `wall-broken` | Broken chapel wall | Low broken wall with jagged cap damage, exposed masonry, rubble scatter, dark gaps, and distinct damaged silhouette | 9 |
| `cave-wall` | Cave wall | Vertical ribbed rock face with hard facets, dark seams, wet chips, cap wear, and cave-specific shadow read | 9 |
| `farmhouse-interior-wall` | Farmhouse wall | Pale timber/plaster wall with studs, patches, nail heads, seams, grime, and lit face contrast | 9 |
| `barn-interior-wall` | Barn wall | Dark plank wall with roof mass, cross bracing, nail heads, rusty patch damage, and strong material split | 9 |
| `shed-interior-wall` | Shed wall | Small dark timber wall with rust tones, patched board seams, nail heads, shadow side, and compact shed identity | 9 |
| `canvas-tent-interior-wall` | Tent wall | Canvas wall panels with ridge, stitched seams, poles, ropes, stakes, patches, tie points, and readable cloth structure | 9 |

### Fixtures

| Kind | Represents | Visualization | Score |
|---|---|---:|---:|
| `wall-window` | Chapel window | Recessed arched window with lit glass, dim barred state, stone surround, sill chips, broken panes, and strong wall-face read | 9 |
| `wall-safe` | Wall safe | Recessed metal safe with riveted frame, brass handle and seal, hinge read, open cavity, shelf/loot detail, and strong wall depth | 9 |
| `wall-stash` | Hidden wall stash | Pried wall stash with proud stone slab, dark niche, scratch marks, packet/key details, and clear opened-state read | 9 |
| `wall-stair-door` | Stair door in wall | Deep stair mouth with cut-stone frame, rail lines, latch plate, vanishing treads, threshold chips, and traversal silhouette | 9 |
| `canvas-tent-flap` | Tent doorway flap | Canvas doorway with layered seams, patches, tie cords, locked wax/bolt state, open slit state, stakes, and readable flap silhouette | 9 |

### Structures

| Kind | Represents | Visualization | Score |
|---|---|---:|---:|
| `cracked-column` | Chapel column | Tall support with chipped cap, cracked shaft, ring bands, base rubble, and crisp vertical silhouette | 9 |
| `saint-statue` | Remnant saint statue | Tapered shrine with broken halo/cross read, chipped plinth, robe cracks, dark inset, and sacred silhouette | 9 |
| `stone-tomb` | Tomb block | Low tomb with lid bevel, opened state, corner-post seams, chipped stone, and grounded graveyard mass | 9 |
| `graveyard-wall` | Grave wall section | Low wall with post caps, chipped masonry, base slabs, rubble, dark side, and readable boundary shape | 9 |
| `calcified-grave-plot` | Calcified grave plot | Pale grave body trace with skull/jaw pixels, calcified hand, ash scatter, bones, and human burial read | 9 |
| `calcified-headstone` | Headstone | Pale headstone with crossbar variants, base bevel, cracks, chips, and clear grave marker silhouette | 9 |
| `graveyard-tomb-slab` | Tomb slab | Low slab with bevels, chipped lid, prayer-hand mark, dark underside, and graveyard-scale shadow | 9 |
| `graveyard-catacomb-mouth` | Catacomb entrance | Dark catacomb mouth with chipped jambs, threshold bone, seal detail, depth, and strong traversal cue | 9 |
| `graveyard-bone-marker` | Bone grave marker | Bone-stacked marker with skull niche, lintel, cracks, ground scatter, and strong ossuary theme read | 9 |
| `graveyard-remnant-cross` | Graveyard cross | Tall Remnant cross with chipped arms, cracked stem, heavy base, rubble, and hard sacramental silhouette | 9 |
| `stone-stairwell` | Stairwell opening | Circular stair rail with broken masonry ring, dark mouth, curving steps, rim chips, debris, and strong traversal silhouette | 9 |
| `quarantine-barricade` | Road barricade | Wood-and-rust barricade with angled boards, capped posts, warning paint, braces, chips, debris, and firm camp-road read | 9 |
| `broken-bell` | Fallen bell | Large rusted bell with keeper frame, rivets, cracked body, chipped mouth, wedge, rubble, and heavy readable mass | 9 |
| `bell-rope` | Bell rope | Tall rope with pulley bracket, repair/fray states, strand marks, floor debris, and clear interaction silhouette | 9 |
| `quarantine-sign` | Road warning sign | Leaning warning sign with reinforced post, cracked board, faded marks, chips, base rubble, and readable road marker shape | 9 |
| `chapel-double-door` | Chapel doors | Heavy planked doors with depth, hinge hardware, open/closed state support, scarred boards, chipped reveal, and wall-scale presence | 9 |
| `damaged-altar` | Broken altar | Broken altar with chipped slab, torn cloth, bone relic, cracks, Host growth veins, rubble, and strong sacramental damage | 9 |
| `farm-building-block` | Generic farm building wall | Reusable timber module with chipped roof, planked faces, base grime, rubble, and strong farm identity | 9 |
| `farmhouse-building-block` | Farmhouse exterior | Pale farmhouse block with timber grid, chimney, roof chips, window/trim detail, base wear, and distinct material read | 9 |
| `barn-building-block` | Barn exterior | Dark barn block with sloped roof, cross bracing, roof wear, rust accents, and strong variant identity | 9 |
| `tool-shed-building-block` | Tool shed exterior | Compact tool block with chipped roof, trim, tool marks, side shadow, base rubble, and shed-scale silhouette | 9 |
| `storage-shed-building-block` | Storage shed exterior | Storage block with dark planks, roof seams, X-bracing, small openings, base wear, and distinct compact volume | 9 |
| `grain-shed-building-block` | Grain shed exterior | Pale grain shed with slatted walls, chute, roof cap, supports, chaff scatter, and clear storehouse identity | 9 |
| `canvas-tent-building-block` | Camp tent wall block | Canvas tent block with ridge seams, patch marks, ropes, stakes, chipped edges, and strong camp structure read | 9 |
| `farm-door` | Farm door object | Hinged plank door with frame, latch/lock states, diagonal bracing, chips, threshold debris, and variant support | 9 |
| `farm-fence` | Fence segment | Fence posts and rails with chipped caps, broken rail ties, rusted wood tones, debris, and firm contact shadow | 9 |
| `road-sign-post` | Road sign | Road sign with split post, arrow board, nail heads, diagonal crack, chips, base rubble, and readable silhouette | 9 |
| `infected-cave-entrance` | Cave mouth | Oversized infected cave mouth with dark threshold, hard stone rim, Host veins, bone teeth, growths, rubble, and strong scene anchor | 9 |
| `devil-target` | Training target | Devil-faced practice target with stand braces, horn marks, nailed corners, impact holes, base debris, and readable training-ground theme | 9 |

### Furniture

| Kind | Represents | Visualization | Score |
|---|---|---:|---:|
| `broken-pew` | Broken chapel pew | Split chapel bench with hard-pixel rails, chipped planks, posts, splinters, base rubble, and grounded shadow | 9 |
| `rusted-reliquary` | Reliquary chest | Arched rusted chest with brass bands, outlined rivets, bone detail, lid chips, bevels, and sacred-container read | 9 |
| `field-satchel` | Field satchel | Small field bag with hard strap, flap, side pocket, buckle catchlight, dirt flecks, and dropped-kit silhouette | 9 |
| `rusted-crate` | Rusted crate | Low crate with diagonal braces, bands, lid bevels, corner chips, rust flecks, grime, and readable volume | 9 |
| `sealed-storage-crate` | Sealed crate | Heavy sealed crate with pale lid, cross straps, lock detail, corner brackets, bevels, grime, and readable mass | 9 |
| `canvas-tent` | Small canvas tent | Free-standing canvas tent with stitched seams, patched cloth, ropes, stakes, dark entry, base rubble, and strong camp read | 9 |
| `camp-bedroll` | Bedroll | Strapped lumpy field roll with patched cloth, buckles, folded ends, small kit marks, and strong contact shadow | 9 |
| `settlement-table` | Settlement table | Repaired plank table with hard planks, trestle legs, scuffed top, dish/cup clutter, nail heads, and base debris | 9 |
| `low-stool` | Stool | Small worn stool with chipped plank top, uneven legs, nail marks, cross-brace, debris, and stable silhouette | 9 |
| `dining-table` | Dining table | Oriented table with reinforced trestle, plank seams, tableware, rag, nail heads, debris, and old-CRPG scale | 9 |
| `dining-bench` | Dining bench | Oriented bench with slab top, leg bracing, nail heads, scuffs, debris, and clear dining-set role | 9 |
| `kitchen-counter` | Kitchen counter | Stone and wood counter with panel seams, handle hardware, overhanging worktop, prep clutter, chips, and block mass | 9 |
| `farm-prep-table` | Farm prep table | Work table with plank seams, cutting board, bowl, sack, knife, underside hook, nail head, and practical clutter | 9 |
| `kitchen-hearth` | Hearth | Dark stone hearth with firebox, soot bed, vessel detail, chipped stone, cracks, rubble, and grounded shadow | 9 |
| `farm-kitchen-hearth` | Farm hearth | Farm hearth with pale slab, dark opening, pot detail, wood marks, chips, cracks, soot, and hard material split | 9 |
| `pantry-shelf` | Pantry shelf | Upright shelf with braced posts, stacked boards, jars, sacks, nail heads, base debris, and dense readable storage | 9 |
| `wash-tub` | Wash tub | Banded wooden wash tub with water highlights, handles, rim cloth, stave lines, base debris, and worn rim | 9 |
| `chapel-banner` | Chapel banner | Torn chapel banner with hanger hardware, red cloth, stitched pale mark, ragged tail, folds, debris, and sacred signal | 9 |
| `prayer-lectern` | Lectern | Pedestal lectern with sloped book surface, page marks, side braces, base rail, debris, and ritual silhouette | 9 |
| `ritual-bowl` | Ritual bowl | Small ritual bowl with bone markers, dark plate, ember wound, and crisp sacramental read | 9 |
| `chapel-font` | Chapel font | Bowl on pedestal with dark basin, chipped rim, blood drip, plinth base, rubble, and readable sacred form | 9 |
| `rusted-barrel` | Barrel or hidden ladder barrel | Round rusted barrel with stepped cylinder body, metal bands, dents, rivets, ladder state, and grounded debris | 9 |
| `field-cart` | Farm cart | Broken field cart with wheels, rails, sack cargo, tow ring, nail heads, chipped rail, debris, and rugged silhouette | 9 |
| `hay-rick` | Hay pile | Layered hay rick with tied bands, pale crown, hard straw rows, scatter, base rubble, and readable field material | 9 |
| `field-plow` | Plow | Plow with metal blade, rivets, cutter, wheel, wood handles, soil scatter, debris, and distinct farm-tool profile | 9 |
| `field-harrow` | Harrow | Spiked harrow with frame, teeth, rust nodes, pull ring, wheels, dragged soil, and clear ground-tool shape | 9 |
| `feed-trough` | Trough | Low feed trough with slatted body, dark basin, supports, nail heads, spilled feed, debris, and stable contact shadow | 9 |
| `water-pump` | Water pump | Upright pump with handle, spout drip, pipe body, bolts, base plate, puddle debris, and strong silhouette | 9 |
| `tool-rack` | Tool rack | Tool rack with braced posts, hanging tools, pegs, cross brace, floor chips, base debris, and workshop identity | 9 |
| `training-dummy` | Practice dummy | Practice dummy with target wrap, impact holes, tied head, reinforced base, debris, and training-ground read | 9 |
| `wagon-wheel` | Wagon wheel | Small wheel prop with hub, rim, spokes, chipped segments, support rail, base rubble, and readable salvage shape | 9 |
| `woodpile` | Woodpile | Stacked log pile with alternating ends, bark rings, tie band, bark chips, hard shadow, and clear volume | 9 |

### Props

| Kind | Represents | Visualization | Score |
|---|---|---:|---:|
| `rubble-pile` | Rubble | Stacked broken stones with dark footing, varied prism chunks, foreground slabs, chips, and useful obstruction read | 9 |
| `cave-stalagmite` | Stalagmites | Tall stone spikes with hard facets, mineral bases, dark seams, contact shadow, and cave-material contrast | 9 |
| `cave-stalactites` | Ceiling stone teeth | Hanging stone teeth with heavy top plane, dark underside, drip pixels, facets, and clear cave ceiling signal | 9 |
| `bone-pile` | Bone pile | Bone heap with multiple skulls, long bones, ribs, dark base, pale fragments, and readable ossuary identity | 9 |
| `bone-niche` | Ossuary wall niche | Skull shelf with heavy stone frame, stacked bones, chipped lintel, pale contrast, and strong wall-ossuary read | 9 |
| `loose-flagstone` | Hidden floor stash | Raised flagstone with dark cavity, tilted slab bevel, chips, dirt scatter, glint, and usable stash cue | 9 |
| `blue-ball` | Blue key item ball | Small blue object with plate shadow, hard highlight, seam scar, dark side, and distinct key-item color read | 9 |
| `ground-item` | Dropped loot wrapper | Dispatches to readable pickup glyphs with hard-pixel loot backplate, riveted rim, contact shadow, drop/count states, and real-scene proof | 9 |

### Plants

| Kind | Represents | Visualization | Score |
|---|---|---:|---:|
| `ash-tree` | Dead ash tree | Ragged multi-tone ash canopy with forked trunk, roots, bark scars, hanging dead strands, and scene-scale crown read | 9 |
| `ash-tree-stump` | Tree stump | Ringed cut stump with jagged splinters, root fan, bark scars, broken rim, and subtle Host-taint accents | 9 |
| `fallen-ash-log` | Fallen log | Bark-banded dead log with cut rings, hollow rot, thorns, scarring, roots, and hard contact shadow | 9 |
| `ash-sapling` | Small dead sapling | Leaning sapling with forked twigs, root brace, ragged dead clumps, and pale devotional scar | 9 |
| `scrub-bush` | Scrub bush | Low layered dead brush with ragged mounds, thorn stalks, root spread, ash flecks, and black-gold seams | 9 |
| `wheat-clump` | Field wheat | Dry wheat bundle with stalk heads, tied bands, base debris, chaff scatter, and field-scale variation | 9 |

### Lights

| Kind | Represents | Visualization | Score |
|---|---|---:|---:|
| `candle-cluster` | Candles | Candle cluster with hard light pool, wax plate, uneven wax columns, flame pixels, and excellent small-scale read | 9 |
| `campfire` | Campfire | Campfire with hard flame stack, stone ring, crossed logs, warm pool, smoke-dark center, and ground shadow | 9 |

### Gore, Host Creature Props, and Rituals

| Kind | Represents | Visualization | Score |
|---|---|---:|---:|
| `host-growth` | Host growth patch | Black-gold Host plate with one controlled wound, asymmetric bone thorns, thin veins, pulse support, and clear Host cue | 9 |
| `corpse` | Generic corpse | Flat fallen human with outlined coat, slack limbs, head and boots, blood pool, wound marks, rubble, and readable body shape | 9 |
| `cult-victim` | Carved victim | Carved victim with hard-pixel inverted star, drag smear, throat cross, slack limbs, spatter, debris, and scene-story signal | 9 |
| `farm-cross-victim` | Crucified farm victim | Crucified farm victim with rough timber, nailed wrists, household body variants, throat wound, base blood, hardware, and debris | 9 |
| `skeleton` | Skeleton | Pale skeleton with skull, ribcage, pelvis, splayed long bones, finger fragments, chips, and clear corpse-state read | 9 |
| `dead-cultist` | Dead cultist | Red-robed body with hood, stole, rite knife, belt gear, hands, boots, blood mass, debris, and faction corpse identity | 9 |
| `cross-martyr` | Opened Saint | Goat skull, halo, rib wings, asymmetry, exemplar | 9 |
| `bound-victim` | Bound captive | Upright bound captive with wrist bar, rope hardware, bowed human body, Host seams, base blood, debris, and sacrifice silhouette | 9 |
| `calcified-penitent` | Calcified Host body | Chained calcified Host body with broken halo, bowed skull, open rib cavity, fused prayer hands, dead seams, and human-scale posture | 9 |
| `calcified-crossroad-brother` | Calcified road brother | Calcified road brother with signpost frame, stretched arms, broken halo, offered scraps, carved torso marks, and road-martyr silhouette | 9 |
| `calcified-scarecrow-brother` | Calcified field brother | Calcified field brother with scarecrow beam, wheat base, tied wrists, broken halo, open torso, cloth bands, and field-placement read | 9 |
| `calcified-grave-body` | Calcified grave body | Small grave-body prop with variant skull, halo, rib motifs, calcified limbs, buried base, dead seams, and readable grave Host state | 9 |
| `dead-host-wolf-spider` | Dead Host wolf spider | Dead Host wolf with goat-wolf skull, folded spidering limbs, black-gold seams, slack canine body, blood mass, and asymmetry | 9 |
| `dead-host-wolf-maw` | Dead Host wolf maw | Dead skull-maw wolf with chapel-mouth head, teeth, prayer-fused forelegs, black throat, dead body mass, and distinct silhouette | 9 |
| `dead-host-wolf-ribsplit` | Dead ribsplit wolf | Dead ribsplit wolf with exposed rib fan, black-gold seams, slack canine body, pale bone mass, and clear Vale Imprint damage | 9 |
| `host-wolf-remains` | Wolf remains | Host wolf remains pile with open rib cage, goat-wolf skull, bone chips, tendrils, black-gold accents, and readable aftermath | 9 |
| `choir-pentagram` | Wall/floor ritual mark | Hard-pixel point-down wound-star with rough red geometry, black-gold bleed, drips, and clear cult signal | 9 |
| `blood-sigil` | Flat blood sigil | Flat blood sigil with dark plate, inverted mark, bone pins, red stain, and readable ritual cue | 9 |
| `ritual-circle` | Ritual circle | Ritual circle with ring geometry, bone markers, rough red stakes, pale flecks, and clear floor-rite read | 9 |

### Decals

| Kind | Represents | Visualization | Score |
|---|---|---:|---:|
| `blood-stain` | Blood stain | Rust-red stain with hard edge, dark center, spatter pixels, drag smear, and clear floor event cue | 9 |
| `road-dust` | Road dust | Pale road grit with hard flecks, directional scrape lines, rim dust, and scene-scale surface wear | 9 |
| `glass-debris` | Broken glass | Pale glass shards with dark backing, varied sharp shapes, flash glints, and readable broken-object cue | 9 |
| `dust` | Dust | Subtle dust patch with structured flecks, small packed ridges, hard edge variation, and controlled low-contrast use | 9 |
| `rubble-decal` | Broken stone | Flat rubble decal with chipped slabs, dark under-pixels, stone highlights, and clear floor-break read | 9 |
| `floor-crack` | Floor crack | Branching floor crack with heavy dark core, pale chipped edges, loose rubble, and visible surface damage | 9 |
| `scorch-mark` | Scorch | Dark burn ring with soot center, hard radial scars, ember fleck, and clear fire-damage signal | 9 |
| `wax-stain` | Wax spill | Pale wax spill with hard puddle bands, candle-like raised drips, soot wicks, and chapel-prop context | 9 |
| `paper-scraps` | Paper scraps | Layered pale scraps with folds, ink strokes, red seal fleck, shadows, and readable discarded-paper contrast | 9 |
| `host-vein-seam` | Host vein seam | Black-gold floor seam with branching veins, dark tissue edges, hard tendrils, and strong Host accent | 9 |
| `graveyard-packed-ash` | Packed grave ash | Grave ash patch with incised bands, bone flecks, dark packed center, and readable cemetery surface variation | 9 |
| `graveyard-path-stones` | Path stones | Path-stone flecks with slab shapes, dark rims, pale highlights, and clear graveyard walkway read | 9 |
| `graveyard-root-seam` | Root seam | Dark root seam with grounded soil plate, branching roots, pale bone fleck, and thematic grave-soil damage | 9 |
| `graveyard-prayer-scratch` | Prayer scratch | Pale scratched prayer mark with dark gouge backing, broken scoring, dust ring, and clear devotional damage | 9 |
| `cave-flowstone` | Flowstone | Pale cave bands with layered ribs, mineral lips, hard shadows, and readable cave-floor flowstone cue | 9 |
| `chaff-scatter` | Field chaff | Straw scatter with windrows, clustered stalk bits, warm flecks, dark underlines, and field-surface identity | 9 |
| `trampled-mud` | Mud trampling | Trampled mud with dark track mass, paired boot prints, wet scrapes, and readable traffic damage | 9 |
| `practice-scars` | Training scratches | Practice scars with dark back-cuts, pale slash marks, impact chip, dust flecks, and drill-yard identity | 9 |
| `spent-casings` | Bullet casings | Brass casings with hard gold pixels, dark backing, cap glints, ejection scuffs, and readable combat residue | 9 |
| `chalk-drawing` | Child chalk drawing | Chalk drawing with shadowed ringed world, stick figure, chalk stick, dust scuffs, and strong story-detail read | 9 |
| `machine-oil` | Oil smear | Dark oil smear with hard shine, thin spread trails, brass rivet, dark flecks, and readable machinery residue | 9 |
| `cobweb` | Cobweb | Pale cobweb with stronger thread fan, ring strands, dust flecks, corner anchor, and readable neglected-interior cue | 9 |

## Ground Item Pickup Models

| Model | Represents | Visualization | Score |
|---|---|---:|---:|
| `ball` | Blue ball item | Blue sphere glyph with hard highlight, seam scar, dark side, and grounded pickup plate | 9 |
| `boots` | Boots | Paired leather boots with toe caps, soles, laces, buckles, and clear two-boot silhouette | 9 |
| `coat` | Coat | Folded blue coat with center opening, cuffs, strap marks, side folds, and readable cloth mass | 9 |
| `hood` | Hood | Hood glyph with deep face opening, rim highlight, lower fold, ties, and clear cowl shape | 9 |
| `vest` | Vest | Folded armor vest with shoulder straps, metal plates, clasp, leather body, and strong rim read | 9 |
| `ribguard` | Ribguard armor | Bone-rib armor with paired ribs, central spine, strap body, gold seam, and strong pale contrast | 9 |
| `ring` | Ring | Oversized gold ring glyph with hollow center, raised setting, hard metal highlights, and shadowed rim | 9 |
| `necklace` | Necklace | Chain and pendant glyph with visible beads, hanging cross form, hard gold highlight, and readable drape | 9 |
| `key` | Key | Long key silhouette with bow, shaft, teeth, extra bit, and hard brass highlight | 9 |
| `paper` | Paper | Layered paper scraps with folds, ink marks, red seal, and pale contrast on dark plate | 9 |
| `vial` | Vial | Glass vial with stopper, pale body, blue liquid meniscus, dark side, and crisp highlight | 9 |
| `dressing` | Bandage | Folded dressing with wrap strap, cloth edge marks, blood pin, and compact medical read | 9 |
| `food` | Tin food | Small ration tin with label band, pull-tab, metal rim, and cylindrical highlight | 9 |
| `rounds` | Ammunition | Brass rounds grouped in a belt strip with caps, shadow, and repeated cartridge shape | 9 |
| `chit` | Chit | Brass chit with clipped corner, punched mark, edge wear, dark plate, and readable rectangular token form | 9 |
| `shard` | Bright fragment | Pale shard with angular broken profile, dark plate, facet line, and hard edge highlight | 9 |
| `token` | Saint token | Gold saint token with oval body, incised cross mark, rim shadow, and bright top edge | 9 |

## Actor and Enemy Data Records

| Record | Represents | Visualization | Score |
|---|---|---:|---:|
| `censure-bell-clerk-sera` | Bell Clerk Sera | Compact Remnant clerk with pale hood, prayer cord, message tube, and clear front/back kit read | 9 |
| `censure-evidence-keeper-malco` | Evidence Keeper Malco | Old bent keeper with hunched posture, carried records, cane-like stance, and readable archival role | 9 |
| `censure-widow-bruna` | Widow Bruna | Stooped civilian with dark shawl, prayer cord, cane posture, and distinct elderly silhouette | 9 |
| `catacombs-survivor-dalia` | Dalia Mor | Chapel-hand survivor with bundled cloth, pale shoulder read, dark coat, and readable camp role | 9 |
| `catacombs-survivor-oren` | Oren Rill | Broad settler with crate/load silhouette, staff, work-coat mass, and strong front/back distinction | 9 |
| `censure-sutler-maev` | Sutler Maev | Heavy trader with ledger, tally tags, side kit, rounded coat mass, and clear road-sutler read | 9 |
| `catacombs-survivor-selka` | Selka Ardent | Heavy matron with pale shawl, ledger/staff read, broad stance, and named elder silhouette | 9 |
| `censure-brother-caldus` | Brother Caldus | Broad Remnant worker with load, patched coat, work stance, and strong camp-labor read | 9 |
| `catacombs-survivor-hanne` | Hanne Rovik | Field nurse composite with pale hood, red medical cross bag, slim stance, and clear aid-role read | 9 |
| `catacombs-survivor-nessa` | Nessa Quay | Water carrier with blue cloth, paired jars, dark strap, and distinct utility silhouette | 9 |
| `catacombs-child-eda` | Eda | Small chalk-child silhouette with tan coat, neck token, tiny satchel, and correct child scale | 9 |
| `censure-preceptor-voss` | Preceptor Voss | Broad authority figure with hood, shoulder plate, scarred-face cue, and heavy command posture | 9 |
| `catacombs-survivor-mirel` | Mirel Ardent | Quartermaster survivor with blue chest cloth, side bundle, ledger kit, and compact role clarity | 9 |
| `censure-ash-porter-joric` | Ash Porter Joric | Broad porter with crate-pack mass, paired loads, work boots, and readable carried-goods silhouette | 9 |
| `catacombs-survivor-runa` | Runa Pell | Sturdy cook with pale apron, pot-hook/tool cue, warm coat mass, and immediate camp-kitchen read | 9 |
| `catacombs-survivor-tomas` | Tomas Vek | Lean runner with long legs, blue trousers, message kit, staff line, and narrow road stance | 9 |
| `censure-writ-runner-pell` | Writ Runner Pell | Lean runner with tube, dark hood, blue lower silhouette, and clear messenger posture | 9 |
| `catacombs-survivor-istra` | Istra Havel | Old bent mender with tool roll, low posture, patched coat, and clear repair-role kit | 9 |
| `player` | Legacy militia scout | Atlas entry resolves through the Mara equipment renderer with coat, vest, hood, and kit silhouette | 9 |
| `mara-vey` | Mara Vey | Equipment-driven cult-breaker with field coat, vest, hood, sidearm kit, and strong player-standard silhouette | 9 |
| `censure-quartermaster-runa` | Quartermaster Runa | Sturdy quartermaster with blue cloth, ledger/roll kit, pale bundle, and clear supply-role read | 9 |
| `censure-tether-guard-elian` | Tether Guard Elian | Lean guard-runner with shoulder kit, message tube, hooded stance, and distinct Censure silhouette | 9 |
| `catacombs-child-corin` | Corin | Small blue-coated child with token, tiny satchel, bright face, and correct gameplay-scale read | 9 |
| `censure-novice-ivarn` | Novice Ivarn | Teen novice with papers, bandage-sling-like posture, small frame, and clear junior-role scale | 9 |
| `censure-sister-hanne` | Sister Hanne | Remnant nurse with pale hood, red medical cross bag, compact stance, and front/back readability | 9 |
| `censure-father-odran` | Father Odran | Old road priest with prayer cord, grey hair, bundled cloth, bent posture, and clear clerical role | 9 |
| `choir-candle-bearer` | Candle-Bearer | Human cultist with candle tray, red stole, masked cowl, hidden knife read, and ritual silhouette | 9 |
| `host-penitent-bastion` | Penitent Bastion | Opened Penitent silhouette with broken halo, exposed cavity, fused prayer-arm, dragging hand, and clear kneeling Host role | 9 |
| `host-rat-sixlegs` | Six-Legged Host Rat | Host rat with bone prayer ribs, fused hands, six-leg profile, black-gold seams, and clear small-beast silhouette | 9 |
| `choir-flesh-eater` | Flesh-Eater | Bloated human cultist with swollen robe, sacrament flesh, red hands, and unsettling human scale | 9 |
| `choir-throat-singer` | Throat-Singer | Lean dark-robed cultist with throat-glass detail, narrow stance, and ranged scout read | 9 |
| `host-touched-penitent` | Host-Touched Penitent | Kneeling opened Penitent Engine with broken halo, bone thorns, black-gold wound, fused arms, and impossible-road omen read | 9 |
| `host-wolf-spider` | Spider-Leg Host Wolf | Low Host wolf with goat-skull head, bone spider legs, prayer marks, red wound, and asymmetrical body horror | 9 |
| `host-wolf-ribsplit` | Ribsplit Host Wolf | Rib-split Host wolf with exposed pale rib fans, goat-skull head, black-gold seam, and strong Vale Imprint read | 9 |
| `host-wolf-maw` | Maw Host Wolf | Skull-maw wolf with pale chapel mouth, throat tendrils, dark body mass, horns, and clear hostile silhouette | 9 |
| `red-tithe-cutthroat` | Red Tithe Cutthroat | Broad raider in red leathers with shoulder plate, cleaver cue, rust cowl, and strong hostile silhouette | 9 |
| `host-rat-tendril-walker` | Tendril-Walker Host Rat | Tendril rat with exposed rib fan, bone-tipped walker limbs, black-gold wound, and clear Host mutation read | 9 |
| `host-rat-throat-maw` | Throat-Maw Host Rat | Maw rat with pale teeth, displaced head, throat split, bone ribs, and readable small Host profile | 9 |

## Atlas and Reusable Model Library

| Model | Represents | Score |
|---|---|---:|
| `mara-vey` | Equipment-driven player cult-breaker with field coat, hood, gear mass, and strong all-purpose player silhouette | 9 |
| `settlement-man` | Generic adult male survivor with patched work coat, rope belt, bedroll, and grounded camp scale | 9 |
| `settlement-woman` | Generic adult female survivor with shawl, apron layer, hand accents, and clear civilian posture | 9 |
| `settlement-child` | Generic child survivor with oversized coat, tiny satchel, bright face, and correct small scale | 9 |
| `settlement-selka` | Named matron survivor variant with heavy shawl, pale cloth, staff/ledger cues, and broad elder silhouette | 9 |
| `settlement-mirel` | Named quartermaster survivor variant with blue chest cloth, bundle, ledger read, and compact utility stance | 9 |
| `settlement-oren` | Named settler survivor variant with broad body, work coat, staff, and load-bearing silhouette | 9 |
| `settlement-tomas` | Named runner survivor variant with long legs, blue lower read, message kit, and narrow road stance | 9 |
| `settlement-runa` | Named cook survivor variant with pale apron, tool/pot cue, warm coat, and sturdy camp role | 9 |
| `settlement-istra` | Named mender survivor variant with bent stance, tool roll, patched coat, and repair-role read | 9 |
| `settlement-nessa` | Named water survivor variant with blue cloth, jars, strap, and distinct carrier silhouette | 9 |
| `settlement-dalia` | Named chapel-hand survivor variant with dark coat, bundled cloth, pale trim, and careful camp posture | 9 |
| `settlement-hanne` | Named nurse survivor variant with pale hood, red medical bag, compact stance, and strong support read | 9 |
| `settlement-corin` | Named child survivor variant with blue coat, small satchel, token, and clear child-scale silhouette | 9 |
| `settlement-eda` | Named child survivor variant with chalk pouch, tan sleeves, token, and distinct child-scale read | 9 |
| `choir-cultist` | Base Choir cultist with red stole, masked cowl, blood-black mouth cue, and hidden knife silhouette | 9 |
| `red-tithe-cutthroat` | Base Red Tithe cutthroat with rust cowl, red leathers, cleaver line, and strong raider posture | 9 |
| `host-touched-penitent` | Opened Penitent actor | 9 |
| `host-rat-sixlegs` | Host rat variant | 9 |
| `host-rat-throat-maw` | Host rat maw variant | 9 |
| `host-rat-tendril-walker` | Host rat tendril variant | 9 |
| `host-wolf-spider` | Host wolf spider variant | 9 |
| `host-wolf-maw` | Host wolf maw variant | 9 |
| `host-wolf-ribsplit` | Host wolf ribsplit variant | 9 |
| `human-road-matron-heavy` | Heavy road matron with layered shawl, ledger, staff read, pale shoulder cloth, and grounded elder stance | 9 |
| `human-buff-hauler` | Broad ash-road hauler with crate-pack mass, thick arms, rope belt, and load-bearing silhouette | 9 |
| `human-fat-trader` | Round road trader with tan coat, ledger, tally tags, belly pouch, and careful stance | 9 |
| `human-old-widow` | Stooped elderly widow with dark shawl, cane, prayer cord, grey hair, and narrow face read | 9 |
| `human-old-tinker` | Elderly tinker with bent back, tool roll, patched coat, cane, and repair-role silhouette | 9 |
| `human-field-nurse-compact` | Compact field nurse with pale hood, red medicine cross, side satchel, and clear aid-role read | 9 |
| `human-water-carrier-blue` | Blue water carrier with paired jars, dark waist strap, blue cloth, and distinct utility silhouette | 9 |
| `human-wall-runner-lean` | Lean wall runner with long legs, blue sash, message tube, light pack, and narrow road stance | 9 |
| `human-bandaged-teen` | Bandaged adolescent survivor with sling, too-large coat, thin legs, and strong age/scale read | 9 |
| `human-road-child-blue` | Blue-coated child with tiny satchel, neck token, bright face, and clean child-scale silhouette | 9 |
| `human-chalk-child` | Chalk child with pouch, tan sleeves, small talisman, and distinct small survivor silhouette | 9 |
| `human-ash-scout-hooded` | Hooded ash scout with staff line, thin pack, bedroll read, and narrow road stance | 9 |
| `human-broad-warden` | Broad settlement guard with shoulder plate, scarred brow cue, heavy coat, and guard posture | 9 |
| `human-hollow-refugee` | Gaunt refugee with sunken shoulders, oversized coat, thin pack, and frail silhouette | 9 |
| `human-cook-apron` | Camp cook with long apron, pot-hook/tool cue, stocky stance, and readable workwear layers | 9 |
| `human-prayer-keeper` | Chapel keeper with prayer cord, dark coat, bundled cloth, and careful devotional posture | 9 |
| `human-seamstress-quartermaster` | Seamstress quartermaster with roll bundle, ledger, blue chest cloth, and pinned tool read | 9 |
| `human-scarred-veteran` | Scarred veteran with shoulder plate, rope coil, guarded stance, and worn settler silhouette | 9 |
| `human-lame-grandfather` | Lame grandfather with high hunch, grey hair, cane, patched trousers, and frail posture | 9 |
| `human-shawl-grandmother` | Small grandmother with pale shawl, jars, prayer cord, bent shoulders, and gentle elder scale | 9 |
| `choir-candle-novice` | Choir candle novice with low tray, wax-lit sleeves, red robe, and masked cowl silhouette | 9 |
| `choir-throat-singer-lean` | Lean throat singer with dark neck strip, relic-glass pouch, narrow robe, and scout posture | 9 |
| `choir-flesh-eater-bloated` | Bloated flesh-eater with swollen robe, sacrament bundle, red-stained hands, and heavy cultist stance | 9 |
| `choir-bone-lector` | Choir bone lector with pale scroll plates, tally tags, formal stole, and ritual clerk silhouette | 9 |
| `choir-veiled-mother` | Veiled Choir mother with dark face cloth, prayer cord, red robe, and hidden-knife read | 9 |
| `choir-chain-bearer` | Choir chain bearer with dragging links, rope coil, heavy sleeves, and weighted ritual silhouette | 9 |
| `choir-ash-penitent` | Ash-masked Choir penitent with pale face plate, bowed posture, tight robe, and devotional shape | 9 |
| `choir-broad-guard` | Broad Choir guard with armored shoulder, red stole, heavier knife read, and strong guard stance | 9 |
| `choir-old-confessor` | Old Choir confessor with staff, bone charm, grey hood edge, bent robe, and elder cult role | 9 |
| `choir-scarlet-knife` | Scarlet-robed knife cultist with triple blades, black cowl, quick stance, and aggressive silhouette | 9 |
| `red-tithe-buff-raider` | Buff Red Tithe raider with cleaver, shoulder plate, dark leathers, red scarf, and heavy threat read | 9 |
| `red-tithe-starved-runner` | Starved Red Tithe runner with thin limbs, relic sack, long hooked knife, and gaunt threat read | 9 |
| `red-tithe-sawbones` | Red Tithe sawbones with tool roll, blood-dark apron, narrow hood, and grim field-surgeon silhouette | 9 |
| `red-tithe-hook-carrier` | Red Tithe hook carrier with rope coil, chain links, heavy pack, and scavenger-hauler read | 9 |

## UI Surfaces

| Surface | Represents | Visualization | Score |
|---|---|---:|---:|
| HUD command panel | Always-on play UI | Hard rect command frame with bitmap text, riveted chrome, dense scan layout, and strong late-90s CRPG fit | 9 |
| Message log | Quest and feedback text | Compact log with outcome color, hard frame texture, readable wrapping, and strong old-CRPG information density | 9 |
| Status panel | Character state | Status panel with HP bar, mode, AP/pack grouping, hard metal frame, and clear repeated-play readability | 9 |
| Command panel | Input affordances | Command panel with grouped actions, selected row states, nearby-action emphasis, and usable 640 px tactical density | 9 |
| Dialogue screen | Conversations and choices | Framed dialogue wells with bitmap font, response hierarchy, scanline backdrop, and cohesive canvas-only presentation | 9 |
| Inventory screen | Pack and paper doll | Inventory screen with real sprite paper doll, hard panels, item icons, dense list/detail layout, and strong cohesion | 9 |
| Journal screen | Book/codex | Parchment codex surface with tabs, map/state pages, dense readable text, and the strongest bespoke UI identity | 9 |
| Loading screen | Loading progress | Metal loading frame with hard progress pips, palette-safe texture, and readable status hierarchy | 9 |
| Creation screen | Character creation | Character creation surface with shared canvas chrome, sprite preview, framed choices, and old-CRPG density | 9 |
| Trade screen | Trading | Trade screen with functional stock/pack/detail columns, item icons, price chips, hard frames, and inventory-language consistency | 9 |
| Loot screen | Containers and corpse loot | Loot screen with inventory chrome, item icons, clear marked rows, detail pane, and readable action focus | 9 |
| Context action hint | Nearby action hint | Compact in-scene action menu and HUD hint with hard frames, enabled/disabled states, and scene-safe placement | 9 |
| World speech bubbles | Actor speech overlay | In-world speech overlay with allowed text exception, hard frame, tail, texture marks, and readable actor association | 9 |
| Floating combat numbers | Damage/cost overlay | Floating tactical feedback with allowed text exception, dark backing, hard highlight, and readable scene placement | 9 |

## Compliance Notes

- `npm run check` passed after the audit.
- No `createLinearGradient`, `createRadialGradient`, `ctx.arc`, blur, or filter usage was found in `src/render`.
- Browser `fillText` in render code is limited to in-world speech bubbles, movement costs, and floating combat text, which the art standard explicitly allows.
- `Math.random` appears in runtime systems for locks, perception, patrol delay, and combat barks, not in static render functions that would shimmer.
- Player-facing text in `data/` did not contain em-dashes or `--` in the final search. Matches were code comments and docs.
- Inline hex colors are present in level mood values and the journal parchment table. The journal parchment table is documented by the art standard. Level mood colors are data-authored scene washes and should be reviewed if the palette-only rule is tightened for mood data.

## Recommended Fix Order

1. Keep future content at the verified 9/10 bar by requiring isolated and in-scene evidence before adding new visual rows.
2. Add in-scene comparison screenshots for each 9/10 claim so isolated gallery strength also holds in playable maps.
3. Improve generic human and faction actor variants with stronger posture, equipment silhouettes, asymmetry, and named-role reads.
4. Push Host animal actor variants beyond readable into unmistakably Vale Imprint body horror at gameplay scale.
5. Keep UI regression screenshots in future passes, especially command panels, trade/loot screens, speech bubbles, and floating numbers.
6. Review level mood hexes against `PALETTE` names if the project wants strict palette validation beyond draw code.
