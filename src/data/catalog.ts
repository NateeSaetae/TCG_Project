import type { CardData } from '../types';
import type { HeroCardData } from '../types/heroCard';
import { cards } from './cards';
import { heroCards } from './characters';

export type CollectibleCard = CardData | HeroCardData;

export { heroCards } from './characters';

/** Keep earlier owned cards readable without adding them to new booster packs. */
export const archiveCards: CollectibleCard[] = [...heroCards, ...cards];
export const cardById = new Map(archiveCards.map((card) => [card.id, card]));
