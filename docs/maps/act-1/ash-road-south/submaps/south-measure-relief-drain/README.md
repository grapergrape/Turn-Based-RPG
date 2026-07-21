# South Measure Relief Drain

- **Status:** Runtime implemented
- **Size:** `44x20`
- **Runtime:** `data/levels/south_measure_relief_drain.json`
- **Generator:** `scripts/gen-south-measure-submaps.mjs`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

This image shows the arrival-state utility route. Runtime JSON remains
authoritative for exact cells, collision, transitions, and minimaps.

## Layout contract

- **Connections:** The surface culvert `(120, 73)`, used from `(119, 73)`,
  arrives at `(41, 15)` facing `nw`; its drain door is `(43, 15)`, plane `se`,
  used from `(42, 15)`, and returns to `(119, 73)` facing `nw`. The surface
  repair hatch `(31, 54)`, used from
  `(31, 55)`, arrives at `(20, 2)` facing `sw`; its drain door is `(20, 0)`,
  plane `sw`, used from `(20, 1)`, and returns to `(31, 55)` facing `sw`. The
  surface annex hatch `(20, 24)`, used
  from `(20, 25)`, arrives at `(2, 16)` facing `se`; its drain door is
  `(0, 16)`, plane `se`, used from `(1, 16)`, and returns to `(20, 25)` facing
  `sw`. The undercroft valve door is
  `(12, 0)`, plane `sw`, used from `(12, 1)`, and arrives at undercroft
  `(55, 15)` facing `nw`; the undercroft return arrives at `(12, 2)` facing
  `sw`. The annex floor hatch is `(4, 12)`, orient `se`, used from `(4, 13)`,
  and arrives in the annex at `(4, 19)` facing `se`; the annex return arrives
  at `(4, 13)` facing `sw`.
- **Required anchors:** Raised north walk, shallow polluted lower channel,
  broken filter baskets, jammed isolation wheel, resident waiting alcove, and
  children's crawl marks.
- **Exclude:** A hidden colony, boss, treasure room, natural cave dressing, or
  an exit from the resident alcove.

## State boundary

**Shown:** Low utility flow, a jammed valve, and uncontrolled service
connections.

**Not shown:** Barred branches, repaired isolation wheel, faction checkpoint,
later Chain patrol, or a council-controlled work route.

## Generation record

Accepted prompt contract:

```text
Create a wide roofless 44x20 Relief Drain planning map in the established
sepia ink style. Connect the east collapsed culvert, central Morrow trench,
west annex hatch, and north undercroft valve chamber through a lower channel
and raised north walk. Include the waiting alcove, silt, polluted flow, broken
baskets, pipes, jammed wheel, and crawl marks. Label every connection and use
an exact 0..44 by 0..20 border. No colony, boss, treasure room, extra exit,
cave styling, or watermark.
```
