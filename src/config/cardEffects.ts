import type { CardData } from '../types';

// Opt in one card, without changing the finish of other rarities.
export const SHOWCASE_CARD_ID = 'AW-030';
export const isShowcaseCard = (card: CardData) => card.id === SHOWCASE_CARD_ID;
export const holographicProfile = {
  rotateX: 7,
  rotateY: 9,
  perspective: 1100,
  depth: { background: 2, midground: 4, character: 7, foreground: 10 },
};
export const secretRevealTiming = { charge: 1000, flip: 600, settle: 1000 };
