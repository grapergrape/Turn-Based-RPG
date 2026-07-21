# Old Pilgrim Way

Old Pilgrim Way is the implemented Act I road north of South Measure. Its 120 by 70
surface stays broad and quiet, with the main road continuing toward the
Quarantine Farms and a neglected branch climbing to the Hill Church.

| Part | Reference |
| --- | --- |
| Runtime main level | `data/levels/old_pilgrim_way.json` |
| Generator | `scripts/gen-old-pilgrim-way.mjs` |
| Authored content | `scripts/content/old-pilgrim-way-content.mjs` |
| Main planning image | [main/planning-map.png](./main/planning-map.png) |
| Child-map registry | [submaps/README.md](./submaps/README.md) |
| Twenty-pass review | [twenty-pass-review.md](./twenty-pass-review.md) |
| Campaign index | [Act I map packages](../README.md) |

The planning image fixes the route, major landmarks, and relative scale. The
generator and runtime JSON are authoritative for collision, objects, and exact
connector coordinates.

## Package scope

The surface accounts for 8,400 tiles. Five child maps account for a further
9,304 tiles, giving the complete implemented location 17,704 authored tiles.

| Map | Size | Tiles |
| --- | ---: | ---: |
| Old Pilgrim Way surface | 120x70 | 8,400 |
| Hill Church | 44x32 | 1,408 |
| Closure Stair | 32x48 | 1,536 |
| Novitiate Quarters | 48x34 | 1,632 |
| Trial Galleries | 64x48 | 3,072 |
| Sealed Chapter | 46x36 | 1,656 |

## Layout contract

- The South Measure arrival sits at the middle of the south edge. The road
  remains the clearest northbound line and leaves for the Quarantine Farms at
  the middle of the north edge.
- Dead fields, procession stones, the old farm gate, a roadside shelter, and a
  small pilgrim camp break up the journey without turning it into another
  settlement.
- The Hill Church occupies the northeast height. Its branch should be visible
  from the road but remain optional.
- Ordinary salvage can be found in the church and hospice ruins. The buried
  complex is the location's main discovery and reward path.
- Sister Thecla, Father Noah, Tobias Faber, and the relevant South Measure outcome
  actor occupy the surface. Cassian and Noa also carry forward when their prior
  outcomes place them on the road. Camp furniture changes with Compact,
  Morrow, resident, or sealed control.
- Five dormant Stage IV forms wait in the east furrows. They belong to three
  related procession roles with different movement and attack profiles.
  Reading the signs can grant an opening shot. Treating Tobias reveals how to
  release the cart and start from a flank. A direct approach remains available.
- Victory leaves the five transformed remains in place, exposes the missing
  travelers and their salvage, and gives Sister Thecla a precise report state.

## Buried-site premise

The church and its buried novitiate were built by the Solar Ecclesiate before
the Descent. When regional contamination alarms reached the site, the buried
complex closed its pressure doors automatically. Priests, nuns, novices, and
pilgrims were trapped below. The emergency water system failed before the seal
released, and the people inside died from dehydration and starvation.

The seal worked. The buried rooms contain no Host growth and no transformed
dead. Their condition should read through empty water stores, failed pumps,
scraped food vessels, breach attempts, final tallies, and long-dead bodies found
where people waited or worked.

The entrance beneath the raised apse is not exposed by ordinary interaction.
The player must combine any two independent findings from the closure desk,
foundation seam, bell conduit, Father Noah, and Brother Cassian. Doctrine and
Search can interpret the plan. Engineering or Security releases the buried
door after the case has been proved.

Three quests cross the package. `road-through-the-fields` resolves the surface
threat. `the-buried-novitiate` controls discovery, trial progress, the armory,
and the return lift. `names-below-the-hill` follows four separate records and
ends with a choice to build a public memorial, make a northbound road-book
copy, or return the rolls to the sealed chapter. Each disposition changes the
church on later visits.

## Generation record

- **Generation:** Built-in `$imagegen`
- **Accepted reference:** [main/planning-map.png](./main/planning-map.png)

Accepted prompt contract:

```text
Create a top-down 120x70 Old Pilgrim Way planning map in the established sepia
ink style. Run a long road from South Measure on the south edge to Quarantine
Farms on the north edge. Keep the landscape sparse, with dead fields, a small
pilgrim camp, procession stones, a road-priest shelter, old hospice ruins, and
an optional branch climbing to a Hill Church and bell yard. Use a black numbered
coordinate border and exact black label plaques. No combat encounter, Host
growth, city, modern road, fantasy ruins, color, or watermark.
```
