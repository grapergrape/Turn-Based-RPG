# Combat System

The full combat system has not been implemented yet. Character sheets should use the progression framework in `docs/systems/progression.md`: Five Keeps, Seven Virtues, Trace, Icon Risk, origins, field roles, scars, vows, and liabilities.

Combat checks should pair one **Keep** with one **Virtue** when a character acts under pressure. The Keep describes the practical capability. The Virtue describes the moral, emotional, or cultural discipline shaping the action.

Examples:

- Hold a barricade: Flesh + Fortitude.
- Cross a collapsing room: Breath + Fortitude.
- Calm panicked civilians: Bond + Mercy.
- Pass a Remnant inspection during a quarantine: Bond + Obedience.
- Decode a mission archive while Host whispers interfere: Memory + Witness.
- Resist Choir influence: Will + Temperance.
- Confess guilt without breaking: Will + Contrition.
- Lead a desperate breach: Bond + Zeal.

The exact action economy, hit formula, status effects, and AI behavior are still open. Do not build combat math around Dungeons & Dragons ability scores, SPECIAL-style point allocation, or generic fantasy class assumptions.

## Open Questions

- What is the turn order model?
- Is positioning grid-based, lane-based, or abstract?
- What actions are available each turn?
- How do status effects work?
- What formulas convert Keeps, Virtues, gear, and techniques into hit chance, damage, defense, morale, and contamination risk?
- How do Keep conditions interact with current HP, action points, suppression, panic, and injury?
