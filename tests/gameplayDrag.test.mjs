import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
after(() => server.close());
const { createStarterMatch } = await server.ssrLoadModule(
  '/src/gameplay/mvp/data/starterDeck.ts',
);
const { toHandCard } = await server.ssrLoadModule(
  '/src/gameplay/mvp/state/deck.ts',
);
const { applyMatchAction } = await server.ssrLoadModule(
  '/src/gameplay/mvp/state/match.ts',
);
const { actionForDrop, legalDropTargets } = await server.ssrLoadModule(
  '/src/gameplay/mvp/ui/dragActions.ts',
);
const { previewMatchAttack, confirmMatchAttack } = await server.ssrLoadModule(
  '/src/gameplay/mvp/state/attackPreview.ts',
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
const make = () => createStarterMatch('one', start, roll);
const active = (state) =>
  state.players.find((player) => player.id === state.activePlayerId);
const friend = (position) => ({ side: 'friendly', position });
const enemy = (position) => ({ side: 'enemy', position });
const boardSource = (state, position) => ({
  kind: 'board',
  position,
  instanceId: active(state).board[position].instanceId,
});
const legal = (state, source, target) =>
  legalDropTargets(state, source).some(
    (entry) => entry.side === target.side && entry.position === target.position,
  );

function cardInHand(state, kind, predicate = () => true) {
  const side = active(state);
  const card =
    side.deck.find((entry) => entry.kind === kind && predicate(entry)) ??
    side.hand.find(
      (entry) =>
        (entry.kind === kind || (kind === 'character' && entry.characterId)) &&
        predicate(entry),
    );
  assert.ok(card);
  const changed = {
    ...side,
    deck: side.deck.filter((entry) => entry.instanceId !== card.instanceId),
    hand: side.hand.some((entry) => entry.instanceId === card.instanceId)
      ? side.hand
      : [...side.hand, card],
  };
  const handCard = card.kind === 'character' ? toHandCard(card) : card;
  changed.hand = changed.hand.map((entry) =>
    entry.instanceId === card.instanceId ? handCard : entry,
  );
  return [
    {
      ...state,
      players: state.players.map((entry) =>
        entry.id === side.id ? changed : entry,
      ),
    },
    handCard,
  ];
}

test('dragging a hand Character maps to Deploy only on legal empty slots', () => {
  let state = make();
  let card;
  [state, card] = cardInHand(state, 'character');
  const source = { kind: 'hand', instanceId: card.instanceId };
  const before = structuredClone(state);
  assert.equal(legal(state, source, friend(0)), true);
  assert.equal(legal(state, source, friend(1)), false);
  assert.equal(actionForDrop(state, source, enemy(0)), null);
  assert.deepEqual(state, before);
  assert.throws(
    () => applyMatchAction(state, actionForDrop(state, source, friend(1))),
    /empty board slot/,
  );
  const next = applyMatchAction(state, actionForDrop(state, source, friend(0)));
  assert.equal(next.players[0].board[0].instanceId, card.instanceId);
  assert.equal(next.players[0].board[0].newlyDeployed, true);
  assert.equal(
    next.players[0].hand.some((entry) => entry.instanceId === card.instanceId),
    false,
  );
  assert.equal(next.players[0].mainActions, 2);
});

test('Item and Event drops use hand instances, existing action limits and discard', () => {
  let state = applyMatchAction(applyMatchAction(make(), { kind: 'end-turn' }), {
    kind: 'end-turn',
  });
  let item;
  [state, item] = cardInHand(
    state,
    'item',
    (entry) => entry.weapon === 'Lance',
  );
  const itemSource = { kind: 'hand', instanceId: item.instanceId };
  assert.equal(legal(state, itemSource, friend(1)), true);
  assert.equal(legal(state, itemSource, friend(0)), false);
  const equipped = applyMatchAction(
    state,
    actionForDrop(state, itemSource, friend(1)),
  );
  assert.equal(equipped.players[0].itemActions, 2);
  assert.equal(
    equipped.players[0].discard.some(
      (entry) => entry.instanceId === item.instanceId,
    ),
    true,
  );
  let event;
  [state, event] = cardInHand(
    equipped,
    'event',
    (entry) => entry.event === 'heal',
  );
  const eventSource = { kind: 'hand', instanceId: event.instanceId };
  assert.equal(legal(state, eventSource, friend(1)), true);
  assert.equal(legal(state, eventSource, friend(0)), false);
  const used = applyMatchAction(
    state,
    actionForDrop(state, eventSource, friend(1)),
  );
  assert.equal(used.players[0].eventUsedThisTurn, true);
  assert.equal(
    used.players[0].discard.some(
      (entry) => entry.instanceId === event.instanceId,
    ),
    true,
  );
  assert.equal(legal(used, eventSource, friend(1)), false);
});

test('board drag maps adjacent empty to Move and occupied to Swap; restrictions stay in engine', () => {
  let state = make();
  let source = boardSource(state, 1);
  assert.equal(legal(state, source, friend(0)), false); // Starting units are Newly Deployed.
  state = applyMatchAction(applyMatchAction(state, { kind: 'end-turn' }), {
    kind: 'end-turn',
  });
  source = boardSource(state, 1);
  assert.equal(actionForDrop(state, source, friend(1)), null);
  assert.equal(legal(state, source, friend(0)), true);
  assert.equal(legal(state, source, friend(2)), true);
  assert.equal(legal(state, source, friend(4)), false);
  const moved = applyMatchAction(
    state,
    actionForDrop(state, source, friend(0)),
  );
  assert.equal(moved.players[0].board[0].instanceId, source.instanceId);
  assert.equal(moved.players[0].board[1], null);
  const swapped = applyMatchAction(
    state,
    actionForDrop(state, source, friend(2)),
  );
  assert.equal(swapped.players[0].board[2].instanceId, source.instanceId);
  assert.equal(swapped.players[0].board[1].characterId, 'lyn');
  const exhausted = structuredClone(state);
  exhausted.players[0].board[1].exhausted = true;
  assert.equal(legal(exhausted, boardSource(exhausted, 1), friend(0)), false);
  assert.equal(legal(exhausted, boardSource(exhausted, 1), enemy(1)), false);
});

test('attack drop opens the existing non-mutating preview; cancel spends no action', () => {
  let state = applyMatchAction(applyMatchAction(make(), { kind: 'end-turn' }), {
    kind: 'end-turn',
  });
  const source = boardSource(state, 1);
  assert.equal(legal(state, source, enemy(1)), true);
  assert.equal(legal(state, source, enemy(2)), false);
  const action = actionForDrop(state, source, enemy(1));
  const before = structuredClone(state);
  const preview = previewMatchAttack(state, action);
  assert.equal(preview.attackDamage, 3);
  assert.deepEqual(state, before); // Cancel simply leaves the state as-is.
  const confirmed = confirmMatchAttack(state, preview);
  assert.equal(confirmed.players[0].mainActions, 2);
  assert.equal(
    confirmed.players[1].board[1].currentHp,
    preview.defenderHpAfter,
  );
});
