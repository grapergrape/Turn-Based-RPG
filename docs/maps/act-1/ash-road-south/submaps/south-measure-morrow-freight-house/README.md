# South Measure Morrow Freight House

- **Status:** Runtime implemented
- **Size:** `36x22`
- **Runtime:** `data/levels/south_measure_morrow_freight_house.json`
- **Generator:** `scripts/gen-south-measure-submaps.mjs`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

This image shows the working Chain freight office before the final contract.
Runtime JSON remains authoritative for exact cells, collision, transitions,
and minimaps.

## Layout contract

- **Connections:** The surface main door `(31, 48)`, plane `se`, used from
  `(30, 48)`, arrives at `(2, 13)` facing `se`. The freight return door is
  `(0, 13)`, plane `se`, used from `(1, 13)`, and returns to `(30, 48)` facing
  `nw`. The surface rear door `(37, 49)`, plane `sw`, used from `(37, 50)`,
  arrives at `(29, 19)` facing `ne`. Its freight return door is `(29, 21)`,
  plane `sw`, used from `(29, 20)`, and returns to `(37, 50)` facing `sw`.
- **Required anchors:** Public office beside the main door, freight scale, route
  table, route room, ledger cage behind the office, bonded store, western guard
  bunks and small mess, and memorial wall tags.
- **Exclude:** The exterior medicine cart, animal yard, exterior grain cages, a
  hidden pump component, fantasy treasure-vault styling, or additional exits.

## State boundary

**Shown:** A Chain-controlled road office, occupied and stocked for ordinary
freight work before the settlement's final contract.

**Not shown:** New service notices, redistributed bonded grain, an opened
freight lane, cut surety tags, emptied stores, Chain withdrawal, or final
authority staffing.

## Generation record

Accepted prompt contract:

```text
Create a roofless 36x22 Morrow Freight House in the established sepia ink
planning-map style. Use exactly two exterior transitions: a public main door to
the freight yard and a rear service door to the repair stands. Place the public
office beside the main door, ledger cage behind it, route room adjacent, bonded
store under control, and guard bunks and small mess at the west end. Show the
scale, route table, toll maps, convoy-loss board, medicine-run board, pump
notes, surety records, drive oil, seals, grain tags, and memorial tags. Label
all anchors and end the border at 36x22. No outdoor yard assets inside, hidden
pump component, treasure-vault treatment, extra room, extra exit, or watermark.
```
