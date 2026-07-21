const leaveChoice = { label: 'Leave', close: true, tone: 'quiet' };

function travelDialogue({ id, title, lines, label, path, player, conditions, effects = {} }) {
  return {
    id,
    title,
    nodes: {
      start: {
        lines,
        choices: [
          {
            label,
            ...(conditions ? { conditions } : {}),
            effects: {
              ...effects,
              loadLevel: { path, player }
            },
            tone: 'commit'
          },
          leaveChoice
        ]
      }
    }
  };
}

export const OLD_PILGRIM_QUEST_IDS = Object.freeze([
  'road-through-the-fields',
  'the-buried-novitiate',
  'names-below-the-hill'
]);

export const OLD_PILGRIM_ITEMS = Object.freeze([
  {
    id: 'old-pilgrim-service-key',
    name: 'Novitiate Service Key',
    type: 'key',
    rarity: 'common',
    weight: 0.1,
    groundModel: 'key',
    description: 'A short iron key stamped INNER CLOSURE. White grit still packs the teeth.'
  },
  {
    id: 'processional-pike',
    name: 'Processional Pike',
    type: 'weapon',
    catalogGroup: 'melee',
    subtype: 'polearm',
    rarity: 'uncommon',
    weight: 3.1,
    groundModel: 'pike',
    equipment: { slot: 'weapon' },
    provenance: {
      era: 'Ceremonial conversion',
      origin: 'Road Clergy',
      factions: ['road-clergy']
    },
    weapon: {
      weaponClass: 'polearm',
      roles: ['melee', 'polearm', 'reach'],
      handedness: 'two',
      attacks: [
        {
          id: 'reach-strike',
          name: 'Long Thrust',
          mode: 'melee',
          apCost: 5,
          damage: 7,
          range: 2,
          accuracyBonus: 0,
          conditionWear: 1
        },
        {
          id: 'hold-reach',
          name: 'Hold Reach',
          mode: 'melee',
          apCost: 6,
          damage: 8,
          range: 2,
          accuracyBonus: 5,
          conditionWear: 2,
          requiresStationary: true
        }
      ]
    },
    condition: { max: 100, default: 86 },
    description: 'A two-handed ashwood pike once carried ahead of road processions. Its iron sun head kept raiders beyond arm reach. The changed fare no better.'
  }
]);

export const OLD_PILGRIM_ACTORS = Object.freeze([
  {
    id: 'old-pilgrim-sister-calen',
    name: 'Sister Thecla',
    type: 'npc',
    faction: 'holy-remnant',
    role: 'Road nun',
    appearance: {
      body: 'sturdy',
      outfit: 'settlement-nurse',
      gear: ['medicine-bag', 'long-apron'],
      accent: 'bare-grey'
    },
    stats: { hp: 8, maxHp: 8, actionPoints: 0 },
    tags: ['old-pilgrim-way', 'holy-remnant', 'nun', 'talkable']
  },
  {
    id: 'old-pilgrim-father-noll',
    name: 'Father Noah',
    type: 'npc',
    faction: 'holy-remnant',
    role: 'Road priest',
    appearance: {
      body: 'old-bent',
      outfit: 'settlement-chapel-hand',
      gear: ['prayer-cord'],
      accent: 'bare-grey'
    },
    stats: { hp: 7, maxHp: 7, actionPoints: 0 },
    tags: ['old-pilgrim-way', 'holy-remnant', 'priest', 'talkable']
  },
  {
    id: 'old-pilgrim-oren-bale',
    name: 'Tobias Faber',
    type: 'npc',
    faction: 'road-travelers',
    role: 'Cartwright',
    appearance: {
      body: 'broad',
      outfit: 'settlement-work-coat',
      gear: ['bandage-sling'],
      accent: 'bare-brown'
    },
    stats: { hp: 6, maxHp: 6, actionPoints: 0 },
    tags: ['old-pilgrim-way', 'cartwright', 'survivor', 'talkable']
  }
]);

export const OLD_PILGRIM_ENEMIES = Object.freeze([
  {
    id: 'old-pilgrim-procession-runner',
    name: 'Procession Runner',
    type: 'enemy',
    faction: 'the-host',
    spriteId: 'stage-iv-runner-road',
    description: 'A pilgrim coat hangs from a human frame driven onto all fours. Heel bones punch the soil while one horn forces the head aside.',
    stats: { hp: 4, maxHp: 4, actionPoints: 8, moveCost: 1 },
    attacks: [
      { id: 'furrow-rake', name: 'Furrow Rake', apCost: 4, damage: 2, range: 1 }
    ],
    aggro: [
      'Its prayer cord draws tight between fused fingers.',
      'Heel bones strike the furrow in an uneven run.'
    ],
    tags: ['host', 'vale-imprint', 'stage-iv', 'pilgrim', 'runner', 'human']
  },
  {
    id: 'old-pilgrim-bell-throat',
    name: 'Bell-Throat Pilgrim',
    type: 'enemy',
    faction: 'the-host',
    spriteId: 'stage-iv-lure',
    description: 'A road singer’s chest has opened into a narrow bone bell. The jaw hangs beneath it, still working through the shape of a hymn.',
    stats: { hp: 5, maxHp: 5, actionPoints: 6, moveCost: 1 },
    attacks: [
      { id: 'hollow-canticle', name: 'Hollow Canticle', apCost: 4, damage: 1, range: 3 }
    ],
    aggro: [
      'A cracked note comes from inside the opened ribs.',
      'The thing raises both prayer-fused hands as if calling a response.'
    ],
    tags: ['host', 'vale-imprint', 'stage-iv', 'pilgrim', 'ranged', 'human']
  },
  {
    id: 'old-pilgrim-cord-bearer',
    name: 'Cord-Bearer',
    type: 'enemy',
    faction: 'the-host',
    spriteId: 'stage-iv-runner-ash',
    description: 'Three prayer cords have sunk into a broad human back. Fused forearms pull them taut across a rib cage opened like a processional frame.',
    stats: { hp: 7, maxHp: 7, actionPoints: 6, moveCost: 1 },
    attacks: [
      { id: 'cord-reach', name: 'Cord Reach', apCost: 4, damage: 2, range: 2 }
    ],
    aggro: [
      'The cords tighten under the skin before the body moves.',
      'One heavy knee settles into the furrow.'
    ],
    tags: ['host', 'vale-imprint', 'stage-iv', 'pilgrim', 'reach', 'human']
  }
]);

export const OLD_PILGRIM_QUESTS = Object.freeze([
  {
    id: 'road-through-the-fields',
    title: 'Road Through the Fields',
    initialStage: 'speak-to-road-clergy',
    objectives: [
      { text: 'Ask Sister Thecla why the north road is closed.', stage: 'speak-to-road-clergy' },
      { text: 'Search the dead fields for Tobias’s missing team.', stage: 'investigate-fields' },
      { text: 'Report the field attack to Sister Thecla.', stage: 'report-field-attack' },
      { text: 'Continue north toward the Quarantine Farms.', stage: 'complete' }
    ],
    stages: [
      {
        id: 'speak-to-road-clergy',
        task: 'Speak with Sister Thecla',
        description: 'A road nun has stopped northbound traffic beside a cartwright with a torn shoulder.'
      },
      {
        id: 'investigate-fields',
        task: 'Search the dead fields',
        xp: 0,
        description: 'Tobias Faber left two people and a cart in the east field. Nothing came back.'
      },
      {
        id: 'report-field-attack',
        task: 'Report to Sister Thecla',
        xp: 35,
        description: 'Five recent Stage IV forms rose from the furrows. Sister Thecla needs the count before she opens the road.'
      },
      {
        id: 'complete',
        task: 'The north road is open',
        xp: 30,
        description: 'Sister Thecla has the field count. Travelers can move toward the Quarantine Farms again.'
      }
    ]
  },
  {
    id: 'the-buried-novitiate',
    title: 'The Buried Novitiate',
    initialStage: 'find-closure-plan',
    unlockedBy: { flag: 'old-pilgrim-buried-novitiate-found' },
    objectives: [
      { text: 'Prove that a closure route lies beneath the church apse.', stage: 'find-closure-plan' },
      { text: 'Release the concealed apse mechanism.', stage: 'find-apse-release' },
      { text: 'Open the inner pressure door.', stage: 'enter-buried-novitiate' },
      { text: 'Find the last water tally.', stage: 'read-water-tally' },
      { text: 'Complete the four profession trials.', stage: 'complete-trials' },
      { text: 'Open the Oath Armory.', stage: 'claim-oath-armory' },
      { text: 'Use the return lift to leave the buried chapter.', stage: 'return-to-light' },
      { text: 'The buried novitiate has been opened.', stage: 'complete' }
    ],
    stages: [
      {
        id: 'find-closure-plan',
        task: 'Find the closure plan',
        description: 'The Hill Church apse does not match its public foundation.'
      },
      {
        id: 'find-apse-release',
        task: 'Release the apse mechanism',
        xp: 15,
        description: 'A pressure-rated descent sits beneath the raised apse. Its release remains hidden in the stonework.'
      },
      {
        id: 'enter-buried-novitiate',
        task: 'Open the inner pressure door',
        xp: 15,
        description: 'The outer seal closed cleanly during the Bloom. The inner key should still be somewhere on the closure stair.'
      },
      {
        id: 'read-water-tally',
        task: 'Find the water tally',
        xp: 20,
        description: 'Priests, nuns, novices, and pilgrims died beyond the pressure door. Their last work should explain why.'
      },
      {
        id: 'complete-trials',
        task: 'Complete the four trials',
        xp: 20,
        description: 'The final profession door still reads the old mechanical trial states.'
      },
      {
        id: 'claim-oath-armory',
        task: 'Open the Oath Armory',
        xp: 30,
        description: 'The Sealed Chapter is open. Its Oath Armory remained closed throughout the deaths outside it.'
      },
      {
        id: 'return-to-light',
        task: 'Take the return lift',
        xp: 30,
        description: 'The Processional Pike is out of its rack. The return lift can now be released from the chapter side.'
      },
      {
        id: 'complete',
        task: 'The buried novitiate is open',
        xp: 40,
        description: 'The Processional Pike has returned to the road after the buried trials were put to rest.'
      }
    ]
  },
  {
    id: 'names-below-the-hill',
    title: 'Names Below the Hill',
    initialStage: 'find-closure-roll',
    unlockedBy: { flag: 'old-pilgrim-names-quest-found' },
    objectives: [
      { text: 'Recover the closure-stair duty roll.', stage: 'find-closure-roll' },
      { text: 'Recover the novitiate sleeping roll.', stage: 'find-quarters-roll' },
      { text: 'Recover the trial candidate roll.', stage: 'find-trial-roll' },
      { text: 'Recover the chapter’s final seven names.', stage: 'find-chapter-roll' },
      { text: 'Decide what Father Noah should do with the recovered names.', stage: 'decide-names' },
      { text: 'The names have been given a place above ground.', stage: 'complete' }
    ],
    stages: [
      {
        id: 'find-closure-roll',
        task: 'Find the closure duty roll',
        description: 'The sealed stair kept a duty record for every priest, nun, novice, and pilgrim sent below.'
      },
      {
        id: 'find-quarters-roll',
        task: 'Find the sleeping roll',
        xp: 8,
        description: 'The closure record names the first watch. The novitiate roll should account for the people housed beyond the inner door.'
      },
      {
        id: 'find-trial-roll',
        task: 'Find the candidate roll',
        xp: 8,
        description: 'The sleeping roll is incomplete. The candidate board should carry the novices assigned to the profession galleries.'
      },
      {
        id: 'find-chapter-roll',
        task: 'Find the final seven names',
        xp: 8,
        description: 'The trial roll restores most of the congregation. The chapter record should name the last seven survivors.'
      },
      {
        id: 'decide-names',
        task: 'Return the names to Father Noah',
        xp: 12,
        description: 'The rolls account for all sixty-one people sealed beneath the church. Father Noah can decide where that record belongs, if you let him.'
      },
      {
        id: 'complete',
        task: 'The names have a place',
        xp: 35,
        description: 'A decision has been made about the record of the sixty-one people below the hill.'
      }
    ]
  }
]);

const surfaceDialogues = [
  {
    id: 'old-pilgrim-sister-calen',
    title: 'Sister Thecla',
    nodes: {
      start: {
        conditions: { flagsAbsent: ['old-pilgrim-field-count-reported'] },
        else: 'settled',
        lines: [
          'Sister Thecla has three cups on the cart rail. Two are turned mouth-down.',
          '“Tobias came back alone. I need the field counted before I send another family north.”'
        ],
        choices: [
          {
            label: 'Ask what happened in the fields',
            conditions: { questStages: { 'road-through-the-fields': 'speak-to-road-clergy' } },
            effects: {
              setFlag: 'old-pilgrim-field-search-started',
              questUpdate: {
                quest: 'road-through-the-fields',
                stage: 'investigate-fields',
                log: 'Sister Thecla asks for a count from the east field before she opens the north road.'
              }
            },
            next: 'field'
          },
          {
            label: 'Report the five opened pilgrims',
            conditions: {
              flag: 'old-pilgrim-fields-cleared',
              questStages: { 'road-through-the-fields': 'report-field-attack' }
            },
            effects: {
              setFlag: ['old-pilgrim-north-road-open', 'old-pilgrim-field-count-reported'],
              questUpdate: {
                quest: 'road-through-the-fields',
                stage: 'complete',
                log: 'Sister Thecla has the field count and opens the road toward the Quarantine Farms.'
              }
            },
            next: 'reported',
            tone: 'commit'
          },
          { label: 'Ask about the church on the hill', next: 'church' },
          leaveChoice
        ]
      },
      field: {
        lines: [
          '“The mule stopped first. Then the furrows stood up around it.” Thecla turns a third cup upright but does not fill it.',
          '“Bring me a number. Do not bring me a guess.”'
        ],
        choices: [{ label: 'Go to the east field', close: true, tone: 'commit' }]
      },
      church: {
        lines: [
          '“The hill church predates every road office still keeping paper. Father Noah sleeps below it when the roof behaves.”',
          '“He says the apse is too high. I say old churches were built by men who liked stairs.”'
        ],
        choices: [{ label: 'Return to the road count', next: 'start' }, leaveChoice]
      },
      reported: {
        lines: [
          'Thecla rights the last two cups. “Five bodies, no living bite. Everyone from this camp is accounted for, so I can reopen the road.”',
          'She drags the north chain into the ditch. “The Farms road is yours.”'
        ],
        choices: [{ label: 'Continue north when ready', close: true, tone: 'quiet' }]
      },
      settled: {
        lines: [
          'All three cups stand upright on the cart rail. Sister Thecla has tied the field count beneath them.',
          '“The north chain is in the ditch. I am keeping the cups here until someone answers from the Farms.”'
        ],
        choices: [{ label: 'Ask about the church on the hill', next: 'church' }, leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-father-noll',
    title: 'Father Noah',
    nodes: {
      start: {
        lines: [
          'Father Noah holds a page against the light leaking through his shelter roof.',
          '“The church inventory lists an apse stair. The church has no apse stair.”'
        ],
        choices: [
          {
            label: 'Read the copied closure line',
            conditions: { fieldRatings: { doctrine: 27 } },
            effects: { setFlag: 'old-pilgrim-father-plan-hint', xp: 5 },
            next: 'plan'
          },
          { label: 'Ask who served the church', next: 'people' },
          leaveChoice
        ]
      },
      plan: {
        lines: [
          'The line assigns an inner pressure key to the closure stair and an outer release to the raised apse.',
          'Noah taps the word inner. “There are two doors, though the public church only shows one.”'
        ],
        choices: [{ label: 'Search the church apse', close: true, tone: 'commit' }]
      },
      people: {
        lines: [
          '“Priests kept the road altar while nuns ran the hospice and taught the novices. Any spare basin marked a pilgrim bed.”',
          'He folds the page. “There were vows in the ledgers, then two pressure doors.”'
        ],
        choices: [{ label: 'Return to the inventory page', next: 'start' }, leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-oren-bale',
    title: 'Tobias Faber',
    nodes: {
      start: {
        conditions: { flagsAbsent: ['old-pilgrim-oren-treated'] },
        else: 'treated',
        lines: [
          'Tobias keeps his bandaged arm pinned against his coat. Mud has dried inside both ears.',
          '“There were people under the grain. I thought they were lying low from the wind.”'
        ],
        choices: [
          {
            label: 'Read the cuts through his coat',
            conditions: { fieldRatings: { hostSigns: 32 } },
            effects: { setFlag: 'old-pilgrim-field-opening-read', xp: 5 },
            next: 'signs'
          },
          {
            label: 'Dress the torn shoulder',
            conditions: {
              fieldRatings: { medicine: 27 },
              items: { 'field-dressing': 1 }
            },
            effects: {
              setFlag: ['old-pilgrim-oren-treated', 'old-pilgrim-cart-release-known'],
              inventory: {
                remove: [{ item: 'field-dressing', count: 1 }],
                requireAll: true
              },
              xp: 5,
              log: 'Tobias’s shoulder is cleaned and bound. He can move the hand without reopening the cut.'
            },
            next: 'cart-pin'
          },
          { label: 'Ask where the team fell', next: 'route' },
          leaveChoice
        ]
      },
      signs: {
        lines: [
          'The cuts rake outward from a fused hand. No tooth closed on him, and no black-gold thread remains in the wound.',
          'Tobias watches your face. “That means I keep the arm?”'
        ],
        choices: [{ label: 'For now', next: 'route' }, leaveChoice]
      },
      route: {
        lines: [
          '“East of the procession stones. Follow the cart rut until it stops being a rut.”',
          'His good hand closes. “Leah and Abner were beside the mule.”'
        ],
        choices: [{ label: 'Search the east field', close: true, tone: 'commit' }]
      },
      'cart-pin': {
        lines: [
          'Tobias tests the binding, then draws a cart frame in the mud with one finger.',
          '“Mine has a red load pin under the left rail. Pull it downhill and the bed drops, forcing whatever is beside it to climb through spokes.”'
        ],
        choices: [{ label: 'Use the cart if it still holds', close: true, tone: 'commit' }]
      },
      treated: {
        lines: [
          'Tobias flexes the dressed hand once and stops before the shoulder pulls.',
          '“Red pin under the left rail. Pull downhill. I built the cart to drop its load before it rolled a team into a ditch.”'
        ],
        choices: [
          { label: 'Ask where the team fell', next: 'route' },
          leaveChoice
        ]
      }
    }
  },
  {
    id: 'old-pilgrim-field-opening',
    title: 'The East Furrows',
    mustChoose: true,
    nodes: {
      start: {
        lines: [
          'The cart rut ends at an overturned frame, with five pilgrim coats lying facedown across separate furrows.',
          'One shoulder lifts; a breath later, the other four answer.'
        ],
        choices: [
          {
            label: 'Use Tobias’s wound pattern',
            conditions: { flag: 'old-pilgrim-field-opening-read' },
            next: 'read'
          },
          {
            label: 'Watch for the first opening',
            conditions: { fieldRatings: { hostSigns: 35 } },
            next: 'read'
          },
          {
            label: 'Find the body leading the count',
            conditions: { fieldRatings: { search: 35 } },
            next: 'read'
          },
          {
            label: 'Crawl to Tobias’s red load pin',
            conditions: { flag: 'old-pilgrim-cart-release-known' },
            next: 'cart'
          },
          { label: 'Enter the furrows', next: 'sprung', tone: 'danger' }
        ]
      },
      read: {
        lines: [
          'The nearest body is not waking. It is waiting for the others to finish opening.',
          'Its fused hand tightens around the prayer cord before the head moves.'
        ],
        choices: [
          {
            label: 'Fire before the count begins',
            tone: 'danger',
            effects: {
              setFlag: 'old-pilgrim-field-ambush-read',
              startCombat: {
                encounter: 'old-pilgrim-field-opening',
                openingAttack: {
                  target: 'old-pilgrim-stage-iv-lead',
                  attackId: 'sidearm',
                  guaranteedHit: true,
                  spendAp: false,
                  failureLog: 'The sidearm is not ready. The five forms rise together.'
                }
              }
            }
          }
        ]
      },
      cart: {
        lines: [
          'The red pin sits beneath the downhill rail. The dropped bed will close the central furrow and leave a narrow line beside the stone boundary.',
          'The five coats have not moved. One fused hand has tightened around the rear wheel.'
        ],
        choices: [
          {
            label: 'Pull the pin and take the boundary line',
            tone: 'danger',
            effects: {
              setFlag: 'old-pilgrim-field-cart-flank',
              teleport: { x: 76, y: 43, facing: 'ne' },
              startCombat: { encounter: 'old-pilgrim-field-opening' },
              log: 'The cart bed slams across the central furrow. The procession must turn toward the boundary stones.'
            }
          }
        ]
      },
      sprung: {
        lines: [
          'The first coat rolls onto its back as the ribs pull apart beneath it. Four more bodies rise on hands joined by old prayer knots.',
          'The cart frame shifts as a horn catches under the broken harness.'
        ],
        choices: [
          {
            label: 'Hold the furrow line',
            tone: 'danger',
            effects: { startCombat: { encounter: 'old-pilgrim-field-opening' } }
          }
        ]
      }
    }
  },
  {
    id: 'old-pilgrim-north-road',
    title: 'Road to the Quarantine Farms',
    nodes: {
      start: {
        lines: [
          'The chain lies in the ditch. Beyond it, Old Pilgrim Way narrows between fallow fields and white quarantine posts.'
        ],
        choices: [
          {
            label: 'Mark the route north',
            conditions: { flag: 'old-pilgrim-north-road-open' },
            effects: {
              setFlag: 'old-pilgrim-way-complete',
              showBriefing: {
                title: 'QUARANTINE FARMS',
                pages: [[
                  'The road leaves the hill church behind and enters the old quarantine allotments.',
                  'White posts continue north. No farm bell answers Sister Thecla’s opening call.'
                ]]
              }
            },
            tone: 'commit'
          },
          {
            label: 'The field count is not settled',
            conditions: { flagsAbsent: ['old-pilgrim-north-road-open'] },
            close: true,
            tone: 'quiet'
          },
          leaveChoice
        ]
      }
    }
  },
  travelDialogue({
    id: 'old-pilgrim-south-road',
    title: 'Road to South Measure',
    lines: ['The old stones run south toward the raised chain at South Measure.'],
    label: 'Return to South Measure',
    path: './data/levels/ash_road_south.json',
    player: { x: 65, y: 2, facing: 's' }
  }),
  travelDialogue({
    id: 'old-pilgrim-hill-church-entry',
    title: 'Hill Church',
    lines: ['The public doors have dropped from one hinge. Dry leaves lie across the nave beyond them.'],
    label: 'Enter the Hill Church',
    path: './data/levels/old_pilgrim_hill_church.json',
    player: { x: 22, y: 29, facing: 'n' }
  }),
  {
    id: 'old-pilgrim-evin-sael',
    title: 'Timothy Cato',
    nodes: {
      start: {
        lines: [
          'Timothy measures the shelter cots with a knotted cord. Each result goes onto a Compact placement sheet.',
          '“South Measure sent names north before it sent timber. I am trying to make that order survivable.”'
        ],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-gatt-vire',
    title: 'Gaius Cotta',
    nodes: {
      start: {
        lines: [
          'Gaius has driven Morrow stakes into both road shoulders. None touch the old center stones.',
          '“Chain pays for clear passage. It also writes down who cleared it.”'
        ],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-perr-varo',
    title: 'Tobit Faber',
    nodes: {
      start: {
        lines: [
          'Tobit packs broken stone into the west rut with the back of a shovel.',
          '“Resident water bought us a road crew. No office owns the shovel yet.”'
        ],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-hara-doss',
    title: 'Hannah of Bethel',
    nodes: {
      start: {
        lines: [
          'Hannah has tied two bedrolls under the shelter and kept a third across her knees.',
          '“They sealed South Measure. Baruch asks when we go home. I told him roads do not answer that.”'
        ],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-brother-tarn',
    title: 'Brother Cassian',
    nodes: {
      start: {
        lines: [
          'Cassian rests one plated hand on a procession stone. A faint knock passes through his wrist and stops.',
          '“The road keeps a second count beneath the cart wheels.”'
        ],
        choices: [
          {
            label: 'Ask about the church hill',
            conditions: { flag: 'tarn-independent-scout' },
            effects: { setFlag: 'old-pilgrim-tarn-heard-church-seal' },
            next: 'church'
          },
          {
            label: 'Ask about the shared road',
            conditions: { flag: 'tarn-shared-road' },
            next: 'camp'
          },
          leaveChoice
        ]
      },
      church: {
        lines: [
          '“The knock climbs to the church, then returns through buried iron. It does not carry a living answer.”',
          'He removes his hand. “The old seal is still taking attendance.”'
        ],
        choices: [leaveChoice]
      },
      camp: {
        lines: [
          '“South Measure asked me to share the road. I can hear its water count from here.”',
          'He looks north. “Something else learned the rhythm.”'
        ],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-nel-varo',
    title: 'Noa Faber',
    nodes: {
      start: {
        lines: [
          'Noa has pinned lesson cards to the inside of the shelter where rain cannot turn the ink.',
          '“The Farms have children on the ration lists. That is enough reason to keep walking.”'
        ],
        choices: [
          {
            label: 'Ask who approved the northern school',
            conditions: { flag: 'nel-family-review' },
            next: 'review'
          },
          {
            label: 'Ask about the forged household line',
            conditions: { flag: 'nel-family-forged' },
            next: 'forged'
          },
          {
            label: 'Ask why she came alone',
            conditions: { flag: 'nel-school-alone' },
            next: 'alone'
          },
          leaveChoice
        ]
      },
      review: {
        lines: ['“A review is not approval. It is enough paper to reach the next table alive.”'],
        choices: [leaveChoice]
      },
      forged: {
        lines: ['“The family line is false, not the pupils. I can live with that order.”'],
        choices: [leaveChoice]
      },
      alone: {
        lines: ['“South Measure kept its argument. I took the cards and the northern names.”'],
        choices: [leaveChoice]
      }
    }
  }
];

const buriedDialogues = [
  {
    id: 'old-pilgrim-apse-synthesis',
    title: 'Raised Apse',
    nodes: {
      start: {
        conditions: { flagsAbsent: ['old-pilgrim-closure-plan-read'] },
        else: 'proved',
        lines: [
          'The altar platform is too high for the church floor. Shallow seams divide its front stones into the width of a pressure door.',
          'One clue gives suspicion. Two matching records would give the mechanism a shape.'
        ],
        choices: [
          {
            label: 'Set two findings against the apse stonework',
            conditions: {
              flagsAtLeast: {
                count: 2,
                of: [
                  'old-pilgrim-father-plan-hint',
                  'old-pilgrim-apse-clue-ledger',
                  'old-pilgrim-apse-clue-foundation',
                  'old-pilgrim-apse-clue-bell',
                  'old-pilgrim-tarn-heard-church-seal'
                ]
              }
            },
            effects: {
              setFlag: ['old-pilgrim-closure-plan-read', 'old-pilgrim-buried-novitiate-found'],
              questUpdate: {
                quest: 'the-buried-novitiate',
                stage: 'find-apse-release',
                log: 'Two independent findings prove that a pressure-rated closure stair lies beneath the raised apse.'
              },
              xp: 10
            },
            next: 'proved',
            tone: 'commit'
          },
          leaveChoice
        ]
      },
      proved: {
        lines: [
          'The findings point to the same place. The center stones are a pressure door faced to resemble the altar plinth.',
          'A manual release must sit somewhere along the apse edge.'
        ],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-closure-register',
    title: 'Closure Duty Register',
    nodes: {
      start: {
        conditions: { flagsAbsent: ['old-pilgrim-name-roll-closure'] },
        else: 'copied',
        lines: [
          'A pressure slate lists the first watch below the church: six priests, eleven nuns, fourteen novices, and thirty pilgrims.',
          'The alarm reads REGIONAL CONTAMINATION: OUTER CLOSURE AUTOMATIC. Local release remains disabled.'
        ],
        choices: [
          {
            label: 'Copy the duty roll and alarm line',
            effects: {
              setFlag: [
                'old-pilgrim-names-quest-found',
                'old-pilgrim-name-roll-closure',
                'old-pilgrim-automatic-closure-known'
              ],
              questUpdate: {
                quest: 'names-below-the-hill',
                stage: 'find-quarters-roll',
                log: 'The closure duty roll names the first watch. A sleeping roll should account for the rest of the congregation.'
              },
              xp: 5
            },
            next: 'copied'
          },
          leaveChoice
        ]
      },
      copied: {
        lines: [
          'The automatic seal accepted a regional alarm. No priest or nun below the hill ordered the doors shut.',
          'A blank clearance box waits beneath the sixty-one admitted names.'
        ],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-manual-release',
    title: 'Manual Release Wheel',
    nodes: {
      start: {
        lines: [
          'The wheel is locked at both ends of its travel. Iron filings lie below a housing opened and closed dozens of times.'
        ],
        choices: [
          {
            label: 'Trace the interlock teeth',
            conditions: {
              fieldRatings: { engineering: 30 },
              flagsAbsent: ['old-pilgrim-manual-release-known']
            },
            effects: {
              setFlag: ['old-pilgrim-manual-release-known', 'old-pilgrim-breach-brace-known'],
              xp: 5,
              log: 'The wheel was sound. Automatic closure withdrew the local release tooth and waited for clearance from outside.'
            },
            next: 'understood'
          },
          {
            label: 'Read the wear left by the trapped hands',
            conditions: {
              fieldRatings: { search: 30 },
              flagsAbsent: ['old-pilgrim-manual-release-known']
            },
            effects: {
              setFlag: ['old-pilgrim-manual-release-known', 'old-pilgrim-breach-brace-known'],
              xp: 5,
              log: 'The wheel turned freely until something inside the wall withdrew its drive tooth. Later blows struck the same housing.'
            },
            next: 'understood'
          },
          leaveChoice
        ]
      },
      understood: {
        lines: [
          'The people below did not fail to find the release. The release was designed to refuse them.',
          'A bent brace beside the housing preserves the angle used during the last breach attempt.'
        ],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-quarters-pump',
    title: 'Novitiate Pump',
    nodes: {
      start: {
        lines: [
          'The pump handle moves without resistance. Its leather piston was cut out in narrow strips, then boiled in the refectory pot.'
        ],
        choices: [
          {
            label: 'Open the feed housing',
            conditions: {
              fieldRatings: { engineering: 27 },
              flagsAbsent: ['old-pilgrim-water-pump-known']
            },
            effects: {
              setFlag: 'old-pilgrim-water-pump-known',
              xp: 5,
              log: 'The pump did not break first. Its feed pipe lost pressure from the chapter side, then the piston was taken for food.'
            },
            next: 'read'
          },
          {
            label: 'Read the cut and cooking marks',
            conditions: {
              fieldRatings: { search: 27 },
              flagsAbsent: ['old-pilgrim-water-pump-known']
            },
            effects: {
              setFlag: 'old-pilgrim-water-pump-known',
              xp: 5,
              log: 'The piston was sacrificed after the line ran dry. Someone divided the leather into equal strips.'
            },
            next: 'read'
          },
          leaveChoice
        ]
      },
      read: {
        lines: ['The feed line continues north toward the chapter cistern. No rupture marks the quarters pipe.'],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-quarters-cistern',
    title: 'Dry Cistern',
    nodes: {
      start: {
        lines: [
          'Lime rings descend in measured steps. The lowest ring was scratched by hand after the gauge stopped moving.'
        ],
        choices: [
          {
            label: 'Compare the rings with the closure days',
            conditions: {
              flagsAtLeast: {
                count: 1,
                of: ['old-pilgrim-empty-tank-known', 'old-pilgrim-water-pump-known']
              },
              flagsAbsent: ['old-pilgrim-water-cistern-known']
            },
            effects: {
              setFlag: 'old-pilgrim-water-cistern-known',
              xp: 5,
              log: 'The emergency tank was dry on day two. The main cistern fed the quarters until day five, then stopped without a leak here.'
            },
            next: 'read'
          },
          leaveChoice
        ]
      },
      read: {
        lines: ['The last usable water came from the chapter line. The failure lies beyond the profession galleries.'],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-quarters-roll',
    title: 'Novitiate Sleeping Roll',
    nodes: {
      start: {
        conditions: { flagsAbsent: ['old-pilgrim-name-roll-quarters'] },
        else: 'copied',
        lines: [
          'Wax tablets assign every sleeping place. Several names move to the pump room after the fifth day.',
          'Four novices are marked CANDIDATE GALLERY and do not appear on the dormitory death list.'
        ],
        choices: [
          {
            label: 'Copy the sleeping roll',
            effects: {
              setFlag: ['old-pilgrim-name-roll-quarters', 'old-pilgrim-quarters-sick-list-known'],
              questUpdate: {
                quest: 'names-below-the-hill',
                stage: 'find-trial-roll',
                log: 'The novitiate roll accounts for everyone except four candidates sent into the profession galleries.'
              },
              xp: 5
            },
            next: 'copied'
          },
          leaveChoice
        ]
      },
      copied: {
        lines: ['The final annotations put active bleeding first and fever cases next. Ordinary thirst comes last, matching the Mercy trial.'],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-trial-roll',
    title: 'Candidate Roll',
    nodes: {
      start: {
        conditions: { flagsAbsent: ['old-pilgrim-name-roll-trials'] },
        else: 'copied',
        lines: [
          'Four candidate names were entered before the alarm. Later hands add duties beside them: cups, valves, ration carry, sick watch.',
          'None made profession. All four names were folded back into the congregation’s working roll.'
        ],
        choices: [
          {
            label: 'Copy the four candidate names',
            effects: {
              setFlag: 'old-pilgrim-name-roll-trials',
              questUpdate: {
                quest: 'names-below-the-hill',
                stage: 'find-chapter-roll',
                log: 'The four candidates are accounted for. Only the chapter’s final seven names remain.'
              },
              xp: 5
            },
            next: 'copied'
          },
          leaveChoice
        ]
      },
      copied: {
        lines: ['The duties show what the trials meant before they became locks: move quietly, keep the basins, share weight, choose who needs aid first.'],
        choices: [leaveChoice]
      }
    }
  },
  travelDialogue({
    id: 'old-pilgrim-hill-church-exit',
    title: 'Hill Church Doors',
    lines: ['Wind pushes dead leaves through the broken public doors. Old Pilgrim Way lies below the hill.'],
    label: 'Return to Old Pilgrim Way',
    path: './data/levels/old_pilgrim_way.json',
    player: { x: 88, y: 17, facing: 's' }
  }),
  travelDialogue({
    id: 'old-pilgrim-closure-to-church',
    title: 'Outer Closure Stair',
    lines: ['The upper stair climbs behind the raised apse. Its outer catches remain released from this side.'],
    label: 'Climb to the Hill Church',
    path: './data/levels/old_pilgrim_hill_church.json',
    player: { x: 22, y: 2, facing: 's' }
  }),
  travelDialogue({
    id: 'old-pilgrim-quarters-to-closure',
    title: 'Inner Pressure Door',
    lines: ['The inner pressure door stands open onto the long closure stair.'],
    label: 'Return to the Closure Stair',
    path: './data/levels/old_pilgrim_closure_stair.json',
    player: { x: 15, y: 45, facing: 'n' }
  }),
  {
    id: 'old-pilgrim-water-tally',
    title: 'Last Water Tally',
    nodes: {
      start: {
        lines: [
          'The pump board begins with sixty-one names across nine scratched days. Only seven reach the last line.',
          'Water ended on the fifth day, two days before the pantry emptied. No Host sign is marked beside any name.'
        ],
        choices: [
          {
            label: 'Reconstruct the water failure',
            conditions: {
              flagsAtLeast: {
                count: 2,
                of: [
                  'old-pilgrim-empty-tank-known',
                  'old-pilgrim-water-pump-known',
                  'old-pilgrim-water-cistern-known',
                  'old-pilgrim-pantry-stripped-known'
                ]
              },
              flagsAbsent: ['old-pilgrim-water-failure-understood']
            },
            effects: {
              setFlag: 'old-pilgrim-water-failure-understood',
              xp: 8,
              log: 'The emergency tank was already low when the chapter-side intake failed on day five. The powered seal kept the congregation inside without water.'
            },
            next: 'failure'
          },
          {
            label: 'Copy the final count',
            conditions: { flagsAbsent: ['old-pilgrim-water-tally-read'] },
            effects: {
              setFlag: ['old-pilgrim-water-tally-read', 'old-pilgrim-trial-route-open'],
              questUpdate: {
                quest: 'the-buried-novitiate',
                stage: 'complete-trials',
                log: 'The buried congregation survived nine days. The water ended before the pressure seal released.'
              },
              xp: 10
            },
            next: 'copied'
          },
          leaveChoice
        ]
      },
      copied: {
        lines: [
          'The final note is in a nun’s hand: SERVICE VALVE DRY. PROFESSION GALLERY STILL ANSWERS.',
          'A narrow north passage bears the same four trial marks.'
        ],
        choices: [{ label: 'Enter the trial passage', close: true, tone: 'commit' }]
      },
      failure: {
        lines: [
          'The main intake failed after the emergency reserve had already shrunk. The closure system treated outside air as the only danger.',
          'By the time hunger mattered, thirst had already decided the count.'
        ],
        choices: [{ label: 'Return to the tally', next: 'start' }, leaveChoice]
      }
    }
  },
  travelDialogue({
    id: 'old-pilgrim-quarters-to-trials',
    title: 'Profession Passage',
    lines: ['Four worn trial marks lead north from the quarters. The pressure seal behind them never closed.'],
    label: 'Enter the Trial Galleries',
    conditions: { flag: 'old-pilgrim-trial-route-open' },
    path: './data/levels/old_pilgrim_trial_galleries.json',
    player: { x: 32, y: 45, facing: 'n' },
    effects: {
      questUpdate: {
        quest: 'the-buried-novitiate',
        stage: 'complete-trials',
        log: 'The old profession galleries still control the chapter door.'
      }
    }
  }),
  travelDialogue({
    id: 'old-pilgrim-trials-to-quarters',
    title: 'Candidate Stair',
    lines: ['The candidate stair descends to the novitiate quarters.'],
    label: 'Return to the Novitiate Quarters',
    path: './data/levels/old_pilgrim_novitiate_quarters.json',
    player: { x: 24, y: 2, facing: 's' }
  }),
  {
    id: 'old-pilgrim-trial-quiet',
    title: 'Quiet Threshold',
    nodes: {
      start: {
        lines: [
          'Six brass cups hang across the passage. A candidate once crossed beneath them without making the sentry arm strike.',
          'Dust shows the floor stones that move under weight.'
        ],
        choices: [
          {
            label: 'Cross between the listening cups',
            conditions: {
              fieldRatings: { stealth: 32 },
              flagsAbsent: ['old-pilgrim-trial-quiet']
            },
            effects: {
              setFlag: ['old-pilgrim-trial-quiet', 'old-pilgrim-trial-quiet-kept'],
              xp: 8,
              log: 'The sentry arm remains still. One profession stud rises at the final door.'
            },
            next: 'passed'
          },
          {
            label: 'Read the silence rubric',
            conditions: {
              fieldRatings: { doctrine: 32 },
              flagsAbsent: ['old-pilgrim-trial-quiet']
            },
            effects: {
              setFlag: ['old-pilgrim-trial-quiet', 'old-pilgrim-trial-quiet-kept'],
              xp: 8,
              log: 'The rubric names every safe stone. One profession stud rises at the final door.'
            },
            next: 'passed'
          },
          {
            label: 'Use the severed bell cable as a spacing measure',
            conditions: {
              flag: 'old-pilgrim-bell-cable-known',
              flagsAbsent: ['old-pilgrim-trial-quiet']
            },
            effects: {
              setFlag: ['old-pilgrim-trial-quiet', 'old-pilgrim-trial-quiet-kept'],
              xp: 5,
              log: 'The cable knots match the listening-cup intervals. The sentry arm remains still and the Quiet stud rises.'
            },
            next: 'passed'
          },
          {
            label: 'Pin the cups and cross',
            conditions: { flagsAbsent: ['old-pilgrim-trial-quiet'] },
            effects: {
              setFlag: ['old-pilgrim-trial-quiet', 'old-pilgrim-trial-quiet-broken'],
              log: 'Two brass cups tear from their cords. The threshold registers a passage, but a side cache shuts.'
            },
            next: 'passed',
            tone: 'commit'
          },
          leaveChoice
        ]
      },
      passed: {
        lines: ['The sentry arm settles against its stop. The Quiet stud remains raised.'],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-trial-service',
    title: 'Trial of Service',
    nodes: {
      start: {
        lines: [
          'Three hand valves feed a row of pilgrim basins. The supply pipe is dry, but the old control teeth still move.',
          'A service plate asks which duty continues after the water is gone.'
        ],
        choices: [
          {
            label: 'Rebuild the valve sequence',
            conditions: {
              fieldRatings: { engineering: 32 },
              flagsAbsent: ['old-pilgrim-trial-service']
            },
            effects: {
              setFlag: ['old-pilgrim-trial-service', 'old-pilgrim-trial-service-kept'],
              xp: 8,
              log: 'The valves complete a dry wash cycle. The Service stud rises.'
            },
            next: 'passed'
          },
          {
            label: 'Use the last water tally',
            conditions: {
              flag: 'old-pilgrim-water-tally-read',
              flagsAbsent: ['old-pilgrim-trial-service']
            },
            effects: {
              setFlag: ['old-pilgrim-trial-service', 'old-pilgrim-trial-service-kept'],
              log: 'SERVICE VALVE DRY names the empty center basin. The Service stud rises.'
            },
            next: 'passed'
          },
          {
            label: 'Force all three valve teeth',
            conditions: { flagsAbsent: ['old-pilgrim-trial-service'] },
            effects: {
              setFlag: ['old-pilgrim-trial-service', 'old-pilgrim-trial-service-broken'],
              log: 'The center tooth breaks, but the gallery records a completed cycle. A supply drawer locks.'
            },
            next: 'passed',
            tone: 'commit'
          },
          leaveChoice
        ]
      },
      passed: {
        lines: ['No water reaches the basins. The Service stud remains raised.'],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-trial-burden',
    title: 'Burden Gallery',
    nodes: {
      start: {
        lines: [
          'A stone reliquary frame hangs across the passage. Counterweight cords vanish into two wall shafts.',
          'The candidate was meant to move the burden without dropping the empty shrine.'
        ],
        choices: [
          {
            label: 'Take the frame’s weight',
            conditions: {
              fieldRatings: { engineering: 32 },
              flagsAbsent: ['old-pilgrim-trial-burden']
            },
            effects: {
              setFlag: ['old-pilgrim-trial-burden', 'old-pilgrim-trial-burden-kept'],
              xp: 8,
              log: 'Both cords share the load. The frame rises and the Burden stud follows.'
            },
            next: 'passed'
          },
          {
            label: 'Lift while the left cord turns',
            conditions: {
              fieldRatings: { melee: 32 },
              flagsAbsent: ['old-pilgrim-trial-burden']
            },
            effects: {
              setFlag: ['old-pilgrim-trial-burden', 'old-pilgrim-trial-burden-kept'],
              xp: 8,
              log: 'The frame rises before the right cord takes strain. The Burden stud follows.'
            },
            next: 'passed'
          },
          {
            label: 'Brace it at the closure crew’s breach angle',
            conditions: {
              flag: 'old-pilgrim-breach-brace-known',
              flagsAbsent: ['old-pilgrim-trial-burden']
            },
            effects: {
              setFlag: ['old-pilgrim-trial-burden', 'old-pilgrim-trial-burden-kept'],
              xp: 5,
              log: 'The old brace angle divides the weight between frame and wall. The Burden stud rises without a stone falling.'
            },
            next: 'passed'
          },
          {
            label: 'Drag the frame clear',
            conditions: { flagsAbsent: ['old-pilgrim-trial-burden'] },
            effects: {
              setFlag: ['old-pilgrim-trial-burden', 'old-pilgrim-trial-burden-broken'],
              log: 'Stone tears across stone. The passage opens, but the reliquary drawer breaks under the frame.'
            },
            next: 'passed',
            tone: 'commit'
          },
          leaveChoice
        ]
      },
      passed: {
        lines: ['The empty shrine rests above the passage. The Burden stud remains raised.'],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-trial-mercy',
    title: 'Trial of Mercy',
    nodes: {
      start: {
        lines: [
          'The examination slate places a thirsty pilgrim beside a bleeding novice. Below them sits a priest with a crushed hand.',
          'The old answer wheels must be set in the order of aid.'
        ],
        choices: [
          {
            label: 'Order the cases by survivable harm',
            conditions: {
              fieldRatings: { medicine: 32 },
              flagsAbsent: ['old-pilgrim-trial-mercy']
            },
            effects: {
              setFlag: ['old-pilgrim-trial-mercy', 'old-pilgrim-trial-mercy-kept'],
              xp: 8,
              log: 'Bleeding, thirst, then the closed hand. The Mercy stud rises.'
            },
            next: 'passed'
          },
          {
            label: 'Apply the hospice mercy rule',
            conditions: {
              fieldRatings: { doctrine: 32 },
              flagsAbsent: ['old-pilgrim-trial-mercy']
            },
            effects: {
              setFlag: ['old-pilgrim-trial-mercy', 'old-pilgrim-trial-mercy-kept'],
              xp: 8,
              log: 'The hospice rule gives the same order. The Mercy stud rises.'
            },
            next: 'passed'
          },
          {
            label: 'Use the final sick-watch order',
            conditions: {
              flag: 'old-pilgrim-quarters-sick-list-known',
              flagsAbsent: ['old-pilgrim-trial-mercy']
            },
            effects: {
              setFlag: ['old-pilgrim-trial-mercy', 'old-pilgrim-trial-mercy-kept'],
              xp: 5,
              log: 'The sleeping roll preserves the same order: bleeding, thirst, then the closed hand. The Mercy stud rises.'
            },
            next: 'passed'
          },
          {
            label: 'Turn every answer wheel',
            conditions: { flagsAbsent: ['old-pilgrim-trial-mercy'] },
            effects: {
              setFlag: ['old-pilgrim-trial-mercy', 'old-pilgrim-trial-mercy-broken'],
              log: 'The third wheel jams on a false answer. The gallery accepts the motion and seals its medicine drawer.'
            },
            next: 'passed',
            tone: 'commit'
          },
          leaveChoice
        ]
      },
      passed: {
        lines: ['The three answer wheels face inward. The Mercy stud remains raised.'],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-final-profession',
    title: 'Final Profession',
    nodes: {
      start: {
        lines: [
          'Four brass studs surround the chapter release. Each one carries the wear of a different trial mechanism.'
        ],
        choices: [
          {
            label: 'Present four intact measures',
            conditions: {
              flagsAtLeast: {
                count: 4,
                of: [
                  'old-pilgrim-trial-quiet-kept',
                  'old-pilgrim-trial-service-kept',
                  'old-pilgrim-trial-burden-kept',
                  'old-pilgrim-trial-mercy-kept'
                ]
              }
            },
            effects: {
              setFlag: 'old-pilgrim-profession-intact',
              questUpdate: {
                quest: 'the-buried-novitiate',
                stage: 'claim-oath-armory',
                log: 'Four intact profession measures release the Sealed Chapter and preserve every candidate cache.'
              },
              loadLevel: {
                path: './data/levels/old_pilgrim_sealed_chapter.json',
                player: { x: 23, y: 33, facing: 'n' }
              }
            },
            tone: 'commit'
          },
          {
            label: 'Present the answered measures',
            conditions: {
              flags: [
                'old-pilgrim-trial-quiet',
                'old-pilgrim-trial-service',
                'old-pilgrim-trial-burden',
                'old-pilgrim-trial-mercy'
              ],
              flagsAtLeast: {
                count: 1,
                of: [
                  'old-pilgrim-trial-quiet-broken',
                  'old-pilgrim-trial-service-broken',
                  'old-pilgrim-trial-burden-broken',
                  'old-pilgrim-trial-mercy-broken'
                ]
              }
            },
            effects: {
              setFlag: 'old-pilgrim-profession-forced',
              questUpdate: {
                quest: 'the-buried-novitiate',
                stage: 'claim-oath-armory',
                log: 'The damaged profession measures release the Sealed Chapter. Broken trial mechanisms remain behind.'
              },
              loadLevel: {
                path: './data/levels/old_pilgrim_sealed_chapter.json',
                player: { x: 23, y: 33, facing: 'n' }
              }
            },
            tone: 'commit'
          },
          leaveChoice
        ]
      }
    }
  },
  travelDialogue({
    id: 'old-pilgrim-chapter-to-trials',
    title: 'Profession Door',
    lines: ['The four profession studs hold the chapter door open from within.'],
    label: 'Return to the Trial Galleries',
    path: './data/levels/old_pilgrim_trial_galleries.json',
    player: { x: 32, y: 2, facing: 's' }
  }),
  {
    id: 'old-pilgrim-final-water-record',
    title: 'Chapter Closure Record',
    nodes: {
      start: {
        conditions: { flagsAbsent: ['old-pilgrim-name-roll-chapter'] },
        else: 'names',
        lines: [
          'The chapter record repeats one line for six days: OUTER AIR UNSAFE. RELEASE REFUSED.',
          'The last entry names seven living people and no remaining water. The next line was never written.'
        ],
        choices: [
          {
            label: 'Copy the final seven names',
            effects: {
              setFlag: 'old-pilgrim-name-roll-chapter',
              questUpdate: {
                quest: 'names-below-the-hill',
                stage: 'decide-names',
                log: 'All sixty-one people below the hill are accounted for. Father Noah can receive the recovered rolls.'
              },
              xp: 5
            },
            next: 'names'
          },
          {
            label: 'Compare the bodies with the record',
            conditions: {
              fieldRatings: { medicine: 27 },
              flagsAbsent: ['old-pilgrim-final-record-read']
            },
            effects: {
              setFlag: 'old-pilgrim-final-record-read',
              xp: 8,
              log: 'Hunger and long thirst mark the dead, along with old injuries from the failed breach. None opened to the Host.'
            },
            next: 'read'
          },
          leaveChoice
        ]
      },
      names: {
        lines: [
          'The final seven are Sister Aurelia Fontana, Sister Claudia, Father Isidore, novice Tabitha Felix, novice Manasseh Rufus, pilgrim Simeon Longus, and pilgrim Orpah Silo.',
          'Beside the names, a smaller hand wrote: CLEARANCE NEVER CAME. KEEP THE OUTER DOOR SHUT, EVEN WITHOUT WATER.'
        ],
        choices: [
          {
            label: 'Compare the bodies with the record',
            conditions: {
              fieldRatings: { medicine: 27 },
              flagsAbsent: ['old-pilgrim-final-record-read']
            },
            effects: {
              setFlag: 'old-pilgrim-final-record-read',
              xp: 8,
              log: 'Hunger and long thirst mark the dead, along with old injuries from the failed breach. None opened to the Host.'
            },
            next: 'read'
          },
          leaveChoice
        ]
      },
      read: {
        lines: [
          'The closure did what it was built to do. It kept the Bloom outside and kept every living person inside.',
          'The release waited for an external clearance that never came.'
        ],
        choices: [leaveChoice]
      }
    }
  },
  {
    id: 'old-pilgrim-return-lift',
    title: 'Chapter Return Lift',
    nodes: {
      start: {
        lines: [
          'A narrow lift cage rises toward the church bell stair. Its profession catch is linked to the empty pike rack.'
        ],
        choices: [
          {
            label: 'Release the lift with the pike weight',
            conditions: { questStages: { 'the-buried-novitiate': 'return-to-light' } },
            effects: {
              setFlag: 'old-pilgrim-return-lift-open',
              questUpdate: {
                quest: 'the-buried-novitiate',
                stage: 'complete',
                log: 'The chapter return lift opens into the Hill Church bell stair.'
              },
              loadLevel: {
                path: './data/levels/old_pilgrim_hill_church.json',
                player: { x: 38, y: 8, facing: 's' }
              }
            },
            tone: 'commit'
          },
          leaveChoice
        ]
      }
    }
  },
  {
    id: 'old-pilgrim-father-noll-below',
    title: 'Father Noah',
    nodes: {
      start: {
        conditions: { flag: 'old-pilgrim-names-decided' },
        else: 'unsettled',
        lines: [
          'Father Noah works beside the raised apse. Below it, the pressure door remains open and the church no longer pretends the stair is absent.'
        ],
        choices: [leaveChoice]
      },
      unsettled: {
        conditions: {
          flags: [
            'old-pilgrim-name-roll-closure',
            'old-pilgrim-name-roll-quarters',
            'old-pilgrim-name-roll-trials',
            'old-pilgrim-name-roll-chapter'
          ]
        },
        else: 'incomplete',
        lines: [
          'Father Noah stands inside the church with the four copied rolls laid across the hospice table. He keeps one hand off the paper.',
          '“Sixty-one names. Carving them here gives the Remnant a claim on the site. A road-book copy tells every northern clerk what lies below. Back in the chapter, the dead keep their privacy but lose their witness.”'
        ],
        choices: [
          {
            label: 'Carve the sixty-one names in the church',
            conditions: {
              flags: [
                'old-pilgrim-name-roll-closure',
                'old-pilgrim-name-roll-quarters',
                'old-pilgrim-name-roll-trials',
                'old-pilgrim-name-roll-chapter'
              ]
            },
            effects: {
              setFlag: ['old-pilgrim-names-decided', 'old-pilgrim-names-memorial'],
              questUpdate: {
                quest: 'names-below-the-hill',
                stage: 'complete',
                log: 'Father Noah begins a public memorial for the sixty-one people sealed below the Hill Church.'
              }
            },
            next: 'memorial',
            tone: 'commit'
          },
          {
            label: 'Put a copy in the northbound road book',
            conditions: {
              flags: [
                'old-pilgrim-name-roll-closure',
                'old-pilgrim-name-roll-quarters',
                'old-pilgrim-name-roll-trials',
                'old-pilgrim-name-roll-chapter'
              ]
            },
            effects: {
              setFlag: ['old-pilgrim-names-decided', 'old-pilgrim-names-road-copy'],
              questUpdate: {
                quest: 'names-below-the-hill',
                stage: 'complete',
                log: 'A copy of the sixty-one names enters the northbound road book. The buried site is now part of the living route.'
              }
            },
            next: 'road',
            tone: 'commit'
          },
          {
            label: 'Return the rolls to the sealed chapter',
            conditions: {
              flags: [
                'old-pilgrim-name-roll-closure',
                'old-pilgrim-name-roll-quarters',
                'old-pilgrim-name-roll-trials',
                'old-pilgrim-name-roll-chapter'
              ]
            },
            effects: {
              setFlag: ['old-pilgrim-names-decided', 'old-pilgrim-names-sealed'],
              questUpdate: {
                quest: 'names-below-the-hill',
                stage: 'complete',
                log: 'The recovered rolls return to the Sealed Chapter. Father Noah keeps only the count above ground.'
              }
            },
            next: 'sealed',
            tone: 'commit'
          },
          leaveChoice
        ]
      },
      incomplete: {
        lines: [
          'Father Noah has cleared the hospice table and weighted each recovered page with a cup.',
          '“The count says sixty-one. The names still break in the middle. I will not call a broken roll a memorial.”'
        ],
        choices: [leaveChoice]
      },
      memorial: {
        lines: [
          'Noah sets a nail at the left edge of the apse plaster. “Then the names get the first word, not an office.”',
          'He begins with Sister Aurelia Fontana.'
        ],
        choices: [leaveChoice]
      },
      road: {
        lines: [
          'Noah sands the copy and folds it into oilcloth. “Clerks may use it, and families may too. I cannot promise who will be allowed to read it first.”'
        ],
        choices: [leaveChoice]
      },
      sealed: {
        lines: [
          'Noah gathers the copies without stacking them. “The count stays here. The names go back to the people who carried them.”'
        ],
        choices: [leaveChoice]
      }
    }
  }
];

export const OLD_PILGRIM_DIALOGUES = Object.freeze([
  ...surfaceDialogues,
  ...buriedDialogues
]);
