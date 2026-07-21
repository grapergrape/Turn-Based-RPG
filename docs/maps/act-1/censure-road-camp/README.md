# Censure Road Camp

Censure Road Camp is a 70 by 50 Act I exterior package with eight connected
tent interiors.

| Part | Reference |
| --- | --- |
| Runtime main level | `data/levels/censure_road_camp.json` |
| Generator | `scripts/gen-censure-road-camp.mjs` |
| Main planning image | [main/planning-map.png](./main/planning-map.png) |
| Child-map registry | [submaps/README.md](./submaps/README.md) |
| RPG content and 100-pass plan | [../road-rpg-content-plan.md](../road-rpg-content-plan.md) |
| Runtime review and evidence | [../road-rpg-runtime-review.md](../road-rpg-runtime-review.md) |
| Campaign index | [Act I map packages](../README.md) |

The generated JSON is authoritative for playable coordinates and collision.
The planning image remains the stable visual reference for the camp footprint.
Tent interiors are tracked as child maps even though their shared canvas shell
makes them smaller than the exterior.
