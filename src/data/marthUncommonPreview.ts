import type { HeroCardData } from '../types/heroCard';
import { marthPreview } from './marthPreview';

const originalMarthArt = '/art/aether/characters/marth_hero-king.png';

/** Development preview; not part of the booster catalog. */
export const marthUncommonPreview: HeroCardData = {
  ...marthPreview,
  id: 'FE-002',
  rarity: 'U',
  image: originalMarthArt,
  artwork: {
    background: '/art/aether/backgrounds/marth_grassland.png',
    character: originalMarthArt,
  },
};
