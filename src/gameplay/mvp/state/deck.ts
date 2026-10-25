import { cardById } from '../../../data/catalog';
import type { CharacterGameplayData } from '../../../types/combat';
import type {
  MvpAttackWeapon,
  MvpCombatant,
  MvpDeckCard,
  MvpHandCard,
} from '../types';
import { MVP_MAX_HP } from '../rules/combat';

export function validateDeck(cards: readonly MvpDeckCard[]): void {
  if (cards.length !== 20) throw new Error('A deck must contain 20 cards');
  if (
    cards.filter((card) => card.kind === 'character').length !== 6 ||
    cards.filter((card) => card.kind === 'item').length !== 8 ||
    cards.filter((card) => card.kind === 'event').length !== 6
  )
    throw new Error('A starter deck needs 6 Characters, 8 Items and 6 Events');
  if (new Set(cards.map((card) => card.instanceId)).size !== cards.length)
    throw new Error('Every card instance ID must be unique');
  const characterIds = cards
    .filter((card) => card.kind === 'character')
    .map((card) => cardById.get(card.cardId)?.gameplay?.id);
  if (new Set(characterIds).size !== characterIds.length)
    throw new Error('A character may only appear once per deck');
  for (const card of cards) {
    if (!card.instanceId) throw new Error('Card instance ID is required');
    if (card.kind === 'character') {
      if (!cardById.get(card.cardId)?.gameplay)
        throw new Error(`Unknown playable character card: ${card.cardId}`);
    } else if (card.kind === 'item') {
      if (!['Sword', 'Lance', 'Axe', 'Bow', 'Magic'].includes(card.weapon))
        throw new Error('Unknown MVP weapon item');
    } else if (!['heal', 'rally', 'stance', 'retreat'].includes(card.event)) {
      throw new Error('Unknown MVP Event');
    }
  }
}

/** Fisher–Yates changes order only. Supply a seeded random function in tests. */
export function shuffleDeck<T>(cards: readonly T[], random: () => number): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1)
      throw new Error('Random source must return a value from 0 to below 1');
    const j = Math.floor(roll * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function attackWeapons(gameplay: CharacterGameplayData): MvpAttackWeapon[] {
  const weapons = gameplay.allowedWeapons.filter(
    (weapon): weapon is MvpAttackWeapon =>
      weapon === 'Sword' ||
      weapon === 'Lance' ||
      weapon === 'Axe' ||
      weapon === 'Bow' ||
      weapon === 'Magic',
  );
  if (!weapons.length) throw new Error(`No MVP weapon for ${gameplay.id}`);
  return weapons;
}

export function createCombatant(
  card: Extract<MvpDeckCard, { kind: 'character' }>,
): MvpCombatant {
  const gameplay = cardById.get(card.cardId)?.gameplay;
  if (!gameplay)
    throw new Error(`Unknown playable character card: ${card.cardId}`);
  const allowedWeapons = attackWeapons(gameplay);
  const baseWeapon =
    gameplay.id === 'lyn' && allowedWeapons.includes('Bow')
      ? 'Bow'
      : allowedWeapons[0];
  return {
    instanceId: card.instanceId,
    cardId: card.cardId,
    characterId: gameplay.id,
    currentHp: MVP_MAX_HP,
    allowedWeapons,
    baseWeapon,
    weapon: baseWeapon,
    temporaryItemEquipped: false,
    newlyDeployed: false,
    exhausted: false,
    itemUsedThisTurn: false,
    rally: false,
    defensiveStance: false,
  };
}

export function toHandCard(card: MvpDeckCard): MvpHandCard {
  return card.kind === 'character' ? createCombatant(card) : card;
}

export function drawCards(
  deck: readonly MvpDeckCard[],
  hand: readonly MvpHandCard[],
  count: number,
): { deck: MvpDeckCard[]; hand: MvpHandCard[]; drawn: MvpHandCard[] } {
  if (!Number.isSafeInteger(count) || count < 0)
    throw new Error('Draw count must be a nonnegative integer');
  const drawn = deck.slice(0, count).map(toHandCard);
  return {
    deck: deck.slice(drawn.length),
    hand: [...hand, ...drawn],
    drawn,
  };
}

export function isCombatant(card: MvpHandCard): card is MvpCombatant {
  return 'characterId' in card;
}
