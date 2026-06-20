# Combat System

Design status: early runtime combat exists for the Ash Chapel slice, but the full progression-backed combat model is not implemented yet.

Combat should use the progression framework in `docs/systems/progression.md`: seven primary attributes, derived field ratings, scars, Trace, Icon Risk, techniques, gear, and clearances.

The combat design target is a low-resolution tactical CRPG. Mandatory fights must be clearable by more than Firearms. Non-gun builds should win by changing the fight through tools, positioning, machines, morale, treatment, containment, stealth, or preparation.

Religion is not magic. Doctrine, Command, Purgation Tools, and Containment can change who obeys, who hesitates, what is safe, and how anti-Host tools are used. They do not cast spells.

## Combat Lanes

Each field rating must support at least one of these lanes:

- direct combat use,
- pre-combat setup,
- combat avoidance,
- ally sustain,
- enemy control,
- hazard or terrain control.

If a field cannot do any of those, it does not belong in the main field-rating list.

## Field Rating Combat Roles

### Unarmed

Close control, shoves, grapples, disarms, silent takedowns, and fighting when weapons are gone.

Use for:

- pushing enemies into hazards,
- disabling isolated cultists,
- breaking grabs,
- non-lethal takedowns if the story supports them.

### Melee

Ammo-free close damage and finishing pressure.

Use for:

- knives, blades, clubs, hooks, and short polearms,
- attacks of opportunity or close-zone threat,
- finishing wounded enemies without spending ammunition.

### Firearms

Reliable ranged damage.

Use for:

- pistols, rifles, shotguns,
- aimed shots,
- weak-point targeting,
- overwatch or reaction fire.

### Arc Weapons

Rare old-world charge weapons and sanctioned Ecclesiate systems.

Use for:

- armor piercing,
- shield or machine counters,
- overheating risk,
- rare ammunition or charged cells,
- old-tech weapon maintenance checks.

Do not copy existing energy-weapon names or visual language from other games.

### Heavy Weapons

Bulky, expensive, high-impact weapons.

Use for:

- area damage,
- suppression,
- breaking barricades,
- mounted weapons,
- heavy burners and launchers.

Heavy Weapons should be powerful but constrained by weight, setup, ammunition, noise, and friendly-fire risk.

### Purgation Tools

Censure anti-Host equipment. Fire, caustics, sealant, cutting gear, and execution tools.

Use for:

- shutting down Host regeneration,
- denying tiles,
- burning growth,
- finishing opened forms,
- destroying unsafe relics.

Purgation Tools should be useful against Host threats and frightening to humans, but they should create moral and collateral risks.

### Engineering

Deployables and field systems.

Use for:

- tripod turrets,
- small drones,
- field generators,
- deployable cover,
- repair rigs,
- barricade kits,
- turning room devices against enemies.

Engineering is a real combat main. Its cost is preparation time, parts, battery use, noise, weight, and vulnerability if the character is rushed.

### Stealth

Positioning and fight control before initiative.

Use for:

- avoiding patrols,
- starting from cover,
- ambush attacks,
- quiet movement,
- choosing where combat begins.

Stealth should rarely solve a full Host fight alone. It should decide the terms of the fight.

### Security

Locks, traps, safes, and secured paths.

Use for:

- tripwire traps,
- locked-door tactics,
- safes and reliquaries,
- alternate routes,
- disabling enemy preparations.

Security is strongest before combat starts, but can matter in combat when doors, traps, or locked devices are part of the map.

### Search

Evidence and environmental awareness.

Use for:

- finding hidden loot,
- spotting ambush signs,
- detecting corpse traps,
- identifying usable hazards,
- finding alternate routes.

Search should give players better choices before danger becomes a straight fight.

### Medicine

Sustain, status control, and body reading.

Use for:

- healing,
- stopping bleed,
- treating panic or shock when systems support it,
- reading corpse causes,
- using suppressants,
- keeping companions alive in long fights.

Medicine should not replace combat skill, but it can let a weaker combat build survive worse rooms.

### Doctrine

Religious law, cult logic, and formal rite knowledge.

Use for:

- disrupting cult confidence,
- identifying false rites,
- passing or challenging Remnant procedure,
- splitting cultists from true believers,
- finding lawful routes before combat.

Doctrine can prevent or weaken human fights. Against mindless or fully opened Host forms, it mainly informs preparation.

### Host Signs

Physical Host behavior and danger reading.

Use for:

- spotting living tissue,
- predicting corpse-rising,
- identifying weak points,
- reading regeneration tells,
- avoiding contaminated loot or tiles.

Host Signs is distinct from Doctrine. Doctrine explains what a rite means to people. Host Signs explains what the organism is doing.

### Containment

Quarantine, seals, exposure control, and safe handling.

Use for:

- sealing doors,
- isolating enemies,
- creating burn lines,
- moving dangerous relics,
- denying infected spaces,
- choosing safe routes through contaminated rooms.

Containment wins by limiting the fight.

### Speech

Negotiation, questioning, calming, and bargaining.

Use for:

- avoiding fights,
- delaying hostile groups,
- gaining witnesses,
- splitting enemies,
- persuading civilians to move before combat starts.

Speech should not pacify true Host creatures, but it can affect people around them.

### Command

Authority, morale, intimidation, and field orders.

Use for:

- companion coordination,
- crowd control,
- forced surrender,
- intimidation,
- panic control,
- making frightened people act.

Command is the social combat lane. It should matter in mixed human and cult fights, rescue scenes, evacuations, and battles with allies.

### Guile

Lies, false papers, misdirection, infiltration, and fake rite correctness.

Use for:

- entering hostile spaces,
- changing starting positions,
- planting evidence or traps,
- passing inspections,
- getting enemies out of formation.

Guile should often change the map state before combat rather than act as a damage skill.

## Build Viability Rule

Every starting character should have one reliable combat lane or support lane.

Examples:

- Firearms clears fights through ranged damage.
- Purgation Tools clears Host fights through fire, denial, and regeneration shutdown.
- Engineering clears fights through drones, turrets, cover, and room control.
- Command clears human-heavy fights through morale and ally coordination.
- Medicine clears long fights by keeping the party alive.
- Stealth and Security clear fights by deciding where and how they begin.
- Host Signs clears Host fights by exposing weak points and preventing bad triggers.

The game should not require every build to personally deal equal damage. It should require every build to contribute to survival.

## Initial Implementation Decisions

- Keep the current grid and action-point combat foundation. Field ratings should first enter as action gates, accuracy modifiers, prep checks, and dialogue/combat state changes, not as a full rewrite of turn structure.
- Keep authored actor `actionPoints` until the progression system has enough runtime support to derive AP from field ratings or primaries.
- Character and enemy levels now scale from the progression module. Base JSON stats remain the source, while build profiles add small HP/AP growth and encounter victory awards XP once per cleared pull.
- Combat XP is summed from every defeated enemy in the encounter. Each enemy uses its level and complexity tier (`minion`, `standard`, `hardened`, `elite`, `boss`), with `progression.xpReward` only for authored exceptions.
- The next combat lane after Firearms and Melee should be Engineering, because drones, tripod turrets, and deployable cover prove non-gun build viability without making religion act like magic.
- Limit deployables through parts, batteries, setup time, inventory weight, and vulnerability after placement. Do not use a mana-style resource.
- Trace should affect warnings, danger, Host targeting, contamination risk, and rare options. It should not be a spell meter.
- Human enemies, cultists, guards, and raiders can surrender, panic, hesitate, or flee when their faction and scene support it. Fully opened Host forms do not surrender. Some early-stage victims may hesitate if the story says enough of the person remains.
