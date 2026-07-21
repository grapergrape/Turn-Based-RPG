# South Measure Compact Clinic

- **Status:** Runtime implemented
- **Size:** `36x24`
- **Runtime:** `data/levels/south_measure_compact_clinic.json`
- **Generator:** `scripts/gen-south-measure-submaps.mjs`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

This image shows the existing Compact medical mission before the final custody
decision. Runtime JSON remains authoritative for exact cells, collision,
transitions, and minimaps.

## Layout contract

- **Connections:** The clinic door is set into the south-facing intake frontage
  at surface `(98, 33)`, plane `sw`, and is used from `(98, 34)`. It arrives at
  clinic `(18, 21)` facing `ne`. The interior door is `(18, 23)`, plane `sw`,
  used from `(18, 22)`, and returns to `(98, 34)` facing `sw`.
- **Required anchors:** South triage and dressing station, central six-bed ward,
  east applicant lane, northeast placement archive and blood-card station,
  northwest cold service bay with flow monitor and backup cell, visible isolation
  room, and rear staff sleep and wash area.
- **Exclude:** A torture room, secret laboratory, combat-arena plan, permanent
  luxury hospital, or extra exit.

## State boundary

**Shown:** Compact staff are providing real care and the flow monitor remains
secured. Two ward beds are kept available for charity referrals.

**Not shown:** Post-custody census expansion, added archive records, monitor
assignment, transferred patients, Compact withdrawal, or extra custody staff.

## Generation record

Accepted prompt contract:

```text
Create a roofless 36x24 Compact Clinic in the established sepia ink planning
style. Keep the public entrance, triage, and dressing station south; exactly
six treatment beds central; applicant lane east; records and blood cards
northeast; cold cabinet, flow monitor, vaccines, and backup cell northwest; one visible
isolation room; and staff sleep and wash facilities at the rear. Label all
areas and end the border at 36x24. Show useful field medicine, not luxury,
torture, a secret lab, combat arena, extra exit, or watermark.
```
