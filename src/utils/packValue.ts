import { rarityName } from '../config/rarity';
import type { HeroCardData } from '../types/heroCard';
import type { Rarity } from '../types';

// Temporary play values in THB, unrelated to real market prices.
export const playPrices: Record<Rarity, number> = {
  Common: 10,
  Uncommon: 30,
  Rare: 100,
  'Super Rare': 350,
  'Ultra Rare': 1200,
  'Secret Rare': 5000,
};

export function valuePack(cards: HeroCardData[], random = Math.random) {
  return cards.map((card) => {
    const premium = random() < 0.05;
    const multiplier = 0.8 + random() * 0.4;
    return {
      price: Math.round(
        playPrices[rarityName(card.rarity)] * multiplier * (premium ? 1.5 : 1),
      ),
      premium,
    };
  });
}

export const formatPlayPrice = (price: number) =>
  '฿' + price.toLocaleString('th-TH');
