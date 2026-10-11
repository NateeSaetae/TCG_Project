import { marthCards } from '../data/catalog';
import { PACK_SIZE, rank, rarityName, rarityWeights } from '../config/rarity';
import type { HeroCardData } from '../types/heroCard';
import type { Rarity } from '../types';

export interface PackOptions {
  forceRarity?: Rarity;
  forceCardId?: string;
}

export function selectWeightedRarity(
  available: readonly HeroCardData[],
  random: () => number,
): Rarity {
  const tiers = Object.entries(rarityWeights).filter(
    ([rarity, weight]) =>
      weight > 0 &&
      available.some((card) => rarityName(card.rarity) === rarity),
  );
  const total = tiers.reduce((sum, [, weight]) => sum + weight, 0);
  if (!total) throw new Error('No eligible cards: check rarity configuration');
  let roll = random() * total;
  return (tiers.find(([, weight]) => (roll -= weight) < 0)?.[0] ??
    tiers.at(-1)![0]) as Rarity;
}

/** One optional forced first pull is for development previews only. */
export function generatePack(
  random: () => number = Math.random,
  options: PackOptions = {},
): HeroCardData[] {
  const selected: HeroCardData[] = [];
  for (let slot = 0; slot < PACK_SIZE; slot++) {
    const available = marthCards.filter(
      (card) =>
        slot !== PACK_SIZE - 1 ||
        selected.some((chosen) => rank(chosen.rarity) >= 2) ||
        rank(card.rarity) >= 2,
    );
    if (slot === 0 && options.forceCardId) {
      const forced = available.find((card) => card.id === options.forceCardId);
      if (!forced) throw new Error('Unknown forced card ID');
      selected.push(forced);
      continue;
    }
    if (slot === 0 && options.forceRarity) {
      const forced = available.find(
        (card) => rarityName(card.rarity) === options.forceRarity,
      );
      if (!forced) throw new Error('Unavailable forced rarity');
      selected.push(forced);
      continue;
    }
    const rarity = selectWeightedRarity(available, random);
    const pool = available.filter((card) => rarityName(card.rarity) === rarity);
    selected.push(
      pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))],
    );
  }
  return selected.sort((a, b) => rank(a.rarity) - rank(b.rarity));
}
