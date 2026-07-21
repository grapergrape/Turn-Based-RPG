# South Measure Relief Maintenance Annex

- **Status:** Runtime implemented
- **Size:** `40x26`
- **Runtime:** `data/levels/south_measure_relief_maintenance_annex.json`
- **Generator:** `scripts/gen-south-measure-submaps.mjs`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

This image shows the annex before the final ownership decision. Runtime JSON
remains authoritative for exact cells, collision, transitions, and
minimaps.

## Layout contract

- **Connections:** The surface door at `(18, 26)`, plane `sw`, used from
  `(18, 27)`, arrives at `(19, 23)` facing `ne`. The annex return door is at
  `(19, 25)`, plane `sw`, used from `(19, 24)`, and returns to `(18, 27)`
  facing `sw`. The floor hatch is at `(3, 19)`, orient `se`, used from
  `(4, 19)`, and arrives in the drain at `(4, 13)` facing `sw`.
- **Required anchors:** Active south loading bay and Morrow claim desk, central
  machine floor, north parts cage, west generator room with cooling jacket,
  burned east bay, bypass schedule, and abandoned relief records.
- **Exclude:** A replacement pump component, heavy-factory scale, a wholly abandoned
  interior, or a usable exit through the collapsed rear bay.

## State boundary

**Shown:** Residents work in the front bays under existing Morrow supervision.
The rear bay remains fire-damaged.

**Not shown:** A resident-run shared workshop, increased Chain guards, council
custody, a committed water plan, or ownership-dependent hatch patrols.

## Generation record

Accepted prompt contract:

```text
Create a roofless 40x26 Relief Maintenance Annex in the established sepia ink
planning-map style. Put the loading bay and claim desk south, machine floor in
the center, parts cage north, generator room and cooling jacket west, and the
fire-damaged rear bay with relief schedules east. Include the drain hatch,
hoist, cart stands, lathes, pump jigs, presses, pits, stripped housings, mesh,
collars, and a bypass schedule. Label all anchors and end the border at 40x26.
No replacement pump component, giant factory, invented exit, or watermark.
```
