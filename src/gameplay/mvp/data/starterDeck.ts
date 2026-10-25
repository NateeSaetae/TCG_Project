import { heroCards } from '../../../data/catalog';
import type { MvpAttackWeapon, MvpDeckCard } from '../types';
import { EVENT_TYPES, type EventType, type PlayerId } from '../state/match';
import { shuffleDeck } from '../state/deck';
import { createDeckMatch, type DeckPlayerSetup } from '../state/deckMatch';
import type { BattlefieldPosition } from '../types';

const characterIds = ['marth', 'roy', 'hector', 'ephraim', 'lilina', 'lyn'];
const itemWeapons: readonly MvpAttackWeapon[] = [
  'Sword',
  'Sword',
  'Axe',
  'Axe',
  'Lance',
  'Lance',
  'Bow',
  'Bow',
];

export function starterCharacterCards(
  playerId: PlayerId,
): Extract<MvpDeckCard, { kind: 'character' }>[] {
  return characterIds.map((characterId, index) => {
    const print = heroCards.find(
      (card) => card.gameplay?.id === characterId && card.rarity === 'Common',
    );
    if (!print) throw new Error(`Missing Common print for ${characterId}`);
    return {
      kind: 'character',
      instanceId: `${playerId}-character-${index}`,
      cardId: print.id,
    };
  });
}

/** Both players receive the same starter composition; two Event copies vary. */
export function createStarterDeck(
  playerId: PlayerId,
  random: () => number = Math.random,
): MvpDeckCard[] {
  const characters: MvpDeckCard[] = starterCharacterCards(playerId);
  const items: MvpDeckCard[] = itemWeapons.map((weapon, index) => ({
    kind: 'item',
    instanceId: `${playerId}-item-${index}`,
    weapon,
  }));
  const extraEvents = shuffleDeck(EVENT_TYPES, random).slice(0, 2);
  const events: MvpDeckCard[] = (
    [...EVENT_TYPES, ...extraEvents] as EventType[]
  ).map((event, index) => ({
    kind: 'event',
    instanceId: `${playerId}-event-${index}`,
    event,
  }));
  return [...characters, ...items, ...events];
}

export type StartingChoice = readonly [
  { instanceId: string; position: BattlefieldPosition },
  { instanceId: string; position: BattlefieldPosition },
];

/** Create two independent 20-card starter decks, then open the match. */
export function createStarterMatch(
  firstPlayerId: PlayerId,
  starting: readonly [StartingChoice, StartingChoice],
  random: () => number = Math.random,
) {
  const setups = (['one', 'two'] as const).map(
    (id, index): DeckPlayerSetup => ({
      id,
      cards: createStarterDeck(id, random),
      starting: starting[index],
    }),
  ) as [DeckPlayerSetup, DeckPlayerSetup];
  return createDeckMatch(setups, firstPlayerId, random, { rallyDamageCap: 3 });
}
