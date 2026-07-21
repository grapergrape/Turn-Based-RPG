# Ash Road South Submaps

All nine South Measure helper maps are implemented as generated runtime levels.
Each child folder keeps the accepted `planning-map.png` as a visual and topology
reference. Runtime coordinates, collision, transitions, markers, and arrival
facing come from the generated JSON and its tests.

## Runtime sources

- Main surface generator: `scripts/gen-ash-road-south.mjs`
- Helper-map generator: `scripts/gen-south-measure-submaps.mjs`
- Shared authored copy: `scripts/content/south-measure-submap-content.mjs`
- Population and barks: `scripts/content/south-measure-population.mjs`
- Character and evidence dialogue: `scripts/content/south-measure-dialogues.mjs`
- Population generator: `scripts/gen-south-measure-population.mjs`
- Generated levels: `data/levels/south_measure_*.json`
- Generated connector dialogue: `data/dialogue/south-measure-*.json`
- Contract test: `tests/southMeasureHelperMaps.test.mjs`
- Population contract: `tests/southMeasurePopulation.test.mjs`
- Runtime and 100-pass review: [runtime-review.md](./runtime-review.md)

Run the surface generator before the helper-map generator when rebuilding the
whole package. The helper generator checks all destination arrivals against the
current generated levels. Run the population generator before the helper-map
generator so every placed actor, enemy, and dialogue record is present.

The nine maps hold 71 logical character placements and 41 character
conversations. Junia Lector is a fixed wicket-bound character rather than a walking
spawn. Revealed Salome Naso shares one logical placement with her normal actor and
appears only after `neri-agent-exposed`.

| Level ID | Runtime file | Size | Exact surface gate and use cell | Purpose | Reference | Status |
| --- | --- | ---: | --- | --- | --- | --- |
| `south-measure-intake-undercroft` | `data/levels/south_measure_intake_undercroft.json` | 58x42 | Civil stair `(64, 36)`, use `(64, 37)` | Main dungeon, original records, isolation manifold, Intake Clerk, and Hallowfen-facing signal | [Map and notes](./south-measure-intake-undercroft/README.md) | Implemented |
| `south-measure-relief-drain` | `data/levels/south_measure_relief_drain.json` | 44x20 | Culvert `(120, 73)`, use `(119, 73)`; repair trench `(31, 54)`, use `(31, 55)`; service hatch `(20, 24)`, use `(20, 25)` | Buried service route joining the surface approaches, annex, and undercroft | [Map and notes](./south-measure-relief-drain/README.md) | Implemented |
| `south-measure-relief-maintenance-annex` | `data/levels/south_measure_relief_maintenance_annex.json` | 40x26 | Main door `(18, 26)`, use `(18, 27)` | Partly abandoned industrial repair hall, bypass records, and a cooling jacket | [Map and notes](./south-measure-relief-maintenance-annex/README.md) | Implemented |
| `south-measure-morrow-freight-house` | `data/levels/south_measure_morrow_freight_house.json` | 36x22 | Main door `(31, 48)`, use `(30, 48)`; rear door `(37, 49)`, use `(37, 50)` | Cartel office, contract archive, guard bunks, bonded stores, and route room | [Map and notes](./south-measure-morrow-freight-house/README.md) | Implemented |
| `south-measure-compact-clinic` | `data/levels/south_measure_compact_clinic.json` | 36x24 | Clinic door `(98, 33)`, use `(98, 34)` | Field hospital, applicant processing, medical archive, isolation room, and flow monitor | [Map and notes](./south-measure-compact-clinic/README.md) | Implemented |
| `south-measure-measure-hall` | `data/levels/south_measure_measure_hall.json` | 34x22 | Hall door `(94, 51)`, use `(94, 52)` | Council room, slate school, communal kitchen, public records, and Last Canvas storage | [Map and notes](./south-measure-measure-hall/README.md) | Implemented |
| `south-measure-varo-house` | `data/levels/south_measure_varo_house.json` | 22x16 | House door `(114, 48)`, use `(113, 48)` | Noa's family home and pump workshop | [Map and notes](./south-measure-varo-house/README.md) | Implemented |
| `south-measure-hidden-rows` | `data/levels/south_measure_hidden_rows.json` | 30x18 | Drying frame `(124, 58)`, use `(125, 58)`; grave passage `(112, 16)`, same-cell use | Concealed homes, private water branch, treatment room, and grave-strip exit | [Map and notes](./south-measure-hidden-rows/README.md) | Implemented |
| `south-measure-charity-cellar` | `data/levels/south_measure_charity_cellar.json` | 22x16 | Cot trapdoor `(96, 72)`, same-cell use | Reserve supplies, suspect medicine, and evidence of the Choir courier route | [Map and notes](./south-measure-charity-cellar/README.md) | Implemented |

The relief drain deliberately has three surface entrances because it is a
connecting service route, not three separate dungeons. South Measure has no
natural cave submap. Its underground spaces are engineered intake, drainage,
and service structures.

## Reciprocal connector contract

`plane` is the wall plane used by a wall-mounted door. `orient` is the facing
used by a free-standing hatch. Every listed use cell and destination arrival is
walkable and belongs to the same connected traversal component as the other
entrances on that map.

| Connection | First endpoint to arrival | Reciprocal endpoint to arrival |
| --- | --- | --- |
| Civil stair | Surface hatch `(64, 36)`, use `(64, 37)`, orient `se` to undercroft `(29, 39)`, facing `ne` | Undercroft door `(29, 41)`, use `(29, 40)`, plane `sw` to surface `(64, 37)`, facing `sw` |
| Collapsed culvert | Surface culvert `(120, 73)`, use `(119, 73)`, east mouth to drain `(41, 15)`, facing `nw` | Drain door `(43, 15)`, use `(42, 15)`, plane `se` to surface `(119, 73)`, facing `nw` |
| Morrow repair trench | Surface hatch `(31, 54)`, use `(31, 55)`, orient `sw` to drain `(20, 2)`, facing `sw` | Drain door `(20, 0)`, use `(20, 1)`, plane `sw` to surface `(31, 55)`, facing `sw` |
| Annex service hatch | Surface hatch `(20, 24)`, use `(20, 25)`, orient `sw` to drain `(2, 16)`, facing `se` | Drain door `(0, 16)`, use `(1, 16)`, plane `se` to surface `(20, 25)`, facing `sw` |
| Annex main door | Surface door `(18, 26)`, use `(18, 27)`, plane `sw` to annex `(19, 23)`, facing `ne` | Annex door `(19, 25)`, use `(19, 24)`, plane `sw` to surface `(18, 27)`, facing `sw` |
| Freight main door | Surface door `(31, 48)`, use `(30, 48)`, plane `se` to freight house `(2, 13)`, facing `se` | Freight door `(0, 13)`, use `(1, 13)`, plane `se` to surface `(30, 48)`, facing `nw` |
| Freight rear door | Surface door `(37, 49)`, use `(37, 50)`, plane `sw` to freight house `(29, 19)`, facing `ne` | Freight door `(29, 21)`, use `(29, 20)`, plane `sw` to surface `(37, 50)`, facing `sw` |
| Clinic main door | Surface door `(98, 33)`, use `(98, 34)`, plane `sw` to clinic `(18, 21)`, facing `ne` | Clinic door `(18, 23)`, use `(18, 22)`, plane `sw` to surface `(98, 34)`, facing `sw` |
| Measure Hall door | Surface door `(94, 51)`, use `(94, 52)`, plane `sw` to hall `(17, 19)`, facing `ne` | Hall door `(17, 21)`, use `(17, 20)`, plane `sw` to surface `(94, 52)`, facing `sw` |
| Faber house door | Surface door `(114, 48)`, use `(113, 48)`, plane `se` to house `(2, 10)`, facing `se` | House door `(0, 10)`, use `(1, 10)`, plane `se` to surface `(113, 48)`, facing `nw` |
| Hidden Rows drying frame | Surface door `(123, 58)`, use `(122, 58)`, plane `se` to rows `(2, 6)`, facing `se` | Rows door `(0, 6)`, use `(1, 6)`, plane `se` to surface `(122, 58)`, facing `nw` |
| Hidden Rows grave passage | Surface hatch `(112, 16)`, same-cell use, orient `sw` to rows `(24, 2)`, facing `sw` | Rows door `(24, 0)`, use `(24, 1)`, plane `sw` to surface `(112, 16)`, facing `ne` |
| Charity trapdoor | Surface hatch `(96, 72)`, same-cell use, orient `se` to cellar `(19, 13)`, facing `nw` | Cellar door `(21, 13)`, use `(20, 13)`, plane `se` to surface `(96, 72)`, facing `se` |
| Drain to undercroft valve | Drain door `(12, 0)`, use `(12, 1)`, plane `sw` to undercroft `(55, 15)`, facing `nw` | Undercroft door `(57, 15)`, use `(56, 15)`, plane `se` to drain `(12, 2)`, facing `sw` |
| Annex to drain floor hatch | Annex hatch `(3, 19)`, use `(4, 19)`, orient `se` to drain `(4, 13)`, facing `sw` | Drain hatch `(4, 12)`, use `(4, 13)`, orient `se` to annex `(4, 19)`, facing `se` |

The door planes follow the wall runs they replace. South-boundary doors use
plane `sw`, west or east boundary doors use plane `se`, and return facings turn
the player back into the space they just entered instead of toward the wall.

## Campaign entry and journal maps

South Measure cannot be entered from Censure Road Camp until the run has the
`censure-road-voss-report-perfect` flag. The Hallowfen checkpoint interaction
at camp gate `(67, 16)` then places the player at surface `(65, 77)`, facing
`ne`. The South Chain return places the player at camp `(66, 16)`, facing `nw`.
The direct developer-start alias remains available for review, but it does not
remove the campaign gate.

There are no separate minimap image files or per-level minimap links to update.
The journal map is derived from each live level grid, collision state, explored
cells, and `mapMarker` data. Connector objects set `interactionMarker` to their
reachable use cell, so wall-mounted exits appear at the approach instead of
inside the blocking wall. Hidden entrances use explored-only markers.

The planning images preserve room topology and implementation intent. They are
not cell-perfect blueprints and are never loaded by the runtime or journal map.
