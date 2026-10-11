import type { HeroCardData } from '../types/heroCard';
import { marthPreview } from './marthPreview';

/** SER full-art variant shared by previews and the Marth booster catalog. */
export const marthSecretRarePreview: HeroCardData = {
  ...marthPreview,
  layout: 'hero',
  id: 'FE-006',
  rarity: 'SER',
  image: '/art/aether/characters/marth_of_beginnings_SCR.png',
  artwork: {
    background: '/art/aether/backgrounds/marth-BG-SCR.png',
    midground: '/art/aether/effects/effect_back_SER_marth.png',
    character: '/art/aether/characters/marth_of_beginnings_SCR.png',
  },
};
