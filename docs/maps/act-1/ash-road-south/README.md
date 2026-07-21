# Ash Road South

Ash Road South is the Act I South Measure location package. Its 130 by 80
surface and all nine interior or underground helper maps are implemented as
generated runtime levels with reciprocal connectors.

| Part | Reference |
| --- | --- |
| Runtime main level | `data/levels/ash_road_south.json` |
| Surface generator | `scripts/gen-ash-road-south.mjs` |
| Helper-map generator | `scripts/gen-south-measure-submaps.mjs` |
| Main planning image | [main/planning-map.png](./main/planning-map.png) |
| Child-map registry and references | [submaps/README.md](./submaps/README.md) |
| Runtime and visual review | [submaps/runtime-review.md](./submaps/runtime-review.md) |
| Location design source | [Ash Road South](../../../story/locations/ash-road-south.md) |
| Campaign index | [Act I map packages](../README.md) |

The surface and helper maps form one 18,404-tile design package. The surface
accounts for 10,400 tiles. The nine implemented child maps account for 8,004
tiles. The main planning image covers only the surface. Each child has its own
planning reference, while generated JSON remains authoritative at runtime.

## Surface identity contract

Ash Road South is a settled civic water district, not an extension of the
Censure camp. Its first read must come from the old intake works, bonded
freight lanes, lime-ruled burial strip, compact clinic roofs, irregular Rope
Rows, receiving shelters, and the condenser court.

| Kit | Surface rule |
| --- | --- |
| Location-owned floors | `south-measure-slab`, `south-measure-yard`, `south-measure-row`, and `south-measure-grave-strip` carry the settlement. Relief channels remain visible engineered runs. |
| Location-owned edge | The retired `south-measure-berm-block` and Measure boundary fence replace the generic forest clearing silhouette. |
| Location-owned objects | Receiving shelters, contained hearths, sleeping pallets, water vessels, queue rails, repair racks, water lessons, the brass-hook memorial, settling vats, and the South Measure service pack belong to this surface kit. |
| Campaign continuity | Only `ash-road` and `road-shoulder` continue from another map. They occupy 537 of 10,400 cells, or 5.16 percent. |
| Forbidden borrowed kit | Censure tents, campfires, bedrolls, water pumps, barrels and crates; Ash Chapel chalk drawings; generic grave earth and crosses; Long Ash forest border models; generic oil, scorch, mud, paper, and rubble scatter. |

`tests/ashRoadSouthLevel.test.mjs` scans actual object placements and used
legend cells against every non-South-Measure level. The surface currently
shares no visual kind with those maps. It also locks district-specific prop
clusters, separate rowhouse footprints, the berm edge, and the campaign-road
floor budget. `npm run check` runs this identity guard so a generated map cannot
quietly revert to the borrowed camp kit.
