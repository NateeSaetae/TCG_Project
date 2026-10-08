import { cards } from '../data/cards';
import { PACK_SIZE, rank, rarityWeights } from '../config/rarity';
import type { CardData } from '../types';
export function generatePack(random: () => number = Math.random): CardData[] {
  const selected: CardData[] = [];
  for (let slot = 0; slot < PACK_SIZE; slot++) {
    const available = cards.filter(
      (c) =>
        !selected.some((s) => s.id === c.id) &&
        (slot !== PACK_SIZE - 1 ||
          selected.some((s) => rank(s.rarity) >= 2) ||
          rank(c.rarity) >= 2),
    );
    const tiers = Object.entries(rarityWeights).filter(
      ([r, w]) => w > 0 && available.some((c) => c.rarity === r),
    );
    const total = tiers.reduce((sum, [, w]) => sum + w, 0);
    if (!total)
      throw new Error('No eligible cards: check rarity configuration');
    let roll = random() * total;
    const rarity =
      tiers.find(([, w]) => (roll -= w) < 0)?.[0] ?? tiers.at(-1)![0];
    const pool = available.filter((c) => c.rarity === rarity);
    selected.push(
      pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))],
    );
  }
  return selected.sort((a, b) => rank(a.rarity) - rank(b.rarity));
}
