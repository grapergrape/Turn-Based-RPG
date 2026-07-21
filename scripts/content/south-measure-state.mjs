export const SOUTH_MEASURE_QUEST_IDS = Object.freeze([
  'names-for-the-gate',
  'household-of-one',
  'debt-that-drinks',
  'charity-cot',
  'names-under-lime',
  'lesson-under-the-wrap'
]);

export const SOUTH_MEASURE_WATER_PLAN_FLAGS = Object.freeze([
  'south-measure-plan-monitored-flow',
  'south-measure-plan-morrow-import',
  'south-measure-plan-isolated-loop',
  'south-measure-plan-feed-closed'
]);

export const SOUTH_MEASURE_WATER_STATE_FLAGS = Object.freeze([
  'south-measure-water-full',
  'south-measure-water-rationed',
  'south-measure-water-reduced',
  'south-measure-water-emergency'
]);

export const SOUTH_MEASURE_GOVERNANCE_FLAGS = Object.freeze([
  'south-measure-compact',
  'south-measure-morrow',
  'south-measure-resident',
  'south-measure-sealed'
]);

export const SOUTH_MEASURE_ROLL_FLAGS = Object.freeze([
  'measure-roll-resident',
  'measure-roll-compact',
  'measure-roll-supervised-copy',
  'measure-roll-morrow-copy',
  'measure-roll-sealed',
  'measure-roll-destroyed'
]);

export const SOUTH_MEASURE_NEL_FLAGS = Object.freeze([
  'nel-school-alone',
  'nel-stays-one-season',
  'nel-family-review',
  'nel-family-forged'
]);

export const SOUTH_MEASURE_CHARITY_FLAGS = Object.freeze([
  'charity-stock-sorted',
  'charity-council',
  'charity-compact',
  'charity-burned'
]);

export const SOUTH_MEASURE_HIDDEN_ROLL_FLAGS = Object.freeze([
  'hidden-roll-private',
  'hidden-roll-public',
  'hidden-roll-compact',
  'hidden-roll-morrow'
]);

export const SOUTH_MEASURE_LEDGER_FLAGS = Object.freeze([
  'morrow-ledger-untouched',
  'morrow-ledger-revised',
  'morrow-ledger-voided',
  'morrow-ledger-concealed'
]);

export const SOUTH_MEASURE_TARN_FLAGS = Object.freeze([
  'tarn-shared-road',
  'tarn-independent-scout',
  'tarn-reliquary-report',
  'tarn-camp-watch'
]);

export const SOUTH_MEASURE_INTAKE_FLAGS = Object.freeze([
  'intake-clerk-contained',
  'intake-clerk-tarn-sealed',
  'intake-clerk-compact',
  'intake-clerk-killed',
  'intake-clerk-burned',
  'intake-clerk-resealed'
]);

export const SOUTH_MEASURE_ITEM_IDS = Object.freeze({
  originalRoll: 'south-measure-original-roll',
  pumpLedger: 'south-measure-pump-ledger',
  charityCards: 'south-measure-charity-cards',
  certifiedAbstract: 'south-measure-certified-abstract'
});

export const SOUTH_MEASURE_ITEMS = Object.freeze([
  {
    id: SOUTH_MEASURE_ITEM_IDS.originalRoll,
    name: 'Original Household Roll',
    type: 'quest', rarity: 'rare', weight: 0.8, groundModel: 'paper',
    description: 'Lime-stiff household pages from the first admission office. Each water share is bound to burial and placement records, with denial orders written in the same hand.'
  },
  {
    id: SOUTH_MEASURE_ITEM_IDS.pumpLedger,
    name: 'Morrow Pump Ledger',
    type: 'quest', rarity: 'uncommon', weight: 0.9, groundModel: 'paper',
    description: 'The freight-house surety ledger. Several burial debts use copied hand marks, while the medicine deliveries remain genuine.'
  },
  {
    id: SOUTH_MEASURE_ITEM_IDS.charityCards,
    name: 'Charity Stock Cards',
    type: 'quest', rarity: 'uncommon', weight: 0.2, groundModel: 'paper',
    description: 'Scorched cards from the charity medicine stock. Single suppressant doses vanish beneath legitimate fever-vial issues.'
  },
  {
    id: SOUTH_MEASURE_ITEM_IDS.certifiedAbstract,
    name: 'Certified Water Abstract',
    type: 'quest', rarity: 'uncommon', weight: 0.2, groundModel: 'paper',
    description: 'Susanna Fontana’s signed abstract of the water settlement. It records the operating flow and pump custody. Roll access is entered separately without private household names.'
  }
]);

export const SOUTH_MEASURE_QUESTS = Object.freeze([
  {
    id: 'names-for-the-gate', title: 'Names for the Gate', initialStage: 'reach-water-court',
    objectives: [
      { text: 'Speak with Susanna Fontana at the water court.', stage: 'reach-water-court' },
      { text: 'Inspect the throttled condenser with Noa Faber.', stage: 'inspect-throttled-flow' },
      { text: 'Hear the Compact, Morrow, resident, and Cassian proposals.', stage: 'hear-terms' },
      { text: 'Trace the buried pulse through the closed work areas.', stage: 'trace-buried-pulse' },
      { text: 'Resolve the Intake Clerk beneath the water court.', stage: 'resolve-intake-clerk' },
      { text: 'Choose how South Measure will move water.', stage: 'choose-water-plan' },
      { text: 'Decide who controls the pump.', stage: 'decide-pump-control' },
      { text: 'Decide custody of the original household roll.', stage: 'decide-roll-custody' },
      { text: 'Settle Noa Faber’s departure.', stage: 'settle-nel' },
      { text: 'Settle Brother Cassian’s departure.', stage: 'settle-tarn' },
      { text: 'Call the north-gate assembly.', stage: 'north-gate-assembly' },
      { text: 'Walk the opened north lane.', stage: 'depart-north' },
      { text: 'Cross the opened north chain.', stage: 'complete' }
    ],
    stages: [
      { id: 'reach-water-court', task: 'Speak with Susanna Fontana at the water court', xp: 0, description: 'South Measure’s water queue blocks the northern wagon lane. Noa throttled the condenser after a buried pulse reached the taps.' },
      { id: 'inspect-throttled-flow', task: 'Inspect the throttled condenser with Noa Faber', xp: 0, description: 'The machine can carry more water. Noa wants the pulse beneath it understood before anyone opens the feed.' },
      { id: 'hear-terms', task: 'Hear every water proposal', xp: 0, description: 'The Compact, the Morrow Chain, resident mechanics, and Brother Cassian offer different ways to manage the buried signal and the short water line.' },
      { id: 'trace-buried-pulse', task: 'Trace the buried pulse', xp: 0, description: 'The clinic monitor, freight routes, relief drain, and intake undercroft each reveal part of the water decision.' },
      { id: 'resolve-intake-clerk', task: 'Resolve the Intake Clerk', xp: 0, description: 'The body beneath the admission booth answers the Hallowfen rhythm through the old feed.' },
      { id: 'choose-water-plan', task: 'Choose the water operating plan', xp: 0, description: 'South Measure can accept monitored full flow, imported rations, an isolated local loop, or emergency closure.' },
      { id: 'decide-pump-control', task: 'Decide who controls the pump', xp: 0, description: 'The operating plan leaves the pump keys and maintenance burden unresolved. Outside claims still wait at the council table.' },
      { id: 'decide-roll-custody', task: 'Decide custody of the original roll', xp: 0, description: 'The household roll can protect water rights, expose private residents, or preserve old debts.' },
      { id: 'settle-nel', task: 'Settle Noa Faber’s departure', xp: 0, description: 'Noa has a northern school place. Her family’s status determines whether she can use it.' },
      { id: 'settle-tarn', task: 'Settle Brother Cassian’s departure', xp: 0, description: 'Cassian heard an answer through the intake pipe. Decide where he carries that warning.' },
      { id: 'north-gate-assembly', task: 'Call the north-gate assembly', xp: 0, description: 'South Measure must hear the water settlement and any unresolved danger before the chain rises.' },
      { id: 'depart-north', task: 'Walk the opened north lane', xp: 0, description: 'The chain is raised. Susanna’s signed water abstract will carry the settlement beyond South Measure.' },
      { id: 'complete', task: 'Continue north from South Measure', xp: 75, description: 'South Measure has named its water terms and opened the north chain.' }
    ]
  },
  {
    id: 'household-of-one', title: 'Household of One', initialStage: 'hear-family',
    objectives: [
      { text: 'Ask the Faber household about Noa’s school place.', stage: 'hear-family' },
      { text: 'Learn what the placement office will accept.', stage: 'review-record' },
      { text: 'Decide how Noa leaves South Measure.', stage: 'complete' }
    ],
    stages: [
      { id: 'hear-family', task: 'Ask the Faber household about Noa', xp: 0, description: 'Noa Faber has earned a northern machine-school place. The form counts her as a household of one.' },
      { id: 'review-record', task: 'Review Noa’s family record', xp: 0, description: 'Noa can take the place alone or delay one season. A family review offers a lawful route for Isaac and Tobit; a forged household page offers another.' },
      { id: 'complete', task: 'Noa’s departure is settled', xp: 20, description: 'Noa’s school route now reflects the family decision made at South Measure.' }
    ]
  },
  {
    id: 'debt-that-drinks', title: 'The Debt That Drinks', initialStage: 'find-ledger',
    objectives: [
      { text: 'Find the Morrow surety ledger.', stage: 'find-ledger' },
      { text: 'Compare the false debt with resident testimony.', stage: 'audit-ledger' },
      { text: 'Decide what survives in the ledger.', stage: 'complete' }
    ],
    stages: [
      { id: 'find-ledger', task: 'Find the freight-house surety ledger', xp: 0, description: 'Morrow burial charges may contain copied household marks.' },
      { id: 'audit-ledger', task: 'Audit the disputed entries', xp: 0, description: 'The false sureties can be revised, voided, concealed, or left untouched beside genuine medicine routes.' },
      { id: 'complete', task: 'The surety ledger is settled', xp: 25, description: 'The debt record now carries the consequence chosen in the freight house.' }
    ]
  },
  {
    id: 'charity-cot', title: 'The Charity Cot', initialStage: 'inspect-stock',
    objectives: [
      { text: 'Inspect the burned charity stock.', stage: 'inspect-stock' },
      { text: 'Trace the missing suppressant doses.', stage: 'trace-doses' },
      { text: 'Decide the fate of the mixed medicine stock.', stage: 'complete' }
    ],
    stages: [
      { id: 'inspect-stock', task: 'Inspect the charity stock', xp: 0, description: 'Useful medicine, copied labels, and missing suppressants share one cellar.' },
      { id: 'trace-doses', task: 'Trace the missing doses', xp: 0, description: 'Joanna wants the stock separated before fear or faction custody destroys it.' },
      { id: 'complete', task: 'The charity stock is settled', xp: 25, description: 'The cellar medicine now follows the custody decision made beside the charity cot.' }
    ]
  },
  {
    id: 'names-under-lime', title: 'Names Under Lime', initialStage: 'find-roll',
    objectives: [
      { text: 'Recover the original household roll.', stage: 'find-roll' },
      { text: 'Ask Hidden Rows what its names would expose.', stage: 'seek-consent' },
      { text: 'Decide access to the private names.', stage: 'complete' }
    ],
    stages: [
      { id: 'find-roll', task: 'Recover the original household roll', xp: 0, description: 'The undercroft roll joins water rights to denials, burial records, and old debt.' },
      { id: 'seek-consent', task: 'Seek consent in Hidden Rows', xp: 0, description: 'The roll proves residence, but a public copy would expose people who chose a hidden door.' },
      { id: 'complete', task: 'Access to the hidden names is settled', xp: 25, description: 'The private household names now follow the access decision made at South Measure.' }
    ]
  },
  {
    id: 'lesson-under-the-wrap', title: 'Lesson Under the Wrap', initialStage: 'notice-lessons',
    unlockedBy: { flag: 'neri-investigation-started' },
    objectives: [
      { text: 'Investigate the strange lesson slips.', stage: 'notice-lessons' },
      { text: 'Gather evidence around Salome Naso.', stage: 'gather-evidence' },
      { text: 'Confront Salome or leave her work undiscovered.', stage: 'complete' }
    ],
    stages: [
      { id: 'notice-lessons', task: 'Investigate the lesson slips', xp: 0, description: 'Someone is teaching rejected adults to treat a second voice as comfort.' },
      { id: 'gather-evidence', task: 'Gather evidence around Salome Naso', xp: 0, description: 'Copied labels, missing suppressants, named recruits, and a Host sign can expose the person beneath the ordinary trader’s manner.' },
      { id: 'complete', task: 'Salome Naso’s influence is settled', xp: 30, description: 'Salome’s covert work now follows the outcome chosen, or missed, before the assembly.' }
    ]
  }
]);
