import type { Rarity } from './index';

/** New presentation model; deliberately separate from the legacy pack catalog. */
export interface HeroCardData {
  layout: 'hero-common';
  id: string;
  name: string;
  rarity: Rarity;
  cost: number;
  power: number;
  characterType: string;
  description: string;
  image: string;
  imagePosition?: string;
}
