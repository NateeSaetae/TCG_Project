import type { HeroCardData } from '../types/heroCard';
import { marthUncommonPreview } from './marthUncommonPreview';

/** Full-art Rare variant shared by previews and the Marth booster catalog. */
export const marthRarePreview: HeroCardData = {
  ...marthUncommonPreview,
  id: 'FE-003',
  rarity: 'R',
  cost: 3,
  power: 2000,
};
