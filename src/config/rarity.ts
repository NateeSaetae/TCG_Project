import type { Rarity } from '../types';
export const rarities: Rarity[] = [
  'Common',
  'Uncommon',
  'Rare',
  'Super Rare',
  'Ultra Rare',
  'Secret Rare',
];
export const rarityWeights: Record<Rarity, number> = {
  Common: 55,
  Uncommon: 25,
  Rare: 12,
  'Super Rare': 5,
  'Ultra Rare': 2.5,
  'Secret Rare': 0.5,
};
export const rarityColors: Record<Rarity, string> = {
  Common: '#9aaabd',
  Uncommon: '#76c9a2',
  Rare: '#75baff',
  'Super Rare': '#bf8aff',
  'Ultra Rare': '#edb976',
  'Secret Rare': '#fff1ac',
};
export const PACK_SIZE = 5;
export const rank = (rarity: Rarity) => rarities.indexOf(rarity);
