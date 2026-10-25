import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
after(() => server.close());
const { createStarterDeck, createStarterMatch } = await server.ssrLoadModule(
  '/src/gameplay/mvp/data/starterDeck.ts',
);
const { validateDeck, drawCards } = await server.ssrLoadModule(
  '/src/gameplay/mvp/state/deck.ts',
);
const { applyMatchAction } = await server.ssrLoadModule(
  '/src/gameplay/mvp/state/match.ts',
);
const { chooseBotAction } = await server.ssrLoadModule(
  '/src/gameplay/mvp/bot/testBot.ts',
);

const roll = () => 0.37;
const start = [
  [
    { instanceId: 'one-character-0', position: 1 },
    { instanceId: 'one-character-5', position: 2 },
  ],
  [
    { instanceId: 'two-character-2', position: 1 },
    { instanceId: 'two-character-3', position: 2 },
  ],
];
const make = (first = 'one') => createStarterMatch(first, start, roll);
const player = (state, id) => state.players.find((entry) => entry.id === id);
const total = (side) =>
  side.deck.length +
  side.hand.length +
  side.discard.length +
  side.board.filter(Boolean).length;

test('starter has 20 cards in 6/8/6 groups with unique characters and all Event types', () => {
  const cards = createStarterDeck('one', roll);
  assert.doesNotThrow(() => validateDeck(cards));
  assert.deepEqual(
    ['character', 'item', 'event'].map(
      (kind) => cards.filter((card) => card.kind === kind).length,
    ),
    [6, 8, 6],
  );
  assert.equal(
    new Set(
      cards
        .filter((card) => card.kind === 'character')
        .map((card) => card.cardId),
    ).size,
    6,
  );
  assert.deepEqual(
    new Set(
      cards.filter((card) => card.kind === 'event').map((card) => card.event),
    ),
    new Set(['heal', 'rally', 'stance', 'retreat']),
  );
  assert.equal(
    cards.filter((card) => card.kind === 'item' && card.weapon === 'Sword')
      .length,
    2,
  );
  assert.throws(
    () => validateDeck([...cards.slice(0, 1), cards[0], ...cards.slice(2)]),
    /instance ID/,
  );
  assert.throws(
    () =>
      validateDeck([
        ...cards.slice(0, 1),
        { ...cards[0], instanceId: 'other-copy' },
        ...cards.slice(2),
      ]),
    /character may only appear once/,
  );
});

test('setup reserves two Newly Deployed units and draws five; turns draw one, first player skips initial draw', () => {
  let state = make();
  for (const side of state.players) {
    assert.equal(side.board.filter(Boolean).length, 2);
    assert.equal(
      side.board.filter(Boolean).every((unit) => unit.newlyDeployed),
      true,
    );
    assert.equal(side.hand.length, 5);
    assert.equal(side.deck.length, 13);
    assert.equal(total(side), 20);
  }
  assert.throws(
    () =>
      applyMatchAction(state, { kind: 'move', fromPosition: 1, toPosition: 0 }),
    /Newly Deployed/,
  );
  state = applyMatchAction(state, { kind: 'end-turn' });
  assert.equal(player(state, 'two').deck.length, 12);
  assert.equal(player(state, 'one').deck.length, 13);
  state = applyMatchAction(state, { kind: 'end-turn' });
  assert.equal(player(state, 'one').deck.length, 12);
  assert.equal(player(state, 'one').board[1].newlyDeployed, false);
  assert.equal(total(player(state, 'one')), 20);
  assert.throws(
    () =>
      createStarterMatch('one', [[start[0][0], start[0][0]], start[1]], roll),
    /different starting cards and slots/,
  );
});

test('drawing moves cards without mutation or duplication; empty deck is safe', () => {
  const side = make().players[0];
  const before = structuredClone(side);
  const drawn = drawCards(side.deck, side.hand, 2);
  assert.equal(drawn.deck.length, 11);
  assert.equal(drawn.hand.length, 7);
  assert.equal(
    new Set([...drawn.deck, ...drawn.hand].map((card) => card.instanceId)).size,
    18,
  );
  assert.deepEqual(side, before);
  assert.deepEqual(drawCards([], drawn.hand, 1).drawn, []);
});

function putInHand(state, kind, predicate = () => true) {
  const side = player(state, state.activePlayerId);
  const card =
    side.deck.find((entry) => entry.kind === kind && predicate(entry)) ??
    side.hand.find((entry) => entry.kind === kind && predicate(entry));
  assert.ok(card, `missing ${kind}`);
  const changed = {
    ...side,
    deck: side.deck.filter((entry) => entry.instanceId !== card.instanceId),
    hand: side.hand.some((entry) => entry.instanceId === card.instanceId)
      ? side.hand
      : [...side.hand, card],
  };
  return [
    {
      ...state,
      players: state.players.map((entry) =>
        entry.id === side.id ? changed : entry,
      ),
    },
    card,
  ];
}

test('Item and Event cards must be in hand; used instances go to discard and cannot be replayed', () => {
  let state = make();
  state = applyMatchAction(applyMatchAction(state, { kind: 'end-turn' }), {
    kind: 'end-turn',
  });
  let item;
  [state, item] = putInHand(state, 'item', (entry) => entry.weapon === 'Lance');
  assert.throws(
    () =>
      applyMatchAction(state, { kind: 'equip', position: 1, weapon: 'Lance' }),
    /Item card from hand/,
  );
  state = applyMatchAction(state, {
    kind: 'equip',
    position: 1,
    weapon: 'Lance',
    handId: item.instanceId,
  });
  assert.equal(
    player(state, 'one').discard.some(
      (entry) => entry.instanceId === item.instanceId,
    ),
    true,
  );
  assert.equal(
    player(state, 'one').hand.some(
      (entry) => entry.instanceId === item.instanceId,
    ),
    false,
  );
  assert.throws(
    () =>
      applyMatchAction(state, {
        kind: 'equip',
        position: 2,
        weapon: 'Lance',
        handId: item.instanceId,
      }),
    /Item card from hand/,
  );
  let event;
  [state, event] = putInHand(state, 'event', (entry) => entry.event === 'heal');
  state = applyMatchAction(state, {
    kind: 'event',
    event: 'heal',
    position: 1,
    handId: event.instanceId,
  });
  assert.equal(
    player(state, 'one').discard.some(
      (entry) => entry.instanceId === event.instanceId,
    ),
    true,
  );
  assert.equal(total(player(state, 'one')), 20);
  state = applyMatchAction(applyMatchAction(state, { kind: 'end-turn' }), {
    kind: 'end-turn',
  });
  assert.throws(
    () =>
      applyMatchAction(state, {
        kind: 'event',
        event: 'heal',
        position: 1,
        handId: event.instanceId,
      }),
    /Event card from hand/,
  );
});

test('starter Item stays discarded after its weapon effect expires next turn', () => {
  let state = make();
  state = applyMatchAction(applyMatchAction(state, { kind: 'end-turn' }), {
    kind: 'end-turn',
  });
  let item;
  [state, item] = putInHand(state, 'item', (entry) => entry.weapon === 'Lance');
  state = applyMatchAction(state, {
    kind: 'equip',
    position: 1,
    weapon: 'Lance',
    handId: item.instanceId,
  });
  assert.equal(player(state, 'one').board[1].weapon, 'Lance');
  assert.equal(
    player(state, 'one').discard.some(
      (card) => card.instanceId === item.instanceId,
    ),
    true,
  );
  state = applyMatchAction(state, { kind: 'end-turn' });
  assert.equal(player(state, 'one').board[1].weapon, 'Lance');
  state = applyMatchAction(state, { kind: 'end-turn' });
  assert.equal(player(state, 'one').board[1].weapon, 'Sword');
  assert.equal(player(state, 'one').board[1].temporaryItemEquipped, false);
  assert.equal(
    player(state, 'one').discard.some(
      (card) => card.instanceId === item.instanceId,
    ),
    true,
  );
  assert.equal(total(player(state, 'one')), 20);
});

test('a second physical copy of an Event remains playable on a later turn', () => {
  let state = make();
  const events = createStarterDeck('one', roll).filter(
    (card) => card.kind === 'event',
  );
  const repeated = events.find(
    (card) => events.filter((entry) => entry.event === card.event).length > 1,
  );
  assert.ok(repeated);
  const copies = events.filter((card) => card.event === repeated.event);
  for (const copy of copies) {
    const side = player(state, 'one');
    const card =
      side.deck.find((entry) => entry.instanceId === copy.instanceId) ??
      side.hand.find((entry) => entry.instanceId === copy.instanceId);
    assert.ok(card);
    const changed = {
      ...side,
      deck: side.deck.filter((entry) => entry.instanceId !== card.instanceId),
      hand: side.hand.some((entry) => entry.instanceId === card.instanceId)
        ? side.hand
        : [...side.hand, card],
    };
    state = {
      ...state,
      players: state.players.map((entry) =>
        entry.id === 'one' ? changed : entry,
      ),
    };
    const position = player(state, 'one').board.findIndex(Boolean);
    state = applyMatchAction(state, {
      kind: 'event',
      event: copy.event,
      handId: copy.instanceId,
      position,
    });
    if (copy !== copies.at(-1)) {
      state = applyMatchAction(applyMatchAction(state, { kind: 'end-turn' }), {
        kind: 'end-turn',
      });
    }
  }
  assert.equal(
    player(state, 'one').discard.filter(
      (entry) => entry.kind === 'event' && entry.event === repeated.event,
    ).length,
    2,
  );
  assert.equal(total(player(state, 'one')), 20);
});

test('KO character enters discard and cannot be deployed again', () => {
  let state = make();
  state = applyMatchAction(state, { kind: 'end-turn' });
  const one = player(state, 'one');
  state = {
    ...state,
    players: state.players.map((side) =>
      side.id === 'one'
        ? {
            ...one,
            board: one.board.map((unit, index) =>
              index === 1 ? { ...unit, currentHp: 1 } : unit,
            ),
          }
        : side,
    ),
  };
  state = applyMatchAction(state, { kind: 'end-turn' });
  state = applyMatchAction(state, { kind: 'end-turn' });
  state = applyMatchAction(state, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.equal(player(state, 'one').board[1], null);
  const lost = player(state, 'one').discard.find(
    (entry) => entry.characterId === 'marth',
  );
  assert.equal(lost.currentHp, 0);
  assert.equal(total(player(state, 'one')), 20);
  assert.equal(
    player(state, 'one').hand.some(
      (entry) => entry.instanceId === lost.instanceId,
    ),
    false,
  );
});

test('starter bot chooses only legal actions from its own hand', () => {
  const state = make('two');
  const before = structuredClone(state);
  const action = chooseBotAction(state, 'two');
  assert.ok(action);
  assert.doesNotThrow(() => applyMatchAction(state, action));
  assert.deepEqual(state, before);
});

test('two starter bots preserve all 20 card instances through many turns', () => {
  let state = make('one');
  for (let step = 0; step < 150 && !state.winner; step++) {
    const action = chooseBotAction(state, state.activePlayerId);
    assert.ok(action);
    state = applyMatchAction(state, action);
    for (const side of state.players) {
      assert.equal(total(side), 20);
      const ids = [
        ...side.deck,
        ...side.hand,
        ...side.discard,
        ...side.board.filter(Boolean),
      ].map((card) => card.instanceId);
      assert.equal(new Set(ids).size, 20);
    }
  }
  assert.ok(state.turn > 5 || state.winner);
});
