# South Measure Hidden Rows

- **Status:** Runtime implemented
- **Size:** `30x18`
- **Runtime:** `data/levels/south_measure_hidden_rows.json`
- **Generator:** `scripts/gen-south-measure-submaps.mjs`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

This image shows the concealed households before their names or location are
given to another power. Runtime JSON remains authoritative for exact cells,
collision, transitions, and minimaps.

## Layout contract

- **Connections:** The surface drying-frame door is `(124, 58)`, plane `se`,
  used from `(125, 58)`, and arrives at `(2, 6)` facing `se`. The rows return
  door is `(0, 6)`, plane `se`, used from `(1, 6)`, and returns to `(125, 58)`
  facing `se`. The surface grave hatch is `(112, 16)`, orient `sw`, with a
  same-cell use, and arrives at `(24, 2)` facing `sw`. The rows grave door is
  `(24, 0)`, plane `sw`, used from `(24, 1)`, and returns to `(112, 16)` facing
  `ne`.
- **Required anchors:** Three distinct household rooms, shared interior lane,
  concealed water branch, shared cooking flue, treatment room, meeting room,
  and private off-roll list.
- **Exclude:** Bunker styling, one oversized dormitory, treasure storage,
  faction guards, or additional exits.

The image fixes the connection graph. The runtime coordinates above now fix the
compass edge, wall plane, and arrival direction for both transitions.

## State boundary

**Shown:** An inhabited protected space with the household names still private.

**Not shown:** Public disclosure, names surrendered to Aurelia or Darius, Compact
staff, Chain guards, council watchers, removals, or public signage.

## Generation record

Accepted prompt contract:

```text
Create a roofless 30x18 Hidden Rows planning map in the established sepia ink
style. Connect a movable drying-frame entrance to one shared lane serving three
distinct household rooms, one treatment room, and one meeting room; connect a
narrow rear passage to the grave-strip exit. Show a concealed non-walkable
water branch, shared cooking flue, ordinary household goods, treatment
supplies, and the private water list. Label every area and end the border at
30x18. No bunker, dormitory, treasure, guards, shrine, extra exit, or watermark.
```
