# Quests

The full campaign spine is canon in `docs/lore/the_host_story_bible.md`. This file breaks that spine into playable quest arcs, faction pressures, locations, and branching outcomes.

These are design docs, not runtime quest data. When quest JSON is added later, IDs should use lowercase kebab-case and stay close to the names below.

## Campaign Premise

The player leads a small field squad working along the borderlands between Free City territory and old Bloom zones. Their first major crisis is **Hallowfen**, the walled Earthside crash scar the Holy Remnant calls holy ground and every outlaw calls a chance.

Act I does not hand the player the full truth. It asks whether Hallowfen survives. The wider archive mystery begins after the Hallowfen decision, when a blackened data core from _Eschaton's Mercy_ is recovered and decoded. That core contains two voices: Father Marius Vale and Dr. Elian Sorell. Sorell's message reveals that the Stilling was not divine intervention, but a lock. The lock is failing. No one must find the priest.

The campaign asks what the player will do with truth when every faction can use it to save people and destroy people.

## Critical Path

### Prologue: Hallowfen Checkpoint

**Narrative purpose:** Make the first crash site personal before it becomes historical.
**Gameplay purpose:** Introduce checkpoint pressure, investigation, confiscation risk, first combat, escape play, and the Choir's plan for Hallowfen.

**Starting conditions:** The player squad is sent toward Hallowfen after the Remnant checkpoint towers on the wall stop answering their bells.

**Objectives:**

- Approach a Hallowfen wall checkpoint that still claims to be Remnant-held.
- Notice the false guards' repeated speech, dirty uniforms, hidden tattoos, and wrong ritual habits.
- Expose the Choir takeover through dialogue and fight at the gate, or submit to inspection and escape after the party is stripped in the back room.
- Recover the checkpoint boss's letter describing the Choir plan to seize the holy land and build a temple-capital at Hallowfen's heart.
- Enter Hallowfen through the captured checkpoint, which is the canon route, or find the nearby smuggler tunnel under the wall as an alternate route.

**Key characters:** Player, Mara Vey, checkpoint Choir boss, Hallowfen smugglers, scavengers, illegal settlers, possible first contact with Ilyra or Kael.
**Locations:** Hallowfen wall road, Remnant checkpoint, inspection back room, smuggler tunnel, first streets inside the wall.
**Branching outcomes:** The entry route affects starting gear, local trust, Remnant suspicion, and which Hallowfen groups believe the player came to save them rather than loot them.

### Act I: The Fate of Hallowfen

**Narrative purpose:** Decide whether the lawless holy land remains a living settlement or becomes the Choir's capital.
**Gameplay purpose:** Establish siege play, faction pressure, route choices, survivor decisions, early hub access, and reputation.

**Primary decision:** What happens to Hallowfen?

- Help Hallowfen break the siege and drive off the Choir attackers.
- Steer attackers away or evacuate selected people, saving some lives while leaving others behind.
- Leave Hallowfen to its fate. Later reports reveal the town was crucified upside down to decorate the Choir's new temple-capital.

**Required beats:**

- Search gambling dens, salvage stalls, illegal clinics, water infrastructure, shrine spaces, and barricades inside the wall.
- Decide which Hallowfen citizens count as citizens, criminals, witnesses, carriers, or liabilities.
- Cross quarantine checkpoints and road shrines beyond the wall.
- Encounter Remnant inquisitors, Compact field teams, Ash Cartel scouts, Bloomborn refugees, Hallowfen claim gangs, and Choir missionaries.
- See evidence of renewed Host activity: a Choir Tree speaking mission-log language, a child drawing Saint Origen from memory, a relic becoming dangerous again, and Penitent Engines marching toward Woundfall.
- Resolve Hallowfen's fate before the blackened data core becomes the next political problem.

**Transition to the archive plot:** After Hallowfen, the recovered data core forces the first main-lore decision: give it to the Holy Remnant, give it to the Lumen Compact, sell it in Veyr's Gate, or keep it. Decoding it reveals enough to point toward three archive coordinates.

**Early playable slice connection:** `data/levels/ash_chapel_breach.json` functions as an Ash Roads side encounter and tutorial combat space. It foreshadows Hallowfen through a Choir cell, overheard teachings, a private altar rite, and a ledger that says the Hallowfen wall checkpoints have stopped answering tower bells. The slice should not name Father Vale, reveal Sorell, explain the data core, or confirm why anyone is changing.

### Act II: The Three Witnesses

**Narrative purpose:** Turn the story from outbreak mystery into historical conspiracy.
**Gameplay purpose:** Give the player three major quest lines that can be approached in variable order.

#### The First Witness: The Surgeon's Gospel

**Location:** Meridian Vault sealed lower laboratory.
**Faction pressure:** Lumen Compact.

The archive fragment contains medical footage from _Eschaton's Mercy_. It proves early secondary infections did not all become Hell-like immediately. Some showed unstable, beautiful, alien geometries before Vale's pattern overwhelmed them.

**Objectives:**

- Gain access to Meridian Vault through Compact favor, forged clearance, or covert entry.
- Navigate a sealed laboratory tied to Project Lazarus Bloom.
- Decide what to do with surviving test subjects.
- Recover the archive fragment.
- Decide whether to let the Compact suppress, publish, or alter the footage.

**Branching outcomes:** Supporting Dr. Kael Ren can expose Compact crimes and weaken Director Arq. Supporting Arq can preserve containment resources but bury victims. Supporting Dr. Nadir Pell can unlock dangerous Host-integration options.

#### The Second Witness: The Confessor's Key

**Location:** Sanctum Aurelian, Quiet Cardinals' private vault.
**Faction pressure:** Holy Remnant.

The archive fragment contains Father Vale's pre-mission confessions and evidence that the Ecclesiate instructed him to perform a first-contact rite if alien life was found.

**Objectives:**

- Enter Sanctum Aurelian legally, under escort, or through smuggled routes.
- Navigate public doctrine, Mercy Order dissent, and Iron Penitent surveillance.
- Reach Cardinal Maera Caldus and the Quiet Cardinals.
- Steal, bargain for, or protect the Confessor's Key.
- Escape or survive Marshal-Confessor Kess if the secret is exposed.

**Branching outcomes:** The player can expose the Remnant's lie, trade the Key to Severian for protection, preserve the Quiet Cardinals' secrecy, or leak the evidence through Free City channels.

#### The Third Witness: The Bell in the Water

**Location:** Low Harrow flooded lower city.
**Faction pressure:** Free Cities, local ruling families, dormant Host intelligence.

The archive fragment contains Sorell's explanation that the Stilling was a lock made from the Vale Imprint.

**Objectives:**

- Enter Low Harrow during a flood-cycle or water-market truce.
- Learn why the lower city is protected and fed by something beneath the water.
- Choose whether to help Councilor Tavi Orrel expose the pact.
- Dive, descend, or negotiate into the submerged _Eschaton's Mercy_ wreckage.
- Recover the Bell in the Water archive.

**Branching outcomes:** Breaking the pact may free Low Harrow from offerings but remove its protection. Preserving it may save the city while condemning future victims. Revealing it can destabilize the Free Cities.

### Act III: The Politics of Truth

**Narrative purpose:** Make the archive matter politically.
**Gameplay purpose:** Branch faction alliances, set the war map, and define who marches to Woundfall.

Once the player assembles the archive:

- The Holy Remnant declares it demonic forgery and prepares a crusade.
- The Lumen Compact demands access and begins planning pre-Vale organism research.
- The Choir treats the failing lock as prophecy.
- The Free Cities fracture over alliance, neutrality, and evacuation.
- The Ash Cartels profit until roads become too dangerous.
- The Penitent Engines march toward Woundfall without waiting for permission.

**Core quests:**

- **A League of Ash:** Build, sabotage, or ignore a Free City defensive league.
- **Mercy Courts:** Decide the fate of prisoners, carriers, and hidden Host tissue beneath Sanctum Aurelian.
- **Lazarus Bloom:** Determine whether the Compact's reverse-infection research becomes cure work, weapon work, or evidence of atrocity.
- **Open the Gates:** Stop or redirect coordinated Choir attacks on shelters, hospitals, prisons, and quarantine gates.
- **Road Tithe:** Break, buy, or ally with the cartels controlling evacuation routes.

**Act climax:** The Pale Orchard blooms out of season. The rooted dead speak with Sorell's voice and reveal that the lock is failing because something beneath Europa is pulling at it.

### Act IV: Woundfall

**Narrative purpose:** Reveal what the Stilling really was.
**Gameplay purpose:** Combine faction warfare, traversal, heavy encounters, archive recovery, and moral revelation in a large explorable region.

**Objectives:**

- Reach Woundfall before one faction controls the Nave.
- Cross dead highways, ash farms, orbital defense sites, Bloom battlefields, refugee columns, cartel ambushes, Penitent war camps, Remnant crusade lines, Compact laboratories, and Choir processions.
- Enter the crashed remains of _Eschaton's Mercy_.
- Reach the Nave.
- Discover that Sorell survived in a partially Host-integrated state.
- Learn that Sorell used old Ecclesiate systems and infected tissue relays to trap The Host inside the Vale Imprint.
- Decide whether to preserve, break, alter, or weaponize the lock.

**Branching outcomes:** The composition of the Woundfall battlefield depends on Act III alliances. A Remnant-heavy route becomes a crusade. A Compact-heavy route becomes an expedition. A Free City route becomes a refugee defense campaign. A Choir-dominated route becomes a pilgrimage into contamination.

### Act V: The Priest and the Ocean

**Narrative purpose:** Resolve Father Vale, the failing lock, and humanity's relationship to the source organism.
**Gameplay purpose:** Deliver endgame decisions tied to faction reputation, companion arcs, and the player's treatment of the infected.

**Core question:** What should happen to The Host, the Vale Imprint, and the lock?

**Required beats:**

- Find or confirm the fate of the First Icon.
- Decide whether Vale is victim, monster, saint, key, weapon, or prisoner.
- Resolve Sorell's role in the lock.
- Confront the Europa signal.
- Choose an ending path.

**Ending paths:**

- **Fire Ending:** Help the Remnant activate the Spear of Dawn or another ancient weapon. The second Bloom is delayed or prevented through mass death and Remnant dominance.
- **Cure Ending:** Help the Compact stabilize treatment derived from Sorell's work. Early infection becomes more survivable, but Europa remains unresolved and Stage Three Icons remain largely beyond recovery.
- **Open Wound Ending:** Side with or fail to stop the Choir. The lock breaks and a second Bloom begins, stranger and less Vale-bound than the first.
- **Lock Renewed Ending:** Sacrifice the First Icon, Sorell, a companion, or the player to reinforce the Stilling. The world remains broken but stable inside Vale's nightmare.
- **Europa Ending:** Reach or contact the source organism beneath Europa and attempt first contact again without Vale's fear as the first language.

## Faction Questlines

### Holy Remnant: Bells and Fire

**Primary NPCs:** Pontifex Severian III, Sister Ilyra Voss, Cardinal Maera Caldus, Marshal-Confessor Odran Kess, Mother Caldra Ys.

**Arc:** The player navigates the Remnant's split between public doctrine, Mercy Order compassion, Iron Penitent fear, and Quiet Cardinal secrecy.

**Possible quests:**

- Escort a Mercy Order hospice through a hostile quarantine zone.
- Decide whether to reveal secret priest-surgeon Host experiments.
- Protect or expose Cardinal Caldus's forbidden archive.
- Stop Kess from burning a settlement based on incomplete evidence.
- Help Severian unify forces for Woundfall at the cost of truth.

### Lumen Compact: Truth's Altar

**Primary NPCs:** Director Salene Arq, Dr. Kael Ren, Dr. Nadir Pell, Provost Iona Vahr.

**Arc:** The player receives real answers and real medicine from people who may use anyone as material.

**Possible quests:**

- Retrieve a live sample from the Pale Orchard.
- Decide the fate of surviving Lazarus Bloom subjects.
- Protect an archive evacuation while refugees are left behind.
- Shut down or support controlled Host-integration trials.
- Determine whether the Compact publishes the Vale Imprint proof.

### Free Cities: Walls That Breathe

**Primary NPCs:** Warden Edda Mar, Councilor Tavi Orrel, Prior Amos Feld, Speaker Renna Sol, Mara Vey.

**Arc:** Independent cities try to survive faction pressure, food shortages, refugee flows, and renewed Host activity without kneeling to a larger power.

**Possible quests:**

- Negotiate Veyr's Gate entry for Hallowfen survivors, fugitives, and smugglers who survived the siege.
- Build a Free City defensive league.
- Decide whether Low Harrow's pact is exposed or preserved.
- Handle Glassmarket grain blackmail during refugee crisis.
- Defend Cinder Parish without letting it become a Remnant or Compact proxy.

### Choir of the Open Wound: Finish the Hymn

**Primary NPCs:** Cantor Ysolde Navre, Anselm Quay, Brother Senn, Mothers of Open Gates.

**Arc:** The player confronts a movement that offers shelter and meaning to the rejected, then turns need into infection.

**Possible quests:**

- Infiltrate a Choir hospice that is also a conversion site.
- Track Brother Senn's hunt for Vale relics.
- Decide whether to let a Choir cell shelter people no one else will protect.
- Prevent or redirect coordinated gate-opening attacks.
- Resolve Anselm's temptation to return.

### Penitent Engines: Steel Remembers

**Primary NPCs:** Brother Tarn, Abbess-Mechanic Rhun Tal, Prior-Iron Malrec.

**Arc:** The player decides whether the Penitent Engines become protectors, occupiers, executioners, or independent war pilgrims.

**Possible quests:**

- Repair or sabotage the Black Reliquary.
- Choose whether Tarn obeys an order to seize Bloomborn children.
- Stop Malrec from starting a private crusade.
- Trade relic fuel for settlement protection.
- Decide whether Penitent forces enter Woundfall under player command.

### Ash Cartels: The Road Eats First

**Primary NPCs:** Mara Vey, Jessa Morrow, Bishop Rusk Dain, Cal Virek.

**Arc:** The player deals with criminals who may be the only reason trade, medicine, and evacuation still function.

**Possible quests:**

- Break the Red Tithe or use it against a worse threat.
- Protect a Morrow Chain medicine convoy.
- Expose or preserve cartel prisoner routes.
- Buy stolen Remnant records from Cal Virek.
- Decide who controls the roads during Act III evacuations.

### Bloomborn: Names on the Ledger

**Primary NPCs:** Lio, Nera Sable, Old Cessa.

**Arc:** The player decides whether altered humans are citizens, patients, weapons, evidence, miracles, or threats.

**Possible quests:**

- Help Lio seek citizenship without state ownership.
- Protect Nera's hidden ledger of Bloomborn disappearances.
- Decide whether Orchard harvesters are exploiting people or surviving with consent from what remains.
- Rescue Bloomborn from Remnant courts or Compact labs.
- Determine whether Bloomborn testimony is admissible in Free City politics.

## Companion Quest Hooks

- **Mara Vey:** The Morrow Chain can save a refugee column only by using routes tied to prisoner smuggling.
- **Sister Ilyra Voss:** A Mercy Order hospice is exposed, and obedience would mean delivering patients to fire.
- **Dr. Kael Ren:** The sealed lab he abandoned contains living subjects who remember his voice.
- **Brother Tarn:** The Black Reliquary orders him to choose duty over children.
- **Lio:** A city offers citizenship in exchange for registration as a Host-detection asset.
- **Anselm Quay:** His old Choir cell can save condemned refugees through a rite that may also infect them.

## Quest Design Rules

- Every major quest should put truth, survival, faith, and exploitation in tension.
- Do not make faction choices simple good/evil alignments.
- When a quest involves Host infection, identify the victim's damnation-role if transformation occurs.
- Let ordinary practical needs matter: water, food, safe roads, medicine, fuel, citizenship papers, and quarantine access.
- Use archives as evidence, not just exposition. Someone should always want to suppress, alter, sell, or weaponize them.
- Consequences should affect reputation, available routes, companion loyalty, survivor outcomes, and who appears at Woundfall.

## Open Quest Questions

- Which Act II witness can be completed first, or are they locked in sequence?
- How early should each companion join?
- Can the player complete the game without joining any major faction?
- Which endings require specific companion survival or sacrifice?
- How much of the Europa Ending is playable versus epilogue?
