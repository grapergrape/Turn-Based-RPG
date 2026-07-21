# Map Planning Library

This folder holds planning images, spatial notes, and submap registries. Runtime
maps remain in `data/levels/`; nothing under `docs/maps/` is loaded by the game.

The library is organized by campaign act, then by the main playable location.
Each location package keeps its main-map material separate from every interior,
dungeon, cave, cellar, tent, or other helper map connected to it.

```text
docs/maps/
├── README.md
└── act-N/
    ├── README.md
    └── <main-level-id>/
        ├── README.md
        ├── main/
        │   └── planning-map.png
        └── submaps/
            ├── README.md
            └── <submap-or-group-id>/
                ├── README.md
                └── planning-map.png
```

`main/planning-map.png` is the stable canonical filename for a location's main
planning image. Do not add revision suffixes such as `v6`; Git preserves image
history. A location's `submaps/README.md` lists every implemented and planned
child map, including child maps whose dedicated planning image has not been
drawn yet. Create `submaps/<level-id>/` only when that child has its own image
or substantial design notes. A quest or system that spans several child maps
may use one group folder, while the registry continues to list each runtime
level separately.

Folder names follow stable kebab-case content IDs. JSON filenames under
`data/levels/` keep the repository's existing underscore convention. Use these
status labels in registries:

- **Implemented:** the runtime level exists and is connected or intentionally
  staged for connection.
- **Planned:** the level has an agreed scope and reserved ID but no runtime JSON.
- **Deferred:** the level is known but its scope is not locked.

## Current packages

| Act | Main location | Main planning map | Child-map registry |
| --- | --- | --- | --- |
| [Act I](./act-1/README.md) | [Long Ash Road Approach](./act-1/long-ash-road-approach/README.md) | [Image](./act-1/long-ash-road-approach/main/planning-map.png) | [Nine implemented submaps](./act-1/long-ash-road-approach/submaps/README.md) |
| [Act I](./act-1/README.md) | [Censure Road Camp](./act-1/censure-road-camp/README.md) | [Image](./act-1/censure-road-camp/main/planning-map.png) | [Eight implemented submaps](./act-1/censure-road-camp/submaps/README.md) |
| [Act I](./act-1/README.md) | [Ash Road South](./act-1/ash-road-south/README.md) | [Image](./act-1/ash-road-south/main/planning-map.png) | [Nine implemented submaps](./act-1/ash-road-south/submaps/README.md) |
| [Act I](./act-1/README.md) | [Old Pilgrim Way](./act-1/old-pilgrim-way/README.md) | [Image](./act-1/old-pilgrim-way/main/planning-map.png) | [Five implemented submaps](./act-1/old-pilgrim-way/submaps/README.md) |

The full canon lives in `docs/lore/the_host_story_bible.md`. The game-facing
world structure lives in `docs/story/world.md`. The sections below remain the
campaign-wide location index and design guardrails.

## Location Design Rules

- Every location should have a practical survival purpose: water, food, roads, medicine, archives, shelter, fuel, quarantine, trade, or worship.
- Host-contaminated spaces should show the Vale Imprint through layout and props, not just enemies.
- Human spaces should include ordinary life before horror: kitchens, ledgers, repairs, markets, schools, shrines, workspaces, and signs of compromise.
- Faction-controlled maps should show what the faction does well and what it hides.
- Do not make Woundfall a simple final dungeon. It is a region.

## Campaign Regions

### Hallowfen

**Campaign role:** Prologue settlement.
**Map type:** Walled _Eschaton's Mercy_ crash scar with a lawless inner settlement.
**Key spaces:** Outer wall road, Remnant checkpoints with bell towers, inspection back rooms, smuggler tunnel, gambling dens, illegal clinics, relic stalls, water pumps, barricades, chapel ruins, crash-heart holy ground, survivor hiding places, smuggler marks.
**Gameplay purpose:** Checkpoint infiltration, confiscation or escape route, siege choices, survivor triage, first major Choir reveal, later data-core discovery.

Hallowfen should begin dangerous and human. The player should understand who chose the forbidden city, who got trapped there, and who is still worth saving before seeing what the Choir wants to build at the crash heart.

### Ash Roads

**Campaign role:** Act I travel region.
**Map type:** Road network between Free City territory, quarantine ruins, small settlements, and Spindle Gate.
**Key spaces:** Checkpoints, road shrines, abandoned suburbs, convoy camps, quarantine chapels, broken bridges, safe wells, toll gates.
**Gameplay purpose:** Faction introductions, early combat, route choices, road reputation, signs of renewed Host activity.

The current playable level `data/levels/ash_chapel_breach.json` fits here as a roadside quarantine chapel encounter.

`data/levels/long_ash_road_approach.json` is the first full-size Act I travel
shell after Ash Chapel. It covers a 160 by 70 road approach with farm fields,
forest cover, a crossroad toward Censure Road Camp, a southern Remnant Capital
spur, a calcified graveyard, and the slain cultist and Host-wolf kill site. It
is generated by `scripts/gen-long-ash-road.mjs` from coordinate anchors. The
farm fields use walkable waist-high `wheat-clump` cover models that fade near
the player, while fences, trunks, stumps, and buildings own collision. This
keeps the layout regenerable while texture and population passes continue later.

The two graveyard chapels support the optional mystery
[`Those Who Heard the Bell`](./act-1/long-ash-road-approach/submaps/those-who-heard-the-bell/README.md). Its locked plan
covers the Vigil Chapel, Mortuary Chapel, listening vault, Sapphira Rufa, decision
flags, containers, item placement, and delayed outcome rewards.

`data/levels/censure_road_camp.json` is the next Act I stop north of Long Ash
Road. It is generated by `scripts/gen-censure-road-camp.mjs` from the planning
image in
[`docs/maps/act-1/censure-road-camp/main/planning-map.png`](./act-1/censure-road-camp/main/planning-map.png).
The playable area is the Censure
camp and road only; terrain beyond the camp walls and road shoulders is blocked
by dense dark undergrowth.

`data/levels/ash_road_south.json` is the 130 by 80 settlement surface beyond
the restricted Censure route. Its
[`location package`](./act-1/ash-road-south/README.md) separates the current
main-map plan from the nine generated, connected helper maps.

Old Pilgrim Way is the implemented Act I route north of South Measure. Its
[`location package`](./act-1/old-pilgrim-way/README.md) contains a 120 by 70
road surface and five connected church and novitiate submaps. South Measure's
north departure loads the road after its final assembly.

### Spindle Gate

**Campaign role:** Early hub and information market.
**Map type:** Vertical trade city built around the anchor ruins of a destroyed space elevator.
**Key spaces:** Gatehouse, water ledgers, roof markets, slums, militia towers, guild halls, shrines, black clinics, salvage elevators, faction embassies.
**Gameplay purpose:** Hub quests, black market, companion recruitment, faction negotiations, data-core decision fallout.

Every faction should have a presence here, but no faction should fully control it.

### Sanctum Aurelian

**Campaign role:** Holy Remnant capital and Confessor's Key location.
**Map type:** Fortress-city around an old planetary defense complex.
**Key spaces:** Pilgrim camps, decontamination gates, public kitchens, confession courts, basilica weapon, Mercy Courts, Quiet Cardinal vaults, hidden priest-surgeon cells.
**Gameplay purpose:** Stealth, trial, infiltration, doctrine pressure, Remnant alliance or hostility.

Sanctum should be beautiful, ordered, useful, and terrifying.

### Meridian Vault

**Campaign role:** Lumen Compact capital and Surgeon's Gospel location.
**Map type:** Underground accelerator tunnels and military bunkers.
**Key spaces:** Clean transit tubes, surgical theaters, school halls, machine libraries, archive stacks, sealed labs, Project Lazarus Bloom chambers.
**Gameplay purpose:** Research choices, sealed-lab exploration, medical systems, Compact politics, test-subject consequences.

Meridian should feel safer than the surface until the player sees what safety costs.

### Low Harrow

**Campaign role:** Free City witness quest and Bell in the Water location.
**Map type:** Flooded city of rooftops, bridges, boats, upper-floor markets, and contaminated lower districts.
**Key spaces:** Roof farms, boat docks, family towers, submerged streets, black-water wreckage, offering sites, hidden air pockets.
**Gameplay purpose:** Traversal variation, flood timing, pact revelation, submerged _Eschaton's Mercy_ fragment.

The lower city should imply a long negotiation between human survival and something beneath the water.

### Cinder Parish

**Campaign role:** Free City faith counterpoint.
**Map type:** Religious farming city outside Remnant authority.
**Key spaces:** Fields, irrigation shrines, militia barns, open-air chapel, burn-scar memorial, family quarantine rooms.
**Gameplay purpose:** Faith without Pontifex control, food politics, sheltering infected families, Free City league decisions.

### Glassmarket

**Campaign role:** Food-power and refugee-crisis location.
**Map type:** Wealthy settlement inside a cracked climate-control dome.
**Key spaces:** Artificial-sky fields, grain stores, labor gates, ration offices, dome control rooms, luxury upper platforms.
**Gameplay purpose:** Negotiation, class conflict, refugee ration choices, sabotage or protection of food supply.

### The Pale Orchard

**Campaign role:** Act III awakening site.
**Map type:** Dormant Bloom zone of rooted transformed bodies.
**Key spaces:** Pale fruit groves, face-bark trees, wind-whisper lanes, local harvest paths, Remnant burn lines, Compact sample tents, Choir pilgrimage marks.
**Gameplay purpose:** Environmental boss, moral harvesting choices, proof that Europa is pulling the lock.

The Orchard should be beautiful enough that burning it is not emotionally simple.

### The Black Reliquary

**Campaign role:** Penitent Engine mobile fortress.
**Map type:** Walking fortress with chapels, armories, repair bays, prison cells, relic vaults, and machine organs.
**Key spaces:** Leg engine rooms, vow chapel, armor surgery bay, prison hold, command pulpit, exterior siege decks.
**Gameplay purpose:** Penitent politics, Brother Cassian quest, moving safe zone or hostile war machine.

### Woundfall

**Campaign role:** Act IV region and endgame approach.
**Map type:** Largest crash scar of _Eschaton's Mercy_.
**Key spaces:** Dead highways, black-glass fields, half-buried corridors, upside-down chapels, pressure doors, bone forests, malfunctioning gravity rooms, preserved command decks, the Nave.
**Gameplay purpose:** Large explorable region, faction war, truth of the Stilling, Seneca encounter, First Icon approach.

Woundfall should shift between outdoor wasteland, starship interior, living Host architecture, and preserved old-world spaces.

### Saint Origen Deep Bore

**Campaign role:** Origin site, mostly archive/myth until late game.
**Map type:** Europan vertical monastery-drill under ice.
**Key spaces:** Bore shaft, Containment Chapel Three, Chapel of Saint Origen, pressure locks, sample labs, crew quarters, AI broadcast nodes.
**Gameplay purpose:** Flashbacks, archive playback, hallucination sequences, possible late-game Europa arc.

### Europa

**Campaign role:** Optional/direct endgame escalation or remote contact.
**Map type:** Ice moon, ocean beneath ice, old Ecclesiate ruins, source-organism interface.
**Key spaces:** Abandoned landing fields, Saint Origen ruins, ice tunnels, pressure ocean interface, relay systems.
**Gameplay purpose:** Europa Ending, first contact without Vale's fear as first language.

## Open Map Questions

- Which locations need playable maps for the first vertical slice after Ash Chapel Breach?
- Does Hallowfen use one full settlement map, or a sequence of wall checkpoint, tunnel, inner streets, and crash-heart maps?
- Does Spindle Gate use one hub map or district maps?
- Is Woundfall open-region traversal, act-based linear approach, or a hybrid?
- Does the Europa Ending require a playable Europa map or can it resolve through Woundfall's relay?
