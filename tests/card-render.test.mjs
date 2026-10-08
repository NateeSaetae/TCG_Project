import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
after(() => server.close());
const { Card } = await server.ssrLoadModule('/src/components/cards/Card.tsx');
const { SecretRareReveal } = await server.ssrLoadModule(
  '/src/components/pack/SecretRareReveal.tsx',
);
const { default: CardShowcase } = await server.ssrLoadModule(
  '/src/pages/CardShowcase.tsx',
);
const { cards } = await server.ssrLoadModule('/src/data/cards.ts');
const { SHOWCASE_CARD_ID, secretRevealTiming } = await server.ssrLoadModule(
  '/src/config/cardEffects.ts',
);
const { CARD_BACK_IMAGE } = await server.ssrLoadModule(
  '/src/components/cards/TwoSidedCard.tsx',
);
const hero = cards.find((card) => card.id === SHOWCASE_CARD_ID);
const render = (component, props) =>
  renderToStaticMarkup(React.createElement(component, props));

test('all 30 cards render; only the showcase card opts into the new renderer', () => {
  for (const card of cards) {
    const html = render(Card, { card });
    assert.equal(html.includes('sr-rainbow'), card.id === SHOWCASE_CARD_ID);
    assert.ok(html.includes(card.name));
  }
});

test('unowned showcase remains a silhouette without revealing layered artwork', () => {
  const html = render(Card, { card: hero, hidden: true });
  assert.ok(html.includes('Undiscovered'));
  assert.ok(!html.includes('sr-rainbow'));
  assert.ok(!html.includes('/art/aether/'));
});

test('showcase renders the real full-art image and retains its information and finishes', async () => {
  assert.equal(hero.image, '/cards/aether-world-unbound.png');
  assert.equal(hero.artwork, undefined);
  await access(
    fileURLToPath(new URL('../public' + hero.image, import.meta.url)),
  );
  const html = render(Card, { card: hero });
  assert.ok(html.includes('sr-flat-image'));
  assert.ok(html.includes(hero.image));
  assert.ok(!html.includes('/art/aether/'));
  for (const value of [
    hero.name,
    hero.description,
    hero.element,
    String(hero.cost),
    String(hero.attack),
    String(hero.defense),
    '030 / 030',
    'sr-rainbow',
    'sr-specular',
  ])
    assert.ok(html.includes(value));
  assert.ok(html.indexOf('sr-information') < html.indexOf('sr-finish'));
});

test('special reveal starts sealed; autoplay starts charging; completion is user-controlled', () => {
  let callbacks = 0;
  const props = {
    card: hero,
    revealed: false,
    sound: false,
    onReveal: () => callbacks++,
    onContinue: () => callbacks++,
  };
  assert.ok(render(SecretRareReveal, props).includes('data-stage="idle"'));
  assert.ok(
    render(SecretRareReveal, { ...props, autoPlay: true }).includes(
      'data-stage="charging"',
    ),
  );
  assert.ok(
    render(SecretRareReveal, { ...props, revealed: true }).includes(
      'data-stage="ready"',
    ),
  );
  assert.equal(callbacks, 0);
  assert.equal(
    Object.values(secretRevealTiming).reduce((a, b) => a + b, 0),
    2600,
  );
});

test('dev showcase renders the card immediately with lighting and replay controls', () => {
  const html = render(CardShowcase, { sound: false });
  assert.ok(html.includes('sr-rainbow'));
  assert.ok(html.includes('Replay reveal'));
  assert.ok(html.includes('Live pointer'));
  assert.equal((html.match(/type="range"/g) || []).length, 2);
});

test('both faces share the physical card; backs use the same neutral artwork for every rarity', async () => {
  await access(
    fileURLToPath(new URL('../public' + CARD_BACK_IMAGE, import.meta.url)),
  );
  for (const card of cards) {
    const html = render(Card, { card, face: 'back' });
    assert.ok(html.includes('data-face="back"'));
    assert.ok(html.includes('data-effects="off"'));
    const back = html.slice(html.indexOf('class="two-face two-back"'));
    assert.ok(back.includes(CARD_BACK_IMAGE));
    assert.ok(back.includes('two-back-light'));
    assert.ok(!back.includes('sr-rainbow'));
    assert.ok(!back.includes('card-foil'));
  }
});

test('front effects can be held off during reveal without replacing the artwork', () => {
  const html = render(Card, {
    card: hero,
    face: 'front',
    effectsActive: false,
  });
  assert.ok(html.includes('data-effects="off"'));
  assert.ok(html.includes(hero.image));
  assert.ok(
    render(Card, { card: hero, face: 'front' }).includes('data-effects="on"'),
  );
});

test('normal and Secret Rare pack reveals initially show the official back', async () => {
  const { CardReveal } = await server.ssrLoadModule(
    '/src/components/pack/CardReveal.tsx',
  );
  const { PackOpening } = await server.ssrLoadModule(
    '/src/pages/PackOpening.tsx',
  );
  const normal = render(CardReveal, {
    card: cards[0],
    sound: false,
    onReveal() {},
    onContinue() {},
  });
  assert.ok(normal.includes('data-face="back"'));
  assert.ok(normal.includes('data-stage="idle"'));
  for (const card of [cards[0], hero]) {
    const html = render(PackOpening, {
      pending: [card.id],
      sound: false,
      addPack() {},
      finish() {},
      collect() {},
    });
    assert.ok(html.includes('data-face="back"'));
    assert.ok(html.includes(CARD_BACK_IMAGE));
  }
});

test('showcase exposes front, back, flip and reveal inspection controls', () => {
  const html = render(CardShowcase, { sound: false });
  for (const label of ['Show Front', 'Show Back', 'Flip Card', 'Replay reveal'])
    assert.ok(html.includes(label));
});

test('royal presentation renders Home, summoning chamber, archive and showcase', async () => {
  const { Home } = await server.ssrLoadModule('/src/pages/Home.tsx');
  const { Collection } = await server.ssrLoadModule(
    '/src/pages/Collection.tsx',
  );
  const { PackOpening } = await server.ssrLoadModule(
    '/src/pages/PackOpening.tsx',
  );
  const home = render(Home, { open() {}, collect() {}, owned: 2, packs: 1 });
  assert.ok(home.includes('Open Booster'));
  assert.ok(home.includes('View Collection'));
  const packs = render(PackOpening, {
    pending: [],
    addPack() {},
    finish() {},
    sound: false,
    collect() {},
  });
  assert.ok(packs.includes('FIRE EMBLEM'));
  assert.ok(packs.includes('summoning-circle'));
  const archive = render(Collection, { owned: { 'AW-030': 1 }, view() {} });
  assert.ok(archive.includes('Hero Archive'));
  assert.ok(archive.includes('aria-valuenow="1"'));
  assert.ok(archive.includes('Secret Rare · SEC'));
  const showcase = render(CardShowcase, { sound: false });
  assert.ok(showcase.includes('THE RELIQUARY'));
  for (const page of [home, packs, archive, showcase])
    assert.ok(!/aetherveil/i.test(page));
});

test('legacy collection survives the rebrand, adding a pack and finishing its reveal', async () => {
  const { useCollection } = await server.ssrLoadModule(
    '/src/hooks/useCollection.ts',
  );
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const saved = {
    version: 1,
    owned: { 'AW-030': 2, 'AW-001': 3 },
    packs: 7,
    pending: ['AW-030'],
    sound: true,
  };
  const store = new Map([['aetherveil-save-v1', JSON.stringify(saved)]]);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  });
  let collection;
  function Probe() {
    collection = useCollection();
    return null;
  }
  try {
    render(Probe, {});
    assert.deepEqual(collection.save, saved);
    collection.addPack([cards[0], cards[1], cards[2], cards[3], hero]);
    render(Probe, {});
    assert.equal(collection.save.packs, 8);
    assert.equal(collection.save.owned['AW-030'], 3);
    assert.equal(collection.save.owned['AW-001'], 4);
    assert.equal(collection.save.pending.length, 5);
    collection.finish();
    render(Probe, {});
    assert.deepEqual(collection.save.pending, []);
    assert.equal(collection.save.owned['AW-030'], 3);
    assert.equal(store.size, 1);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});

test('Marth Common has independent text anatomy and does not enter the pack catalog', async () => {
  const { marthPreview } = await server.ssrLoadModule(
    '/src/data/marthPreview.ts',
  );
  assert.ok(!cards.some((card) => card.id === marthPreview.id));
  await access(
    fileURLToPath(new URL('../public' + marthPreview.image, import.meta.url)),
  );
  const html = render(Card, { card: marthPreview });
  for (const text of [
    'Marth',
    '2000',
    'Hero · Swordsman',
    'FE-001',
    marthPreview.description,
    'Cost 3',
    'aria-label="Common">C',
  ])
    assert.ok(html.includes(text));
  for (const region of [
    'common-cost',
    'common-power',
    'common-art-field',
    'common-description',
    'common-identity',
    'common-rarity',
    'common-card-id',
  ])
    assert.ok(html.includes(region));
  assert.ok(!html.includes('sr-rainbow'));
  const hidden = render(Card, { card: marthPreview, hidden: true });
  assert.ok(!hidden.includes(marthPreview.image));
  assert.ok(!hidden.includes(marthPreview.description));
});

test('Marth preview supports shared flip faces and existing card-back artwork', async () => {
  const { marthPreview } = await server.ssrLoadModule(
    '/src/data/marthPreview.ts',
  );
  const { default: MarthCommonPreview } = await server.ssrLoadModule(
    '/src/pages/MarthCommonPreview.tsx',
  );
  for (const face of ['front', 'back']) {
    const html = render(Card, { card: marthPreview, face });
    assert.ok(html.includes('data-face="' + face + '"'));
    assert.ok(html.includes(CARD_BACK_IMAGE));
    assert.ok(html.includes('common-hero-card'));
  }
  const preview = render(MarthCommonPreview, {});
  for (const label of ['Show Front', 'Show Back', 'Flip Card', 'Preview size'])
    assert.ok(preview.includes(label));
});
