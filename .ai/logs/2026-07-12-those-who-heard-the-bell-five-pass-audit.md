# 2026-07-12: Those Who Heard the Bell five-pass audit

## Scope

This audit covers the Vigil Chapel, Mortuary Chapel, Listening Vault, their
secrets and UI, and the Sava Rell encounter. Each pass included an isolated
render or real game capture. The review standard was the project's honest art
rubric, with 4 as average and 10 reserved for exceptional work.

## Pass 1: silhouette and material baseline

Reviewed both chapel interiors, the vault prop family, and the first Sava
silhouette in isolated sheets and authored scenes.

Findings:

- The chapel rooms read as distinct places, but their story props needed a
  clearer functional hierarchy.
- The first Sava silhouette read too much like a composed cleric.
- The listening apparatus needed to dominate the vault without becoming a
  bright fantasy machine.

Actions:

- Separated the Vigil's domestic mourning language from the Mortuary's working
  surfaces and institutional records.
- Rebuilt Sava around an asymmetrical human body, a canted face, one opened rib
  side, fused prayer fingers, and an overlong rake arm.
- Kept the apparatus in cold metal, stained ceramic, wax, and thin black-gold
  traces from the approved palette.

Evidence:

- `.ai/visual-audit/2026-07-12-heard-bell-pass-01-static-kinds.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-01-vigil-scene.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-01-mortuary-scene.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-01-vault-scene.png`
- `.ai/visual-audit/2026-07-12-sava-pass-01-baseline.png`

## Pass 2: real room scale and secret readability

Loaded all three spaces through the real game renderer and HUD.

Findings:

- The concealed Mortuary stair left a black floor interruption before it was
  discovered.
- The original vault chest was brighter than the story-critical apparatus.
- Sava's human scale held at normal play zoom, but his body-horror landmarks
  needed stronger asymmetry.

Actions:

- Added a generic `hiddenUntilOpened` prop state so a secret prop can remain
  absent while its ordinary floor tile stays visible.
- Replaced the bright reliquary treatment with a low examiner assay case.
- Increased the broken bone arc, one-sided rib opening, and fused-hand read
  while keeping Sava only slightly larger than Mara.

Evidence:

- `.ai/visual-audit/2026-07-12-heard-bell-pass-02-vigil-game.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-02-mortuary-game.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-02-vault-game.png`
- `.ai/visual-audit/2026-07-12-sava-pass-02-mass-ribs.png`
- `.ai/visual-audit/2026-07-12-sava-pass-03-canted-asymmetry.png`

## Pass 3: investigation and decision UI

Reviewed the real dialogue panel at the story's three most demanding moments:
the central revelation, the warning before breaking quiet, and final judgment.

Findings:

- The locked line, choice labels, condition summaries, and consequence text all
  fit without clipping.
- The third-strike warning remained legible and specific under pressure.
- The final three decisions were visually parallel and narratively distinct.

Actions:

- Kept lines short enough for the existing bitmap dialogue UI.
- Preserved the exact central line: `The bell below us rang first.`
- Kept outcome flags mutually exclusive and tested their later reward hooks.

Evidence:

- `.ai/visual-audit/2026-07-12-heard-bell-pass-03-central-line-ui.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-03-break-quiet-warning-ui.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-03-judgment-ui.png`

## Pass 4: boss action, HUD, corpse, and balance

Reviewed Sava's attack pose, all facings, death state, target readout, combat
intro, and early-game simulation.

Findings:

- The target label and 20 HP readout fit the combat HUD.
- The encounter is dangerous at adjacency but allows Mara to use the room.
- A generic collapsed Host corpse lost too much of Sava's authored mass.

Actions:

- Added a dedicated full-mass death painter with no living glow.
- Kept one simple 2-damage rake at 3 AP, allowing two attacks only when Sava
  reaches the player.
- Set movement to 1 and placed the opening at distance two so positioning and
  the nearby chapel supplies matter.

Evidence and balance:

- `.ai/visual-audit/2026-07-12-heard-bell-pass-04-combat-hud.png`
- `.ai/visual-audit/2026-07-12-sava-final-attack.png`
- `.ai/visual-audit/2026-07-12-sava-final-dead.png`
- Starter Mara with one dressing wins 78.1 percent of simulated distance-two
  openings, averaging round 5.31 on wins.
- With three dressings, the simulated win rate is 95.1 percent.

## Pass 5: final closed and opened state

Re-captured the final rooms through the live game and checked the exterior
chapel approach at player scale.

Findings:

- The closed Mortuary floor is continuous and does not advertise the stair.
- The closed vault hides Sava completely.
- Opening the niche reveals enough of Sava's upper body to establish the threat
  before the first combat action.
- Completed record choices now alter the physical rooms. A restored vigil
  closes and disables Hessa's panel, while carried records disappear from their
  authored document props without removing the furniture beneath them.
- The exterior roofs, doors, and walls read as aligned small chapels beside a
  player-sized human.

Actions:

- Filtered concealed props from interaction targeting and journal markers as
  well as from the renderer.
- Added run-flag object state rules so concealment, disabling, and resealing
  persist when the player returns from another level.
- Lowered the front-right niche wall enough for the opened silhouette to read.
- Verified both chapel round trips and the unlocked two-way catacomb shortcut
  in the running game.

Evidence:

- `.ai/visual-audit/2026-07-12-heard-bell-pass-05-mortuary-game.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-05-vault-game.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-05-vault-open-combat.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-05-vigil-rehidden.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-05-vault-records-taken.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-05-static-kinds.png`
- `.ai/visual-audit/2026-07-12-heard-bell-graveyard-entries-final-scene.png`

## Pass 6: Sava's human silhouette under the Imprint

Reviewed Sava again at normal play zoom and in five representative isolated
facings. The previous sprite carried the right ideas, but the rear views and
long-limbed read were still weaker than the front.

Actions:

- Carried the broken aureole, long calcified human face, one-sided rib opening,
  fused prayer hand, and overlong rake arm through the rear and quarter facings.
- Strengthened the shroud weight and one dropped shoulder without making Sava
  taller than a human-sized enemy.
- Kept the live wound small, the gold seams under the skin, and all light on the
  body rather than painting an environmental glow into the sprite.

Evidence:

- `.ai/visual-audit/2026-07-12-sava-pass-06-isolated-s.png`
- `.ai/visual-audit/2026-07-12-sava-pass-06-isolated-se.png`
- `.ai/visual-audit/2026-07-12-sava-pass-06-isolated-sw.png`
- `.ai/visual-audit/2026-07-12-sava-pass-06-isolated-n.png`
- `.ai/visual-audit/2026-07-12-sava-pass-06-isolated-ne.png`
- `.ai/visual-audit/2026-07-12-sava-pass-06-in-scene.png`

Assessment: 8.6/10. The static boss read became strong and specific. Motion and
death still needed the next pass.

## Pass 7: direction, attack weight, and the body after death

Reviewed all eight idle facings, all eight impact facings, the attack wind-up
and recovery, opposing walk frames, hit shifts, the ten-frame fall, the final
corpse, and the real combat scene.

Actions:

- Added a cocked rake wind-up, direction-correct reach, three readable impact
  fingers, and restrained arm lag while walking.
- Kept the feet planted during the first death frames, then buckled one knee
  before the impact and small settle.
- Replaced the undersized death read with a full-width human corpse that keeps
  the opened ribs, fused hand, long rake arm, shroud mass, and broken aureole.
- Removed all living glow from the corpse.

Evidence:

- `.ai/visual-audit/2026-07-12-sava-pass-07-idle-{n,ne,e,se,s,sw,w,nw}.png`
- `.ai/visual-audit/2026-07-12-sava-pass-07-attack-impact-{n,ne,e,se,s,sw,w,nw}.png`
- `.ai/visual-audit/2026-07-12-sava-pass-07-attack-windup-se.png`
- `.ai/visual-audit/2026-07-12-sava-pass-07-attack-recovery-se.png`
- `.ai/visual-audit/2026-07-12-sava-pass-07-death-buckle.png`
- `.ai/visual-audit/2026-07-12-sava-pass-07-death-impact.png`
- `.ai/visual-audit/2026-07-12-sava-pass-07-corpse-final.png`
- `.ai/visual-audit/2026-07-12-sava-pass-07-live-combat.png`

Assessment: 9/10. The boss keeps the same authored anatomy in every direction,
the attack reads as a rake rather than a pointing arm, and the dead body retains
the standing figure's mass.

## Pass 8: chapel materials and the people who used them

Reviewed the Vigil Chapel, Mortuary Chapel, and Listening Vault as a single prop
family, both detached and through the running game.

Actions:

- Reworked the Vigil rack as twelve aged rust-and-wax cups, including the
  crushed place and tied name slips.
- Gave the gravekeeper chair wear, a broken arm, restraint fittings, and the
  remaining cord depending on its role.
- Added a measured stone washing slab, drain channel, folded cloth, and a low
  examiner assay case to the Mortuary vocabulary.
- Put the mortuary marks on hanging brass plates instead of floating glyphs.
- Gave the listening apparatus a receiving bed, shouldered bell, driven striker,
  wire runs, and one clipped measurement slip.

Evidence:

- `.ai/visual-audit/2026-07-12-heard-bell-pass-08-props-isolated-closed.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-08-niche-isolated-open.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-08-vigil-live.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-08-mortuary-live.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-08-vault-live.png`

## Pass 9: room composition and secret-state honesty

Reviewed the final closed and opened states after adding only motivated traces
and after preserving every circulation route.

Actions:

- Moved the Vigil register fully behind its door group so the closed secret
  leaves ordinary stone, not a black floor tell.
- Added loose pages, chair wear, a cut bell rope, machine oil, floor damage, and
  one working Mortuary candle where they explain use or neglect.
- Removed an occluded Vault candle that read as a floating flame.
- Kept stone mass around the opened listening niche and slid the seal leaves
  aside so open does not mean visually erased.
- Preserved the exact story, flags, loot, collision, and two-way routes.

Evidence:

- `.ai/visual-audit/2026-07-12-heard-bell-pass-09-props-isolated-closed.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-09-niche-isolated-open.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-09-vigil-live-closed.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-09-vigil-live-open.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-09-mortuary-live-closed.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-09-mortuary-live-open.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-09-vault-live-closed.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-09-vault-live-open.png`

Assessment: 9/10 for each room and for the secret prop family. The Vigil reads
as mourning work, the Mortuary as measured body work, and the Vault as a held
listening experiment before any label is read.

## Pass 10: decision hierarchy and combat information

An independent review first held this pass at 8/10. It found that a status
effect hid attack odds, quiet choices looked disabled, short conversations
reserved too much empty space, stale area titles competed with the boss reveal,
and detached UI evidence was missing. All five defects were corrected before
the final score.

Actions:

- Added hard-pixel response index plates and distinct neutral, commitment, and
  danger colors. Quiet exits retain the established active green instead of
  blending into narrative copy or reading as disabled grey.
- Added an optional authored choice tone while keeping conservative inference:
  combat is danger, a closing quest decision is commitment, and an effect-free
  exit is quiet.
- Made short dialogue windows compact and bottom-anchored while retaining the
  full-size scrolling layout for long text and five choices.
- Rebuilt the combat status stack so HP, AP, attack, chance or failure reason,
  and the full Sava target line all remain visible even when Mara has a status.
- Suppressed area-title banners during combat.

Evidence:

- `.ai/visual-audit/2026-07-12-heard-bell-pass-10-dialogue-isolated.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-10-combat-hud-isolated.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-10-central-line-ui-final.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-10-warning-ui-final.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-10-judgment-ui-final.png`
- `.ai/visual-audit/2026-07-12-heard-bell-pass-10-combat-hud-final.png`

Assessment: 9/10 for this quest's dialogue and combat UI. It is dense without
being crowded, choices advertise consequence without explaining outcomes, and
the combat panel never trades away tactical information for decoration.

## Final assessment

- Sava live sprite and motion: 9/10.
- Sava corpse: 9/10.
- Vigil Chapel, Mortuary Chapel, and Listening Vault: 9/10 each.
- Chapel secret hero props: 9/10 as a family.
- Those Who Heard the Bell dialogue and combat UI: 9/10.

All visible art uses hard pixels and the project palette. Sava has a contact
shadow, upper-left lighting, no baked environmental glow, and no clean golem or
chibi proportions. Combat rules and supplies were not changed. Starter Mara's
distance-two simulation remains 78.1 percent, and the three-dressing case
remains 95.1 percent.
