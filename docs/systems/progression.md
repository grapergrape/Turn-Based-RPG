# Progression System

Design status: selected character-sheet direction, not yet implemented in runtime data or code.

This game should not use SPECIAL, Dungeons & Dragons ability scores, free point-buy attributes, or generic fantasy classes. Character creation should build a person from the setting: where they come from, what field work they can do, what damaged them, what they believe, and who can pressure them.

The working system is **Five Keeps and Seven Virtues**.

## Design Goals

- Give each build enough numbers to feel distinct in combat, exploration, dialogue, and contamination pressure.
- Keep character creation package-based, not free point allocation.
- Tie the sheet to the Solar Ecclesiate's religious culture without requiring every character to be personally devout.
- Let The Host attack identity, guilt, faith, fear, and memory instead of only hit points.
- Make faction backgrounds matter through access, duties, suspicion, and liabilities.
- Keep the system data-driven later, with origins, roles, scars, vows, techniques, and liabilities as content definitions.

## Character Sheet

A full character sheet has these parts:

- **Origin:** social background and early training.
- **Field Role:** the character's practical job in the squad.
- **Scar:** a past wound that gives a benefit, a risk, and a trigger.
- **Vow:** the line the character tries not to cross.
- **Liability:** an external claim, debt, secret, or threat.
- **Keeps:** five numeric survival stats rated 1 to 10.
- **Virtues:** seven religious-cultural ratings from 0 to 5.
- **Trace:** contamination pressure from 0 to 5.
- **Icon Risk:** what the Vale Imprint may force this person to become.
- **Techniques:** active and passive abilities from role, training, factions, scars, and vows.
- **Clearances:** faction permissions, papers, rites, medical tags, route rights, or black-market recognitions.

## No Point Buy

Players should not assign a pool of points into Keeps or Virtues.

Creation uses packages:

1. Choose an **Origin**.
2. Choose a **Field Role**.
3. Choose a **Scar**.
4. Choose a **Vow**.
5. Choose a **Liability**.
6. Choose one starting **Training** package if the campaign needs more build choice.

Each package changes ratings, grants tags, unlocks techniques, and adds access or pressure.

Example:

```text
Origin: Cartel Roadblood
+2 Breath, +1 Bond, +1 Witness
Access: cartel toll codes, road gossip, black-market guides
Pressure: legal authorities distrust you

Field Role: Quarantine Scout
+1 Breath, +1 Memory
Technique: Read the Road
Technique: Smoke and Signal

Scar: Left Someone Outside
+1 Will, +1 Fortitude, -1 Bond
Trigger: evacuation scenes create stress, but you act faster when a gate is closing

Vow: The Road Must Stay Open
Anchor Virtue: Mercy or Witness
Once per mission, protect a Keep when defending travel, evacuation, or refugees

Liability: Morrow Chain Claim
The Morrow Chain can demand payment, silence, or route work
```

The engine still receives numbers. The player earns those numbers through character choices rather than abstract allocation.

## Five Keeps

Keeps are practical survival stats rated **1 to 10**. A normal trained adult starts around 4 or 5. A starting specialist may have one Keep at 7 or 8. A rating of 9 or 10 should be rare and usually tied to cybernetics, elite training, Host alteration, or major story progression.

### Flesh

Wounds, strength, endurance, carrying capacity, pain tolerance, melee survival, and resistance to physical hazards.

Used for:

- Holding a barricade.
- Surviving a blast, fall, or crush.
- Wearing heavy armor.
- Carrying a wounded companion.
- Fighting through injury.

### Breath

Movement, recovery, action economy, stamina, steadiness under pressure, and the ability to keep acting while panic rises.

Used for:

- Crossing fire lanes.
- Taking extra movement.
- Recovering from stagger or suppression.
- Keeping calm while contaminated air, bells, or smoke fill a room.
- Acting before a door, bridge, or quarantine seal closes.

### Memory

Knowledge, identity, investigation, pattern recognition, technical recall, and resistance to Host rewriting.

Used for:

- Reading old Ecclesiate systems.
- Identifying Host signs.
- Resisting false memories.
- Decoding archives.
- Remembering routes, laws, names, rites, and machine-choir commands.

### Bond

Trust, leadership, social leverage, faction access, morale, companion support, and the ability to make people act together.

Used for:

- Rallying civilians.
- Negotiating with militias, cartels, doctors, priests, or refugees.
- Giving squad orders.
- Taking social risks for another person.
- Calling favors from contacts.

### Will

Conviction, discipline, fear resistance, vow strength, refusal, and the ability to finish hard actions when the body or group wants to stop.

Used for:

- Resisting panic.
- Holding a vow under pressure.
- Refusing Choir influence.
- Continuing a ritual, surgery, or repair under threat.
- Standing against authority, guilt, or despair.

## Keep Conditions

Each Keep has a numeric rating and a current condition. The rating describes capability. The condition describes damage or pressure.

Use five conditions:

```text
Clear -> Taxed -> Strained -> Fractured -> Broken
```

- **Clear:** no penalty.
- **Taxed:** minor cost or cooldown on demanding uses.
- **Strained:** the Keep works, but failures create added risk.
- **Fractured:** the Keep works only with penalties, support, gear, or a hard choice.
- **Broken:** the Keep causes a crisis, disables options, or forces an immediate consequence.

Examples:

- **Flesh 8, Fractured:** still strong, but bleeding, limping, or overloaded.
- **Memory 7, Strained:** can decode an archive, but Host whispers may attach a false detail.
- **Bond 3, Clear:** socially limited but not currently compromised.
- **Will 5, Broken:** normal discipline has collapsed; the character may flee, freeze, confess, or break a vow.

## Seven Virtues

The Solar Ecclesiate ruled human culture for centuries. Its moral vocabulary survived even in secular cities, Compact labs, cartels, and anti-Remnant movements. Virtues are not goodness scores. They show how a character has been trained to survive, justify choices, resist fear, and understand the self.

Virtues are rated **0 to 5**.

- **0:** absent, rejected, or untrained.
- **1:** weak habit.
- **2:** ordinary adult habit.
- **3:** trained or reliable.
- **4:** defining trait.
- **5:** dangerous, saintly, fanatical, or story-defining.

### Temperance

Restraint, self-control, rationing, addiction resistance, and refusal to act from panic.

Used for:

- Resisting panic impulses.
- Handling scarce supplies.
- Avoiding reckless violence.
- Suppressing symptoms long enough to seek help.
- Keeping a contaminated relic sealed.

### Fortitude

Courage, pain tolerance, endurance, holding ground, and the refusal to collapse under threat.

Used for:

- Holding a gate.
- Withstanding injury.
- Staying in formation.
- Continuing through fear gas, bells, or Host shrieks.
- Protecting someone while surrounded.

### Mercy

Healing, sparing, sheltering, de-escalation, and the decision to treat a person as a person when law or fear says otherwise.

Used for:

- Stabilizing victims.
- Calming civilians.
- Earning trust from refugees or Bloomborn.
- Refusing purge orders.
- Preventing companions from crossing a line.

### Obedience

Hierarchy, ritual correctness, command discipline, legal standing, and the ability to function inside institutions.

Used for:

- Passing Remnant inspection.
- Following formation orders.
- Performing formal rites.
- Using rank, papers, or doctrine.
- Staying steady when command is clear and fear is high.

### Witness

Truth-telling, investigation, confession, record-keeping, memory discipline, and the refusal to let convenient lies replace evidence.

Used for:

- Finding contradictions.
- Recording testimony.
- Decoding mission logs.
- Confessing without collapsing.
- Proving what a faction wants buried.

### Contrition

Guilt, repentance, self-knowledge, humility, and the ability to face one's own failure without denial.

Used for:

- Resisting the Vale Imprint by naming the guilt it is using.
- Surviving confession scenes.
- Repairing companion trust after betrayal.
- Seeing through Choir manipulation.
- Accepting a cost instead of hiding it.

### Zeal

Fervor, momentum, intimidation, sacrifice, battle focus, and the ability to push beyond normal limits.

Used for:

- Charging through danger.
- Intimidating enemies.
- Leading a desperate assault.
- Powering harsh rites, battle-cants, or Penitent Engine discipline.
- Acting when hesitation would kill people.

## Faction Readings of Virtue

Virtues should change how factions read the character.

- **Holy Remnant:** values Obedience, Contrition, Fortitude, and controlled Zeal. It distrusts high Witness when Witness threatens doctrine.
- **Lumen Compact:** values Witness, Temperance, and Fortitude. It distrusts Zeal and treats Contrition as useful only when it produces testimony.
- **Free Cities:** value Mercy, Witness, Temperance, and practical Bond. They distrust Obedience when it smells like outside rule.
- **Choir of the Open Wound:** twists Mercy, Contrition, and Zeal into arguments for transformation.
- **Penitent Engines:** value Obedience, Fortitude, and Zeal. They distrust Mercy when it delays containment.
- **Ash Cartels:** value Temperance, Witness, Breath, and selective Mercy. They distrust Obedience unless they can buy it.
- **Bloomborn communities:** value Mercy, Witness, and Temperance. They distrust Contrition when it becomes self-hatred.

## Action Pairing

Most checks should combine one Keep with one Virtue. The Keep says what part of the character is acting. The Virtue says how they hold themselves under pressure.

Examples:

```text
Hold a barricade: Flesh + Fortitude
Run a closing gate: Breath + Fortitude
Calm panicked civilians: Bond + Mercy
Pass a Remnant inspection: Bond + Obedience
Decode a mission archive: Memory + Witness
Resist Host whispers: Will + Temperance
Confess guilt without breaking: Will + Contrition
Lead a desperate breach: Bond + Zeal
Perform field surgery under fire: Memory + Mercy
Carry a relic without opening it: Flesh + Temperance
```

Role techniques, equipment, conditions, faction access, and scene context modify the result. The exact math can wait until combat and dialogue systems need it.

## Trace

Trace measures Host contamination and Host attention. It is separate from Keeps and Virtues.

```text
0 Clean
1 Marked
2 Whispering
3 Confessing
4 Icon-Risk
5 Blooming
```

### 0 Clean

No active contamination. The character can still be afraid, exposed to rumor, or politically suspected.

### 1 Marked

The character has a minor sign, suspected exposure, contaminated gear, or a medical flag. Host tissue may react to them at close range.

### 2 Whispering

The character hears, smells, dreams, or senses things that others miss. This can reveal Host signs, but it can also feed false signals into Memory and Will.

### 3 Confessing

The Host begins targeting Scar, Vow, guilt, shame, and identity. Contrition, Witness, and Temperance matter more at this stage.

### 4 Icon-Risk

The character's likely damnation-role becomes mechanically visible. Their highest Virtues, lowest Keeps, Scar, and Vow point toward a Host form.

### 5 Blooming

The character is at the edge of becoming an Icon or joining a Host structure. Recovery should require major intervention, sacrifice, or a story-level cure.

## Icon Risk

Icon Risk is what the Vale Imprint may force the character to become. It is not the character's class.

Possible links:

- High Obedience plus protector identity: **Penitent Bastion**.
- High Mercy plus caregiver identity: **Madonna of Ash**.
- High Witness plus scholar identity: **Scholastic Heretic**.
- High Contrition plus religious identity: **False Saint**.
- High Zeal plus command identity: **Judge** or crusader variant.
- High Breath plus scout, pilot, or crash identity: **Seraphim Wreck**.
- High Bond plus civic authority: **Tribunal**.

Icon Risk should be visible enough for the player to fear it, not so fixed that the player feels railroaded. Scars, vows, choices, and treatment should redirect risk.

## Origins

Origins define early life, social access, suspicion, and starting ratings. These are examples, not the final list.

### Free City Gateborn

- Keeps: +1 Bond, +1 Breath.
- Virtues: +1 Temperance or +1 Witness.
- Access: Free City militias, gate ledgers, refugee politics.
- Pressure: outside factions treat you as provincial or disloyal.

### Remnant Raised

- Keeps: +1 Will, +1 Memory.
- Virtues: +1 Obedience, +1 Contrition.
- Access: rites, confession law, Remnant etiquette.
- Pressure: Remnant authorities expect compliance.

### Compact Trained

- Keeps: +1 Memory, +1 Breath.
- Virtues: +1 Witness, +1 Temperance.
- Access: lab procedure, instruments, medical triage, old archives.
- Pressure: Compact superiors may claim your findings or your body.

### Cartel Roadblood

- Keeps: +2 Breath, +1 Bond.
- Virtues: +1 Witness.
- Access: toll codes, smugglers, route gossip, black-market contacts.
- Pressure: legal authorities and victims of cartel violence distrust you.

### Penitent Initiate

- Keeps: +1 Flesh, +1 Will.
- Virtues: +1 Fortitude, +1 Obedience.
- Access: Penitent battle-cants, armor familiarity, anti-Host field doctrine.
- Pressure: people hide their sick when they see your marks.

### Bloomborn Survivor

- Keeps: +1 Memory or +1 Breath.
- Virtues: +1 Witness or +1 Mercy.
- Access: Host signs, Bloomborn networks, hidden symptoms.
- Pressure: Trace starts at 1, or one Keep starts Taxed.

## Field Roles

Field Roles are professions for the squad. Each role should grant techniques, equipment familiarity, and one complication.

### Quarantine Scout

Reads terrain, signs, tracks, quarantine marks, and ambush routes.

- Keeps: +1 Breath, +1 Memory.
- Techniques: Read the Road, Mark Safe Ground.
- Equipment: flares, chalk, light blades, field mask.
- Complication: first through doors, first to see what went wrong.

### Mercy Confessor

Controls panic, performs rites, stabilizes victims, and negotiates moral authority.

- Keeps: +1 Bond, +1 Will.
- Virtues: +1 Mercy.
- Techniques: Stabilizing Litany, Last-Rite Command.
- Equipment: rite tags, censor-mask, field burner, medical satchel.
- Complication: religious authorities expect obedience; victims expect mercy.

### Vault Surgeon

Treats wounds, studies infection, reads bodies, and handles triage.

- Keeps: +1 Memory, +1 Will.
- Virtues: +1 Witness or +1 Temperance.
- Techniques: Field Surgery, Suppressant Dose.
- Equipment: surgical kit, sample tins, injector.
- Complication: the line between treatment and experiment is thin.

### Road Broker

Uses contacts, favors, route law, bribes, and negotiation.

- Keeps: +1 Bond, +1 Breath.
- Virtues: +1 Temperance or +1 Witness.
- Techniques: Call Favor, Price the Room.
- Equipment: papers, trade seals, hidden currency, coded maps.
- Complication: every favor has a claimant.

### Relic Handler

Works with contaminated objects, old tech, sealed systems, and dangerous salvage.

- Keeps: +1 Memory, +1 Flesh.
- Virtues: +1 Temperance.
- Techniques: Seal Relic, Wake Dead Circuit.
- Equipment: lead wraps, insulated tools, reliquary clamps.
- Complication: touching the past leaves marks.

### Iron Breacher

Breaks doors, holds lines, suppresses threats, and survives close contact.

- Keeps: +1 Flesh, +1 Will.
- Virtues: +1 Fortitude.
- Techniques: Brace Line, Forced Entry.
- Equipment: shield, heavy frame, breaching tool, close weapon.
- Complication: subtle solutions often fail once you arrive.

### Bloom Tracker

Reads Host signs, traces dormant tissue, senses unsafe silence, and finds paths through Bloom zones.

- Keeps: +1 Breath, +1 Memory.
- Virtues: +1 Witness or +1 Temperance.
- Techniques: Hear the Growth, Step Where It Sleeps.
- Equipment: filter veil, sample hooks, quiet boots.
- Complication: Host signs may read you back.

### Signalist

Uses radios, old networks, machine choirs, drone relays, and field electronics.

- Keeps: +1 Memory, +1 Bond.
- Virtues: +1 Witness.
- Techniques: Cut the Choir, Relay Order.
- Equipment: radio pack, signal nails, cracked tablet, relay wire.
- Complication: some signals answer in voices they should not have.

## Scars

Scars are past wounds with mechanical teeth. A Scar should give:

- one rating change,
- one trigger,
- one benefit under that trigger,
- one risk when the player avoids the Scar's truth.

Examples:

### Left Someone Outside

- Keeps: +1 Will, -1 Bond.
- Virtue: +1 Fortitude.
- Trigger: gates, evacuations, refugees, quarantine closures.
- Benefit: act early or protect a Keep when trying to save someone before a closing boundary.
- Risk: if the player abandons someone again, Bond becomes Strained or the Vow takes damage.

### Heard the Choir Beneath Sleep

- Keeps: +1 Memory.
- Virtue: +1 Witness, -1 Temperance.
- Trigger: Choir hymns, sleeping Host tissue, bells in sealed places.
- Benefit: detect active Host influence early.
- Risk: false memories can enter investigation results.

### Burned Under False Quarantine

- Keeps: +1 Flesh.
- Virtue: +1 Fortitude, -1 Obedience.
- Trigger: fire, Remnant orders, quarantine law.
- Benefit: resist pain, heat, and intimidation by purge officers.
- Risk: Remnant authority can push the character toward defiance even when cooperation would save lives.

### Compact Observation Subject

- Keeps: +1 Memory.
- Virtue: +1 Witness, -1 Mercy.
- Trigger: labs, medical tests, researchers, consent disputes.
- Benefit: recognize procedures, instruments, and false clinical language.
- Risk: the Compact has files, claims, or tracking tags.

### Road Debt in Blood

- Keeps: +1 Breath.
- Virtue: +1 Temperance, -1 Contrition.
- Trigger: cartel tolls, convoy routes, smuggler negotiations.
- Benefit: call a road favor once per act.
- Risk: the debt worsens unless repaid with money, silence, violence, or betrayal.

## Vows

A Vow is a moral anchor. It is not a passive personality note. The player can invoke a Vow once per mission to protect a Keep, resist panic, unlock a dialogue option, or push through failure when the Vow is directly at stake.

Breaking a Vow should grant an immediate practical advantage and a lasting cost.

Examples:

- **No One Left Outside:** protects Bond or Will during evacuations and rescue scenes.
- **Truth Before Doctrine:** protects Memory or Witness when a faction demands a lie.
- **No Experiments Without Consent:** protects Mercy or Witness during Compact medical choices.
- **The Road Must Stay Open:** protects Breath or Bond when defending travel, trade, or refugees.
- **Never Become an Icon:** protects Will or Temperance when Trace rises.
- **Steel Before Flesh:** protects Flesh or Fortitude when holding a line, but strains Mercy.
- **Mercy Before Fire:** protects Bond or Mercy when sparing the infected creates danger.

## Liabilities

Liabilities are external hooks. They give the world permission to push the character.

Examples:

- Wanted by the Mercy Courts.
- Registered Compact asset.
- Cartel debt marker.
- Hidden infected family member.
- Bloomborn symptoms worsening.
- Choir hymn embedded in memory.
- Penitent oath not fully severed.
- Forged citizenship papers.
- Stolen relic in sealed gear.

Liabilities should create quests, dialogue pressure, encounter complications, and faction reactions.

## Progression Rewards

Progression should not hand out generic stat points after every level. Use mission rewards and story choices.

Reward types:

- **Training:** learn a role technique or improve an existing one.
- **Keep Growth:** raise one Keep by 1 after repeated use, instruction, or story pressure.
- **Virtue Shift:** raise or lower a Virtue after a major choice.
- **Scar Evolution:** convert a Scar into a stronger benefit with a sharper risk.
- **Vow Deepening:** make a Vow stronger and harder to keep.
- **Vow Break:** gain a harsh branch after violating the Vow.
- **Faction Clearance:** gain access to gear, routes, courts, labs, rites, or black markets.
- **Trace Treatment:** reduce, stabilize, hide, or redirect Trace.
- **Icon Risk Shift:** move the likely Host form toward or away from a category.

Keep Growth should be slow. Virtue Shift should be tied to choices. Trace and Icon Risk should never feel like ordinary experience bars.

## Example Sheets

### Sister Ilyra Voss

```text
Origin: Remnant Raised
Field Role: Mercy Confessor
Scar: Sheltered the Condemned
Vow: Mercy Before Fire
Liability: Answerable to Remnant command

Keeps:
Flesh 4
Breath 5
Memory 6
Bond 6
Will 8

Virtues:
Temperance 3
Fortitude 4
Mercy 5
Obedience 3
Witness 3
Contrition 4
Zeal 2

Trace: 0 Clean
Icon Risk: False Saint or Madonna of Ash pressure if Mercy and Contrition are corrupted
```

### Mara Vey

```text
Origin: Cartel Roadblood
Field Role: Quarantine Scout
Scar: Road Debt in Blood
Vow: The Road Must Stay Open
Liability: Morrow Chain claim

Keeps:
Flesh 5
Breath 8
Memory 5
Bond 4
Will 4

Virtues:
Temperance 4
Fortitude 3
Mercy 2
Obedience 0
Witness 4
Contrition 1
Zeal 3

Trace: 0 Clean
Icon Risk: Relic-hunter variant or Penitent Bastion pressure if guilt hardens into guarding the road
```

### Lio

```text
Origin: Bloomborn Survivor
Field Role: Bloom Tracker
Scar: Born Under Quiet Tissue
Vow: I Am Not Your Specimen
Liability: Citizenship denied without registration

Keeps:
Flesh 4
Breath 7
Memory 7
Bond 3
Will 6

Virtues:
Temperance 4
Fortitude 3
Mercy 3
Obedience 0
Witness 5
Contrition 2
Zeal 1

Trace: 1 Marked
Icon Risk: Seraphim Wreck, Scholastic Heretic, or unknown Bloomborn branch depending on player choices
```

## Runtime Data Direction

Do not implement the whole system until a vertical slice needs it.

When implementation begins, prefer separate data files for:

- origins,
- field roles,
- scars,
- vows,
- liabilities,
- techniques,
- virtue definitions,
- trace stages.

Actor JSON can reference those IDs instead of embedding long prose. Runtime systems should calculate derived combat values from the selected packages.

## Open Questions

- What is the exact formula for combat resolution?
- Should Virtues affect only checks, or also unlock techniques?
- How many packages should a player choose at character creation?
- Can companions change Origin or Field Role, or only gain training?
- At what Trace stage does the UI reveal Icon Risk?
- Can a Vow be replaced, or only broken and rebuilt through a quest?
