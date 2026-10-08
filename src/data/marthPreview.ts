import type { HeroCardData } from '../types/heroCard';

// Development fixture only. Do not add to the pack catalog without a migration plan.
export const marthPreview: HeroCardData = {
  layout: 'hero-common',
  id: 'FE-001',
  name: 'Marth',
  rarity: 'Common',
  cost: 3,
  power: 2000,
  characterType: 'Hero · Swordsman',
  description: 'The prince of Altea, destined to wield the legendary Falchion.',
  image: '/art/aether/characters/marth_hero-king.png',
  imagePosition: '50% 50%',
};
