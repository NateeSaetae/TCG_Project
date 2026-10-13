import type { HeroCardData } from '../../types/heroCard';
import { marthCards } from './marth';
import { royCards } from './roy';

// Register each character's card array here. Packs and the archive use the same pool.
const characterSets: readonly (readonly HeroCardData[])[] = [
  marthCards,
  royCards,
];

export const heroCards: HeroCardData[] = characterSets.flatMap((cards) => [
  ...cards,
]);
