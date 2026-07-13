# Quests

The full campaign spine is canon in `docs/lore/the_host_story_bible.md`. This file breaks that spine into playable quest arcs, faction pressures, locations, and branching outcomes.

These are design docs, not runtime quest data. When quest JSON is added later, IDs should use lowercase kebab-case and stay close to the names below.

## Campaign Premise

The player leads a small field squad working along the borderlands between Free City territory and old Bloom zones. Their first major crisis is **Hallowfen**, the walled Earthside crash scar the Holy Remnant calls holy ground and every outlaw calls a chance.

Act I does not hand the player the full truth. It asks whether Hallowfen survives. The wider archive mystery begins after the Hallowfen decision, when a blackened data core from _Eschaton's Mercy_ is recovered from Hallowfen's crash-scar heart and decoded. The core contains a broken recording of Dr. Elian Sorell. Sorell says the Stilling was not divine intervention. It was a lock. The lock is failing. He cannot repair it. He urges the listener to save humanity by finding the Three Witnesses, but the recording does not give clean coordinates. It gives damaged puzzle clues, names, images, and contradictions that the player must solve through investigation.

The campaign asks what the player will do with truth when every faction can use it to save people and destroy people.

The current campaign shape is narrow, wide, narrow, abyss:

- **Act I:** Ash Road and Hallowfen. Local horror, siege pressure, and the first crack in doctrine.
- **Act II:** The Broken World. The largest act, built around travel, side quests, town politics, companion arcs, and the Three Witnesses.
- **Act III:** The Choir Revealed. The cult becomes a full society and a strategic threat, ending with the abduction of Pontifex Severian III and the Devil manifestation.
- **Act IV:** Woundfall. The final descent to Father Vale and Sorell, where the player decides what survives of the lock.

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

**Scale target:** Act I should plan for at least **180,000 authored map tiles**, roughly fifty times the current Ash Chapel tutorial footprint. This does not mean one huge map. It should be built as linked road, checkpoint, district, interior, and siege levels so the player feels regional distance without forcing every system to carry one massive scene.

**Opening route:** Act I should not start inside the Censure Road Camp. The first playable stretch is the **Long Ash Road Approach**, a semi-long road that lets the player feel field distance before reaching organized authority. It should include road shrines, stopped carts, old bell markers, scavenger traces, and one or two low-risk encounters. The Censure Road Camp then becomes the first command point where the player receives orders, checks gear, and hears that the Hallowfen checkpoint towers have stopped answering.

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

**Transition to the archive plot:** After Hallowfen, the recovered data core forces the first main-lore decision: give it to the Holy Remnant, give it to the Lumen Compact, sell it in Veyr's Gate, or keep it. Decoding it reveals Sorell's damaged warning and points toward the Three Witnesses through puzzle clues rather than exact coordinates.

**Blackened data core placement:** The core is not found on the road, in Ash Chapel, or inside the Censure Road Camp. It is recovered late in Act I through this route:

1. **Wreckward Perimeter:** The player reaches the edge of Hallowfen's crash scar after the settlement's fate is decided.
2. **Shrine Rows and Bell Yard:** Remnant and local witnesses point toward old ship-metal beneath the public shrines.
3. **Buried Archive Chapel:** A chapel-and-archive section of _Eschaton's Mercy_ lies under Hallowfen, sealed by wreckage, doctrine, and dormant Host tissue.
4. **Reliquary Cradle:** The blackened core is fused into a cradle of ship metal and old containment hardware.

Early player-facing text should call it the **blackened core**, **reliquary core**, or **ship-cube**. It should not be called Sorell's black box before decoding. The pickup should create pressure rather than answers. The warning plays only after partial decoding, and that decode leads into the Remnant, Compact, Veyr's Gate, or keep-it-hidden choice.

**Act I regional map budget:** Planned total: **180,000 tiles**.

- **Long Ash Road Approach:** 160x70, 11,200 tiles. Road scavengers and minor Host traces establish distance, silence, and Censure field work before camp.
- **Censure Road Camp:** 70x50, 3,500 tiles. Holy Remnant and Ashen Censure officers give orders and official doctrine without revealing hidden history.
- **Ash Road South:** 130x80, 10,400 tiles. South Measure is a permanent settlement still classified as a Bloom refugee camp. Its water crisis introduces Morrow Chain debt rule, Compact reintegration promises, and Brother Tarn's pursuit of a dead Hallowfen checkpoint code heard through a Host-touched Penitent. See `docs/story/locations/ash-road-south.md`.
- **Old Pilgrim Way:** 120x70, 8,400 tiles. Pilgrims and road priests show how faith still organizes travel and fear.
- **Quarantine Farms:** 110x80, 8,800 tiles. Free City farmers and Remnant quarantine law put food, carriers, abandoned families, and harvest law into play.
- **Road Warden Toll:** 90x70, 6,300 tiles. Road wardens and Remnant doubts give the first hard proof that the Hallowfen perimeter is failing.
- **Red Tithe Ford:** 110x80, 8,800 tiles. Ash Cartels control tolls, medicine traffic, and criminal road movement.
- **Smuggler Switchbacks:** 90x70, 6,300 tiles. Ash Cartels and Hallowfen guides offer alternate movement around lawful gates.
- **Hallowfen Outer Wall:** 140x90, 12,600 tiles. Remnant gate law and local fear frame the first full view of the walled crash scar.
- **Captured Checkpoint:** 80x70, 5,600 tiles. Choir impostors reveal that the gate has been taken before the city is seen.
- **Inspection Back Rooms:** 60x50, 3,000 tiles. Choir captors teach confiscation risk and expose the takeover.
- **Smuggler Culvert Route:** 100x60, 6,000 tiles. Smugglers and claim gangs support stealth, avoidance, or faction play.
- **First Streets Inside Wall:** 130x90, 11,700 tiles. Hallowfen citizens make the settlement human before the siege dominates it.
- **Hallowfen Commons:** 120x90, 10,800 tiles. Claim gangs, refugees, and traders form the main hub for survivor needs, rumors, and local law.
- **Water Ledger Quarter:** 100x90, 9,000 tiles. Lumen Compact staff and water guards center medicine, ration control, sample suspicion, and civic need.
- **Shrine Rows and Bell Yard:** 100x90, 9,000 tiles. Remnant agents and Penitent Engines put public doctrine, bell failure, and crash-scar pressure in one district.
- **Relic Market and Claim Dens:** 90x80, 7,200 tiles. Ash Cartels and relic fences show why Hallowfen is valuable and why every faction wants it.
- **Bloomborn Refuge Rows:** 90x80, 7,200 tiles. Bloomborn and Free City advocates bring personhood, citizenship, fear, and mercy into the siege.
- **Wreckward Perimeter:** 130x90, 11,700 tiles. Remnant, Compact, and Choir probes crowd the edge of the crash scar and the late Act I evidence trail.
- **Buried Archive Chapel:** 70x60, 4,200 tiles. Remnant secrecy and dormant Host tissue frame the final approach to the blackened core.
- **East Barricades:** 110x80, 8,800 tiles. Hallowfen defenders and Choir attackers carry the main siege pressure and settlement-fate choice.
- **Choir Breach Lines:** 90x70, 6,300 tiles. The Choir becomes a coordinated battlefield threat without revealing the full cult society.
- **Veyr's Gate Road Outskirts:** 80x40, 3,200 tiles. Free City agents and smugglers open the exit route to the Act II political world.

**Faction discovery order:**

1. **Holy Remnant and Ashen Censure:** Censure Road Camp, Road Warden Toll, Shrine Rows and Bell Yard.
2. **Morrow Chain and Lumen field service:** South Measure on Ash Road South introduces cartel logistics and Compact reintegration through one community both powers keep provisional.
3. **Other Ash Cartels:** Red Tithe Ford, Smuggler Switchbacks, Relic Market and Claim Dens.
4. **Hallowfen citizens:** First Streets Inside Wall, Hallowfen Commons, East Barricades.
5. **Lumen Compact institutional power:** Water Ledger Quarter and Wreckward Perimeter deepen the field-service introduction.
6. **Bloomborn:** Bloomborn Refuge Rows and clinic-adjacent disputes.
7. **Choir of the Open Wound:** Ash Road charity work foreshadows the Captured Checkpoint, Inspection Back Rooms, and Choir Breach Lines.

**Act I lore discipline:** The player should feel that the official story is cracking, but Act I should not explain the Vale Imprint, Father Vale, Europa, or the Stilling. The blackened core is the hinge. Before decoding, it is a dangerous relic. After decoding, it becomes the first object every faction can use, hide, sell, or kill for.

**Early playable slice connection:** `data/levels/ash_chapel_breach.json` functions as an Ash Roads side encounter and tutorial combat space. It foreshadows Hallowfen through a Choir cell, overheard teachings, a private altar rite, and a ledger that says the Hallowfen wall checkpoints have stopped answering tower bells. The slice should not name Father Vale, reveal Sorell, explain the data core, or confirm why anyone is changing.

### Act II: The Broken World and the Three Witnesses

**Narrative purpose:** Turn the story from local outbreak mystery into a wide political and historical investigation.
**Gameplay purpose:** Make the largest act of the game: towns, side quests, companion arcs, faction politics, local compromises, and three major Witness quest lines that can be approached in variable order.

Sorell's recording does not say where to go in plain words. It gives clues that only make sense after fieldwork. The player follows rumors, old maps, doctored Remnant records, Compact medical tags, drowned bell codes, market gossip, and companion knowledge until each Witness location becomes legible.

The Witnesses are not collectibles. Each one answers a question the player needs before the world can act.

- **The Confessor's Key:** Who was first contact, and why did Father Vale matter?
- **The Surgeon's Gospel:** What did the Host look like before Vale's fear became dominant?
- **The Bell in the Water:** Who made the Stilling lock, and why can Sorell no longer save it?

Act II should be where the setting breathes. The player should see Free City water politics, Compact medicine and crimes, Remnant courts and dissent, cartel road economies, Bloomborn citizenship fights, Penitent Engine pressure, and ordinary settlements making ugly choices to survive.

#### The First Witness: The Confessor's Key

**Location:** Sanctum Aurelian, Quiet Cardinals' private vault.
**Faction pressure:** Holy Remnant.

The archive fragment reveals who first contact was. Father Marius Vale was not only present at Saint Origen. The Ecclesiate sent him because alien life was a theological crisis as much as a scientific one, and he was instructed to frame the encounter through rite, prayer, and doctrine if life was found.

The key revelation: the first human mind the organism truly learned was a frightened priest carrying a lifetime of damnation imagery. This does not yet explain the full Vale Imprint, but it tells the player why every later question points back to Vale.

**Objectives:**

- Enter Sanctum Aurelian legally, under escort, or through smuggled routes.
- Navigate public doctrine, Mercy Order dissent, and Iron Penitent surveillance.
- Reach Cardinal Maera Caldus and the Quiet Cardinals.
- Steal, bargain for, or protect the Confessor's Key.
- Escape or survive Marshal-Confessor Kess if the secret is exposed.

**Branching outcomes:** The player can expose the Remnant's lie, trade the Key to Severian for protection, preserve the Quiet Cardinals' secrecy, or leak the evidence through Free City channels.

#### The Second Witness: The Surgeon's Gospel

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

#### The Third Witness: The Bell in the Water

**Location:** Low Harrow flooded lower city.
**Faction pressure:** Free Cities, local ruling families, dormant Host intelligence.

The archive fragment contains Sorell's confession that the Stilling was a lock made from the Vale Imprint. Sorell used old Ecclesiate systems, machine choirs, orbital mirrors, confession networks, and infected tissue relays to loop Vale's terror back into the Host until the organism could no longer grow beyond that pattern.

The key revelation: Sorell created the lock and saved humanity, but calcified during the Stilling. Sorell is fused into the lock network, unable to move and unable to repair what is failing.

**Objectives:**

- Enter Low Harrow during a flood-cycle or water-market truce.
- Learn why the lower city is protected and fed by something beneath the water.
- Choose whether to help Councilor Tavi Orrel expose the pact.
- Dive, descend, or negotiate into the submerged _Eschaton's Mercy_ wreckage.
- Recover the Bell in the Water archive.

**Branching outcomes:** Breaking the pact may free Low Harrow from offerings but remove its protection. Preserving it may save the city while condemning future victims. Revealing it can destabilize the Free Cities.

**Act II endpoint:** Once all three Witnesses are recovered, the player has enough truth to understand Sorell's warning. The Host did not become Hell by nature. Vale's fear gave it the grammar, and Sorell made that grammar into a prison. The lock is failing because the prison is no longer holding.

### Act III: The Choir Revealed

**Narrative purpose:** Turn the Choir from scattered road-cult horror into a society, a refuge, and a strategic enemy.
**Gameplay purpose:** Narrow the game again around cult infiltration, faction commitment, hostage rescue, and the Devil manifestation.

After the Three Witnesses, the truth is dangerous enough to move armies. Before any faction can fully act on it, **Pontifex Severian III is abducted**. The scene is not an ordinary kidnapping. A moon sigil is left behind, unfamiliar to most Remnant investigators but recognizable to the player through the Witness trail and earlier Choir evidence.

The act explores the Choir's way of life:

- Hospices that shelter people the Remnant would burn.
- Families who joined because no city would let their sick inside.
- Barrels and vats of harvested living Host matter.
- Ritual kitchens where opened flesh is fed by hand to keep it growing.
- Choir teachers who call infection confession and call fear a locked door.
- Ysolde's doctrine that a complete immersion can summon the Devil into the world.

The Choir's rite is total immersion. They mean to lower a living person into harvested Host matter in full. If the body is worthy and survives, they believe Satan will manifest. Their most powerful candidate is the Pontifex himself, because immersing the Remnant's pope gives the Host the full symbolic weight of the Church's own fear of Hell.

The hidden truth is held back until after the battle. The manifestation is not proof that the Devil exists. It is the Host, the Vale Imprint, the Pontifex's terror, and Remnant doctrine forming a supreme Adversary Icon.

**Major routes:**

- **Rescue Crusade:** Join or guide the Remnant effort to recover the Pontifex.
- **Compact Strike:** Help the Lumen Compact eliminate the cult and seize samples before the Remnant can bury the truth.
- **Choir Initiation:** Join Ysolde or cooperate long enough to understand the rite from inside.
- **Independent Intervention:** Use Free City, cartel, Bloomborn, or companion alliances to rescue hostages and prevent all factions from claiming the site.

**Act climax:** The player fights the Devil manifestation. The arena should make every witness believe, for a moment, that doctrine has become real. The later reveal is that the Host has learned how to manufacture that belief in flesh.

**Act III endpoint:** Whichever faction survives or wins the battle understands the same hard fact: the manifestation was only possible because the lock is failing. The next objective becomes finding Father Vale.

### Act IV: Woundfall, Vale, and Sorell

**Narrative purpose:** Resolve the human crime at the center of the apocalypse.
**Gameplay purpose:** Deliver the final descent, faction consequences, Sorell's defense systems, the First Icon, and the ending choice.

After Act III, the story should move with force toward Woundfall. This act combines the old Woundfall pilgrimage and the final Vale confrontation.

**Required beats:**

- Reach Woundfall through the consequences of the faction path chosen in Act III.
- Enter the remains of _Eschaton's Mercy_ and descend toward the Nave.
- Find Sorell calcified into the lock network, fused to the walls and unable to move.
- Find Father Vale with Sorell, not as a distant myth but as the prisoner and torturer at the heart of the same chamber.
- Learn the final truth: Sorell looped Vale's fear back through the Host to create the Stilling lock. That act saved humanity by making the Host repeat Vale's Hell forever.
- Understand Vale's motive. He wants the Stilling broken because the lock is also his eternal torture.

Sorell is not a clean villain. Vale is not a clean victim. Sorell saved the world by doing something unforgivable to one terrified man. Vale is right to hate Sorell, and Vale's escape may still doom everyone else.

**Endgame choices:**

- **Side with Vale:** Fight Sorell's automations, machine-choir defenses, and lock guardians to free the First Icon. This may lead to an Open Wound outcome even if Ysolde was defeated.
- **Side with Sorell or the lock:** Fight the monstrous, partially lucid Father Vale and preserve or restore containment.
- **Faction restoration:** Restore the lock through Remnant fire doctrine, Compact cure research, Free City coalition sacrifice, Penitent Engine discipline, or another prepared faction solution.
- **Kill both:** Sever Vale and Sorell from the system. Depending on faction preparation, this can become brutal lock renewal, partial collapse, or the cult's victory after its leaders are gone.
- **Attempt a new imprint:** A rare path that tries to replace Vale's fear with another first language for the Host. This is the Europa-facing ending if the game supports it.

**Ending paths:**

- **Fire Ending:** The Remnant restores containment through sacrifice, mass purgation, and control of the truth.
- **Cure Ending:** The Compact uses Sorell's work and the Witnesses to stabilize treatment while preserving enough of the lock to prevent another Bloom.
- **Free City Ending:** The truth is distributed, the lock is reinforced at terrible cost, and no single power owns the aftermath.
- **Open Wound Ending:** The lock breaks. The Choir's leaders may be dead, but their theology wins because the Host is released from the cage.
- **Lock Renewed Ending:** Vale, Sorell, a companion, or the player becomes the price of continued containment.
- **Europa Ending:** The player reaches or contacts the source organism and attempts first contact again without Vale's fear as the first language.

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
