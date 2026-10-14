import type { HeroCardData } from '../../../types/heroCard';
import { lilinaGameplay } from './lilinaGameplay';

const art = '/art/aether/heroes/Lilina';
const commonCharacter = `${art}/characters/lilina_delightful_noble_C.png`;
const sharedCharacter = `${art}/characters/lilina_delightful_noble_U-R.png`;
const srCharacter = `${art}/characters/lilina_delightful_noble_SR.png`;
const urCharacter = `${art}/characters/lilina_firelight_leader_UR.png`;

/** Print Cost and Power are provisional; combat uses lilinaGameplay. */
export const lilinaCommon: HeroCardData = {
  layout: 'hero-common',
  id: 'FE-023',
  name: 'Lilina',
  rarity: 'Common',
  cost: 3,
  power: 2000,
  heroTitle: 'Legendary Hero',
  characterType: lilinaGameplay.displayType,
  description: 'The young mage of Ostia carries the flame of her homeland.',
  image: commonCharacter,
  gameplay: lilinaGameplay,
};

export const lilinaUncommon: HeroCardData = {
  ...lilinaCommon,
  id: 'FE-024',
  rarity: 'U',
  image: sharedCharacter,
  artwork: {
    background: `${art}/backgrounds/bg-U-R.png`,
    character: sharedCharacter,
  },
};

export const lilinaRare: HeroCardData = {
  ...lilinaUncommon,
  id: 'FE-025',
  rarity: 'R',
};

export const lilinaSuperRare: HeroCardData = {
  ...lilinaRare,
  id: 'FE-026',
  rarity: 'SR',
  image: srCharacter,
  artwork: {
    background: `${art}/backgrounds/bg-SR.webp`,
    character: srCharacter,
  },
};

export const lilinaUltraRare: HeroCardData = {
  ...lilinaSuperRare,
  id: 'FE-027',
  rarity: 'UR',
  heroTitle: 'Emblem Hero',
  image: urCharacter,
  artwork: {
    background: `${art}/backgrounds/BG-UR.webp`,
    character: urCharacter,
  },
};

export const lilinaCards: HeroCardData[] = [
  lilinaCommon,
  lilinaUncommon,
  lilinaRare,
  lilinaSuperRare,
  lilinaUltraRare,
];
