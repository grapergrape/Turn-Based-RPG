// Canonical weapon roster. The generator turns these compact, reviewed seeds
// into one readable item file per weapon plus the ammunition index.

export const AMMUNITION_FAMILIES = Object.freeze([
  ammo('compact-cartridge', 'Loose Compact Cartridges', 0.018, 'Short cased rounds wrapped in waxed paper. Road guns and machine pistols favor them because every settlement press can turn the brass.'),
  ammo('sidearm-cartridge', 'Relic Rounds', 0.024, 'Common pistol cartridges with ash lacquer around the primers. Censure clerks count them one by one before a field writ.', 'relic-rounds'),
  ammo('heavy-sidearm-cartridge', 'Heavy Sidearm Cartridges', 0.045, 'Broad pistol rounds meant for old wheelguns and gate pistols. The recoil is part of their reputation and most of their stopping power.'),
  ammo('intermediate-cartridge', 'Intermediate Rifle Cartridges', 0.032, 'Tapered rifle cartridges used by patrol carbines. Their cases bear a dozen competing parish stamps.'),
  ammo('full-rifle-cartridge', 'Full Rifle Cartridges', 0.052, 'Long rifle cartridges packed nose to tail in cloth loops. Good powder makes them valuable. Dry powder makes them rare.'),
  ammo('shot-shell', 'Waxed Shot Shells', 0.061, 'Paper and brass shells sealed against road damp with black wax. Loads vary from coarse salt shot to cast lead.'),
  ammo('linked-heavy-cartridge', 'Linked Heavy Cartridges', 0.12, 'Heavy cartridges joined by reusable iron links. A full belt is worth more than the gun in some outer wards.'),
  ammo('compact-armature', 'Compact Ferrous Armatures', 0.038, 'Dense iron darts sleeved in ceramic. Accelerator sidearms strip the sleeve away as the armature leaves the rails.'),
  ammo('long-armature', 'Long Ferrous Armatures', 0.11, 'Machined iron armatures for coil rifles and railguns. Each one must be straight, balanced, and free of rust.' )
]);

export const BALLISTIC_LONG_GUNS = Object.freeze([
  longGun('cinder-watch-submachine-gun', 'Cinder Watch Submachine Gun', 'submachine gun', 'smg', 'compact-cartridge', 'Cinder Watch', 'Settlement manufacture', 'A stamped receiver wrapped in soot-dark cloth. Watch patrols favor it in stairwells where a rifle catches on every shrine rail.'),
  longGun('gate-nine-machine-carbine', 'Gate Nine Machine Carbine', 'submachine gun', 'smg', 'compact-cartridge', 'Gate Nine Wardens', 'First Winter', 'Built from gatehouse spares during the first ration riots. Its square magazine well still carries tally cuts from the night watch.'),
  longGun('vesper-stamp-smg', 'Vesper Stamp Gun', 'submachine gun', 'smg', 'compact-cartridge', 'Vesper Yard', 'Settlement manufacture', 'A compact yard gun with a brass vesper seal pressed into the stock. The bolt chatters, but the simple parts survive bad oil.'),
  longGun('ash-road-carbine', 'Ash Road Carbine', 'carbine', 'carbine', 'intermediate-cartridge', 'Road Wardens', 'Remnant issue', 'A short rifle made for riders and cart guards. Ash has polished the forward grip smoother than the factory ever did.'),
  longGun('censure-patrol-carbine', 'Censure Patrol Carbine', 'carbine', 'carbine', 'intermediate-cartridge', 'Ashen Censure', 'Remnant issue', 'A black carbine issued for cult searches beyond the walls. Its chamber flag bears the Censure rule: empty before prayer, loaded before entry.'),
  longGun('millward-folding-carbine', 'Millward Folding Carbine', 'carbine', 'carbine', 'intermediate-cartridge', 'Millward Compact', 'Recovered pattern', 'A hinged-stock carbine copied from a pre-collapse security pattern. Millward armorers replace the fragile latch with a plain iron pin.'),
  longGun('barrowline-scout-carbine', 'Barrowline Scout Carbine', 'carbine', 'carbine', 'intermediate-cartridge', 'Barrowline Scouts', 'Settlement manufacture', 'Long-legged scouts carry this narrow carbine under their coats. A hooded front sight keeps glare from the salt flats out of the eye.'),
  longGun('remnant-service-rifle', 'Remnant Service Rifle', 'service rifle', 'rifle', 'full-rifle-cartridge', 'Holy Remnant', 'Remnant issue', 'The ordinary rifle of wall troops and road levies. Most examples have passed through three arsenals and twice as many hands.'),
  longGun('concord-pattern-rifle', 'Concord Pattern Rifle', 'service rifle', 'rifle', 'full-rifle-cartridge', 'Concord Arsenal', 'Pre-Fall reserve', 'A pre-collapse reserve rifle with a sealed piston and severe iron furniture. Its old serial plate is often mistaken for a prayer text.'),
  longGun('bastion-watch-rifle', 'Bastion Watch Rifle', 'service rifle', 'rifle', 'full-rifle-cartridge', 'Penitent Bastion', 'Remnant issue', 'A heavy watch rifle stocked in black oak. Bastion sentries notch the butt for completed quarantine shifts, never for kills.'),
  longGun('salt-parish-battle-rifle', 'Salt Parish Battle Rifle', 'battle rifle', 'rifle', 'full-rifle-cartridge', 'Salt Parishes', 'Settlement manufacture', 'Salt parish gunsmiths copied the action by measuring a single surviving rifle. The wide tolerances look crude and run clean.'),
  longGun('grey-marrow-marksman-rifle', 'Grey Marrow Marksman Rifle', 'marksman rifle', 'precision-rifle', 'full-rifle-cartridge', 'Grey Marrow Company', 'Recovered pattern', 'A long-barreled rifle with a cheek rest carved from pale orchard wood. Company marksmen paint over old contracts but leave the range tables.'),
  longGun('cenotaph-long-rifle', 'Cenotaph Long Rifle', 'marksman rifle', 'precision-rifle', 'full-rifle-cartridge', 'Cenotaph Guard', 'Remnant issue', 'Guard armorers bed each action into a dense laminated stock. The result is slow to carry and steady over a grave wall.'),
  longGun('widow-bell-rifle', 'Widow Bell Rifle', 'marksman rifle', 'precision-rifle', 'full-rifle-cartridge', 'Independent gunsmiths', 'Settlement manufacture', 'Its muzzle report has a hollow second note caused by a sleeved barrel jacket. Widows named the sound before the maker named the gun.'),
  longGun('pilgrim-break-shotgun', 'Pilgrim Break Gun', 'shotgun', 'shotgun', 'shot-shell', 'Road Pilgrims', 'Settlement manufacture', 'A break-action gun with mismatched barrels and a saint card beneath the butt plate. It opens easily with gloved hands.'),
  longGun('sexton-trench-gun', 'Sexton Trench Gun', 'shotgun', 'shotgun', 'shot-shell', 'Sexton Crews', 'First Winter', 'A pump gun shortened for crypt passages and drainage cuts. The steel heat shield is punched with small funeral crosses.'),
  longGun('wardens-breach-gun', 'Warden Breach Gun', 'shotgun', 'shotgun', 'shot-shell', 'Gate Wardens', 'Remnant issue', 'A reinforced shotgun for hinges, locks, and bodies behind them. Its broad fore-end is scarred by door splinters.'),
  longGun('foundry-support-gun', 'Foundry Support Gun', 'support gun', 'support-gun', 'linked-heavy-cartridge', 'Foundry Compact', 'Settlement manufacture', 'A belt-fed support gun built around a furnace fan bearing. It needs a strong shoulder and a patient hand on the feed cover.'),
  longGun('procession-drum-gun', 'Procession Drum Gun', 'support gun', 'support-gun', 'full-rifle-cartridge', 'Processional Guard', 'Recovered pattern', 'A squad automatic rifle fed from a squat drum. Processional guards wrap the barrel handle in prayer cord to mark it as communal property.'),
  longGun('black-reliquary-rifle', 'Black Reliquary Rifle', 'anti-materiel rifle', 'precision-rifle', 'linked-heavy-cartridge', 'Black Reliquary', 'Pre-Fall reserve', 'A massive single-shot rifle recovered from a sealed civil armory. Reliquary teams use it against engine housings, barricades, and things too dense for mercy.')
]);

export const BALLISTIC_PISTOLS = Object.freeze([
  pistol('censure-sidearm', 'Censure Sidearm', 'autoloading pistol', 'sidearm', 'sidearm-cartridge', 'Ashen Censure', 'Remnant issue', 'A black service pistol with a worn shrine stamp on the slide. Reliable if kept clean. Unforgiving if neglected.'),
  pistol('parish-ward-pistol', 'Parish Ward Pistol', 'autoloading pistol', 'sidearm', 'sidearm-cartridge', 'Parish Wardens', 'Settlement manufacture', 'A plain service pistol assembled by parish armorers. The grip panels are cut from old pews and never quite match.'),
  pistol('bellfounder-auto', 'Bellfounder Automatic', 'autoloading pistol', 'sidearm', 'sidearm-cartridge', 'Bellfounder Guild', 'Recovered pattern', 'The guild machines this pistol from bell bronze molds and salvaged steel. Its warm-colored frame hides a hard, modern action.'),
  pistol('grey-market-nine', 'Grey Market Nine', 'autoloading pistol', 'sidearm', 'sidearm-cartridge', 'Unaffiliated markets', 'Settlement manufacture', 'No two Grey Market Nines share a maker, only dimensions. Parts trade freely across the road stalls and fit after enough filing.'),
  pistol('chaplain-service-pistol', 'Chaplain Service Pistol', 'autoloading pistol', 'sidearm', 'sidearm-cartridge', 'Holy Remnant', 'Remnant issue', 'A narrow pistol issued to traveling chaplains who cannot carry a long gun at the altar. The safety lever is large enough for numb fingers.'),
  pistol('mourning-dove-pistol', 'Mourning Dove Pistol', 'autoloading pistol', 'sidearm', 'sidearm-cartridge', 'Mourning Houses', 'Settlement manufacture', 'A polished pistol with a dove cut into the rear plate. Mourning houses lend them to escorts and expect every casing returned.'),
  pistol('iron-vow-revolver', 'Iron Vow Revolver', 'revolver', 'sidearm', 'heavy-sidearm-cartridge', 'Oath Companies', 'First Winter', 'A thick-framed revolver whose cylinder locks like a vault wheel. Oath companies prize it because a loaded chamber can wait for years.'),
  pistol('sexton-six', 'Sexton Six', 'revolver', 'sidearm', 'sidearm-cartridge', 'Sexton Crews', 'Settlement manufacture', 'A compact six-shot revolver carried by grave crews after dark. Lime dust gathers in the flutes and makes the cylinder pale.'),
  pistol('roadward-wheelgun', 'Roadward Wheelgun', 'revolver', 'sidearm', 'heavy-sidearm-cartridge', 'Road Wardens', 'Recovered pattern', 'A long-cylinder wheelgun with a lanyard ring big enough for winter rope. It fires after mud, rain, and weeks beneath a cart seat.'),
  pistol('bastion-long-revolver', 'Bastion Long Revolver', 'revolver', 'sidearm', 'heavy-sidearm-cartridge', 'Penitent Bastion', 'Remnant issue', 'Bastion officers carry this long-barreled revolver as a badge and last defense. The sights are filed for the inner wall distances.'),
  pistol('palm-censer', 'Palm Censer', 'compact pistol', 'sidearm', 'compact-cartridge', 'Shrine Couriers', 'Settlement manufacture', 'A tiny pistol hidden inside a perforated metal shroud. Couriers claim the hot casing smoke resembles incense.'),
  pistol('veil-pocket-pistol', 'Veil Pocket Pistol', 'compact pistol', 'sidearm', 'compact-cartridge', 'Veil Brokers', 'Settlement manufacture', 'A flat pocket pistol with no projecting sight or hammer. Broker coats include a stitched leather square to stop its edges printing through.'),
  pistol('undertaker-compact', 'Undertaker Compact', 'compact pistol', 'sidearm', 'compact-cartridge', 'Undertaker Guild', 'Recovered pattern', 'A squat automatic made for one gloved hand. The guild issues it only when a collection takes workers beyond the lantern line.'),
  pistol('black-candle-heavy-pistol', 'Black Candle Pistol', 'heavy pistol', 'sidearm', 'heavy-sidearm-cartridge', 'Black Candle Office', 'Remnant issue', 'A heavy automatic with a tall slide and twin recoil springs. Black wax in the grip screw marks an inspected weapon.'),
  pistol('gatehammer-pistol', 'Gatehammer Pistol', 'heavy pistol', 'sidearm', 'heavy-sidearm-cartridge', 'Gate Wardens', 'Settlement manufacture', 'A slab-sided pistol built to crack improvised armor at gate distance. The grip is weighted so the muzzle settles after recoil.'),
  pistol('reliquary-hand-cannon', 'Reliquary Hand Cannon', 'heavy pistol', 'sidearm', 'heavy-sidearm-cartridge', 'Black Reliquary', 'Pre-Fall reserve', 'A five-shot relic revolver with an overbuilt top strap. It leaves the hand aching and most close threats finished.'),
  pistol('choir-stitch-machine-pistol', 'Choir Stitcher', 'machine pistol', 'sidearm', 'compact-cartridge', 'Choir Wardens', 'Settlement manufacture', 'A selective-fire pistol braced by a folding wire stock. Its short bursts sound like a needle passing through stiff cloth.'),
  pistol('tithehouse-machine-pistol', 'Tithehouse Machine Pistol', 'machine pistol', 'sidearm', 'compact-cartridge', 'Tithehouse Guard', 'Recovered pattern', 'A boxy defense pistol once kept beneath counting desks. The magazine forms the grip and makes every reload a firm upward strike.'),
  pistol('mercy-bolt-pistol', 'Mercy Bolt Pistol', 'specialist pistol', 'sidearm', 'sidearm-cartridge', 'Hospital Orders', 'Settlement manufacture', 'Hospital escorts load this manually cycled pistol with marked low-flash rounds. Its enclosed action is easy to scrub after quarantine work.'),
  pistol('seal-driver-pistol', 'Seal Driver Pistol', 'specialist pistol', 'sidearm', 'heavy-sidearm-cartridge', 'Closure Engineers', 'Industrial conversion', 'A powder driver converted from a structural fastening tool. Closure engineers insist it remains a tool until someone points it sideways.')
]);

export const ACCELERATOR_WEAPONS = Object.freeze([
  accelerator('penitent-coil-sidearm', 'Penitent Coil Sidearm', 'coil sidearm', 'accelerator-sidearm', 'compact-armature', 'Penitent Bastion', 'Penitent Engine workshop', 'A compact coil arm built around a Penitent Engine inspection driver. Copper windings show through cooling slots in the black shell.'),
  accelerator('vesper-armature-pistol', 'Vesper Armature Pistol', 'coil sidearm', 'accelerator-sidearm', 'compact-armature', 'Vesper Yard', 'Industrial conversion', 'Yard artificers rebuilt a magnetic rivet launcher into a blunt service pistol. A charge needle rises beside the rear sight before it can fire.'),
  accelerator('anchorite-induction-pistol', 'Anchorite Induction Pistol', 'induction sidearm', 'accelerator-sidearm', 'compact-armature', 'Anchorite Cells', 'Recovered pattern', 'A silent-looking pistol with a ceramic spine and no chamber for powder. Its induction pack snaps hard enough to betray every shot.'),
  accelerator('reliquary-needle-pistol', 'Reliquary Needle Pistol', 'rail sidearm', 'accelerator-sidearm', 'compact-armature', 'Black Reliquary', 'Pre-Fall reserve', 'A narrow rail pistol recovered with survey instruments, not weapons. Reliquary armorers fitted a guard, sights, and a less honest purpose.'),
  accelerator('black-office-coil-pistol', 'Black Office Coil Pistol', 'coil sidearm', 'accelerator-sidearm', 'compact-armature', 'Black Candle Office', 'Remnant prototype', 'A scarce office pistol with sealed coils and a removable charge brick. Inspectors track every armature because the barrels leave distinct scoring.'),
  accelerator('penitent-engine-carbine', 'Penitent Engine Carbine', 'coil carbine', 'accelerator-rifle', 'long-armature', 'Penitent Bastion', 'Penitent Engine workshop', 'A shortened accelerator assembled for engine crews who work in cramped service galleries. Its coil jacket smells of hot varnish after battle.'),
  accelerator('dustline-coil-carbine', 'Dustline Coil Carbine', 'coil carbine', 'accelerator-rifle', 'long-armature', 'Dustline Compact', 'Settlement prototype', 'A frontier copy of an industrial coil launcher. Leather dust skirts protect the exposed guide rails better than the original seals did.'),
  accelerator('monastic-armature-rifle', 'Monastic Armature Rifle', 'coil rifle', 'accelerator-rifle', 'long-armature', 'Monastic Arsenal', 'Remnant prototype', 'Monastic artificers laid its windings by hand and numbered every layer. The long receiver bears more inspection marks than decoration.'),
  accelerator('ward-singer-coil-rifle', 'Ward Singer Coil Rifle', 'coil rifle', 'accelerator-rifle', 'long-armature', 'Ward Singer Company', 'Recovered pattern', 'Its capacitors emit a rising metal hum when charged. Ward Singers learned to fire before the last note gives their position away.'),
  accelerator('censure-induction-rifle', 'Censure Induction Rifle', 'induction rifle', 'accelerator-rifle', 'long-armature', 'Ashen Censure', 'Remnant prototype', 'A rare Censure rifle for targets behind chapel plate and engine casing. The induction cage is wrapped in black cord to show tampering.'),
  accelerator('millwall-accelerator', 'Millwall Accelerator', 'coil rifle', 'accelerator-rifle', 'long-armature', 'Millwall Foundry', 'Industrial conversion', 'A mill inspection launcher rebuilt with a shoulder stock and field sights. Its iron armatures punch straight through thin sheet.'),
  accelerator('confessor-rail-rifle', 'Confessor Rail Rifle', 'rail rifle', 'rail-rifle', 'long-armature', 'Holy Remnant', 'Remnant prototype', 'A long rail rifle assigned in pairs to confessor retinues. The ceramic rail bed must be checked for hairline cracks after every hard march.'),
  accelerator('long-vigil-rail-rifle', 'Long Vigil Rail Rifle', 'rail rifle', 'rail-rifle', 'long-armature', 'Long Vigil', 'Recovered pattern', 'Vigil marksmen fire this survey-derived rail arm from prepared rests. The charge pack lasts, but the guide surfaces demand constant care.'),
  accelerator('saint-orison-rail-rifle', 'Saint Orison Rail Rifle', 'rail rifle', 'rail-rifle', 'long-armature', 'Orison Chapter', 'Remnant prototype', 'Chapter artificers enclosed the rails in white ceramic and stamped a saint name above each contact. The ritual also serves as an inspection list.'),
  accelerator('grave-meridian-rail-rifle', 'Grave Meridian Rail Rifle', 'rail rifle', 'rail-rifle', 'long-armature', 'Meridian Survey', 'Industrial conversion', 'A converted geologic launcher with a long optical rail and a brutal stock. Survey crews once used it to drive markers into frozen ground.'),
  accelerator('penitent-engine-railgun', 'Penitent Engine Railgun', 'heavy railgun', 'rail-rifle', 'long-armature', 'Penitent Bastion', 'Penitent Engine workshop', 'Engine crews mount this railgun on a folding shoulder yoke between deployments. Reloading it is a drill of ceramic sleeves, clean contacts, and steady hands.'),
  accelerator('bastion-spike-driver', 'Bastion Spike Driver', 'heavy coil gun', 'support-gun', 'long-armature', 'Penitent Bastion', 'Industrial conversion', 'A magnetic pile driver cut down into a squad weapon. Its thick armature can open machinery or a barricaded firing slit.'),
  accelerator('ossuary-coil-gun', 'Ossuary Coil Gun', 'heavy coil gun', 'support-gun', 'long-armature', 'Ossuary Guard', 'Remnant prototype', 'A heavy coil gun with ribbed cooling plates like a closed reliquary. Two guards carry its charge cases while a third carries the weapon.'),
  accelerator('cripplegate-induction-lance', 'Cripplegate Induction Lance', 'induction lance', 'rail-rifle', 'long-armature', 'Cripplegate Engineers', 'Industrial conversion', 'A long induction projector braced against a spring shoulder. It sends a single iron lance through cover, then demands time and charge.'),
  accelerator('first-fall-test-armature', 'First Fall Test Armature', 'experimental accelerator', 'accelerator-rifle', 'long-armature', 'Unknown civil laboratory', 'Pre-Fall experimental', 'An unmarked accelerator with resin-sealed coils and handwritten calibration numbers beneath the stock. Modern artificers can maintain it, but none can copy the core.')
]);

export const MELEE_WEAPONS = Object.freeze([
  melee('censure-knife', 'Censure Knife', 'knife', 'knife', 'Ashen Censure', 'Remnant issue', 'A narrow field knife with a hooked guard for cutting cord and clothing. Its blackened blade avoids a bright flash in dark rooms.'),
  melee('ash-road-knife', 'Ash Road Knife', 'knife', 'knife', 'Road Settlements', 'Settlement manufacture', 'A broad utility knife carried by drovers, scouts, and thieves. Fine ash mixed into the grip resin keeps it from slipping.'),
  melee('sexton-bone-saw', 'Sexton Bone Saw', 'knife', 'knife', 'Sexton Crews', 'Industrial conversion', 'A short grave saw with a sharpened back edge. Sextons use it on roots, coffin boards, and worse obstructions.'),
  melee('pilgrim-hook-knife', 'Pilgrim Hook Knife', 'knife', 'knife', 'Road Pilgrims', 'Settlement manufacture', 'A hooked knife meant to free tangled harness without cutting the animal. The inner curve is just as useful at arm length.'),
  melee('remnant-trench-knife', 'Remnant Trench Knife', 'knife', 'knife', 'Holy Remnant', 'First Winter', 'A thick knife with a knuckle guard forged during the first wall fighting. Most bear unit marks filed away by later owners.'),
  melee('veil-stiletto', 'Veil Stiletto', 'knife', 'knife', 'Veil Brokers', 'Settlement manufacture', 'A rigid triangular blade hidden in a writing case. Brokers deny issuing them and charge a fee to sharpen one.'),
  melee('butcher-prayer-knife', 'Butcher Prayer Knife', 'knife', 'knife', 'Market Butchers', 'Settlement manufacture', 'A long butcher blade with a prayer line punched through the tang. The words are hidden once the scales are riveted on.'),
  melee('graveward-dirk', 'Graveward Dirk', 'knife', 'knife', 'Grave Wardens', 'Recovered pattern', 'A double-edged dirk balanced for work in narrow crypt aisles. Its pommel cap unscrews to hold chalk or a final note.'),
  melee('censer-sabre', 'Censer Sabre', 'sword', 'sword', 'Processional Guard', 'Remnant issue', 'A curved guard sabre with a perforated brass basket. Old incense soot blackens the holes around the hand.'),
  melee('remnant-officer-sword', 'Remnant Officer Sword', 'sword', 'sword', 'Holy Remnant', 'Remnant issue', 'A straight officer blade worn at courts, musters, and executions. Honest examples show more sharpening than polish.'),
  melee('ashland-hanger', 'Ashland Hanger', 'sword', 'sword', 'Ashland Militias', 'Settlement manufacture', 'A short chopping sword forged from wagon spring. Its hide grip can be replaced beside any road fire.'),
  melee('mourning-longsword', 'Mourning Longsword', 'sword', 'sword', 'Mourning Houses', 'Recovered pattern', 'A long two-handed sword kept above a mourning house door. The fuller is filled with names in tiny stamped letters.'),
  melee('parish-cleaver-sword', 'Parish Cleaver Sword', 'sword', 'sword', 'Parish Levies', 'Settlement manufacture', 'A broad single-edged levy sword that favors a committed cut. Parish marks run from the spine down to the guard.'),
  melee('veil-dueling-blade', 'Veil Dueling Blade', 'sword', 'sword', 'Veil Brokers', 'Recovered pattern', 'A narrow civilian blade with a deep cup guard and a needle point. Veil contracts sometimes specify whether it may be drawn.'),
  melee('gatewarden-falchion', 'Gatewarden Falchion', 'sword', 'sword', 'Gate Wardens', 'Settlement manufacture', 'A forward-heavy falchion used to finish work too close for a gate gun. Nicks along the back show where it has pried bolts.'),
  melee('reliquary-greatsword', 'Reliquary Greatsword', 'sword', 'sword', 'Black Reliquary', 'Recovered pattern', 'A severe two-handed blade recovered from a ceremonial armory. Reliquary keepers removed the jewels and kept the sound steel.'),
  melee('woodsmoke-hand-axe', 'Woodsmoke Hand Axe', 'axe', 'axe', 'Woodsmoke Camps', 'Settlement manufacture', 'A camp axe with a bearded edge for shaving beams and catching limbs. Resin smoke has stained the haft nearly black.'),
  melee('chapel-breaching-axe', 'Chapel Breaching Axe', 'axe', 'axe', 'Ashen Censure', 'Industrial conversion', 'A compact rescue axe marked for chapel doors. The rear spike finds hinges when the edge cannot.'),
  melee('roadwarden-bearded-axe', 'Roadwarden Bearded Axe', 'axe', 'axe', 'Road Wardens', 'Settlement manufacture', 'A long-bearded axe that rides flat against a saddle. Wardens use the beard to pull shields, packs, and fallen companions.'),
  melee('foundry-poleaxe', 'Foundry Poleaxe', 'axe', 'axe', 'Foundry Compact', 'Industrial conversion', 'A rivet crew fitted a hammer, hook, and cutting face to one reinforced shaft. Every surface has a different argument.'),
  melee('grave-splitter', 'Grave Splitter', 'axe', 'axe', 'Sexton Crews', 'Settlement manufacture', 'A heavy splitting axe kept for root-bound cemetery ground. The wedge-shaped head does not stop at wood.'),
  melee('tithewood-great-axe', 'Tithewood Great Axe', 'axe', 'axe', 'Tithewood Guard', 'Settlement manufacture', 'A two-handed axe paid for by a winter timber tithe. Each replacement haft carries the year it entered service.'),
  melee('pilgrim-mace', 'Pilgrim Mace', 'blunt', 'blunt', 'Road Pilgrims', 'Settlement manufacture', 'A short iron mace disguised as a walking staff beneath a leather cap. Pilgrims remove the cap when talk has failed.'),
  melee('wardens-club', 'Warden Club', 'blunt', 'blunt', 'Gate Wardens', 'Settlement manufacture', 'A lead-cored oak club with a hooked wrist strap. Gate wardens call it the second question.'),
  melee('censer-flail', 'Censer Flail', 'blunt', 'blunt', 'Processional Guard', 'Ceremonial conversion', 'A chain censer reinforced until it became a weapon. Its pierced iron head still releases old ash when it strikes.'),
  melee('bellfounder-hammer', 'Bellfounder Hammer', 'blunt', 'blunt', 'Bellfounder Guild', 'Industrial conversion', 'A balanced forging hammer with a long wrapped handle. Bellfounders hear flaws in metal and feel them in bone.'),
  melee('ossuary-maul', 'Ossuary Maul', 'blunt', 'blunt', 'Ossuary Guard', 'Settlement manufacture', 'A square maul used to close stone drawers and break blocked ones open. Pale dust has settled into every grain of the haft.'),
  melee('processional-crook', 'Processional Crook', 'blunt', 'blunt', 'Road Clergy', 'Ceremonial conversion', 'A bishop crook sleeved around an iron core after too many road attacks. The curved head can hold a doorway or drag a body clear.'),
  melee('processional-pike', 'Processional Pike', 'polearm', 'pike', 'Road Clergy', 'Ceremonial conversion', 'A two-handed ashwood pike once carried ahead of road processions. Its iron sun head kept raiders beyond arm reach. The changed fare no better.'),
  melee('quarantine-glaive', 'Quarantine Glaive', 'polearm', 'pike', 'Quarantine Orders', 'Remnant issue', 'A long cutting pole used to move contaminated debris without closing distance. The red hand mark shows where clean grip ends.'),
  melee('roadwatch-spear', 'Roadwatch Spear', 'polearm', 'pike', 'Road Wardens', 'Settlement manufacture', 'A leaf-bladed spear with a butt spike for frozen ground. Road watches stack them beside every toll shelter.'),
  melee('reliquary-halberd', 'Reliquary Halberd', 'polearm', 'pike', 'Black Reliquary', 'Recovered pattern', 'A compact halberd from a ceremonial guard rack. Its hook was sharpened only after the reliquary doors began to fail.'),
  melee('ash-hook-polearm', 'Ash Hook Polearm', 'polearm', 'pike', 'Ash Harvesters', 'Industrial conversion', 'A harvesting hook fixed to a longer shaft and braced with iron straps. It catches through cloth, hide, and open framing.'),
  melee('pallbearer-fork', 'Pallbearer Fork', 'polearm', 'pike', 'Mourning Houses', 'Ceremonial conversion', 'A two-pronged funeral rest turned into a fighting fork. Pallbearers use it to pin what should have stayed on the bier.'),
  melee('censure-breach-bar', 'Censure Breach Bar', 'field tool', 'tool-weapon', 'Ashen Censure', 'Remnant issue', 'A flat iron pry bar sized for shrine doors and floor hatches. One end is sharpened enough to settle close disputes.'),
  melee('foundry-sledge', 'Foundry Sledge', 'field tool', 'tool-weapon', 'Foundry Compact', 'Industrial conversion', 'A short-handled sledge from a rail crew. The head carries a bright scar where it struck something harder than track.'),
  melee('trench-shovel', 'Trench Shovel', 'field tool', 'tool-weapon', 'Remnant Levies', 'First Winter', 'A folding entrenching shovel locked open with wire. The edges have been filed despite every quartermaster order.'),
  melee('chain-yard-cutter', 'Chain Yard Cutter', 'field tool', 'tool-weapon', 'Chain Yard', 'Industrial conversion', 'Long bolt cutters with one jaw reforged into a pick. Yard hands use the handles to trap a weapon before closing them.'),
  melee('saintwright-rivet-hammer', 'Saintwright Rivet Hammer', 'field tool', 'tool-weapon', 'Saintwright Guild', 'Industrial conversion', 'A pneumatic hammer emptied of its air line and fitted with a weighted striking cap. The old hose collar forms a rough guard.'),
  melee('surgeon-amputation-saw', 'Surgeon Amputation Saw', 'field tool', 'tool-weapon', 'Hospital Orders', 'Recovered pattern', 'A rigid surgical saw made for fast work when medicine has already failed. The steel case bears careful boil marks and one deep dent.')
]);

export const WEAPON_CATALOG = Object.freeze([
  ...BALLISTIC_LONG_GUNS,
  ...BALLISTIC_PISTOLS,
  ...ACCELERATOR_WEAPONS,
  ...MELEE_WEAPONS
]);

export function buildWeaponItem(seed, index) {
  const groupIndex = indexForGroup(seed);
  const stats = weaponStats(seed, groupIndex);
  return {
    id: seed.id,
    name: seed.name,
    type: 'weapon',
    catalogGroup: seed.catalogGroup,
    subtype: seed.subtype,
    rarity: seed.rarity ?? rarityFor(seed, groupIndex),
    weight: seed.weight ?? stats.weight,
    groundModel: seed.model,
    equipment: { slot: 'weapon' },
    provenance: {
      era: seed.era,
      origin: seed.origin,
      factions: [slug(seed.origin)]
    },
    weapon: {
      weaponClass: weaponClassFor(seed),
      roles: rolesFor(seed),
      handedness: handednessFor(seed),
      attacks: attacksFor(seed, stats, groupIndex),
      ...(seed.ammoFamily ? {
        magazine: {
          ammoFamily: seed.ammoFamily,
          capacity: stats.capacity,
          defaultLoaded: stats.capacity,
          reloadAp: stats.reloadAp
        }
      } : {})
    },
    condition: { max: 100, default: defaultCondition(seed, groupIndex) },
    description: seed.description
  };
}

export function buildAmmoItem(definition) {
  return {
    id: definition.id ?? `${definition.family}-ammo`,
    name: definition.name,
    type: 'ammo',
    rarity: definition.family.includes('armature') || definition.family.includes('heavy') ? 'uncommon' : 'common',
    weight: definition.weight,
    groundModel: 'rounds',
    ammo: { family: definition.family },
    description: definition.description
  };
}

function ammo(family, name, weight, description, id = null) {
  return { family, name, weight, description, ...(id ? { id } : {}) };
}

function longGun(id, name, subtype, model, ammoFamily, origin, era, description) {
  return seed('ballistic-long-gun', id, name, subtype, model, ammoFamily, origin, era, description);
}

function pistol(id, name, subtype, model, ammoFamily, origin, era, description) {
  return seed('ballistic-pistol', id, name, subtype, model, ammoFamily, origin, era, description);
}

function accelerator(id, name, subtype, model, ammoFamily, origin, era, description) {
  return seed('accelerator', id, name, subtype, model, ammoFamily, origin, era, description);
}

function melee(id, name, subtype, model, origin, era, description) {
  return seed('melee', id, name, subtype, model, null, origin, era, description);
}

function seed(catalogGroup, id, name, subtype, model, ammoFamily, origin, era, description) {
  return { catalogGroup, id, name, subtype, model, ammoFamily, origin, era, description };
}

function indexForGroup(seed) {
  const group = {
    'ballistic-long-gun': BALLISTIC_LONG_GUNS,
    'ballistic-pistol': BALLISTIC_PISTOLS,
    accelerator: ACCELERATOR_WEAPONS,
    melee: MELEE_WEAPONS
  }[seed.catalogGroup] ?? [];
  return Math.max(0, group.findIndex((entry) => entry.id === seed.id));
}

function weaponStats(seed, index) {
  if (seed.catalogGroup === 'ballistic-pistol') {
    if (seed.id === 'censure-sidearm') {
      return { damage: 5, range: 5, apCost: 4, weight: 1.1, capacity: 7, reloadAp: 2 };
    }
    const heavy = /heavy|hand cannon|gatehammer/i.test(`${seed.subtype} ${seed.name}`);
    const machine = seed.subtype === 'machine pistol';
    return {
      damage: heavy ? 7 : 4 + (index % 3),
      range: heavy ? 5 : 4 + (index % 2),
      apCost: heavy ? 5 : 3 + (index % 2),
      weight: heavy ? 1.8 : 0.7 + (index % 4) * 0.15,
      capacity: seed.subtype === 'revolver' ? (heavy ? 5 : 6) : machine ? 18 : 7 + (index % 5),
      reloadAp: seed.subtype === 'revolver' ? 4 : 2 + (index % 2)
    };
  }
  if (seed.catalogGroup === 'ballistic-long-gun') {
    const shotgun = seed.subtype === 'shotgun';
    const support = seed.subtype === 'support gun';
    const precision = /marksman|anti-materiel/.test(seed.subtype);
    return {
      damage: shotgun ? 8 : support ? 7 : precision ? 9 + (index % 2) : 6 + (index % 3),
      range: shotgun ? 4 : support ? 7 : precision ? 9 : 6 + (index % 3),
      apCost: precision ? 6 : support ? 5 : 4 + (index % 2),
      weight: support ? 6.2 : precision ? 4.7 : 2.6 + (index % 5) * 0.35,
      capacity: shotgun ? 5 + (index % 3) : support ? 30 : precision ? 5 : seed.subtype === 'submachine gun' ? 24 : 12 + (index % 7),
      reloadAp: support ? 4 : precision ? 3 : 2 + (index % 2)
    };
  }
  if (seed.catalogGroup === 'accelerator') {
    const sidearm = seed.subtype.includes('sidearm');
    const heavy = /heavy|lance/.test(seed.subtype);
    const rail = seed.subtype === 'rail rifle';
    return {
      damage: sidearm ? 6 + (index % 2) : heavy ? 12 : rail ? 10 : 8 + (index % 3),
      range: sidearm ? 5 : heavy ? 8 : rail ? 10 : 7 + (index % 2),
      apCost: sidearm ? 4 : heavy ? 7 : rail ? 6 : 5,
      weight: sidearm ? 1.5 : heavy ? 7.4 : rail ? 5.1 : 3.8,
      capacity: sidearm ? 6 : heavy ? 3 : rail ? 4 : 7,
      reloadAp: sidearm ? 3 : heavy ? 5 : 4
    };
  }
  const polearm = seed.subtype === 'polearm';
  const tool = seed.subtype === 'field tool';
  const great = /great|longsword|maul|poleaxe/i.test(seed.name);
  const knife = seed.subtype === 'knife';
  return {
    damage: knife ? 3 + (index % 2) : polearm ? 6 + (index % 3) : great ? 9 : tool ? 6 : 5 + (index % 3),
    range: polearm ? 2 : 1,
    apCost: knife ? 3 : great ? 6 : polearm ? 5 : 4,
    weight: knife ? 0.45 + (index % 3) * 0.15 : polearm ? 3.1 : great ? 4.4 : tool ? 3.2 : 2.1,
    capacity: 0,
    reloadAp: 0
  };
}

function attacksFor(seed, stats, index) {
  const primary = {
    id: primaryAttackId(seed),
    name: primaryAttackName(seed),
    mode: seed.catalogGroup === 'melee' ? 'melee' : 'ranged',
    apCost: stats.apCost,
    damage: stats.damage,
    range: stats.range,
    accuracyBonus: primaryAccuracy(seed),
    conditionWear: seed.catalogGroup === 'accelerator' ? 2 : 1,
    ...(seed.ammoFamily ? { ammoCost: 1 } : {})
  };
  const alternate = alternateAttack(seed, stats, index);
  return alternate ? [primary, alternate] : [primary];
}

function alternateAttack(seed, stats, index) {
  if (seed.catalogGroup === 'ballistic-long-gun') {
    if (seed.subtype === 'submachine gun' || seed.subtype === 'support gun') {
      return { id: 'controlled-burst', name: 'Controlled Burst', mode: 'ranged', apCost: stats.apCost + 1, damage: stats.damage + 3, range: stats.range, accuracyBonus: -10, ammoCost: 3, conditionWear: 2 };
    }
    if (seed.subtype === 'shotgun') {
      return { id: 'close-spread', name: 'Close Spread', mode: 'ranged', apCost: stats.apCost, damage: stats.damage + 2, range: 3, accuracyBonus: 10, ammoCost: 1, conditionWear: 2 };
    }
    if (/marksman|anti-materiel/.test(seed.subtype)) {
      return { id: 'braced-shot', name: 'Braced Shot', mode: 'ranged', apCost: stats.apCost + 1, damage: stats.damage + 2, range: stats.range + 1, accuracyBonus: 15, ammoCost: 1, conditionWear: 2, requiresStationary: true };
    }
    if (index % 2 === 0) {
      return { id: 'snap-shot', name: 'Snap Shot', mode: 'ranged', apCost: Math.max(3, stats.apCost - 1), damage: Math.max(1, stats.damage - 1), range: Math.max(3, stats.range - 1), accuracyBonus: -10, ammoCost: 1, conditionWear: 1 };
    }
    return null;
  }
  if (seed.catalogGroup === 'ballistic-pistol') {
    if (seed.subtype === 'machine pistol') {
      return { id: 'short-burst', name: 'Short Burst', mode: 'ranged', apCost: stats.apCost + 1, damage: stats.damage + 2, range: stats.range, accuracyBonus: -10, ammoCost: 3, conditionWear: 2 };
    }
    if (index % 3 === 0) {
      return { id: 'quick-shot', name: 'Quick Shot', mode: 'ranged', apCost: Math.max(2, stats.apCost - 1), damage: Math.max(1, stats.damage - 1), range: stats.range, accuracyBonus: -10, ammoCost: 1, conditionWear: 1 };
    }
    if (index % 4 === 0) {
      return { id: 'deliberate-shot', name: 'Deliberate Shot', mode: 'ranged', apCost: stats.apCost + 1, damage: stats.damage, range: stats.range + 1, accuracyBonus: 10, ammoCost: 1, conditionWear: 1 };
    }
    return null;
  }
  if (seed.catalogGroup === 'accelerator') {
    if (index % 2 === 0 || /heavy|lance|experimental/.test(seed.subtype)) {
      return { id: 'overcharge', name: 'Overcharge', mode: 'ranged', apCost: stats.apCost + 1, damage: stats.damage + 3, range: stats.range, accuracyBonus: -5, ammoCost: 2, conditionWear: 4, requiresStationary: !seed.subtype.includes('sidearm') };
    }
    return null;
  }
  if (seed.subtype === 'knife') {
    return { id: 'quick-cut', name: 'Quick Cut', mode: 'melee', apCost: 2, damage: Math.max(2, stats.damage - 1), range: 1, accuracyBonus: 5, conditionWear: 1 };
  }
  if (seed.subtype === 'polearm') {
    return { id: 'hold-reach', name: 'Hold Reach', mode: 'melee', apCost: stats.apCost + 1, damage: stats.damage + 1, range: 2, accuracyBonus: 5, conditionWear: 2, requiresStationary: true };
  }
  if (index % 3 === 0) {
    return { id: 'committed-blow', name: 'Committed Blow', mode: 'melee', apCost: stats.apCost + 1, damage: stats.damage + 2, range: 1, accuracyBonus: -5, conditionWear: 2 };
  }
  return null;
}

function primaryAttackId(seed) {
  if (seed.catalogGroup === 'melee') return seed.subtype === 'polearm' ? 'reach-strike' : 'melee-strike';
  return 'single-shot';
}

function primaryAttackName(seed) {
  if (seed.catalogGroup !== 'melee') return seed.catalogGroup === 'accelerator' ? 'Armature Shot' : 'Single Shot';
  if (seed.subtype === 'knife') return 'Thrust';
  if (seed.subtype === 'sword') return 'Cut';
  if (seed.subtype === 'axe') return 'Hew';
  if (seed.subtype === 'blunt') return 'Strike';
  if (seed.subtype === 'polearm') return 'Long Thrust';
  return 'Tool Strike';
}

function primaryAccuracy(seed) {
  if (seed.catalogGroup === 'accelerator') return seed.subtype.includes('sidearm') ? 0 : 5;
  if (/marksman|rail rifle|anti-materiel/.test(seed.subtype)) return 10;
  if (seed.subtype === 'shotgun') return 5;
  return 0;
}

function rolesFor(seed) {
  if (seed.catalogGroup === 'melee') return ['melee', seed.subtype, seed.subtype === 'polearm' ? 'reach' : 'close'];
  return [
    'ranged',
    seed.catalogGroup === 'accelerator' ? 'accelerator' : 'firearm',
    ...(seed.catalogGroup === 'ballistic-pistol' || seed.subtype.includes('sidearm') ? ['sidearm'] : []),
    seed.subtype
  ];
}

function handednessFor(seed) {
  if (seed.catalogGroup === 'ballistic-pistol' || seed.subtype.includes('sidearm')) return 'one';
  if (seed.catalogGroup === 'melee' && (seed.subtype === 'knife' || (!/great|longsword|poleaxe|maul/i.test(seed.name) && !['polearm'].includes(seed.subtype)))) return 'one';
  return 'two';
}

function weaponClassFor(seed) {
  if (seed.catalogGroup === 'ballistic-long-gun') return 'ballistic-long-gun';
  if (seed.catalogGroup === 'ballistic-pistol') return 'ballistic-pistol';
  if (seed.catalogGroup === 'accelerator') return 'accelerator';
  return seed.subtype;
}

function rarityFor(seed, index) {
  if (seed.catalogGroup === 'accelerator') return index >= 15 ? 'epic' : index >= 8 ? 'rare' : 'uncommon';
  if (seed.catalogGroup === 'melee') return index % 11 === 0 ? 'rare' : index % 4 === 0 ? 'uncommon' : 'common';
  return index >= 17 ? 'rare' : index % 5 === 0 ? 'uncommon' : 'common';
}

function defaultCondition(seed, index) {
  if (seed.id === 'censure-sidearm') return 92;
  if (seed.id === 'processional-pike') return 86;
  if (seed.catalogGroup === 'accelerator') return 68 + (index % 5) * 5;
  return 74 + (index % 6) * 4;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
