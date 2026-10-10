import type { HeroCardData } from '../types/heroCard';
import { marthPreview } from './marthPreview';

/** SCR full-art prototype only; never added to booster rolls or saved collection. */
export const marthSecretRarePreview: HeroCardData = {
  ...marthPreview,
  layout: 'hero',
  id: 'FE-006',
  rarity: 'SCR',
  image: '/art/aether/characters/marth_of_beginnings_SCR.png',
  artwork: {
    background: '/art/aether/backgrounds/marth-BG-SCR.png',
    character: '/art/aether/characters/marth_of_beginnings_SCR.png',
  },
};
