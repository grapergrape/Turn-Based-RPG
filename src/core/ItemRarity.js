export const DEFAULT_ITEM_RARITY = 'common';

export const ITEM_RARITIES = [
  { id: 'common', label: 'Common', rank: 0 },
  { id: 'uncommon', label: 'Uncommon', rank: 1 },
  { id: 'rare', label: 'Rare', rank: 2 },
  { id: 'epic', label: 'Epic', rank: 3 },
  { id: 'legendary', label: 'Legendary', rank: 4 }
];

export const ITEM_RARITY_IDS = new Set(ITEM_RARITIES.map((rarity) => rarity.id));

const ITEM_RARITY_BY_ID = new Map(ITEM_RARITIES.map((rarity) => [rarity.id, rarity]));

export function normalizeItemRarity(value) {
  return ITEM_RARITY_IDS.has(value) ? value : DEFAULT_ITEM_RARITY;
}

export function itemRarityMeta(value) {
  return ITEM_RARITY_BY_ID.get(normalizeItemRarity(value)) ?? ITEM_RARITY_BY_ID.get(DEFAULT_ITEM_RARITY);
}
