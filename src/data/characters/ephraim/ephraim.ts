import type { HeroCardData } from '../../../types/heroCard';
import { ephraimGameplay } from './ephraimGameplay';

const art = '/art/aether/heroes/Ephraim';
const commonCharacter = `${art}/characters/ephraim_restoration_lord_C.png`;
const sharedCharacter = `${art}/characters/ephraim_legendary_lord_U-R.png`;
const srCharacter = `${art}/characters/ephraim_legendary_lord_SR.png`;
const urCharacter = `${art}/characters/ephraim_legendary_lord_UR.png`;

/** Cost and Power are provisional print values; combat uses ephraimGameplay. */
export const ephraimCommon: HeroCardData = {
  layout: 'hero-common',
  id: 'FE-018',
  name: 'Ephraim',
  rarity: 'Common',
  cost: 3,
  power: 2000,
  heroTitle: 'Legendary Hero',
  characterType: ephraimGameplay.displayType,
  description: 'The prince of Renais leads the charge with his lance.',
  image: commonCharacter,
  gameplay: ephraimGameplay,
};

export const ephraimUncommon: HeroCardData = {
  ...ephraimCommon,
  id: 'FE-019',
  rarity: 'U',
  image: sharedCharacter,
  artwork: {
    background: `${art}/backgrounds/bg-U-R.png`,
    backgroundBrightness: 0.78,
    character: sharedCharacter,
  },
};

export const ephraimRare: HeroCardData = {
  ...ephraimUncommon,
  id: 'FE-020',
  rarity: 'R',
};

export const ephraimSuperRare: HeroCardData = {
  ...ephraimRare,
  id: 'FE-021',
  rarity: 'SR',
  image: srCharacter,
  artwork: {
    background: `${art}/backgrounds/bg-SR.png`,
    backgroundBrightness: 0.78,
    character: srCharacter,
  },
};

export const ephraimUltraRare: HeroCardData = {
  ...ephraimSuperRare,
  id: 'FE-022',
  rarity: 'UR',
  heroTitle: 'Emblem Hero',
  image: urCharacter,
  artwork: {
    background: `${art}/backgrounds/BG-UR.webp`,
    backgroundBrightness: 0.78,
    character: urCharacter,
    characterTopFade: 14,
  },
};

/** Ephraim SER remains unregistered until its distinct artwork and ID are ready. */
export const ephraimCards: HeroCardData[] = [
  ephraimCommon,
  ephraimUncommon,
  ephraimRare,
  ephraimSuperRare,
  ephraimUltraRare,
];
