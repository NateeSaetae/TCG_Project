import type { HeroCardData } from '../../../types/heroCard';
import { hectorGameplay } from './hectorGameplay';

const art = '/art/aether/heroes/Hector';
const commonCharacter = `${art}/characters/hector_C.png`;
const sharedCharacter = `${art}/characters/hector_U-R.png`;
const srCharacter = `${art}/characters/hector_SR.png`;
const urCharacter = `${art}/characters/hector_UR.png`;
const background = `${art}/backgrounds/BG-UR.webp`;
const background_U_R = `${art}/backgrounds/bg-U-R.jpeg`;
const background_SR = `${art}/backgrounds/bg-SR.jpeg`

/** Cost and Power are provisional print values; combat uses hectorGameplay. */
export const hectorCommon: HeroCardData = {
  layout: 'hero-common',
  id: 'FE-012',
  name: 'Hector',
  rarity: 'Common',
  cost: 3,
  power: 2000,
  heroTitle: 'Legendary Hero',
  characterType: hectorGameplay.displayType,
  description: 'The armored lord of Ostia stands firm against every foe.',
  image: commonCharacter,
  gameplay: hectorGameplay,
};

export const hectorUncommon: HeroCardData = {
  ...hectorCommon,
  id: 'FE-013',
  rarity: 'U',
  image: sharedCharacter,
  artwork: { background: background_U_R, character: sharedCharacter },
};

export const hectorRare: HeroCardData = {
  ...hectorUncommon,
  id: 'FE-014',
  rarity: 'R',
};

export const hectorSuperRare: HeroCardData = {
  ...hectorRare,
  id: 'FE-015',
  rarity: 'SR',
  image: srCharacter,
  artwork: { background: background_SR, character: srCharacter },
};

export const hectorUltraRare: HeroCardData = {
  ...hectorSuperRare,
  id: 'FE-016',
  rarity: 'UR',
  heroTitle: 'Emblem Hero',
  image: urCharacter,
  artwork: { background, character: urCharacter },
};

/** FE-017 can be used for Hector SER when its distinct artwork is available. */
export const hectorCards: HeroCardData[] = [
  hectorCommon,
  hectorUncommon,
  hectorRare,
  hectorSuperRare,
  hectorUltraRare,
];
