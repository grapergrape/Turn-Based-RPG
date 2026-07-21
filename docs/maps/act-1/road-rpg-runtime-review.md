# Long Ash Road and Censure Road Camp Runtime Review

This review closes the implementation and acceptance work in the
[Long Ash Road and Censure Road Camp RPG content plan](./road-rpg-content-plan.md).
It covers both main maps, the connected Long Ash maps, all eight camp tent
interiors, the cross-map report chain, deterministic loot, container state art,
and onward travel.

## Acceptance result

- All 100 planned passes have a numbered capture and supporting runtime or test
  evidence.
- `npm run check` passes with 470 JSON files parsed.
- Every focused command named by the plan passes.
- The current full `npm test` run exits 0. This includes the Ash Road South and
  South Measure suites present in the shared worktree.
- The aggregate plan scope contains 78 checked gates: 51 object methods and 27
  dialogue choices. Every threshold is legal at creation for its stated field
  or primary.
- All promised tent discoveries now have a one-shot response at the responsible
  exterior NPC.
- The player-copy scan found no em dash, doubled hyphen, banned vocabulary, or
  banned phrase in the 55 target files.
- Detached and live captures show distinct full and consumed states for the
  satchel, both crate families, and the barrel.

## Review artifacts

- [Road passes 001 to 025](../../../.ai/visual-audit/long-ash-censure-rpg-passes/contact-road-001-025.png)
- [Road passes 026 to 050](../../../.ai/visual-audit/long-ash-censure-rpg-passes/contact-road-026-050.png)
- [Camp passes 051 to 075](../../../.ai/visual-audit/long-ash-censure-rpg-passes/contact-camp-051-075.png)
- [Camp passes 076 to 100](../../../.ai/visual-audit/long-ash-censure-rpg-passes/contact-camp-076-100.png)
- [Detached container state comparison](../../../.ai/visual-audit/long-ash-censure-rpg-passes/container-states-detached.png)

Individual captures live in
`.ai/visual-audit/long-ash-censure-rpg-passes/pass-001.png` through
`pass-100.png`. Static captures establish placement and construction. Runtime
tests and live captures establish UI boundaries, persistence, consumption, and
travel.

## Before and after

Counts use runtime JSON, not generator source estimates. A Search or lock count
is a method count, so one object may contribute more than one method.

| Package | Baseline | Accepted runtime |
| --- | --- | --- |
| Long Ash main map | 2,317 objects; 2 containers; 1 Search; 1 lock; 3 enemies; no living NPC | 2,328 objects; 7 containers; 20 Search methods; 5 lock methods; 3 enemies; 1 living NPC |
| Long Ash full package | 10 maps; 2,499 objects; 14 containers; 29 loot stacks; 8 enemies | 10 maps; 2,510 objects; 19 containers; 42 loot stacks; 8 enemies |
| Camp main map | 407 objects; no containers, Search, locks, or loot; 13 NPCs | 408 objects; 3 containers; 14 Search methods; 3 lock methods; 8 loot stacks; 13 NPCs |
| Camp full package | 9 maps; 451 objects; 1 Search; no loot | 9 maps; 452 objects; 4 containers; 25 Search methods; 4 lock methods; 12 loot stacks |

Current authored inventory totals are:

| Scope | Interactables | Containers | Loot stacks | Loot units | Gated object methods | Journal notes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Long Ash main | 53 | 7 | 18 | 49 | 25 | 24 |
| Long Ash full | 94 | 19 | 42 | 154 | 39 | 42 |
| Camp main | 19 | 3 | 8 | 11 | 15 | 28 |
| Camp full | 29 | 4 | 12 | 17 | 26 | 38 |

Every stack uses an existing item ID and a positive integer count. Container IDs
are stable and globally unique in the reviewed slice. The exterior and interior
issue crates share one loot manifest and one claim flag, so they cannot pay the
same authorization twice.

## Generator reproducibility

Both generators were copied to isolated temporary roots and run there. Each
result matched the checked runtime JSON byte for byte.

| Artifact | SHA-256 |
| --- | --- |
| `scripts/gen-long-ash-road.mjs` | `a8e361aa0ea3a7ff3d1c9c001b2f13eab96a5880cd1d6bc64d8c84d5ae8a7227` |
| `data/levels/long_ash_road_approach.json` | `8a2e3672618001138a301a9805611717b13c35c4d144e579fcf0d8ecb5272f92` |
| `scripts/gen-censure-road-camp.mjs` | `d802b7c80c414695370c614bd0654b24f0a0efe8b7ac2ffe826ff52b7c323388` |
| `data/levels/censure_road_camp.json` | `47f6a9ff6b679aae9c780ee8c0fab6c70ec55c9cf9dc5bf8ab86fa40e362aa0a` |

## Threshold legality

The aggregate regression loads the Long Ash main map, the camp main map, all
eight camp interiors, and every dialogue they reference. It finds 78 gates
across 13 field ratings. Body 7, Eye 7, and Nerve 7 gates are present. Every
primary gate is at or below the creation cap of 7. Ordinary field gates are at
or below 63, while the scar fields Host Signs and Containment may legally reach
68.

An exhaustive enumeration of the seven creation primaries, each from 3 to 7
with 14 assignment points spent, produces 8,135 legal spreads. For any ordinary
three-primary field, the pass counts are:

| Threshold | Legal spreads that pass | Share |
| ---: | ---: | ---: |
| 40 | 7,335 | 90.2 percent |
| 45 | 5,835 | 71.7 percent |
| 50 | 3,020 | 37.1 percent |
| 55 | 952 | 11.7 percent |
| 60 | 70 | 0.9 percent |
| 63 | 10 | 0.1 percent |

The ordinary range is 27 to 63. The Host Signs 65 checks remain legal because
The player's scar bonus raises that field's creation maximum to 68. No optional check
is the only route through a level or required quest outcome. Failed checks stay
available for a later return.

## Interior handoff closure

The aggregate regression now treats these responses as a manifest. It proves
that each source flag is produced by an interior interaction, reaches exactly
one named dialogue consumer, records its acknowledgment flag, and disappears
after that acknowledgment.

| Interior finding | Exterior response | One-shot result |
| --- | --- | --- |
| Corrected route order | Aquila | `censure-road-voss-preceptor-order-reported` |
| Missing-witness doctrinal reading | Aquila | `censure-road-voss-preceptor-correction-reported` |
| Linen found in Augustine's chest | Aquila | `censure-road-voss-odran-chest-reported` |
| Misplaced relief bundle | Ruth | `censure-road-runa-relief-bundle-reported` |
| False powder stock mark | Ruth | `censure-road-runa-stock-mark-reported` |
| Safe medic packet | Joanna | `censure-road-hanne-safe-packet-reported` |
| Medic packet marked for containment | Melchior | `censure-road-malco-medic-packet-reported` |
| Paulinus Corda's coat cache | Cyprian | `censure-road-caldus-coat-cache-reported` |
| Dropped sutler tally | Judith | `censure-road-maev-dropped-tally-reported` |
| Altered sutler price | Judith | `censure-road-maev-price-mark-reported` |
| Scraped return-peal clause | Sabina | `censure-road-sera-chapel-clause-reported` |

Augustine's chest now sets a chest-specific linen flag beside
`odran-late-visit-suspected`. Philip's rumor can still start the watch, but it
cannot pose as physical evidence when speaking to Aquila.

## Writing and art checks

The writing audit walked 10,797 string values in 55 target levels, dialogues,
actors, and the camp quest. It found no prohibited dash and no banned wording.
It also found no use of Europa, the Vale Imprint, Seneca, or an alien origin.
Nine uses of “Stilling” describe public chronology only. None explains its
mechanism. The new handoff copy keeps each profession's nouns and pressure:
Aquila uses files and authority, Ruth uses counts, Joanna uses boiled cloth, Melchior
uses shelf rules, Cyprian uses kit records, Judith uses prices, and Sabina uses peals.

The opened-state art uses existing palette constants and hard-pixel primitives.
It preserves each container's footprint and contact shadow while changing its
mass with an open flap, raised lid, broken seal, dark mouth, or empty rim.
`catalogRender` executes 188 registered kinds across six seeds, for 1,128 draw
calls with no exception. It also asserts a distinct opened drawing branch for
`field-satchel`, `rusted-crate`, `sealed-storage-crate`, and `rusted-barrel`.
The detached comparison and live pass 97 confirm the states at normal scene
scale.

## Acceptance commands

| Command | Result |
| --- | --- |
| `npm run check` | Pass, 470 JSON files parsed |
| `node tests/longAshRoadLevel.test.mjs` | Pass |
| `node tests/censureRoadCampLevel.test.mjs` | Pass |
| `node tests/censureRoadAuthorization.test.mjs` | Pass |
| `node tests/roadRpgContent.test.mjs` | Pass |
| `node tests/searchSystem.test.mjs` | Pass |
| `node tests/dialogueInventoryEffects.test.mjs` | Pass |
| `node tests/levelTransitions.test.mjs` | Pass |
| `node tests/progression.test.mjs` | Pass |
| `node tests/catalogRender.test.mjs` | Pass, 188 kinds and 1,128 draws |
| `npm test` | Pass on the current full worktree |

Evidence tags used below are: `LA` for the Long Ash focused test, `CC` for the
camp focused test, `CA` for route authorization, `RR` for the aggregate road
regression, `SS` for Search runtime, `DI` for inventory effects, `LT` for level
and journal transitions, `PG` for progression math, `CR` for catalog rendering,
`FULL` for the complete test suite, and `LIVE` for a live-game capture.

## Passes 1 to 25

| Pass | Review target | Accepted evidence | Capture |
| ---: | --- | --- | --- |
| 1 | Long Ash generator baseline | Isolated generation byte-matches the recorded JSON hash. | [001](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-001.png) |
| 2 | Whole-map route | Spawn reaches the camp exit and every connected entrance. `LA` | [002](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-002.png) |
| 3 | North spur | Warden cart and route post are reachable and break the inert run. `LA` | [003](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-003.png) |
| 4 | Central road | Deborah Carbo reads from the road and does not block its walkable spine. `LA` | [004](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-004.png) |
| 5 | West farm approach | New anchors preserve the farm branch and its approaches. `LA` | [005](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-005.png) |
| 6 | Southern field | The dry-stave barrel has a clear shoulder and legal use cell. `LA` | [006](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-006.png) |
| 7 | Northeast woods | The specialist cache is concealed and still has a reachable use cell. `LA` | [007](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-007.png) |
| 8 | Carter silhouette | Existing human art remains adult-scaled and legible on the road. `LIVE` | [008](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-008.png) |
| 9 | Carter idle scene | Carter, cart, player, and road props depth-sort without overlap errors. `LIVE` | [009](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-009.png) |
| 10 | Carter Speech gate | 39 fails, 40 succeeds, and the result is durable. `LA` | [010](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-010.png) |
| 11 | Carter Medicine gate | 44 fails, 45 succeeds, and the injury timeline persists. `LA` | [011](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-011.png) |
| 12 | Carter Guile gate | 54 fails, 55 succeeds, and the concealed knot lead persists. `LA` | [012](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-012.png) |
| 13 | Pump Engineering gate | Boundary is 39 fail and 40 success. `LA` | [013](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-013.png) |
| 14 | Farm-cart Search gate | Boundary is 44 fail and 45 success. `LA` | [014](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-014.png) |
| 15 | Carbo Medicine gate | The basic wound result does not reveal the Host Signs result. `LA` | [015](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-015.png) |
| 16 | Carbo Host Signs gate | Boundary is 59 fail and 60 success. `LA` | [016](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-016.png) |
| 17 | Tool-coffer Security gate | Boundary is 49 fail and 50 success. `LA` | [017](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-017.png) |
| 18 | Tool-coffer Body gate | Boundary is Body 6 fail and Body 7 success. `LA`, `PG` | [018](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-018.png) |
| 19 | Tool-coffer alternatives | Both routes set one shared open flag and expose one reward. `LA`, `RR` | [019](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-019.png) |
| 20 | Stripped-cart Search gate | Boundary is 39 fail and 40 success. `LA` | [020](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-020.png) |
| 21 | Stripped-cart Engineering gate | Boundary is 54 fail and 55 success. `LA` | [021](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-021.png) |
| 22 | Cart evidence continuity | Carter and Baruch consume the intended road findings. `LA`, `CC`, `RR` | [022](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-022.png) |
| 23 | Kill-site Medicine gate | Boundary is 44 fail and 45 success. `LA` | [023](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-023.png) |
| 24 | Kill-site Host Signs gate | Boundary is 59 fail and 60 success. `LA` | [024](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-024.png) |
| 25 | Wolf Doctrine gate | Boundary is 49 fail and 50 success. `LA` | [025](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-025.png) |

## Passes 26 to 50

| Pass | Review target | Accepted evidence | Capture |
| ---: | --- | --- | --- |
| 26 | Corpse variation | Cultist, wolf, and Carbo inspections report different physical histories. `LA` | [026](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-026.png) |
| 27 | Old-bell Engineering gate | Boundary is 44 fail and 45 success. `LA` | [027](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-027.png) |
| 28 | Old-bell Doctrine gate | Boundary is 49 fail and 50 success. `LA` | [028](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-028.png) |
| 29 | Bell-side Search gate | Boundary is 54 fail and 55 success. `LA` | [029](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-029.png) |
| 30 | Bell evidence continuity | Sabina accepts both the road peal evidence and the local bell evidence. `CC`, `RR` | [030](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-030.png) |
| 31 | Grave Medicine gate | Boundary is 44 fail and 45 success. `LA` | [031](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-031.png) |
| 32 | Grave Containment gate | Boundary is 59 fail and 60 success. `LA` | [032](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-032.png) |
| 33 | Grave Host Signs gate | Boundary is 64 fail and scar-legal 65 success. `LA`, `PG` | [033](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-033.png) |
| 34 | Existing grave reward | The original Search 40 path remains reachable and pays once. `LA` | [034](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-034.png) |
| 35 | Warden-cart Search gate | Boundary is 44 fail and 45 success. `LA` | [035](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-035.png) |
| 36 | Route-post Doctrine gate | Boundary is 44 fail and 45 success. `LA` | [036](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-036.png) |
| 37 | Barrel Search gate | Boundary is 39 fail and 40 success. `LA` | [037](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-037.png) |
| 38 | Forest-capstone Search gate | Boundary is 62 fail and creation-cap 63 success. `LA`, `PG` | [038](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-038.png) |
| 39 | Carbo stash visibility | The stash is hidden until Eleazar reveals it, then becomes usable. `LA` | [039](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-039.png) |
| 40 | Long Ash loot IDs | All item IDs, counts, container IDs, and stack uniqueness checks pass. `LA`, `RR` | [040](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-040.png) |
| 41 | Long Ash carry behavior | Partial looting leaves untaken stacks in the container. `FULL` | [041](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-041.png) |
| 42 | Full-pack search | A blocked transfer leaves the method and reward available for retry. `SS`, `DI`, `FULL` | [042](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-042.png) |
| 43 | Satchel open state | Closed and consumed branches differ in detached and live rendering. `CR`, `LIVE` | [043](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-043.png) |
| 44 | Crate open state | Rusted and sealed crate families expose distinct consumed mass. `CR`, `LIVE` | [044](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-044.png) |
| 45 | Barrel open state | Container barrels gain an empty rim and displaced lid without changing ladder barrels. `CR`, `LIVE` | [045](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-045.png) |
| 46 | Long Ash journal | Every planned success flag has a journal finding. `LA`, `RR` | [046](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-046.png) |
| 47 | Journal transition | Road findings survive entry to a connected child map. `LT`, `FULL` | [047](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-047.png) |
| 48 | Journal return | Child-map and road findings remain after return to the main road. `LT`, `FULL` | [048](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-048.png) |
| 49 | Long Ash live scene | One broad gate and one specialist gate complete in the live interaction UI. `LIVE` | [049](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-049.png) |
| 50 | Long Ash acceptance | Generation, collision, content, copy, state, and live review pass together. `LA`, `RR`, `CR`, `FULL`, `LIVE` | [050](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-050.png) |

## Passes 51 to 75

| Pass | Review target | Accepted evidence | Capture |
| ---: | --- | --- | --- |
| 51 | Camp generator baseline | Isolated generation byte-matches the recorded JSON hash. | [051](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-051.png) |
| 52 | Whole-camp route | Spawn reaches all 13 NPCs, every tent, and the east gate. `CC` | [052](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-052.png) |
| 53 | Writ-board Search gate | Boundary is 39 fail and 40 success. `CC` | [053](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-053.png) |
| 54 | Writ-board Guile gate | Boundary is 49 fail and 50 success. `CC` | [054](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-054.png) |
| 55 | Bell-mast Engineering gate | Boundary is 39 fail and 40 success. `CC` | [055](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-055.png) |
| 56 | Bell-mast Doctrine gate | Boundary is 44 fail and 45 success. `CC` | [056](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-056.png) |
| 57 | Bell cross-map branch | Sabina keeps local splice evidence distinct from the joined road peal. `CC`, `RR` | [057](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-057.png) |
| 58 | Cyprian Melee route | 39 fails, 40 succeeds, and records the close drill. `CC` | [058](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-058.png) |
| 59 | Cyprian Unarmed route | 39 fails, 40 succeeds, and records the same close drill. `CC` | [059](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-059.png) |
| 60 | Drill route exclusivity | Either close route sets one shared flag and hides both repeats. `CC` | [060](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-060.png) |
| 61 | Range Firearms gate | Boundary is 44 fail and 45 success. `CC` | [061](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-061.png) |
| 62 | Range Eye gate | Boundary is Eye 6 fail and Eye 7 success. `CC`, `PG` | [062](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-062.png) |
| 63 | Earned drill satchel | The satchel opens only after both drill flags and then consumes once. `CC`, `DI` | [063](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-063.png) |
| 64 | Quartermaster-table Search | Boundary is 44 fail and 45 success. `CC` | [064](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-064.png) |
| 65 | Ruth Command route | 49 fails and 50 authorizes the lawful issue. `CC` | [065](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-065.png) |
| 66 | Ruth Guile route | 59 fails and 60 authorizes the issue while recording fraud. `CC` | [066](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-066.png) |
| 67 | Issue route exclusivity | Exterior and interior issue crates share one claim and one reward. `CC`, `RR` | [067](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-067.png) |
| 68 | Joanna Medicine gate | Boundary is 44 fail and 45 success. `CC` | [068](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-068.png) |
| 69 | Joanna Host Signs gate | Boundary is 59 fail and 60 success. `CC` | [069](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-069.png) |
| 70 | Joanna road report | Either valid Long Ash medical finding changes Joanna's response once. `CC`, `RR` | [070](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-070.png) |
| 71 | Melchior Containment gate | Boundary is 49 fail and 50 success. `CC` | [071](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-071.png) |
| 72 | Melchior Host Signs gate | Boundary is 59 fail and 60 success. `CC` | [072](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-072.png) |
| 73 | Evidence Nerve gate | Boundary is Nerve 6 fail and Nerve 7 success. `CC`, `PG` | [073](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-073.png) |
| 74 | Evidence ownership | Active evidence grants flags and reports, never contraband inventory. `CC`, `RR` | [074](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-074.png) |
| 75 | Baruch road report | The stripped-cart sequence changes Baruch's response and pays two ducats once. `CC`, `RR` | [075](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-075.png) |

## Passes 76 to 100

| Pass | Review target | Accepted evidence | Capture |
| ---: | --- | --- | --- |
| 76 | Philip writ report | The cut-name finding opens Philip's clerk route and report flag. `CC` | [076](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-076.png) |
| 77 | Augustine Doctrine route | 44 fails and 45 grants the doctrine outcome. `CC` | [077](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-077.png) |
| 78 | Augustine Speech route | 44 fails and 45 grants the negotiated outcome. `CC` | [078](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-078.png) |
| 79 | Augustine Guile route | 54 fails and 55 grants the concealed outcome with its risk flag. `CC` | [079](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-079.png) |
| 80 | Augustine no-stat route | The full confession route grants the required chit without a field check. `CC` | [080](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-080.png) |
| 81 | Aquila Doctrine route | 44 fails and 45 authorizes the east road. `CC`, `CA` | [081](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-081.png) |
| 82 | Aquila Search route | 44 fails and 45 succeeds only with three matching observations. `CC`, `CA`, `RR` | [082](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-082.png) |
| 83 | Aquila Command route | 54 fails and 55 authorizes the operational ruling. `CC`, `CA` | [083](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-083.png) |
| 84 | Aquila report route | Three profession reports authorize travel. `CC`, `CA`, `RR`, `LIVE` | [084](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-084.png) |
| 85 | Plain field account | The no-stat account authorizes travel without Form C-17. `CC`, `CA` | [085](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-085.png) |
| 86 | Form C-17 perfection | A perfect form sets general clearance and unlocks only the superior bonus. `CC`, `CA`, `RR` | [086](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-086.png) |
| 87 | East-gate locked state | No route authorization means no onward travel choice. `CA`, `LIVE` | [087](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-087.png) |
| 88 | East-gate unlocked state | Any general authorization route exposes onward travel. `CA`, `LIVE` | [088](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-088.png) |
| 89 | Preceptor interior | Both file-crate checks are reachable; the doctrinal reading requires the physical order. `CC`, `RR` | [089](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-089.png) |
| 90 | Quartermaster interior | The lawful claim follows its authorization and the shared claim cannot duplicate. `CC`, `RR` | [090](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-090.png) |
| 91 | Supply interior | Search 45 and Guile 55 checks are reachable, persistent, and reported to Ruth. `CC`, `RR` | [091](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-091.png) |
| 92 | Medic interior | Medicine 45 and Host Signs 60 findings reach Joanna and Melchior once. `CC`, `RR` | [092](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-092.png) |
| 93 | Quarters interior | The exterior false-bottom clue gates the Search 45 coat cache; Cyprian closes the kit line once. `CC`, `RR` | [093](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-093.png) |
| 94 | Sutler interior | Search 40 tally and Guile 55 price findings each have one one-shot Judith consumer. `CC`, `RR` | [094](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-094.png) |
| 95 | Writ chapel interior | Doctrine 45 restores the clause and opens one one-shot Sabina response. `CC`, `RR` | [095](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-095.png) |
| 96 | Evidence interior | Augustine's chest remains Search 45, starts the watch, and carries chest evidence to Aquila. `CC`, `RR` | [096](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-096.png) |
| 97 | Camp container states | Real loot takes change the satchel, sealed crate, and barrel in scene. `CR`, `DI`, `LIVE` | [097](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-097.png) |
| 98 | Camp journal transition | Road and camp findings coexist after camp and tent travel. `LT`, `FULL`, `LIVE` | [098](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-098.png) |
| 99 | Live skill-to-travel route | Road discovery reaches Baruch, joins three reports at Aquila, and unlocks the east gate in one run. `CA`, `RR`, `LIVE` | [099](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-099.png) |
| 100 | Combined acceptance | Both packages pass generation, checks, live travel, art review, and writing review. `RR`, `CR`, `FULL`, `LIVE` | [100](../../../.ai/visual-audit/long-ash-censure-rpg-passes/pass-100.png) |

## Remaining risk

No acceptance blocker remains. The evidence set is intentionally local and
untracked, so it must stay beside this worktree if the review links are expected
to resolve. The generated main maps remain authoritative. Future edits to a
generator require regeneration, a new hash, and rerunning the focused tests.
