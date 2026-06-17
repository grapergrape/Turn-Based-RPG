# Project Memory: Systems

## Canonical Systems State

The selected character-sheet direction is **Five Keeps and Seven Virtues**, documented in `docs/systems/progression.md`. It is not implemented in runtime data or source code yet.

The game should not use SPECIAL, Dungeons & Dragons ability scores, free point-buy attributes, or generic fantasy classes. Character creation should be package-based:

- Origin
- Field Role
- Scar
- Vow
- Liability
- optional Training package

The package choices produce the numbers the engine uses.

## Character Sheet Direction

Characters have five **Keeps**, rated 1 to 10:

- Flesh
- Breath
- Memory
- Bond
- Will

Each Keep also has a condition:

```text
Clear -> Taxed -> Strained -> Fractured -> Broken
```

Characters also have seven **Virtues**, rated 0 to 5:

- Temperance
- Fortitude
- Mercy
- Obedience
- Witness
- Contrition
- Zeal

Virtues represent the religious-cultural vocabulary inherited from the Solar Ecclesiate. They are not goodness scores. Secular, religious, cartel, Compact, Remnant, Bloomborn, and Choir characters can all have Virtues, but factions read them differently.

Trace is a separate Host contamination scale:

```text
0 Clean
1 Marked
2 Whispering
3 Confessing
4 Icon-Risk
5 Blooming
```

At higher Trace, The Host attacks Scars, Vows, Virtues, and Icon Risk rather than only hit points.

## Current Direction

Combat should eventually pair one Keep with one Virtue for pressure actions, such as Flesh + Fortitude to hold a barricade or Memory + Witness to decode an archive. The exact combat math, action economy, and data schemas remain open.

Future data should likely define origins, field roles, scars, vows, liabilities, techniques, Virtues, and Trace stages separately, then let actor JSON reference those IDs.

## Open Questions

- What formulas convert Keeps and Virtues into combat outcomes?
- How many package choices should character creation expose at once?
- How often should Keeps increase?
- Can Virtues decrease as well as increase?
- When does the UI reveal Icon Risk?
- Can a broken Vow be replaced, or only rebuilt through a quest?
