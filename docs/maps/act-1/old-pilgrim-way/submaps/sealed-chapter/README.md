# Sealed Chapter

- **Status:** Implemented
- **Size:** `46x36`
- **Runtime:** `data/levels/old_pilgrim_sealed_chapter.json`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

The Sealed Chapter is the end of the buried route. The chapter hall holds the
largest group of dead, the last water tally, and the controls that confirm why
the seal never reopened. The Oath Armory remained separately locked and still
contains the Processional Pike.

## Layout contract

- **Connections:** The south stair returns to the Trial Galleries. The return
  lift is sealed and powerless on first arrival, then unlocks a shortcut to the
  Hill Church after the armory is opened.
- **Required anchors:** Chapter hall, lower chapel, rector's office, records
  room, cistern controls, final water tally, reliquary store, Oath Armory,
  Processional Pike, and return lift.
- **Bodies:** Priests, nuns, novices, and sheltered pilgrims died throughout the
  chapter hall and side rooms. The armory contains no body and shows no breach.
- **Primary reward:** The Processional Pike is a unique melee polearm. Its
  implemented identity is a two-cell thrusting weapon. Its attack declares
  `mode: "melee"` and `range: 2`, so it keeps melee accuracy and damage rules
  while respecting intervening blocking cells.
- **Exclude:** A living boss, hostile dead, Host growth, a contaminated weapon,
  fantasy treasure vault, or an exit that opens before the chapter is reached.

## Runtime state

Ten searchable ordinary skeletons lie in the chapter hall and side rooms. The
closure record confirms that the automatic seal kept Bloom air outside while
waiting forever for external clearance. The Oath Armory stayed separately
sealed and contains no body.

Opening the armory makes the Processional Pike available as ground loot. Taking
it advances the hidden quest and enables the chapter-side return lift, which
loads the Hill Church bell stair and completes the route.

## Generation record

Accepted prompt contract:

```text
Create a roofless 46x36 Sealed Chapter in the established sepia ink planning
style. Include a large chapter hall filled with long-dead robed human bodies,
lower chapel, rector's office, records room, cistern controls, final water
tally, reliquary store, separately sealed Oath Armory, and a sealed return lift.
Display one long Processional Pike in the empty armory and label it exactly. Use
an exact numbered border. No living boss, undead, Host growth, contaminated
weapon, color, or watermark.
```
