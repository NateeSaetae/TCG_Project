import type { CardData } from '../types';
import type { HeroCardData } from '../types/heroCard';
import { cards } from './cards';
import { marthPreview } from './marthPreview';
import { marthUncommonPreview } from './marthUncommonPreview';
import { marthRarePreview } from './marthRarePreview';
import { marthSuperRarePreview } from './marthSuperRarePreview';
import { marthUltraRarePreview } from './marthUltraRarePreview';
import { marthSecretRarePreview } from './marthSecretRarePreview';

export type CollectibleCard = CardData | HeroCardData;

/** The six approved card definitions are shared by previews, packs and archive. */
export const marthCards: HeroCardData[] = [
  marthPreview,
  marthUncommonPreview,
  marthRarePreview,
  marthSuperRarePreview,
  marthUltraRarePreview,
  marthSecretRarePreview,
];

/** Keep earlier owned cards readable without adding them to new booster packs. */
export const archiveCards: CollectibleCard[] = [...marthCards, ...cards];
export const cardById = new Map(archiveCards.map((card) => [card.id, card]));
