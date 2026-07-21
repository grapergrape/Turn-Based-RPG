const LOOKS = Object.freeze({
  worker: { body: 'average', outfit: 'settlement-work-coat', gear: [], accent: 'bare-brown' },
  toolWorker: { body: 'sturdy', outfit: 'settlement-work-coat', gear: ['tool-roll'], accent: 'bare-grey' },
  runner: { body: 'lean', outfit: 'settlement-runner', gear: ['message-tube'], accent: 'dark-hood' },
  shawl: { body: 'average', outfit: 'settlement-shawl', gear: [], accent: 'bare-brown' },
  nurse: { body: 'compact', outfit: 'settlement-nurse', gear: ['medicine-bag'], accent: 'pale-hood' },
  cook: { body: 'sturdy', outfit: 'settlement-cook', gear: ['long-apron'], accent: 'bare-light' },
  mender: { body: 'old-bent', outfit: 'settlement-mender', gear: ['tool-roll'], accent: 'bare-grey' },
  clerk: { body: 'compact', outfit: 'settlement-quartermaster', gear: ['ledger'], accent: 'bare-grey' },
  elder: { body: 'old-stooped', outfit: 'settlement-shawl', gear: ['cane'], accent: 'bare-grey' },
  child: { body: 'child', outfit: 'settlement-child-blue', gear: ['child-token'], accent: 'bare-light' },
  chalkChild: { body: 'child', outfit: 'settlement-child-chalk', gear: ['tally-tags'], accent: 'bare-brown' },
  patient: { body: 'gaunt', outfit: 'settlement-shawl', gear: ['bandage-sling'], accent: 'pale-hood' },
  mechanic: { body: 'lean', outfit: 'settlement-mender', gear: ['tool-roll'], accent: 'bare-light' },
  teacher: { body: 'average', outfit: 'settlement-chapel-hand', gear: ['ledger'], accent: 'bare-light' },
  porter: { body: 'broad', outfit: 'settlement-work-coat', gear: ['crate-pack'], accent: 'bare-brown' }
});

function actorKey(id) {
  return id.replace(/^ash-road-south-/, '');
}

function person(id, name, role, look, tags = [], faction = 'south-measure') {
  return Object.freeze({
    id,
    name,
    role,
    faction,
    appearance: LOOKS[look],
    tags: Object.freeze(['ash-road-south', 'south-measure-interior', ...tags])
  });
}

export const SOUTH_MEASURE_NEW_CAST = Object.freeze([
  person('ash-road-south-sora-varek', 'Sophia Crispus', 'Morrow claim clerk', 'clerk', ['morrow-chain'], 'morrow-chain'),
  person('ash-road-south-jeren-dren', 'Junia Sabinus', 'Cooling jacket mechanic', 'mechanic', ['relief-annex']),
  person('ash-road-south-nali-lorn', 'Nathan Molitor', 'Salvaged parts sorter', 'worker', ['relief-annex']),
  person('ash-road-south-vara-sorn', 'Valeria Longinus', 'Convoy route clerk', 'clerk', ['morrow-chain'], 'morrow-chain'),
  person('ash-road-south-sann-vire', 'Samson Cotta', 'Retired freight driver and mess keeper', 'elder', ['morrow-chain'], 'morrow-chain'),
  person('ash-road-south-rava-tern', 'Rachel Bassus', 'Condenser-scale patient', 'patient', ['compact-clinic']),
  person('ash-road-south-sol-kade', 'Saul Mercator', 'Injured freight hand', 'patient', ['compact-clinic']),
  person('ash-road-south-menn-vaun', 'Manasseh Naso', 'Arrival-fever patient', 'patient', ['compact-clinic']),
  person('ash-road-south-fela-brin', 'Felicitas Rufinus', 'Shared-oven burn patient', 'patient', ['compact-clinic']),
  person('ash-road-south-jalen-olt', 'Jair Celsus', 'Isolation patient', 'patient', ['compact-clinic']),
  person('ash-road-south-rian-sile', 'Rufus Porta', 'Cup-law recorder', 'clerk', ['row-council']),
  person('ash-road-south-bela-orra', 'Martha Pistor', 'Shared-oven keeper', 'cook', ['row-council']),
  person('ash-road-south-rova-holt', 'Ruth Carbo', 'Arrival-fire representative', 'shawl', ['row-council']),
  person('ash-road-south-sima-venn', 'Simeon Fontana', 'Measure school pupil', 'child', ['child']),
  person('ash-road-south-aro-kelm', 'Abel Vitalis', 'Measure school pupil', 'chalkChild', ['child']),
  person('ash-road-south-peli-rehn', 'Phoebe Laetus', 'Kitchen helper', 'runner', ['teen']),
  person('ash-road-south-nara-quen', 'Naomi of Bethany', 'Hidden Rows seamstress', 'mender', ['hidden-rows', 'stable-alteration']),
  person('ash-road-south-toll-quen', 'Tobias of Bethany', 'Cooking-flue keeper', 'worker', ['hidden-rows']),
  person('ash-road-south-esi-quen', 'Esther of Bethany', 'Hidden Rows child', 'child', ['hidden-rows', 'child']),
  person('ash-road-south-brin-ossa', 'Dinah Viator', 'Former Chain driver', 'porter', ['hidden-rows', 'morrow-chain']),
  person('ash-road-south-mell-ossa', 'Micah Viator', 'Old water-branch witness', 'elder', ['hidden-rows']),
  person('ash-road-south-lena-ossa', 'Leah Viator', 'Message and burial runner', 'runner', ['hidden-rows', 'teen']),
  person('ash-road-south-hale-cord', 'Judah Sartor', 'Unlisted Compact patient', 'patient', ['hidden-rows', 'compact-clinic']),
  person('ash-road-south-ira-cord', 'Judith Sartor', 'Cot and screen mender', 'mender', ['hidden-rows']),
  person('ash-road-south-nim-cord', 'Noam Sartor', 'Hidden Rows child', 'chalkChild', ['hidden-rows', 'child']),
  person('ash-road-south-seren-vask', 'Serena Custos', 'Stable altered resident', 'shawl', ['hidden-rows', 'stable-alteration']),
  person('ash-road-south-meren-heth', 'Matthias Cursor', 'Charity medicine courier', 'runner', ['charity', 'choir-contact'])
]);

export function actorDataForSouthMeasure(personData) {
  return {
    id: personData.id,
    name: personData.name,
    type: 'npc',
    faction: personData.faction,
    role: personData.role,
    stats: { hp: 6, maxHp: 6, actionPoints: 0 },
    tags: [...personData.tags],
    appearance: personData.appearance
  };
}

function placement(actorId, name, x, y, ambient, options = {}) {
  const key = actorKey(actorId);
  const dialogue = options.dialogue === true
    ? `south-measure-${options.map}-${key}`
    : options.dialogue ?? null;
  return Object.freeze({
    actor: actorId,
    name,
    preferred: Object.freeze({ x, y }),
    facing: options.facing ?? 'se',
    ambient: Object.freeze(ambient),
    dialogue,
    conditions: options.conditions ?? null,
    patrol: options.patrol ?? null,
    mapMarker: options.mapMarker ?? null,
    characterSlot: options.characterSlot ?? `${options.map}-${key}`
  });
}

const UNDERCROFT = 'undercroft';
const DRAIN = 'drain';
const ANNEX = 'annex';
const FREIGHT = 'freight';
const CLINIC = 'clinic';
const HALL = 'hall';
const VARO = 'varo';
const ROWS = 'rows';
const CELLAR = 'cellar';

export const SOUTH_MEASURE_PLACEMENTS = Object.freeze({
  'south-measure-intake-undercroft': Object.freeze([
    placement('ash-road-south-ressa-venn', 'Susanna Fontana', 25, 35, [
      'The old roll puts a denial beside each transport.',
      'Do not lift a page until Noa braces the binding.',
      'My family waited outside this gate. Their names stayed below.'
    ], { map: UNDERCROFT, dialogue: true, conditions: { flag: 'resident-isolation-requested' } }),
    placement('ash-road-south-nel-varo', 'Noa Faber', 30, 22, [
      'The manifold is sound. The north feed is carrying the answer.',
      'Keep your weight off the return pipe.',
      'The relief return can carry a smaller local loop.'
    ], { map: UNDERCROFT, dialogue: true, conditions: { flag: 'resident-isolation-requested' } }),
    placement('brother-tarn', 'Brother Cassian', 49, 16, [
      'The answer comes north after every pressure knock.',
      'Quiet. The pipe is borrowing the clerk again.',
      'I can cut the signal or hold the wicket. I cannot do both alone.'
    ], { map: UNDERCROFT, dialogue: true, conditions: { flag: 'tarn-water-help-requested' } }),
    placement('ash-road-south-yara-quell', 'Aurelia Priscian', 12, 27, [
      'Do not touch the throat seam without a cloth barrier.',
      'This tissue stopped changing before our manuals were written.',
      'Sedation can keep the person intact. Custody is a separate question.'
    ], { map: UNDERCROFT, dialogue: true, conditions: { flag: 'heard-yara-quell-terms' } })
  ]),

  'south-measure-relief-drain': Object.freeze([
    placement('ash-road-south-cett-arven', 'Seth Priscus', 35, 4, [
      'Basket mesh tore again at the east joint.',
      'Keep your boots above the grey line.',
      'The annex runoff reaches charity before anyone signs for it.'
    ], { map: DRAIN }),
    placement('ash-road-south-pava-dren', 'Paula Sabinus', 27, 9, [
      'Nineteen knocks, then six quiet.',
      'The wheel is neither open nor shut.',
      'Junia says the jacket can cool it. I say the hub will shear first.'
    ], { map: DRAIN }),
    placement('ash-road-south-ari-veck', 'Asa Aquila', 9, 9, [
      'Small hands used this ledge during the last flood.',
      'A waiting place is not safe because adults forgot it.',
      'I count the children before I count the tools.'
    ], { map: DRAIN, dialogue: true })
  ]),

  'south-measure-relief-maintenance-annex': Object.freeze([
    placement('ash-road-south-holl-varek', 'Horace Crispus', 15, 21, [
      'The brace is relief stock. The claim tag is Morrow ink.',
      'If it fits the pump, ownership will become everyone’s favorite tool.',
      'My sister keeps the signatures. Ask her before you call this abandoned.'
    ], { map: ANNEX, dialogue: true }),
    placement('ash-road-south-gess-lorn', 'Jesse Molitor', 24, 16, [
      'The hoist brake died before I was born.',
      'We move the small housings by hand now.',
      'Nathan keeps the bearing cups out of the scrap pile.'
    ], { map: ANNEX }),
    placement('ash-road-south-pava-dren', 'Paula Sabinus', 7, 20, [
      'Oil the jaws before you ask them to hold.',
      'That press drifts left under load.',
      'A machine remembers every shortcut in its teeth.'
    ], { map: ANNEX }),
    placement('ash-road-south-olla-kern', 'Orpah Victor', 13, 13, [
      'Hot filings go in the black tray.',
      'The rear bay still drops glass when the wind changes.',
      'We work the front rooms because the roof has not objected yet.'
    ], { map: ANNEX }),
    placement('ash-road-south-cett-arven', 'Seth Priscus', 34, 21, [
      'The damaged shelf is counted, not trusted.',
      'Nothing leaves this bay without a second set of hands.',
      'The drain basket order is three weeks older than the rust.'
    ], { map: ANNEX }),
    placement('ash-road-south-sora-varek', 'Sophia Crispus', 12, 22, [
      'Issue slip first. Claim signature second.',
      'Resident labor is written in the margin because the form has no box for it.',
      'Horace repairs what this desk keeps from being taken twice.'
    ], { map: ANNEX, dialogue: true }),
    placement('ash-road-south-jeren-dren', 'Junia Sabinus', 6, 12, [
      'The jacket seal holds if the feed line stays cool.',
      'Hear that thin scrape? The west fitting is loose.',
      'Official schedules do not sweat beside the machine.'
    ], { map: ANNEX, dialogue: true }),
    placement('ash-road-south-nali-lorn', 'Nathan Molitor', 22, 5, [
      'Collars left. Mesh on the high rack.',
      'Bearing cups are not bowls, whatever Jesse says.',
      'A complete set would be easier to steal than these useful halves.'
    ], { map: ANNEX })
  ]),

  'south-measure-morrow-freight-house': Object.freeze([
    placement('ash-road-south-daro-mett', 'Darius Secundus', 5, 12, [
      'A route survives by naming its cost before departure.',
      'Sealed tanks still need a road and a guard shift.',
      'Water and freight can share a contract. They cannot share the same wagon bed.'
    ], { map: FREIGHT, dialogue: true }),
    placement('ash-road-south-kerr-sorn', 'Cyrus Longinus', 7, 16, [
      'Returns on the left. Camp issue behind the scale.',
      'Do not lean on the cage unless you owe it money.',
      'The good boots are expensive because the road already tested them.'
    ], { map: FREIGHT, dialogue: true }),
    placement('ash-road-south-luta-kelm', 'Lucia Vitalis', 16, 10, [
      'The north axle route lost two carts this season.',
      'A surety mark follows a household farther than a wagon.',
      'I can price the run. I cannot make the price just.'
    ], { map: FREIGHT, dialogue: true }),
    placement('ash-road-south-gatt-vire', 'Gaius Cotta', 27, 13, [
      'Bonded stores stay behind mesh.',
      'The rear door opens for crews, not arguments.',
      'Someone cut one ledger tie and left the lock untouched.'
    ], { map: FREIGHT, dialogue: true }),
    placement('ash-road-south-fara-dole', 'Leah Scriba', 5, 3, [
      'Third bunk is empty. Do not put a pack there.',
      'Memorial tags stay where the crew left them.',
      'Samson still serves nine bowls when seven drivers return.'
    ], { map: FREIGHT }),
    placement('ash-road-south-jaro-fen', 'Joab Lupus', 13, 17, [
      'The scale reads light when the floor is damp.',
      'Crates with blue cord go to the clinic.',
      'I can lash the cisterns. I will not choose who receives the first cup.'
    ], { map: FREIGHT }),
    placement('ash-road-south-hessa-vir', 'Keziah Valens', 31, 16, [
      'Rear lane clear. Main lane has claimants.',
      'A closed door keeps tempers from becoming policy.',
      'If Darius signs, the cistern wagon moves. Until then, it stays in the yard.'
    ], { map: FREIGHT }),
    placement('ash-road-south-vara-sorn', 'Valeria Longinus', 19, 10, [
      'Black pin for a lost cart. Brass pin for a burial charge.',
      'This route delivered medicine twice last month.',
      'A false surety still leaves a real family at the gate.'
    ], { map: FREIGHT, dialogue: true }),
    placement('ash-road-south-sann-vire', 'Samson Cotta', 7, 3, [
      'Drivers leave their cups upside down before a bad road.',
      'The empty bunks are not available.',
      'I keep stew warm until the loss board gets its last pin.'
    ], { map: FREIGHT })
  ]),

  'south-measure-compact-clinic': Object.freeze([
    placement('ash-road-south-yara-quell', 'Aurelia Priscian', 17, 20, [
      'Four beds occupied. Two stay open for collapse cases.',
      'Care is not consent to a census.',
      'The flow monitor can read the pulse without opening a patient file.'
    ], { map: CLINIC, dialogue: true }),
    placement('ash-road-south-tessa-bair', 'Thecla Galenus', 29, 13, [
      'Clean dressings above the red latch.',
      'I sign medicine out by dose, not by gratitude.',
      'One suppressant vial is missing from the cabinet count.'
    ], { map: CLINIC, dialogue: true }),
    placement('ash-road-south-evin-sael', 'Timothy Cato', 11, 9, [
      'The machine test starts at third bell.',
      'A city lathe turns true, and the pay carries a stamp.',
      'My mother packed the small kettle beneath my spare coat.'
    ], { map: CLINIC, dialogue: true }),
    placement('ash-road-south-dessa-olt', 'Damaris Celsus', 22, 9, [
      'Jair stays behind the screen until the rhythm settles.',
      'Isolation is a tool. It is not a sentence.',
      'Someone has been leaving lesson slips under that cup.'
    ], { map: CLINIC, dialogue: true }),
    placement('ash-road-south-pavan-ire', 'Paulinus Cato', 31, 9, [
      'Blood cards dry on the upper clips.',
      'Do not stack wet samples.',
      'The archive knows more names than the ward does.'
    ], { map: CLINIC }),
    placement('ash-road-south-rin-quor', 'Irene Celsus', 5, 17, [
      'Wash water first. Floor water second.',
      'The isolation cloth gets its own basin.',
      'A clean ward is mostly people doing dull things on time.'
    ], { map: CLINIC }),
    placement('ash-road-south-anja-kest', 'Anna Silo', 30, 20, [
      'Applicant lane starts behind the blue cord.',
      'Treatment does not promise placement.',
      'If the answer changes, I strike the old one where you can still read it.'
    ], { map: CLINIC }),
    placement('ash-road-south-rava-tern', 'Rachel Bassus', 12, 11, [
      'The dust tastes sweet when the condenser surges.',
      'I came for my lungs, not a new household number.',
      'Timothy listens longer than the form allows.'
    ], { map: CLINIC, dialogue: true }),
    placement('ash-road-south-sol-kade', 'Saul Mercator', 16, 11, [
      'Shoulder is set. Pride can wait.',
      'The crate shifted before the brake caught.',
      'Tell Joab I did not drop the medicine case.'
    ], { map: CLINIC }),
    placement('ash-road-south-menn-vaun', 'Manasseh Naso', 20, 11, [
      'Fever broke before dawn.',
      'Discharge means the unlisted fire again.',
      'My cousin Salome says letters can keep a place for you.'
    ], { map: CLINIC }),
    placement('ash-road-south-fela-brin', 'Felicitas Rufinus', 13, 16, [
      'The oven door kicked smoke across my arm.',
      'They treated the burn before asking where I sleep.',
      'Will that record follow me when I ask for water?'
    ], { map: CLINIC, dialogue: true }),
    placement('ash-road-south-jalen-olt', 'Jair Celsus', 5, 10, [
      'The second beat is mine. The third comes from the wall.',
      'Salome says fear is a door you can read from both sides.',
      'Do not let the lesson card hear my name.'
    ], { map: CLINIC, dialogue: true })
  ]),

  'south-measure-measure-hall': Object.freeze([
    placement('ash-road-south-ressa-venn', 'Susanna Fontana', 20, 10, [
      'One cup per named resident, then the arrival reserve.',
      'Precedent is a memory we agree to obey.',
      'Do not promise full pressure until Noa hears a full cycle.'
    ], { map: HALL, dialogue: true, mapMarker: { label: 'Susanna Fontana', kind: 'dialogue', reveal: 'always' } }),
    placement('ash-road-south-maud-serren', 'Monica Grammaticus', 23, 9, [
      'Speak toward the table, not over it.',
      'The oldest rule is not always the oldest justice.',
      'We record objections because silence is cheap to misquote.'
    ], { map: HALL, dialogue: true }),
    placement('ash-road-south-cassa-rehn', 'Cassia Laetus', 14, 9, [
      'Household ties belong beside the water claim.',
      'A burial copy can prove someone lived here.',
      'The roll is a tool until somebody makes it a cage.'
    ], { map: HALL, dialogue: true }),
    placement('ash-road-south-ari-veck', 'Asa Aquila', 16, 16, [
      'School ends when the kitchen needs the table.',
      'Children notice which rules adults whisper.',
      'I teach the route home before I teach the road north.'
    ], { map: HALL, dialogue: true }),
    placement('ash-road-south-nema-cord', 'Naamah Sartor', 29, 8, [
      'Current names stay on the front shelf.',
      'Old claims need two witnesses.',
      'Hidden Rows sends copies through Leah.'
    ], { map: HALL }),
    placement('ash-road-south-kiri-dast', 'Miriam Paulus', 21, 4, [
      'Burial pages are dry enough to turn.',
      'The loft leaks over the western stack.',
      'A missing grave copy can erase a water claim.'
    ], { map: HALL }),
    placement('ash-road-south-leto-marr', 'Levi Fullo', 12, 17, [
      'My house has a stone roof in the drawing.',
      'Asa says doors need hinges. Chalk cannot hold them.',
      'I put every bed above the flood line.'
    ], { map: HALL }),
    placement('ash-road-south-bess-orra', 'Beth Pistor', 4, 9, [
      'Cups with cracks go beside the stove.',
      'Victor sends spice when the arrival pot has any.',
      'Children eat before the council finds its last word.'
    ], { map: HALL }),
    placement('ash-road-south-rian-sile', 'Rufus Porta', 27, 9, [
      'Cup law begins with the household count.',
      'An exception becomes precedent when we survive it twice.',
      'Full pressure can make a liar of a careful promise.'
    ], { map: HALL, dialogue: true }),
    placement('ash-road-south-bela-orra', 'Martha Pistor', 3, 11, [
      'Bank the coals before the meeting runs long.',
      'This oven fed my mother before it fed the hall.',
      'Grain remembers rain better than councils do.'
    ], { map: HALL, dialogue: true }),
    placement('ash-road-south-rova-holt', 'Ruth Carbo', 22, 16, [
      'Arrival fires need a chair before they need advice.',
      'Half these rules were written before our tents existed.',
      'My father counts eleven mouths whenever someone says nine cups.'
    ], { map: HALL, dialogue: true }),
    placement('ash-road-south-sima-venn', 'Simeon Fontana', 15, 17, [
      'Why does the road map leave our houses blank?',
      'I wrote SOUTH MEASURE without copying.',
      'Susanna says a map can be wrong in official ink.'
    ], { map: HALL }),
    placement('ash-road-south-aro-kelm', 'Abel Vitalis', 19, 17, [
      'This wheel turns the pump in my picture.',
      'The pipe needs another bend here.',
      'I used blue chalk for water we do not have yet.'
    ], { map: HALL }),
    placement('ash-road-south-peli-rehn', 'Phoebe Laetus', 6, 11, [
      'Thirty crusts, four heel pieces.',
      'Wet fuel goes under the table, not in the oven.',
      'Late bowls are for pump watch and clinic runners.'
    ], { map: HALL })
  ]),

  'south-measure-varo-house': Object.freeze([
    placement('ash-road-south-nel-varo', 'Noa Faber', 5, 9, [
      'The bench is level enough for the manifold drawing.',
      'Every valve plan begins as a drawing someone can dispute.',
      'Isaac can hear a bad bearing through two walls.'
    ], { map: VARO, dialogue: true }),
    placement('ash-road-south-ilo-varo', 'Isaac Faber', 13, 10, [
      'The old return used a six-turn valve order.',
      'Do not clean a fault until you mark where it sat.',
      'Tobit sorted the tool pins by touch.'
    ], { map: VARO, dialogue: true }),
    placement('ash-road-south-perr-varo', 'Tobit Faber', 17, 3, [
      'Short pin, long pin, bent pin.',
      'The pump drawing has a room under the room.',
      'Noa lets me keep the brass shavings.'
    ], { map: VARO, dialogue: true })
  ]),

  'south-measure-hidden-rows': Object.freeze([
    placement('ash-road-south-ari-veck', 'Asa Aquila', 14, 8, [
      'Names stay inside unless the household sends them out.',
      'The children know both exits and no official route.',
      'Consent comes before curiosity in these rooms.'
    ], { map: ROWS, dialogue: true }),
    placement('ash-road-south-mira-soll', 'Miriam Hortus', 3, 13, [
      'Thread box stays under the dry cot.',
      'Naomi mends sleeves wide over the nail beds.',
      'We hear the surface pump through the cooking flue.'
    ], { map: ROWS }),
    placement('ash-road-south-nara-quen', 'Naomi of Bethany', 5, 12, [
      'Ask before you look at my hands.',
      'The nails changed when I was twelve. They stopped there.',
      'A wider cuff keeps strangers from making a diagnosis.'
    ], { map: ROWS, dialogue: true }),
    placement('ash-road-south-toll-quen', 'Tobias of Bethany', 15, 4, [
      'Flue draws east when the pump is quiet.',
      'Smoke tells the surface someone lives below.',
      'My exposure card burned before the room did.'
    ], { map: ROWS }),
    placement('ash-road-south-esi-quen', 'Esther of Bethany', 5, 6, [
      'The drying wall is the front door today.',
      'I can reach the hall without seeing the sky.',
      'Secret means home when adults say it softly.'
    ], { map: ROWS }),
    placement('ash-road-south-brin-ossa', 'Dinah Viator', 13, 13, [
      'I drove Chain freight before the debt learned my children.',
      'The surety folio uses my old hand mark.',
      'No guard comes through that wall while I can hear boots.'
    ], { map: ROWS, dialogue: true }),
    placement('ash-road-south-mell-ossa', 'Micah Viator', 15, 12, [
      'The water branch predates the admission booth.',
      'We closed it when the intake mouths began counting.',
      'Old pipes remember routes that ledgers forget.'
    ], { map: ROWS, dialogue: true }),
    placement('ash-road-south-lena-ossa', 'Leah Viator', 18, 14, [
      'Hall copy in, burial copy out.',
      'I use the grave passage when the wash wall is watched.',
      'A folded page looks like laundry if you carry it badly.'
    ], { map: ROWS }),
    placement('ash-road-south-hale-cord', 'Judah Sartor', 24, 7, [
      'The clinic sample bears my neighbor’s name.',
      'Treatment helped. The record would still cost us this room.',
      'Do not call a hidden name false.'
    ], { map: ROWS, dialogue: true }),
    placement('ash-road-south-ira-cord', 'Judith Sartor', 24, 13, [
      'Cot seam first, screen hem second.',
      'Inspection eyes count beds and miss people.',
      'Noam tells me who is coming by the pipe rattle.'
    ], { map: ROWS }),
    placement('ash-road-south-nim-cord', 'Noam Sartor', 23, 5, [
      'Heavy steps mean Chain boots.',
      'Clinic runners tap twice on the pipe.',
      'Your left foot lands louder than your right.'
    ], { map: ROWS }),
    placement('ash-road-south-seren-vask', 'Serena Custos', 25, 12, [
      'The plate under my scar has not grown in nine years.',
      'Stable is not the same as harmless to frightened people.',
      'You may ask. You may not take a sample.'
    ], { map: ROWS, dialogue: true })
  ]),

  'south-measure-charity-cellar': Object.freeze([
    placement('ash-road-south-iven-roa', 'Joanna Medicus', 6, 11, [
      'Clean stock stays apart from every donated vial.',
      'A medicine label is evidence before it is kindling.',
      'The lessons began after the night patients stopped sleeping.'
    ], { map: CELLAR, dialogue: true }),
    placement('ash-road-south-seli-ruun', 'Salome Justus', 11, 11, [
      'Count the cabinet again. One row is too neat.',
      'Matthias brings medicine without asking who can pay.',
      'Salome teaches letters. Some cards answer after the words end.'
    ], { map: CELLAR, dialogue: true }),
    placement('ash-road-south-neri-vaun', 'Salome Naso', 18, 10, [
      'Letters begin after the cots settle.',
      'I teach reading. The cards arrive whether I touch them or not.',
      'Rhoda likes the letter M because it has two roofs.'
    ], {
      map: CELLAR,
      dialogue: true,
      characterSlot: 'cellar-neri-vaun',
      conditions: {
        flagsAbsent: [
          'neri-agent-exposed', 'neri-agent-barred', 'neri-agent-council',
          'neri-agent-compact', 'neri-agent-morrow', 'neri-agent-killed'
        ]
      }
    }),
    placement('ash-road-south-pate-lorn', 'Peter Molitor', 18, 3, [
      'The cot below is cooler than the canvas one.',
      'Salome says an open wound can learn a better name.',
      'I have not agreed. I only listened.'
    ], { map: CELLAR }),
    placement('ash-road-south-meren-heth', 'Matthias Cursor', 4, 3, [
      'Three fever vials, two dressings, no receipt.',
      'The west road asks fewer questions after dusk.',
      'Salome is a sympathizer. That is all I was told.'
    ], { map: CELLAR, dialogue: true })
  ])
});

export const SOUTH_MEASURE_INTAKE_CLERK_AMBIENT = Object.freeze([
  'Household unresolved. Remain outside.',
  'Transport deferred until mercy becomes available.',
  'One name remains beneath the denial stamp.'
]);

export const SOUTH_MEASURE_NERI_REVEALED_SPAWN = Object.freeze({
  id: 'south-measure-false-catechist',
  preferred: Object.freeze({ x: 18, y: 10 }),
  facing: 'nw',
  encounter: 'south-measure-false-catechist',
  dialogue: 'south-measure-cellar-neri-vaun',
  dialogueRepeat: true,
  talkRadius: 1,
  characterSlot: 'cellar-neri-vaun',
  conditions: { flag: 'neri-agent-exposed', flagsAbsent: ['neri-agent-resolved'] },
  ambient: Object.freeze([
    'The second voice repeats what the first one forgives.',
    'Her chest wrap moves after she stops breathing.',
    'Small teeth close behind the lesson words.'
  ]),
  aggro: Object.freeze([
    'Do not make the children watch this lesson.',
    'You wanted the honest voice. Hear it.'
  ])
});

export const SOUTH_MEASURE_LOGICAL_PLACEMENT_COUNT = 71;
export const SOUTH_MEASURE_INTERACTIVE_PLACEMENT_COUNT = 41;
export const SOUTH_MEASURE_AMBIENT_LINE_COUNT = 213;
