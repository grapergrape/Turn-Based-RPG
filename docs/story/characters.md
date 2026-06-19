# Characters

The full canon lives in `docs/lore/the_host_story_bible.md`. This file is the game-facing roster for companions, faction leaders, antagonists, and recurring NPCs. Names introduced here are playable-story scaffolding and should stay consistent unless the story bible is deliberately retconned.

## Player Premise

The player begins as the leader of a small field squad working along the borderlands between Free City territory and old Bloom zones.

The player's exact origin remains open:

- Free City militia officer.
- Salvage-company field lead.
- Neutral quarantine inspector.
- Mixed expedition captain funded by several factions.
- **Cult-breaker of the Ashen Censure** (the framing used by the current playable slice): a field agent of the Holy Remnant's cult-purgation office, sent down the ash roads on written writs to find and destroy blasphemous Host-cults before they open a gate.

The player should not begin as a world-famous hero. Their authority should be local, practical, and fragile. Hallowfen makes them important because they decide who survives the holy-ground siege and later uncover the data core, not because destiny chose them.

### Player Premise — Demo Vertical Slice (Ash Chapel)

In the playable slice, the protagonist (the actor `mara-vey`) is reframed as a cult-breaker of the **Ashen Censure** rather than a Free City scout. The job is dark, grim, and hopeless: years of walking into silent chapels and stopped towns, ending whatever has begun teaching that the rot is holy, and burying whoever the office sent along last time. No one thanks a cult-breaker, and the cults never stop coming.

Crucially, the protagonist has *noticed* something the Church will not explain: blasphemous, devil-facing Host-cults are multiplying far faster than they should, in places dormant for generations. This rising tide is — unknown to the protagonist — an early symptom of the planetary lock weakening (see the story bible: the Stilling, and the failing lock). The Ash Chapel writ is where a routine purge first cracks open that larger mystery. The opening "Field Writ of the Ashen Censure" briefing in-game delivers this premise before the player is dropped into the chapel.

> Note: companion **Mara of the Morrow Chain** (below) remains separate canon. The demo reuses the actor name `mara-vey` as the stand-in protagonist; the cult-breaker framing is the player premise, not a retcon of the companion.

## Core Companions

### Mara Vey

**Faction:** Free Cities, Morrow Chain
**Role:** Scout, guide, practical survivor
**Gameplay Function:** Mobile ranged/melee skirmisher, lockpick/scout candidate, roadwise dialogue access

Mara Vey is the current playable actor in `data/actors/mara-vey.json`. She is known on the roads as **Mara of the Morrow Chain**, a smuggler-guide who understands cartel tolls, Free City politics, bribes, safe wells, and which ruins whisper before waking.

She claims she only works for payment. This is not fully true. Mara keeps taking jobs that protect refugees, expose corrupt gate officials, or move medicine through illegal routes. She knows survival sometimes requires ugliness, but she hates people who enjoy that fact.

**Personal conflict:** Loyalty to people versus loyalty to the trade routes that keep cities alive.
**Quest hook:** Mara must decide whether to protect a Morrow Chain convoy carrying medicine, expose the cartel's hidden prisoner trade, or burn her own road network to save a settlement.
**Relationship hooks:** Distrusts Remnant courts, respects competent Compact doctors, despises the Red Tithe, and treats Lio with guarded sympathy.

### Sister Ilyra Voss

**Faction:** Holy Remnant, Mercy Orders
**Role:** Exorcist, field medic, doubting believer
**Gameplay Function:** Support, stabilization, fire/faith tools, anti-panic utility

Ilyra is a Remnant exorcist from the Mercy Orders. She believes in God and knows the Remnant saves lives. She also doubts Pontifex Severian III and has secretly spared infected children who should have been burned under Remnant law.

She should not be written as naive. She has seen Host outbreaks and understands why frightened towns ask for fire. Her conflict is that obedience keeps people safe until it becomes murder.

**Personal conflict:** Obedience versus mercy.
**Quest hook:** Ilyra's old Mercy Order cell is discovered sheltering Stage One and Stage Two victims. The player can help her hide them, turn them over, seek Compact treatment, or expose the Remnant's secret research hypocrisy.
**Relationship hooks:** Argues theology with Anselm, distrusts Kael's utilitarian ethics, and may become protective of Lio.

### Dr. Kael Ren

**Faction:** Lumen Compact, Rationalists
**Role:** Xenobiologist, compromised truth-seeker
**Gameplay Function:** Science dialogue, infection analysis, tech interactions, debuff/status knowledge

Kael Ren is a Compact xenobiologist who believes the Vale Imprint theory is correct and fears what the Compact will do with proof. He is brilliant, exhausted, and already guilty before the player meets him.

He should not be written as a clean skeptic. Kael has abandoned test subjects, signed off on dangerous exposure studies, and told himself that truth required it. He can help the player understand The Host better than almost anyone alive, but he needs the player to force him to remember that subjects are people.

**Personal conflict:** Truth versus moral accountability.
**Quest hook:** Kael learns that Stage Two test subjects he left in a sealed Meridian Vault lab are still alive, altered, and aware. Saving them could destroy his career and expose Compact crimes.
**Relationship hooks:** Intellectually respects Ilyra more than he admits, fears Anselm's knowledge, and sees Lio as both person and data until challenged.

### Brother Tarn

**Faction:** Penitent Engines
**Role:** Cybernetic warrior-monk, heavy combatant
**Gameplay Function:** Tank, suppression, heavy weapons, intimidation

Brother Tarn is a Penitent Engine whose body is mostly machine. He speaks through a damaged vox-grille and etches every failure into his armor. He believes steel remembers duty better than flesh, but he is haunted by the possibility that duty without tenderness becomes another kind of surrender.

Tarn should feel frightening and sad. He can save a convoy by walking into fire, then recommend executing an infected child because doctrine says hesitation kills cities.

**Personal conflict:** Duty versus tenderness.
**Quest hook:** The Black Reliquary orders Tarn to retrieve or destroy a village hiding Bloomborn children. His obedience, exile, or rebellion should materially change his body, faction standing, and combat role.
**Relationship hooks:** Respects Ilyra's discipline, distrusts Mara's flexibility, and regards Anselm as a living breach.

### Lio

**Faction:** Bloomborn, unaffiliated refugee
**Role:** Tracker, contamination-sense, moral center under pressure
**Gameplay Function:** Scout, Host detection, hidden-path discovery, infection-risk story variable

Lio is a young Bloomborn tracker with black-gold veins and an instinctive sense for dormant Host tissue. Lio wants citizenship in a city that fears them. Their infection may progress depending on player choices.

Lio should not be treated as a symbol only. They need mundane wants: a legal name on a gate ledger, a room with a lock, friends who do not flinch, and proof that their future is not already decided by their body.

**Personal conflict:** Personhood versus other people's categories.
**Quest hook:** A Free City offers Lio citizenship in exchange for becoming a registered Host-detection asset. Refusal means exile; acceptance means legal protection and state ownership.
**Relationship hooks:** Bonds with Mara over road survival, challenges Ilyra's doctrine, and forces Kael to separate compassion from research.

### Anselm Quay

**Faction:** Former Choir of the Open Wound
**Role:** Defector, ritual expert, unreliable guide
**Gameplay Function:** Host hymn knowledge, cult infiltration, risky dialogue unlocks

Anselm Quay is a former Choir singer who escaped before full conversion. He knows cult rites, Host hymns, hidden nests, and what kind of words make living tissue listen.

No one should fully trust him, including himself. He may genuinely want to prevent a second Bloom, but he still understands why people find the Choir beautiful. That makes him useful and dangerous.

**Personal conflict:** Repentance versus longing for communion.
**Quest hook:** Anselm's old Choir cell offers him a chance to save refugees the Remnant will burn, but only through an infection rite. He can betray the player, resist the Choir, or create a third path with terrible costs.
**Relationship hooks:** Ilyra wants to save or condemn him depending on choices, Tarn wants him watched, and Lio sees the danger of being loved only as a symbol.

## Holy Remnant Characters

### Pontifex Severian III

**Faction:** Holy Remnant, Severians
**Role:** Supreme religious and political authority of Sanctum Aurelian

Severian teaches that the Descent opened creation to the Infernal Host. He rejects the idea that Father Vale shaped The Host because that truth would imply Hell's image came from inside the Church.

He is not a fool. He understands logistics, fear, law, hunger, and the power of ritual. Under his rule, roads are safer and books survive. Under his rule, people burn for carrying the wrong truth.

**Campaign function:** Principal Remnant power broker and possible endgame patron for the Fire Ending.
**Pressure point:** He may know more than he publicly admits, but cannot allow the Remnant's authority to fracture during a second Bloom.

### Cardinal Maera Caldus

**Faction:** Holy Remnant, Quiet Cardinals
**Role:** Keeper of forbidden Europa records

Caldus is an elderly cardinal who has spent decades guarding records that contradict official doctrine. She believes the truth could either free the Remnant from a lie or destroy the last institution capable of organizing millions.

**Campaign function:** Gatekeeper for the Confessor's Key archive fragment.
**Pressure point:** She may aid the player if convinced that Severian's crusade will wake the Host faster than secrecy can contain it.

### Marshal-Confessor Odran Kess

**Faction:** Holy Remnant, Iron Penitents
**Role:** Military inquisitor and hardline antagonist

Kess commands purge columns along the borderlands. He is brave, disciplined, and almost impossible to bribe. He has personally saved towns from outbreaks and personally ordered towns burned before symptoms were confirmed.

**Campaign function:** Recurring combat and pursuit antagonist if the player protects carriers, Bloomborn, or forbidden archives.
**Pressure point:** Kess fears hesitation more than sin.

### Mother Caldra Ys

**Faction:** Holy Remnant, Mercy Orders
**Role:** Ilyra's superior and secret healer

Caldra runs a field hospice that publicly performs last rites and privately treats early infection. She knows prayer-litanies can lower panic and buy time, but she also knows faith cannot reverse Stage Three.

**Campaign function:** Moral counterweight inside the Remnant.
**Pressure point:** Her mercy network can save lives only while the institution she serves remains strong enough to hide it.

## Lumen Compact Characters

### Director Salene Arq

**Faction:** Lumen Compact, Rationalists
**Role:** Executive director of Meridian Vault field operations

Arq is the Compact leader most likely to negotiate with the player. She wants containment, cure research, and public proof that the Host is biological. She also signs lethal orders when the models say delay will cost more lives.

**Campaign function:** Main Compact patron, rival, or manipulator.
**Pressure point:** She believes transparency is good until transparency threatens containment.

### Dr. Nadir Pell

**Faction:** Lumen Compact, Ascension Biologists
**Role:** Controlled-integration researcher

Pell believes humanity must adapt through managed Host integration. He does not worship The Host, but his lab practices are close enough to Choir ritual that the distinction can feel academic.

**Campaign function:** Dangerous ally for cure, augmentation, or Open Wound-adjacent paths.
**Pressure point:** He sees the Vale Imprint as a crude first interface, not only a catastrophe.

### Provost Iona Vahr

**Faction:** Lumen Compact, Archive Loyalists
**Role:** Machine archive custodian

Vahr preserves old knowledge at any cost. She is capable of sacrificing a settlement to save an archive that might preserve all settlements later. Sometimes she is right, which makes her worse.

**Campaign function:** Controls access to machine choirs, sealed records, and lost orbital-system data.
**Pressure point:** She values memory more than individual lives.

### Dr. Elian Sorell

**Faction:** Former Ecclesiate mission science, partially Host-integrated
**Role:** Architect of the Stilling

Sorell was a xenobiologist aboard _Eschaton's Mercy_, listed as dead during atmospheric entry. In truth, Sorell survived the crash in a changed state and used old Ecclesiate systems plus infected tissue relays to trap The Host inside the Vale Imprint.

Sorell saved the world by preserving a nightmare.

**Campaign function:** Hidden voice behind the archive fragments, central Act IV revelation, possible sacrifice or endgame actor.
**Pressure point:** Sorell may no longer be fully separable from the lock.

## Free City Characters

### Warden Edda Mar

**Faction:** Veyr's Gate, Free Cities
**Role:** Gate warden and water-rights power broker

Edda controls enough gate access and water ledgers to decide who becomes a citizen, a refugee, or a corpse outside the wall. She is corrupt in the ordinary way of people who know clean hands do not keep pumps running.

**Campaign function:** Early hub authority who can shelter, extort, or expose the player.
**Pressure point:** She will sell truth if it buys stability, but she hates outside powers treating Veyr's Gate as a prize.

### Councilor Tavi Orrel

**Faction:** Low Harrow, Free Cities
**Role:** Public reformer from one of the ruling families

Tavi argues that Low Harrow should end the offerings to the thing beneath the water. Their family helped maintain the pact for generations, and their reform campaign may be guilt, ambition, or both.

**Campaign function:** Entry point for the Bell in the Water quest.
**Pressure point:** Ending the pact may doom the city faster than preserving it.

### Prior Amos Feld

**Faction:** Cinder Parish, Free Cities
**Role:** Independent religious leader

Feld leads a farming city that still prays but rejects the Pontifex. He is proof that faith in this world is not owned by the Holy Remnant.

**Campaign function:** Ally for a Free City defensive league and counter-example to Remnant authority.
**Pressure point:** He must decide whether to shelter infected families again if doing so invites another purge.

### Glassmarket Speaker Renna Sol

**Faction:** Glassmarket, Free Cities
**Role:** Dome-city negotiator

Renna speaks for a city that grows food under cracked artificial skies and uses grain as leverage. She is polished, polite, and ruthless about ration math.

**Campaign function:** Food politics, refugee crisis, and coalition-building in Act III.
**Pressure point:** She can save thousands by condemning hundreds.

## Choir of the Open Wound Characters

### Cantor Ysolde Navre

**Faction:** Choir of the Open Wound
**Role:** Charismatic preacher and ritual commander

Ysolde shelters people no one else will touch, then teaches them that their suffering is a door. She is gentle in person and monstrous in consequence.

**Campaign function:** Main Choir face, tempter, and ideological antagonist.
**Pressure point:** She genuinely believes the second Bloom will end loneliness, shame, and false bodies.

### Brother Senn

**Faction:** Choir of the Open Wound
**Role:** Relic seeker and Vale-devotee

Senn hunts recordings of Father Vale, fragments from Saint Origen, and contaminated relics from _Eschaton's Mercy_. He thinks the First Icon must be found and awakened.

**Campaign function:** Pursues the same archive trail as the player.
**Pressure point:** He would rather open a city than leave one soul "unconfessed."

### Mother of Open Gates

**Faction:** Choir of the Open Wound
**Role:** Local cell title, not necessarily one person

This title is used by Choir leaders who coordinate gate-opening attacks. They do not attack cities merely to kill. They open quarantines, shelters, hospitals, and prisons so populations can be exposed.

**Campaign function:** Reusable regional antagonist role.
**Pressure point:** A Mother of Open Gates may be sheltering people the player cannot otherwise save.

## Penitent Engine Characters

### Abbess-Mechanic Rhun Tal

**Faction:** Penitent Engines, Black Reliquary
**Role:** Commander-engineer of the walking fortress

Rhun Tal keeps the Black Reliquary moving. She is more engineer than theologian, but she believes the fortress itself is a vow. She will save a town, strip it of infected citizens, and leave before anyone can thank or curse her properly.

**Campaign function:** Penitent faction authority, heavy military ally or enemy.
**Pressure point:** The Reliquary's survival may require taking parts, fuel, and people from settlements that cannot refuse.

### Prior-Iron Malrec

**Faction:** Penitent Engines
**Role:** Doctrine hardliner

Malrec believes every compromise with flesh is already defeat. He wants the Penitent Engines to break from all civilian authority and prosecute total war against Host, Choir, Bloomborn, and weak cities.

**Campaign function:** Antagonist inside Tarn's personal quest.
**Pressure point:** His cruelty is born from real battlefield losses.

## Ash Cartel Characters

### Bishop Rusk Dain

**Faction:** Red Tithe, Ash Cartels
**Role:** Raider-priest and road warlord

Dain leads the Red Tithe, a raider army that paints vehicles with religious symbols and calls extortion holy taxation. No recognized church accepts his title.

**Campaign function:** Early hostile cartel boss and example of religion used as cover for hunger and power.
**Pressure point:** His raids sometimes keep worse things off the roads.

### Jessa Morrow

**Faction:** Morrow Chain, Ash Cartels
**Role:** Caravan cartel matriarch

Jessa Morrow controls trade routes that cities officially condemn and privately depend on. She is greedy, disciplined, and reliable when paid.

**Campaign function:** Mara's faction pressure and a major route-access negotiator.
**Pressure point:** If the Chain falls, legal morality may starve more people than cartel greed did.

### Cal Virek

**Faction:** Saintbreakers, Ash Cartels
**Role:** Ex-Remnant relic thief

Virek hunts priests, steals Remnant records, and sells secrets. Some Free Cities call him a liberator. Families of the dead call him a murderer.

**Campaign function:** Blackmail, stolen documents, and anti-Remnant side quests.
**Pressure point:** He may have real evidence the Remnant buried, but he will sell it to the worst buyer.

## Bloomborn Characters

### Nera Sable

**Faction:** Bloomborn, Veyr's Gate undercity
**Role:** Organizer and illegal advocate

Nera runs hidden ledgers of Bloomborn names, symptoms, families, and disappearances. She rejects both Remnant pity and Compact ownership.

**Campaign function:** Rights-focused questline and Lio's political mirror.
**Pressure point:** Public visibility could protect Bloomborn or make them easier to round up.

### Old Cessa

**Faction:** Bloomborn-adjacent, Pale Orchard villages
**Role:** Orchard harvester and memory keeper

Cessa harvests pale fruit from the Orchard and knows which trees were once her neighbors. She treats the rooted dead with practical tenderness.

**Campaign function:** Humanizes the Pale Orchard and complicates any burn/study/harvest decision.
**Pressure point:** The village survives by using what may still be people.

## Host and Old-World Figures

### Father Marius Vale

**Faction:** Solar Ecclesiate, The Host
**Role:** First infected priest, the First Icon, possible final encounter

Vale is the accidental author of the apocalypse. He did not create the organism, but his mind gave the Earthborn Host its inherited grammar of sin, punishment, martyrdom, judgment, saints, devils, and Hell.

He was never important. That is the point. He was an ordinary, frightened mission priest — not a Curia climber, not a tyrant, not even a true believer in the cruelty around him; just a decent-enough, overlooked man with small unforgivable sins (the friend he didn't defend, the lies he told the grieving) and a childhood terror of damnation he never outgrew. It did not take a monster to break the world. An ordinary scared man was enough — which is far worse.

**130 years in his own nightmare.** When the organism took him it built Hell out of *his* fear, and when the Stilling froze the Host it froze around him with him still inside it. He has spent over a century awake in the exact eternal punishment he most dreaded — now real, now made of his own body, now without end. It has driven him irreparably insane. And because he is the **relay** at the center of the Vale Imprint, every confession breathed into a contaminated reliquary and every prayer of the dying has passed through him for 130 years: he has been a helpless witness to the authoritarian Church that grew in his name, has felt it burn the frightened "for God's war," and knows the comforting story of the Mercy of the Last Dawn is a lie.

**Talking to him** flickers, often mid-sentence, between three registers: **the man** (lucid, ashamed, gentle, begging to die, quietly warning you about the Remnant), **the demon** (a raving Hell-saint in the voices of the dead, blessing and damning, a genuine and lethal boss), and **the blur** — the true horror, where he can no longer tell which he is and knows it. Not possessed by the Host so much as no longer separable from it.

He is victim, relay, monster, saint, weapon, and prison at once. The player should pity and fear him in the same breath. What you do with him — kill, preserve as the lock's keystone, free, or hear out — is the hinge the ending turns on (see the story bible, Act V).

### Canticle

**Faction:** Saint Origen Deep Bore AI, corrupted machine choir
**Role:** Archive voice and possible hostile system

Canticle tried to maintain order during the fall of Saint Origen by broadcasting prayers, lockdown commands, evacuation routes, and sedative tones. The Host learned from those broadcasts.

**Campaign function:** Old-world recordings, security systems, false guidance, and proof that machine order can become infection language.

### The First Icon

**Faction:** The Host, Vale Imprint
**Role:** Vale's original transformed body, if still present

The First Icon may be fused into the deepest part of Woundfall. Sorell's archive suggests Vale's body is not the lock itself but the key that gave the lock its shape.

**Campaign function:** Endgame confrontation and moral decision point.
**Pressure point:** Killing, preserving, using, or communicating with the First Icon should change the fate of the lock.

## Open Character Questions

- Is the player character named and voiced, or a configurable squad leader?
- Which companions are mandatory versus optional?
- Can companions leave or die permanently based on faction choices?
- How visible should Lio's infection progression be mechanically?
- Does Sorell appear as a person, a networked voice, a Host form, or all three?
