# South Measure Faber House

- **Status:** Runtime implemented
- **Size:** `22x16`
- **Runtime:** `data/levels/south_measure_varo_house.json`
- **Generator:** `scripts/gen-south-measure-submaps.mjs`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

This image shows the family home before Noa's placement decision. Runtime JSON
remains authoritative for exact cells, collision, transitions, and
minimaps.

## Layout contract

- **Connections:** The surface door is `(114, 48)`, plane `se`, used from
  `(113, 48)`, and arrives at `(2, 10)` facing `se`. The house door is
  `(0, 10)`, plane `se`, used from `(1, 10)`, and returns to `(113, 48)`
  facing `nw`.
- **Required anchors:** Pump bench and diagram wall beside the entrance,
  father's cup-repair table, family meal table, two sleeping partitions, and a
  rear shelf holding harmless scraps and Noa's tools.
- **Exclude:** A hidden pump solution, secret cure, loot cache, oversized
  workshop, wealthy furnishings, or additional door.

## State boundary

**Shown:** A tight working family home with Noa's tools still in place.

**Not shown:** Noa leaving for school, packed tools, altered sleeping space, or
post-decision family absence.

## Generation record

Accepted prompt contract:

```text
Create a roofless 22x16 Faber House in the established sepia ink planning-map
style. Use one surface door, with Noa's pump bench and diagram wall beside it,
a shared common room with cup-repair and family meal tables, two sleeping
partitions, and a rear shelf of harmless scraps and school tools. Label every
area and end the border at 22x16. Keep the home cramped and ordinary. No hidden
part, loot cache, oversized workshop, rich furnishings, extra exit, or
watermark.
```
