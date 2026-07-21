function inspect(id, name, selector, log, logVariants = []) {
  return Object.freeze({ id, name, selector: Object.freeze(selector), log, logVariants: Object.freeze(logVariants) });
}

function variant(flag, log) {
  return Object.freeze({ conditions: Object.freeze({ flag }), log });
}

export const ASH_ROAD_SOUTH_INSPECTIONS = Object.freeze([
  inspect(
    'ash-road-south-arrival-picket',
    'Arrival Picket Tools',
    { id: 'ash-road-south-arrival-picket' },
    'A split awl, sail thread, and three flattened rivets lie in order. The smallest needle is tied to the rack with cup cord.'
  ),
  inspect(
    'ash-road-south-arrival-board',
    'Arrival Count Board',
    { id: 'ash-road-south-arrival-board' },
    'Nine cup tags hang under Fire Seven. Two hooks are empty, but their chalk marks are fresh.',
    [
      variant('south-measure-resident', 'A resident seal covers the old claim column. Cup counts remain grouped by fire and household.'),
      variant('south-measure-compact', 'Compact blood card numbers now sit beside each cup count. Four entries have no matching card.'),
      variant('south-measure-morrow', 'Morrow freight marks divide the board into paid carriage, debt carriage, and no carriage.'),
      variant('south-measure-sealed', 'The cup tags remain, but a black cord closes the issue rail. No new household marks have been added.')
    ]
  ),
  inspect(
    'ash-road-south-receiving-shelter-west',
    'Patched Receiving Shelter',
    { kind: 'south-measure-receiving-shelter', x: 22, y: 67 },
    'Three seams use waxed sail thread. The fourth is closed with stripped copper wire and a square cut from a grain sack.'
  ),
  inspect(
    'ash-road-south-arrival-pallet-west',
    'Arrival Sleeping Pallet',
    { kind: 'south-measure-sleeping-pallet', x: 16, y: 69 },
    'Two blanket rolls share one dry board. A child has lined the outer edge with round wheel nails.'
  ),
  inspect(
    'ash-road-south-arrival-water-point',
    'Arrival Water Stand',
    { id: 'ash-road-south-arrival-water-point' },
    'The spout cloth has been boiled pale. Eleven cup scratches cross the stand, followed by a deeper mark for the cooking pot.'
  ),

  inspect(
    'ash-road-south-water-condenser',
    'Condenser Housing',
    { id: 'ash-road-south-water-condenser' },
    'The governor stop is wired below full travel. Bearing grease is clean, and the cut wire was replaced by hand.',
    [
      variant('south-measure-water-full', 'The governor reaches full travel. Fresh chalk beside the north feed records every pressure knock.'),
      variant('south-measure-water-rationed', 'The governor stops at ration travel. Morrow service times are written beside each bearing cup.'),
      variant('south-measure-water-reduced', 'A narrow bypass carries the resident loop. The north feed remains clamped above the first pressure mark.'),
      variant('south-measure-water-emergency', 'The drive belt hangs loose from the wheel. Only the hand pump line remains under pressure.')
    ]
  ),
  inspect(
    'ash-road-south-settling-tank-west',
    'West Settling Vat',
    { id: 'ash-road-south-settling-tank-west' },
    'Grey scale reaches a hand above the drain. Someone scraped one clean stripe to judge how quickly it returns.'
  ),
  inspect(
    'ash-road-south-public-taps-west',
    'West Public Tap',
    { id: 'ash-road-south-public-taps-west' },
    'The handle pin is newer than the stand. Blue cloth wraps the cup hook so bare iron never touches a drinking rim.'
  ),
  inspect(
    'ash-road-south-ration-board',
    'Water Ration Board',
    { id: 'ash-road-south-ration-board' },
    'The board lists household cups, animal water, and boiler loss. Boiler loss has been corrected upward twice.',
    [
      variant('south-measure-water-full', 'Every household row carries a full cup mark. The boiler loss column is still watched in red chalk.'),
      variant('south-measure-water-rationed', 'Freight and household issues alternate by bell. Animal water is cut after the second line.'),
      variant('south-measure-water-reduced', 'Hidden Rows and the oldest households share the narrow local loop. Arrival fires remain on hand pump issue.'),
      variant('south-measure-water-emergency', 'All fixed taps are crossed out. Hand pump turns are counted beside each fire number.')
    ]
  ),
  inspect(
    'ash-road-south-water-issue-stall',
    'Pump Key Stall',
    { id: 'ash-road-south-water-issue-stall' },
    'Four key outlines are painted on the shelf. Only two hooks carry keys, and both cords have been recently retied.',
    [
      variant('south-measure-resident', 'All pump keys hang on resident cord. Repair shifts are written directly on the shelf board.'),
      variant('south-measure-compact', 'One key sits inside a sealed clinical sleeve. A blood card number replaces the usual shift mark.'),
      variant('south-measure-morrow', 'A brass freight tag hangs from the service key. Its debt line begins before the first repair shift.'),
      variant('south-measure-sealed', 'The key hooks are empty. A wire seal joins the two cabinet doors through their old cord holes.')
    ]
  ),

  inspect(
    'ash-road-south-wagon-service-hoist',
    'Wagon Service Hoist',
    { id: 'ash-road-south-wagon-service-hoist' },
    'The chain links nearest the hook are polished flat. A second strap is knotted around the brake because the ratchet misses one tooth.'
  ),
  inspect(
    'ash-road-south-wagon-service-tools',
    'Wagon Service Rack',
    { id: 'ash-road-south-wagon-service-tools' },
    'Axle drifts are sorted by wagon width. One bent drift has a wet floor warning cut into its handle.'
  ),
  inspect(
    'ash-road-south-yard-scale',
    'Freight Yard Scale',
    { id: 'ash-road-south-yard-scale' },
    'A plumb scratch shows where the needle rests on a dry floor. Today it hangs one division light.',
    [
      variant('morrow-ledger-revised', 'Revised surety numbers are chalked beside the scale correction. The false burial weight is gone.'),
      variant('morrow-ledger-voided', 'A broad void mark covers the surety conversion table. Cargo weights remain legible beneath it.'),
      variant('morrow-ledger-concealed', 'The correction table is intact, but its burial column has been rubbed with grease and ash.')
    ]
  ),
  inspect(
    'ash-road-south-medicine-cart',
    'Medicine Dispatch Cart',
    { id: 'ash-road-south-medicine-cart' },
    'Blue cords mark cooled cases. One empty bracket was built for a suppressant box twice the size of the cases here.',
    [
      variant('charity-stock-sorted', 'Clean medicine cases carry new batch ties. Copied labels sit sealed in a shallow evidence tray.'),
      variant('charity-council', 'The resident council seal joins the two largest cases. Issue remains possible without opening the suspect tray.'),
      variant('charity-compact', 'Compact custody wire closes the cooled cases. A narrow issue slot remains open for ordinary dressings.'),
      variant('charity-burned', 'Soot fills the empty case brackets. Only boiled dressings and sealed saline remain on the cart.')
    ]
  ),
  inspect(
    'ash-road-south-animal-trough',
    'Freight Animal Trough',
    { id: 'ash-road-south-animal-trough' },
    'Mule teeth have worn the near rim smooth. A smaller drinking notch is tied off with red cord for the camp goats.'
  ),

  inspect(
    'ash-road-south-screening-stage-01',
    'Records Screening Frame',
    { id: 'ash-road-south-screening-stage-01' },
    'Old card clips remain in height order. The lowest clip holds a thumbprint sheet instead of a name line.'
  ),
  inspect(
    'ash-road-south-screening-stage-09',
    'Weighing Screening Frame',
    { id: 'ash-road-south-screening-stage-09' },
    'Cord loops measure packs before the platform scale. Two loops have been shortened for children carrying household loads.'
  ),
  inspect(
    'ash-road-south-old-gate-scale',
    'Old Gate Scale',
    { id: 'ash-road-south-old-gate-scale' },
    'Claim weight and body weight share one brass face. The older household column is almost worn away.',
    [
      variant('measure-roll-resident', 'A resident custody seal covers the old household conversion. Water rights are copied on a separate card.'),
      variant('measure-roll-compact', 'Compact card numbers replace household names beside the body weight column.'),
      variant('measure-roll-morrow-copy', 'The Morrow copy lists debt weight only. The household column has been cut from the posted sheet.'),
      variant('measure-roll-sealed', 'The household column is covered by a nailed board. A certified water abstract hangs beside it.'),
      variant('measure-roll-destroyed', 'Fresh ash lies in the scale pan. The old household conversion has been scraped off the brass face.')
    ]
  ),
  inspect(
    'ash-road-south-public-water-board',
    'Old Gate Water Board',
    { id: 'ash-road-south-public-water-board' },
    'The public copy uses cup marks instead of names. Several old marks have been cut deeper so rain cannot take them.',
    [
      variant('south-measure-water-full', 'Full issue marks fill both gate rows. Arrival fires are counted beside established households.'),
      variant('south-measure-water-rationed', 'Every second issue mark carries a freight bell time. Late arrivals remain on the lower row.'),
      variant('south-measure-water-reduced', 'Only the local loop households carry fixed marks. Hand pump turns are listed below in chalk.'),
      variant('south-measure-water-emergency', 'A single hand pump roster covers the board. Fixed tap rows have been washed blank.')
    ]
  ),
  inspect(
    'ash-road-south-return-shelf',
    'Old Gate Return Shelf',
    { id: 'ash-road-south-return-shelf' },
    'Boot plates, cup handles, and three sealed papers occupy separate trays. Nothing here is priced until its old mark is found.',
    [
      variant('south-measure-resident', 'Resident clerks have opened a repair tray beside the claims. Useful metal returns to households before sale.'),
      variant('south-measure-compact', 'Clinical tags separate washed cloth from ordinary returns. The claims tray remains under the old lock.'),
      variant('south-measure-morrow', 'Freight prices cover the old claim marks. Unpriced household goods have been moved to the bottom shelf.'),
      variant('south-measure-sealed', 'The paper tray is wired shut. Boots and cup handles remain available without claim records.')
    ]
  ),

  inspect(
    'ash-road-south-compact-queue-board',
    'Compact Queue Board',
    { id: 'ash-road-south-compact-queue-board' },
    'Blood cards are grouped by cough, fever, and visible change. A fourth row is labeled for dependents without cards.',
    [
      variant('south-measure-compact', 'Pump access numbers now sit beside the clinical rows. Resident repair shifts are absent from this copy.'),
      variant('south-measure-resident', 'The board retains clinical order only. Pump keys and water terms remain on the resident board.'),
      variant('south-measure-morrow', 'Freight fitness marks have been added in a narrow right column. They do not match clinical priority.'),
      variant('south-measure-sealed', 'The intake rows are crossed out. Emergency dressings remain listed for issue without screening.')
    ]
  ),
  inspect(
    'ash-road-south-dependent-awning',
    'Dependent Waiting Awning',
    { id: 'ash-road-south-dependent-awning' },
    'The low rail carries six hand loops at child height. One loop has been replaced with a strip from an adult blood card sleeve.'
  ),
  inspect(
    'ash-road-south-compact-waiting-cot',
    'Compact Waiting Cot',
    { kind: 'charity-cot', x: 85, y: 24 },
    'A clean sheet covers a straw depression shaped by one long wait. The discharge card beneath the pillow has no destination box.'
  ),
  inspect(
    'ash-road-south-compact-clean-vessels',
    'Compact Clean Vessels',
    { id: 'ash-road-south-compact-clean-vessels' },
    'Each jar has a boiled cloth cap and a separate blood card number. The drinking cup is chained outside the clean tray.'
  ),
  inspect(
    'ash-road-south-clinic-pump',
    'Clinic Hand Pump',
    { id: 'ash-road-south-clinic-pump' },
    'The pump handle is wrapped for gloved hands. A measured drain channel carries the first cloudy water away from the wash stand.'
  ),

  inspect(
    'ash-road-south-rope-row-laundry-west',
    'Rope Row Laundry Line',
    { kind: 'laundry-line', x: 84, y: 44 },
    'Household cloth hangs inside the line. Clinic wraps occupy the windy end, each fixed with two pegs instead of one.'
  ),
  inspect(
    'ash-road-south-rope-row-oven-west',
    'Shared Row Oven',
    { kind: 'shared-oven', x: 89, y: 46 },
    'Six family marks circle the door. A seventh mark was cut into the ash lip and never given a hook.'
  ),
  inspect(
    'ash-road-south-measure-hall-board',
    'Measure Hall Public Board',
    { id: 'ash-road-south-measure-hall-board' },
    'Water turns, oven repairs, and burial cloth share the same slate. Empty custody shifts occupy a narrow column at the edge.',
    [
      variant('measure-roll-resident', 'The household roll remains under resident custody. Certified water terms fill the top slate row.'),
      variant('measure-roll-compact', 'A Compact receipt replaces the original roll notice. Water terms remain in resident handwriting below it.'),
      variant('measure-roll-supervised-copy', 'Copy hours and witness pairs are posted beside the water terms. No page leaves without two marks.'),
      variant('measure-roll-morrow-copy', 'A debt limited copy is recorded as removed. The resident water abstract remains posted.'),
      variant('measure-roll-sealed', 'The original roll is listed as sealed below. Only the certified water abstract is available upstairs.'),
      variant('measure-roll-destroyed', 'The original roll line is blackened with lamp soot. The certified water abstract remains legible.')
    ]
  ),
  inspect(
    'ash-road-south-charity-service-counter',
    'Charity Service Counter',
    { id: 'ash-road-south-charity-service-counter' },
    'Boiled linen sits above ordinary cloth. Missing suppressant cards have left four clean rectangles in the dust.',
    [
      variant('charity-stock-sorted', 'Useful medicine and copied stock occupy separate trays. The missing card spaces are circled for review.'),
      variant('charity-council', 'A resident seal closes the suspect tray. Boiled linen and ordinary dressings remain open for issue.'),
      variant('charity-compact', 'Compact wire closes both medicine trays. Linen remains under charity custody.'),
      variant('charity-burned', 'The medicine trays are empty and smoke stained. Boiled linen fills the cleared shelf.')
    ]
  ),
  inspect(
    'ash-road-south-charity-linen-rack',
    'Charity Linen Rack',
    { id: 'ash-road-south-charity-linen-rack' },
    'Narrow wraps are rolled by limb size. Two broad chest bindings have been patched with receiving canvas.',
    [
      variant('charity-stock-sorted', 'Clean wraps carry new boil marks. Suspect cloth is sealed in a shallow lower bin.'),
      variant('charity-burned', 'Only newly boiled wraps remain. The lower bin smells of wet ash and lye.')
    ]
  )
]);

export function applyAshRoadSouthInspections(objects) {
  for (const spec of ASH_ROAD_SOUTH_INSPECTIONS) {
    const target = spec.selector.id
      ? objects.find((object) => object.id === spec.selector.id)
      : objects.find((object) =>
          object.kind === spec.selector.kind && object.x === spec.selector.x && object.y === spec.selector.y
        );
    if (!target) throw new Error(`Inspection ${spec.id} has no matching surface object.`);
    if (target.interact) throw new Error(`Inspection ${spec.id} would replace an existing interaction.`);
    target.id = spec.id;
    target.name = spec.name;
    target.interact = {
      type: 'note',
      log: spec.log,
      ...(spec.logVariants.length > 0
        ? { logVariants: spec.logVariants.map((entry) => ({ conditions: { ...entry.conditions }, log: entry.log })) }
        : {})
    };
  }
}
