# Vertical Slice Plan

This project should grow through small playable slices, not giant unfinished systems.

## Rule

Do not build a large RPG framework before there is a playable loop.

A playable slice is better than ten half-finished systems.

## Slice 0: Repository foundation

Goal: clean local-hostable app and structure.

Must have:

- `npm run dev` starts a local server.
- `index.html` loads the game.
- Canvas draws something.
- `npm run check` validates basic JSON.
- Repo docs explain structure.

Done when:

- A new contributor can run the demo from the README.

## Slice 1: Exploration prototype

Goal: player can move around a tile map.

Must have:

- One JSON map.
- One player actor.
- Grid movement.
- Collision against walls.
- Camera or fixed viewport.
- Pixelated rendering style.

Avoid:

- Inventory.
- Full quest system.
- Complex pathfinding.
- Huge maps.

## Slice 2: One turn-based encounter

Goal: basic tactical combat exists.

Must have:

- One enemy.
- Turn order.
- Basic movement cost.
- Basic attack.
- HP/damage/death.
- Win condition.
- Lose condition.

Enemy suggestion:

- `host-penitent-bastion`: slow, defensive Host creature created by the Vale Imprint.

Avoid:

- Dozens of abilities.
- Complex AI.
- Status-effect bloat.

## Slice 3: One interaction and one dialogue

Goal: the player can talk to an NPC or inspect an object.

Must have:

- One interactable object or NPC.
- One dialogue JSON file.
- Simple dialogue UI.
- One meaningful choice, even if small.

Good example:

- A Free City gate guard asks whether the player is carrying Host-contaminated salvage.

Avoid:

- Branching epic dialogue trees.
- Voice acting.
- Reputation system before it matters.

## Slice 4: One quest

Goal: a tiny quest with start, objective, and completion.

Must have:

- Quest accepted.
- Objective tracked.
- Quest completed.
- Reward or consequence.

Good example:

- Recover a sample from a quarantined chapel basement.

Avoid:

- Full journal polish.
- Dozens of quest states.
- Procedural quest generation.

## Slice 5: Save/load

Goal: player progress can persist locally.

Implemented:

- One active run with a manual save and three rotating autosaves in IndexedDB.
- Full player, companion, inventory, quest, flag, clock, exploration, actor,
  ground-item, and visited-level state.
- A title screen with continue, new run, save management, and JSON import.
- A pause menu with manual save, load, JSON export, and return to title.
- Safe autosaves at field intervals, level transitions, before combat, and
  after combat. Mid-combat saves are disabled.
- Checksums, save-format migrations, game-version provenance, incompatible and
  damaged-save status, and failed-write preservation.
- JSON backup export and confirmed import replacement.

Still out of scope:

- Cloud saves.
- Multiple profiles.
- Cross-tab conflict resolution.

## Slice 6: First real demo area

Goal: combine exploration, combat, dialogue, and quest into one coherent playable area.

Must have:

- One small settlement or ruin with a bounded secondary area.
- One faction presence.
- One Host threat.
- One dialogue chain or readable investigation packet.
- Multiple small combat pulls that do not all aggro at once.
- One quest.
- One lore clue tied to The Host or Vale Imprint, without explaining the full mystery.

Suggested demo area:

- A quarantined chapel on the road to the Hallowfen wall where a Choir cell has left teachings, a camp, separated cultist groups, and a hidden service cellar.

## Scope traps to avoid

Do not start with:

- Huge open world.
- Character creator.
- Ten factions with full questlines.
- Procedural everything.
- Full inventory economy.
- Crafting.
- Skill trees.
- Base building.
- Multiplayer.
- Mod tools.
- Full-screen cinematic system.

Those can come later if the core loop is fun.

## Current expansion: Ash Road South settlement slice

The main `ash-road-south` surface is a 130 by 80 authored settlement shell.
It includes the central intake road, Water Court, old measure gates, Morrow
freight loop, Relief Annex, Rope Rows, Compact precinct, grave strip, arrival
fringe, charity edge, and collapsed drain. The surface has a return interaction
to Censure Road Camp and a north boundary that opens after the final assembly.
All nine South Measure helper maps are implemented as traversable generated
levels, with fifteen reciprocal connector pairs, access checks on restricted
routes, and fixed arrival facings. Each helper map contains one contextual
opened-state supply container and one reachable loose common item. The helper
generator keeps those supplies clear of objects, actors, and blocked cells.

The grave strip now contains a pre-Bloom field-attendant cradle with a later
Censure credential layer. Its ritual registers every build, presents two
impressive unavailable catalogue entries before the local Utility Drone Mark I,
and requires the player to name the issued frame. The attendant persists across
maps, follows during exploration, takes a manual turn after the player, reboots
after victory if disabled, and has a 48-node journal tree across Core, Energy,
Bulwark, Medical, Veil, and Fieldworks. Eight additional Drone Service Parts are
distributed through five South Measure containers; the shrine issues two.

The location now has a complete 109-identity census. The surface contains 81
named people. The helper maps contain 71 logical placements, 41 character
conversations, and 213 ambient lines. Six tracked quests now cover repair
selection, physical part recovery, pressure restoration, pump and roll custody,
Noa and Cassian, disputed debts, charity stock, hidden households, Salome Naso's
Choir influence, the north-gate assembly, and departure. Junia Lector begins as the
fixed Intake Clerk conversation and becomes a conditional combat actor if the
wicket is forced. Salome has a four-clue investigation, seven downstream
outcomes, and one optional conditional False Catechist encounter. Her quest
stays out of the journal until the first clue is found.

The surface settlement-life pass is implemented across six layers. Fifteen
civilians now perform 27 stable object-linked routine stops using four new work
animation families and live prop responses. Six recurring three-person
tableaux gather 18 distinct NPCs around registration, water, freight, charity,
clinical screening, and weighing work. Four proximity sound beds and twelve
physical work cues establish district sound without an asset dependency.
Thirty new inspections turn existing props into material evidence, with
thirteen reacting to later settlement flags and none adding loot. Six local
compositions add 36 selectively grouped objects around actual work sites while
preserving every validated route.

Jeremiah Afer waits at the Arrival Fringe fires. Returning Priscilla’s necklace
completes her existing side errand and triggers his abrupt recovery of the
papers, purse, and Hallowfen work seal he had lost on the road.

Travel from Censure Road Camp is intentionally locked behind the existing
`censure-road-voss-report-perfect` story flag. This keeps South Measure out of
sequence while preserving a direct developer-start alias for review.

Crossing South Measure's raised chain now loads the implemented Old Pilgrim Way
surface. The road carries all four South Measure governance outcomes, relevant
Cassian and Noa states, Choir evidence, a five-enemy Stage IV field encounter, and
the report that opens travel toward the Quarantine Farms.

The optional Hill Church route continues through five connected interiors:
Closure Stair, Novitiate Quarters, Trial Galleries, and Sealed Chapter, with the
public church as the entry map. Two investigation checks reveal the descent.
The underground maps contain ordinary dead, failed water systems, four trials
with skill and physical routes, an empty Oath Armory, the Processional Pike,
and a one-way return lift. Deferred work now begins at Quarantine Farms and at
later consequences beyond the road briefing.

## Current foundation: weapon catalog and ammunition

The combat foundation now has two flexible ready slots, finite magazines,
reload AP, condition wear per attack mode, and enemy item references. The
initial catalog contains 100 lore-bound weapons and nine ammunition families.
Act I exposes a curated 20-weapon field pool through starter gear, traders,
containers, one human enemy drop, and the Processional Pike reward. Later acts
should draw from the remaining catalog before increasing the global count.

The next weapon pass belongs with Quarantine Farms encounter balance. It should
tune ammunition quantities, prices, enemy reserves, and reward timing from
playtest evidence. It should not add crafting, procedural affixes, or another
weapon technology family yet.
