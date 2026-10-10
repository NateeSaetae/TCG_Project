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
  magicEffects: {
    enabled: true,
    foilArtwork: '/art/aether/effects/marth_sr_front.png',
    foilMask: '/art/aether/effects/ur_magic_selective_mask.svg',
    foregroundOpacity: 0.34,
    foregroundDepth: 1.1,
    backgroundDepth: 0.25,
    foilIntensity: 0.28,
    highlightOpacity: 0.42,
    colors: ['#7eeaff', '#d4f5ff', '#c8c0f7', '#f4d5e9', '#fff0ce'],
  },
  artwork: {
    background: '/art/aether/backgrounds/marth-BG-UR.webp',
    character: '/art/aether/characters/marth_of_beginnings_UR.png',
    // Reuse only SR's front effect; no midground/back-effect layer.
    foreground: '/art/aether/effects/marth_sr_front.png',
  },
};
