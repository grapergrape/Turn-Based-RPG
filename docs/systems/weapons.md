# Weapon System

This document is the design and authoring reference for the first complete weapon foundation.

## Current roster

The canonical catalog contains exactly 100 weapons:

- 20 ballistic long guns.
- 20 ballistic pistols.
- 20 magnetic accelerator weapons.
- 40 melee weapons.

The generated index is `data/catalogs/weapons.json`. The reviewed source roster is `scripts/content/weapon-catalog-content.mjs`, and `scripts/gen-weapon-catalog.mjs` writes one readable JSON file per item. The content validator enforces these totals and the nine ammunition families.

The Act I field pool contains 20 curated weapons. They enter play through the player's starting equipment, two locked supply containers, Sutler Judith, Cyrus Longinus, a Red Tithe enemy drop, and the Processional Pike reward. The remaining catalog is available for later acts and can be granted during local playtesting with `await hostDebug.give('item-id')`.

## Ready weapons

The player has two flexible ready slots, `weapon1` and `weapon2`. Any weapon can occupy either slot. Both slots are live during combat and changing the selected slot costs no AP.

- Press `1` to select or cycle the attack modes on Weapon 1.
- Press `2` to select or cycle the attack modes on Weapon 2.
- Press `R` to reload the selected weapon.
- In the inventory, `1` and `2` equip the selected weapon into that ready slot.

Runtime attack ids combine the condition-bearing inventory entry and the local mode id. This lets two copies of one weapon retain separate condition, magazine, and selected-mode state. Systems that need a category use semantic roles such as `melee`, `sidearm`, `ranged`, and `firearm`, not a hardcoded runtime id.

## Ammunition and magazines

Ballistic and accelerator weapons use finite loaded ammunition. A weapon instance stores its current magazine count. Ammunition items remain ordinary stackable inventory entries and act as the shared reserve.

The nine families are:

1. Compact cartridges.
2. Sidearm cartridges.
3. Heavy sidearm cartridges.
4. Intermediate rifle cartridges.
5. Full rifle cartridges.
6. Waxed shot shells.
7. Linked heavy cartridges.
8. Compact ferrous armatures.
9. Long ferrous armatures.

A reload transfers as many units as possible from the matching reserve item into the magazine. It spends the authored `reloadAp` in combat and costs no AP outside combat. Empty attacks are disabled in previews, context actions, techniques, overwatch, and ordinary attacks.

Enemy weapon references use the same catalog definitions. Human enemies may author finite `loaded` and `reserve` counts and will reload when their primary weapon is empty. Intrinsic Host attacks remain actor attacks because their bodies are the weapon.

## Accelerator canon

Accelerator arms are not energy beams. They use coils, induction cages, or rails to throw solid ferrous armatures. Their ancestors were survey launchers, pile drivers, inspection tools, civil security weapons, and military prototypes. Penitent Engine workshops preserved the most capable patterns.

They are loud, heavy, and physically violent. Charge bricks and capacitors replace powder, but an armature still leaves the barrel and strikes the target. Ceramic rail beds crack. Coils overheat. Contacts foul. Road settlements can keep a few examples alive, but cannot produce their best components at scale.

This gives them a clear game identity:

- Higher damage and useful accuracy.
- Small magazines and expensive reloads.
- Greater condition wear, especially when overcharged.
- Scarce armatures and difficult repairs.
- Braced modes on long or heavy examples.

Do not add laser, plasma, ray, photon, or magic beam weapons to this family. A future directed-energy category requires a separate canon decision.

## Attack modes

`weapon.attacks` contains one or more bounded tactical modes. Modes adjust existing combat values rather than creating a second ability system.

Current patterns include:

- Single Shot and Quick Shot.
- Controlled Burst and Short Burst.
- Close Spread for shotguns.
- Braced Shot for precision rifles.
- Armature Shot and Overcharge.
- Quick Cut, Committed Blow, and Hold Reach.

Each mode may author AP cost, damage, range, accuracy, ammunition cost, condition wear, and `requiresStationary`. Moving during the current combat turn disables a stationary mode until that actor's next turn.

## Balance bands

These are initial content bands, not permanent progression caps.

| Family | Damage | Range | AP | Typical capacity |
| --- | ---: | ---: | ---: | ---: |
| Ballistic pistol | 4 to 7 | 4 to 6 | 2 to 5 | 5 to 18 |
| Ballistic long gun | 6 to 11 | 4 to 10 | 3 to 7 | 5 to 30 |
| Accelerator | 6 to 15 | 5 to 10 | 4 to 8 | 3 to 7 |
| Melee | 2 to 11 | 1 to 2 | 2 to 6 | none |

Condition still applies its existing damage multipliers. Failing weapons hit for half damage and a condition value of zero disables the weapon. Ammunition does not replace condition as the maintenance pressure.

## Visual contract

Sixteen reusable weapon silhouettes cover the catalog. The same `groundModel` drives the ground pickup, inventory icon, and the player's selected attack silhouette. Variants may share a silhouette, but the family must still read at gameplay scale.

All weapon art follows `game_art_skill/SKILL.md`: hard pixels, central palette only, upper-left light, contact shadow on ground pickups, and deliberate native detail.

## Verification

When the catalog or rules change:

1. Run `node scripts/gen-weapon-catalog.mjs`.
2. Run `npm run check`.
3. Run `node tests/weaponSystem.test.mjs` and `node tests/weaponCatalog.test.mjs`.
4. Run the art, actor, and UI native-detail tests if silhouettes or readouts changed.
5. Open the inventory and one combat scene in a browser and verify the selected weapon, ammunition readout, reload action, and ground pickup.
