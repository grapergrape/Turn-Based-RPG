# Enemy Factions

This file documents hostile and potentially hostile groups for encounter design. These are not moral alignments. Most human factions can be allies, patrons, neutral parties, or enemies depending on player choices.

The full canon lives in `docs/lore/the_host_story_bible.md`. Host enemies must follow `docs/LORE_INTEGRATION.md`: every Host form should answer what damnation-role the Vale Imprint forced the victim into.

## Encounter Principles

- Human enemies should have practical goals: seize evidence, protect roads, stop infection, steal medicine, open gates, or enforce quarantine.
- Host enemies should express a former identity twisted through the Vale Imprint.
- Not every enemy needs to be killed. Some encounters should support retreat, negotiation, rescue, containment, or mercy.
- Faction reputation should eventually determine which groups become hostile in the field.
- Avoid "monster closets." Encounters should imply what happened before the player arrived.

## The Host

**Default hostility:** Usually hostile, sometimes stationary, wounded, confused, or bound to a location.
**Narrative role:** The central biological and symbolic threat.
**Encounter roles:** Tanks, panic casters, area denial, summoners, ambushers, stationary hazards, tragic mercy choices.

The Host is the Earthborn alien organism descended from the sample that infected Father Marius Vale. It is not a zombie faction. Its forms are infernal icons grown from human material: bone halos, fused prayer-hands, wet scripture-like nerves, black-gold tissue, thorn growths, false wings, bell organs, vestment-like flesh, and ship-metal relics embedded in bodies.

Common families:

- **Penitent Bastions:** Former protectors forced into armored defensive roles.
- **False Saints:** Former clergy or prophets whose blessings infect and whose hymns organize lesser Host forms.
- **Madonnas of Ash:** Former caregivers who preserve corpses, victims, and objects with horrific tenderness.
- **Scholastic Heretics:** Former scientists or teachers who dissect, analyze, and alter.
- **Thuribles:** Hanging vapor-organisms that induce visions and panic.
- **Choir Larvae:** Small incomplete transformations that repeat the dead.
- **Judges:** Tribunal bodies that accuse targets, possibly using player choices.
- **Seraphim Wrecks:** Rare crash-site forms made from pilots, astronauts, and ship debris.

Current data examples:

- `data/enemies/host-touched-penitent.json`
- `data/enemies/host-penitent-bastion.json`

## Choir of the Open Wound

**Default hostility:** Hostile when performing rites, opening gates, protecting Host sites, or pursuing Vale relics.
**Narrative role:** Human collaborators with infection who can still shelter outcasts.
**Encounter roles:** Cult speakers, knife defenders, contaminated martyrs, ritual chanters, Host handlers, gate saboteurs.

The Choir calls infection confession and Host forms icons. Its members may be gentle, articulate, and visibly compassionate before the player understands the cost. They should not fight like generic cultists; their tactics should center on exposure, panic, consent manipulation, and opening spaces that other factions sealed. It is a recent and poorly understood movement, not one of the old road-cults; field agents encounter it as an unknown to be pieced together, and even its name should land as a discovery rather than a given.

Possible units:

- **Open Wound Cantor:** Buffs Host creatures through hymns and destabilizes party morale.
- **Gate Mother:** Saboteur who opens quarantine doors, prison locks, and refugee shelters.
- **Relic-Bearer:** Carries living Host tissue in sealed reliquaries.
- **Confession Knife:** Fast melee defender whose attacks raise infection risk.
- **Almost-Icon:** A voluntary Stage II cultist who may transform mid-encounter.

## Ash Cartels

**Default hostility:** Common early-game enemies, but often negotiable.
**Narrative role:** Road power, black market, logistics, exploitation, survival economics.
**Encounter roles:** Raiders, smugglers, ambushers, vehicle crews, snipers, hostage-takers, scavengers.

Cartel enemies should usually want something concrete: tolls, medicine, relics, witnesses, fuel, maps, or leverage. Some cartel encounters should become non-hostile if the player pays, bargains, invokes reputation, or exposes a greater threat.

Known groups:

- **Red Tithe:** Raider army using false religious authority. Current data includes `data/enemies/red-tithe-cutthroat.json`.
- **Morrow Chain:** Disciplined caravan cartel. Potential allies or enemies through Mara Vey.
- **Saintbreakers:** Ex-Remnant relic thieves and secret sellers.
- **Laughing Knives:** Quarantine looters who use sound lures to redirect Host creatures.

Possible units:

- **Red Tithe Cutthroat:** Early melee raider.
- **Tithe Gunner:** Suppresses movement from cover.
- **Relic Fence:** Non-boss support unit using stolen tech or contaminated objects.
- **Sound-Lure Scavenger:** Redirects Host creatures toward the player or rival factions.
- **Chain Warden:** Morrow Chain enforcer who protects convoys and punishes contract breaches.

## Holy Remnant

**Default hostility:** Conditional. Hostile if the player hides carriers, exposes forbidden records, aids the Choir, or defies purge orders.
**Narrative role:** Order, protection, faith, censorship, execution, authoritarian containment.
**Encounter roles:** Inquisitors, shield lines, fire teams, exorcist medics, confession officers, purge columns.

Remnant enemies should be disciplined and frightening because their methods often work. Their combat should emphasize formation, fire, morale control, quarantine tools, and legal authority.

Possible units:

- **Remnant Gate Guard:** Standard soldier, disciplined formation fighter.
- **Mercy Confessor:** Support unit that stabilizes allies and interrogates enemies.
- **Iron Penitent Flamer:** Area-denial unit for anti-Host purges.
- **Confession Seal Officer:** Marks targets, debuffs panic, and records "heresy."
- **Reliquary Hound:** Sensor-bearing animal or machine trained to detect contamination.

## Lumen Compact

**Default hostility:** Conditional. Hostile if the player blocks research, steals samples, exposes experiments, or threatens Meridian Vault.
**Narrative role:** Knowledge, medicine, containment, experimentation, utilitarian cruelty.
**Encounter roles:** Field researchers, security teams, drones, suppressant specialists, lab hazards, escaped subjects.

Compact enemies should feel clinical rather than fanatical. They use sedation, containment foam, sensor mines, automated doors, drones, and targeted debuffs. Their worst encounters may include victims they created.

Possible units:

- **Compact Field Security:** Rifles, stun batons, containment orders.
- **Suppressant Technician:** Reduces Host hazards but can debuff living targets.
- **Archive Drone:** Small machine unit that scans, marks, and seals doors.
- **Ascension Subject:** Host-integrated test subject with unstable abilities.
- **Lazarus Surgeon:** Boss-adjacent support unit that "repairs" enemies in disturbing ways.

## Penitent Engines

**Default hostility:** Conditional. Hostile if the player shelters those marked for execution, steals relic fuel, opposes the Black Reliquary, or backs the Choir.
**Narrative role:** Anti-Host militarism, self-mutilation, duty, protection through terror.
**Encounter roles:** Heavy tanks, artillery monks, walking cover, suppression, pursuit enemies.

Penitent Engine encounters should feel costly. They are not common bandits. A single Engine should change the tactical map. Their weakness should be rigidity, fuel dependence, limited mobility in tight spaces, and doctrine.

Possible units:

- **Engine Novice:** Lightly augmented melee or gun unit.
- **Vox-Penitent:** Morale and suppression support through battle-cants.
- **Reliquary Gun-Monk:** Heavy ranged unit with reload windows.
- **Filter-Lung Breacher:** Anti-gas, anti-Hazard assault unit.
- **Iron Prior:** Heavy commander who punishes retreat and hesitation.

## Free City Militias

**Default hostility:** Conditional and local.
**Narrative role:** Civic defense, border disputes, panic, gate politics.
**Encounter roles:** Militia patrols, gate guards, barricade defenders, desperate citizens, rooftop snipers.

Free City militias should rarely feel like villain armies. They are frightened people with walls to protect. Hostility may come from forged papers, resource scarcity, quarantine law, faction pressure, or the player bringing danger to their gates.

Possible units:

- **Gate Militia:** Spear, rifle, shield, or barricade fighter.
- **Roof Watcher:** Long-range overwatch in dense urban maps.
- **Water Ledger Guard:** Protects wells, pumps, or ration offices.
- **Volunteer Fire Line:** Anti-Host civilian defenders with fragile morale.

## Bloomborn Hostility

**Default hostility:** Rare. Bloomborn should not be treated as an enemy faction by default.
**Narrative role:** Personhood under suspicion, rights, fear, unstable transformation risk.
**Encounter roles:** Desperate defenders, coerced assets, fugitives, infection-risk set pieces.

Bloomborn can fight the player if cornered, hunted, coerced by another faction, or destabilized by Host exposure. They should usually be characters first and combatants second.

Possible hostile cases:

- A Bloomborn community defending itself from a purge.
- A Compact-registered detection asset forced into combat.
- A Stage II Bloomborn losing control near active Host tissue.
- A Choir cell manipulating rejected Bloomborn into "completion."

## Environmental and Old-World Threats

Some hostile encounters are not factions:

- Failing quarantine machinery.
- Corrupted machine choir broadcasts.
- Orbital mirror heat surges.
- Sealed Ecclesiate defense systems.
- Contaminated relic fields.
- Host-reactive weather or flood cycles.

These hazards should carry history. A trap is more interesting if it was once a hospital door, shrine alarm, defense grid, weather engine, or rescue protocol.
