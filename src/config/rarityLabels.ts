import type { Rarity } from '../types';

/** Display labels for future card layouts. Never use these as save IDs or weights. */
export const rarityLabels: Record<Rarity, string> = {
  Common: 'C',
  Uncommon: 'U',
  Rare: 'R',
  'Super Rare': 'SR',
  'Ultra Rare': 'UR',
  'Secret Rare': 'SEC',
};
