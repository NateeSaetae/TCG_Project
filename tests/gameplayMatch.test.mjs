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
const { legalAttackTargets } = await server.ssrLoadModule(
  '/src/gameplay/mvp/ui/attackSelection.ts',
);
const { previewMatchAttack, confirmMatchAttack } = await server.ssrLoadModule(
  '/src/gameplay/mvp/state/attackPreview.ts',
);
const act = applyMatchAction;

test('development Sandbox renders starter setup before the battle', async () => {
  const { default: GameplaySandbox } = await server.ssrLoadModule(
    '/src/gameplay/mvp/ui/GameplaySandbox.tsx',
  );
  const html = renderToStaticMarkup(createElement(GameplaySandbox));
  assert.match(html, /Gameplay Sandbox/);
  assert.match(html, /Starting unit 1/);
  assert.match(html, /Player one/);
  assert.match(html, /Player two/);
  assert.match(html, /Test bot/);
  assert.match(html, /Start match/);
});
test('legal attack targets follow the engine for melee, Bow, and Magic without changing match state', () => {
  const initial = createTestMatch();
  const before = structuredClone(initial);
  assert.deepEqual(legalAttackTargets(initial, null), []);
  assert.deepEqual(legalAttackTargets(initial, 1), [1]); // Marth: Sword
  assert.deepEqual(legalAttackTargets(initial, 2), [1]); // Lyn: Bow, not slot 2
  assert.deepEqual(initial, before);

  const magic = structuredClone(initial);
  magic.players[0].board[2] = magic.players[0].hand.find(
    (character) => character.characterId === 'lilina',
  );
  magic.players[1].board[3] = magic.players[1].board[2];
  assert.deepEqual(legalAttackTargets(magic, 2), [1, 2, 3]);
});

test('illegal attackers and defeated targets receive no legal-target highlight', () => {
  const initial = createTestMatch();
  for (const status of ['newlyDeployed', 'exhausted']) {
    const state = structuredClone(initial);
    state.players[0].board[1][status] = true;
    assert.deepEqual(legalAttackTargets(state, 1), []);
  }
  for (const [key, value] of [
    ['mainActions', 0],
    ['attacks', 2],
  ]) {
    const state = structuredClone(initial);
    state.players[0][key] = value;
    assert.deepEqual(legalAttackTargets(state, 1), []);
  }
  const noTarget = structuredClone(initial);
  noTarget.players[1].board[1] = null;
  assert.deepEqual(legalAttackTargets(noTarget, 1), []);
  const attacked = act(initial, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.deepEqual(legalAttackTargets(attacked, 1), []);
});

test('preview is non-mutating and matches a confirmed triangle attack and counter', () => {
  const state = createTestMatch();
  const before = structuredClone(state);
  const log = state.log;
  const preview = previewMatchAttack(state, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.deepEqual(state, before);
  assert.equal(state.log, log);
  assert.equal(preview.triangle, 'advantage');
  assert.equal(preview.attackDamage, 3);
  assert.equal(preview.counterattackPossible, true);
  assert.equal(preview.counterattackDamage, 2);
  assert.equal(preview.attackerHpAfter, 8);
  assert.equal(preview.defenderHpAfter, 7);
  const confirmed = confirmMatchAttack(state, preview);
  assert.equal(
    confirmed.players[0].board[1].currentHp,
    preview.attackerHpAfter,
  );
  assert.equal(
    confirmed.players[1].board[1].currentHp,
    preview.defenderHpAfter,
  );
  assert.equal(confirmed.players[0].mainActions, 2);
  assert.equal(confirmed.players[0].attacks, 1);
  assert.equal(state.players[0].mainActions, 3);
});

test('preview handles out-of-range counters, defender KO, and weapon disadvantage', () => {
  const state = createTestMatch();
  const bow = previewMatchAttack(state, {
    kind: 'attack',
    attackerPosition: 2,
    targetPosition: 1,
  });
  assert.equal(bow.attackDamage, 2);
  assert.equal(bow.counterattackPossible, false);
  assert.equal(bow.counterattackDamage, 0);
  assert.equal(bow.attackerHpAfter, 10);

  const weakDefender = structuredClone(state);
  weakDefender.players[1].board[1].currentHp = 1;
  const lethal = previewMatchAttack(weakDefender, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.equal(lethal.defenderHpAfter, 0);
  assert.equal(lethal.attackDamage, 3); // Full dealt damage, even when HP was 1
  assert.equal(lethal.counterattackPossible, false);
  assert.equal(lethal.attackerHpAfter, 10);
  const lethalResult = confirmMatchAttack(weakDefender, lethal);
  assert.match(lethalResult.log.at(-2), /attacked .* for 3/);

  const disadvantage = structuredClone(state);
  disadvantage.players[0].board[1].weapon = 'Axe';
  disadvantage.players[1].board[1].weapon = 'Sword';
  const preview = previewMatchAttack(disadvantage, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.equal(preview.triangle, 'disadvantage');
  assert.equal(preview.attackDamage, 2);
  assert.equal(preview.counterattackDamage, 3);
});

test('preview matches equipped weapon, Rally cap, and Defensive Stance timing', () => {
  let state = createTestMatch();
  state = act(state, { kind: 'equip', position: 1, weapon: 'Lance' });
  state = act(state, { kind: 'event', event: 'rally', position: 1 });
  const defender = {
    ...state.players[1],
    board: state.players[1].board.map((character, position) =>
      position === 1
        ? { ...character, weapon: 'Sword', defensiveStance: true }
        : character,
    ),
  };
  const attacker = {
    ...state.players[0],
    board: state.players[0].board.map((character, position) =>
      position === 1 ? { ...character, defensiveStance: true } : character,
    ),
  };
  state = { ...state, players: [attacker, defender] };
  const preview = previewMatchAttack(state, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.equal(preview.attacker.weapon, 'Lance');
  assert.equal(preview.attacker.rally, true);
  assert.equal(preview.defender.defensiveStance, true);
  assert.equal(preview.attackDamage, 2); // Lance > Sword: capped at 3, then Stance -1
  assert.equal(preview.counterattackDamage, 1); // Base 2, then Stance -1
  const confirmed = confirmMatchAttack(state, preview);
  assert.equal(
    confirmed.players[1].board[1].currentHp,
    preview.defenderHpAfter,
  );
  assert.equal(
    confirmed.players[0].board[1].currentHp,
    preview.attackerHpAfter,
  );
});

test('discarding a preview spends nothing; stale and illegal confirmations are rejected', () => {
  const state = createTestMatch();
  const preview = previewMatchAttack(state, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  // Cancel only discards UI preview state; it never dispatches an action.
  assert.equal(state.players[0].mainActions, 3);
  assert.equal(state.players[0].attacks, 0);
  assert.equal(state.log.length, 1);
  const changed = act(state, { kind: 'event', event: 'heal', position: 1 });
  assert.throws(() => confirmMatchAttack(changed, preview), /stale/);
  assert.equal(changed.players[0].attacks, 0);
  const illegal = structuredClone(state);
  illegal.players[0].board[1].exhausted = true;
  assert.throws(
    () => previewMatchAttack(illegal, preview.action),
    /cannot attack/,
  );
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
  assert.equal(next.players[1].board[1].currentHp, 7); // Sword > Axe
  assert.equal(next.players[0].board[1].currentHp, 8); // Axe counters for 2
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
  assert.equal(next.players[1].board[1].currentHp, 8);
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
  assert.equal(state.players[0].board[1].currentHp, 9);
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

test('equipped Item weapon lasts through the opponent turn, then returns to the base weapon', () => {
  const initial = createTestMatch();
  assert.equal(initial.players[0].board[1].baseWeapon, 'Sword');
  assert.equal(initial.players[0].board[2].baseWeapon, 'Bow');
  let state = act(initial, { kind: 'equip', position: 1, weapon: 'Lance' });
  assert.equal(state.players[0].board[1].weapon, 'Lance');
  assert.equal(state.players[0].board[1].temporaryItemEquipped, true);
  state = act(state, { kind: 'end-turn' });
  assert.equal(state.activePlayerId, 'two');
  assert.equal(state.players[0].board[1].weapon, 'Lance');
  state = act(state, {
    kind: 'attack',
    attackerPosition: 1,
    targetPosition: 1,
  });
  assert.equal(state.players[1].board[1].currentHp, 8); // Lance counters Axe for 2.
  assert.equal(state.players[0].board[1].currentHp, 7); // Axe advantage deals 3.
  state = act(state, { kind: 'end-turn' });
  assert.equal(state.activePlayerId, 'one');
  assert.equal(state.players[0].board[1].weapon, 'Sword');
  assert.equal(state.players[0].board[1].temporaryItemEquipped, false);
  assert.equal(state.players[0].board[1].itemUsedThisTurn, false);
  assert.equal(initial.players[0].board[1].weapon, 'Sword');
});

test('temporary Item expires even when Tactical Retreat moves its character to hand', () => {
  let state = createTestMatch();
  const id = state.players[0].board[1].instanceId;
  state = act(state, { kind: 'equip', position: 1, weapon: 'Lance' });
  state = act(state, { kind: 'event', event: 'retreat', position: 1 });
  assert.equal(
    state.players[0].hand.find((card) => card.instanceId === id).weapon,
    'Lance',
  );
  state = act(act(state, { kind: 'end-turn' }), { kind: 'end-turn' });
  const returned = state.players[0].hand.find((card) => card.instanceId === id);
  assert.equal(returned.weapon, 'Sword');
  assert.equal(returned.temporaryItemEquipped, false);
  state = act(state, { kind: 'deploy', handId: id, position: 0 });
  assert.equal(state.players[0].board[0].weapon, 'Sword');
});

test('automatic turn end keeps the Item through the opponent turn, then expires it', () => {
  let state = createTestMatch();
  state = act(state, { kind: 'equip', position: 1, weapon: 'Lance' });
  state = act(state, { kind: 'event', event: 'heal', position: 1 });
  state = act(state, { kind: 'move', fromPosition: 1, toPosition: 0 });
  state = act(state, { kind: 'move', fromPosition: 2, toPosition: 3 });
  assert.equal(state.activePlayerId, 'two');
  assert.equal(state.players[0].board[0].weapon, 'Lance');
  state = act(state, { kind: 'end-turn' });
  assert.equal(state.players[0].board[0].weapon, 'Sword');
});
