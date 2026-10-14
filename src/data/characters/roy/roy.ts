import type { HeroCardData } from '../../../types/heroCard';
import { royGameplay } from './royGameplay';

const art = '/art/aether/heroes/Roy';
const commonCharacter = `${art}/characters/roy_blazing_lion_C.png`;
const sharedCharacter = `${art}/characters/roy_blazing_lion_U-R.png`;
const srCharacter = `${art}/characters/roy_blazing_lion_SR.png`;
const urCharacter = `${art}/characters/roy_of_binding_UR.png`;
const serCharacter = `${art}/characters/roy_of_beginnings_SCR.png`;
const srFrontEffect = `${art}/effects/marth_sr_front.png`;

export const royPreview: HeroCardData = {
  layout: 'hero-common',
  id: 'FE-007',
  name: 'Roy',
  rarity: 'Common',
  cost: 2,
  power: 1500,
  characterType: 'Hero · Swordsman',
  description: 'Marquess of Pherae, of the Lycian League. Eliwood Son',
  image: commonCharacter,
  imagePosition: '50% 50%',
  gameplay: royGameplay,
};

export const royUncommonPreview: HeroCardData = {
  ...royPreview,
  id: 'FE-008',
  rarity: 'U',
  image: sharedCharacter,
  artwork: {
    background: `${art}/backgrounds/Lythos_Grasslands.webp`,
    character: sharedCharacter,
  },
};

export const royRarePreview: HeroCardData = {
  ...royUncommonPreview,
  id: 'FE-009',
  rarity: 'R',
  cost: 2,
  power: 1500,
};

export const roySuperRarePreview: HeroCardData = {
  ...royRarePreview,
  id: 'FE-010',
  rarity: 'SR',
  image: srCharacter,
  artwork: {
    background: `${art}/backgrounds/fire-emblem-fortune-s-weave-launches-at-80-physical-on-switch-2-1781131417-hero.webp`,
    // midground: `${art}/effects/roy_sr_back.png`,
    character: srCharacter,
    foreground: srFrontEffect,
  },
};

export const royUltraRarePreview: HeroCardData = {
  ...roySuperRarePreview,
  id: 'FE-011',
  rarity: 'UR',
  cost: 3,
  power: 2000,
  heroTitle: 'Emblem Hero',
  image: urCharacter,
  artwork: {
    background: `${art}/backgrounds/roy-BG-UR.webp`,
    character: urCharacter,
    foreground: srFrontEffect,
  },
};

export const roySecretRarePreview: HeroCardData = {
  ...royPreview,
  layout: 'hero',
  id: 'FE-006',
  rarity: 'SER',
  image: serCharacter,
  artwork: {
    background: `${art}/backgrounds/roy-BG-SCR.png`,
    midground: `${art}/effects/effect_back_SER_roy.png`,
    character: serCharacter,
  },
};

/** SER remains a draft until its unique ID and missing artwork are ready. */
export const royCards: HeroCardData[] = [
  royPreview,
  royUncommonPreview,
  royRarePreview,
  roySuperRarePreview,
  royUltraRarePreview,
];
