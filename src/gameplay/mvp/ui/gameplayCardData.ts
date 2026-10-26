import { cardById, heroCards } from '../../../data/catalog';
import type { HeroCardData } from '../../../types/heroCard';
import type { MvpCombatant } from '../types';

const commonByCharacter = new Map<string, HeroCardData>();
for (const card of heroCards) {
  const id = card.gameplay?.id;
  if (id && !commonByCharacter.has(id)) commonByCharacter.set(id, card);
}

/** Keep the physical print of this instance; older test units can fall back to Common. */
export function cardForCombatant(unit: MvpCombatant): HeroCardData | undefined {
  return (
    (unit.cardId ? cardById.get(unit.cardId) : undefined) ??
    commonByCharacter.get(unit.characterId)
  );
}

export function nameOfCombatant(unit: MvpCombatant): string {
  return cardForCombatant(unit)?.name ?? unit.characterId;
}
