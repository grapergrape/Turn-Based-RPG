# South Measure Charity Cellar

- **Status:** Runtime implemented
- **Size:** `22x16`
- **Runtime:** `data/levels/south_measure_charity_cellar.json`
- **Generator:** `scripts/gen-south-measure-submaps.mjs`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

This image shows Joanna's compromised but useful reserve before its evidence and
supplies are resolved. Runtime JSON remains authoritative for exact cells,
collision, transitions, and minimaps.

## Layout contract

- **Connections:** The surface trapdoor is `(96, 72)`, orient `se`, with a
  same-cell use, and arrives at `(19, 13)` facing `nw`. The cellar stair door is
  `(21, 13)`, plane `se`, used from `(20, 13)`, and returns to surface
  `(96, 72)` facing `se`. The low rear crawl ends at a collapsed,
  non-traversable grate.
- **Required anchors:** Legitimate medicine shelves, separate locked
  suppressant cabinet, prayer cards, burned crate labels and courier evidence,
  and a screened patient cot.
- **Exclude:** A traversable rear exit, full Choir temple, cult congregation,
  dedicated ritual furniture, or the implication that all medicine is tainted.

## State boundary

**Shown:** Most medicine remains genuine and useful. Suspect stock is confined
to the locked cabinet, and one patient still depends on the reserve.

**Not shown:** Confiscated or transferred supplies, burned stock, moved
patients, council watchers, removed evidence, or the later increased patient
load.

## Generation record

Accepted prompt contract:

```text
Create a roofless 22x16 Charity Cellar in the established sepia ink planning
style. Use one cot stair, genuine medicine shelves, a separate locked suspect
cabinet, one screened patient cot, burned labels on an ordinary work surface,
and a low rear crawl ending at a blocked grate. Label every anchor and end the
border at 22x16. No second exit, temple, congregation, ritual circle, monster,
treasure, all-tainted stock, or watermark.
```
