# Old Pilgrim Way Submaps

The Hill Church opens into a five-map optional chain. Every map is implemented
and has a visual reference. The chain moves from a
public church into a concealed quarantine descent, the rooms where the trapped
clergy lived, the old initiation trials, and the sealed chapter armory.

| Level ID | Runtime file | Size | Connection | Purpose | Reference | Status |
| --- | --- | ---: | --- | --- | --- | --- |
| `old-pilgrim-hill-church` | `data/levels/old_pilgrim_hill_church.json` | 44x32 | Surface door at (88,13) to church door at (22,31) | Church, hospice rooms, ordinary salvage, and concealed apse door | [Map and notes](./hill-church/README.md) | Implemented |
| `old-pilgrim-closure-stair` | `data/levels/old_pilgrim_closure_stair.json` | 32x48 | Apse door at (22,0) to upper stair at (15,0) | Automatic pressure seal, failed emergency systems, and first trapped dead | [Map and notes](./closure-stair/README.md) | Implemented |
| `old-pilgrim-novitiate-quarters` | `data/levels/old_pilgrim_novitiate_quarters.json` | 48x34 | Inner door at (15,47) to south door at (24,33) | Dormitories, clergy cells, stripped stores, dry cistern, and final water tally | [Map and notes](./novitiate-quarters/README.md) | Implemented |
| `old-pilgrim-trial-galleries` | `data/levels/old_pilgrim_trial_galleries.json` | 64x48 | Quarters passage at (24,0) to south stair at (32,47) | Four distinct initiation trials and the final profession gate | [Map and notes](./trial-galleries/README.md) | Implemented |
| `old-pilgrim-sealed-chapter` | `data/levels/old_pilgrim_sealed_chapter.json` | 46x36 | Profession door at (32,0) to south door at (23,35) | Chapter records, cistern controls, Oath Armory, Processional Pike, and return shortcut | [Map and notes](./sealed-chapter/README.md) | Implemented |

## Connection contract

The chain is linear on first entry:

```text
Old Pilgrim Way
  Hill Church
    Closure Stair
      Novitiate Quarters
        Trial Galleries
          Sealed Chapter
```

The Sealed Chapter return lift unlocks a one-way shortcut back to the Hill
Church after the Processional Pike leaves its rack. It begins sealed and cannot
bypass the discovery checks or trials. Father Noah then moves into the church,
where the recovered name rolls receive one of three lasting dispositions.

Connector cells, arrival facings, collision, journal stages, and fallback states
are authored in the generated levels and dialogues. The concealed apse route
does not become usable until its discovery and release states are set.

## Shared content rules

- The underground dead are priests, nuns, novices, and sheltered pilgrims.
- Bodies remain ordinary, long dead, and untransformed. Clothing and room
  placement should make their roles legible without turning them into enemies.
- No living faction occupies the buried complex when first discovered.
- No Host outbreak occurred inside. The horror comes from a protective system
  that never reopened.
- Trial failures should cost supplies, health, access to secondary loot, or
  time. They should not permanently block the main route without a readable
  fallback.
- Quiet, Service, Burden, and Mercy each retain a skilled solution and a
  physical fallback. Clues from the closure and quarters improve later trial
  readings. Kept and broken mechanisms remain visibly different.
- The closure duty roll, novitiate sleeping roll, candidate roll, and final
  chapter record form the evidence chain for `names-below-the-hill`.
- The Oath Armory stays sealed from the chapter hall until the trials are
  completed. Completing every trial through its intended method preserves the
  final profession mechanism. Using any forced route produces a separate
  profession judgment. The primary armory reward is the Processional Pike.
