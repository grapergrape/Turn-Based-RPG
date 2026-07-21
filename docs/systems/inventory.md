# Inventory System

The current inventory is a small field-pack system, not an infinite loot bag.

## Carry weight

- Each item in `data/items/` defines a `weight` in kilograms.
- The actor loadout can set `inventory.maxCarryWeight`. The player currently carries
  up to 14 kg. The starting kit weighs 7.8 kg, leaving 6.2 kg for field loot.
- Loot containers check the whole stack before adding it. If the stack would
  exceed the carry limit, the container remains unopened and the player gets a
  pack-full message.
- Equipped items still count as carried weight.

## Rarity

- Each item defines `rarity` as `common`, `uncommon`, `rare`, `epic`, or
  `legendary`.
- Inventory, loot, and trade screens color item names and slot accents from the
  rarity grade.
- Missing runtime rarity falls back to `common`, but committed item JSON must set
  the field explicitly.
- Items can set `build` to show the build they are tuned for in inventory, loot,
  and trade details.

## Gear slots

The player has fixed equipment slots:

- Clothes
- Armor
- Boots
- Helmet
- Trinket
- Ring 1
- Ring 2

Item files opt into gear with `equipment.slot`. Valid item slots are `clothes`,
`armor`, `boots`, `helmet`, `trinket`, and `ring`. Ring items can occupy either
ring slot on the actor.

## Runtime behavior

- `src/core/Inventory.js` owns item counts, carry weight, and equipped slots.
- Level transitions preserve the pack and equipped gear.
- Fresh starts load the player actor's authored inventory.
- The inventory screen shows carried weight, item stacks, a small character
  image, and each gear slot.
- Pressing `3` in the inventory drops one selected item onto the player's tile.
  Dropping selected gear removes it from that gear slot first.
- Ground items are player pickup by default. The data model keeps a
  `pickupPolicy` hook so quest scripts or later NPC animations can opt into
  broader pickup without changing the inventory core.

## Trading

- Trader `stock` entries define what the player can buy and the ducat price for
  one item.
- Optional trader `buys` entries define the exact items that trader accepts
  from the player. Items not listed cannot be sold there.
- A buy entry can set `keep` to reserve that many copies in the player's pack.
  Equipped copies are also reserved, so selling cannot strip worn gear.
- Buying and selling move one item at a time. Currency has zero weight, and a
  sale immediately frees the sold item's carry weight.
