import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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
const act = applyMatchAction;

test('development Sandbox renders both boards and its playable action controls', async () => {
  const { default: GameplaySandbox } = await server.ssrLoadModule(
    '/src/gameplay/mvp/ui/GameplaySandbox.tsx',
  );
  const html = renderToStaticMarkup(createElement(GameplaySandbox));
  assert.match(html, /Gameplay Sandbox/);
  assert.match(html, /Player one battlefield/);
  assert.match(html, /Player two battlefield/);
  assert.match(html, /Test bot/);
  assert.match(html, /Move \/ Swap/);
  assert.match(html, /Swap with Lyn/);
  assert.match(html, /End Turn/);
});

test('test setup starts two selected heroes per side at 10 HP and picks first player explicitly', () => {
  const match = createTestMatch('two');
  assert.equal(match.activePlayerId, 'two');
  for (const player of match.players) {
    assert.equal(player.board.filter(Boolean).length, 2);
    assert.equal(player.hand.length, 3);
    assert.equal(player.board[1].currentHp, 10);
    assert.equal(player.board[2].currentHp, 10);
    assert.equal(player.mainActions, 3);
    assert.equal(player.itemActions, 3);
  }
});

test('attack uses MVP triangle damage, counters once without action cost, then exhausts attacker', () => {
  const initial = createTestMatch();
  const next = act(initial, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.equal(next.players[1].board[1].currentHp, 8); // Sword > Axe
  assert.equal(next.players[0].board[1].currentHp, 9); // Axe counters for 1
  assert.equal(next.players[0].board[1].exhausted, true);
  assert.equal(next.players[0].mainActions, 2);
  assert.equal(next.players[0].attacks, 1);
  assert.equal(next.players[1].mainActions, 3);
  assert.throws(
    () =>
      act(next, {
        kind: 'attack',
        attackerPosition: 1,
        targetPosition: 1,
      }),
    /cannot attack/,
  );
});

test('Bow attacks adjacent slots but an out-of-range surviving defender cannot counter', () => {
  const next = act(createTestMatch(), {
    kind: 'attack',
    attackerPosition: 2,
    targetPosition: 1,
  });
  assert.equal(next.players[1].board[1].currentHp, 9);
  assert.equal(next.players[0].board[2].currentHp, 10);
  assert.equal(
    next.log.some((entry) => entry.includes('counterattacked')),
    false,
  );
  assert.throws(
    () =>
      act(createTestMatch(), {
        kind: 'attack',
        attackerPosition: 2,
        targetPosition: 2,
      }),
    /outside weapon range/,
  );
});

test('deploy blocks actions by the new character, and three Main Actions end the turn', () => {
  const initial = createTestMatch();
  const deployed = act(initial, {
    kind: 'deploy',
    handId: initial.players[0].hand[0].instanceId,
    position: 3,
  });
  assert.equal(deployed.players[0].board[3].newlyDeployed, true);
  assert.throws(
    () =>
      act(deployed, {
        kind: 'attack',
        attackerPosition: 3,
        targetPosition: 1,
      }),
    /cannot attack/,
  );
  assert.throws(
    () =>
      act(deployed, {
        kind: 'equip',
        position: 3,
        weapon: 'Lance',
      }),
    /cannot use an Item Action/,
  );
  assert.throws(
    () =>
      act(deployed, {
        kind: 'move',
        fromPosition: 3,
        toPosition: 4,
      }),
    /cannot move/,
  );
  const firstItem = act(deployed, {
    kind: 'equip',
    position: 1,
    weapon: 'Lance',
  });
  assert.equal(firstItem.players[0].itemActions, 2);
  assert.throws(
    () =>
      act(firstItem, {
        kind: 'equip',
        position: 1,
        weapon: 'Axe',
      }),
    /cannot use an Item Action/,
  );
  const second = act(firstItem, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  const third = act(second, {
    kind: 'attack',
    attackerPosition: 2,
    targetPosition: 1,
  });
  assert.equal(third.activePlayerId, 'two');
  assert.equal(third.players[0].itemActions, 0); // unused Item Actions are forfeited
  assert.equal(third.players[0].board[3].newlyDeployed, false);
});

test('newly deployed survivors counter automatically within range', () => {
  const initial = createTestMatch();
  const defendingPlayer = {
    ...initial.players[1],
    board: initial.players[1].board.map((character, position) =>
      position === 1 ? { ...character, newlyDeployed: true } : character,
    ),
  };
  const hit = act(
    { ...initial, players: [initial.players[0], defendingPlayer] },
    {
      kind: 'attack',
      attackerPosition: 1,
      targetPosition: 1,
    },
  );
  assert.equal(hit.players[1].board[1].newlyDeployed, true);
  assert.equal(
    hit.log.some((entry) => entry.includes('counterattacked')),
    true,
  );
});

test('Rally adds one to the next attack this turn, capped at three', () => {
  let state = act(createTestMatch(), {
    kind: 'event',
    event: 'rally',
    position: 1,
  });
  state = act(state, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.equal(state.players[1].board[1].currentHp, 7);
  assert.equal(state.players[0].board[1].rally, false);
  assert.throws(
    () =>
      act(state, {
        kind: 'event',
        event: 'heal',
        position: 1,
      }),
    /Only one Event/,
  );
});

test('Defensive Stance reduces the next counterattack and can target Exhausted heroes', () => {
  let state = act(createTestMatch(), {
    kind: 'event',
    event: 'stance',
    position: 1,
  });
  state = act(state, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.equal(state.players[0].board[1].currentHp, 10);
  assert.equal(state.players[0].board[1].defensiveStance, false);
  assert.throws(
    () =>
      act(state, {
        kind: 'event',
        event: 'heal',
        position: 1,
      }),
    /Only one Event/,
  );
  let exhausted = act(createTestMatch(), {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  exhausted = act(exhausted, { kind: 'event', event: 'stance', position: 1 });
  assert.equal(exhausted.players[0].board[1].exhausted, true);
  assert.equal(exhausted.players[0].board[1].defensiveStance, true);
});

test('Heal caps at ten, Events are one-use per match, and Retreat preserves HP', () => {
  let state = createTestMatch();
  state = act(state, { kind: 'event', event: 'heal', position: 1 });
  assert.equal(state.players[0].board[1].currentHp, 10);
  state = act(state, { kind: 'end-turn' });
  state = act(state, { kind: 'end-turn' });
  assert.equal(state.players[0].availableEvents.includes('heal'), false);
  assert.throws(
    () =>
      act(state, {
        kind: 'event',
        event: 'heal',
        position: 1,
      }),
    /already been used/,
  );
  const hp = state.players[0].board[1].currentHp;
  state = act(state, { kind: 'event', event: 'retreat', position: 1 });
  assert.equal(state.players[0].board[1], null);
  assert.equal(state.players[0].hand.at(-1).currentHp, hp);
});

test('Move enters an adjacent empty slot and rejects occupied or distant slots', () => {
  const initial = createTestMatch();
  assert.throws(
    () =>
      act(initial, {
        kind: 'move',
        fromPosition: 1,
        toPosition: 3,
      }),
    /adjacent/,
  );
  assert.throws(
    () =>
      act(initial, {
        kind: 'move',
        fromPosition: 1,
        toPosition: 2,
      }),
    /must be empty/,
  );
  const moved = act(initial, {
    kind: 'move',
    fromPosition: 1,
    toPosition: 0,
  });
  assert.equal(moved.players[0].board[1], null);
  assert.equal(moved.players[0].board[0].characterId, 'marth');
  assert.equal(moved.players[0].board[2].characterId, 'lyn');
  assert.equal(moved.players[0].mainActions, 2);
  assert.equal(moved.players[0].repositions, 1);
});

test('Swap exchanges adjacent eligible allies and shares the reposition limit with Move', () => {
  const initial = createTestMatch();
  assert.throws(
    () => act(initial, { kind: 'swap', fromPosition: 1, toPosition: 0 }),
    /must contain a friendly character/,
  );
  assert.throws(
    () => act(initial, { kind: 'swap', fromPosition: 1, toPosition: 3 }),
    /adjacent/,
  );
  let state = act(initial, { kind: 'swap', fromPosition: 1, toPosition: 2 });
  assert.equal(state.players[0].board[1].characterId, 'lyn');
  assert.equal(state.players[0].board[2].characterId, 'marth');
  assert.equal(state.players[0].repositions, 1);
  assert.equal(state.players[0].mainActions, 2);
  state = act(state, { kind: 'move', fromPosition: 2, toPosition: 3 });
  assert.equal(state.players[0].repositions, 2);
  assert.throws(
    () => act(state, { kind: 'swap', fromPosition: 1, toPosition: 2 }),
    /Only two Move or Swap/,
  );
});

test('Swap rejects Newly Deployed or Exhausted characters on either side', () => {
  const initial = createTestMatch();
  const modified = {
    ...initial,
    players: [
      {
        ...initial.players[0],
        board: initial.players[0].board.map((character, position) =>
          position === 2 ? { ...character, newlyDeployed: true } : character,
        ),
      },
      initial.players[1],
    ],
  };
  assert.throws(
    () => act(modified, { kind: 'swap', fromPosition: 1, toPosition: 2 }),
    /cannot swap/,
  );
  assert.throws(
    () => act(modified, { kind: 'swap', fromPosition: 2, toPosition: 1 }),
    /cannot move or swap/,
  );
  const attacked = act(initial, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.throws(
    () => act(attacked, { kind: 'swap', fromPosition: 2, toPosition: 1 }),
    /cannot swap/,
  );
  assert.throws(
    () => act(attacked, { kind: 'swap', fromPosition: 1, toPosition: 2 }),
    /cannot move or swap/,
  );
});

test('Move obeys the two-per-turn limit and Exhausted restriction', () => {
  let state = createTestMatch();
  state = act(state, { kind: 'move', fromPosition: 1, toPosition: 0 });
  state = act(state, { kind: 'move', fromPosition: 2, toPosition: 3 });
  assert.equal(state.players[0].repositions, 2);
  assert.throws(
    () => act(state, { kind: 'move', fromPosition: 0, toPosition: 1 }),
    /Only two Move or Swap/,
  );
  let attacked = act(createTestMatch(), {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.throws(
    () => act(attacked, { kind: 'move', fromPosition: 1, toPosition: 0 }),
    /cannot move/,
  );
});

test('a defeated defender cannot counter; the fifth KO ends the match', () => {
  const initial = createTestMatch();
  const defendingPlayer = {
    ...initial.players[1],
    board: initial.players[1].board.map((character, position) =>
      position === 1 ? { ...character, currentHp: 2 } : character,
    ),
  };
  const scoringPlayer = { ...initial.players[0], kos: 4 };
  const final = act(
    { ...initial, players: [scoringPlayer, defendingPlayer] },
    {
      kind: 'attack',
      attackerPosition: 1,
      targetPosition: 1,
    },
  );
  assert.equal(final.players[1].board[1], null);
  assert.equal(final.players[0].board[1].currentHp, 10);
  assert.equal(final.players[0].kos, 5);
  assert.equal(final.winner, 'one');
  assert.equal(
    final.log.some((entry) => entry.includes('counterattacked')),
    false,
  );
  assert.throws(() => act(final, { kind: 'end-turn' }), /finished/);
});

test('turn change clears Exhausted and unused Rally', () => {
  let state = act(createTestMatch(), {
    kind: 'event',
    event: 'rally',
    position: 1,
  });
  state = act(state, { kind: 'end-turn' });
  assert.equal(state.players[0].board[1].rally, false);
  state = act(state, { kind: 'end-turn' });
  state = act(state, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.equal(state.players[0].board[1].exhausted, true);
  state = act(state, { kind: 'end-turn' });
  assert.equal(state.players[0].board[1].exhausted, false);
});
