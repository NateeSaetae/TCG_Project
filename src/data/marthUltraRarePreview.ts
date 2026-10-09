import type { HeroCardData } from '../types/heroCard';
import { marthSuperRarePreview } from './marthSuperRarePreview';

/** Visual prototype only; FE-005 is not part of booster packs or saved collection. */
export const marthUltraRarePreview: HeroCardData = {
  ...marthSuperRarePreview,
  id: 'FE-005',
  rarity: 'UR',
  cost: 3,
  power: 2000,
  image: '/art/aether/characters/marth_of_beginnings_UR.png',
  artwork: {
    background: '/art/aether/backgrounds/ur_royal_court_placeholder.svg',
    character: '/art/aether/characters/marth_of_beginnings_UR.png',
    foreground: '/art/aether/effects/marth_ur_magic.svg',
  },
};
