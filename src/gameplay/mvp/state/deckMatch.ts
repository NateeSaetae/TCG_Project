import type {
  BattlefieldPosition,
  MvpBattlefield,
  MvpDeckCard,
} from '../types';
import { isBattlefieldPosition } from '../rules/combat';
import { createCombatant, drawCards, shuffleDeck, validateDeck } from './deck';
import type { MatchState, PlayerId, PlayerState } from './match';

export interface DeckPlayerSetup {
  id: PlayerId;
  cards: readonly MvpDeckCard[];
  starting: readonly [
    { instanceId: string; position: BattlefieldPosition },
    { instanceId: string; position: BattlefieldPosition },
  ];
}

export function createDeckMatch(
  setups: readonly [DeckPlayerSetup, DeckPlayerSetup],
  firstPlayerId: PlayerId,
  random: () => number,
  options: { rallyDamageCap: number },
): MatchState {
  if (
    setups[0].id === setups[1].id ||
    !setups.some((setup) => setup.id === firstPlayerId)
  )
    throw new Error('Choose two different players and a valid first player');
  if (
    !Number.isSafeInteger(options.rallyDamageCap) ||
    options.rallyDamageCap < 1
  )
    throw new Error('Set a positive test damage cap');
  const allIds = setups.flatMap((setup) =>
    setup.cards.map((card) => card.instanceId),
  );
  if (new Set(allIds).size !== allIds.length)
    throw new Error('Card instance IDs must be unique across both players');

  const players = setups.map((setup): PlayerState => {
    validateDeck(setup.cards);
    const [first, second] = setup.starting;
    if (
      first.instanceId === second.instanceId ||
      !isBattlefieldPosition(first.position) ||
      !isBattlefieldPosition(second.position) ||
      first.position === second.position
    )
      throw new Error('Select two different starting cards and slots');
    const board = [null, null, null, null, null] as (ReturnType<
      typeof createCombatant
    > | null)[];
    for (const selection of setup.starting) {
      const card = setup.cards.find(
        (entry) => entry.instanceId === selection.instanceId,
      );
      if (!card || card.kind !== 'character')
        throw new Error(
          'Starting units must be Character cards from this deck',
        );
      board[selection.position] = {
        ...createCombatant(card),
        newlyDeployed: true,
      };
    }
    const remaining = setup.cards.filter(
      (card) =>
        card.instanceId !== first.instanceId &&
        card.instanceId !== second.instanceId,
    );
    const opening = drawCards(shuffleDeck(remaining, random), [], 5);
    return {
      id: setup.id,
      board: board as unknown as MvpBattlefield,
      deck: opening.deck,
      hand: opening.hand,
      discard: [],
      deckMode: true,
      mainActions: 3,
      itemActions: 3,
      attacks: 0,
      repositions: 0,
      eventUsedThisTurn: false,
      availableEvents: [],
      kos: 0,
    };
  }) as [PlayerState, PlayerState];
  return {
    players,
    activePlayerId: firstPlayerId,
    turn: 1,
    winner: null,
    rallyDamageCap: options.rallyDamageCap,
    log: [
      `Player ${firstPlayerId} begins. Opening hands drawn; first player skips the first-turn draw.`,
    ],
  };
}
