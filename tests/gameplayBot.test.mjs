import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
after(() => server.close());

const { createTestMatch } = await server.ssrLoadModule(
  '/src/gameplay/mvp/data/testMatch.ts',
);
const { applyMatchAction } = await server.ssrLoadModule(
  '/src/gameplay/mvp/state/match.ts',
);
const { chooseBotAction } = await server.ssrLoadModule(
  '/src/gameplay/mvp/bot/testBot.ts',
);

test('bot only acts on its own turn and does not mutate the match while deciding', () => {
  const humanTurn = createTestMatch('one');
  assert.equal(chooseBotAction(humanTurn), null);
  const botTurn = createTestMatch('two');
  const before = structuredClone(botTurn);
  const action = chooseBotAction(botTurn);
  assert.ok(action);
  assert.deepEqual(botTurn, before);
  assert.doesNotThrow(() => applyMatchAction(botTurn, action));
});

test('bot finishes a turn with legal actions and returns control to the human', () => {
  let state = createTestMatch('two');
  const choices = [];
  for (
    let step = 0;
    step < 8 && state.activePlayerId === 'two' && !state.winner;
    step++
  ) {
    const action = chooseBotAction(state);
    assert.ok(action);
    choices.push(action.kind);
    state = applyMatchAction(state, action);
  }
  assert.equal(state.activePlayerId, 'one');
  assert.ok(choices.length > 0 && choices.length <= 7);
  assert.ok(state.players.every((player) => player.board.length === 5));
});

test('bot takes a winning attack when the fifth KO is available', () => {
  const initial = createTestMatch('two');
  const bot = { ...initial.players[1], kos: 4 };
  const human = {
    ...initial.players[0],
    board: initial.players[0].board.map((character, position) =>
      position === 1 ? { ...character, currentHp: 1 } : character,
    ),
  };
  const state = { ...initial, players: [human, bot] };
  const action = chooseBotAction(state);
  assert.equal(action.kind, 'attack');
  const won = applyMatchAction(state, action);
  assert.equal(won.winner, 'two');
  assert.equal(chooseBotAction(won), null);
});

test('bot can deploy when no battlefield character can attack', () => {
  const initial = createTestMatch('two');
  const bot = {
    ...initial.players[1],
    board: initial.players[1].board.map((character) =>
      character ? { ...character, exhausted: true } : null,
    ),
  };
  const state = { ...initial, players: [initial.players[0], bot] };
  const action = chooseBotAction(state);
  assert.equal(action.kind, 'deploy');
  assert.doesNotThrow(() => applyMatchAction(state, action));
});

test('bot spends an Item Action when a weapon change improves an attack', () => {
  const initial = createTestMatch('two');
  const human = {
    ...initial.players[0],
    board: initial.players[0].board.map((character, position) =>
      position === 1 ? { ...character, weapon: 'Lance' } : character,
    ),
  };
  const bot = {
    ...initial.players[1],
    board: initial.players[1].board.map((character, position) =>
      position === 1 ? { ...character, weapon: 'Sword' } : character,
    ),
  };
  const action = chooseBotAction({ ...initial, players: [human, bot] });
  assert.deepEqual(action, { kind: 'equip', position: 1, weapon: 'Axe' });
});

test('bot moves toward an enemy when empty slots separate both sides', () => {
  const initial = createTestMatch('two');
  const human = {
    ...initial.players[0],
    board: initial.players[0].board.map((character, position) =>
      position === 4 ? initial.players[0].board[1] : null,
    ),
  };
  const bot = {
    ...initial.players[1],
    board: initial.players[1].board.map((character, position) =>
      position === 1 ? character : null,
    ),
    hand: [],
    availableEvents: [],
  };
  const state = { ...initial, players: [human, bot] };
  const action = chooseBotAction(state);
  assert.deepEqual(action, {
    kind: 'move',
    fromPosition: 1,
    toPosition: 2,
  });
  const next = applyMatchAction(state, action);
  assert.equal(next.players[1].board[1], null);
  assert.equal(next.players[1].board[2].characterId, 'hector');
});

test('bot swaps adjacent allies when it creates an attack opportunity', () => {
  const initial = createTestMatch('two');
  const human = {
    ...initial.players[0],
    board: initial.players[0].board.map((character, position) =>
      position === 2 ? initial.players[0].board[1] : null,
    ),
  };
  const lyn = initial.players[1].hand.find(
    (character) => character.characterId === 'lyn',
  );
  const bot = {
    ...initial.players[1],
    board: initial.players[1].board.map((character, position) =>
      position === 1 ? character : position === 2 ? lyn : null,
    ),
    hand: [],
    itemActions: 0,
    availableEvents: [],
  };
  const state = { ...initial, players: [human, bot] };
  const action = chooseBotAction(state);
  assert.deepEqual(action, {
    kind: 'swap',
    fromPosition: 1,
    toPosition: 2,
  });
  const next = applyMatchAction(state, action);
  assert.equal(next.players[1].board[1].characterId, 'lyn');
  assert.equal(next.players[1].board[2].characterId, 'hector');
});

test('two test bots can take many legal steps without stalling within a turn', () => {
  let state = createTestMatch('one');
  for (let step = 0; step < 100 && !state.winner; step++) {
    const beforeTurn = state.turn;
    const action = chooseBotAction(state, state.activePlayerId);
    assert.ok(action);
    state = applyMatchAction(state, action);
    assert.ok(state.turn >= beforeTurn);
    assert.ok(state.turn <= beforeTurn + 1);
  }
  assert.ok(state.turn > 5 || state.winner);
});
