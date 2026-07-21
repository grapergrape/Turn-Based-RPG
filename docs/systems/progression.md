# Progression System

Design status: selected character-sheet direction with a runtime slice implemented for actor JSON, derived ratings, validation, journal display, character customization, and level 1 primary assignment.

The player is not choosing a class or profession. The playable premise is fixed: an Ashen Censure field agent sent to find, judge, and destroy blasphemous Host-cults. Character creation defines the agent's aptitude, upbringing pressure, and scars. It does not redefine the job.

This system should feel readable like a classic low-resolution CRPG sheet without copying SPECIAL, Dungeons and Dragons, or a generic fantasy class list.

## Design Goals

- Support builds a player can actually main: gunhand, purifier, forensic investigator, engineer, field confessor, covert agent, plague surgeon.
- Keep primary attributes broad and simple.
- Keep field ratings concrete enough for combat, exploration, dialogue, and quest routing.
- Make scars the character's past made mechanical, not a perk list with a grim coat of paint.
- Keep religion non-magical. Religion affects doctrine, law, rites, morale, Censure authority, and anti-Host procedure. Damage comes from weapons, tools, machines, terrain, companions, and preparation.
- Keep progression data-driven later, with attributes, field ratings, scars, techniques, Trace, clearances, and gear defined as content.

## Sheet Layers

A full character sheet has these layers:

- **Primary Attributes:** seven ratings from 0 to 10.
- **Field Ratings:** 0 to 100 derived ratings used by checks.
- **Scars:** ranked history traits that modify ratings and unlock options.
- **Trace:** Host contamination and Host attention.
- **Icon Risk:** what the Vale Imprint may try to make from the character.
- **Techniques:** active or passive actions unlocked by gear, field ratings, scars, training, and faction access.
- **Clearances:** papers, rites, seals, route rights, lab access, black-market marks, and other social permissions.

Players do not spend points directly on 0 to 100 field ratings. They raise primaries, gain scars, equip gear, and learn techniques. Field ratings are calculated from those pieces.

## Primary Attributes

Primary attributes are rated from 0 to 10.

```text
0  broken, absent, or unable
2  poor
4  ordinary trained adult
6  strong professional
8  exceptional field agent
10 rare human peak or major alteration
```

### Body

Strength, endurance, pain tolerance, carry weight, recoil handling, armor burden, and surviving hard contact.

### Agility

Speed, reflexes, footwork, stealth movement, fine hand control, and acting before danger closes.

### Eye

Aim, perception, spatial reading, track sense, clue spotting, weak-point reading, and noticing what a room is trying to hide.

### Intelligence

Technical understanding, medicine, investigation, tactics, old-world systems, field repairs, and deduction.

### Religion

Doctrine, rites, Remnant law, heresy procedure, Censure authority, cult theology, and knowing when sacred language is being abused.

### Voice

Persuasion, command, interrogation, intimidation, lying, calming panic, and making people move when fear freezes them.

### Nerve

Fear control, pain discipline, panic resistance, steadiness near Host tissue, and the ability to act while the body wants to stop.

## Field Ratings

Field ratings are the numbers the game checks most often. They must be mainable. If a field cannot support repeated combat, exploration, dialogue, or quest-routing use, it should not exist as a field rating.

### Formula

Each field rating names three primary attributes. The engine dynamically assigns the weights from the character's current values:

```text
Field Rating = highest primary x4 + middle primary x3 + lowest primary x2
+ scar modifiers
+ gear modifiers
+ state modifiers
```

Cap the final value at 100.

There is no flat base bonus. A single high primary should make a character competent, not expert. A real specialist needs a cluster of supporting primaries.

Example:

```text
Firearms uses Eye + Agility + Nerve.

Eye 8, Agility 5, Nerve 3:
8 x4 + 5 x3 + 3 x2 = 53

Eye 8, Agility 7, Nerve 6:
8 x4 + 7 x3 + 6 x2 = 65
```

Tie rule: if tied attributes need ordering, use the field's listed order as the tie-breaker. The tie-breaker does not change which three attributes are used.

### Difficulty Bands

Use these bands for non-combat checks:

```text
25 routine
40 trained
55 hard
70 expert
85 severe
95 exceptional
```

Combat can use the same ratings, but it should also consider weapon accuracy, range, cover, armor, wounds, ammo, panic, enemy type, and current action points.

## Field Rating List

### Unarmed

```text
Body + Agility + Nerve
```

Fists, grapples, shoves, disarms, silent takedowns, and surviving without a weapon.

Combat identity: control bodies, knock enemies off lines, disable isolated targets, save ammo.

### Melee

```text
Body + Agility + Eye
```

Knives, clubs, blades, hooks, short polearms, and close execution tools.

Combat identity: ammo-free damage, finishing wounded enemies, close-room pressure.

### Firearms

```text
Eye + Agility + Nerve
```

Pistols, rifles, shotguns, aimed shots, reaction fire, and conventional gun handling.

Combat identity: reliable ranged damage, target selection, suppression through threat.

### Arc Weapons

```text
Intelligence + Eye + Religion
```

Old-world charge weapons, cell-rifles, beam cutters, coil tools, and sanctioned Ecclesiate weapon systems with rite locks or maintenance codes.

Combat identity: armor piercing, high risk power use, overheating, rare ammo, old-tech counters.

### Heavy Weapons

```text
Body + Eye + Nerve
```

Launchers, heavy burners, recoil tools, mounted guns, crew-scale weapons, and bulky salvage weapons.

Combat identity: area damage, suppression, opening barricades, high weight and ammo cost.

### Purgation Tools

```text
Religion + Body + Nerve
```

Censure burners, caustic sprayers, sealant lances, sanctified cutting gear, and formal anti-Host execution tools. These are tools, not miracles.

Combat identity: anti-Host fire, regeneration shutdown, hazard denial, controlled destruction.

### Engineering

```text
Intelligence + Agility + Body
```

Deployable drones, tripod turrets, field generators, repair rigs, barricade kits, and improvised systems.

Combat identity: spawn useful machines, prepare rooms, repair broken devices, create cover, control approaches.

### Stealth

```text
Agility + Eye + Nerve
```

Sneaking, hiding, shadowing, ambush entry, repositioning before combat, and avoiding patrols.

Combat identity: first-strike advantage, better positioning, combat avoidance, quiet kills when supported by Unarmed or Melee.

### Security

```text
Agility + Intelligence + Eye
```

Locks, traps, safes, reliquary catches, trip mechanisms, hidden releases, and secured doors.

Combat identity: traps, locked-door tactics, safe route access, pre-fight setup.

### Search

```text
Eye + Intelligence + Body
```

Hidden loot, tracks, staged scenes, secret doors, corpse clues, rubble checks, and physical evidence recovery.

Holding Tab during exploration highlights investigatable targets within range.
Below Search 40, the highlight reaches only adjacent tiles. From Search 40
through 90, every 10 points adds one tile, reaching seven tiles at Search 90.
Above Search 90, every additional 20 points adds another tile. The calculation
uses eight-direction tile distance and has no separate cap. Eye contributes
through the derived Search rating.

Combat identity: finds better routes, detects ambush signs, spots usable hazards before the fight starts.

### Medicine

```text
Intelligence + Body + Nerve
```

Healing, triage, field surgery, symptoms, corpse reading, suppressant use, and keeping hands steady when the body is wrong.

Combat identity: sustain, bleed control, anti-status care, keeping companions alive through long fights.

### Doctrine

```text
Religion + Intelligence + Voice
```

Rites, heresy law, cult texts, Remnant authority, formal argument, and knowing what a religious scene means to people.

Combat identity: rite disruption, cultist hesitation, legal authority before combat, dialogue routes that split or prevent fights.

Doctrine is not Host biology. It answers: what law, rite, lie, or belief is being used here?

### Host Signs

```text
Eye + Religion + Nerve
```

Living Host tissue, contamination tells, false corpses, dormant growth, transformation warnings, and recognizing when a sacred-looking thing is physically dangerous.

Combat identity: weak-point reading, regeneration tells, corpse-rising warnings, contamination avoidance, safer loot choices.

Host Signs is not heresy law. It answers: what is the Host doing here?

### Containment

```text
Intelligence + Religion + Body
```

Quarantine seals, burn lines, relic handling, exposure control, safe transport, and deciding what can be moved, cut, burned, or locked.

Combat identity: isolate enemies, seal hazards, deny infected tiles, handle dangerous relics safely.

### Speech

```text
Voice + Eye + Intelligence
```

Persuasion, bargaining, calming people, questioning witnesses, reading evasions, and getting information without force.

Combat identity: avoidance, delay, surrender routes, splitting groups, recruiting help before a fight.

### Command

```text
Voice + Religion + Nerve
```

Ordering crowds, intimidating enemies, rallying allies, using Censure office, keeping morale intact, and forcing action under panic.

Combat identity: companion coordination, morale pressure, panic control, surrender or scatter outcomes.

### Guile

```text
Voice + Agility + Religion
```

Lying, forged papers, false rites, misdirection, infiltration, passing inspections, and weaponizing ritual correctness for cover.

Combat identity: infiltration starts, faction disguise, getting enemies out of position before combat.

## Primary Coverage

The field list is not perfectly equal by raw count, because not every primary has the same kind of game impact. Intelligence, Eye, and Nerve appear often because combat, investigation, and survival are constant. Voice and Religion appear in fewer fields but control high-impact routes: authority, doctrine, guile, command, containment, and cult-facing decisions.

The formula prevents one primary from carrying too much. A character with Agility 10 and poor supports is agile in many fields, but not an expert in any of them. A specialist needs overlapping clusters plus scars and gear.

## Scars

Scars define the character's past and what the job has done to them. They are not just perks.

At character creation, the player has **3 Scar Points**. A starting scar can be bought at rank 1 or rank 2, but no starting scar can exceed rank 2.

Later, major quest consequences award Scar Points. Routine kills, loot, and filler objectives should not. Scar Points come from events that leave a mark:

- surviving Host exposure,
- saving or condemning infected civilians,
- breaking a Remnant order,
- obeying an order that costs lives,
- sparing a cultist,
- executing a cult leader,
- witnessing forbidden truth,
- losing a companion,
- accepting dangerous treatment,
- lying to protect people.

### Scar Structure

Every scar should define:

```text
id
name
ranks 1 to 5
tags
rating modifiers
dialogue unlocks
combat or exploration unlocks
costs or pressures
rank 3 branch
```

At rank 3, a scar should branch:

```text
Harden   stronger under pressure, colder or more feared
Heal     better at connection and recovery, less brutal
Exploit  turns the wound into power, but creates suspicion, risk, or Host attention
```

### Scar Dialogue Uses

Scars unlock dialogue in four patterns:

- **Relate:** connect to someone through shared damage.
- **Recognize:** identify a pattern because the character has lived it.
- **Pressure:** use the scar as social force.
- **Confess:** reveal the wound to change the scene.

Scar dialogue should not always be better. It should be different. A scar option can calm someone, frighten them, reveal a clue, start a fight early, lock out a gentler route, gain one faction's trust, or create suspicion elsewhere.

### Example Scars

#### Failed Quarantine

You once sealed the wrong door, opened the wrong one, or hesitated while people crossed the line.

- Rank 1: +5 Containment when sealing, burning, or locking a site.
- Rank 2: +5 Command during quarantine panic.
- Cost: rescue scenes can test Nerve harder.
- Dialogue: relate to guards, refugees, and families trapped behind a line.
- Rank 3 Harden: stronger Command in containment scenes. Refugees distrust you.
- Rank 3 Heal: stronger Speech with frightened civilians. Mass-sacrifice choices hurt more.
- Rank 3 Exploit: stronger intimidation during panic. Companions may react badly.

#### Heard the Choir Beneath Sleep

You heard a Choir hymn before you knew what the Choir was, and part of you still knows the cadence.

- Rank 1: +5 Host Signs around hymns, bells, and patterned breathing.
- Rank 2: unlocks recognition of call-and-answer rites.
- Cost: certain Host scenes can target you first.
- Dialogue: recognize Choir teaching before it is named.
- Rank 3 Harden: resist cult cadence better.
- Rank 3 Heal: relate to people tempted by the hymn.
- Rank 3 Exploit: mimic the cadence for Guile, with higher Trace risk.

#### Burned a False Saint

You killed something that still spoke like a person.

- Rank 1: +5 Purgation Tools against opened or staged Host victims.
- Rank 2: +5 Nerve-derived resistance against false-human pleading.
- Cost: mercy scenes can become harder.
- Dialogue: pressure cultists who expect you to kneel.
- Rank 3 Harden: better at finishing Host forms. Worse with survivors.
- Rank 3 Heal: better at identifying who can still be saved.
- Rank 3 Exploit: frighten cultists and civilians alike.

#### Cartel Road Childhood

Before Censure office, there were tolls, lies, safe wells, and ambush weather.

- Rank 1: +5 Guile with road papers, tolls, and smuggler codes.
- Rank 2: +5 Search or Stealth on road maps and travel encounters.
- Cost: Remnant officers distrust your papers if the past surfaces.
- Dialogue: relate to smugglers, caravan guards, and people who survived outside law.
- Rank 3 Harden: stronger Guile against officials.
- Rank 3 Heal: stronger Speech with refugees and road crews.
- Rank 3 Exploit: call road favors at a cost.

#### Compact Observation Subject

You were studied, tagged, treated, or used by people who called it necessary.

- Rank 1: +5 Medicine in labs, wards, and clinical evidence scenes.
- Rank 2: +5 Guile or Speech against clinical language and consent tricks.
- Cost: Compact systems or doctors may have leverage over you.
- Dialogue: relate to test subjects and expose false consent.
- Rank 3 Harden: stronger resistance to medical intimidation.
- Rank 3 Heal: better at protecting patients.
- Rank 3 Exploit: use Compact procedure to access restricted places.

## Trace

Trace measures Host contamination and Host attention. It is separate from field ratings.

```text
0 Clean
1 Marked
2 Whispering
3 Confessing
4 Icon-Risk
5 Blooming
```

Trace can unlock warnings, risks, and rare options. It should never behave like ordinary experience.

## Icon Risk

Icon Risk is what the Vale Imprint may force the character to become. It is not a class and not a reward tree.

Icon Risk should read from:

- Trace,
- major scars,
- repeated choices,
- strongest field identities,
- worst failures,
- treatment or contamination history.

Examples:

- A Command and Containment hardliner with Failed Quarantine may drift toward a Penitent Bastion pressure.
- A Medicine and Doctrine mercy build with repeated guilt may drift toward a False Saint or Madonna of Ash pressure.
- A Search and Host Signs investigator who keeps touching forbidden evidence may drift toward Scholastic Heretic pressure.

Icon Risk should create fear and story pressure, not force one predetermined ending.

## Progression Rewards

Use three reward tracks:

- **Level progression:** major objectives, quest completion, discoveries, and combat encounter clearance.
- **Technique progression:** active and passive technique points awarded on alternating levels.
- **Scar progression:** hard consequences and personal damage. Grants Scar Points.

The current level-up economy is:

```text
Level 2: 1 Active Technique Point
Level 3: 1 Passive Technique Point
Level 4: 1 Active Technique Point
Level 5: 1 Passive Technique Point and 2 Primary Points
Even levels: 1 Active Technique Point
Odd levels above 1: 1 Passive Technique Point
+2 Primary Points every 5 levels
Ordinary levels: no Primary Points
```

Starting primaries remain a 3/10 baseline in the system. After Ash Chapel and
the Act I briefing, the level 1 assignment screen gives 14 creation assignment
points with a starting cap of 7/10. This does not consume level-up Primary
Points.

Do not let the player grind Scar Points. Scars should come from decisions and
consequences, not repetition.

Technique points buy techniques that have already been unlocked by stat gates,
gear, scars, or faction access. They are not class picks. An Active Technique
Point buys an active technique. A Passive Technique Point buys a passive
technique.

## XP, Levels, and Builds

XP is cumulative and shared by the player character across level transitions.
The current runtime uses a simple threshold curve from `src/core/Progression.js`:

```text
Level 1: 0 XP
Level 2: 100 XP
Level 3: 300 XP
Level 4: 600 XP
```

If a level cap exists, it comes from progression configuration. If no cap is
configured, valid levels are any integer 1 or greater. Level-ups grant active
technique points, passive technique points, and rare Primary Points. The journal
now exposes a progression path for spending Primary Points on primaries and
technique points on eligible techniques.

Build profiles are guidance labels, not classes. The profession is already
fixed by the premise. A build says what a character is likely growing toward:
gunhand, purifier, engineer, investigator, field confessor, road ghost, plague
surgeon, breaker, or Host threat. Builds do not grant exclusive actions and do
not lock abilities. Runtime player progression no longer applies automatic
primary drift from build profiles. Enemy and NPC scaling can still use authored
levels, stats, build HP/AP scaling, complexity, and explicit bonuses.

Use authored or spent `primaryBonuses` when a quest, training scene, or player
spending raises a primary. Do not edit field ratings directly.

Tasks award XP through quest stages. A stage in `data/quests/*.json` can define
`xp`; the game pays it once when that stage is reached by a quest update. Initial
stages should not pay XP.

Combat XP is calculated per defeated enemy and summed for the cleared encounter:

```text
Enemy XP = round to nearest 5((15 + enemy level x 15) x complexity multiplier)
```

Complexity tiers live in `src/core/Progression.js`:

```text
minion x0.6
standard x1
hardened x1.35
elite x2
boss x4
```

Enemy JSON can override the calculated reward with `progression.xpReward`, but
use that sparingly. Prefer level plus complexity so rewards stay predictable.

## Techniques and Context Actions

The game has no classes. Gunhand, Purifier, Engineer, Investigator, Field
Confessor, Road Ghost, Plague Surgeon, and Breaker are build directions only.
They describe likely primary growth and technique choices. They never grant
exclusive attacks, and they never stop another build from learning a technique
when requirements are met.

Damage comes from tools and actions:

- Firearms deal ranged weapon damage through basic shoot actions and firearm techniques.
- Melee weapons deal close damage through basic melee actions and melee techniques.
- Purgation tools deal fire, sealant, caustic, or hazard damage through special techniques.
- Engineering and Security deal damage through traps, deployables, mines, and prepared devices.
- Search and Host Signs improve targeting, weak-point reads, ambush discovery, and safer setup.
- Medicine prevents defeat and handles status pressure more than it deals direct damage.
- Speech, Command, Doctrine, and Guile change who fights, when they fight, and under what pressure.

Basic gear actions are free. They do not require techniques:

- shoot with an equipped firearm,
- melee attack with an equipped melee weapon,
- reload,
- move,
- crouch,
- use item,
- bind wounds.

Techniques are special active actions or passive upgrades. They live in
`data/techniques/` and define:

```text
id
name
type: active or passive
targets
requirements
summary
```

Active techniques become context actions when known and relevant to the clicked
target. Passive techniques apply modifiers or conditional effects later and do
not appear as combat commands unless a future passive needs a toggle.

Right-click contextual menu rules:

- Right-click an enemy: show known offensive actions and basic attacks.
- Right-click self: show reload, healing, and known self actions.
- Right-click a tile: show movement and known setup or deploy actions.
- Right-click an object: reserve use, search, sabotage, and similar actions for later.
- Known but temporarily unavailable actions are shown greyed out with a reason.
- Unknown or unlearned techniques are hidden in combat.

Examples:

```text
Aimed Shot: active. Requires Firearms. Uses a firearm for a stronger shot.
Overwatch: active. Requires Firearms. Holds a lane for reaction fire later.
Burn Line: active. Requires Purgation Tools. Claims a short path with fire later.
Study Target: active. Requires Search or Host Signs. Reads a weakness later.
Trip Mine: active. Requires Engineering or Security. Places a trap later.
Steady Hands: passive. Requires Firearms and Nerve support.
Hard Seal: passive. Requires Containment.
```

## Runtime Data Direction

Do not implement every edge of this system until a playable slice needs it.

Current runtime slice:

- `src/core/Progression.js` defines primary attributes, field ratings, Trace stages, and the derived rating formula.
- `src/core/Progression.js` also defines XP thresholds, build profiles, XP rewards, and HP/AP stat scaling.
- `src/core/Progression.js` awards alternating Active and Passive Technique Points plus rare Primary Points.
- `src/core/TechniqueSystem.js` evaluates technique requirements and spends technique points.
- `data/techniques/*.json` defines active and passive techniques. `data/techniques/index.json` lists loadable definitions.
- `data/actors/*.json` and `data/enemies/*.json` can carry authored progression data.
- `scripts/check-content.mjs` validates actor, enemy, and technique progression data.
- The journal Character tab shows level, build, XP, Primary Points, Technique Points, Trace, scars, and field ratings.
- The journal Techniques tab shows known, available, and locked techniques and lets the player learn eligible techniques.
- The combat right-click menu shows basic gear actions and learned active techniques by target type.
- Quest stage updates award stage XP once, and combat victory awards summed enemy XP once per cleared encounter. Dialogue effects may grant explicit XP with `effects.xp`.
- Dialogue nodes and choices can gate on scars, scar ranks, Trace, and field rating minimums.

As this grows, prefer small data files for:

- primary attribute definitions,
- field rating definitions,
- scar definitions,
- technique definitions,
- trace stages,
- icon-risk tags,
- clearances.

Actor JSON can reference ids instead of embedding long prose. Runtime systems should calculate field ratings from primaries, scars, gear, and state modifiers.

Keep UI compact:

- show seven primaries,
- show the field ratings that matter to the current screen,
- hide the full list behind an advanced or character-sheet view,
- show scar unlocks only when they affect a real choice.

## Implementation Decisions

- The first character sheet screen shows seven primaries, current Trace, active scars, technique point pools, and the derived field ratings in the journal.
- Primary Point spending happens from the Character page. Technique spending happens from the Techniques page.
- Active techniques are combat commands. Passive techniques are persistent or conditional upgrades.
- Build profiles are not classes and do not unlock abilities by themselves.
- Companions use the same primaries, field ratings, scars, Trace, and Icon Risk, but their sheets are authored. Players do not spend creation points for companions.
- Icon Risk is hinted at Trace 2, partially named at Trace 3, and visible at Trace 4 unless a story scene reveals it earlier.
- Creation scars should come from upbringing, pre-game injury, old debts, and early Censure service. Earned scars should come from campaign consequences.
- No creation option can change the fixed job premise: the player is an Ashen Censure field agent.
