import type { HeroCardData } from '../../types/heroCard';

const art = '/art/aether/heroes/marth';
const commonCharacter = `${art}/characters/marth_hero-king_C.png`;
const sharedCharacter = `${art}/characters/marth_hero-king.png`;
const srCharacter = `${art}/characters/marth_hero-king_SR.png`;
const urCharacter = `${art}/characters/marth_of_beginnings_UR.png`;
const serCharacter = `${art}/characters/marth_of_beginnings_SCR.png`;
const srFrontEffect = `${art}/effects/marth_sr_front.png`;

export const marthPreview: HeroCardData = {
  layout: 'hero-common',
  id: 'FE-001',
  name: 'Marth',
  rarity: 'Common',
  cost: 3,
  power: 2000,
  characterType: 'Hero · Swordsman',
  description: 'The prince of Altea, destined to wield the legendary Falchion.',
  image: commonCharacter,
  imagePosition: '50% 50%',
};

export const marthUncommonPreview: HeroCardData = {
  ...marthPreview,
  id: 'FE-002',
  rarity: 'U',
  image: sharedCharacter,
  artwork: {
    background: `${art}/backgrounds/marth_grassland.png`,
    character: sharedCharacter,
  },
};

export const marthRarePreview: HeroCardData = {
  ...marthUncommonPreview,
  id: 'FE-003',
  rarity: 'R',
  cost: 3,
  power: 2000,
};

export const marthSuperRarePreview: HeroCardData = {
  ...marthRarePreview,
  id: 'FE-004',
  rarity: 'SR',
  image: srCharacter,
  artwork: {
    background: `${art}/backgrounds/marth_hero-king_SR.png`,
    midground: `${art}/effects/marth_sr_back.png`,
    character: srCharacter,
    foreground: srFrontEffect,
  },
};

export const marthUltraRarePreview: HeroCardData = {
  ...marthSuperRarePreview,
  id: 'FE-005',
  rarity: 'UR',
  cost: 3,
  power: 2000,
  image: urCharacter,
  magicEffects: {
    enabled: true,
    foilArtwork: srFrontEffect,
    foilMask: '/art/aether/effects/ur_magic_selective_mask.svg',
    foregroundOpacity: 0.34,
    foregroundDepth: 1.1,
    backgroundDepth: 0.25,
    foilIntensity: 0.28,
    highlightOpacity: 0.42,
    colors: ['#7eeaff', '#d4f5ff', '#c8c0f7', '#f4d5e9', '#fff0ce'],
  },
  artwork: {
    background: `${art}/backgrounds/marth-BG-UR.webp`,
    character: urCharacter,
    // UR reuses the SR front effect without a back-effect layer.
    foreground: srFrontEffect,
  },
};

export const marthSecretRarePreview: HeroCardData = {
  ...marthPreview,
  layout: 'hero',
  id: 'FE-006',
  rarity: 'SER',
  image: serCharacter,
  artwork: {
    background: `${art}/backgrounds/marth-BG-SCR.png`,
    midground: `${art}/effects/effect_back_SER_marth.png`,
    character: serCharacter,
  },
};

/** Add this set to characters/index.ts to include it in packs and the archive. */
export const marthCards: HeroCardData[] = [
  marthPreview,
  marthUncommonPreview,
  marthRarePreview,
  marthSuperRarePreview,
  marthUltraRarePreview,
  marthSecretRarePreview,
];
