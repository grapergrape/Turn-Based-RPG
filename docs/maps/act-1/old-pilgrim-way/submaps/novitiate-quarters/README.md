# Novitiate Quarters

- **Status:** Implemented
- **Size:** `48x34`
- **Runtime:** `data/levels/old_pilgrim_novitiate_quarters.json`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

The Novitiate Quarters hold the clearest physical record of the people trapped
by the seal. Priests, nuns, novices, and pilgrims died in their beds, cells,
common rooms, and beside the dry cistern.

## Layout contract

- **Connections:** The south stair returns to the Closure Stair. The north stair
  enters the Trial Galleries. A maintenance shaft is present but not initially
  traversable.
- **Required anchors:** Candidate dormitory, sisters' cells, priests' cells,
  refectory, stripped pantry, prayer cells, dry cistern, dead pump, final water
  tally, and maintenance shaft.
- **Evidence:** Food vessels were scraped clean, the pantry was dismantled for
  anything edible, and water marks were counted beside the cistern.
- **Exclude:** Stocked food, standing water, living survivors, improvised cult
  worship, Host contamination, transformed bodies, or a shortcut that bypasses
  the trials.

## Runtime state

The rooms remain as the trapped community left them. Twelve searchable ordinary
skeletons are distributed through the dormitory, clergy cells, refectory,
pantry, and dry cistern. Containers and loose supplies reward inspection
without suggesting that food or water remained abundant.

The last water tally records 61 people at closure, no water after day five, and
seven people alive on day nine. Reading it opens the passage to the Trial
Galleries. The maintenance shaft remains blocked and cannot bypass the trials.

## Generation record

Accepted prompt contract:

```text
Create a roofless 48x34 Novitiate Quarters in the established sepia ink
planning style. Include a candidate dormitory, separate sisters' and priests'
cells, refectory, stripped pantry, prayer cells, dry cistern, dead pump, final
water tally, and blocked maintenance shaft. Place many long-dead robed human
bodies in beds, cells, common rooms, and near the cistern. Use an exact numbered
border. No living survivor, food stock, water, monster, Host growth, color, or
watermark.
```
