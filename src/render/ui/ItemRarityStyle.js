import { itemRarityMeta } from '../../core/ItemRarity.js';
import { PALETTE } from '../palette.js';

const ITEM_RARITY_COLORS = {
  common: PALETTE.uiText,
  uncommon: PALETTE.uiGood,
  rare: PALETTE.uiRare,
  epic: PALETTE.uiEpic,
  legendary: PALETTE.uiLegendary
};

export function itemRarityColor(item) {
  const rarity = itemRarityMeta(item?.rarity);
  return ITEM_RARITY_COLORS[rarity.id] ?? PALETTE.uiText;
}

export function itemRarityLabel(item) {
  return item?.rarityLabel || itemRarityMeta(item?.rarity).label;
}
