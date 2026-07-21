# South Measure Measure Hall

- **Status:** Runtime implemented
- **Size:** `34x22`
- **Runtime:** `data/levels/south_measure_measure_hall.json`
- **Generator:** `scripts/gen-south-measure-submaps.mjs`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

This image shows the active school and council interior before the final
custody decision. Runtime JSON remains authoritative for exact cells,
collision, transitions, and minimaps.

## Layout contract

- **Connections:** The surface door is `(94, 51)`, plane `sw`, used from
  `(94, 52)`, and arrives at `(17, 19)` facing `ne`. The hall door is
  `(17, 21)`, plane `sw`, used from `(17, 20)`, and returns to `(94, 52)`
  facing `sw`.
- **Required anchors:** Bright front slate school, rear council table, west
  kitchen and oven, current-records cabinet, canvas loft with one inert
  exposure-painted strip, and a narrow inferior storm room.
- **Exclude:** The original intake archive, the original roll in the neutral
  state, grand civic architecture, or comfortable newcomer lodging.

## State boundary

**Shown:** School, council, kitchen, current records, and Last Canvas storage.
The later original-roll custody position remains empty.

**Not shown:** The original roll under council custody, a revised public water
list, newly disclosed households, guards, or assembly staging.

## Generation record

Accepted prompt contract:

```text
Create a roofless 34x22 Measure Hall in the established sepia ink planning-map
style. Use one surface door into the bright front slate school; place the
council table at the rear, kitchen and shared oven west, current public records
near the council area, an interior ladder to the canvas loft, and one narrow
storm room. Show an empty custody rest, sound canvas, and one inert painted
strip. Label all anchors and end the border at 34x22. No original intake roll,
grand hall, comfortable guest room, extra exit, treasure, or watermark.
```
