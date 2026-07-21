const LOOKS = Object.freeze({
  worker: { body: 'average', outfit: 'settlement-work-coat', gear: [], accent: 'bare-brown' },
  toolWorker: { body: 'sturdy', outfit: 'settlement-work-coat', gear: ['tool-roll'], accent: 'bare-grey' },
  runner: { body: 'lean', outfit: 'settlement-runner', gear: ['message-tube'], accent: 'dark-hood' },
  shawl: { body: 'average', outfit: 'settlement-shawl', gear: [], accent: 'bare-brown' },
  ropeShawl: { body: 'compact', outfit: 'settlement-shawl', gear: ['rope-coil'], accent: 'bare-grey' },
  water: { body: 'average', outfit: 'settlement-water-carrier', gear: ['water-jars'], accent: 'blue-cloth' },
  nurse: { body: 'compact', outfit: 'settlement-nurse', gear: ['medicine-bag'], accent: 'pale-hood' },
  cook: { body: 'sturdy', outfit: 'settlement-cook', gear: ['long-apron'], accent: 'bare-light' },
  mender: { body: 'old-bent', outfit: 'settlement-mender', gear: ['tool-roll'], accent: 'bare-grey' },
  quartermaster: { body: 'heavy', outfit: 'settlement-quartermaster', gear: ['ledger'], accent: 'bare-light' },
  guard: { body: 'broad', outfit: 'settlement-work-coat', gear: ['shoulder-plate'], accent: 'dark-hood' },
  elder: { body: 'old-stooped', outfit: 'settlement-shawl', gear: ['cane'], accent: 'bare-grey' },
  teen: { body: 'teen', outfit: 'settlement-runner', gear: ['thin-pack'], accent: 'bare-brown' },
  child: { body: 'child', outfit: 'settlement-child-blue', gear: ['child-token'], accent: 'bare-light' },
  chalkChild: { body: 'child', outfit: 'settlement-child-chalk', gear: ['tally-tags'], accent: 'bare-brown' },
  chapel: { body: 'average', outfit: 'settlement-chapel-hand', gear: ['prayer-cord'], accent: 'dark-hood' },
  porter: { body: 'broad', outfit: 'settlement-work-coat', gear: ['crate-pack'], accent: 'bare-brown' },
  clerk: { body: 'compact', outfit: 'settlement-quartermaster', gear: ['ledger'], accent: 'bare-grey' },
  laundry: { body: 'average', outfit: 'settlement-shawl', gear: ['rope-coil'], accent: 'blue-cloth' },
  patient: { body: 'gaunt', outfit: 'settlement-shawl', gear: ['bandage-sling'], accent: 'pale-hood' },
  mechanic: { body: 'lean', outfit: 'settlement-mender', gear: ['tool-roll'], accent: 'bare-light' },
  teacher: { body: 'average', outfit: 'settlement-chapel-hand', gear: ['ledger'], accent: 'bare-light' },
  market: { body: 'sturdy', outfit: 'settlement-work-coat', gear: ['crate-pack'], accent: 'bare-light' },
  midwife: { body: 'sturdy', outfit: 'settlement-nurse', gear: ['medicine-bag', 'long-apron'], accent: 'bare-grey' }
});

export const ASH_ROAD_SOUTH_DISTRICTS = Object.freeze({
  'south-chain': Object.freeze({ x0: 46, y0: 63, x1: 83, y1: 79 }),
  'arrival-fringe': Object.freeze({ x0: 14, y0: 62, x1: 45, y1: 79 }),
  'charity-edge': Object.freeze({ x0: 84, y0: 64, x1: 109, y1: 79 }),
  'water-court': Object.freeze({ x0: 47, y0: 44, x1: 81, y1: 64 }),
  'morrow-yard': Object.freeze({ x0: 5, y0: 29, x1: 46, y1: 61 }),
  'old-measure-gates': Object.freeze({ x0: 48, y0: 24, x1: 82, y1: 43 }),
  'rope-rows': Object.freeze({ x0: 81, y0: 35, x1: 128, y1: 65 }),
  'compact-precinct': Object.freeze({ x0: 83, y0: 17, x1: 123, y1: 35 }),
  'relief-annex': Object.freeze({ x0: 3, y0: 7, x1: 42, y1: 28 }),
  'grave-strip': Object.freeze({ x0: 82, y0: 2, x1: 128, y1: 18 }),
  'north-verge': Object.freeze({ x0: 49, y0: 0, x1: 80, y1: 12 })
});

const MARKER_NAMES = new Set([
  'ash-road-south-ressa-venn', 'ash-road-south-daro-mett', 'ash-road-south-yara-quell', 'ash-road-south-nel-varo', 'ash-road-south-iven-roa', 'brother-tarn',
  'ash-road-south-kerr-sorn', 'ash-road-south-pera-koss', 'ash-road-south-tessa-bair'
]);

const TALKERS = new Set([
  'ash-road-south-tor-vask', 'ash-road-south-hara-doss', 'ash-road-south-eren-holt', 'ash-road-south-jarik-ardent', 'ash-road-south-iven-roa', 'ash-road-south-seli-ruun',
  'ash-road-south-ressa-venn', 'ash-road-south-nel-varo', 'brother-tarn', 'ash-road-south-kesta-brin', 'ash-road-south-hadr-malk',
  'ash-road-south-daro-mett', 'ash-road-south-kerr-sorn', 'ash-road-south-luta-kelm', 'ash-road-south-gatt-vire',
  'ash-road-south-aven-ro', 'ash-road-south-elda-morn', 'ash-road-south-pera-koss', 'ash-road-south-tal-uren',
  'ash-road-south-ilo-varo', 'ash-road-south-perr-varo', 'ash-road-south-maud-serren', 'ash-road-south-cassa-rehn', 'ash-road-south-ari-veck',
  'ash-road-south-yara-quell', 'ash-road-south-tessa-bair', 'ash-road-south-evin-sael', 'ash-road-south-dessa-olt',
  'ash-road-south-holl-varek', 'ash-road-south-merra-seln', 'ash-road-south-kell-arven'
]);

const PATROLLERS = new Set([
  'ash-road-south-ena-seln', 'ash-road-south-brann-eder', 'ash-road-south-sela-marr', 'ash-road-south-dena-sile', 'ash-road-south-lysa-tor', 'ash-road-south-jori-cade',
  'ash-road-south-joss-marr', 'ash-road-south-bera-tol', 'ash-road-south-jani-kes', 'ash-road-south-ulm-dorr', 'ash-road-south-mera-hask', 'ash-road-south-benne-korr',
  'ash-road-south-mott-rell', 'ash-road-south-gann-tare', 'ash-road-south-olla-kern', 'ash-road-south-jaro-fen', 'ash-road-south-cett-arven', 'ash-road-south-orsa-veck',
  'ash-road-south-noll-dast', 'ash-road-south-nema-cord', 'ash-road-south-fenn-rusk', 'ash-road-south-kiri-dast', 'ash-road-south-rin-quor', 'ash-road-south-orr-vask'
]);

const TRADES = Object.freeze({
  'ash-road-south-kerr-sorn': {
    title: "Cyrus's Freight Issue",
    currency: 'ducat',
    stock: [
      { item: 'tinned-beans', count: 6, price: 2 },
      { item: 'relic-rounds', count: 5, price: 3 },
      { item: 'field-dressing', count: 2, price: 5 },
      { item: 'censure-entry-roll', count: 1, price: 8 },
      { item: 'camp-issue-ribguard', count: 1, price: 11 },
      { item: 'ash-road-boots', count: 1, price: 7 },
      { item: 'remnant-service-rifle', count: 1, price: 34 },
      { item: 'chapel-breaching-axe', count: 1, price: 14 },
      { item: 'trench-shovel', count: 1, price: 8 },
      { item: 'penitent-engine-carbine', count: 1, price: 65 },
      { item: 'confessor-rail-rifle', count: 1, price: 95 },
      { item: 'bastion-spike-driver', count: 1, price: 110 },
      { item: 'full-rifle-cartridge-ammo', count: 30, price: 2 },
      { item: 'linked-heavy-cartridge-ammo', count: 12, price: 4 },
      { item: 'long-armature-ammo', count: 8, price: 6 }
    ]
  },
  'ash-road-south-pera-koss': {
    title: "Perpetua's Return Shelf",
    currency: 'ducat',
    stock: [
      { item: 'tinned-beans', count: 3, price: 1 },
      { item: 'field-dressing', count: 1, price: 4 },
      { item: 'tarnished-saint-token', count: 1, price: 3 },
      { item: 'road-warden-chit', count: 1, price: 4 },
      { item: 'ash-road-boots', count: 1, price: 6 }
    ]
  },
  'ash-road-south-tessa-bair': {
    title: "Thecla's Clinic Case",
    currency: 'ducat',
    stock: [
      { item: 'field-dressing', count: 4, price: 3 },
      { item: 'compact-suppressant', count: 1, price: 14 }
    ]
  }
});

function actorKey(id) {
  return id.replace(/^ash-road-south-/, '');
}

function entry(id, name, role, district, look, preferred, ambient, faction = 'south-measure') {
  const talk = TALKERS.has(id);
  return Object.freeze({
    id,
    name,
    role,
    district,
    faction,
    appearance: id === 'brother-tarn' ? null : LOOKS[look],
    preferred: Object.freeze(preferred),
    ambient: Object.freeze(ambient),
    talk,
    dialogue: talk ? `ash-road-south-${actorKey(id)}` : null,
    patrol: PATROLLERS.has(id),
    mapMarker: MARKER_NAMES.has(id)
      ? Object.freeze({ label: name, kind: 'dialogue', reveal: 'always' })
      : null,
    trade: TRADES[id] ?? null
  });
}

export const ASH_ROAD_SOUTH_CAST = Object.freeze([
  entry('ash-road-south-tor-vask', 'Titus Custos', 'South Chain watch', 'south-chain', 'guard', { x: 58, y: 72 }, [
    'Chain stays waist high until the north lane clears.',
    'A writ moves one traveler. It does not move a water queue.',
    'My brother fixes the north markers. I keep this end from becoming kindling.'
  ]),
  entry('ash-road-south-ena-seln', 'Hannah Quirinus', 'Queue chalker', 'south-chain', 'clerk', { x: 73, y: 73 }, [
    'Blue mark for water court. White mark for intake.',
    'Stop rubbing the chalk off. I cannot place a smudge.',
    'My aunt keeps the grave names. Mine only last until rain.'
  ]),
  entry('ash-road-south-brann-eder', 'Reuben Longus', 'Wagon-rut marshal', 'south-chain', 'worker', { x: 53, y: 69 }, [
    'Left wheels in the pale rut. Handcarts take the mud.',
    'If that axle turns here, the whole queue turns with it.',
    'I used to measure fields. Roads are fields that never stay put.'
  ]),
  entry('ash-road-south-pella-norr', 'Priscilla Niger', 'Cup runner', 'south-chain', 'teen', { x: 77, y: 69 }, [
    'Empty cups south, filled cups under the cloth.',
    'Do not ask me to skip a row. Susanna counts the handles.',
    'The road guards call me quick when they want free errands.'
  ]),

  entry('ash-road-south-hara-doss', 'Hannah of Bethel', 'Newly arrived parent', 'arrival-fringe', 'shawl', { x: 18, y: 65 }, [
    'Baruch is mending the flysheet. Thomas stays where I can see him.',
    'They gave us a fire number, not a place at the tap.',
    'Our old kettle still smells of pear leaves when it boils.'
  ]),
  entry('ash-road-south-bram-doss', 'Baruch of Bethel', 'Newly arrived parent', 'arrival-fringe', 'toolWorker', { x: 22, y: 70 }, [
    'This seam held through two road storms. It can hold one more.',
    'Canvas costs less when the seller knows you cannot leave.',
    'Hannah hates this knot. She will use it after I am asleep.'
  ]),
  entry('ash-road-south-toma-doss', 'Thomas of Bethel', 'Arrival child', 'arrival-fringe', 'child', { x: 24, y: 67 }, [
    'I found a wheel nail with the head still round.',
    'Mama says the tap is not a place for games.',
    'The black trees here make better forts than the road trees.'
  ]),
  entry('ash-road-south-eren-holt', 'Aaron Carbo', 'Arrival-fire representative', 'arrival-fringe', 'elder', { x: 29, y: 71 }, [
    'Fire Seven has nine cups and eleven mouths.',
    'We arrived after the roll closed. Thirst did not.',
    'I keep the kettle lid tied down. Wind has expensive hands.'
  ]),
  entry('ash-road-south-sela-marr', 'Selah Fullo', 'Shelter patcher', 'arrival-fringe', 'ropeShawl', { x: 35, y: 65 }, [
    'Hold that corner until the stitch bites.',
    'Fresh canvas goes to the people with old claim numbers.',
    'My cousin Levi draws houses with stone roofs. Sensible child.'
  ]),
  entry('ash-road-south-vek-orra', 'Victor Pistor', 'Cookfire keeper', 'arrival-fringe', 'cook', { x: 39, y: 72 }, [
    'Beans first. Root ends go in when the pot forgives us.',
    'One wet branch and everyone blames the cook.',
    'Beth Pistor can smell supper from Rope Rows before I ring the pan.'
  ]),
  entry('ash-road-south-dena-sile', 'Deborah Porta', 'Refuse-trench worker', 'arrival-fringe', 'worker', { x: 16, y: 75 }, [
    'Food ash here. Soiled cloth past the red stake.',
    'If the trench floods, the charity cots get it first.',
    'Veronica taught me to lime a pit before I could write my name.'
  ]),
  entry('ash-road-south-lysa-tor', 'Susanna Pastor', 'Animal-picket tender', 'arrival-fringe', 'water', { x: 27, y: 77 }, [
    'The grey mule drinks after the small goat.',
    'No, the animals cannot spare their water either.',
    'Jonah named that mule Mercy. Mercy bites.'
  ]),
  entry('ash-road-south-jori-cade', 'Jonah Mercator', 'Labor seeker', 'arrival-fringe', 'teen', { x: 42, y: 66 }, [
    'Freight yard wants backs at second bell.',
    'They pay half in debt marks if you have no camp number.',
    'I can read axle stamps. I just cannot prove who taught me.'
  ]),
  entry('ash-road-south-jarik-ardent', 'Jeremiah Afer', 'Stranded Hallowfen pump-mender', 'arrival-fringe', 'mechanic', { x: 32, y: 76 }, [
    'Hallowfen wanted a pump-mender. Its gate wanted paper.',
    'Fire Seven’s kettle leaks at the rivet. That is a problem with manners.',
    'Priscilla would call this the cost of leaving home without my saint.'
  ], 'ash-chapel-settlement'),

  entry('ash-road-south-iven-roa', 'Joanna Medicus', 'Midwife and charity cot keeper', 'charity-edge', 'midwife', { x: 97, y: 70 }, [
    'Clean linen on the left. Boiled linen under the stone.',
    'If you brought questions, wash your hands before you ask them.',
    'Rhoda slept an hour without coughing. That is enough news for now.'
  ]),
  entry('ash-road-south-seli-ruun', 'Salome Justus', 'Charity cot volunteer', 'charity-edge', 'nurse', { x: 88, y: 67 }, [
    'Half a cup, then wait for the shiver to pass.',
    'The clinic calls this unscreened. Fever calls it a bed.',
    'Peter tells the same mill story whenever the medicine works.'
  ]),
  entry('ash-road-south-pate-lorn', 'Peter Molitor', 'Fever patient', 'charity-edge', 'patient', { x: 92, y: 72 }, [
    'The blanket is dry. Leave it where it is.',
    'The prayer card went in the fire. The vial stayed.',
    'Our mill wheel sang lower just before rain.'
  ]),
  entry('ash-road-south-mila-esh', 'Milcah Bassus', 'Patient caregiver', 'charity-edge', 'shawl', { x: 102, y: 70 }, [
    'Rhoda takes water from the blue cup.',
    'Do not wake her for another count. Her ribs need the rest.',
    'She still curls one hand like she is holding her old rag bird.'
  ]),
  entry('ash-road-south-cora-vell', 'Rhoda Felix', 'Charity cot child', 'charity-edge', 'child', { x: 106, y: 74 }, [
    'I can sit up when Joanna says.',
    'The medicine tastes like a copper spoon.',
    'There is a moth on the canvas that only moves at night.'
  ]),
  entry('ash-road-south-joss-marr', 'Joseph Fullo', 'Bandage washer', 'charity-edge', 'laundry', { x: 87, y: 77 }, [
    'Red cloth soaks alone. White cloth gets boiled twice.',
    'The drain backs up whenever the water court draws hard.',
    'Selah patches tents. I patch what happens inside them.'
  ]),
  entry('ash-road-south-neri-vaun', 'Salome Naso', 'After-dark teacher', 'charity-edge', 'chapel', { x: 101, y: 78 }, [
    'Letters begin after the cots settle.',
    'I teach reading. The cards arrive whether I touch them or not.',
    'Rhoda likes the letter M because it has two roofs.'
  ]),

  entry('ash-road-south-ressa-venn', 'Susanna Fontana', 'Camp steward and keeper of the water roll', 'water-court', 'clerk', { x: 56, y: 53 }, [
    'Row Three has filled. Row Four waits on the second tank.',
    'Bring me quantities, not assurances.',
    'My great-grandmother had a place in line. I inherited the pencil.'
  ]),
  entry('ash-road-south-nel-varo', 'Noa Faber', 'Condenser mechanic', 'water-court', 'mechanic', { x: 70, y: 54 }, [
    'The governor is holding. The buried pipe is what answered.',
    'Touch the bypass before I mark it and you can explain the dry taps to Susanna.',
    'Tobit sleeps through this pitch. I envy him professionally.'
  ]),
  entry('brother-tarn', 'Brother Cassian', 'Penitent Engine', 'water-court', null, { x: 76, y: 58 }, [
    'Condenser pulse repeats every nineteen counts.',
    'My purge charge is below field doctrine.',
    'BROTHER ORS remains on the left plate. I retain the name.'
  ], 'penitent-engines'),
  entry('ash-road-south-kesta-brin', 'Tabitha Rufinus', 'Ration complainant', 'water-court', 'shawl', { x: 53, y: 60 }, [
    'Four cups in my house. The board shows three.',
    'Do not call it a mistake while my mother waits dry.',
    'She broke her blue cup last winter and still apologizes for it.'
  ]),
  entry('ash-road-south-hadr-malk', 'Hadar Niger', 'Chain water guard', 'water-court', 'guard', { x: 79, y: 50 }, [
    'One line at each tap. Keep the center clear.',
    'I guard the valve, not the numbers on Susanna’s board.',
    'My left boot leaks. The water never falls on that side.'
  ], 'morrow-chain'),
  entry('ash-road-south-bera-tol', 'Rebecca Marinus', 'Water carrier', 'water-court', 'water', { x: 59, y: 62 }, [
    'Blue jars go east. Clay jars stay in the court.',
    'The far row loses a cup to slosh on every trip.',
    'My shoulder knows every broken stone between here and the ovens.'
  ]),
  entry('ash-road-south-jani-kes', 'Jael Caupo', 'Tap keeper', 'water-court', 'toolWorker', { x: 64, y: 48 }, [
    'Turn the handle slow or it spits grit.',
    'Half pressure makes twice the arguments.',
    'Noa hears the pump. I hear which washer she forgot.'
  ]),
  entry('ash-road-south-ulm-dorr', 'Uriah Bassus', 'Settling-tank scraper', 'water-court', 'worker', { x: 73, y: 63 }, [
    'Grey scale comes off. Black scale gets Noa.',
    'Tank Two is settling dirt faster than water.',
    'My dinner tastes of lime even when I eat at the ovens.'
  ]),
  entry('ash-road-south-arlo-tern', 'Amos Bassus', 'Rope Rows elder', 'water-court', 'elder', { x: 49, y: 55 }, [
    'Set my jar down by the left post.',
    'Old knees do not make an old claim smaller.',
    'I remember when that condenser wore Compact paint.'
  ]),
  entry('ash-road-south-mera-hask', 'Ruth Secunda', 'Cup-counter aide', 'water-court', 'clerk', { x: 61, y: 57 }, [
    'House name and row first. Then give me the number of handles.',
    'If the child drinks here, mark it before you leave.',
    'Susanna can find a missing cup by the sound of my pencil.'
  ]),

  entry('ash-road-south-daro-mett', 'Darius Secundus', 'Freight factor and debt holder', 'morrow-yard', 'quartermaster', { x: 23, y: 47 }, [
    'Medicine cart leaves when the cooler holds steady.',
    'Every idle wheel is a meal that does not arrive.',
    'I still count the ford dead. Loss does not expire.'
  ], 'morrow-chain'),
  entry('ash-road-south-kerr-sorn', 'Cyrus Longinus', 'Morrow quartermaster', 'morrow-yard', 'market', { x: 34, y: 52 }, [
    'Beans by the tin. Rounds by the seal.',
    'Credit belongs to the Chain. Prices belong to me.',
    'Ugly boots usually survived their first owner. Those cost extra.'
  ], 'morrow-chain'),
  entry('ash-road-south-luta-kelm', 'Lucia Vitalis', 'Chain mechanic', 'morrow-yard', 'mechanic', { x: 28, y: 44 }, [
    'Cooler belt is seated. The relief bay still cannot hold the suppressant.',
    'Junia patches that jacket and this wagon carries water.',
    'Noa sharpened my smallest driver and pretended she had not.'
  ], 'morrow-chain'),
  entry('ash-road-south-gatt-vire', 'Gaius Cotta', 'Freight guard captain', 'morrow-yard', 'guard', { x: 41, y: 45 }, [
    'Drivers inside the rope when the north bell sounds.',
    'Three guards did not return from the ford. Their pay did.',
    'Joab cheats at tiles because he hates losing quietly.'
  ], 'morrow-chain'),
  entry('ash-road-south-benne-korr', 'Benjamin Nauta', 'Wagon loader', 'morrow-yard', 'porter', { x: 15, y: 52 }, [
    'Heavy sacks over the axle. Glass stays forward.',
    'Rush a load and the road collects it later.',
    'My mother can tell grain weight by the bend in my neck.'
  ], 'morrow-chain'),
  entry('ash-road-south-fara-dole', 'Leah Scriba', 'Grain clerk', 'morrow-yard', 'clerk', { x: 8, y: 58 }, [
    'Two sacks millet, one cracked barley.',
    'The seal says full weight. The scale has objections.',
    'I save the clean twine for my sister’s hair.'
  ], 'morrow-chain'),
  entry('ash-road-south-mott-rell', 'Matthew Nauta', 'Freight driver', 'morrow-yard', 'worker', { x: 38, y: 58 }, [
    'Check the near wheel while I set the brake.',
    'No cart leaves with that cough in the hub.',
    'My mare knows the ford better than Gaius. I do not tell Gaius.'
  ], 'morrow-chain'),
  entry('ash-road-south-hessa-vir', 'Keziah Valens', 'Medicine cooler watcher', 'morrow-yard', 'nurse', { x: 31, y: 55 }, [
    'Still cold at the hinge. Warm by the lower latch.',
    'Every time you open it, someone loses an hour of medicine.',
    'I sleep with that compressor rhythm in my teeth.'
  ], 'morrow-chain'),
  entry('ash-road-south-gann-tare', 'Gad Pastor', 'Freight animal handler', 'morrow-yard', 'water', { x: 20, y: 59 }, [
    'Let the dun mare see your hand first.',
    'Road fear spreads through a team faster than fire.',
    'She bites Darius’s coat and leaves mine alone.'
  ], 'morrow-chain'),
  entry('ash-road-south-olla-kern', 'Orpah Victor', 'Axle fitter', 'morrow-yard', 'toolWorker', { x: 43, y: 36 }, [
    'Pin is true. Sleeve is worn oval.',
    'No, hammering harder will not make the hole round.',
    'My best gauge was a wedding spoon before the handle snapped.'
  ], 'morrow-chain'),
  entry('ash-road-south-jaro-fen', 'Joab Lupus', 'Road guard', 'morrow-yard', 'guard', { x: 34, y: 31 }, [
    'West fence first, wagon lane second.',
    'Something dragged a chain beside us past the ford.',
    'Gaius says I cheat at tiles. Gaius counts too slowly.'
  ], 'morrow-chain'),
  entry('ash-road-south-cett-arven', 'Seth Priscus', 'Freight trench worker', 'morrow-yard', 'worker', { x: 6, y: 48 }, [
    'Runoff ditch slopes toward the old drain.',
    'One blocked culvert can drown a whole yard in medicine waste.',
    'Kephas sends me northern paper wrapped around lunch.'
  ], 'morrow-chain'),

  entry('ash-road-south-aven-ro', 'Eve Porta', 'Return-shelf keeper', 'old-measure-gates', 'elder', { x: 52, y: 38 }, [
    'Letters by household. Tokens in the shallow box.',
    'When a placement sends no letter or pay token, the uniform notice comes here instead.',
    'I keep the shelf dusted for people who may never return.'
  ]),
  entry('ash-road-south-elda-morn', 'Claudia Lector', 'Admission clerk', 'old-measure-gates', 'clerk', { x: 56, y: 27 }, [
    'Old numbers on the left. New arrival marks on the right.',
    'The booth stopped admitting people before it stopped counting them.',
    'My grandmother’s stamp still sticks on cold mornings.'
  ]),
  entry('ash-road-south-pera-koss', 'Perpetua Felix', 'Return-shelf barterer', 'old-measure-gates', 'market', { x: 73, y: 39 }, [
    'Beans are fresh enough. Boots are honest about their age.',
    'Do not haggle with a saint token. It has heard worse.',
    'Every object here belonged to someone who planned to come back.'
  ], 'ash-road-traders'),
  entry('ash-road-south-tal-uren', 'Talmai Calceus', 'Boot and plate mender', 'old-measure-gates', 'mender', { x: 79, y: 31 }, [
    'Set the boot down. Keep wearing the plate.',
    'I mend cracks. I do not certify miracles.',
    'This awl came through three admissions and never got a number.'
  ]),
  entry('ash-road-south-mina-ferl', 'Naomi Rufus', 'Used-clothes seller', 'old-measure-gates', 'laundry', { x: 50, y: 42 }, [
    'Blue coat is patched under both arms.',
    'Try it over your own shirt. The booth has no curtain.',
    'I leave old names stitched inside until the buyer asks.'
  ]),
  entry('ash-road-south-pell-adra', 'Philip Porta', 'Gate food seller', 'old-measure-gates', 'cook', { x: 61, y: 40 }, [
    'Turnip cake is hot. Onion cake remembers heat.',
    'One ducat buys food, not a place in the line.',
    'The children know which tray has the burnt edges.'
  ]),
  entry('ash-road-south-cale-ruun', 'Joel Justus', 'Tool broker', 'old-measure-gates', 'toolWorker', { x: 69, y: 27 }, [
    'Short wrench with clean teeth. No family history.',
    'Compact steel costs more because it has paperwork.',
    'Salome takes my bent forceps and brings them back useful.'
  ]),
  entry('ash-road-south-orsa-veck', 'Rachel Aquila', 'Market porter', 'old-measure-gates', 'porter', { x: 80, y: 41 }, [
    'Crates against the booth wall. Food stays off the ground.',
    'Leave a lane for the water carriers.',
    'Asa is my cousin. If anyone asks, I have fewer cousins.'
  ]),
  entry('ash-road-south-noll-dast', 'Noah Paulus', 'Platform tally keeper', 'old-measure-gates', 'teen', { x: 76, y: 25 }, [
    'Three bundles in, two bundles east.',
    'If it lacks a mark, it waits off the platform.',
    'Miriam says my figures lean because I write while walking.'
  ]),

  entry('ash-road-south-ilo-varo', 'Isaac Faber', 'Rope Rows elder and Noa’s father', 'rope-rows', 'elder', { x: 112, y: 45 }, [
    'Tobit left the latch loose again.',
    'A school bed for Noa is good news with a knife in it.',
    'She learned pump rhythm by tapping my ribs when she was small.'
  ]),
  entry('ash-road-south-perr-varo', 'Tobit Faber', 'Noa’s younger brother', 'rope-rows', 'teen', { x: 116, y: 49 }, [
    'I can carry two water jars if the handles match.',
    'Everyone asks whether Noa should leave. Nobody asks whether I can help.',
    'She hides the good wrench behind the flour bin.'
  ]),
  entry('ash-road-south-maud-serren', 'Monica Grammaticus', 'Slate teacher', 'rope-rows', 'teacher', { x: 91, y: 54 }, [
    'Small letters first. Names take the whole line.',
    'A census asks who exists. A school has to answer every morning.',
    'Miriam draws better valves than flowers.'
  ]),
  entry('ash-road-south-cassa-rehn', 'Cassia Laetus', 'Shared-oven keeper', 'rope-rows', 'cook', { x: 102, y: 55 }, [
    'East oven takes flatbread. West oven is cooling.',
    'Someone keeps moving Row Six ahead of the grain carriers.',
    'The cracked door makes the best brown edge.'
  ]),
  entry('ash-road-south-ari-veck', 'Asa Aquila', 'Hidden-household representative', 'rope-rows', 'chapel', { x: 124, y: 55 }, [
    'I am waiting for Rachel. That is all the market needs to know.',
    'Some households survive because the rolls do not see them.',
    'We teach the children their true row after the lamps go low.'
  ]),
  entry('ash-road-south-nema-cord', 'Naamah Sartor', 'Last Canvas frame lead', 'rope-rows', 'ropeShawl', { x: 84, y: 63 }, [
    'Brace the short pole before the roof line.',
    'Canvas tears where the row leans on it.',
    'This court was meant to last one winter. It has grandchildren.'
  ]),
  entry('ash-road-south-oss-kade', 'Othniel Mercator', 'Laundry repairer', 'rope-rows', 'laundry', { x: 89, y: 45 }, [
    'Peg that hem before the wind finds it.',
    'Soap allotment is down to one shaving per basin.',
    'I know each row by what falls from its pockets.'
  ]),
  entry('ash-road-south-mira-soll', 'Miriam Hortus', 'Herb-box keeper', 'rope-rows', 'nurse', { x: 98, y: 45 }, [
    'Willow bark dry. Feverleaf under cloth.',
    'Do not call it medicine until Joanna has weighed it.',
    'The mint survived in a cracked shell casing.'
  ]),
  entry('ash-road-south-fenn-rusk', 'Phinehas Tector', 'Roof patcher', 'rope-rows', 'toolWorker', { x: 106, y: 43 }, [
    'Pass the narrow slate. The broad one rocks.',
    'One hard rain and Row Two sleeps standing.',
    'My son thinks roofs are flat because he only sees them from below.'
  ]),
  entry('ash-road-south-kiri-dast', 'Miriam Paulus', 'School child', 'rope-rows', 'chalkChild', { x: 94, y: 58 }, [
    'This is a pump wheel. Flowers have fewer bolts.',
    'Monica says not to draw on the water board.',
    'Noah’s numbers lean because they are tired.'
  ]),
  entry('ash-road-south-leto-marr', 'Levi Fullo', 'School child', 'rope-rows', 'child', { x: 101, y: 63 }, [
    'My house has a stone roof in the picture.',
    'Selah says canvas is a kind of roof. I left it out.',
    'I gave every window its own cup.'
  ]),
  entry('ash-road-south-bess-orra', 'Beth Pistor', 'School child', 'rope-rows', 'chalkChild', { x: 109, y: 64 }, [
    'The supper pan rang before the lesson ended.',
    'I am not hungry. I only know what Victor is cooking.',
    'M makes two roofs and W makes two wells.'
  ]),
  entry('ash-road-south-dani-wren', 'Daniel Ripa', 'Wash-trough worker', 'rope-rows', 'water', { x: 86, y: 51 }, [
    'Dark cloth first. Baby linen gets the clean end.',
    'Low pressure leaves soap in everything.',
    'The trough stone is warmest just before dusk.'
  ]),
  entry('ash-road-south-erro-hain', 'Ezra Niger', 'Grain carrier', 'rope-rows', 'porter', { x: 118, y: 62 }, [
    'This sack belongs at the east oven.',
    'If the flour gets wet, Cassia will bury me in it.',
    'The children slap the sacks to hear which one is hollow.'
  ]),
  entry('ash-road-south-vela-sile', 'Veronica Porta', 'Old-row resident', 'rope-rows', 'elder', { x: 126, y: 61 }, [
    'My chair faces the court because walls are poor company.',
    'They called this temporary when my daughter was born.',
    'Deborah still uses too much lime in a refuse pit.'
  ]),

  entry('ash-road-south-yara-quell', 'Aurelia Priscian', 'Compact reintegration assessor', 'compact-precinct', 'nurse', { x: 91, y: 29 }, [
    'Applicant names first. Dependents remain on the same sheet.',
    'A smaller promise is still a promise I can keep.',
    'I remember every placement I signed and every refusal I recorded.'
  ], 'lumen-compact'),
  entry('ash-road-south-tessa-bair', 'Thecla Galenus', 'Compact clinician', 'compact-precinct', 'nurse', { x: 111, y: 29 }, [
    'Fresh dressing on the upper shelf. Suppressant stays locked.',
    'Screening cannot begin in a moving water line.',
    'I still warm the stethoscope in my palm. Training did not require it.'
  ], 'lumen-compact'),
  entry('ash-road-south-evin-sael', 'Timothy Cato', 'Compact placement applicant', 'compact-precinct', 'mechanic', { x: 86, y: 32 }, [
    'Machine works test at third bell.',
    'My mother says take the bed. She also packed only one shirt.',
    'I can true a shaft by sound if the room is quiet.'
  ]),
  entry('ash-road-south-dessa-olt', 'Damaris Celsus', 'Compact placement applicant', 'compact-precinct', 'shawl', { x: 118, y: 31 }, [
    'Clinic aide form, then exposure questions.',
    'They have a bed for me, not for Anna.',
    'She sleeps with her fingers through my sleeve.'
  ]),
  entry('ash-road-south-pavan-ire', 'Paulinus Cato', 'Compact records clerk', 'compact-precinct', 'clerk', { x: 88, y: 21 }, [
    'Black ink for history. Blue ink for today’s findings.',
    'Do not fold the exposure sheet through the seal.',
    'South Measure paper carries ash even inside the clinic case.'
  ], 'lumen-compact'),
  entry('ash-road-south-rin-quor', 'Irene Celsus', 'Compact clinic orderly', 'compact-precinct', 'worker', { x: 114, y: 20 }, [
    'Clean screen forward. Used screen to the wash frame.',
    'Keep the applicant lane clear of freight tags.',
    'Anna counts my trips and always adds one.'
  ], 'lumen-compact'),
  entry('ash-road-south-anja-kest', 'Anna Silo', 'Applicant’s child dependent', 'compact-precinct', 'child', { x: 121, y: 27 }, [
    'Damaris said I may hold her sleeve.',
    'The white tent smells sharp enough to bite.',
    'The little glass hammer makes your knee jump.'
  ]),

  entry('ash-road-south-holl-varek', 'Horace Crispus', 'Relief annex salvage foreman', 'relief-annex', 'guard', { x: 34, y: 22 }, [
    'Copper teeth in this box. Bearing cups under the tarp.',
    'The annex has parts, but the rear court has no safe floor.',
    'I worked relief issue here before the roof learned daylight.'
  ]),
  entry('ash-road-south-gess-lorn', 'Jesse Molitor', 'Hoist worker', 'relief-annex', 'porter', { x: 39, y: 17 }, [
    'Hook is seated. Take the strain slow.',
    'That beam carries less than its old plate claims.',
    'My father taught me hoist signals with a kitchen spoon.'
  ]),
  entry('ash-road-south-pava-dren', 'Paula Sabinus', 'Generator scavenger', 'relief-annex', 'mechanic', { x: 24, y: 9 }, [
    'Brushes are gone. Field coil might still be sound.',
    'Do not wake that generator unless you can stop it.',
    'Something beneath the rear slab ticks after the condenser knocks.'
  ]),

  entry('ash-road-south-merra-seln', 'Martha Quirinus', 'Grave keeper', 'grave-strip', 'chapel', { x: 109, y: 15 }, [
    'Name and row first. Cause comes only if the family permits.',
    'Unentered does not mean unnamed.',
    'Hannah’s chalk washes away. I cut deep enough for winter.'
  ]),
  entry('ash-road-south-tir-ossa', 'Tirzah Viator', 'Mourner', 'grave-strip', 'shawl', { x: 92, y: 12 }, [
    'I brought the brass hook back to her stone.',
    'The priest wrote resident. Martha wrote her name.',
    'She hated onions and loved every bad road song.'
  ]),

  entry('ash-road-south-kell-arven', 'Kephas Priscus', 'North paper broker', 'north-verge', 'runner', { x: 55, y: 8 }, [
    'Pass copies here. Originals stay under your coat.',
    'North markers accept seals, not explanations.',
    'Seth wraps lunch in my rejected forms. Good paper still serves.'
  ]),
  entry('ash-road-south-orr-vask', 'Obadiah Custos', 'Road-marker repairer', 'north-verge', 'toolWorker', { x: 75, y: 10 }, [
    'Hallowfen arrow needs another nail.',
    'No reply code means the north chain stays shut.',
    'Titus watches the south end. We compare broken signs at supper.'
  ])
]);

export const ASH_ROAD_SOUTH_HELPER_ANCHORS = Object.freeze([
  { x: 64, y: 36 }, { x: 118, y: 73 }, { x: 31, y: 54 }, { x: 20, y: 24 },
  { x: 18, y: 27 }, { x: 29, y: 48 }, { x: 98, y: 34 }, { x: 94, y: 51 },
  { x: 112, y: 48 }, { x: 122, y: 57 }, { x: 96, y: 72 }, { x: 112, y: 16 }
]);

export function actorDataForAshRoadSouth(person) {
  const tags = ['ash-road-south', person.district, person.talk ? 'talkable' : 'ambient-only'];
  if (person.patrol) tags.push('camp-patrol');
  if (person.trade) tags.push('trader');
  if (person.id === 'brother-tarn') tags.push('penitent-engine');
  const actor = {
    id: person.id,
    name: person.name,
    type: 'npc',
    faction: person.faction,
    role: person.role,
    stats: {
      hp: person.id === 'brother-tarn' ? 18 : person.faction === 'morrow-chain' ? 8 : 6,
      maxHp: person.id === 'brother-tarn' ? 18 : person.faction === 'morrow-chain' ? 8 : 6,
      actionPoints: 0
    },
    tags
  };
  if (person.appearance) actor.appearance = person.appearance;
  if (person.trade) actor.trade = person.trade;
  return actor;
}

export const ASH_ROAD_SOUTH_DIALOGUE_IDS = Object.freeze(
  ASH_ROAD_SOUTH_CAST.filter((person) => person.dialogue).map((person) => person.dialogue)
);
