# South Measure Runtime Review

This review records the implementation audit for the nine Ash Road South helper
maps. The generated planning images remain composition references. Runtime
geometry, collision, interaction markers, and travel destinations are
authoritative in `data/levels/` and `data/dialogue/`.

## Acceptance result

- All nine maps load through the normal level and sprite pipelines.
- Fifteen connector pairs provide thirty reciprocal travel endpoints.
- Every gate has an intentional wall plane or hatch orientation, a walkable use
  cell, a walkable destination, and at least two clear cardinal neighbours.
- From every inbound arrival, cardinal movement reaches every interaction on
  that helper map.
- The Censure Road Camp gate does not offer travel until
  `censure-road-voss-report-perfect` is set. Travel then enters the south end of
  Ash Road South facing into the settlement.
- The Old Pilgrim Way chain remains an inspection only. It cannot advance the
  campaign.
- Interior walls, floors, doors, pipes, railings, furniture, and machinery use
  the shared South Measure palette and hard-pixel rendering rules.
- The journal map reads the same runtime levels and interaction markers. There
  are no separate minimap images to update.

The contract is enforced by `tests/ashRoadSouthLevel.test.mjs`,
`tests/southMeasureHelperMaps.test.mjs`,
`tests/southMeasureInteriorArt.test.mjs`, and
`tests/levelTransitions.test.mjs`.

## One hundred visual passes

The evidence set is
`.ai/visual-audit/ash-road-south-submaps/passes/pass-001.png` through
`pass-100.png`. Five contact sheets in the parent evidence folder provide a
whole-set review. Passes 97 through 100 use the live game rather than the
detached map capture.

| Pass | Review target | Result |
|---:|---|---|
| 1 | Masonry wall module | Floor edge, wall base, cap, and contact shadow align. |
| 2 | Canvas wall module | Pale wall panels remain on the wall plane with no floor drift. |
| 3 | Timber and clinic wall comparison | Material families share scale and upper-left lighting. |
| 4 | South Measure door, first wall plane | Frame, leaf, threshold, and shadow register to the wall. |
| 5 | South Measure door, reciprocal wall plane | The alternate plane has no horizontal offset. |
| 6 | Door material variants | Clinic, civic, freight, and domestic variants preserve one footprint. |
| 7 | Service hatch orientations | All hatch variants stay inside their tile and retain a contact shadow. |
| 8 | Service pipe run, first axis | Pipe segments connect without gaps or floating highlights. |
| 9 | Service pipe run, reciprocal axis | The second axis joins at the same pixel endpoints. |
| 10 | Utility railing orientations | Rails follow the tile plane and do not read as screen-horizontal bars. |
| 11 | Shared interior prop set | Tables, storage, cages, machines, beds, and partitions retain human scale. |
| 12 | Intake Clerk wicket | Counter opening, screen, and wall mounting read as one fixture. |
| 13 | Intake undercroft, full map | Major rooms, corridors, and the central service spine are legible. |
| 14 | Intake undercroft, civil stair end | Arrival, stair gate, and first junction remain open and readable. |
| 15 | Intake undercroft, admission rooms | Booth walls and furniture leave a continuous cardinal route. |
| 16 | Intake undercroft, records wing | Records rooms separate from the pump route without a dead end. |
| 17 | Intake undercroft, pump court | Machinery occupies the court without blocking circulation. |
| 18 | Intake undercroft, sealed room | The sealed chamber reads as contained space, not an accidental exit. |
| 19 | Intake undercroft, Clerk chamber | Wicket, work area, and corridor depth sort cleanly. |
| 20 | Intake undercroft, signal wall | Signal-side fixtures remain attached to the correct wall plane. |
| 21 | Intake undercroft, southern passage | Return gate and passage floor meet without a texture jump. |
| 22 | Intake undercroft, door close-up | Doors align to both masonry wall directions. |
| 23 | Intake undercroft, floor dressing | Props add use history without obscuring walkable cells. |
| 24 | Intake undercroft acceptance | Full composition, plot anchors, and connector routes pass. |
| 25 | Relief drain, full map | Engineered drain shape and blue relief channel read immediately. |
| 26 | Relief drain, channel junctions | A one-axis crossing was found. Dedicated junction tiles were added and recaptured. |
| 27 | Relief drain, west channel | Channel, masonry edge, and service props remain aligned. |
| 28 | Relief drain, culvert end | Culvert arrival has a clear approach and an outward-facing return. |
| 29 | Relief drain, repair-trench end | Stair arrival and first turn retain two-cell clearance. |
| 30 | Relief drain, annex-hatch end | The side entry joins the service route without a blocked landing. |
| 31 | Relief drain, branch crossings | Both corrected crossings draw continuous channels in both axes. |
| 32 | Relief drain, pipe dressing | Wall pipes follow their planes and do not float across floors. |
| 33 | Relief drain, waiting alcove | The old alcove reads as a room and remains an intentional non-exit. |
| 34 | Relief drain acceptance | Three surface routes and the undercroft route connect through one traversable system. |
| 35 | Maintenance annex, full map | Workshop, service rooms, and damaged rear bay form one coherent plan. |
| 36 | Maintenance annex, main entry | Door plane and inward arrival orientation agree. |
| 37 | Maintenance annex, drain hatch | Hatch landing and route to the main floor remain clear. |
| 38 | Maintenance annex, wall joins | Masonry corners and doors show no horizontal misregistration. |
| 39 | Maintenance annex, workshop | Machines and worktables create use history without sealing aisles. |
| 40 | Maintenance annex, damaged bay | Damage reads as abandonment, while the bay remains an intentional non-exit. |
| 41 | Maintenance annex, storage | Cages and storage units have grounded shadows and clear approaches. |
| 42 | Maintenance annex, utilities | Pipes and railings connect cleanly through the industrial rooms. |
| 43 | Maintenance annex, circulation | Every inspectable is reachable from both inbound routes. |
| 44 | Maintenance annex acceptance | Plot placement, connector logic, and material continuity pass. |
| 45 | Morrow freight house, full map | Loading, accounting, storage, and sleeping areas remain distinct. |
| 46 | Freight house, main door | Public freight entry faces its yard approach and lands inward. |
| 47 | Freight house, rear door | Rear entry faces the back lane and lands inward from that wall. |
| 48 | Freight house, weighing area | Scale and work floor retain a broad traversable lane. |
| 49 | Freight house, cages | Freight cages read as storage, not wall fragments. |
| 50 | Freight house, office | Desk and records placement preserve the approach to plot anchors. |
| 51 | Freight house, guard bunk | Bed and storage remain human-scaled and grounded. |
| 52 | Freight house, wall texture | Timber courses stay on wall faces without screen-horizontal drift. |
| 53 | Freight house, depth stack | Doors, tables, cages, and walls sort without visible leaks. |
| 54 | Freight house acceptance | Both entrances and all interior interactions share one connected route. |
| 55 | Compact clinic, full map | Intake, ward, isolation room, and stores form a readable clinic. |
| 56 | Compact clinic, main door | The surface door is embedded in the clinic frontage and lands inward. |
| 57 | Compact clinic, six-bed ward | Six beds have distinct footprints and leave a usable central aisle. |
| 58 | Compact clinic, isolation room | The isolation bed is spatially separate and remains reachable. |
| 59 | Compact clinic, intake wicket | Wicket, queue side, and staff side retain their intended relationship. |
| 60 | Compact clinic, partitions | Cloth screens add privacy without becoming collision walls. |
| 61 | Compact clinic, stores | Cabinets and work surfaces remain approachable. |
| 62 | Compact clinic, wall planes | Bright canvas walls expose no roof, wall, or door offset. |
| 63 | Compact clinic, circulation | All clinical anchors are reachable from the entry arrival. |
| 64 | Compact clinic acceptance | Bed count, isolation layout, frontage, and route pass. |
| 65 | Measure Hall, full map | Assembly floor, civic rooms, and ladder route read as one public hall. |
| 66 | Measure Hall, main door | Door faces the public lane and lands toward the assembly floor. |
| 67 | Measure Hall, assembly floor | Furniture leaves a broad civic circulation path. |
| 68 | Measure Hall, records side | Boards and worktables sit on their intended walls and floor zones. |
| 69 | Measure Hall, council side | Civic props keep grounded scale and clear use cells. |
| 70 | Measure Hall, ladder | Ladder is legible as an interior anchor and not an untracked exit. |
| 71 | Measure Hall, wall texture | Pale walls and timber floor retain clean plane separation. |
| 72 | Measure Hall, corner joins | Connected wall corners show no seam or repeated inner edge. |
| 73 | Measure Hall, circulation | Every inspectable is reachable from the main-door arrival. |
| 74 | Measure Hall acceptance | Civic hierarchy, plot anchors, and entrance logic pass. |
| 75 | Faber house, full map | Two-bed household plan reads as a compact occupied home. |
| 76 | Faber house, entrance | Side-wall door faces the lane and lands into the home. |
| 77 | Faber house, sleeping space | Two beds retain human scale and accessible floor around them. |
| 78 | Faber house, work area | Table and domestic storage leave a continuous route. |
| 79 | Faber house, wall fixtures | Board and fixtures remain attached to the correct wall planes. |
| 80 | Faber house, material alignment | Domestic timber walls and floors show no horizontal slip. |
| 81 | Faber house, circulation | All inspectables are reachable from the only arrival. |
| 82 | Faber house acceptance | Domestic scale, entrance orientation, and plot placement pass. |
| 83 | Hidden Rows, full map | Concealed household and growing spaces remain distinct but connected. |
| 84 | Hidden Rows, drying-frame entry | Back-route door faces its surface approach and lands inward. |
| 85 | Hidden Rows, grave passage | Grave-side entry arrives from the reciprocal direction with clearance. |
| 86 | Hidden Rows, growing beds | Farm beds read as interior cultivation and leave working aisles. |
| 87 | Hidden Rows, sleeping space | Beds and domestic props retain the shared grounded scale. |
| 88 | Hidden Rows, storage | Stores support the concealed settlement without filling circulation. |
| 89 | Hidden Rows, reciprocal routes | Every interaction is reachable from both entrances. |
| 90 | Hidden Rows acceptance | Concealment, household use, plot anchors, and two-way travel pass. |
| 91 | Charity cellar, full map | Aid stores, work area, and old masonry form one compact cellar. |
| 92 | Charity cellar, trapdoor | Surface hatch and cellar arrival preserve reciprocal orientation. |
| 93 | Charity cellar, aid stores | Storage clusters leave an open route to every inspectable. |
| 94 | Charity cellar, work area | Furniture remains grounded and correctly depth sorted. |
| 95 | Charity cellar, collapsed grate | The grate reads as old infrastructure and remains an intentional non-exit. |
| 96 | Charity cellar acceptance | Cellar route, plot placement, and material alignment pass. |
| 97 | Live Censure Road gate | The Hallowfen gate is visible, usable, and progression locked. |
| 98 | Live Ash Road South chain | Unlocked travel arrives at the south chain facing into South Measure. |
| 99 | Live intake undercroft arrival | Civil-stair travel lands on a clear tile facing away from the exit wall. |
| 100 | Live relief drain arrival | Culvert travel lands beside the aligned channel with a clear return route. |

## Gate-frontage audit

The separate evidence set
`.ai/visual-audit/ash-road-south-submaps/gates/01-censure-hallowfen.png`
through `15-charity.png` checks each surface or prior-map approach at district
scale. It found one loose frame in the clinic queue yard. The runtime surface
was corrected by adding the clinic intake wing and placing a
`south-measure-door` directly in its south-west frontage at `(98, 33)`, with
the walkable use cell at `(98, 34)`. The recaptured gate set shows all public
doors in their frontages and all rear, grave, culvert, and hatch routes in
their intended service contexts.

The relief-channel issue and clinic-frontage issue are preserved in
`.ai/visual-audit/ash-road-south-submaps/findings/` as before-state evidence.

A final semantic travel audit also caught four facing-only errors that static
gate images could not show. Returns through the collapsed culvert, repair
trench, annex service hatch, and annex floor hatch now face away from the gate
cell and into the destination route. Both the generator and contract test
derive this rule from gate-to-arrival geometry, so an exact but backward-facing
value can no longer pass validation.

## Current-source two hundred-pass visual acceptance (2026-07-19)

This section supersedes the one hundred visual passes above as current-source
visual-identity evidence. The earlier review remains implementation and
connector history.

The certifying evidence is stored in
`.ai/visual-audit/ash-road-south-200-passes/`. Each of the nine helper maps has
exactly 200 current-source captures, for 1,800 screenshots total. The three
modes contribute 1,260 `detached-crop`, 360 `native-runtime-focus`, and 180
`broad-composition` records, or 140, 40, and 20 per map. The set also contains
90 twenty-image contact sheets.

`report.json` is certifying and records `complete-and-validated`. It proves
1,800 unique view definitions, 1,800 unique exact PNG SHA-256 hashes, and 1,800
unique screenshot paths. The manifest records the source hash for every level,
and the capture rejects a source change during the run.

Manual review judged the rendered art rather than relying on labels. All 180
criteria pass, with 20 criteria per map and ten evidence records per criterion.
The accepted identities are:

| Map | Accepted visual identity |
|---|---|
| Intake undercroft | Defended civic intake, sealed records mass, examination bay, and a mechanically dominant pump side |
| Relief drain | Long depressed polluted channel, raised service walk, valve station, repair branches, and collapsed culvert |
| Relief maintenance annex | Loading and claims edge, dense machine floor, secured parts cage, cooling assembly, and burned rear bay |
| Morrow freight house | Public freight counter, dominant weighbridge, dispatch route table, continuous ledger cage, bonded store, and rear loading path |
| Compact clinic | Pale canvas triage, orderly six-bed ward, screened applicant lane, cold service machinery, and separate isolation room |
| Measure Hall | Open civic assembly floor, repeated slate school desks, commanding council table, working kitchen, public records, and rear loft |
| Varo house | Cramped occupied repair household where pump work, family meals, sleeping curtains, school tools, and ready kit share one small shell |
| Hidden Rows | Laundry-screened entrance, three distinct households, concealed water branch, communal cooking and meeting spaces, treatment pocket, and compressed grave passage |
| Charity cellar | Tightly stocked medicine reserve, controlled suspect stores, large evidence bench, screened patient cot, and damaged collapsed-grate edge |

`node .ai/map-review/validate-south-measure-manual-review.mjs` validates all
nine maps, 180 PASS criteria, and all 1,800 screenshot records. `npm run check`
and the full `npm test` suite pass on the audited source.
