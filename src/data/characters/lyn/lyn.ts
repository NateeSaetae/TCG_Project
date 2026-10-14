import type { HeroCardData } from '../../../types/heroCard';
import { lynGameplay } from './lynGameplay';

const art = '/art/aether/heroes/Lyn';
const commonCharacter = `${art}/characters/lyn_lady_of_the_wind_C.png`;
const sharedCharacter = `${art}/characters/lyn_lady_of_the_wind_U-R.png`;
const srCharacter = `${art}/characters/lyn_lady_of_the_wind_SR.png`;
const urCharacter = `${art}/characters/lin_of_blazing_UR.png`;

/** Print Cost and Power are provisional; combat uses lynGameplay. */
export const lynCommon: HeroCardData = {
  layout: 'hero-common',
  id: 'FE-028',
  name: 'Lyn',
  rarity: 'Common',
  cost: 3,
  power: 2000,
  heroTitle: 'Legendary Hero',
  characterType: lynGameplay.displayType,
  description: 'The swordswoman of Sacae strikes as swiftly as the wind.',
  image: commonCharacter,
  gameplay: lynGameplay,
};

export const lynUncommon: HeroCardData = {
  ...lynCommon,
  id: 'FE-029',
  rarity: 'U',
  image: sharedCharacter,
  artwork: {
    background: `${art}/backgrounds/bg-U-R.jpeg`,
    character: sharedCharacter,
  },
};

export const lynRare: HeroCardData = {
  ...lynUncommon,
  id: 'FE-030',
  rarity: 'R',
};

export const lynSuperRare: HeroCardData = {
  ...lynRare,
  id: 'FE-031',
  rarity: 'SR',
  image: srCharacter,
  artwork: {
    background: `${art}/backgrounds/bg-SR.jpeg`,
    character: srCharacter,
  },
};

export const lynUltraRare: HeroCardData = {
  ...lynSuperRare,
  id: 'FE-032',
  rarity: 'UR',
  heroTitle: 'Emblem Hero',
  image: urCharacter,
  artwork: {
    background: `${art}/backgrounds/BG-UR.webp`,
    character: urCharacter,
  },
};

export const lynCards: HeroCardData[] = [
  lynCommon,
  lynUncommon,
  lynRare,
  lynSuperRare,
  lynUltraRare,
];
