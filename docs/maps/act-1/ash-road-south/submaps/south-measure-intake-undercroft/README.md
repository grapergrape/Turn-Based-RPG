# South Measure Intake Undercroft

- **Status:** Runtime implemented
- **Size:** `58x42`
- **Runtime:** `data/levels/south_measure_intake_undercroft.json`
- **Generator:** `scripts/gen-south-measure-submaps.mjs`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

This image shows the arrival state before the South Measure resolution. It is
an art and topology reference. Runtime JSON remains authoritative for exact
cells, collision, transitions, and minimaps.

## Layout contract

- **Connections:** The surface civil stair at `(64, 36)`, used from `(64, 37)`,
  arrives at `(29, 39)` facing `ne`. The return door is at `(29, 41)`, plane
  `sw`, used from `(29, 40)`, and returns to surface `(64, 37)` facing `sw`.
  The drain valve door is at `(57, 15)`, plane `se`, used from `(56, 15)`, and
  arrives in the drain at `(12, 2)` facing `sw`. The reciprocal drain door
  arrives here at `(55, 15)` facing `nw`. The locked return passage between the
  vault and pump sides is internal circulation, not another map exit.
- **Required anchors:** South-center records landing, southwest examination
  room, northwest records vault, north-center triage wicket, center-east pump
  chamber, east maintenance channel, original roll, isolation manifold, pipe
  vein, and the human-sized Intake Clerk fused through the wicket.
- **Exclude:** Profitable monster loot, generic mutant anatomy, a clean machine
  hybrid, natural caves, or additional exits. The lime-lined records chest is
  an archive fixture, not a treasure chest.

## State boundary

**Shown:** The Clerk remains fixed in the sealed wicket. The original roll and
isolation manifold remain in place, with no custody decision made.

**Not shown:** Containment, extraction, controlled killing, Cassian's seal,
damaged or removed records, a committed water plan, later faction custody, or a
barred admission stair.

## Generation record

Accepted prompt contract:

```text
Create a roofless 58x42 Intake Undercroft planning map in the Ash Road South
sepia ink style. Keep the civil stair south, drain entry east, records landing
south-center, examination room southwest, records vault northwest, triage
wicket north-center, pump chamber center-east, maintenance channel east, and a
return passage between vault and pump sides. Label every room and transition.
Show intake rails, hooks, lime handprints, screens, archive records, isolation
manifold, controls, pipe vein, and the human-sized fused Clerk. Use a 0..58 by 0..42
coordinate border. No extra rooms, exits, cache, generic monster, or watermark.
```
