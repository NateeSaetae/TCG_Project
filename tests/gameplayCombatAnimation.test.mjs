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
const { visibleCardInstance } = await server.ssrLoadModule(
  '/src/gameplay/mvp/ui/sandboxView.ts',
);
const { createStarterMatch } = await server.ssrLoadModule(
  '/src/gameplay/mvp/data/starterDeck.ts',
);
const { heroCards } = await server.ssrLoadModule('/src/data/catalog.ts');
const { rarityName } = await server.ssrLoadModule('/src/config/rarity.ts');
const { cardForCombatant } = await server.ssrLoadModule(
  '/src/gameplay/mvp/ui/gameplayCardData.ts',
);
const { CardInspectionPanel } = await server.ssrLoadModule(
  '/src/gameplay/mvp/ui/CardInspectionPanel.tsx',
);
const { CardRenderer } = await server.ssrLoadModule(
  '/src/components/cards/CardRenderer.tsx',
);
const { ScaledHeroCard } = await server.ssrLoadModule(
  '/src/gameplay/mvp/ui/ScaledHeroCard.tsx',
);
const { GameplayPiles } = await server.ssrLoadModule(
  '/src/gameplay/mvp/ui/GameplayPiles.tsx',
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
  assert.equal(
    visibleCardInstance(
      state,
      'bot',
      'two',
      state.players[1].hand[0].instanceId,
    ),
    null,
  );
  assert.equal(
    visibleCardInstance(
      state,
      'bot',
      'one',
      state.players[0].hand[0].instanceId,
    )?.instanceId,
    state.players[0].hand[0].instanceId,
  );
  const botPreview = previewMatchAttack(state, attack);
  const session = beginCombatAnimation(state, botPreview, false, 'enemy');
  assert.equal(session.steps[0].source, 'enemy');
  assert.equal(session.steps[1].target, 'friendly');
  assert.equal(session.steps[2].source, 'friendly');
});

test('the board and inspection use the selected instance print, with battle HP separate', () => {
  const rare = heroCards.find(
    (card) => card.gameplay?.id === 'marth' && card.rarity === 'R',
  );
  assert.ok(rare);
  const unit = {
    ...createTestMatch().players[0].board[1],
    cardId: rare.id,
    currentHp: 7,
  };
  assert.equal(cardForCombatant(unit).id, rare.id);
  const html = renderToStaticMarkup(
    createElement(CardInspectionPanel, { card: unit, onClose() {} }),
  );
  assert.match(html, /Battle HP 7\/10/);
  assert.match(html, /Rare ·/);
  assert.match(
    html,
    new RegExp(rare.image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
});

test('battlefield, hand and inspection contain the unchanged full-size print at every rarity', () => {
  for (const rarity of [
    'Common',
    'Uncommon',
    'Rare',
    'Super Rare',
    'Ultra Rare',
    'Secret Rare',
  ]) {
    const card = heroCards.find((entry) => rarityName(entry.rarity) === rarity);
    assert.ok(card, `missing ${rarity} print`);
    const approvedPrint = renderToStaticMarkup(
      createElement(CardRenderer, { card, managedPointer: true }),
    );
    const printMarkup = approvedPrint.slice(
      approvedPrint.indexOf(
        rarity === 'Secret Rare'
          ? '<div class="sr-card'
          : '<div class="common-hero-card',
      ),
    );
    for (const width of [112, 100, 208]) {
      const scaled = renderToStaticMarkup(
        createElement(ScaledHeroCard, { card, initialWidth: width }),
      );
      assert.ok(
        scaled.includes(printMarkup),
        `${rarity} print changed at ${width}px`,
      );
      assert.match(scaled, new RegExp(`scale\\(${width / 290}\\)`));
      assert.doesNotMatch(scaled, /class="(?:common-hero-card|sr-card) small/);
    }
  }
});

test('draw animation follows the real turn draw without creating a second card', () => {
  const initial = createStarterMatch(
    'one',
    [
      [
        { instanceId: 'one-character-0', position: 1 },
        { instanceId: 'one-character-5', position: 2 },
      ],
      [
        { instanceId: 'two-character-2', position: 1 },
        { instanceId: 'two-character-3', position: 2 },
      ],
    ],
    () => 0.5,
  );
  const beforeHand = initial.players[1].hand.length;
  const beforeDeck = initial.players[1].deck.length;
  const session = beginActionAnimation(initial, { kind: 'end-turn' }, false);
  assert.deepEqual(
    session.steps.map((step) => step.kind),
    ['action', 'draw'],
  );
  assert.equal(session.steps[1].side, 'enemy');
  assert.equal(session.after.players[1].hand.length, beforeHand + 1);
  assert.equal(session.after.players[1].deck.length, beforeDeck - 1);
  assert.equal(initial.players[1].hand.length, beforeHand);
  const pileHtml = renderToStaticMarkup(
    createElement(GameplayPiles, { player: initial.players[1] }),
  );
  assert.match(pileHtml, /card-back-fitted\.png/);
  assert.match(pileHtml, /DECK/);
  assert.match(pileHtml, /DISCARD/);
  assert.doesNotMatch(pileHtml, /two-character-/);
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
