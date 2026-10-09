import type { HeroCardData } from '../types/heroCard';
import { marthUncommonPreview } from './marthUncommonPreview';

/** Full-art development preview; not part of the booster catalog. */
export const marthRarePreview: HeroCardData = {
  ...marthUncommonPreview,
  id: 'FE-003',
  rarity: 'R',
  cost: 3,
  power: 2000,
};
