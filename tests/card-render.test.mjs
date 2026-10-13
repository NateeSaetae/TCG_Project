import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
after(() => server.close());

const { CardRenderer } = await server.ssrLoadModule(
  '/src/components/cards/CardRenderer.tsx',
);
const { archiveCards, cardById, heroCards } = await server.ssrLoadModule(
  '/src/data/catalog.ts',
);
const { marthCards } = await server.ssrLoadModule(
  '/src/data/characters/marth.ts',
);
const { royCards } = await server.ssrLoadModule('/src/data/characters/roy.ts');
const { CARD_BACK_IMAGE } = await server.ssrLoadModule(
  '/src/components/cards/TwoSidedCard.tsx',
);
const render = (component, props) =>
  renderToStaticMarkup(React.createElement(component, props));

test('catalog contains only registered HeroCard data with unique IDs', () => {
  assert.equal(archiveCards, heroCards);
  assert.equal(heroCards.length, marthCards.length + royCards.length);
  assert.equal(
    new Set(heroCards.map((card) => card.id)).size,
    heroCards.length,
  );
  assert.ok(heroCards.every((card) => cardById.get(card.id) === card));
  assert.ok(heroCards.every((card) => !card.id.startsWith('AW-')));
  assert.deepEqual(
    royCards.map((card) => card.id),
    ['FE-007', 'FE-008'],
  );
});

test('development preview includes every registered hero card', async () => {
  const { default: HeroPreview } = await server.ssrLoadModule(
    '/src/pages/dev/HeroPreview.tsx',
  );
  const html = render(HeroPreview, {});
  assert.equal(
    (html.match(/class="hero-preview-size"/g) ?? []).length,
    heroCards.length,
  );
  for (const card of heroCards) assert.ok(html.includes(card.id), card.id);
  assert.ok(html.includes('<h2>Marth</h2>'));
  assert.ok(html.includes('<h2>Roy</h2>'));
  assert.ok(!html.includes('roy_hero-king_SR.png'));
});

test('all active hero cards render their identity, stats, and art', () => {
  for (const card of heroCards) {
    const html = render(CardRenderer, { card });
    assert.ok(html.includes(card.name), card.id);
    assert.ok(html.includes(String(card.cost)), card.id);
    assert.ok(html.includes(String(card.power)), card.id);
    assert.ok(html.includes(card.id), card.id);
    assert.ok(html.includes(card.image), card.id);
  }
});

test('undiscovered cards hide identity and artwork', () => {
  for (const card of heroCards) {
    const html = render(CardRenderer, { card, hidden: true });
    assert.ok(!html.includes(card.image), card.id);
    assert.ok(!html.includes(card.description), card.id);
  }
});

test('every rarity supports the shared physical card back and front', () => {
  for (const card of marthCards) {
    const back = render(CardRenderer, { card, face: 'back' });
    const front = render(CardRenderer, { card, face: 'front' });
    assert.ok(back.includes('data-face="back"'), card.id);
    assert.ok(front.includes('data-face="front"'), card.id);
    assert.ok(back.includes(CARD_BACK_IMAGE), card.id);
  }
});

test('pending SER pack resumes at the card back', async () => {
  const { PackOpening } = await server.ssrLoadModule(
    '/src/pages/PackOpening.tsx',
  );
  const html = render(PackOpening, {
    pending: ['FE-006'],
    addPack() {},
    finish() {},
    sound: false,
    collect() {},
  });
  assert.ok(html.includes('secret-reveal'));
  assert.ok(html.includes('data-face="back"'));
});

test('saved legacy IDs are ignored while owned heroes and pending pulls survive', async () => {
  const { useCollection } = await server.ssrLoadModule(
    '/src/hooks/useCollection.ts',
  );
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: () =>
        JSON.stringify({
          version: 1,
          owned: { 'AW-030': 3, 'FE-001': 2, 'FE-007': 1 },
          packs: 4,
          pending: ['AW-030', 'FE-006'],
          sound: true,
        }),
    },
  });
  let save;
  function Probe() {
    save = useCollection().save;
    return null;
  }
  try {
    render(Probe, {});
    assert.deepEqual(save.owned, { 'FE-001': 2, 'FE-007': 1 });
    assert.deepEqual(save.pending, ['FE-006']);
    assert.equal(save.packs, 4);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});
