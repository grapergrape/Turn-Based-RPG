# Old Pilgrim Way: Twenty-Pass Review

This review turns the first complete implementation into a denser Act I RPG
location. Each pass must leave a visible, mechanical, or reactive result in the
six-map package. A rewritten description alone does not count as a pass.

| Pass | Focus | Required result |
| ---: | --- | --- |
| 1 | Ecclesiate identity | The road church, hospice, novitiate, and chapter read as one pre-Bloom Solar Ecclesiate institution with distinct priest, nun, novice, and pilgrim functions. |
| 2 | Surface landmarks | The long road gains procession shrines, a ruined hospice stop, worked field edges, cart traces, and a readable hill branch without losing its lonely scale. |
| 3 | Living road camp | Camp furniture, work positions, ambient lines, and practical tasks make the present-day road closure feel occupied rather than staged. |
| 4 | South Measure reactivity | Each major South Measure outcome produces a different visible camp arrangement and a different account of who controls food, papers, or passage. |
| 5 | Tobias's wound | Medicine and Host Signs can establish what struck Tobias. Spending a field dressing stabilizes him and reveals a useful cartwright detail. |
| 6 | Stage IV roles | The five opened pilgrims use at least three related combat roles with distinct silhouettes, health, movement, range, and readable procession origins. |
| 7 | Field approaches | The furrow encounter supports an informed opening shot, a cart-release flank, and a direct approach. Skill and prior investigation change the opening position or advantage. |
| 8 | Field aftermath | Victory changes the surface dressing, opens a safe search of the bodies and cart, and gives Sister Thecla a precise report state. |
| 9 | Public church history | The Hill Church gains road-hospice furniture, ordinary records, pilgrim sleeping space, and useful salvage tied to its public function. |
| 10 | Concealed entrance proof | Opening the apse requires a synthesis of multiple clues instead of a single successful click. Doctrine, Search, Engineering, Security, and Father Noah remain viable contributors. |
| 11 | Closure causality | The Closure Stair shows the alarm, automatic pressure seal, failed manual release, and empty emergency tank as a connected mechanical event. |
| 12 | Names below the hill | A secondary evidence quest tracks the identities of the trapped people through records found across the underground maps. |
| 13 | Novitiate lives | Dormitories, cells, refectory, and work rooms contain role-specific furniture, possessions, bodies, and small decisions from the final days. |
| 14 | Water failure | Pump, cistern, ration marks, and final tally form an investigable chain that explains dehydration without relying on one exposition object. |
| 15 | Trial silhouettes | Quiet, Service, Burden, Mercy, and Profession receive bespoke mechanical props and room dressing that can be identified from the map view. |
| 16 | Trial solutions | Each trial offers a skilled interpretation and an always-available physical fallback. At least one earlier clue improves a later solution. |
| 17 | Trial consequences | Skilled and forced solutions create different visible machine states, cache access, and final profession judgments. |
| 18 | Chapter tableau | The Sealed Chapter presents the priests' final decisions, untouched stores, failed messages, and the moral cost of preserving the seal. |
| 19 | Processional Pike | The pike has a dedicated rack, credible road-defense provenance, a two-tile melee identity, and a meaningful claim moment. |
| 20 | Return and disposition | The return lift changes the church. Father Noah enters the site, the recovered names can be handled in several ways, and the player's decision leaves a visible memorial state for later visits. |

## Acceptance evidence

Completion requires generated data for all six levels, focused assertions for
the twenty results, a full repository check, a full test run, isolated renders
for every new art kind, and fresh in-scene captures of the surface, church,
closure stair, quarters, trials, and chapter.

## Completion record

All twenty passes are represented in runtime data and protected by
`tests/oldPilgrimWayLevel.test.mjs`.

1. Ecclesiate identity: road shrines, hospice cots, closure controls, trial
   machines, chapter records, and role-specific dead now share one institution.
2. Surface landmarks: five procession shrines, field boundaries, cart traces,
   hospice remnants, and the hill branch structure the long road.
3. Living road camp: beds, work surfaces, stores, shelter, and practical actor
   positions give the closure camp a working purpose.
4. South Measure reactivity: Compact, Morrow, resident, and sealed outcomes
   change both the carried-forward actor and visible camp equipment.
5. Tobias's wound: Medicine consumes a field dressing, stabilizes Tobias, and
   reveals the cart release pin.
6. Stage IV roles: Procession Runner, Bell Throat, and Cord Bearer divide the
   five enemies into distinct movement, range, durability, and visual roles.
7. Field approaches: informed shot, cart flank, and direct engagement produce
   three different openings.
8. Field aftermath: five transformed remains, two ordinary bodies, a moved
   cart, salvage, and Sister Thecla's report state appear after victory.
9. Public church history: nave furniture, hospice beds, road records, repair
   traces, and ordinary salvage establish the building's former daily use.
10. Concealed entrance proof: any two of five clues prove the hidden route;
    Engineering or Security then releases it.
11. Closure causality: duty register, alarm traces, manual wheel, tank gauge,
    pressure door, failed breach, and body placement reconstruct the closure.
12. Names below the hill: four records advance a separate evidence quest from
    the closure stair to the final chapter.
13. Novitiate lives: twelve cots, clergy cells, pantry, refectory, sick room,
    possessions, and ordinary bodies distinguish how the rooms were used.
14. Water failure: pump, cistern, empty tank, ration marks, and tally require
    combined evidence before the cause is understood.
15. Trial silhouettes: Quiet, Service, Burden, Mercy, and Profession use
    separate custom mechanisms and room dressing.
16. Trial solutions: each trial has an intended skill route and a physical
    fallback. Four earlier findings improve later interpretations.
17. Trial consequences: kept and broken machines persist visibly, alter cache
    access, and feed the final profession judgment.
18. Chapter tableau: the intake record, unsent clearance, last office, sealed
    stores, and final bodies show the choices made after the water failed.
19. Processional Pike: the Oath Armory contains a dedicated stateful rack, a
    sealed aid chest, and the two-cell melee polearm reward.
20. Return and disposition: the lift returns to a changed church, Father Noah
    enters the site, and three name-roll decisions leave distinct arrangements.

Fresh visual evidence is stored in
`.ai/visual-audit/2026-07-17-old-pilgrim-way-20-pass/`. It includes an isolated
sheet for all seven new art kinds and fifteen runtime captures covering closed,
aftermath, discovery, trial-state, armory, and return contexts.

Final validation on 2026-07-17:

- `node scripts/gen-old-pilgrim-way.mjs` regenerated all six maps and supporting
  content.
- `npm run check` parsed 523 JSON files without error.
- `npm test` passed the complete repository suite.
- `tests/catalogRender.test.mjs` completed 1,200 seeded catalog draws without an
  exception.
- `git diff --check` reported no whitespace errors.
