import type { HeroCardData } from '../../types/heroCard';
import { marthCards } from './marth/marth';
import { royCards } from './roy/roy';
import { hectorCards } from './hector/hector';
import { ephraimCards } from './ephraim/ephraim';
import { lilinaCards } from './lilina/lilina';
import { lynCards } from './lyn/lyn';

// Register each character's card array here. Packs and the archive use the same pool.
const characterSets: readonly (readonly HeroCardData[])[] = [
  marthCards,
  royCards,
  hectorCards,
  ephraimCards,
  lilinaCards,
  lynCards,
];

export const heroCards: HeroCardData[] = characterSets.flatMap((cards) => [
  ...cards,
]);
