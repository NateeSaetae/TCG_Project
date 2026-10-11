import type { HeroCardData } from '../types/heroCard';
import { marthRarePreview } from './marthRarePreview';

/** Alternate-art SR variant shared by previews and the Marth booster catalog. */
export const marthSuperRarePreview: HeroCardData = {
  ...marthRarePreview,
  id: 'FE-004',
  rarity: 'SR',
  image: '/art/aether/characters/marth_hero-king_SR.png',
  artwork: {
    background: '/art/aether/backgrounds/marth_hero-king_SR.png',
    midground: '/art/aether/effects/marth_sr_back.png',
    character: '/art/aether/characters/marth_hero-king_SR.png',
    foreground: '/art/aether/effects/marth_sr_front.png',
  },
};
