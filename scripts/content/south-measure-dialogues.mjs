import { SOUTH_MEASURE_PLACEMENTS } from './south-measure-population.mjs';
import {
  SOUTH_MEASURE_CHARITY_FLAGS,
  SOUTH_MEASURE_HIDDEN_ROLL_FLAGS,
  SOUTH_MEASURE_INTAKE_FLAGS,
  SOUTH_MEASURE_ITEM_IDS,
  SOUTH_MEASURE_LEDGER_FLAGS,
  SOUTH_MEASURE_NEL_FLAGS,
  SOUTH_MEASURE_ROLL_FLAGS,
  SOUTH_MEASURE_TARN_FLAGS,
  SOUTH_MEASURE_WATER_PLAN_FLAGS,
  SOUTH_MEASURE_WATER_STATE_FLAGS
} from './south-measure-state.mjs';

const NERI_CLUES = Object.freeze([
  'neri-copy-hand-found',
  'neri-suppressant-diversion-found',
  'neri-recruit-list-found',
  'neri-host-sign-seen'
]);

const NERI_TERMINAL_FLAGS = Object.freeze([
  'neri-agent-barred',
  'neri-agent-council',
  'neri-agent-compact',
  'neri-agent-morrow',
  'neri-agent-killed',
  'neri-agent-tolerated',
  'neri-agent-unseen'
]);

const INTAKE_OUTCOMES = SOUTH_MEASURE_INTAKE_FLAGS;
const WATER_PLAN_FLAGS = SOUTH_MEASURE_WATER_PLAN_FLAGS;
const WATER_STATE_FLAGS = SOUTH_MEASURE_WATER_STATE_FLAGS;
const WATER_DECISION_FLAG = 'south-measure-water-decision-open';
const COMPACT_MONITOR_ROUTE_FLAGS = Object.freeze([
  'compact-monitoring-agreement',
  'compact-monitoring-supervised',
  'compact-monitoring-compelled'
]);
const MORROW_WATER_ROUTE_FLAGS = Object.freeze([
  'morrow-water-contract',
  'morrow-water-exchange',
  'morrow-water-purchased',
  'morrow-water-compelled'
]);
const RESIDENT_ISOLATION_INTAKE_FLAGS = Object.freeze([
  'intake-clerk-contained',
  'intake-clerk-tarn-sealed',
  'intake-clerk-compact',
  'intake-clerk-killed',
  'intake-clerk-resealed'
]);
const LOCAL_ASSEMBLY_OUTCOMES = Object.freeze([
  ...SOUTH_MEASURE_LEDGER_FLAGS,
  ...SOUTH_MEASURE_CHARITY_FLAGS,
  ...SOUTH_MEASURE_HIDDEN_ROLL_FLAGS
]);

const CELLAR_RETURN = Object.freeze({
  path: './data/levels/south_measure_charity_cellar.json',
  player: Object.freeze({ x: 17, y: 11, facing: 'ne' })
});

const UNDERCROFT_RETURN = Object.freeze({
  path: './data/levels/south_measure_intake_undercroft.json',
  player: Object.freeze({ x: 29, y: 39, facing: 'ne' })
});

const SURFACE_ASSEMBLY_RETURN = Object.freeze({
  path: './data/levels/ash_road_south.json',
  player: Object.freeze({ x: 65, y: 5, facing: 'nw' })
});

function quietExit(label = 'Leave') {
  return { label, close: true, tone: 'quiet' };
}

function selectWaterPlan({ flag, routeFlag, log, extraFlags = [] }) {
  return {
    setFlag: [flag, routeFlag, ...extraFlags],
    log
  };
}

function commitWaterPlan({ flag, stateFlag, log }) {
  return {
    setFlag: stateFlag,
    questUpdate: { quest: 'names-for-the-gate', stage: 'decide-pump-control', log },
    clearFlag: WATER_STATE_FLAGS.filter((candidate) => candidate !== stateFlag)
  };
}

function settleSideQuest({ flag, item, quest, log }) {
  return {
    setFlag: flag,
    ...(item ? { inventory: { remove: [{ item, count: 1 }], requireAll: true } } : {}),
    questUpdate: { quest, stage: 'complete', log }
  };
}

function advanceWaterDecision({ flag, stage, log, extraFlags = [] }) {
  return {
    setFlag: [flag, ...extraFlags],
    questUpdate: { quest: 'names-for-the-gate', stage, log }
  };
}

function sealWaterDecision(extraFlags = [], log = 'South Measure closes the buried feed and seals outside pump access.') {
  return {
    setFlag: [
      'south-measure-sealed', 'south-measure-plan-feed-closed',
      'south-measure-water-emergency', ...extraFlags
    ],
    clearFlag: [
      ...WATER_PLAN_FLAGS.filter((flag) => flag !== 'south-measure-plan-feed-closed'),
      ...WATER_STATE_FLAGS.filter((flag) => flag !== 'south-measure-water-emergency')
    ],
    questUpdate: { quest: 'names-for-the-gate', stage: 'decide-roll-custody', log }
  };
}

function settleIntake(flag, log, extraFlags = []) {
  return {
    setFlag: [flag, 'intake-clerk-resolved', WATER_DECISION_FLAG, 'south-measure-north-pulse-traced', ...extraFlags],
    questUpdate: {
      quest: 'names-for-the-gate', stage: 'choose-water-plan',
      log
    }
  };
}

function recordNeriClue(flag, log) {
  if (typeof log !== 'string' || log.trim().length === 0) {
    throw new Error(`${flag}: Salome clue requires a specific journal log.`);
  }
  return {
    setFlag: [flag, 'neri-investigation-started'],
    questUpdate: {
      quest: 'lesson-under-the-wrap',
      stage: 'gather-evidence',
      log
    }
  };
}

function settleRollCustody(flag, log) {
  return {
    setFlag: flag,
    inventory: {
      remove: [{ item: SOUTH_MEASURE_ITEM_IDS.originalRoll, count: 1 }],
      add: [{ item: SOUTH_MEASURE_ITEM_IDS.certifiedAbstract, count: 1 }],
      requireAll: true
    },
    questUpdate: { quest: 'names-for-the-gate', stage: 'settle-nel', log }
  };
}

function settleNel(flag, log) {
  return {
    setFlag: flag,
    questUpdate: [
      { quest: 'household-of-one', stage: 'complete', log },
      { quest: 'names-for-the-gate', stage: 'settle-tarn', log: 'Noa’s departure is settled. Decide where Brother Cassian carries the intake warning.' }
    ]
  };
}

function settleTarn(flag, log) {
  return {
    setFlag: flag,
    questUpdate: { quest: 'names-for-the-gate', stage: 'north-gate-assembly', log }
  };
}

function settleNeri(flags, log, extra = {}) {
  return {
    ...extra,
    setFlag: [...new Set([...flags, 'neri-agent-resolved'])],
    questUpdate: { quest: 'lesson-under-the-wrap', stage: 'complete', log }
  };
}

const VOICE_CARD_FIELDS = Object.freeze([
  'background', 'pressure', 'tactic', 'vocabulary', 'syntax', 'avoidance', 'contradiction'
]);

function voicedDialogue({ id, title, voice, nodes }) {
  for (const field of VOICE_CARD_FIELDS) {
    if (typeof voice?.[field] !== 'string' || voice[field].trim().length === 0) {
      throw new Error(`${id}: voice card is missing ${field}.`);
    }
  }
  return { id, title, nodes };
}

const COMPACT_DIALOGUES = [
  voicedDialogue({
    id: 'south-measure-drain-ari-veck', title: 'Asa Aquila',
    voice: {
      background: 'Hidden-household representative who teaches safe routes to children.',
      pressure: 'Keep the flood alcove useful without recording the children who hide there.',
      tactic: 'Makes the listener solve the practical problem before she explains it.',
      vocabulary: 'Handprints, flood lines, stairs, cups, routes.',
      syntax: 'Patient questions followed by one exact correction.',
      avoidance: 'Does not volunteer household names or addresses.',
      contradiction: 'Teaches children to read routes while keeping their route off official paper.'
    },
    nodes: {
      start: {
        lines: [
          'Asa wipes silt from a handprint no wider than two fingers.',
          '"When that channel climbs, where would you put the child who made this?"'
        ],
        choices: [
          { label: 'Point to the upper stair', next: 'high-water' },
          { label: 'Ask why no names are marked here', next: 'names' },
          quietExit('Leave the handprints undisturbed')
        ]
      },
      'high-water': {
        lines: [
          '"An adult picks the stair. A frightened child picks the hollow beneath it, where the water reaches first."',
          'She points above the stain. A cup and folded cloth wait on an iron hook. "Those are for getting them out, not for learning who they are."'
        ],
        choices: [
          { label: 'Ask about the missing names', next: 'names' },
          quietExit('Let Asa finish clearing the flood marks')
        ]
      },
      names: {
        lines: ['"A name beside this wall would travel farther than the child. Directions are enough."'],
        choices: [quietExit('Leave the alcove unrecorded')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-annex-holl-varek', title: 'Horace Crispus',
    voice: {
      background: 'Salvage foreman who has kept the annex standing with failed relief hardware.',
      pressure: 'Prove the old return is usable without letting anyone mistake it for an easy repair.',
      tactic: 'Answers proposals by naming the part most likely to fail.',
      vocabulary: 'Returns, gear teeth, valve hands, seams, load.',
      syntax: 'Imperatives and conditional warnings, with little ceremony.',
      avoidance: 'Will not promise capacity before naming its cost.',
      contradiction: 'Calls the machinery scrap while defending every serviceable piece.'
    },
    nodes: {
      start: {
        lines: [
          'Horace pins a relief schedule to the board with one grease-black nail.',
          '"Do not lean there. The board is sound, but the wall behind it has opinions."'
        ],
        choices: [
          {
            label: 'Have Horace trace the old return', next: 'return',
            effects: { setFlag: ['south-measure-isolation-route-known', 'south-measure-annex-access'] }
          },
          {
            label: 'Mark the relief return for Noa', next: 'cost',
            effects: {
              setFlag: ['south-measure-isolation-route-known', 'south-measure-helper-routes-open'],
              log: 'Horace marks a reduced local loop that can bypass the north feed.'
            }
          },
          quietExit('Give Horace the width of the board')
        ]
      },
      return: {
        lines: [
          'His nail follows a faded line around the north feed.',
          '"Cut here. Open the return by hand. The balance gear lost half its teeth, so every valve needs a person who knows when metal is lying."'
        ],
        choices: [
          { label: 'Ask what the smaller loop costs', next: 'cost' },
          quietExit('Leave Horace with the schedule')
        ]
      },
      cost: {
        lines: ['"Less water reaches the camp, but the buried answer reaches none of it. Put both facts on Noa’s plan."'],
        choices: [quietExit('Let Horace inspect the return seam')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-annex-sora-varek', title: 'Sophia Crispus',
    voice: {
      background: 'Morrow claim clerk working among relief-office salvage and resident repairs.',
      pressure: 'Keep both legal claims visible without erasing the people who preserved the annex.',
      tactic: 'Makes the listener compare papers before she supplies her judgment.',
      vocabulary: 'Issue slips, seals, claims, signatures, margins.',
      syntax: 'Balanced legal clauses that break when a form excludes lived work.',
      avoidance: 'Refuses a single clean answer to ownership.',
      contradiction: 'Serves a freight claim while documenting the labor that weakens it.'
    },
    nodes: {
      start: {
        lines: [
          'Sophia sets an old issue slip beneath a current Morrow claim, leaving both seals uncovered.',
          '"If you ask who owns the annex, one of these papers will lie for you."'
        ],
        choices: [
          { label: 'Compare the two seals', next: 'seals' },
          { label: 'Ask where Horace’s work appears', next: 'margin' },
          quietExit('Leave the claim unsettled')
        ]
      },
      seals: {
        lines: ['"The relief office issued these bays to a town that still exists. Morrow paid to recover them after the fire, but recovery is not the same word as ownership unless a clerk needs it to be."'],
        choices: [
          { label: 'Read Sophia’s margin', next: 'margin' },
          quietExit('Fold the claims apart')
        ]
      },
      margin: {
        lines: [
          'Horace’s name runs down the edge in smaller ink than either seal.',
          '"The form has no box for the years he gave this place. I used the space it forgot to forbid."'
        ],
        choices: [quietExit('Let Sophia finish the margin')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-annex-jeren-dren', title: 'Junia Sabinus',
    voice: {
      background: 'Cooling-jacket mechanic trained to diagnose machinery by vibration and sound.',
      pressure: 'Keep a useful machine from being discarded under an obsolete schedule.',
      tactic: 'Demands silence, then lets the machine supply the evidence.',
      vocabulary: 'Jackets, fittings, scrape, cold load, feed.',
      syntax: 'Brief sensory directions followed by technical explanation.',
      avoidance: 'Does not argue about institutional authority when a fault can be heard.',
      contradiction: 'Dismisses paperwork while knowing the exact schedule written on it.'
    },
    nodes: {
      start: {
        lines: [
          'Junia raises one finger before you speak and presses the other hand to the cooling jacket.',
          'A thin scrape passes through the casing. "West fitting, not the bearing," Junia says.'
        ],
        choices: [
          {
            label: 'Ask what the scrape proves', next: 'scrape',
            effects: { setFlag: 'south-measure-cooling-jacket-known' }
          },
          { label: 'Ask what the jacket could carry', next: 'load' },
          quietExit('Let Junia listen through another cycle')
        ]
      },
      scrape: {
        lines: [
          '"A retired machine should not complain that precisely. Refit the feed and it will hold cold again."',
          'Junia taps the relief schedule with a knuckle. "This was written by someone standing too far away."'
        ],
        choices: [quietExit('Leave the schedule to Junia')]
      },
      load: {
        lines: ['"Medicine first. If Darius sends the cooled wagon back with sealed tanks, water can take the space left over."'],
        choices: [quietExit('Let the casing speak')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-freight-kerr-sorn', title: 'Cyrus Longinus',
    voice: {
      background: 'Morrow quartermaster who sells returned goods beside a bonded store.',
      pressure: 'Move stock without pretending its price is separate from failed routes.',
      tactic: 'Opens with a sale, then undercuts his own pitch with the debt attached.',
      vocabulary: 'Weight, shelf, bond, surety, cage.',
      syntax: 'Blunt prices and dry corrections.',
      avoidance: 'Does not call a household debt fair.',
      contradiction: 'Makes his living from a system he describes without respect.'
    },
    nodes: {
      start: {
        lines: [
          'Cyrus palms the freight scale until its needle settles.',
          '"Return shelf is honest today. Everything on it has disappointed one owner already."'
        ],
        choices: [
          { label: 'Browse the return shelf', effects: { trade: 'ash-road-south-kerr-sorn' }, close: true },
          { label: 'Ask what makes the rear store bonded', next: 'surety' },
          quietExit('Keep your coin')
        ]
      },
      surety: {
        lines: [
          '"A crew signs goods against a route. When the cart fails to return, the signature walks home and sits down with the household."',
          'He nods toward the cage. "Darius keeps purifier salt back there. I sell what has already done its damage."'
        ],
        choices: [
          { label: 'Ask Cyrus to price the damage', next: 'price' },
          quietExit('Step away from the bonded cage')
        ]
      },
      price: {
        lines: ['"Cannot. The scale only weighs what came back."'],
        choices: [
          { label: 'Browse what came back', effects: { trade: 'ash-road-south-kerr-sorn' }, close: true },
          quietExit('Leave the scale at zero')
        ]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-freight-luta-kelm', title: 'Lucia Vitalis',
    voice: {
      background: 'Chain mechanic who reads route losses through freight pins and missing cargo.',
      pressure: 'Keep burial costs visible inside the route price.',
      tactic: 'Corrects the board’s color code before the listener can romanticize it.',
      vocabulary: 'Pins, teams, cargo, surety, return weight.',
      syntax: 'Compact comparisons grounded in what a cart carried home.',
      avoidance: 'Will not turn the dead into a dramatic road story.',
      contradiction: 'Calculates exact costs while objecting to the account that survives every loss.'
    },
    nodes: {
      start: {
        lines: [
          'Lucia moves your hand away from a black route pin. "Missing cart. Brass means the crew came back carrying less life than it took out."',
          'The burial marker sits in the same groove as the freight tally.'
        ],
        choices: [
          { label: 'Ask what the surety charges after a loss', next: 'surety' },
          quietExit('Leave the pins where Lucia set them')
        ]
      },
      surety: {
        lines: ['"The same amount, whichever color I use. A route price can be accurate all the way down to the cruelty."'],
        choices: [quietExit('Step back from the route board')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-freight-gatt-vire', title: 'Gaius Cotta',
    voice: {
      background: 'Freight guard captain responsible for lanes, locks, and the people blamed near them.',
      pressure: 'Identify deliberate ledger access without sacrificing a porter to suspicion.',
      tactic: 'Questions the accuser before he names his own conclusion.',
      vocabulary: 'Crossings, bolts, ties, cages, folios.',
      syntax: 'Counted observations followed by a guarded command.',
      avoidance: 'Refuses to name a thief without route evidence.',
      contradiction: 'Protects Morrow stores while limiting how Morrow suspicion falls on workers.'
    },
    nodes: {
      start: {
        lines: [
          'Gaius holds up the severed ledger tie. The rear bolt remains seated.',
          '"One cut and no forced lock. How many people did you pass between the yard door and this cage?"'
        ],
        choices: [
          {
            label: 'Say the thief knew the folio', next: 'inside',
            effects: { setFlag: 'morrow-ledger-tampering-seen' }
          },
          { label: 'Suggest a hungry porter took it', next: 'porter' },
          quietExit('Leave Gaius to count the crossings')
        ]
      },
      inside: {
        lines: ['Gaius nods once. "Valeria can tell you which household surety marks changed. I can only tell you the hand that cut this page did not need to search."'],
        choices: [quietExit('Take the question to Valeria')]
      },
      porter: {
        lines: [
          '"A hungry porter takes food where the lock is weakest. This cut went past a meal to one page."',
          'He threads a fresh tie through the cage. "Bring me a crossing count before you bring me a culprit."'
        ],
        choices: [quietExit('Withdraw the accusation')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-freight-vara-sorn', title: 'Valeria Longinus',
    voice: {
      background: 'Route clerk maintaining deliveries, losses, and burial charges on one board.',
      pressure: 'Separate a real medicine route from forged household debt.',
      tactic: 'Concedes the strongest opposing fact before exposing the false one.',
      vocabulary: 'Runs, pins, charges, hand marks, board holes.',
      syntax: 'Layered clauses that keep two truths visible at once.',
      avoidance: 'Will not call the whole route fraudulent for the convenience of an argument.',
      contradiction: 'Defends Morrow delivery records while uncovering a fraud inside them.'
    },
    nodes: {
      start: {
        lines: [
          'Valeria shifts a medicine pin west and leaves the old hole bare.',
          '"Before you ask, the deliveries were real. The board would be easier if they were not."'
        ],
        choices: [
          {
            label: 'Ask what was falsified', next: 'marks',
            effects: { setFlag: 'morrow-false-surety-found' }
          },
          { label: 'Ask why she left the old pinhole visible', next: 'loss' },
          quietExit('Leave Valeria with both records')
        ]
      },
      marks: {
        lines: ['"Someone copied household hand marks into burial charges. Medicine still arrived, and the families named beside it still owe money they never pledged."'],
        choices: [
          { label: 'Ask about the lost wheel team', next: 'loss' },
          quietExit('Let Valeria preserve the false marks')
        ]
      },
      loss: {
        lines: [
          '"Two runs arrived last month. The next lost a wheel team here." Her finger settles on the empty hole.',
          '"Erase that loss and the route becomes a sales story. Erase the deliveries and the forgery becomes one too."'
        ],
        choices: [quietExit('Step away from the route board')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-clinic-tessa-bair', title: 'Thecla Galenus',
    voice: {
      background: 'Compact clinician responsible for urgent care, screening stock, and field sales.',
      pressure: 'Find the diverted suppressant before panic destroys useful medicine.',
      tactic: 'Makes the listener choose the need she should answer.',
      vocabulary: 'Dose times, issue nights, cabinet rows, screening, stock.',
      syntax: 'Controlled clinical questions with abrupt limits when attention wanders.',
      avoidance: 'Does not speculate about a culprit before the dosing pattern is established.',
      contradiction: 'Protects Compact controls while fearing that those controls will punish every patient.'
    },
    nodes: {
      start: {
        lines: [
          'Thecla finishes counting the cold cabinet before she looks up.',
          '"If you need dressings, use the case. If you came about the missing stock, say so while I still have hands for it."'
        ],
        choices: [
          { label: 'Browse the clinic case', effects: { trade: 'ash-road-south-tessa-bair' }, close: true },
          {
            label: 'Count the missing stock with her', next: 'missing',
            effects: recordNeriClue(
              'neri-suppressant-diversion-found',
              'Thecla found a repeating suppressant shortage hidden behind real patient signatures and false dose times.'
            )
          },
          { label: 'Ask what happens if the Compact notices first', next: 'lockdown' },
          quietExit('Give the clinician her hands back')
        ]
      },
      missing: {
        lines: [
          '"One suppressant vial disappears every third issue night. The patient signatures are sound, but the written dose times belong to different bodies."',
          'She closes the cabinet. "Someone outside this ward is paying to keep an opening quiet."'
        ],
        choices: [
          { label: 'Ask what she needs done', next: 'lockdown' },
          quietExit('Leave the count with Thecla')
        ]
      },
      lockdown: {
        lines: ['"Find the person before frightened hands reach for fire. If the Compact locks this cabinet, the innocent patients lose their doses first."'],
        choices: [quietExit('Let Thecla secure the cabinet')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-clinic-evin-sael', title: 'Timothy Cato',
    voice: {
      background: 'Young machine-works applicant from a household preparing for his departure.',
      pressure: 'Convince himself the placement is a trade rather than an extraction.',
      tactic: 'Talks eagerly about tools until household details interrupt him.',
      vocabulary: 'Lathe beds, gauges, stamped pay, fingers, packing.',
      syntax: 'Precise technical clauses that trail into personal admission.',
      avoidance: 'Does not say that his mother expects him to leave for good.',
      contradiction: 'Wants independent work but measures the offer by what happens to his family bed.'
    },
    nodes: {
      start: {
        lines: ['Timothy has folded his placement form around a wrapped gauge and a spare shirt.'],
        choices: [
          { label: 'Ask about the machine-works test', next: 'test' },
          { label: 'Ask why the shirt is already packed', next: 'packed' },
          quietExit('Leave Timothy to refold the form')
        ]
      },
      test: {
        lines: [
          'His answer comes quickly. "A true lathe bed with gauges that agree. The pay comes stamped, so a foreman cannot shorten it after the shift."',
          'Then he touches the folded shirt. "If I fail, my score follows me back to Darius’s yard. The clinic bed does not."'
        ],
        choices: [
          { label: 'Ask who packed for him', next: 'packed' },
          quietExit('Let him study the test form')
        ]
      },
      packed: {
        lines: ['"My mother. She put in the good shirt before I told her I had agreed to anything, so I suppose one of us has confidence."'],
        choices: [quietExit('Leave the shirt folded')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-clinic-dessa-olt', title: 'Damaris Celsus',
    voice: {
      background: 'Clinic-aide applicant who treats consent and chart wording as immediate care.',
      pressure: 'Keep Jair’s irregular pulse from becoming a diagnosis others can exploit.',
      tactic: 'Corrects the record before answering the question.',
      vocabulary: 'Pulse intervals, fever, screens, cards, refusal.',
      syntax: 'Exact clinical distinctions followed by a demand to write them down.',
      avoidance: 'Will not call a stable irregularity an opening.',
      contradiction: 'Works inside an isolation system while challenging what its forms imply.'
    },
    nodes: {
      start: {
        lines: [
          'Damaris straightens the isolation screen without looking through its gap.',
          '"Before you ask why he is behind it, write this correctly: Jair has an irregular pulse. He does not have fever."'
        ],
        choices: [
          { label: 'Ask what the pulse means', next: 'pulse' },
          {
            label: 'Ask about the card beneath his cup', next: 'card',
            effects: recordNeriClue(
              'neri-recruit-list-found',
              'Damaris found lesson cards that recast Jair’s irregular pulse as a Choir sign.'
            )
          },
          quietExit('Leave the screen where Damaris placed it')
        ]
      },
      pulse: {
        lines: ['"It means his heart repeats an extra interval. I can keep watch without pretending the chart has answered us."'],
        choices: [
          { label: 'Ask why the lesson card was removed', next: 'card' },
          quietExit('Accept the limited finding')
        ]
      },
      card: {
        lines: [
          '"Someone called the extra beat a second witness and told him the clinic feared what it could hear."',
          'Damaris tucks the card under her own chart. "That sentence is harming him now. My uncertainty is not."'
        ],
        choices: [quietExit('Let Damaris keep the card')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-clinic-rava-tern', title: 'Rachel Bassus',
    voice: {
      background: 'Condenser-scale patient treated for damaged lungs.',
      pressure: 'Acknowledge useful care without yielding a complete movement history.',
      tactic: 'Offers the clinic its due before refusing the attached demand.',
      vocabulary: 'Night cough, breath, scale, forms, fire sites.',
      syntax: 'Measured concessions that harden at the boundary.',
      avoidance: 'Does not name every fire where they slept.',
      contradiction: 'Needs institutional treatment while resisting institutional memory.'
    },
    nodes: {
      start: {
        lines: [
          'Rachel waits for a shallow cough to pass. "Timothy shortened the night attacks. Put that in any account you carry."',
          'They fold the cloth inward before setting it down.'
        ],
        choices: [
          { label: 'Ask what should stay out of the account', next: 'boundary' },
          quietExit('Let Rachel recover their breath')
        ]
      },
      boundary: {
        lines: ['"The placement clerk wants every fire where I slept. I came for scale in my lungs, not to hand over the road that put it there."'],
        choices: [quietExit('Leave the road unnamed')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-clinic-fela-brin', title: 'Felicitas Rufinus',
    voice: {
      background: 'Shared-oven worker recovering from a flue burn.',
      pressure: 'Learn whether the treatment record will outlive the injury.',
      tactic: 'Asks the traveler for an answer before telling her own story.',
      vocabulary: 'Draft, sleeve, dressing, station, record.',
      syntax: 'Direct questions interrupted by practical burn care.',
      avoidance: 'Does not treat gratitude as consent to future tracking.',
      contradiction: 'Praises the clinic’s speed while distrusting the paper it produced.'
    },
    nodes: {
      start: {
        lines: [
          'Felicitas keeps her dressed arm clear of the cot frame.',
          '"You travel. When a clinic writes down a burn, how far does the writing follow?"'
        ],
        choices: [
          { label: 'Say Compact stations may keep it', next: 'record' },
          { label: 'Ask how the oven burned her', next: 'oven' },
          quietExit('Admit you cannot answer')
        ]
      },
      record: {
        lines: ['"Farther than the scar, then. They treated me before asking where I belonged. I would like the record to show the same restraint."'],
        choices: [quietExit('Leave Felicitas with the question')]
      },
      oven: {
        lines: [
          '"The draft turned and the oven spat through the flue. Martha dragged me clear before the sleeve took."',
          'She adjusts the dressing with two fingers. "The clinic was quicker than the questions came later."'
        ],
        choices: [quietExit('Let Felicitas rest the burn')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-hall-maud-serren', title: 'Monica Grammaticus',
    voice: {
      background: 'Slate teacher who uses literacy to resist administrative erasure.',
      pressure: 'Make the council notice who is absent without pretending to speak for them.',
      tactic: 'Turns the room into a lesson and lets the listener answer incorrectly.',
      vocabulary: 'Names, sums, signs, slates, blank space.',
      syntax: 'Teacherly questions with precise, unsentimental correction.',
      avoidance: 'Will not convert absence into invented consent.',
      contradiction: 'Believes records protect people while teaching how records can erase them.'
    },
    nodes: {
      start: {
        lines: [
          'Monica has left one chair empty at the council table.',
          '"Read the room as you would a slate. What is missing?"'
        ],
        choices: [
          { label: 'Name the empty chair', next: 'chair' },
          { label: 'Say the council lacks one vote', next: 'vote' },
          quietExit('Leave the lesson unanswered')
        ]
      },
      chair: {
        lines: ['"The chair is present. The patient or arrival parent being discussed is not, and Hidden Rows may not know the vote concerns them."'],
        choices: [quietExit('Let the absence remain visible')]
      },
      vote: {
        lines: [
          'Monica turns a piece of chalk between her fingers. "A missing vote is a sum. A missing person has a name we may not be entitled to write."',
          '"The blank stays blank. Nobody gets to fill it with agreement."'
        ],
        choices: [quietExit('Leave the chair empty')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-hall-cassa-rehn', title: 'Cassia Laetus',
    voice: {
      background: 'Shared-oven keeper who tests council rules against household labor.',
      pressure: 'Show how a burial copy can protect water access and carry debt at once.',
      tactic: 'Handles paper like bread, checking what survives heat and handling.',
      vocabulary: 'Bake time, crust, flour, household pages, copies.',
      syntax: 'Domestic comparisons sharpened into practical rulings.',
      avoidance: 'Does not grant moral authority to someone unwilling to share the work.',
      contradiction: 'Distrusts paperwork but preserves copies beside the oven where they survive.'
    },
    nodes: {
      start: {
        lines: [
          'Cassia slides a burial copy beneath the dry corner of a flour cloth.',
          '"Paper lasts longer here than in the council cupboard. Nobody opens that when the roof leaks."'
        ],
        choices: [
          { label: 'Ask why a burial copy protects water', next: 'copy' },
          quietExit('Leave Cassia to the next bake')
        ]
      },
      copy: {
        lines: [
          '"A dead witness can prove the household was here before a Compact count. The same line may hand an old debt to the child now carrying the cup."',
          'She folds the cloth back over it. "So I keep the whole line, however badly it sits."'
        ],
        choices: [quietExit('Leave the copy under dry cloth')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-hall-ari-veck', title: 'Asa Aquila',
    voice: {
      background: 'Hidden-household representative teaching settlement children inside Measure Hall.',
      pressure: 'Teach safe movement without making concealed homes legible to officials.',
      tactic: 'Asks the listener to read a child’s work before explaining the lesson.',
      vocabulary: 'Slates, routes, taps, doors, names.',
      syntax: 'Guiding questions with calm correction.',
      avoidance: 'Never pairs a concealed route with a household name.',
      contradiction: 'Defends literacy while controlling what may be written.'
    },
    nodes: {
      start: {
        lines: ['Asa turns one child’s slate toward you. A blue line bends around the letters and ends at a square with no name.'],
        choices: [
          { label: 'Trace the blue line home', next: 'route' },
          { label: 'Point to the unfinished letters', next: 'letters' },
          quietExit('Return the slate unread')
        ]
      },
      route: {
        lines: ['"Good. The line passes a safe tap and a canvas stair. The door at the end opens without asking the child to prove who sleeps behind it."'],
        choices: [
          { label: 'Ask why the letters come later', next: 'letters' },
          quietExit('Give the slate back to Asa')
        ]
      },
      letters: {
        lines: [
          '"Letters can wait until a child knows where the lesson is taking them."',
          'Asa stacks the slate face down before the council enters.'
        ],
        choices: [quietExit('Leave the lesson with its route')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-hall-rian-sile', title: 'Rufus Porta',
    voice: {
      background: 'Cup-law recorder maintaining exceptions under changing water pressure.',
      pressure: 'Write rules that survive the return of scarcity.',
      tactic: 'Rejects clean definitions and tests promises against later cases.',
      vocabulary: 'Precedent, count, exception, pressure, custody.',
      syntax: 'Careful legal sentences with a dry admission of uncertainty.',
      avoidance: 'Will not call a generous emergency promise permanent law.',
      contradiction: 'Needs precedent to protect people while knowing precedent can harden injustice.'
    },
    nodes: {
      start: {
        lines: [
          'Rufus writes beneath an older cup ruling, then leaves room for an objection.',
          '"You want the moment an exception becomes law. The page never tells us so neatly."'
        ],
        choices: [
          { label: 'Ask what Rufus writes instead', next: 'precedent' },
          { label: 'Ask why full flow worries him', next: 'pressure' },
          quietExit('Leave the objection space empty')
        ]
      },
      precedent: {
        lines: ['"I record who survived the ruling and who paid for it. If the same need returns, memory should not depend on the clerk’s mood."'],
        choices: [quietExit('Let Rufus finish the exception')]
      },
      pressure: {
        lines: ['"At full pressure, every faction can afford a generous promise. I am writing for the morning when the pipe narrows again."'],
        choices: [quietExit('Leave him to the narrower morning')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-hall-bela-orra', title: 'Martha Pistor',
    voice: {
      background: 'Shared-oven keeper whose family history is carried through food work.',
      pressure: 'Keep household memory alive without turning the oven into a monument.',
      tactic: 'Answers dates with a story about somebody doing ordinary work.',
      vocabulary: 'Coals, crust, grain bins, fuel, bake marks.',
      syntax: 'Warm, winding recollection that returns to the task in front of her.',
      avoidance: 'Does not speak of the settlement as if it began with the current council.',
      contradiction: 'Calls memory ordinary while preserving it with great care.'
    },
    nodes: {
      start: {
        lines: [
          'Martha banks the coals beneath a cracked iron plate. "If you want the oven’s age, ask the burn marks. They interrupt less than I do."',
          'One black crescent reaches behind the council wall.'
        ],
        choices: [
          { label: 'Ask about the oldest burn mark', next: 'old-mark' },
          quietExit('Let Martha mind the coals')
        ]
      },
      'old-mark': {
        lines: [
          '"My mother made that when the admission booth still opened at dawn. The council ate from two doors laid over grain bins, and she complained that everyone reached for crust before voting."',
          'Martha smiles at the plate, not at you. "That is close enough to a founding record for this room."'
        ],
        choices: [quietExit('Leave the old mark in the wall')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-hall-rova-holt', title: 'Ruth Carbo',
    voice: {
      background: 'Arrival-fire representative speaking for households living outside old rows.',
      pressure: 'Make inherited water rules count people in tents.',
      tactic: 'Forces every abstract rule back outside into the queue.',
      vocabulary: 'Tents, mouths, closing time, cups, rows.',
      syntax: 'Plain rebuttals that repeat the opponent’s term and expose its boundary.',
      avoidance: 'Will not let exclusion be described as lateness.',
      contradiction: 'Demands entry into the old count without asking old households to surrender theirs.'
    },
    nodes: {
      start: {
        lines: ['Ruth lays an arrival-fire tally across the edge of the older water roll.'],
        choices: [
          { label: 'Say the roll counts households, not tents', next: 'houses' },
          { label: 'Ask what change she wants', next: 'mouths' },
          quietExit('Leave the two counts touching')
        ]
      },
      houses: {
        lines: ['"Then bring the rule outside and show me which piece of canvas turns a family into weather. The mouths beneath it do not drink less."'],
        choices: [
          { label: 'Ask how to count the arrivals', next: 'mouths' },
          quietExit('Withdraw from the tally')
        ]
      },
      mouths: {
        lines: [
          '"Count the people standing here when the tap opens, including those who arrived after a clerk went home."',
          'Ruth keeps one hand on the old roll. "Nobody in the old rows loses a cup for admitting we exist."'
        ],
        choices: [quietExit('Leave Ruth with both tallies')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-varo-nel-varo', title: 'Noa Faber',
    voice: {
      background: 'Condenser mechanic who trusts machinery before faction promises.',
      pressure: 'Make the isolation loop understandable enough to survive outside control.',
      tactic: 'Strips political labels from a plan and names the physical work.',
      vocabulary: 'Pitch, pressure, seams, returns, valve hands.',
      syntax: 'Technical instructions broken by dry understatement.',
      avoidance: 'Does not call a plan safe until someone owns its maintenance.',
      contradiction: 'Distrusts authority while asking the settlement to accept her design.'
    },
    nodes: {
      start: {
        lines: [
          'Noa pins a rubbing of the north-feed valve over the faction seals.',
          '"Resident isolation plan sounds grand. In practice we cut the north feed, then spend half the night crawling to the old return."'
        ],
        choices: [
          {
            label: 'Have Noa mark the cut', next: 'cut',
            effects: { setFlag: 'resident-isolation-plan-read' }
          },
          { label: 'Ask who keeps the loop running', next: 'hands' },
          quietExit('Leave Noa to the ungrand work')
        ]
      },
      cut: {
        lines: [
          'Her nail stops beneath the black-gold line in the pipe skin. "North feed closes here. The old return opens after, and Hallowfen’s answer loses the path to our cups."',
          '"Flow drops. Anyone promising otherwise may demonstrate by carrying the difference."'
        ],
        choices: [
          { label: 'Ask whose hands turn the valves', next: 'hands' },
          quietExit('Leave the seam marked')
        ]
      },
      hands: {
        lines: ['"Ours. Outside help departs as soon as the report sounds impressive, so Horace is teaching the old valves to people who sleep here."'],
        choices: [quietExit('Let Noa return to the rubbing')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-varo-ilo-varo', title: 'Isaac Faber',
    voice: {
      background: 'Noa’s father and a bench worker who knows the condenser by sound.',
      pressure: 'Support Noa’s choice without making it sound like paternal permission.',
      tactic: 'Rejects the premise of the question before offering what he actually knows.',
      vocabulary: 'Bench taps, bearings, governor pitch, supper, room.',
      syntax: 'Firm refusals followed by quieter domestic detail.',
      avoidance: 'Will not say he fears the house without Noa.',
      contradiction: 'Insists her decision is hers while arranging his life around it.'
    },
    nodes: {
      start: {
        lines: [
          'Isaac taps the bench and listens to the tools answer in their hooks.',
          '"If you came to ask whether I allow Noa to leave, save us both the insult."'
        ],
        choices: [
          { label: 'Ask what he heard in the condenser', next: 'knock' },
          { label: 'Ask what changes here if Noa leaves', next: 'home' },
          quietExit('Take the permission question away')
        ]
      },
      knock: {
        lines: ['"Bearings true. Governor held exactly where she set it. Then the buried line knocked after her lever stopped, and she believed the machine instead of the schedule."'],
        choices: [quietExit('Let Isaac listen to the bench')]
      },
      home: {
        lines: [
          'He sets one loose tool farther from the edge. "Tobit and I move supper later now; the room gets quieter."',
          '"Neither fact belongs on Noa’s decision."'
        ],
        choices: [quietExit('Leave the room out of it')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-varo-perr-varo', title: 'Tobit Faber',
    voice: {
      background: 'Noa’s younger brother learning repairs from discarded parts and family work.',
      pressure: 'Prove he can become useful without inheriting Noa’s exact place.',
      tactic: 'Demonstrates competence before answering personal questions.',
      vocabulary: 'Pin heads, burrs, stair drawings, braces, fixes.',
      syntax: 'Quick physical observations that grow more careful around family.',
      avoidance: 'Does not ask Noa to stay for his sake.',
      contradiction: 'Rejects dependence while building his future from her notes.'
    },
    nodes: {
      start: {
        lines: [
          'Tobit places two tool pins in your palm. "Close your hand. The burred one catches first."',
          'He waits until you find it before returning to the pump drawing.'
        ],
        choices: [
          { label: 'Ask about the barred room on the drawing', next: 'room' },
          { label: 'Ask why he studies Noa’s plans', next: 'useful' },
          quietExit('Give the pins back')
        ]
      },
      room: {
        lines: [
          '"Under the admission booth. Noa drew the stair, and Susanna made her add the barred wicket."',
          'Tobit rubs the page edge. "The old paper calls the person in it a fixture. Asa says paper can be wrong without tearing."'
        ],
        choices: [quietExit('Leave Tobit with the drawing')]
      },
      useful: {
        lines: ['"Because I can learn this without becoming the person who never leaves. If Noa goes, I want her to go because she chose it, not because the house collapsed behind her."'],
        choices: [quietExit('Let Tobit sort the pins again')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-rows-nara-quen', title: 'Naomi of Bethany',
    voice: {
      background: 'Hidden Rows seamstress with stable changes beneath her nail beds.',
      pressure: 'Control how her body is observed and keep observation from becoming sampling.',
      tactic: 'States the boundary before granting access.',
      vocabulary: 'Seams, joints, cloth, reach, permission.',
      syntax: 'Economical consent language, then fuller explanation once obeyed.',
      avoidance: 'Does not describe her hands for someone who has not asked.',
      contradiction: 'Leaves the changes visible while refusing the openness others assume that grants.'
    },
    nodes: {
      start: {
        lines: [
          'Naomi keeps both hands on the sewing cloth.',
          '"You can ask. Do not reach while you do it."'
        ],
        choices: [
          {
            label: 'Ask permission to look at her nails', next: 'look',
            effects: { setFlag: 'hidden-rows-nara-consented' }
          },
          { label: 'Ask about the seam she is mending', next: 'cloth' },
          quietExit('Leave her hands unexamined')
        ]
      },
      look: {
        lines: [
          '"From there."',
          'Dark ridges sit beneath clean nail beds, ending before the first joints.',
          '"They changed when I was twelve. Teaching other people when to stop took longer."'
        ],
        choices: [quietExit('Thank Naomi and step back')]
      },
      cloth: {
        lines: ['Naomi turns the hem so the hidden stitch faces you. "A door curtain. Strong enough to move every day, plain enough that inspectors forget it."'],
        choices: [quietExit('Let her close the seam')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-rows-brin-ossa', title: 'Dinah Viator',
    voice: {
      background: 'Former Chain driver whose route debt was carried into his children’s names.',
      pressure: 'Expose forged sureties without exposing the Hidden Rows entrance.',
      tactic: 'Tests what led the listener to him before sharing evidence.',
      vocabulary: 'Winter runs, hand marks, folios, doors, names.',
      syntax: 'Suspicious questions followed by conditional disclosure.',
      avoidance: 'Will not name his children or current address.',
      contradiction: 'Needs the ledger challenged but fears the visibility that challenge creates.'
    },
    nodes: {
      start: {
        lines: [
          'Dinah braces the hidden door with one boot.',
          '"Which did you follow here, my hand mark or a person?"'
        ],
        choices: [
          {
            label: 'Say the freight folio carried his mark', next: 'surety',
            effects: { setFlag: 'hidden-rows-chain-witness' }
          },
          { label: 'Say no resident name will enter your report', next: 'terms' },
          quietExit('Refuse to answer')
        ]
      },
      surety: {
        lines: [
          '"I drove the winter runs they paid for. Morrow moved the next unpaid route into my children’s names and kept using my old mark."',
          'His heel stays against the door. "Break the false entries if you can. Do not attach this room to the proof."'
        ],
        choices: [quietExit('Leave the room out of the folio')]
      },
      terms: {
        lines: ['Dinah studies you for a moment. "Then ask Valeria about the surety page. If you return with an address on your tongue, this door will no longer be here."'],
        choices: [quietExit('Accept Dinah’s condition')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-rows-mell-ossa', title: 'Micah Viator',
    voice: {
      background: 'Elder witness to the water branch that predates the admission booth.',
      pressure: 'Pass on the route while preventing anyone from opening it before Junia is quiet.',
      tactic: 'Teaches through touch and remembered direction.',
      vocabulary: 'Branch, return, gate footings, pressure, household numbers.',
      syntax: 'Long spatial recollections anchored by one firm prohibition.',
      avoidance: 'Does not describe Junia as a machine part.',
      contradiction: 'Preserves an old route by keeping it closed.'
    },
    nodes: {
      start: {
        lines: [
          'Micah places the ferrule of her cane against the concealed branch. A faint pulse travels through the wood.',
          '"This pipe knew the hall before the admission booth had footings."'
        ],
        choices: [
          {
            label: 'Follow the old branch with Micah', next: 'route',
            effects: { setFlag: 'hidden-water-branch-known' }
          },
          quietExit('Leave the branch closed')
        ]
      },
      route: {
        lines: [
          '"It passes under the hall and bends west into the old intake return, though newer stone hides the bend now. We closed it when Junia began speaking household numbers through the water."',
          'Micah lifts the cane from the pipe. "Do not open it until somebody has made her quiet without pretending she was never there."'
        ],
        choices: [quietExit('Remember the bend beneath the hall')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-rows-hale-cord', title: 'Judah Sartor',
    voice: {
      background: 'Unlisted patient who received Compact treatment under a borrowed name.',
      pressure: 'Tell the truth about useful care without exposing the lender or the Rows.',
      tactic: 'Refuses the listener’s implied bargain between gratitude and privacy.',
      vocabulary: 'Bandage ink, treatment, archive, borrowed names, rooms.',
      syntax: 'Calm concessions with a boundary embedded in the same sentence.',
      avoidance: 'Will not identify the neighbor who lent the name.',
      contradiction: 'Wants Aurelia credited for the care while hiding the record from her institution.'
    },
    nodes: {
      start: {
        lines: ['Judah holds a clinic bandage with somebody else’s name written across it.'],
        choices: [
          {
            label: 'Ask what the borrowed name protected', next: 'borrowed',
            effects: { setFlag: 'hidden-rows-compact-treatment-known' }
          },
          { label: 'Say the treatment still helped', next: 'helped' },
          quietExit('Leave the written name alone')
        ]
      },
      borrowed: {
        lines: ['"The Compact had medicine and an archive with longer legs than mine. A neighbor lent me the name of someone already leaving town; the rest belongs to that neighbor."'],
        choices: [
          { label: 'Acknowledge Aurelia’s care', next: 'helped' },
          quietExit('Do not ask for the lender')
        ]
      },
      helped: {
        lines: ['"It did. Tell Aurelia if you need to, but do not make gratitude into a key for this room."'],
        choices: [quietExit('Accept the boundary')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-rows-seren-vask', title: 'Serena Custos',
    voice: {
      background: 'Hidden Rows resident with a stable calcified plate beneath an old scar.',
      pressure: 'Allow observation on his terms without surrendering tissue.',
      tactic: 'Makes consent granular and leaves the observer responsible for uncertainty.',
      vocabulary: 'Weeks, years, edge, skin, sample.',
      syntax: 'Measured facts followed by an unornamented limit.',
      avoidance: 'Will not offer certainty about what the plate means.',
      contradiction: 'Tracks the change closely while refusing the measurements others want.'
    },
    nodes: {
      start: {
        lines: ['Serena hooks one finger beneath his collar but does not move it. "Looking and taking are different questions."'],
        choices: [
          {
            label: 'Ask to look at the scar plate', next: 'look',
            effects: { setFlag: 'hidden-rows-seren-consented' }
          },
          { label: 'Ask for a scraping', next: 'sample' },
          quietExit('Ask neither question')
        ]
      },
      look: {
        lines: [
          'Serena loosens the collar. A pale plate ends beneath an old scar without breaking the skin.',
          '"It grew for six weeks after the Bloom and has held for nine years. You may carry what you saw, including what it failed to prove."'
        ],
        choices: [quietExit('Step back after looking')]
      },
      sample: {
        lines: ['His hand drops from the collar. "Nothing leaves my skin for your bag. If looking is useless without that, then you did not want to look."'],
        choices: [quietExit('Withdraw the request')]
      }
    }
  }),
  voicedDialogue({
    id: 'south-measure-cellar-seli-ruun', title: 'Salome Justus',
    voice: {
      background: 'Charity cot volunteer trained by repetition rather than formal diagnosis.',
      pressure: 'Report Salome’s pattern without overstating what she did not witness.',
      tactic: 'Gives sequence, timing, and observed limits before naming a theory.',
      vocabulary: 'Dose times, folded slips, cots, blank paper, visits.',
      syntax: 'Chronological reporting with explicit boundaries around inference.',
      avoidance: 'Will not accuse Salome of recruiting children without evidence.',
      contradiction: 'Distrusts the lessons while protecting the useful work surrounding them.'
    },
    nodes: {
      start: {
        lines: [
          'Salome folds the lesson slips face down and checks the nearest patient’s water before speaking.',
          '"Ask for the order of events. I will not improve the story for you."'
        ],
        choices: [
          {
            label: 'Have Salome give the sequence', next: 'sequence',
            effects: recordNeriClue(
              'neri-recruit-list-found',
              'Salome saw blank paper become lesson slips after Salome met adults who feared clinic rejection.'
            )
          },
          { label: 'Ask whether Salome approached children', next: 'children' },
          quietExit('Let Salome return to the cots')
        ]
      },
      sequence: {
        lines: [
          '"Salome arrives with blank paper. She sits beside adults who expect the clinic to send them away, and words appear on the slips after those visits."',
          'Salome taps one folded corner. "I saw that much. I did not see who wrote every line."'
        ],
        choices: [
          { label: 'Ask about the children', next: 'children' },
          quietExit('Keep the account to what Salome saw')
        ]
      },
      children: {
        lines: ['"She never took one aside while I was here. That fact protects the truth, not the lessons she gave the adults."'],
        choices: [quietExit('Let Salome check the next dose')]
      }
    }
  })
];

const CELLAR_IVEN = {
  id: 'south-measure-cellar-iven-roa', title: 'Joanna Medicus',
  nodes: {
    start: {
      lines: ['Joanna holds a scorched label to the lamp without touching its blackened edge.'],
      choices: [
        {
          label: 'Ask what changed in the charity stock', next: 'stock',
          effects: {
            setFlag: 'charity-stock-separated',
            questUpdate: { quest: 'charity-cot', stage: 'trace-doses', log: 'The charity stock mixes useful medicine with copied labels and missing suppressant doses.' }
          }
        },
        {
          label: 'Decide the fate of the mixed stock',
          conditions: { items: { [SOUTH_MEASURE_ITEM_IDS.charityCards]: 1 }, flagsAbsent: SOUTH_MEASURE_CHARITY_FLAGS },
          next: 'decide'
        },
        quietExit('Let Joanna return to the cot')
      ]
    },
    stock: {
      lines: [
        '"Real medicine arrived beside vials with copied labels. Then one suppressant dose vanished every few nights."',
        '"Do not call the whole shelf poison because one person used it to hide. Sick people paid for that certainty before you arrived."'
      ],
      choices: [{ label: 'Return to the stock cards', next: 'start' }, quietExit()]
    },
    decide: {
      lines: ['Joanna spreads the stock cards beside the intact medicine.', '"Choose custody if you must. Choose fire only after you name the patients it leaves untreated."'],
      choices: [
        { label: 'Separate medicine from copied stock', next: 'sort' },
        { label: 'Place the stock under resident council custody', effects: settleSideQuest({ flag: 'charity-council', item: SOUTH_MEASURE_ITEM_IDS.charityCards, quest: 'charity-cot', log: 'The resident council takes custody of the mixed charity stock.' }), next: 'done', tone: 'commit' },
        { label: 'Transfer the stock to Compact clinicians', conditions: { flag: 'heard-yara-quell-terms' }, effects: settleSideQuest({ flag: 'charity-compact', item: SOUTH_MEASURE_ITEM_IDS.charityCards, quest: 'charity-cot', log: 'Compact clinicians take the charity stock for testing and controlled issue.' }), next: 'done', tone: 'commit' },
        { label: 'Burn every suspect vial and card', effects: settleSideQuest({ flag: 'charity-burned', item: SOUTH_MEASURE_ITEM_IDS.charityCards, quest: 'charity-cot', log: 'The mixed charity stock burns, including medicine that may have remained useful.' }), next: 'burned', tone: 'danger' },
        { label: 'Keep the stock undecided', next: 'start' }
      ]
    },
    sort: {
      lines: ['Copied dose numbers repeat in batches. Genuine issues vary in their sediment and carry wax matched to the closure mark.'],
      choices: [
        { label: 'Sort by medicine practice', conditions: { fieldRatings: { medicine: 35 } }, effects: settleSideQuest({ flag: 'charity-stock-sorted', item: SOUTH_MEASURE_ITEM_IDS.charityCards, quest: 'charity-cot', log: 'Useful medicine is separated from copied stock and returned to Joanna’s cot.' }), next: 'done', tone: 'commit' },
        { label: 'Sort by Host-use signs', conditions: { fieldRatings: { hostSigns: 35 } }, effects: settleSideQuest({ flag: 'charity-stock-sorted', item: SOUTH_MEASURE_ITEM_IDS.charityCards, quest: 'charity-cot', log: 'The stock used to hide a Host change is isolated without burning the useful medicine.' }), next: 'done', tone: 'commit' },
        {
          label: 'Compare the seals with a Compact suppressant vial', conditions: { items: { 'compact-suppressant': 1 } },
          effects: {
            setFlag: 'charity-stock-sorted',
            inventory: {
              remove: [
                { item: SOUTH_MEASURE_ITEM_IDS.charityCards, count: 1 },
                { item: 'compact-suppressant', count: 1 }
              ],
              requireAll: true
            },
            questUpdate: { quest: 'charity-cot', stage: 'complete', log: 'A sealed suppressant sample identifies the copied batches. Joanna keeps the useful medicine.' }
          },
          next: 'done', tone: 'commit'
        },
        { label: 'Do not guess at the stock', next: 'decide' }
      ]
    },
    done: {
      lines: ['Joanna writes the outcome on a clean card and places it above the cot board.', '"Now the next dose has a name attached to the decision."'],
      choices: [quietExit()]
    },
    burned: {
      lines: ['The copied labels curl first. Sealed fever vials crack one by one in the heat.', 'Joanna does not look away.'],
      choices: [quietExit()]
    }
  }
};

const ROWS_ARI = {
  id: 'south-measure-rows-ari-veck', title: 'Asa Aquila',
  nodes: {
    start: {
      lines: ['Asa closes the private water list before speaking.'],
      choices: [
        { label: 'Ask why these households stay hidden', next: 'hidden' },
        {
          label: 'Show Asa the names found under lime',
          conditions: { items: { [SOUTH_MEASURE_ITEM_IDS.originalRoll]: 1 }, flagsAbsent: SOUTH_MEASURE_HIDDEN_ROLL_FLAGS },
          next: 'names'
        },
        { label: 'Admit that you forced the hidden door', conditions: { flag: 'hidden-rows-entry-forced' }, next: 'forced' },
        quietExit('Leave the private list closed')
      ]
    },
    hidden: {
      lines: [
        '"The Compact would study some of them, while the Chain still owns paper on others. The rest need no reason beyond wanting a door that stays theirs."',
        '"You can learn who lives here by asking each person. You cannot take this list as permission."'
      ],
      choices: [{ label: 'Return to the list', next: 'start' }, quietExit()]
    },
    forced: {
      lines: [
        'Asa looks once toward the concealed door and once toward the nearest child.',
        '"Then do not ask me to call trespass trust. Finish the water work and leave the route out of your report."'
      ],
      choices: [{ label: 'Return to the list', next: 'start' }, quietExit()]
    },
    names: {
      lines: [
        'Asa reads only the first name on each exposed household line, then covers the addresses with one hand.',
        '"The roll can defend our cups. The same page can deliver us to a clinic archive or a debt collector."'
      ],
      choices: [
        { label: 'Keep the hidden names private', effects: settleSideQuest({ flag: 'hidden-roll-private', quest: 'names-under-lime', log: 'The original roll may prove the household count, but Hidden Rows names remain private.' }), next: 'done', tone: 'commit' },
        { label: 'Enter the names on the public water roll', effects: settleSideQuest({ flag: 'hidden-roll-public', quest: 'names-under-lime', log: 'Hidden Rows households enter the public water roll with their addresses exposed.' }), next: 'done', tone: 'commit' },
        { label: 'Give the hidden-name copy to Compact clinicians', conditions: { flag: 'heard-yara-quell-terms' }, effects: settleSideQuest({ flag: 'hidden-roll-compact', quest: 'names-under-lime', log: 'A Compact copy receives the Hidden Rows names and exposure histories.' }), next: 'done', tone: 'commit' },
        { label: 'Give the hidden-name copy to Morrow auditors', conditions: { flag: 'heard-daro-mett-terms' }, effects: settleSideQuest({ flag: 'hidden-roll-morrow', quest: 'names-under-lime', log: 'A Morrow audit copy receives the Hidden Rows names and debt history.' }), next: 'done', tone: 'commit' },
        { label: 'Fold the roll closed for now', next: 'start' }
      ]
    },
    done: {
      lines: ['Asa copies the decision without copying another name.', '"That is the consent you have. Carry no larger one."'],
      choices: [quietExit()]
    }
  }
};

const UNDERCROFT_RESSA = {
  id: 'south-measure-undercroft-ressa-venn',
  title: 'Susanna Fontana Below the Gate',
  nodes: {
    start: {
      lines: [
        'Susanna reads the oldest household roll with one finger resting beside the denial column.',
        '"My great-grandmother died under that sentence. The thing in the wicket still knows the household number."'
      ],
      choices: [
        { label: 'Ask what must survive', next: 'survive' },
        {
          label: 'Record the buried pulse on the council board',
          conditions: { questStages: { 'names-for-the-gate': 'trace-buried-pulse' } },
          effects: {
            setFlag: ['south-measure-helper-routes-open', WATER_DECISION_FLAG, 'south-measure-north-pulse-traced'],
            questUpdate: {
              quest: 'names-for-the-gate', stage: 'resolve-intake-clerk',
              log: 'The buried feed carries the Hallowfen rhythm. Resolve the Intake Clerk before choosing a water plan.'
            }
          },
          next: 'routes'
        },
        quietExit('Leave Susanna with the roll')
      ]
    },
    survive: {
      lines: [
        '"The names and whoever remains inside that body must survive if we can manage it. I will not call the failure clean if they do not."',
        '"Read before you cut. Decide the water after the pipe stops answering."'
      ],
      choices: [{ label: 'Return to the roll', next: 'start' }, quietExit()]
    },
    routes: {
      lines: [
        'Susanna writes MONITORED FLOW, IMPORTED WATER, ISOLATED LOOP, and FEED CLOSED on the back of a rejected transport order.',
        '"Each answer has a person who pays. We choose after the wicket is quiet."'
      ],
      choices: [{ label: 'Return to the roll', next: 'start' }, quietExit()]
    }
  }
};

const UNDERCROFT_NEL = {
  id: 'south-measure-undercroft-nel-varo',
  title: 'Noa Faber at the Isolation Manifold',
  nodes: {
    start: {
      lines: ['Noa has chalked the isolation manifold without disturbing the black-gold line beneath its pipe skin.'],
      choices: [
        { label: 'Ask whether the north feed can be isolated', next: 'isolation' },
        {
          label: 'Choose the isolated resident loop',
          conditions: {
            flag: WATER_DECISION_FLAG,
            flags: ['south-measure-isolation-route-known', 'intake-clerk-resolved'],
            flagsAbsent: WATER_PLAN_FLAGS,
            flagsAtLeast: { count: 1, of: RESIDENT_ISOLATION_INTAKE_FLAGS }
          },
          effects: selectWaterPlan({
            flag: 'south-measure-plan-isolated-loop',
            routeFlag: 'resident-isolation-selected',
            log: 'Noa marks the old return for an isolated resident loop.'
          }),
          next: 'chosen'
        },
        quietExit('Give Noa room to work')
      ]
    },
    isolation: {
      lines: [
        '"Yes, after the Clerk is quiet. We cut the northbound vein first. The relief return then carries what the old feed no longer can."',
        '"The loop carries less water. It also carries no Compact census and no Morrow delivery debt."'
      ],
      choices: [{ label: 'Return to the manifold', next: 'start' }, quietExit()]
    },
    chosen: {
      lines: ['Noa marks the north-feed seam and circles the relief return.', '"Then this is our water plan. Tell Susanna before anyone turns a valve."'],
      choices: [quietExit('Return to the hall')]
    }
  }
};

const UNDERCROFT_TARN = {
  id: 'south-measure-undercroft-brother-tarn',
  title: 'Brother Cassian at the East Pipe',
  nodes: {
    start: {
      lines: [
        'Cassian holds a listening cup against the pipe. The cords at his throat twitch after each pressure knock.',
        '"The Clerk answers north. Something beyond the fields answers back."'
      ],
      choices: [
        { label: 'Ask him to cut the signal', next: 'cut' },
        {
          label: 'Ask him to seal the Clerk in the wicket',
          conditions: { flagsAbsent: INTAKE_OUTCOMES },
          effects: settleIntake(
            'intake-clerk-tarn-sealed',
            'Cassian cuts Junia’s answering signal from the water while preserving the wicket and original roll.',
            ['intake-roll-preserved', 'tarn-clerk-seal-spent']
          ),
          next: 'seal', tone: 'commit'
        },
        quietExit('Let Cassian listen')
      ]
    },
    cut: {
      lines: [
        '"I can break this branch from the water line. We lose the cleanest record of the answer with it."',
        '"Keep the pump steady while I choose where the silence begins."'
      ],
      choices: [{ label: 'Return to the pipe', next: 'start' }, quietExit()]
    },
    seal: {
      lines: [
        'Cassian knots a black cord around the wicket brace. Every rib mouth stops on the same unfinished number.',
        '"The signal is cut from the water. It may still remember the road."'
      ],
      choices: [quietExit('Step away from the sealed wicket')]
    }
  }
};

const UNDERCROFT_YARA = {
  id: 'south-measure-undercroft-yara-quell',
  title: 'Aurelia Priscian at the Wicket',
  nodes: {
    start: {
      lines: ['Aurelia watches the Clerk’s throat seam through a square of treated cloth.'],
      choices: [
        { label: 'Ask whether the Clerk is still aware', next: 'aware' },
        {
          label: 'Give the Clerk and roll to Compact custody',
          conditions: { flagsAbsent: INTAKE_OUTCOMES },
          effects: settleIntake(
            'intake-clerk-compact',
            'Aurelia prepares Junia for supported removal. The original roll will travel under Compact claim.',
            ['intake-roll-preserved', 'intake-roll-compact-claim']
          ),
          next: 'custody', tone: 'commit'
        },
        quietExit('Leave the examination floor')
      ]
    },
    aware: {
      lines: [
        '"The responses are patterned, but patterns can contain a person. It still protects one name from the denial sequence."',
        '"Sedation can preserve the tissue. It cannot make custody neutral."'
      ],
      choices: [{ label: 'Return to the wicket', next: 'start' }, quietExit()]
    },
    custody: {
      lines: [
        'Aurelia closes the treated cloth around the wicket opening.',
        '"My team will cut the braces with the body supported. South Measure receives a full copy of the roll. The original travels with us."'
      ],
      choices: [quietExit('Let the Compact prepare the removal')]
    }
  }
};

const ONA_VEYL = {
  id: 'south-measure-undercroft-ona-veyl',
  title: 'The Intake Clerk',
  nodes: {
    start: {
      lines: [
        'The figure is fixed through the admission wicket. Fused hands close around a stamp of wrist bone.',
        'The smaller rib mouth speaks first. "Household denied for unresolved exposure. Remain outside until mercy becomes available."'
      ],
      choices: [
        { label: 'Read the roll beside the wicket', next: 'name', effects: { setFlag: 'intake-clerk-name-known' } },
        { label: 'Examine Junia without touching the wicket', next: 'answer' },
        { label: 'Prepare the wicket before deciding', next: 'prepare', conditions: { flagsAbsent: INTAKE_OUTCOMES } },
        { label: 'Decide the Clerk’s fate', next: 'fate', conditions: { flagsAbsent: INTAKE_OUTCOMES } },
        quietExit('Step back from the wicket')
      ]
    },
    name: {
      lines: [
        'The last protected entry names Junia Lector, junior admission clerk. A thumb has smeared every later denial except her own.',
        'The human mouth moves once. "Junia. Present for duty. Transport deferred."'
      ],
      choices: [{ label: 'Return to the wicket', next: 'start' }, quietExit()]
    },
    answer: {
      lines: [
        'The stamp presses into the fused palms. One lifted rib catches against the iron screen while the human mouth works around a second breath.',
        '"Mercy allocation remains empty. Junia Lector remains present for duty."'
      ],
      choices: [{ label: 'Return to the wicket', next: 'start' }, quietExit()]
    },
    prepare: {
      lines: [
        'The feed gauge jumps whenever Junia’s rib mouths reach the household number beneath her own.',
        'You could brace the wicket before moving Junia, or sedate the living tissue and map where it joins the desk. Leaving it untouched remains possible.'
      ],
      choices: [
        { label: 'Map the living tissue before moving it', conditions: { fieldRatings: { medicine: 35 } }, effects: { setFlag: 'intake-clerk-medical-prep' }, next: 'prepared' },
        {
          label: 'Set the restraint frame to Susanna’s intake count',
          conditions: { flag: 'intake-clerk-name-known' },
          effects: { setFlag: 'intake-clerk-restraint-prep' },
          next: 'prepared'
        },
        {
          label: 'Use a Compact suppressant vial', conditions: { items: { 'compact-suppressant': 1 } },
          effects: {
            setFlag: 'intake-clerk-suppressed',
            inventory: { remove: [{ item: 'compact-suppressant', count: 1 }], requireAll: true }
          },
          next: 'suppressed', tone: 'commit'
        },
        { label: 'Ask Cassian to map the answering signal', conditions: { flag: 'tarn-water-help-requested' }, effects: { setFlag: 'intake-clerk-signal-mapped' }, next: 'mapped' },
        { label: 'Return to the wicket', next: 'start' }
      ]
    },
    prepared: {
      lines: ['The next denial catches against the new brace and loses one of its voices.', 'Junia’s human mouth says her own name before the sequence begins again.'],
      choices: [{ label: 'Decide the Clerk’s fate', next: 'fate' }, { label: 'Wait', next: 'start' }]
    },
    suppressed: {
      lines: ['The suppressant darkens the thin gold seams beneath Junia’s throat. Three rib mouths close. The human mouth keeps breathing.', 'The change is temporary, but the wicket stops pulling against its bolts.'],
      choices: [{ label: 'Decide the Clerk’s fate', next: 'fate' }, { label: 'Wait', next: 'start' }]
    },
    mapped: {
      lines: ['Cassian marks the pressure knocks on the floor. Junia answers north only after the pipe answers first.', 'The signal can be cut without severing the water feed.'],
      choices: [{ label: 'Decide the Clerk’s fate', next: 'fate' }, { label: 'Wait', next: 'start' }]
    },
    fate: {
      lines: ['The feed controls shake. Junia’s rib mouths begin the denial sequence again.'],
      choices: [
        { label: 'Preserve Junia at the wicket', next: 'preserve' },
        { label: 'Choose outside custody', next: 'custody' },
        { label: 'Destroy the wicket or tear Junia free', next: 'destroy' },
        { label: 'Delay the decision', next: 'start' }
      ]
    },
    preserve: {
      lines: ['Junia’s body bears down on the denial desk. The original roll and northward signal are trapped in the same assembly.'],
      choices: [
        {
          label: 'Contain Junia after the preparation',
          conditions: { flagsAtLeast: { count: 1, of: ['intake-clerk-medical-prep', 'intake-clerk-restraint-prep', 'intake-clerk-suppressed'] } },
          effects: settleIntake(
            'intake-clerk-contained',
            'The prepared restraint contains Junia without separating her from the denial desk. The original roll remains intact.',
            ['intake-roll-preserved']
          ),
          next: 'contained', tone: 'commit'
        },
        {
          label: 'Contain the wicket by field protocol', conditions: { fieldRatings: { containment: 40 } },
          effects: settleIntake(
            'intake-clerk-contained',
            'Field containment quiets Junia inside the wicket. South Measure keeps the original roll beside her.',
            ['intake-roll-preserved']
          ),
          next: 'contained', tone: 'commit'
        },
        {
          label: 'Reseal the admission wicket', conditions: { fieldRatings: { engineering: 35 } },
          effects: settleIntake(
            'intake-clerk-resealed',
            'The admission wicket is resealed around Junia, preserving the roll while cutting the answering pressure.',
            ['intake-roll-preserved']
          ),
          next: 'resealed', tone: 'commit'
        },
        {
          label: 'Let Cassian seal the answering signal',
          conditions: { flagsAtLeast: { count: 1, of: ['tarn-water-help-requested', 'intake-clerk-signal-mapped'] } },
          effects: settleIntake(
            'intake-clerk-tarn-sealed',
            'Cassian spends his full seal on Junia’s northward signal. Her body and the roll remain at the wicket.',
            ['intake-roll-preserved', 'tarn-clerk-seal-spent']
          ),
          next: 'sealed', tone: 'commit'
        },
        { label: 'Choose another fate', next: 'fate' }
      ]
    },
    custody: {
      lines: ['Aurelia’s treated support frame can carry Junia. No other faction has offered a living-custody protocol.'],
      choices: [
        {
          label: 'Release Junia to Compact custody',
          conditions: { flag: 'heard-yara-quell-terms' },
          effects: settleIntake(
            'intake-clerk-compact',
            'Compact clinicians take living custody of Junia. Their claim includes the original household roll.',
            ['intake-roll-preserved', 'intake-roll-compact-claim']
          ),
          next: 'compact', tone: 'commit'
        },
        { label: 'Choose another fate', next: 'fate' }
      ]
    },
    destroy: {
      lines: ['The oldest bolts pass through bone and desk wood together. Fire is certain. Removal is not.'],
      choices: [
        {
          label: 'Burn the body and denial desk',
          effects: settleIntake(
            'intake-clerk-burned',
            'Junia and the denial desk burn together. Heat damages the original household roll.',
            ['intake-roll-damaged']
          ),
          next: 'burned', tone: 'danger'
        },
        {
          label: 'Tear Junia free and face what survives',
          effects: { setFlag: 'intake-clerk-forced-open', loadLevel: UNDERCROFT_RETURN },
          close: true, tone: 'danger'
        },
        { label: 'Choose another fate', next: 'fate' }
      ]
    },
    contained: {
      lines: ['The return feed closes. Junia remains fixed, breathing in time with a quiet pipe.', 'The roll stays in South Measure.'],
      choices: [quietExit()]
    },
    sealed: {
      lines: ['Cassian’s cord draws tight around the brace. The northward answer stops.', 'Junia whispers her own name once, too softly for the rib mouths to repeat.'],
      choices: [quietExit()]
    },
    resealed: {
      lines: ['The admission shutter closes around the old braces. Junia’s human mouth remains on the occupied side.', 'The denial sequence continues behind iron at the pace of a sleeping breath.'],
      choices: [quietExit('Leave the resealed wicket')]
    },
    compact: {
      lines: ['Treated cloth closes over the wicket. Compact braces take the body’s weight.', 'The original roll is packed beside the sedation case.'],
      choices: [quietExit()]
    },
    burned: {
      lines: ['Fire takes the clerk’s coat before it reaches the opened ribs.', 'Several roll pages blacken where the denial desk holds them against the body.'],
      choices: [quietExit()]
    }
  }
};

const FREIGHT_DARO = {
  id: 'south-measure-freight-daro-mett', title: 'Darius Secundus',
  nodes: {
    start: {
      lines: ['Darius keeps one hand on the cistern schedule beside the medicine route board.'],
      choices: [
        { label: 'Ask what imported water would cost', next: 'cost' },
        {
          label: 'Negotiate for Morrow cistern service',
          conditions: {
            flags: [WATER_DECISION_FLAG, 'intake-clerk-resolved'],
            flagsAbsent: WATER_PLAN_FLAGS
          },
          next: 'acquire'
        },
        {
          label: 'Settle the disputed surety ledger',
          conditions: {
            items: { [SOUTH_MEASURE_ITEM_IDS.pumpLedger]: 1 },
            flagsAbsent: SOUTH_MEASURE_LEDGER_FLAGS
          },
          next: 'ledger'
        },
        quietExit('Leave the cistern schedule with Darius')
      ]
    },
    cost: {
      lines: [
        '"We close the buried feed and cover a fixed daily ration with sealed tanks and purifier salt. The road becomes part of every cup."',
        '"That is supply with a price, not charity with the price hidden."'
      ],
      choices: [{ label: 'Return to the route board', next: 'start' }, quietExit()]
    },
    acquire: {
      lines: [
        'Darius lays a service contract beside a paid-season chit. The cooled-wagon exchange sits beneath them.',
        '"Pick the cost you can still name tomorrow. Water does not become free because the buried line is dangerous."'
      ],
      choices: [
        {
          label: 'Sign the Morrow water contract',
          effects: selectWaterPlan({
            flag: 'south-measure-plan-morrow-import',
            routeFlag: 'morrow-water-contract',
            log: 'Darius commits Morrow cistern service under a household water contract.'
          }),
          next: 'chosen', tone: 'commit'
        },
        {
          label: 'Exchange the restored cooling jacket for deliveries',
          conditions: { flag: 'south-measure-cooling-jacket-known' },
          effects: selectWaterPlan({
            flag: 'south-measure-plan-morrow-import',
            routeFlag: 'morrow-water-exchange',
            log: 'The annex keeps the medicine cold. Darius assigns the cooled wagon to sealed water deliveries.'
          }),
          next: 'chosen', tone: 'commit'
        },
        {
          label: 'Pay eighteen ducats for one season of deliveries',
          conditions: { items: { ducat: 18 } },
          effects: {
            ...selectWaterPlan({
              flag: 'south-measure-plan-morrow-import',
              routeFlag: 'morrow-water-purchased',
              log: 'Darius records a paid season of rationed water deliveries.'
            }),
            inventory: {
              remove: [{ item: 'ducat', count: 18, failLog: 'Darius counts the purse and finds it short.' }],
              requireAll: true
            }
          },
          next: 'chosen', tone: 'commit'
        },
        {
          label: 'Order emergency cistern service under Censure authority',
          conditions: { fieldRatings: { command: 40 } },
          effects: selectWaterPlan({
            flag: 'south-measure-plan-morrow-import',
            routeFlag: 'morrow-water-compelled',
            log: 'Darius assigns emergency cisterns under protest and records the Censure order.'
          }),
          next: 'chosen', tone: 'danger'
        },
        { label: 'Delay the bargain', next: 'start' }
      ]
    },
    ledger: {
      lines: [
        'Darius reads each copied surety beside the genuine freight loss entered on the same page.',
        '"False debt is theft. Erasing every loss is another theft. Decide which correction you can defend to both households."'
      ],
      choices: [
        { label: 'Revise only the copied sureties', effects: settleSideQuest({ flag: 'morrow-ledger-revised', item: SOUTH_MEASURE_ITEM_IDS.pumpLedger, quest: 'debt-that-drinks', log: 'The false sureties are struck while the genuine road losses remain.' }), next: 'ledger-done', tone: 'commit' },
        { label: 'Void every household surety', effects: settleSideQuest({ flag: 'morrow-ledger-voided', item: SOUTH_MEASURE_ITEM_IDS.pumpLedger, quest: 'debt-that-drinks', log: 'Every disputed household surety is voided, including debts tied to real freight losses.' }), next: 'ledger-done', tone: 'commit' },
        { label: 'Conceal the pages that expose Hidden Rows', conditions: { flag: 'hidden-rows-chain-witness' }, effects: settleSideQuest({ flag: 'morrow-ledger-concealed', item: SOUTH_MEASURE_ITEM_IDS.pumpLedger, quest: 'debt-that-drinks', log: 'The dangerous surety pages disappear from the bonded ledger.' }), next: 'ledger-done', tone: 'commit' },
        { label: 'Return the ledger untouched', effects: settleSideQuest({ flag: 'morrow-ledger-untouched', item: SOUTH_MEASURE_ITEM_IDS.pumpLedger, quest: 'debt-that-drinks', log: 'The ledger returns to its cage with false and genuine debts still joined.' }), next: 'ledger-done', tone: 'commit' },
        { label: 'Keep the ledger for now', next: 'start' }
      ]
    },
    'ledger-done': {
      lines: ['Darius closes the cage on the corrected record.', '"A page can stop lying without becoming innocent."'],
      choices: [quietExit('Leave the freight house')]
    },
    chosen: {
      lines: ['Darius signs the first cistern schedule against South Measure’s household roll.', '"Now make the ration worth the route we lose."'],
      choices: [quietExit('Take the decision to Susanna')]
    }
  }
};

const CLINIC_YARA = {
  id: 'south-measure-clinic-yara-quell', title: 'Aurelia Priscian',
  nodes: {
    start: {
      lines: ['Aurelia has placed a flow-monitor slate beside the patient list. The placement forms remain on another corner of the desk.'],
      choices: [
        { label: 'Ask why monitoring comes with census access', next: 'terms' },
        {
          label: 'Negotiate monitored full flow',
          conditions: {
            flags: [WATER_DECISION_FLAG, 'intake-clerk-resolved'],
            flagsAbsent: WATER_PLAN_FLAGS
          },
          next: 'acquire'
        },
        quietExit('Leave Aurelia with the ward count')
      ]
    },
    terms: {
      lines: [
        '"Full flow needs two staff at the monitor and access below the court. My office will ask what those staff learned from every household."',
        '"That record can catch illness early. It can also turn a patient into an applicant who never applied."'
      ],
      choices: [{ label: 'Return to the desk', next: 'start' }, quietExit()]
    },
    acquire: {
      lines: [
        'Aurelia keeps the full census agreement on top. A consent exception and a blank Censure order wait beneath it.',
        '"My team can work under the first two. If you order the third, I will record who compelled them."'
      ],
      choices: [
        {
          label: 'Accept the full Compact census agreement',
          effects: selectWaterPlan({
            flag: 'south-measure-plan-monitored-flow',
            routeFlag: 'compact-monitoring-agreement',
            log: 'Aurelia assigns a monitoring team under full census terms.'
          }),
          next: 'chosen', tone: 'commit'
        },
        {
          label: 'Limit follow-up to consenting clinic patients',
          conditions: { fieldRatings: { doctrine: 40 } },
          effects: selectWaterPlan({
            flag: 'south-measure-plan-monitored-flow',
            routeFlag: 'compact-monitoring-supervised',
            log: 'Aurelia accepts supervised monitoring limited to consenting patients.'
          }),
          next: 'chosen', tone: 'commit'
        },
        {
          label: 'Make individual consent the price of useful data',
          conditions: { fieldRatings: { speech: 40 } },
          effects: selectWaterPlan({
            flag: 'south-measure-plan-monitored-flow',
            routeFlag: 'compact-monitoring-supervised',
            log: 'Aurelia accepts individual consent as the limit on monitoring records.'
          }),
          next: 'chosen', tone: 'commit'
        },
        {
          label: 'Order emergency monitoring under Censure authority',
          conditions: { fieldRatings: { command: 40 } },
          effects: selectWaterPlan({
            flag: 'south-measure-plan-monitored-flow',
            routeFlag: 'compact-monitoring-compelled',
            log: 'Aurelia assigns a monitoring team under protest and records the Censure order.'
          }),
          next: 'compelled', tone: 'danger'
        },
        { label: 'Leave the agreement unsigned', next: 'start' }
      ]
    },
    chosen: {
      lines: ['Aurelia assigns two clinicians to the water court without closing a ward bed.', '"The clinic does not become payment for the pump. The monitoring agreement stands on its own."'],
      choices: [quietExit('Take the decision to Susanna')]
    },
    compelled: {
      lines: ['Aurelia writes the Censure order number above the monitor rota.', '"My staff will keep the taps safe. Do not call the order consent in your report."'],
      choices: [quietExit('Take the order to Measure Hall')]
    }
  }
};

const CLINIC_JALEN = {
  id: 'south-measure-clinic-jalen-olt', title: 'Jair Celsus',
  nodes: {
    start: {
      lines: ['Jair sits behind the isolation screen with two fingers against the pulse below the collarbone.'],
      choices: [
        {
          label: 'Ask about Salome’s lessons', next: 'lessons',
          effects: recordNeriClue(
            'neri-recruit-list-found',
            'Jair says Salome called his irregular pulse a witness and offered him a place outside the clinic.'
          )
        },
        {
          label: 'Watch the extra rhythm',
          conditions: { fieldRatings: { medicine: 30 } },
          next: 'sign',
          effects: recordNeriClue(
            'neri-host-sign-seen',
            'Jair’s pulse answers a click from the lesson card, then stills when the card is closed.'
          )
        },
        {
          label: 'Read the rhythm as a Host sign',
          conditions: { fieldRatings: { hostSigns: 30 } },
          next: 'sign',
          effects: recordNeriClue(
            'neri-host-sign-seen',
            'Jair’s pulse answers a click from the lesson card, then stills when the card is closed.'
          )
        },
        quietExit('Let Jair rest')
      ]
    },
    lessons: {
      lines: [
        '"She says the second beat is a witness, not a sickness. She offered a place where nobody asks for a clean blood card."',
        '"I wanted that to be true. I did not agree to travel."'
      ],
      choices: [{ label: 'Ask again', next: 'start' }, quietExit()]
    },
    sign: {
      lines: [
        'The irregular beat answers a faint click from the lesson card beneath the cup. It stops when the card is folded shut.',
        'Jair watches your face. "Damaris heard it answer once and took the card before it could teach me the rhythm."'
      ],
      choices: [{ label: 'Ask again', next: 'start' }, quietExit()]
    }
  }
};

const HALL_RESSA = {
  id: 'south-measure-hall-ressa-venn', title: 'Susanna Fontana at the Council Table',
  nodes: {
    start: {
      lines: ['Susanna leaves the water roll open at the center of the table. Every available chair faces it.'],
      choices: [
        { label: 'Review what remains undecided', next: 'review' },
        {
          label: 'Choose emergency feed closure',
          conditions: {
            flags: [WATER_DECISION_FLAG, 'intake-clerk-resolved'],
            flagsAbsent: WATER_PLAN_FLAGS
          },
          effects: selectWaterPlan({
            flag: 'south-measure-plan-feed-closed',
            routeFlag: 'feed-closure-selected',
            log: 'South Measure will close the buried feed and survive on emergency water.'
          }),
          next: 'plan-closed', tone: 'commit'
        },
        {
          label: 'Commit the chosen water plan',
          conditions: {
            questStages: { 'names-for-the-gate': 'choose-water-plan' },
            flagsAtLeast: { count: 1, of: WATER_PLAN_FLAGS }
          },
          next: 'operate'
        },
        {
          label: 'Continue the settlement decisions',
          next: 'decisions'
        },
        quietExit('Leave the council table')
      ]
    },
    review: {
      lines: [
        '"Resolve the Clerk before choosing water. Once water has a plan, settle who holds the keys and roll; Noa and Cassian must answer for their own departures."',
        '"The road opens after those names are spoken in public. I will not trade the order for speed."'
      ],
      choices: [
        {
          label: 'Withdraw the Compact monitoring plan',
          conditions: { flag: 'south-measure-plan-monitored-flow' },
          effects: {
            clearFlag: ['south-measure-plan-monitored-flow', ...COMPACT_MONITOR_ROUTE_FLAGS],
            setFlag: 'compact-monitoring-withdrawn',
            log: 'Aurelia withdraws the monitoring rota. The water plan remains open.'
          },
          next: 'start', tone: 'commit'
        },
        {
          label: 'Cancel the Morrow cistern plan',
          conditions: { flag: 'south-measure-plan-morrow-import' },
          effects: {
            clearFlag: ['south-measure-plan-morrow-import', ...MORROW_WATER_ROUTE_FLAGS],
            setFlag: 'morrow-water-plan-cancelled',
            log: 'Darius strikes the cistern schedule. The water plan remains open.'
          },
          next: 'start', tone: 'commit'
        },
        {
          label: 'Set aside the isolated-loop plan',
          conditions: { flag: 'south-measure-plan-isolated-loop' },
          effects: {
            clearFlag: ['south-measure-plan-isolated-loop', 'resident-isolation-selected'],
            setFlag: 'resident-isolation-deferred',
            log: 'Noa leaves the isolation marks in place. The water plan remains open.'
          },
          next: 'start', tone: 'commit'
        },
        { label: 'Return to the decision', next: 'start' },
        quietExit()
      ]
    },
    decisions: {
      lines: ['Susanna turns the decision slate to the first unfinished line.'],
      choices: [
        { label: 'Decide control of the pump', conditions: { questStages: { 'names-for-the-gate': 'decide-pump-control' } }, next: 'pump' },
        { label: 'Decide custody of the original roll', conditions: { questStages: { 'names-for-the-gate': 'decide-roll-custody' } }, next: 'roll-consent' },
        { label: 'Settle Noa Faber’s departure', conditions: { questStages: { 'names-for-the-gate': 'settle-nel' } }, next: 'nel' },
        { label: 'Settle Brother Cassian’s departure', conditions: { questStages: { 'names-for-the-gate': 'settle-tarn' } }, next: 'tarn' },
        { label: 'Call the north-gate assembly', conditions: { questStages: { 'names-for-the-gate': 'north-gate-assembly' } }, next: 'assembly' }
      ]
    },
    'plan-closed': {
      lines: ['Susanna writes FEED CLOSED across the water board.', '"The pipe goes quiet. The arrival fires drink from storage until storage is gone."'],
      choices: [{ label: 'Commit the operating plan', next: 'operate' }]
    },
    operate: {
      lines: ['Noa waits at the feed board. The hall listens for an answer through the floor pipes.'],
      choices: [
        {
          label: 'Open monitored full flow',
          conditions: { flag: 'south-measure-plan-monitored-flow' },
          effects: commitWaterPlan({
            flag: 'south-measure-plan-monitored-flow',
            stateFlag: 'south-measure-water-full',
            log: 'Compact monitors hold the buried rhythm below the tap cycle. Every row receives water.'
          }), close: true, tone: 'commit'
        },
        {
          label: 'Begin Morrow cistern rationing',
          conditions: { flag: 'south-measure-plan-morrow-import' },
          effects: commitWaterPlan({
            flag: 'south-measure-plan-morrow-import',
            stateFlag: 'south-measure-water-rationed',
            log: 'The buried feed closes. Morrow cisterns begin a stable daily ration.'
          }), close: true, tone: 'commit'
        },
        {
          label: 'Open the isolated resident loop',
          conditions: { flag: 'south-measure-plan-isolated-loop' },
          effects: commitWaterPlan({
            flag: 'south-measure-plan-isolated-loop',
            stateFlag: 'south-measure-water-reduced',
            log: 'Noa closes the north feed and opens the relief return. South Measure keeps a reduced local flow.'
          }), close: true, tone: 'commit'
        },
        {
          label: 'Close the buried feed',
          conditions: { flag: 'south-measure-plan-feed-closed' },
          effects: commitWaterPlan({
            flag: 'south-measure-plan-feed-closed',
            stateFlag: 'south-measure-water-emergency',
            log: 'The buried feed closes. South Measure begins emergency rationing from stored water.'
          }), close: true, tone: 'commit'
        },
        { label: 'Delay the water decision', next: 'start' }
      ]
    },
    pump: {
      lines: ['The operating plan is written. Susanna sets four keys beside the water slate.'],
      choices: [
        {
          label: 'Give pump access to the Compact',
          next: 'pump-compact'
        },
        {
          label: 'Renew the Morrow service contract',
          next: 'pump-morrow'
        },
        {
          label: 'Leave the pump under resident control',
          next: 'pump-resident'
        },
        {
          label: 'Seal outside access and ration every claim',
          next: 'pump-sealed'
        },
        { label: 'Delay the pump vote', next: 'start' }
      ]
    },
    'pump-compact': {
      lines: ['Susanna rests one hand on the clinic key.', '"A signed Morrow water contract breaks here if the Chain loses the service key."'],
      choices: [
        {
          label: 'Confirm Compact pump access',
          conditions: { flagsAbsent: ['morrow-water-contract'] },
          effects: advanceWaterDecision({ flag: 'south-measure-compact', stage: 'decide-roll-custody', log: 'The Compact receives clinical access to the pump and intake.' }),
          close: true, tone: 'commit'
        },
        {
          label: 'Break Darius’s water contract and choose Compact access',
          conditions: { flag: 'morrow-water-contract' },
          effects: advanceWaterDecision({ flag: 'south-measure-compact', extraFlags: ['morrow-water-contract-breached'], stage: 'decide-roll-custody', log: 'The Compact receives pump access. Darius records the broken water contract.' }),
          close: true, tone: 'danger'
        },
        { label: 'Return to the pump keys', next: 'pump' }
      ]
    },
    'pump-morrow': {
      lines: ['Darius’s service key lies beside the clinic allocation seal.', '"If full monitoring came under census terms, giving him the pump breaks those terms in public."'],
      choices: [
        {
          label: 'Confirm the Morrow service contract',
          conditions: { flagsAbsent: ['compact-monitoring-agreement'] },
          effects: advanceWaterDecision({ flag: 'south-measure-morrow', stage: 'decide-roll-custody', log: 'The Morrow Chain receives the pump service contract.' }),
          close: true, tone: 'commit'
        },
        {
          label: 'Break Aurelia’s census terms and choose Morrow service',
          conditions: { flag: 'compact-monitoring-agreement' },
          effects: advanceWaterDecision({ flag: 'south-measure-morrow', extraFlags: ['compact-monitoring-terms-breached'], stage: 'decide-roll-custody', log: 'Morrow receives the service contract. Aurelia records the broken monitoring terms.' }),
          close: true, tone: 'danger'
        },
        { label: 'Return to the pump keys', next: 'pump' }
      ]
    },
    'pump-resident': {
      lines: ['Susanna closes her hand around the resident key.', '"Keeping it may break an outside promise. The water plan does not erase who supplied the labor."'],
      choices: [
        {
          label: 'Confirm resident control',
          conditions: { flagsAbsent: ['compact-monitoring-agreement', 'morrow-water-contract'] },
          effects: advanceWaterDecision({ flag: 'south-measure-resident', stage: 'decide-roll-custody', log: 'South Measure keeps its pump keys and maintenance burden.' }),
          close: true, tone: 'commit'
        },
        {
          label: 'Break Aurelia’s census terms and keep resident control',
          conditions: { flag: 'compact-monitoring-agreement' },
          effects: advanceWaterDecision({ flag: 'south-measure-resident', extraFlags: ['compact-monitoring-terms-breached'], stage: 'decide-roll-custody', log: 'South Measure keeps the keys. Aurelia records the broken monitoring terms.' }),
          close: true, tone: 'danger'
        },
        {
          label: 'Break Darius’s water contract and keep resident control',
          conditions: { flag: 'morrow-water-contract' },
          effects: advanceWaterDecision({ flag: 'south-measure-resident', extraFlags: ['morrow-water-contract-breached'], stage: 'decide-roll-custody', log: 'South Measure keeps the keys. Darius records the broken water contract.' }),
          close: true, tone: 'danger'
        },
        { label: 'Return to the pump keys', next: 'pump' }
      ]
    },
    'pump-sealed': {
      lines: ['Susanna turns the outside keys face down.', '"Rationing can refuse a faction claim. It cannot pretend the promise was never made."'],
      choices: [
        {
          label: 'Close the feed and seal outside access',
          conditions: { flagsAbsent: ['compact-monitoring-agreement', 'morrow-water-contract'] },
          effects: sealWaterDecision(),
          close: true, tone: 'commit'
        },
        {
          label: 'Break Aurelia’s census terms and seal the pump',
          conditions: { flag: 'compact-monitoring-agreement' },
          effects: sealWaterDecision(['compact-monitoring-terms-breached'], 'South Measure closes the feed. Aurelia records the broken monitoring terms.'),
          close: true, tone: 'danger'
        },
        {
          label: 'Break Darius’s water contract and seal the pump',
          conditions: { flag: 'morrow-water-contract' },
          effects: sealWaterDecision(['morrow-water-contract-breached'], 'South Measure closes the feed. Darius records the broken water contract.'),
          close: true, tone: 'danger'
        },
        { label: 'Return to the pump keys', next: 'pump' }
      ]
    },
    'roll-consent': {
      lines: ['Susanna waits for the Hidden Rows consent note before she opens the custody vote.'],
      choices: [
        {
          label: 'Default unconsulted hidden names to private',
          conditions: { flagsAbsent: SOUTH_MEASURE_HIDDEN_ROLL_FLAGS },
          effects: {
            setFlag: 'hidden-roll-private',
            questUpdate: { quest: 'names-under-lime', stage: 'complete', log: 'Unconsulted Hidden Rows names remain private by default.' }
          },
          next: 'roll-consent', tone: 'commit'
        },
        {
          label: 'Open the original-roll custody vote',
          conditions: {
            items: { [SOUTH_MEASURE_ITEM_IDS.originalRoll]: 1 },
            flagsAtLeast: { count: 1, of: SOUTH_MEASURE_HIDDEN_ROLL_FLAGS }
          },
          next: 'roll'
        },
        { label: 'Recover the original roll before voting', conditions: { itemsMax: { [SOUTH_MEASURE_ITEM_IDS.originalRoll]: 0 } }, close: true },
        { label: 'Delay the custody vote', next: 'start' }
      ]
    },
    roll: {
      lines: ['Susanna turns the original roll so the custody seal remains blank.', '"Pump access and record access are separate votes. Keep them separate in the answer."'],
      choices: [
        { label: 'Keep the original under resident custody', effects: settleRollCustody('measure-roll-resident', 'South Measure keeps the original household roll and issues a certified water abstract.'), close: true, tone: 'commit' },
        { label: 'Give the original to Compact custody', effects: settleRollCustody('measure-roll-compact', 'Compact clinicians receive the original roll. South Measure keeps a certified water abstract.'), close: true, tone: 'commit' },
        { label: 'Keep the original and permit supervised copies', effects: settleRollCustody('measure-roll-supervised-copy', 'The original remains local while supervised copies document water rights.'), close: true, tone: 'commit' },
        { label: 'Give Morrow a debt-limited copy', effects: settleRollCustody('measure-roll-morrow-copy', 'Morrow receives a debt-limited copy. The original leaves the council table.'), close: true, tone: 'commit' },
        { label: 'Consider sealing or destroying the roll', next: 'roll-other' }
      ]
    },
    'roll-other': {
      lines: ['The lime-stiff pages can be sealed below or burned before any faction copies them.'],
      choices: [
        { label: 'Seal the original in the undercroft', effects: settleRollCustody('measure-roll-sealed', 'The original household roll is sealed below. Susanna issues only a certified water abstract.'), close: true, tone: 'commit' },
        { label: 'Destroy the original household roll', effects: settleRollCustody('measure-roll-destroyed', 'The original household roll burns after Susanna certifies the water settlement.'), close: true, tone: 'danger' },
        { label: 'Return to the custody vote', next: 'roll' }
      ]
    },
    nel: {
      lines: ['Noa puts her machine-school form beside Isaac’s medicine note and Tobit’s work record.', '"The form wants one household answer. We have never been one answer."'],
      choices: [
        { label: 'Send Noa to school as a household of one', effects: settleNel('nel-school-alone', 'Noa takes the school place alone. Isaac and Tobit remain in South Measure.'), close: true, tone: 'commit' },
        { label: 'Ask Noa to stay for one maintenance season', effects: settleNel('nel-stays-one-season', 'Noa stays one season to train Tobit and document the isolated water loop.'), close: true, tone: 'commit' },
        { label: 'Demand a formal family review', effects: settleNel('nel-family-review', 'Noa accepts the school place under a formal review of Isaac and Tobit’s status.'), close: true, tone: 'commit' },
        { label: 'Forge one admitted family record', conditions: { fieldRatings: { guile: 40 } }, effects: settleNel('nel-family-forged', 'A forged household page carries the whole Faber family into one placement review.'), close: true, tone: 'danger' },
        { label: 'Leave the family decision open', next: 'start' }
      ]
    },
    tarn: {
      lines: ['Brother Cassian plays the intake reply once through his damaged vox. No one in the hall mistakes it for an empty pipe.'],
      choices: [
        { label: 'Take the shared road north with Cassian', conditions: { flag: 'tarn-shared-road-proposed', flagsAbsent: ['intake-clerk-tarn-sealed'] }, effects: settleTarn('tarn-shared-road', 'Cassian joins the northward road long enough to trace the answering signal.'), close: true, tone: 'commit' },
        { label: 'Send Cassian ahead as an independent scout', conditions: { flagsAbsent: ['intake-clerk-tarn-sealed'] }, effects: settleTarn('tarn-independent-scout', 'Cassian moves ahead alone to trace the Hallowfen reply.'), close: true, tone: 'commit' },
        { label: 'Order Cassian to report to the Black Reliquary', conditions: { flagsAbsent: ['intake-clerk-tarn-sealed'] }, effects: settleTarn('tarn-reliquary-report', 'Cassian carries the intake evidence to the Black Reliquary.'), close: true, tone: 'commit' },
        { label: 'Keep Cassian on South Measure watch', effects: settleTarn('tarn-camp-watch', 'Cassian remains at South Measure to watch the water line and buried signal.'), close: true, tone: 'commit' },
        { label: 'Delay Cassian’s departure', next: 'start' }
      ]
    },
    assembly: {
      lines: [
        'Household representatives crowd the north lane. Clinic workers stand beside freight hands, with delegates from the arrival fires nearest the chain.',
        'Susanna reads the water decision, then leaves one final space on the page for unresolved danger inside the camp.'
      ],
      choices: [
        {
          label: 'Record unresolved local matters',
          next: 'assembly-defaults'
        },
        {
          label: 'Resolve the Intake Clerk before closing the gate',
          conditions: { flagsAbsent: ['intake-clerk-resolved'] },
          close: true,
          tone: 'quiet'
        },
        {
          label: 'Close the assembly with Salome’s case resolved',
          conditions: {
            flags: ['neri-agent-resolved', 'intake-clerk-resolved'],
            flagsAtLeast: { count: 3, of: LOCAL_ASSEMBLY_OUTCOMES }
          },
          effects: {
            setFlag: ['south-measure-assembly-complete', 'south-measure-north-lane-open'],
            questUpdate: { quest: 'names-for-the-gate', stage: 'depart-north', log: 'South Measure opens the north lane under the chosen water settlement.' },
            loadLevel: SURFACE_ASSEMBLY_RETURN
          }, close: true, tone: 'commit'
        },
        {
          label: 'Close the assembly with no further accusation',
          conditions: {
            flag: 'intake-clerk-resolved',
            flagsAbsent: ['neri-agent-resolved'],
            flagsAtLeast: { count: 3, of: LOCAL_ASSEMBLY_OUTCOMES }
          },
          effects: {
            setFlag: [
              'neri-agent-unseen', 'neri-agent-resolved', 'choir-influence-south-measure',
              'pate-open-wound-convert', 'jori-choir-courier', 'jalen-choir-transfer',
              'south-measure-assembly-complete', 'south-measure-north-lane-open'
            ],
            questUpdate: [
              { quest: 'lesson-under-the-wrap', stage: 'complete', log: 'Salome’s influence remains undiscovered and continues beneath South Measure.' },
              { quest: 'names-for-the-gate', stage: 'depart-north', log: 'South Measure opens the north lane. Salome’s work continues beneath the settlement.' }
            ],
            loadLevel: SURFACE_ASSEMBLY_RETURN
          }, close: true, tone: 'commit'
        },
        { label: 'Keep the assembly open', next: 'start' }
      ]
    },
    'assembly-defaults': {
      lines: ['Susanna leaves three narrow lines for matters that reached the assembly without a separate ruling.'],
      choices: [
        {
          label: 'Return the Morrow ledger untouched', conditions: { flagsAbsent: SOUTH_MEASURE_LEDGER_FLAGS },
          effects: { setFlag: 'morrow-ledger-untouched', questUpdate: { quest: 'debt-that-drinks', stage: 'complete', log: 'The assembly returns the surety ledger untouched.' } },
          next: 'assembly-defaults', tone: 'commit'
        },
        {
          label: 'Place charity stock with the resident council', conditions: { flagsAbsent: SOUTH_MEASURE_CHARITY_FLAGS },
          effects: { setFlag: 'charity-council', questUpdate: { quest: 'charity-cot', stage: 'complete', log: 'The assembly places unresolved charity stock under resident council custody.' } },
          next: 'assembly-defaults', tone: 'commit'
        },
        {
          label: 'Keep unconsulted hidden names private', conditions: { flagsAbsent: SOUTH_MEASURE_HIDDEN_ROLL_FLAGS },
          effects: { setFlag: 'hidden-roll-private', questUpdate: { quest: 'names-under-lime', stage: 'complete', log: 'The assembly keeps unconsulted Hidden Rows names private.' } },
          next: 'assembly-defaults', tone: 'commit'
        },
        { label: 'Return to the assembly', next: 'assembly' }
      ]
    }
  }
};

const CELLAR_MEREN = {
  id: 'south-measure-cellar-meren-heth', title: 'Matthias Cursor',
  nodes: {
    start: {
      lines: ['Matthias keeps the courier bag open, as if an unlatched buckle proves honesty.'],
      choices: [
        { label: 'Ask where the medicine comes from', next: 'route' },
        {
          label: 'Press Matthias about Salome',
          conditions: { flagsAtLeast: { count: 1, of: NERI_CLUES } },
          next: 'neri',
          effects: recordNeriClue(
            'neri-recruit-list-found',
            'Matthias’s courier list links Salome to named adults and recurring suppressant deliveries.'
          )
        },
        quietExit('Let Matthias finish the count')
      ]
    },
    route: {
      lines: [
        '"The cache sits on the west road. Choir hands leave stock there, but so do Compact deserters, and fever medicine carries no doctrine in the vial."',
        '"I move doses here because people need them. That does not mean I know every person using the route."'
      ],
      choices: [{ label: 'Ask again', next: 'start' }, quietExit()]
    },
    neri: {
      lines: [
        'Matthias looks toward the lesson table.',
        '"I took her for a sympathizer who knew which frightened adults would accept help. Her list names Peter and Jair beside the nights she needs suppressant; Jonah is marked for courier work."',
        '"If that means what you think, she lied to the courier route too."'
      ],
      choices: [
        {
          label: 'Detain Matthias for the resident council',
          conditions: { flagsAbsent: ['meren-courier-detained', 'meren-courier-barred'] },
          effects: { setFlag: 'meren-courier-detained' },
          close: true, tone: 'commit'
        },
        {
          label: 'Bar Matthias from the charity route',
          conditions: { flagsAbsent: ['meren-courier-detained', 'meren-courier-barred'] },
          effects: { setFlag: 'meren-courier-barred' },
          close: true, tone: 'commit'
        },
        { label: 'Ask again', next: 'start' },
        quietExit()
      ]
    }
  }
};

const CELLAR_NERI = {
  id: 'south-measure-cellar-neri-vaun', title: 'Salome Naso',
  nodes: {
    start: {
      conditions: { flagsAbsent: ['neri-agent-exposed', 'neri-agent-resolved'] },
      else: 'changed',
      lines: [
        'Salome wipes chalk from a lesson card. Before using a patient’s name, she checks who is near enough to hear it.',
        '"Adults ask for letters after the cots settle. Reading gives fear somewhere to stand."'
      ],
      choices: [
        { label: 'Ask what she teaches the rejected adults', next: 'lessons' },
        {
          label: 'Watch the breath beneath her chest wrap',
          conditions: { fieldRatings: { medicine: 35 } },
          next: 'sign',
          effects: recordNeriClue(
            'neri-host-sign-seen',
            'A second rhythm moves beneath Salome’s chest wrap and answers her lesson cadence.'
          )
        },
        {
          label: 'Read the movement as a Host sign',
          conditions: { fieldRatings: { hostSigns: 35 } },
          next: 'sign',
          effects: recordNeriClue(
            'neri-host-sign-seen',
            'A second rhythm moves beneath Salome’s chest wrap and answers her lesson cadence.'
          )
        },
        {
          label: 'Lay out the evidence against her',
          conditions: { flagsAtLeast: { count: 2, of: NERI_CLUES } },
          next: 'confrontation'
        },
        quietExit('Leave the lesson table')
      ]
    },
    changed: {
      conditions: { flag: 'neri-agent-exposed' },
      else: 'resolved',
      lines: [
        'Salome’s chest wrap has split along a narrow vertical mouth. Small teeth close behind each word.',
        'A second voice repeats the last confession from inside her ribs.'
      ],
      choices: [
        {
          label: 'End the False Catechist here',
          effects: { startCombat: 'south-measure-false-catechist' },
          close: true, tone: 'danger'
        },
        {
          label: 'Let her leave through the west route',
          effects: settleNeri([
            'neri-agent-tolerated', 'choir-influence-south-measure',
            'pate-open-wound-convert', 'jori-choir-courier', 'jalen-choir-transfer'
          ], 'Salome leaves by the west route. Her South Measure converts remain connected to the Choir.', {
            loadLevel: CELLAR_RETURN
          }),
          close: true, tone: 'commit'
        },
        {
          label: 'Use a suppressant and place her before the council',
          conditions: { items: { 'compact-suppressant': 1 } },
          effects: settleNeri(['neri-agent-council'], 'A suppressant closes Salome’s second mouth long enough for resident custody.', {
            inventory: { remove: [{ item: 'compact-suppressant', count: 1 }], requireAll: true },
            loadLevel: CELLAR_RETURN
          }),
          close: true, tone: 'commit'
        }
      ]
    },
    resolved: {
      lines: ['The lesson table has changed since the confrontation. No untouched card looks harmless now.'],
      choices: [quietExit()]
    },
    lessons: {
      lines: [
        '"Rejected people learn to read themselves as errors on a form, so I begin with the name each one still owns."',
        '"Prayer cards sometimes arrive with the medicine. I explain the words and let the reader decide which comfort survives them."'
      ],
      choices: [{ label: 'Return to the lesson table', next: 'start' }, quietExit()]
    },
    sign: {
      lines: [
        'Salome stops breathing. The cloth over her sternum continues to draw inward around a thin row of moving points.',
        'A second whisper shapes your last question beneath her answer.',
        'Salome tightens the wrap. "You know what untreated fear does to a room. Do not make mine public without cause."'
      ],
      choices: [{ label: 'Return to the evidence', next: 'start' }, quietExit()]
    },
    confrontation: {
      lines: [
        'You lay out what you found. Salome watches which pieces you hold back and which ones you place within her reach.',
        'Salome sets the chalk down without looking away. "The clinic measures them for rejection, and the Chain already owns their working years. I gave them a door they could choose."',
        'Something behind her sternum repeats: "A door."'
      ],
      choices: [
        {
          label: 'Bar her from South Measure',
          effects: settleNeri(['neri-agent-barred'], 'Salome is barred from South Measure and the lesson route is broken.', {
            loadLevel: CELLAR_RETURN
          }),
          close: true, tone: 'commit'
        },
        {
          label: 'Place her before the resident council',
          effects: settleNeri(['neri-agent-council'], 'Salome is placed before the resident council with the evidence against her.', {
            loadLevel: CELLAR_RETURN
          }),
          close: true, tone: 'commit'
        },
        { label: 'Choose outside custody', next: 'custody' },
        {
          label: 'Permit supervised lessons and watch the conversions',
          effects: settleNeri([
            'neri-agent-tolerated', 'choir-influence-south-measure',
            'pate-open-wound-convert', 'jori-choir-courier', 'jalen-choir-transfer'
          ], 'Salome’s lessons continue under supervision, and three adults remain on her conversion route.'),
          close: true, tone: 'commit'
        },
        {
          label: 'Order her to show what is under the wrap',
          effects: {
            setFlag: 'neri-agent-exposed',
            loadLevel: {
              ...CELLAR_RETURN
            }
          },
          close: true, tone: 'danger'
        }
      ]
    },
    custody: {
      lines: ['Salome’s second voice repeats the names Compact and Morrow before she does.'],
      choices: [
        {
          label: 'Give her to Compact clinicians',
          effects: settleNeri(['neri-agent-compact'], 'Compact clinicians take custody of Salome and the opening beneath her wrap.', {
            loadLevel: CELLAR_RETURN
          }),
          close: true, tone: 'commit'
        },
        {
          label: 'Give her to the Morrow Chain',
          effects: settleNeri(['neri-agent-morrow'], 'The Morrow Chain takes custody of Salome and closes her charity route.', {
            loadLevel: CELLAR_RETURN
          }),
          close: true, tone: 'commit'
        },
        { label: 'Choose a South Measure outcome', next: 'confrontation' }
      ]
    }
  }
};

function evidenceDialogue(id, title, lines, flag, log) {
  return {
    id, title,
    nodes: {
      start: {
        effects: recordNeriClue(flag, log),
        lines,
        choices: [{ label: 'Record the evidence', effects: { log }, close: true }]
      }
    }
  };
}

function recordItemDialogue({ id, title, lines, label, item, flags, quest, stage, log, extraQuestUpdate = null }) {
  return {
    id,
    title,
    nodes: {
      start: {
        lines,
        choices: [
          {
            label,
            conditions: { itemsMax: { [item]: 0 } },
            effects: {
              setFlag: flags,
              inventory: { add: [{ item, count: 1 }] },
              questUpdate: [
                { quest, stage, log },
                ...[].concat(extraQuestUpdate ?? []).filter(Boolean)
              ]
            },
            close: true,
            tone: 'commit'
          },
          quietExit('Leave the record where it lies')
        ]
      }
    }
  };
}

function originalRollRecoveryEffects(extraFlags = []) {
  return {
    setFlag: ['measure-original-roll-recovered', 'hidden-names-found-under-lime', ...extraFlags],
    inventory: { add: [{ item: SOUTH_MEASURE_ITEM_IDS.originalRoll, count: 1 }] },
    questUpdate: {
      quest: 'names-under-lime', stage: 'seek-consent',
      log: 'The original household roll can prove water rights and expose the private addresses beneath the lime.'
    }
  };
}

const ORIGINAL_ROLL_DIALOGUE = {
  id: 'south-measure-undercroft-original-roll',
  title: 'The Original Household Roll',
  nodes: {
    start: {
      lines: [
        'Lime has stiffened the outer pages without erasing them. Water shares and denial orders occupy the same household lines.',
        'Several Hidden Rows addresses survive beneath later whitewash.'
      ],
      choices: [
        {
          label: 'Carry the original roll to the council',
          conditions: {
            flag: 'intake-clerk-resolved',
            flagsAbsent: ['intake-clerk-compact'],
            itemsMax: { [SOUTH_MEASURE_ITEM_IDS.originalRoll]: 0 }
          },
          effects: originalRollRecoveryEffects(),
          close: true,
          tone: 'commit'
        },
        {
          label: 'Challenge the Compact claim and carry the roll',
          conditions: {
            flags: ['intake-clerk-resolved', 'intake-clerk-compact'],
            itemsMax: { [SOUTH_MEASURE_ITEM_IDS.originalRoll]: 0 }
          },
          effects: originalRollRecoveryEffects(['compact-roll-claim-challenged']),
          close: true,
          tone: 'danger'
        },
        {
          label: 'Settle the Intake Clerk before moving the roll',
          conditions: { flagsAbsent: ['intake-clerk-resolved'] },
          close: true,
          tone: 'quiet'
        },
        quietExit('Leave the record where it lies')
      ]
    }
  }
};

const EVIDENCE_DIALOGUES = [
  ORIGINAL_ROLL_DIALOGUE,
  recordItemDialogue({
    id: 'south-measure-freight-pump-ledger', title: 'The Morrow Pump Ledger',
    lines: [
      'Medicine deliveries share the freight ledger with household sureties and the names of drivers who died carrying them. Several burial debts repeat one copied hand mark.',
      'The false entries do not erase the real road losses beside them.'
    ],
    label: 'Take the ledger to Darius for judgment',
    item: SOUTH_MEASURE_ITEM_IDS.pumpLedger,
    flags: ['morrow-pump-ledger-found', 'morrow-false-surety-found'],
    quest: 'debt-that-drinks', stage: 'audit-ledger',
    log: 'The Morrow pump ledger contains false household sureties beside genuine medicine routes.'
  }),
  recordItemDialogue({
    id: 'south-measure-cellar-burned-labels', title: 'Burned Crate Labels',
    lines: [
      'The medicine labels came from different routes, but the dose numbers were copied by one hand.',
      'The same narrow N appears on Salome’s lesson cards.'
    ],
    label: 'Take the stock cards to Joanna',
    item: SOUTH_MEASURE_ITEM_IDS.charityCards,
    flags: ['neri-copy-hand-found', 'neri-investigation-started', 'charity-stock-cards-found'],
    quest: 'charity-cot', stage: 'trace-doses',
    log: 'The copied labels tie the mixed charity stock to Salome’s lesson hand.',
    extraQuestUpdate: { quest: 'lesson-under-the-wrap', stage: 'gather-evidence', log: 'The copied medicine labels match Salome’s lesson hand.' }
  }),
  evidenceDialogue(
    'south-measure-cellar-suspect-cabinet', 'Suspect Medicine Cabinet',
    [
      'The suppressant row is short by repeated single doses. Each gap was hidden behind a fever-vial issue.',
      'A strip of chest-binding cloth is caught behind the cabinet hinge.'
    ],
    'neri-suppressant-diversion-found', 'Suppressant doses were diverted to someone hiding a change beneath a chest wrap.'
  ),
  evidenceDialogue(
    'south-measure-cellar-recruit-sheet', 'Recruit Lesson Sheet',
    [
      'A reading exercise pairs three names with routes: Peter Molitor to the open wound, Jonah Mercator to courier work, Jair Celsus to transfer.',
      'The final line reads: ADULT CONSENT AFTER THE SECOND LESSON. NO CHILDREN.'
    ],
    'neri-recruit-list-found', 'Salome’s lesson sheet names three adults for Choir conversion.'
  )
];

const CUSTOM_DIALOGUES = [
  ROWS_ARI,
  CELLAR_IVEN,
  UNDERCROFT_RESSA,
  UNDERCROFT_NEL,
  UNDERCROFT_TARN,
  UNDERCROFT_YARA,
  ONA_VEYL,
  FREIGHT_DARO,
  CLINIC_YARA,
  CLINIC_JALEN,
  HALL_RESSA,
  CELLAR_MEREN,
  CELLAR_NERI
];

const placementDialogueIds = Object.values(SOUTH_MEASURE_PLACEMENTS)
  .flat()
  .map((entry) => entry.dialogue)
  .filter(Boolean);

export const SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS = Object.freeze([
  ...placementDialogueIds,
  'south-measure-undercroft-ona-veyl'
]);

export const SOUTH_MEASURE_OBJECT_DIALOGUE_IDS = Object.freeze(EVIDENCE_DIALOGUES.map((entry) => entry.id));

export const SOUTH_MEASURE_POPULATION_DIALOGUES = Object.freeze([
  ...COMPACT_DIALOGUES,
  ...CUSTOM_DIALOGUES,
  ...EVIDENCE_DIALOGUES
]);

const dialogueIds = new Set(SOUTH_MEASURE_POPULATION_DIALOGUES.map((entry) => entry.id));
if (dialogueIds.size !== SOUTH_MEASURE_POPULATION_DIALOGUES.length) {
  throw new Error('Duplicate South Measure population dialogue id.');
}
for (const id of SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS) {
  if (!dialogueIds.has(id)) throw new Error(`Missing South Measure character dialogue ${id}.`);
}
if (SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS.length !== 41) {
  throw new Error(`Expected 41 South Measure character dialogues, found ${SOUTH_MEASURE_CHARACTER_DIALOGUE_IDS.length}.`);
}

export const SOUTH_MEASURE_NERI_CLUE_FLAGS = NERI_CLUES;
export const SOUTH_MEASURE_NERI_TERMINAL_FLAGS = NERI_TERMINAL_FLAGS;
