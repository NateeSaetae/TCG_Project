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
const { previewMatchAttack } = await server.ssrLoadModule(
  '/src/gameplay/mvp/state/attackPreview.ts',
);
const {
  beginActionAnimation,
  beginCombatAnimation,
  combatAnimationSteps,
  damagePopupLabel,
} = await server.ssrLoadModule('/src/gameplay/mvp/ui/combatAnimation.ts');
const { visiblePlayers } = await server.ssrLoadModule(
  '/src/gameplay/mvp/ui/sandboxView.ts',
);
const attack = { kind: 'attack', attackerPosition: 1, targetPosition: 1 };

test('animation follows engine damage and counter order without another calculation', () => {
  const state = createTestMatch();
  const preview = previewMatchAttack(state, attack);
  const session = beginCombatAnimation(state, preview, false);
  assert.deepEqual(
    session.steps.map((step) => step.kind),
    ['strike', 'damage', 'strike', 'damage'],
  );
  assert.equal(session.steps[1].damage, 3);
  assert.equal(session.steps[1].advantage, true);
  assert.equal(session.steps[3].damage, 2);
  assert.equal(session.steps[3].advantage, false);
  assert.equal(
    session.after.players[1].board[1].currentHp,
    preview.defenderHpAfter,
  );
  assert.equal(
    session.after.players[0].board[1].currentHp,
    preview.attackerHpAfter,
  );
  assert.equal(session.after.players[0].mainActions, 2);
  assert.equal(state.players[0].mainActions, 3);
  assert.throws(
    () => beginCombatAnimation(state, preview, true),
    /in progress/,
  );
  assert.throws(
    () => beginCombatAnimation(session.after, preview, false),
    /stale/,
  );
});

test('KO fades the original unit before revealing the committed discard state', () => {
  const state = createTestMatch();
  const weak = structuredClone(state);
  weak.players[1].board[1].currentHp = 2;
  const victimId = weak.players[1].board[1].instanceId;
  const preview = previewMatchAttack(weak, attack);
  const session = beginCombatAnimation(weak, preview, false);
  assert.deepEqual(
    session.steps.map((step) => step.kind),
    ['strike', 'damage', 'ko'],
  );
  assert.equal(session.before.players[1].board[1].instanceId, victimId);
  assert.equal(session.after.players[1].board[1], null);
  assert.equal(
    session.after.players[1].discard.filter(
      (card) => card.instanceId === victimId,
    ).length,
    1,
  );
  assert.equal(session.after.players[0].board[1].currentHp, 10);
  assert.equal(session.after.players[0].kos, 1);
});

test('damage popups use post-reduction values, including zero, and counters can KO', () => {
  const state = createTestMatch();
  const reduced = structuredClone(state);
  reduced.players[1].board[1].defensiveStance = true;
  const preview = previewMatchAttack(reduced, attack);
  assert.equal(combatAnimationSteps(preview)[1].damage, 2);
  assert.equal(damagePopupLabel(2), '-2');
  assert.equal(damagePopupLabel(0), '0');

  const weakAttacker = structuredClone(state);
  weakAttacker.players[0].board[1].currentHp = 1;
  const counter = previewMatchAttack(weakAttacker, attack);
  assert.deepEqual(
    combatAnimationSteps(counter).map((step) => step.kind),
    ['strike', 'damage', 'strike', 'damage', 'ko'],
  );
  const session = beginCombatAnimation(weakAttacker, counter, false);
  assert.equal(session.after.players[0].board[1], null);
  assert.equal(
    session.after.players[0].discard.filter(
      (card) => card.instanceId === counter.attacker.instanceId,
    ).length,
    1,
  );
});

test('bot perspective keeps player one and only their hand in the friendly view', () => {
  const state = createTestMatch('two');
  const botView = visiblePlayers(state, 'bot');
  assert.equal(botView.friendly.id, 'one');
  assert.equal(botView.enemy.id, 'two');
  assert.equal(botView.friendly.hand, state.players[0].hand);
  assert.equal(visiblePlayers(state, 'local').friendly.id, 'two');
  const botPreview = previewMatchAttack(state, attack);
  const session = beginCombatAnimation(state, botPreview, false, 'enemy');
  assert.equal(session.steps[0].source, 'enemy');
  assert.equal(session.steps[1].target, 'friendly');
  assert.equal(session.steps[2].source, 'friendly');
});

test('deploy, move, swap, equip, event and end turn have one committed visual cue', () => {
  const state = createTestMatch();
  const actions = [
    {
      kind: 'deploy',
      handId: state.players[0].hand[0].instanceId,
      position: 0,
    },
    { kind: 'move', fromPosition: 1, toPosition: 0 },
    { kind: 'swap', fromPosition: 1, toPosition: 2 },
    { kind: 'equip', position: 1, weapon: 'Lance' },
    { kind: 'event', event: 'heal', position: 1 },
    { kind: 'end-turn' },
  ];
  for (const action of actions) {
    const session = beginActionAnimation(state, action, false, 'enemy');
    assert.equal(session.before, state);
    assert.equal(session.steps.length, 1);
    assert.equal(session.steps[0].kind, 'action');
    assert.equal(session.steps[0].side, 'enemy');
    assert.match(session.label, /\S/);
    assert.notEqual(session.after, state);
    assert.ok(session.after.log.length > state.log.length);
    assert.throws(
      () => beginActionAnimation(state, action, true),
      /in progress/,
    );
  }
  assert.equal(state.players[0].board[0], null);
  assert.equal(state.players[0].mainActions, 3);
});
