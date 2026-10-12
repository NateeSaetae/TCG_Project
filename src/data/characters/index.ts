import type { HeroCardData } from '../../types/heroCard';
import { marthCards } from './marth';

// Register each character's card array here. Packs and the archive use the same pool.
const characterSets: readonly (readonly HeroCardData[])[] = [marthCards];

export const heroCards: HeroCardData[] = characterSets.flatMap((cards) => [
  ...cards,
]);
