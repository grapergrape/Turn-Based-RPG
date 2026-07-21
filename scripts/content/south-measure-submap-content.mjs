// Neutral player-facing copy for the nine South Measure helper maps.
// Runtime generators supply coordinates, render kinds, access rules, and paths.

export const SOUTH_MEASURE_SUBMAP_CONTENT = Object.freeze({
  'south-measure-intake-undercroft': Object.freeze({
    id: 'south-measure-intake-undercroft',
    name: 'South Measure Intake Undercroft',
    intro: 'Old lime covers the intake walls. Handprints show through where the pipes shake.',
    inspectables: Object.freeze({
      'undercroft-records-landing-rails': Object.freeze({
        name: 'Intake Rails',
        log: 'Iron rails divide the landing into household lines. Their brass direction plates still send one line toward examination and another back outside.'
      }),
      'undercroft-brass-number-hooks': Object.freeze({
        name: 'Brass Number Hooks',
        log: 'Each empty hook carries an intake number. Several match addresses still used in Rope Rows.',
        mapMarker: Object.freeze({ label: 'Number Hooks', kind: 'note' })
      }),
      'undercroft-lime-handprints': Object.freeze({
        name: 'Handprints Under Lime',
        log: 'Old palms show beneath the lime at shoulder height. The last coat was laid over them without filling the finger marks.'
      }),
      'undercroft-examination-order': Object.freeze({
        name: 'Last Examination Order',
        log: 'The final relief order sends sample cases out first. Civilian transport does not appear in the departure column.',
        mapMarker: Object.freeze({ label: 'Relief Order', kind: 'note' })
      }),
      'undercroft-restraint-drain': Object.freeze({
        name: 'Examination Drain',
        log: 'Leather polish marks the floor beside the drain. The buckles were worked often enough to wear clean arcs into the stone.'
      }),
      'undercroft-privacy-screens': Object.freeze({
        name: 'Broken Privacy Screens',
        log: 'Split screens still divide the examination floor. Old blood-card clips remain fixed to their inner faces.'
      }),
      'undercroft-filter-cabinet': Object.freeze({
        name: 'Intake Supply Cabinet',
        log: 'Blank blood cards and folded filter cloth remain inside. Compact indexing marks cross the older relief labels.'
      }),
      'undercroft-records-vault-door': Object.freeze({
        name: 'Archive Door',
        log: 'A heavy plate door seals the records vault. Lime dust packs the sill, but the hinges still carry weight.',
        mapMarker: Object.freeze({ label: 'Records Vault', kind: 'locked' })
      }),
      'undercroft-compact-copy-marks': Object.freeze({
        name: 'Compact Copy Marks',
        log: 'Compact page marks cut through selected entries. The original bindings never left the lime vault.'
      }),
      'undercroft-original-household-roll': Object.freeze({
        name: 'Original Household Roll',
        log: 'Names, kin, work, and exposure decisions share each line. Later hands added deaths beside transports that never arrived.',
        mapMarker: Object.freeze({ label: 'Household Roll', kind: 'quest' })
      }),
      'undercroft-isolation-manifold': Object.freeze({
        name: 'Isolation Manifold',
        log: 'The manifold can separate the north feed from the relief return. Its sound collar trembles only when the buried pulse reaches it.',
        mapMarker: Object.freeze({ label: 'Isolation Manifold', kind: 'quest' })
      }),
      'undercroft-settling-feed-controls': Object.freeze({
        name: 'Settling Feed Controls',
        log: 'The old controls still divide clean feed from waste return. One lever trembles in time with the condenser above.'
      }),
      'undercroft-pump-work-platform': Object.freeze({
        name: 'Pump Work Platform',
        log: 'A grated platform leaves safe reach around the isolation manifold. Chalk marks show the valve order Noa Faber uses above.'
      }),
      'undercroft-pipe-vein': Object.freeze({
        name: 'Vein Under the Pipe Skin',
        log: 'A thin black-gold vein lies beneath the pipe skin. It follows the metal north without breaking through.',
        mapMarker: Object.freeze({ label: 'Buried Vein', kind: 'search' })
      }),
      'undercroft-intake-clerk': Object.freeze({
        name: 'Intake Clerk',
        log: 'One rotted sleeve remains caught in the wicket. Fused hands close around a bone stamp while the opened ribs shape a dry denial.',
        mapMarker: Object.freeze({ label: 'Sealed Wicket', kind: 'danger' })
      }),
      'undercroft-return-passage': Object.freeze({
        name: 'Narrow Return Passage',
        log: 'A barred passage joins the vault side to the pump side. The frame cannot move while the wicket braces remain under strain.',
        mapMarker: Object.freeze({ label: 'Return Passage', kind: 'locked' })
      })
    }),
    connectors: Object.freeze({
      'south-measure-civil-stair': Object.freeze({
        title: 'Civil Stair',
        entryLine: 'Stone steps rise toward the admission booth and the old measure gates.',
        travelLabel: 'Climb to the admission booth',
        travelLog: 'You climb from the undercroft to the old measure gates.',
        reverseEntryLine: 'The civil stair drops beneath the admission booth toward the lime-lined records landing.',
        reverseTravelLabel: 'Descend into the intake undercroft',
        reverseTravelLog: 'You descend from the old measure gates into the intake undercroft.',
        stayLabel: 'Stay below',
        stayLog: 'You leave the civil stair behind.',
        reverseStayLabel: 'Stay by the admission booth',
        reverseStayLog: 'You step back from the civil stair.'
      }),
      'south-measure-drain-valve': Object.freeze({
        title: 'Maintenance Channel',
        entryLine: 'The east channel narrows toward the relief drain. Polluted water moves beyond the valve frame.',
        travelLabel: 'Enter the relief drain',
        travelLog: 'You follow the maintenance channel into the relief drain.',
        reverseEntryLine: 'The northern valve frame opens from the relief drain into the undercroft maintenance channel.',
        reverseTravelLabel: 'Enter the intake undercroft',
        reverseTravelLog: 'You pass the valve frame and enter the intake undercroft.',
        stayLabel: 'Remain in the undercroft',
        stayLog: 'You step back from the drain channel.',
        reverseStayLabel: 'Remain in the relief drain',
        reverseStayLog: 'You step back from the valve frame.'
      })
    })
  }),

  'south-measure-relief-drain': Object.freeze({
    id: 'south-measure-relief-drain',
    name: 'South Measure Relief Drain',
    intro: 'A shallow grey flow moves below the maintenance walk. Every pipe joint carries the condenser\'s pulse.',
    inspectables: Object.freeze({
      'relief-drain-raised-walk': Object.freeze({
        name: 'Raised Maintenance Walk',
        log: 'Narrow stone treads follow the north wall above the channel. Tool scrapes show where workers still use the route.'
      }),
      'relief-drain-polluted-flow': Object.freeze({
        name: 'Polluted Flow',
        log: 'Grey water carries metal dust toward the charity edge. The silt darkens after each pressure knock.'
      }),
      'relief-drain-broken-filter-baskets': Object.freeze({
        name: 'Broken Filter Baskets',
        log: 'Split wicker and corroded mesh lie against the channel lip. None of the baskets can hold another load.'
      }),
      'relief-drain-jammed-isolation-wheel': Object.freeze({
        name: 'Jammed Isolation Wheel',
        log: 'The wheel has stopped between open and shut. Its hub answers every nineteen counts, then rests for six.',
        mapMarker: Object.freeze({ label: 'Isolation Wheel', kind: 'quest' })
      }),
      'relief-drain-waiting-alcove': Object.freeze({
        name: 'Maintenance Alcove',
        log: 'Dry cloth scraps and a cracked water cup sit above the flood line. Someone kept this corner ready for frightened children.',
        mapMarker: Object.freeze({ label: 'Waiting Alcove', kind: 'note' })
      }),
      'relief-drain-childrens-crawl-marks': Object.freeze({
        name: 'Crawl Marks',
        log: 'Small palms have cleared the silt from one wall. A chalk arrow points back toward the culvert.'
      }),
      'relief-drain-trench-work-signs': Object.freeze({
        name: 'Trench Work Signs',
        log: 'Fresh boot cuts and drive oil mark the branch beneath the Morrow yard. Workers still cross here during repair shifts.'
      })
    }),
    connectors: Object.freeze({
      'south-measure-collapsed-culvert': Object.freeze({
        title: 'Collapsed Culvert',
        entryLine: 'Daylight reaches the eastern mouth through fallen stone and packed ash.',
        travelLabel: 'Climb to the charity edge',
        travelLog: 'You crawl through the culvert and rise beside the charity cots.',
        reverseEntryLine: 'A cleared gap in the fallen stone descends from the charity edge into the eastern relief drain.',
        reverseTravelLabel: 'Crawl into the relief drain',
        reverseTravelLog: 'You crawl through the culvert and enter the relief drain.',
        stayLabel: 'Stay in the drain',
        stayLog: 'You leave the culvert mouth undisturbed.',
        reverseStayLabel: 'Stay by the charity cots',
        reverseStayLog: 'You step back from the broken culvert.'
      }),
      'south-measure-morrow-trench': Object.freeze({
        title: 'Morrow Repair Trench',
        entryLine: 'A service ladder rises into the medicine-cart side of the freight yard.',
        travelLabel: 'Climb into the freight yard',
        travelLog: 'You climb from the drain into the Morrow repair trench.',
        reverseEntryLine: 'The repair trench drops beside the medicine-cart lane into the buried service channel.',
        reverseTravelLabel: 'Climb down into the relief drain',
        reverseTravelLog: 'You descend through the Morrow repair trench into the relief drain.',
        stayLabel: 'Remain below',
        stayLog: 'You step away from the yard ladder.',
        reverseStayLabel: 'Stay in the freight yard',
        reverseStayLog: 'You leave the trench ladder alone.'
      }),
      'south-measure-annex-service-hatch': Object.freeze({
        title: 'Annex Service Hatch',
        entryLine: 'A low iron hatch opens toward the relief annex apron.',
        travelLabel: 'Climb to the annex apron',
        travelLog: 'You leave the drain through the annex service hatch.',
        reverseEntryLine: 'The low hatch beside the annex apron opens into the western drain branch.',
        reverseTravelLabel: 'Descend into the relief drain',
        reverseTravelLog: 'You climb down through the annex service hatch into the relief drain.',
        stayLabel: 'Keep to the channel',
        stayLog: 'You leave the service hatch closed.',
        reverseStayLabel: 'Stay on the annex apron',
        reverseStayLog: 'You step back from the service hatch.'
      }),
      'south-measure-annex-drain-hatch': Object.freeze({
        title: 'Annex Floor Hatch',
        entryLine: 'A ladder rises through the annex floor beside the old generator pit.',
        travelLabel: 'Enter the maintenance annex',
        travelLog: 'You climb through the floor hatch into the maintenance annex.',
        reverseEntryLine: 'The floor hatch beside the old generator pit drops into the relief drain.',
        reverseTravelLabel: 'Descend into the relief drain',
        reverseTravelLog: 'You climb down through the annex floor into the relief drain.',
        stayLabel: 'Stay below',
        stayLog: 'You leave the annex ladder behind.',
        reverseStayLabel: 'Stay in the maintenance annex',
        reverseStayLog: 'You leave the floor hatch alone.'
      }),
      'south-measure-drain-valve': Object.freeze({
        title: 'Undercroft Valve Chamber',
        entryLine: 'The northern valve frame opens into the undercroft maintenance channel.',
        travelLabel: 'Enter the intake undercroft',
        travelLog: 'You pass the valve frame and enter the intake undercroft.',
        reverseEntryLine: 'The undercroft maintenance channel narrows east toward the relief drain.',
        reverseTravelLabel: 'Enter the relief drain',
        reverseTravelLog: 'You follow the maintenance channel into the relief drain.',
        stayLabel: 'Remain in the drain',
        stayLog: 'You step back from the valve chamber.',
        reverseStayLabel: 'Remain in the intake undercroft',
        reverseStayLog: 'You step back from the drain channel.'
      })
    })
  }),

  'south-measure-relief-maintenance-annex': Object.freeze({
    id: 'south-measure-relief-maintenance-annex',
    name: 'South Measure Relief Maintenance Annex',
    intro: 'The front bays smell of hot oil and filed metal. Fire opened the rear roof to ash.',
    inspectables: Object.freeze({
      'relief-annex-claim-desk': Object.freeze({
        name: 'Morrow Claim Desk',
        log: 'Current work tags share the desk with older relief issue slips. Every usable part carries two histories.'
      }),
      'relief-annex-dead-hoist': Object.freeze({
        name: 'Dead Overhead Hoist',
        log: 'The hoist chain hangs above empty cart stands. Its brake teeth are fused with old heat.'
      }),
      'relief-annex-machine-floor': Object.freeze({
        name: 'Machine Floor',
        log: 'Pump jigs and frame presses still hold recent filings. The stripped generator housings have been sorted by size.'
      }),
      'relief-annex-parts-cage': Object.freeze({
        name: 'North Parts Cage',
        log: 'Pipe collars and filter mesh sit behind a locked gate. None of it can silence the north feed from this room.',
        mapMarker: Object.freeze({ label: 'Parts Cage', kind: 'locked' })
      }),
      'relief-annex-bypass-schedule': Object.freeze({
        name: 'Relief Bypass Schedule',
        log: 'The schedule shows a hand-worked return from the settling feed to the water court. It carries less water and avoids the north line.',
        mapMarker: Object.freeze({ label: 'Bypass Schedule', kind: 'quest' })
      }),
      'relief-annex-cooling-jacket': Object.freeze({
        name: 'Generator Cooling Jacket',
        log: 'The west-room jacket still seals around a field cooler mount. Rebuilt feed lines could keep medicine cold while its wagon carries water.',
        mapMarker: Object.freeze({ label: 'Cooling Jacket', kind: 'quest' })
      }),
      'relief-annex-relief-schedules': Object.freeze({
        name: 'Abandoned Relief Schedules',
        log: 'The receiving count rises after the last convoy column goes blank. Later entries record waiting families but no departure time.',
        mapMarker: Object.freeze({ label: 'Relief Schedules', kind: 'note' })
      }),
      'relief-annex-burned-rear-bay': Object.freeze({
        name: 'Burned Rear Bay',
        log: 'Fire split the roof and buckled the far doors into their frame. The collapsed bay offers no route outside.'
      })
    }),
    connectors: Object.freeze({
      'south-measure-annex-main-door': Object.freeze({
        title: 'Annex Loading Door',
        entryLine: 'The loading doors open onto the old relief apron.',
        travelLabel: 'Step onto the annex apron',
        travelLog: 'You leave the maintenance annex through the loading bay.',
        reverseEntryLine: 'The loading doors open from the relief apron into the active front bay.',
        reverseTravelLabel: 'Enter the maintenance annex',
        reverseTravelLog: 'You cross the loading bay into the maintenance annex.',
        stayLabel: 'Stay inside',
        stayLog: 'You turn back toward the machine floor.',
        reverseStayLabel: 'Stay on the annex apron',
        reverseStayLog: 'You leave the loading doors behind.'
      }),
      'south-measure-annex-drain-hatch': Object.freeze({
        title: 'Drain Floor Hatch',
        entryLine: 'A service ladder drops beside the old generator pit into the relief drain.',
        travelLabel: 'Descend into the relief drain',
        travelLog: 'You climb down through the annex floor into the relief drain.',
        reverseEntryLine: 'A service ladder rises from the relief drain into the annex generator pit.',
        reverseTravelLabel: 'Enter the maintenance annex',
        reverseTravelLog: 'You climb through the floor hatch into the maintenance annex.',
        stayLabel: 'Leave the hatch',
        stayLog: 'You remain on the annex floor.',
        reverseStayLabel: 'Stay in the relief drain',
        reverseStayLog: 'You leave the annex ladder behind.'
      })
    })
  }),

  'south-measure-morrow-freight-house': Object.freeze({
    id: 'south-measure-morrow-freight-house',
    name: 'South Measure Morrow Freight House',
    intro: 'Freight weights, route slates, and bunk tags fill the house. Every locked cage answers to a working road.',
    inspectables: Object.freeze({
      'morrow-public-office': Object.freeze({
        name: 'Public Freight Office',
        log: 'The office counter faces the yard door. Contract copies sit where workers can hear every term read aloud.'
      }),
      'morrow-freight-scale': Object.freeze({
        name: 'Freight Scale',
        log: 'Fresh chalk weights cover older relief measures. The balance arm has been repaired often and kept honest.'
      }),
      'morrow-route-table': Object.freeze({
        name: 'Route Table',
        log: 'Stone markers hold the current road open across the table. Red Tithe warnings crowd the ford approaches.'
      }),
      'morrow-convoy-loss-board': Object.freeze({
        name: 'Convoy Loss Board',
        log: 'Paid death shares sit beside wagons that never returned. The same losses reappear later as freight charges.',
        mapMarker: Object.freeze({ label: 'Convoy Losses', kind: 'note' })
      }),
      'morrow-medicine-run-board': Object.freeze({
        name: 'Medicine Run Board',
        log: 'The next route crosses Red Tithe country at the hot part of the day. Cooler checks fill the margin.'
      }),
      'morrow-ledger-cage': Object.freeze({
        name: 'Ledger Cage',
        log: 'Pump notes and signature folios fill shelves behind the cage. The lock faces the public office.',
        mapMarker: Object.freeze({ label: 'Ledger Cage', kind: 'locked' })
      }),
      'morrow-pump-ledger': Object.freeze({
        name: 'Pump Ledger',
        log: 'Some emergency charges repeat under hands that do not match. The delivery weights and burial payments remain real.',
        mapMarker: Object.freeze({ label: 'Pump Ledger', kind: 'search' })
      }),
      'morrow-household-surety-folios': Object.freeze({
        name: 'Household Surety Folios',
        log: 'Work years pass from one household line to another when a debtor leaves. Several names appear beside signatures they could not have made.'
      }),
      'morrow-bonded-store': Object.freeze({
        name: 'Bonded Store',
        log: 'Drive oil, freight seals, and grain tags sit behind a separate lock. Every shelf is counted for road work.',
        mapMarker: Object.freeze({ label: 'Bonded Store', kind: 'locked' })
      }),
      'morrow-guard-memorial-tags': Object.freeze({
        name: 'Guard Memorial Tags',
        log: 'Worn tags name people lost keeping the route open. Grease from passing hands has darkened the wall beneath them.',
        mapMarker: Object.freeze({ label: 'Memorial Tags', kind: 'note' })
      }),
      'morrow-guard-bunks': Object.freeze({
        name: 'Guard Bunks',
        log: 'Road coats hang above narrow beds. Mended straps and family notes share the same pegs.'
      }),
      'morrow-guard-mess': Object.freeze({
        name: 'Guard Mess',
        log: 'A blackened pot rests beside route cups marked by owner. The quiet wall faces the memorial tags.'
      })
    }),
    connectors: Object.freeze({
      'south-measure-freight-main-door': Object.freeze({
        title: 'Freight House Main Door',
        entryLine: 'The public door opens beside the yard scale and medicine-cart lane.',
        travelLabel: 'Step into the freight yard',
        travelLog: 'You leave the freight house through the public office.',
        reverseEntryLine: 'The public door opens from the freight yard into the office beside the scale.',
        reverseTravelLabel: 'Enter the freight house',
        reverseTravelLog: 'You cross the public office into the Morrow freight house.',
        stayLabel: 'Stay inside',
        stayLog: 'You turn back toward the route table.',
        reverseStayLabel: 'Stay in the freight yard',
        reverseStayLog: 'You leave the public door behind.'
      }),
      'south-measure-freight-rear-door': Object.freeze({
        title: 'Rear Service Door',
        entryLine: 'The rear door opens toward the wagon repair stands.',
        travelLabel: 'Step out by the repair stands',
        travelLog: 'You leave the freight house through the rear service door.',
        reverseEntryLine: 'The rear service door opens from the repair stands into the freight house.',
        reverseTravelLabel: 'Enter the freight house',
        reverseTravelLog: 'You enter the freight house from the wagon repair stands.',
        stayLabel: 'Remain in the freight house',
        stayLog: 'You leave the rear latch alone.',
        reverseStayLabel: 'Stay by the repair stands',
        reverseStayLog: 'You step back from the rear service door.'
      })
    })
  }),

  'south-measure-compact-clinic': Object.freeze({
    id: 'south-measure-compact-clinic',
    name: 'South Measure Compact Clinic',
    intro: 'Washed canvas tightens the light around six beds. The cold cabinet keeps a steady hum behind the ward.',
    inspectables: Object.freeze({
      'compact-clinic-triage-desk': Object.freeze({
        name: 'Triage Desk',
        log: 'Dressing times and pulse counts cover the slate. The staff record treatment before placement status.'
      }),
      'compact-clinic-six-bed-ward': Object.freeze({
        name: 'Treatment Ward',
        log: 'Six narrow beds face the central aisle. Four hold current cases while two remain prepared for charity referrals.',
        mapMarker: Object.freeze({ label: 'Treatment Ward', kind: 'note' })
      }),
      'compact-clinic-applicant-lane': Object.freeze({
        name: 'Applicant Lane',
        log: 'Canvas partitions admit one applicant at a time. Dependent names remain on the forms outside the marked space.'
      }),
      'compact-clinic-placement-archive': Object.freeze({
        name: 'Placement Archive',
        log: 'The archive records workers admitted one at a time. Dependents remain in the margins beside deferred review marks.',
        mapMarker: Object.freeze({ label: 'Placement Archive', kind: 'locked' })
      }),
      'compact-clinic-blood-card-station': Object.freeze({
        name: 'Blood-Card Station',
        log: 'Current cards sit apart from inherited exposure copies. Family names link the two drawers.'
      }),
      'compact-clinic-cold-service-bay': Object.freeze({
        name: 'Cold Service Bay',
        log: 'Flow monitors share the locked bay with vaccine stock. A sealed backup cell sits against the rear rail.',
        mapMarker: Object.freeze({ label: 'Cold Service Bay', kind: 'locked' })
      }),
      'compact-clinic-flow-monitor': Object.freeze({
        name: 'Flow Monitor',
        log: 'The monitor separates ordinary pressure changes from the repeating pulse beneath the court. Its case bears a Compact custody seal.',
        mapMarker: Object.freeze({ label: 'Flow Monitor', kind: 'quest' })
      }),
      'compact-clinic-backup-cell': Object.freeze({
        name: 'Backup Cell',
        log: 'The cell carries the cold shelves during generator dips. A separate lead keeps the flow monitors alive after the lamps dim.'
      }),
      'compact-clinic-isolation-room': Object.freeze({
        name: 'Isolation Room',
        log: 'One bed stands behind a clear observation slit. Dose notes and a speaking tube remain within reach of the patient.'
      }),
      'compact-clinic-staff-wash': Object.freeze({
        name: 'Staff Wash Point',
        log: 'Boiled cloth dries beside two narrow sleep cots. The clinic staff live inside the same canvas they clean.'
      })
    }),
    connectors: Object.freeze({
      'south-measure-clinic-main-door': Object.freeze({
        title: 'Clinic Entrance',
        entryLine: 'The south entrance opens onto the Compact waiting apron.',
        travelLabel: 'Step onto the clinic apron',
        travelLog: 'You leave the clinic through public triage.',
        reverseEntryLine: 'The south entrance opens from the waiting apron into public triage.',
        reverseTravelLabel: 'Enter the Compact clinic',
        reverseTravelLog: 'You enter the Compact clinic through public triage.',
        stayLabel: 'Stay in the clinic',
        stayLog: 'You turn back toward the ward.',
        reverseStayLabel: 'Stay on the clinic apron',
        reverseStayLog: 'You leave the clinic entrance behind.'
      })
    })
  }),

  'south-measure-measure-hall': Object.freeze({
    id: 'south-measure-measure-hall',
    name: 'South Measure Hall',
    intro: 'Chalk dust hangs above the school slates. Bread heat reaches the council table from the west wall.',
    inspectables: Object.freeze({
      'measure-hall-slate-school': Object.freeze({
        name: 'Slate School',
        log: 'Washed intake cards serve as lesson slates. Household names fill the writing line before sums begin.'
      }),
      'measure-hall-council-table': Object.freeze({
        name: 'Row Council Table',
        log: 'Water appeals and oven turns share the table with household disputes. Each place carries a row mark rather than a faction seal.'
      }),
      'measure-hall-kitchen': Object.freeze({
        name: 'Communal Kitchen',
        log: 'The west oven heats a broad work counter. Bread tallies are pinned where every cook can correct them.'
      }),
      'measure-hall-current-water-roll': Object.freeze({
        name: 'Current Water Roll',
        log: 'Established households fill the cabinet. Off-roll families appear only as cup totals without names.',
        mapMarker: Object.freeze({ label: 'Current Water Roll', kind: 'note' })
      }),
      'measure-hall-burial-copies': Object.freeze({
        name: 'Burial Copies',
        log: 'The copies keep chosen names and kin. Admission status has been left out.',
        mapMarker: Object.freeze({ label: 'Burial Copies', kind: 'note' })
      }),
      'measure-hall-canvas-loft': Object.freeze({
        name: 'Last Canvas Loft',
        log: 'Sound canvas lies folded by roof size and row. Patched pieces wait beside an interior ladder.'
      }),
      'measure-hall-painted-strip': Object.freeze({
        name: 'Painted Canvas Strip',
        log: 'Old exposure paint stains one strip of canvas. The dry pigment no longer answers heat or breath.'
      }),
      'measure-hall-empty-custody-rest': Object.freeze({
        name: 'Empty Record Rest',
        log: 'Two wooden supports leave room for a bound roll. The Hall keeps no original intake archive here.'
      }),
      'measure-hall-storm-room': Object.freeze({
        name: 'Storm Room',
        log: 'The side room holds thin pallets beneath a leaking seam. New arrivals sleep here only when the weather makes the road worse.'
      })
    }),
    connectors: Object.freeze({
      'south-measure-hall-main-door': Object.freeze({
        title: 'Measure Hall Door',
        entryLine: 'The front door opens from the slate school into Rope Rows.',
        travelLabel: 'Step into Rope Rows',
        travelLog: 'You leave Measure Hall through the school door.',
        reverseEntryLine: 'The Hall door opens from Rope Rows into the bright slate school.',
        reverseTravelLabel: 'Enter Measure Hall',
        reverseTravelLog: 'You enter Measure Hall through the slate school.',
        stayLabel: 'Stay in the Hall',
        stayLog: 'You return to the school slates.',
        reverseStayLabel: 'Stay in Rope Rows',
        reverseStayLog: 'You leave the Hall door behind.'
      })
    })
  }),

  'south-measure-varo-house': Object.freeze({
    id: 'south-measure-varo-house',
    name: 'Faber House and Workshop',
    intro: 'The Faber family has fitted a home around one pump bench. Every clear surface is already in use.',
    inspectables: Object.freeze({
      'varo-house-pump-bench': Object.freeze({
        name: 'Pump Bench',
        log: 'Valve seats and worn washers lie in careful rows. The bench is built for repair work, not spare-part storage.'
      }),
      'varo-house-diagram-wall': Object.freeze({
        name: 'Diagram Wall',
        log: 'Noa Faber\'s notes correct the old pump manual wherever the actual pipes disagreed.'
      }),
      'varo-house-cup-repair-table': Object.freeze({
        name: 'Cup-Repair Table',
        log: 'Tin handles and split cup rims cover the small table. Isaac Faber has marked each repair by household.'
      }),
      'varo-house-family-table': Object.freeze({
        name: 'Family Meal Table',
        log: 'Three bowls fit around the table when the pump tools are pushed aside. One chair has been braced with pipe offcuts.'
      }),
      'varo-house-sleeping-partitions': Object.freeze({
        name: 'Sleeping Partitions',
        log: 'Two cloth partitions divide the back wall. Folded work coats serve as pillows where the roof seam drips.'
      }),
      'varo-house-rear-work-shelf': Object.freeze({
        name: 'Rear Work Shelf',
        log: 'Filed valve stops fill the shelf. Each bears a small correction from years of keeping the condenser steady.'
      }),
      'varo-house-school-tools': Object.freeze({
        name: 'Noa\'s School Tools',
        log: 'A clean gauge and wrapped drawing points sit apart from the household tools, ready to travel if Noa chooses.'
      })
    }),
    connectors: Object.freeze({
      'south-measure-varo-main-door': Object.freeze({
        title: 'Faber House Door',
        entryLine: 'The only door opens into the narrow lane beside the family workshop.',
        travelLabel: 'Step into Rope Rows',
        travelLog: 'You leave the Faber house through its only door.',
        reverseEntryLine: 'The family door opens from the narrow lane into the pump workshop.',
        reverseTravelLabel: 'Enter the Faber house',
        reverseTravelLog: 'You enter the Faber house beside the pump bench.',
        stayLabel: 'Stay inside',
        stayLog: 'You leave the latch alone.',
        reverseStayLabel: 'Stay in Rope Rows',
        reverseStayLog: 'You step back from the family door.'
      })
    })
  }),

  'south-measure-hidden-rows': Object.freeze({
    id: 'south-measure-hidden-rows',
    name: 'South Measure Hidden Rows',
    intro: 'The drying frame closes behind a shared lane. Pipe heat reaches rooms that do not appear on the public roll.',
    inspectables: Object.freeze({
      'hidden-rows-first-household-room': Object.freeze({
        name: 'First Household Room',
        log: 'Mended cups dry beside a low bed. Nothing in the room carries an intake number.'
      }),
      'hidden-rows-second-household-room': Object.freeze({
        name: 'Second Household Room',
        log: 'Work gloves hang above a child\'s slate. The wall patch hides an older service stamp.'
      }),
      'hidden-rows-third-household-room': Object.freeze({
        name: 'Third Household Room',
        log: 'A cooking pot shares its shelf with folded burial cloth. The room has been repaired for long use.'
      }),
      'hidden-rows-concealed-water-branch': Object.freeze({
        name: 'Concealed Water Branch',
        log: 'A narrow pipe feeds the rooms behind the wash wall. Its draw does not appear on the public tap board.',
        mapMarker: Object.freeze({ label: 'Hidden Water Branch', kind: 'search' })
      }),
      'hidden-rows-shared-cooking-flue': Object.freeze({
        name: 'Shared Cooking Flue',
        log: 'Three stove pipes meet inside one patched flue. The smoke leaves through an ordinary Rope Rows chimney.'
      }),
      'hidden-rows-treatment-room': Object.freeze({
        name: 'Treatment Room',
        log: 'Boiled tools and plain bandages wait beside a narrow cot. The supplies carry no clinic or freight claim.'
      }),
      'hidden-rows-meeting-table': Object.freeze({
        name: 'Household Meeting Table',
        log: 'Water cups mark places around the table. The count can be changed without exposing a name.'
      }),
      'hidden-rows-private-water-list': Object.freeze({
        name: 'Private Water List',
        log: 'The list records cups beside household names kept off the public roll. A note at the top requires consent before any copy leaves the room.',
        mapMarker: Object.freeze({ label: 'Private Water List', kind: 'note' })
      }),
      'hidden-rows-grave-passage': Object.freeze({
        name: 'Grave Passage',
        log: 'The rear passage is narrow enough for one person and a burial cloth. Packed earth rises toward the grave strip.'
      })
    }),
    connectors: Object.freeze({
      'south-measure-hidden-wash-wall': Object.freeze({
        title: 'Drying-Frame Passage',
        entryLine: 'The movable drying frame opens back into the Rope Rows wash lane.',
        travelLabel: 'Return through the wash wall',
        travelLog: 'You pass the drying frame and return to Rope Rows.',
        reverseEntryLine: 'The movable drying frame in Rope Rows opens into the concealed shared lane.',
        reverseTravelLabel: 'Enter the Hidden Rows',
        reverseTravelLog: 'You pass the drying frame and enter the Hidden Rows.',
        stayLabel: 'Remain in the Hidden Rows',
        stayLog: 'You let the drying frame settle closed.',
        reverseStayLabel: 'Stay in Rope Rows',
        reverseStayLog: 'You leave the drying frame in place.'
      }),
      'south-measure-hidden-grave-door': Object.freeze({
        title: 'Grave-Strip Door',
        entryLine: 'The rear door opens beside the named graves, away from the Compact applicant lane.',
        travelLabel: 'Step onto the grave strip',
        travelLog: 'You leave the Hidden Rows by the grave passage.',
        reverseEntryLine: 'A narrow door beside the named graves opens into the rear household passage.',
        reverseTravelLabel: 'Enter the Hidden Rows',
        reverseTravelLog: 'You enter the Hidden Rows through the grave passage.',
        stayLabel: 'Stay inside',
        stayLog: 'You close the rear door without crossing it.',
        reverseStayLabel: 'Stay on the grave strip',
        reverseStayLog: 'You leave the narrow door closed.'
      })
    })
  }),

  'south-measure-charity-cellar': Object.freeze({
    id: 'south-measure-charity-cellar',
    name: 'South Measure Charity Cellar',
    intro: 'Milk tins and boiled cloth fill the first shelves. A locked cabinet stands apart from the medicine people trust.',
    inspectables: Object.freeze({
      'charity-cellar-clean-supply-shelves': Object.freeze({
        name: 'Clean Supply Shelves',
        log: 'Gauze, fever salts, and milk tins fill the open shelves. The seals and dose marks match ordinary charity work.'
      }),
      'charity-cellar-suspect-cabinet': Object.freeze({
        name: 'Locked Suppressant Cabinet',
        log: 'Joanna kept the suspect vials apart from the useful stock. Scraped donor marks remain under the cabinet latch.',
        mapMarker: Object.freeze({ label: 'Suppressant Cabinet', kind: 'locked' })
      }),
      'charity-cellar-prayer-cards': Object.freeze({
        name: 'Open Wound Prayer Cards',
        log: 'The cards teach that a closed gate refuses the body and a wound admits it. Dose notes cover part of the printed lesson.',
        mapMarker: Object.freeze({ label: 'Prayer Cards', kind: 'note' })
      }),
      'charity-cellar-burned-crate-labels': Object.freeze({
        name: 'Burned Crate Labels',
        log: 'Heat took the donor marks but left part of the route code. Enough remains to compare it with the Ash Chapel road order.',
        mapMarker: Object.freeze({ label: 'Courier Labels', kind: 'search' })
      }),
      'charity-cellar-work-table': Object.freeze({
        name: 'Medicine Work Table',
        log: 'Dose spoons and boiled cloth share the table with reconstructed crate scraps. Nothing here was arranged for worship.'
      }),
      'charity-cellar-screened-patient-cot': Object.freeze({
        name: 'Screened Patient Cot',
        log: 'A used cup and fresh compress sit within reach of the cot. Someone upstairs still depends on this reserve.'
      }),
      'charity-cellar-collapsed-grate': Object.freeze({
        name: 'Collapsed Rear Grate',
        log: 'The crawl narrows into fallen brick behind the grate. No person can pass through.',
        mapMarker: Object.freeze({ label: 'Collapsed Grate', kind: 'note' })
      })
    }),
    connectors: Object.freeze({
      'south-measure-charity-trapdoor': Object.freeze({
        title: 'Charity Cot Stair',
        entryLine: 'The stair rises through the cot trapdoor beside Joanna\'s medicine shelves.',
        travelLabel: 'Climb to the charity cots',
        travelLog: 'You climb from the cellar to the charity edge.',
        reverseEntryLine: 'The trapdoor beneath the charity cot opens onto a stair into the medicine cellar.',
        reverseTravelLabel: 'Descend into the charity cellar',
        reverseTravelLog: 'You descend beneath the charity cot into the medicine cellar.',
        stayLabel: 'Stay in the cellar',
        stayLog: 'You leave the cot stair behind.',
        reverseStayLabel: 'Stay by the charity cots',
        reverseStayLog: 'You leave the trapdoor alone.'
      })
    })
  })
});
