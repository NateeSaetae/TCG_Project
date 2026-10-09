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
    assert.ok(back.includes('fe-card-back-image'));
    assert.ok(!back.includes('card-back-frame-foil'));
    assert.ok(!back.includes('card-back-logo-foil'));
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

const { readFile } = await import('node:fs/promises');
const { createHash } = await import('node:crypto');
const { marthPreview } = await server.ssrLoadModule(
  '/src/data/marthPreview.ts',
);
const { CardRenderer } = await server.ssrLoadModule(
  '/src/components/cards/CardRenderer.tsx',
);
const { HeroCardLayout } = await server.ssrLoadModule(
  '/src/components/cards/HeroCardLayout.tsx',
);
const { rarityNames, rarityCode, rarityDesigns, resolveRarityDesign } =
  await server.ssrLoadModule('/src/config/rarityDesigns.ts');

test('approved Common markup and CSS stay identical across sizes, hidden and flip states', async () => {
  const baseline = JSON.parse(
    await readFile(
      new URL('./fixtures/common-baseline.json', import.meta.url),
      'utf8',
    ),
  );
  // The approved FRONT remains byte-identical; the back is intentionally replaced.
  const approvedFront = (html, props) =>
    props.face
      ? html.slice(
          html.indexOf('<div class="two-face two-front"'),
          html.indexOf('<div class="two-face two-back"'),
        )
      : html;
  for (const [index, props] of baseline.props.entries()) {
    assert.equal(
      approvedFront(
        render(CardRenderer, { card: marthPreview, ...props }),
        props,
      ),
      approvedFront(baseline.markup[index], props),
    );
    assert.equal(
      approvedFront(render(Card, { card: marthPreview, ...props }), props),
      approvedFront(baseline.markup[index], props),
    );
  }
  const css = await readFile(
    new URL('../src/components/cards/common-hero-card.css', import.meta.url),
    'utf8',
  );
  assert.equal(
    createHash('sha256').update(css).digest('hex'),
    baseline.cssHash,
  );
});

test('rarity names and codes select their implemented design without changing identity', () => {
  for (const [code, name] of Object.entries(rarityNames)) {
    assert.equal(rarityCode(code), code);
    assert.equal(rarityCode(name), code);
    assert.equal(
      resolveRarityDesign(code),
      code === 'U' || code === 'R' || code === 'SR' || code === 'UR'
        ? rarityDesigns[code]
        : rarityDesigns.C,
    );
    const card = { ...marthPreview, layout: 'hero', rarity: code };
    const byCode = render(CardRenderer, { card });
    const byName = render(CardRenderer, { card: { ...card, rarity: name } });
    assert.equal(byCode, byName);
    assert.ok(byCode.includes('aria-label="' + name + '">' + code));
    assert.ok(byCode.includes('common-print-frame'));
    assert.ok(byCode.includes('FE-001'));
    assert.ok(!byCode.includes('sr-rainbow'));
    assert.equal(card.rarity, code);
  }
});

test('implemented variants use shared slots and can opt into artwork layers and separate effects', () => {
  const previous = rarityDesigns.U;
  const Effects = ({ active }) =>
    React.createElement('div', { 'data-test-holo': active ? 'on' : 'off' });
  rarityDesigns.U = {
    implemented: true,
    layout: 'hero-common',
    design: {
      frame: { className: 'test-frame' },
      description: { style: { background: 'pink' } },
      background: { className: 'test-background' },
      artwork: { layers: true, className: 'test-art' },
      Effects,
    },
  };
  const card = {
    ...marthPreview,
    rarity: 'U',
    artwork: {
      background: '/test-bg.png',
      character: '/test-character.png',
      foreground: '/test-front.png',
    },
  };
  try {
    const html = render(CardRenderer, { card });
    for (const value of [
      'test-frame',
      'background:pink',
      'test-background',
      'test-art',
      '/test-bg.png',
      '/test-character.png',
      '/test-front.png',
      'data-test-holo="on"',
    ])
      assert.ok(html.includes(value));
    assert.ok(!html.includes(marthPreview.image));
    const disabled = render(CardRenderer, { card, effectsActive: false });
    assert.ok(disabled.includes('data-test-holo="off"'));
    const hidden = render(CardRenderer, { card, hidden: true });
    assert.ok(!hidden.includes('/test-'));
    assert.ok(!hidden.includes('data-test-holo'));
    const fallback = render(HeroCardLayout, { card });
    assert.ok(fallback.includes(marthPreview.image));
    assert.ok(!fallback.includes('/test-bg.png'));
  } finally {
    rarityDesigns.U = previous;
  }
});

test('card back renders one approved image without legacy stack classes or foil layers', async () => {
  const { CardBack } = await server.ssrLoadModule(
    '/src/components/cards/CardBack.tsx',
  );
  const { cardBackImage } = await server.ssrLoadModule(
    '/src/config/cardBack.ts',
  );
  await access(new URL('../public' + cardBackImage, import.meta.url));
  const html = render(CardBack, { interactive: false });
  assert.equal((html.match(/<img /g) || []).length, 1);
  assert.ok(html.includes('src="' + cardBackImage + '"'));
  assert.ok(!html.includes('class="card-back"'));
  assert.ok(!html.includes('foil'));
  assert.ok(!html.includes('mask'));
  assert.ok(render(CardBack, {}).includes('fe-card-back-interactive'));
});

test('Marth Uncommon has independent grassland and character art without changing Common data', async () => {
  const { marthUncommonPreview } = await server.ssrLoadModule(
    '/src/data/marthUncommonPreview.ts',
  );
  assert.equal(marthPreview.id, 'FE-001');
  assert.equal(
    marthPreview.image,
    '/art/aether/characters/marth_hero-king_C.png',
  );
  assert.equal(marthUncommonPreview.id, 'FE-002');
  assert.equal(
    marthUncommonPreview.image,
    '/art/aether/characters/marth_hero-king.png',
  );
  assert.equal(
    marthUncommonPreview.artwork.character,
    marthUncommonPreview.image,
  );
  assert.equal(marthUncommonPreview.rarity, 'U');
  assert.equal(marthUncommonPreview.cost, marthPreview.cost);
  assert.equal(marthUncommonPreview.power, marthPreview.power);
  assert.equal(marthUncommonPreview.description, marthPreview.description);
  assert.ok(!cards.some((card) => card.id === marthUncommonPreview.id));
  for (const path of [
    marthUncommonPreview.artwork.background,
    marthUncommonPreview.artwork.character,
  ]) {
    await access(new URL('../public' + path, import.meta.url));
  }
  const html = render(Card, { card: marthUncommonPreview });
  assert.ok(
    html.indexOf('hero-artwork-background') <
      html.indexOf('hero-artwork-character'),
  );
  for (const value of [
    marthUncommonPreview.artwork.background,
    marthUncommonPreview.artwork.character,
    'uncommon-description',
    'uncommon-print-frame',
    'aria-label="Uncommon">U',
    'FE-002',
    'Cost 3',
    '2000',
    marthPreview.description,
  ]) {
    assert.ok(html.includes(value), value);
  }
  assert.ok(!html.includes('sr-rainbow'));
  assert.ok(!html.includes('card-foil'));
  const hidden = render(Card, { card: marthUncommonPreview, hidden: true });
  assert.ok(!hidden.includes(marthUncommonPreview.artwork.background));
  assert.ok(!hidden.includes(marthUncommonPreview.artwork.character));
  const { default: MarthCommonPreview } = await server.ssrLoadModule(
    '/src/pages/MarthCommonPreview.tsx',
  );
  const preview = render(MarthCommonPreview, {});
  assert.ok(preview.includes('FE-001'));
  assert.ok(preview.includes('FE-002'));
});

test('FE-003 reuses Uncommon assets and data in a full-art Rare design', async () => {
  const { marthUncommonPreview } = await server.ssrLoadModule(
    '/src/data/marthUncommonPreview.ts',
  );
  const { marthRarePreview } = await server.ssrLoadModule(
    '/src/data/marthRarePreview.ts',
  );
  assert.equal(marthRarePreview.id, 'FE-003');
  assert.equal(marthRarePreview.rarity, 'R');
  assert.equal(marthRarePreview.cost, 3);
  assert.equal(marthRarePreview.power, 2000);
  assert.equal(marthRarePreview.description, marthUncommonPreview.description);
  assert.deepEqual(marthRarePreview.artwork, marthUncommonPreview.artwork);
  assert.ok(!cards.some((card) => card.id === 'FE-003'));
  const html = render(Card, { card: marthRarePreview });
  for (const value of [
    'rare-hero-body',
    'rare-art-field',
    'rare-print-frame',
    'rare-description',
    'rare-nameplate',
    'aria-label="Rare">R',
    'FE-003',
    'Cost 3',
    '2000',
    marthRarePreview.description,
  ])
    assert.ok(html.includes(value), value);
  assert.ok(
    html.indexOf('hero-artwork-background') <
      html.indexOf('hero-artwork-character'),
  );
  assert.ok(!html.includes('sr-rainbow'));
  assert.ok(!html.includes('card-foil'));
  const css = await readFile(
    new URL('../src/components/cards/rare-hero-card.css', import.meta.url),
    'utf8',
  );
  assert.match(css, /\.common-art-field\.rare-art-field\s*\{[^}]*inset:\s*0;/);
  assert.match(
    css,
    /\.common-description\.rare-description\s*\{[^}]*background:\s*transparent;/,
  );
  assert.match(
    css,
    /\.common-identity\.rare-nameplate\s*\{[^}]*left:\s*5%;[^}]*right:\s*5%;[^}]*background:\s*var\(--rare-frame-color\);/,
  );
  const hidden = render(Card, { card: marthRarePreview, hidden: true });
  assert.ok(!hidden.includes(marthRarePreview.artwork.background));
  assert.ok(!hidden.includes(marthRarePreview.artwork.character));
  const { default: MarthCommonPreview } = await server.ssrLoadModule(
    '/src/pages/MarthCommonPreview.tsx',
  );
  const preview = render(MarthCommonPreview, {});
  for (const id of ['FE-001', 'FE-002', 'FE-003'])
    assert.ok(preview.includes(id));
});

test('FE-004 uses its alternate transparent Marth art over the battlefield with fixed stats', async () => {
  const { marthRarePreview } = await server.ssrLoadModule(
    '/src/data/marthRarePreview.ts',
  );
  const { marthSuperRarePreview } = await server.ssrLoadModule(
    '/src/data/marthSuperRarePreview.ts',
  );
  assert.equal(marthSuperRarePreview.id, 'FE-004');
  assert.equal(marthSuperRarePreview.rarity, 'SR');
  for (const field of [
    'name',
    'cost',
    'power',
    'characterType',
    'description',
  ]) {
    assert.equal(marthSuperRarePreview[field], marthRarePreview[field]);
  }
  assert.ok(!cards.some((card) => card.id === 'FE-004'));
  assert.notEqual(
    marthSuperRarePreview.artwork.background,
    marthRarePreview.artwork.background,
  );
  assert.notEqual(
    marthSuperRarePreview.artwork.character,
    marthRarePreview.artwork.character,
  );
  for (const path of [
    marthSuperRarePreview.artwork.background,
    marthSuperRarePreview.artwork.character,
  ]) {
    await access(new URL('../public' + path, import.meta.url));
  }
  const html = render(Card, { card: marthSuperRarePreview });
  for (const value of [
    'super-rare-hero-body',
    'super-rare-art-field',
    'super-rare-print-frame',
    'super-rare-description',
    'super-rare-nameplate',
    'aria-label="Super Rare">SR',
    'FE-004',
    'Cost 3',
    '2000',
    marthRarePreview.description,
    ...Object.values(marthSuperRarePreview.artwork),
  ]) {
    assert.ok(html.includes(value), value);
  }
  assert.ok(
    html.indexOf('hero-artwork-background') <
      html.indexOf('hero-artwork-character'),
  );
  assert.ok(!html.includes('sr-rainbow'));
  assert.ok(!html.includes('card-foil'));
  const hidden = render(Card, { card: marthSuperRarePreview, hidden: true });
  assert.ok(!hidden.includes(marthSuperRarePreview.artwork.background));
  assert.ok(!hidden.includes(marthSuperRarePreview.artwork.character));
  const css = await readFile(
    new URL(
      '../src/components/cards/super-rare-hero-card.css',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(
    css,
    /\.super-rare-art-field img\.hero-artwork-character\s*\{[^}]*object-fit:\s*contain;/,
  );
  assert.match(
    css,
    /\.common-description\.super-rare-description\s*\{[^}]*background:\s*transparent;/,
  );
  const { default: MarthCommonPreview } = await server.ssrLoadModule(
    '/src/pages/MarthCommonPreview.tsx',
  );
  const preview = render(MarthCommonPreview, {});
  for (const id of ['FE-001', 'FE-002', 'FE-003', 'FE-004'])
    assert.ok(preview.includes(id));
});

test('FE-004 keeps two independent effect assets around the character', async () => {
  const { marthSuperRarePreview } = await server.ssrLoadModule(
    '/src/data/marthSuperRarePreview.ts',
  );
  const art = marthSuperRarePreview.artwork;
  for (const path of [art.midground, art.foreground])
    await access(new URL('../public' + path, import.meta.url));
  const html = render(CardRenderer, { card: marthSuperRarePreview });
  assert.ok(
    html.indexOf('hero-artwork-midground') <
      html.indexOf('hero-artwork-character'),
  );
  assert.ok(
    html.indexOf('hero-artwork-character') <
      html.indexOf('hero-artwork-foreground'),
  );
  const { marthUncommonPreview } = await server.ssrLoadModule(
    '/src/data/marthUncommonPreview.ts',
  );
  const { marthRarePreview } = await server.ssrLoadModule(
    '/src/data/marthRarePreview.ts',
  );
  for (const card of [marthPreview, marthUncommonPreview, marthRarePreview]) {
    const variant = render(CardRenderer, { card });
    assert.ok(!variant.includes(art.midground));
    assert.ok(!variant.includes(art.foreground));
  }
});

test('FE-005 UR keeps independent art, selective foil, and prior rarities intact', async () => {
  const { marthUltraRarePreview } = await server.ssrLoadModule(
    '/src/data/marthUltraRarePreview.ts',
  );
  const { marthSuperRarePreview } = await server.ssrLoadModule(
    '/src/data/marthSuperRarePreview.ts',
  );
  assert.equal(marthUltraRarePreview.id, 'FE-005');
  assert.equal(marthUltraRarePreview.rarity, 'UR');
  for (const field of ['cost', 'power', 'name', 'characterType', 'description'])
    assert.equal(marthUltraRarePreview[field], marthSuperRarePreview[field]);
  assert.ok(!cards.some((card) => card.id === 'FE-005'));
  assert.notEqual(
    marthUltraRarePreview.artwork.character,
    marthSuperRarePreview.artwork.character,
  );
  for (const asset of [
    ...Object.values(marthUltraRarePreview.artwork),
    '/art/aether/frames/ur_foil_mask.svg',
  ])
    await access(new URL('../public' + asset, import.meta.url));
  const html = render(CardRenderer, { card: marthUltraRarePreview });
  for (const value of [
    'ultra-rare-hero-body',
    'ultra-rare-art-field',
    'ultra-rare-nameplate',
    'ultra-rare-description',
    'ultra-rare-badge',
    'ultra-rare-print-frame',
    'ultra-rare-foil',
    'FE-005',
    'aria-label="Ultra Rare">UR',
    ...Object.values(marthUltraRarePreview.artwork),
  ])
    assert.ok(html.includes(value), value);
  assert.ok(
    html.indexOf('hero-artwork-background') <
      html.indexOf('hero-artwork-character'),
  );
  assert.ok(
    html.indexOf('hero-artwork-character') <
      html.indexOf('hero-artwork-foreground'),
  );
  assert.ok(!html.includes('hero-frame-overlay'));
  assert.ok(!html.includes('sr-rainbow'));
  assert.ok(
    !render(CardRenderer, {
      card: marthUltraRarePreview,
      effectsActive: false,
    }).includes('ultra-rare-foil'),
  );
  const hidden = render(CardRenderer, {
    card: marthUltraRarePreview,
    hidden: true,
  });
  assert.ok(!hidden.includes(marthUltraRarePreview.artwork.character));
  for (const card of [marthPreview, marthSuperRarePreview])
    assert.ok(!render(CardRenderer, { card }).includes('ultra-rare-foil'));
  const { default: MarthCommonPreview } = await server.ssrLoadModule(
    '/src/pages/MarthCommonPreview.tsx',
  );
  assert.ok(render(MarthCommonPreview, {}).includes('FE-005'));
});
