# Combat System

Design status: runtime combat now has progression-backed hit chance, damage
scaling, cover, the minimum build-support technique set, combat statuses, and encounter hazards.
The full party-scale combat model is not implemented yet.

Combat should use the progression framework in `docs/systems/progression.md`: seven primary attributes, derived field ratings, scars, Trace, Icon Risk, techniques, gear, and clearances.

The combat design target is a low-resolution tactical CRPG. Mandatory fights must be clearable by more than Firearms. Non-gun builds should win by changing the fight through tools, positioning, machines, morale, treatment, containment, stealth, or preparation.

Religion is not magic. Doctrine, Command, Purgation Tools, and Containment can change who obeys, who hesitates, what is safe, and how anti-Host tools are used. They do not cast spells.

## Current Attack Resolution Slice

The runtime now resolves player and NPC attacks through a visible hit chance
and a small skill-based damage bonus.
The chance is clamped from 10% to 95%, so combat keeps some uncertainty without
making perfect or impossible shots common.

Current formula:

- Base chance: 70%.
- Skill: half the difference between attacker field rating and defender field rating.
- Ranged distance: -4% per tile beyond the first.
- Cover: -15% for light cover, -30% for hard cover.
- Attacker wounds: -10% at half health or worse, -20% at quarter health or worse.
- Situational modifiers: Sneak openings currently add +25%. Aimed Shot adds +15%.

Current damage scaling:

- Base weapon damage is never reduced by skill.
- Damage uses `damageField` when an attack defines it, then `accuracyField`,
  then Firearms for ranged attacks or Melee for close attacks.
- Skill bonus starts only above rating 35.
- The bonus is +1 damage per 20 rating points above 35.
- Skill bonus is capped at +4 damage.
- Multipliers such as Sneak Attack and Aimed Shot apply to base weapon damage
  first, then skill bonus is added.

Field mapping:

- An attack can set `accuracyField`; otherwise ranged attacks use Firearms and
  melee attacks use Melee.
- An attack can set `defenseField`; otherwise ranged defense uses Stealth and
  melee defense uses the better of Melee or Unarmed.

Transparency rules:

- HUD action text shows the current attack chance or a failure state such as
  `NO SHOT`.
- HUD action text also shows final damage as `D#`.
- HUD target text appends `LIGHT COVER` or `HARD COVER` when cover affects the
  selected shot.
- Context attack rows show chance and damage in the label, with compact
  modifiers on the second line.
- Hover text shows chance and damage before attack confirmation.
- Combat log lines report hit or miss, chance, roll, compact modifiers, and
  skill damage bonuses when they apply.

Cover comes from `src/render/spriteCatalog.js` by prop kind, with optional
level JSON overrides using `cover: "none"`, `"light"`, or `"hard"`. Ranged
line of fire can return `No shot` when a blocking cell is between attacker and
target. Blocking cover adjacent to the target can reduce hit chance instead of
fully denying the shot.

## Current Technique and Status Slice

The runtime supports the current learned technique set from `data/techniques/`.
Technique availability is still content-driven through progression requirements,
but the combat effects are implemented in `src/core/game/GameCombatRuntime.js`
and small combat modules.

Active techniques:

- `aimed-shot`: spends 1 extra AP on a firearm attack, adds +15 hit chance,
  and multiplies base weapon damage by 1.25 before skill damage.
- `study-target`: spends 2 AP against a visible enemy within 6 tiles. It applies
  `studied`, which adds hit chance and damage for the player's later attacks against
  that target. Better Search or Host Signs extends and improves the mark.
- `field-measure`: spends 1 AP to apply `prepared`. The next player attack gains
  hit chance and damage, then consumes the status.
- `overwatch`: spends 2 AP and requires a firearm. It stores a one-round firing
  watch on a target or tile, then fires a reaction shot when a matching hostile
  acts or enters the watched tile.
- `trip-mine`: spends 3 AP to place a persistent mine on a nearby free tile. An
  enemy who steps onto it takes Engineering or Security-scaled damage and gains
  `snared`, which raises movement AP cost for the rest of that turn.
- `burn-line`: spends 3 AP to lay burning ground across up to three tiles in a
  straight, diagonal, or isometric lane. It can be aimed at an occupied enemy
  cell. Enemies in the lane take damage and gain `burning`.
- `shove`: spends 2 AP against an adjacent enemy. It pushes the target one tile
  away if the destination is free, or staggers the target in place. Either
  result applies `off-balance`.
- `guard-break`: spends 3 AP on a close attack at reduced damage. A hit applies
  `guard-broken`, making later attacks easier.
- `stabilize`: spends 2 AP to remove immediate bad statuses from the player and
  heal a small amount.
- `field-stimulant`: spends 1 AP once per encounter to gain AP immediately. It
  also applies locked stimulant `fatigued`, so the burst has a combat cost.
- `name-the-error`: spends 2 AP against a human-like enemy within 5 tiles. It
  applies `rattled` and drains 1 AP. Host forms do not respond to it.
- `stilling-litany`: spends 2 AP against a Host enemy within 5 tiles. It applies
  `suppressed` and drains 1 AP. Human-like enemies do not respond to it.
- `rally`: spends 2 AP to clear morale pressure from the player, refund 1 AP,
  and apply `rallied`.
- `feint`: spends 2 AP against an adjacent human-like enemy and applies
  `off-balance`.
- `wire-snare`: spends 2 AP against an enemy within 4 tiles. It drains 1 AP,
  applies `snared`, and leaves the target `off-balance`.
- `censure-spark`: spends 2 AP against an enemy within 4 tiles. It deals 1
  damage and applies `burning`; Host enemies burn longer.
- `fade-back`: spends 2 AP to move up to 2 tiles to a valid tile and apply
  `faded`.
- `seal-tile`: spends 2 AP to place a short-lived containment hazard on a free
  tile or occupied enemy cell. It drains AP and applies `sealed`, with stronger
  AP loss against Host enemies.
- `quarantine-line`: spends 3 AP to place a short lane of containment hazards.
  It can be aimed at an occupied enemy cell. Crossing it drains AP and applies
  `suppressed`.

Passive techniques:

- `case-file`: improves `study-target`, extends the mark, and refunds 1 AP after
  the study resolves.
- `steady-hands`: offsets wound accuracy penalties while the actor is at half
  health or worse.
- `hard-seal`: makes player-created burn lines last longer.
- `riposte`: lets the player make one free close counterattack per round after
  an adjacent enemy misses.
- `surgeons-nerve`: improves `stabilize` and adds `braced`.
- `low-step`: makes the player's first combat move each round cost 1 less AP
  and lets the player ignore non-mine combat floor hazards.
- `ambush-mark`: marks a surviving target with `studied` after a successful
  sneak opening.

Runtime statuses:

- `studied`: attack modifier against the marked target.
- `burning`: start-of-turn damage over a short duration.
- `snared`: extra movement AP cost while it lasts.
- `overwatch`: player-held reaction state that lapses when the player's next
  turn begins or when it fires.
- `guard-broken`: hit chance bonus for later attacks against the target.
- `off-balance`: smaller hit chance bonus for later attacks against the target.
- `rattled`, `suppressed`, and `fatigued`: hit chance penalties that come from
  pressure, containment, or stimulant debt.
- `rallied`, `braced`, and `prepared`: short player hit chance bonuses.
- `faded`: hit chance penalty for enemies attacking the faded actor.
- `stimmed`: once-per-encounter bookkeeping for `field-stimulant`.
- `sealed`: short movement AP penalty from containment.
- `low-step-spent` and `riposte-spent`: hidden per-round bookkeeping statuses.

Combat hazards are encounter state, not saved level content. They clear when an
encounter ends or a new encounter starts. Current types are `trip-mine`,
`burning-ground`, `sealed-tile`, and `quarantine-line`.

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
