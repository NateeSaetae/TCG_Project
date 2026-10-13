import { heroCards } from './characters';

export { heroCards } from './characters';

/** Every card available in boosters and the collection. */
export const archiveCards = heroCards;
export const cardById = new Map(heroCards.map((card) => [card.id, card]));
