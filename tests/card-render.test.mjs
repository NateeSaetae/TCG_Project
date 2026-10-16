import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
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
  '/src/data/characters/marth/marth.ts',
);
const { royCards } = await server.ssrLoadModule(
  '/src/data/characters/roy/roy.ts',
);
const { hectorCards } = await server.ssrLoadModule(
  '/src/data/characters/hector/hector.ts',
);
const { ephraimCards } = await server.ssrLoadModule(
  '/src/data/characters/ephraim/ephraim.ts',
);
const { lilinaCards } = await server.ssrLoadModule(
  '/src/data/characters/lilina/lilina.ts',
);
const { lynCards } = await server.ssrLoadModule(
  '/src/data/characters/lyn/lyn.ts',
);
const { CARD_BACK_IMAGE } = await server.ssrLoadModule(
  '/src/components/cards/TwoSidedCard.tsx',
);
const render = (component, props) =>
  renderToStaticMarkup(React.createElement(component, props));

test('sealed opening offers six individual five-card packs with identical odds', async () => {
  const { PackOpening } = await server.ssrLoadModule(
    '/src/pages/PackOpening.tsx',
  );
  const markup = render(PackOpening, {
    pending: [],
    addPack() {},
    finish() {},
    sound: false,
    collect() {},
  });
  assert.equal(
    (markup.match(/class="pack-button booster-choice"/g) ?? []).length,
    6,
  );
  for (let i = 1; i <= 6; i++) {
    assert.ok(markup.includes(`Open booster pack ${i}, five cards, same odds`));
  }
  assert.ok(!markup.includes('pack-quantity'));
});

test('catalog contains only registered HeroCard data with unique IDs', () => {
  assert.equal(archiveCards, heroCards);
  assert.equal(
    heroCards.length,
    marthCards.length +
      royCards.length +
      hectorCards.length +
      ephraimCards.length +
      lilinaCards.length +
      lynCards.length,
  );
  assert.equal(
    new Set(heroCards.map((card) => card.id)).size,
    heroCards.length,
  );
  assert.ok(heroCards.every((card) => cardById.get(card.id) === card));
  assert.ok(heroCards.every((card) => !card.id.startsWith('AW-')));
  assert.ok(royCards.every((card) => cardById.get(card.id) === card));
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
  assert.ok(html.includes('<h2>Hector</h2>'));
  assert.ok(html.includes('<h2>Ephraim</h2>'));
  assert.ok(html.includes('<h2>Lilina</h2>'));
  assert.ok(html.includes('<h2>Lyn</h2>'));
  assert.ok(html.includes('FE-011'));
});

test('all active hero cards render their identity, stats, and art', () => {
  for (const card of heroCards) {
    const html = render(CardRenderer, { card });
    assert.ok(html.includes(card.name), card.id);
    assert.ok(html.includes(String(card.cost)), card.id);
    assert.ok(html.includes(card.heroTitle ?? String(card.power)), card.id);
    assert.ok(html.includes(card.id), card.id);
    assert.ok(html.includes(card.image), card.id);
  }
});

test('all Marth rarities show combat details', () => {
  const common = render(CardRenderer, { card: marthCards[0] });
  for (const text of [
    'Sword',
    'Lance',
    'Axe',
    'Hero&#x27;s Resolve',
    'Altean Legacy',
  ])
    assert.ok(common.includes(text), text);
  for (const weapon of ['sword', 'lance', 'axe'])
    assert.ok(
      common.includes(`/art/aether/icons/weapons/${weapon}.svg`),
      weapon,
    );
  assert.ok(common.includes('hero-status-panel'));
  assert.ok(common.includes('hero-status-tab'));
  assert.ok(common.includes('aria-expanded="false"'));
  assert.ok(common.includes('class="hero-skill-list"'));
  assert.ok(!common.includes('3500'));
  assert.ok(!common.includes('class="common-cost"'));
  assert.ok(!common.includes('Cost 3'));
  assert.ok(common.includes('aria-label="Sword"'));
  assert.ok(!common.includes('aria-label="Sword equipped"'));
  const equipped = render(CardRenderer, {
    card: marthCards[0],
    activeWeapon: 'Lance',
  });
  assert.match(
    equipped,
    /hero-weapon-icon is-featured[^>]*aria-label="Lance equipped"/,
  );
  const uncommon = render(CardRenderer, { card: marthCards[1] });
  assert.ok(uncommon.includes('uncommon-hero-body'));
  assert.ok(uncommon.includes('hero-status-panel'));
  assert.ok(uncommon.includes('class="hero-skill-list"'));
  assert.ok(!uncommon.includes('Cost 3'));
  const rare = render(CardRenderer, { card: marthCards[2] });
  assert.ok(rare.includes('rare-hero-body'));
  assert.ok(rare.includes('hero-status-panel'));
  assert.ok(rare.includes('class="hero-skill-list"'));
  assert.ok(!rare.includes('Cost 3'));
  const superRare = render(CardRenderer, { card: marthCards[3] });
  assert.ok(superRare.includes('super-rare-hero-body'));
  assert.ok(superRare.includes('hero-status-panel'));
  assert.ok(superRare.includes('class="hero-skill-list"'));
  assert.ok(!superRare.includes('Cost 3'));
  const ultraRare = render(CardRenderer, { card: marthCards[4] });
  assert.ok(ultraRare.includes('ultra-rare-hero-body'));
  assert.ok(ultraRare.includes('hero-status-panel'));
  assert.ok(ultraRare.includes('class="hero-skill-list"'));
  assert.ok(!ultraRare.includes('Cost 3'));
  const secretRare = render(CardRenderer, { card: marthCards[5] });
  assert.ok(secretRare.includes('scr-hero-card'));
  assert.ok(secretRare.includes('hero-status-panel'));
  assert.ok(secretRare.includes('class="hero-skill-list"'));
  assert.ok(!secretRare.includes('Cost 3'));
  const equippedSecretRare = render(CardRenderer, {
    card: marthCards[5],
    activeWeapon: 'Lance',
  });
  assert.match(
    equippedSecretRare,
    /hero-weapon-icon is-featured[^>]*aria-label="Lance equipped"/,
  );
  const hidden = render(CardRenderer, { card: marthCards[0], hidden: true });
  assert.ok(!hidden.includes('Hero&#x27;s Resolve'));
  assert.ok(!hidden.includes('3500'));
  const hiddenSecretRare = render(CardRenderer, {
    card: marthCards[5],
    hidden: true,
  });
  assert.ok(!hiddenSecretRare.includes('hero-status-panel'));
  assert.ok(!hiddenSecretRare.includes('Hero&#x27;s Resolve'));
});

test('Marth hero titles replace the printed Power label by rarity', () => {
  for (const [index, card] of marthCards.entries()) {
    const html = render(CardRenderer, { card });
    const title = index < 4 ? 'Legendary Hero' : 'Emblem Hero';
    assert.equal(card.heroTitle, title);
    assert.ok(html.includes(title), card.id);
    assert.ok(!html.includes('POWER'), card.id);
  }
  const roy = render(CardRenderer, { card: royCards[0] });
  assert.ok(roy.includes('POWER'));
  assert.ok(roy.includes(String(royCards[0].power)));
});

test('registered Roy cards render their new combat skills', () => {
  for (const card of royCards) {
    const html = render(CardRenderer, { card });
    assert.ok(html.includes('Blazing Resolve'), card.id);
    assert.ok(html.includes('Binding Flame'), card.id);
    assert.ok(html.includes('hero-status-panel'), card.id);
    assert.ok(html.includes('/art/aether/icons/weapons/sword.svg'), card.id);
  }
  const hidden = render(CardRenderer, { card: royCards[0], hidden: true });
  assert.ok(!hidden.includes('Blazing Resolve'));
  assert.ok(!hidden.includes('Binding Flame'));
});

test('Hector and Ephraim C–UR reuse rarity layouts and render shared gameplay', () => {
  for (const [cards, name, skills, weapons] of [
    [
      hectorCards,
      'Hector',
      ['Ostian Guard', 'Armads Retribution'],
      ['axe', 'sword'],
    ],
    [
      ephraimCards,
      'Ephraim',
      ["Siegmund's Edge", 'Renais Assault'],
      ['lance', 'axe'],
    ],
  ]) {
    assert.deepEqual(
      cards.map((card) => card.rarity),
      ['Common', 'U', 'R', 'SR', 'UR'],
    );
    assert.ok(cards.every((card) => card.gameplay === cards[0].gameplay));
    for (const card of cards) {
      const html = render(CardRenderer, { card });
      assert.ok(html.includes(name), card.id);
      assert.ok(html.includes('hero-status-panel'), card.id);
      for (const skill of skills)
        assert.ok(html.includes(skill.replaceAll("'", '&#x27;')), card.id);
      for (const weapon of weapons)
        assert.ok(
          html.includes(`/art/aether/icons/weapons/${weapon}.svg`),
          card.id,
        );
    }
  }
});

test('every weapon displays its supplied SVG icon', async () => {
  for (const weapon of [
    'Sword',
    'Lance',
    'Axe',
    'Bow',
    'Magic',
    'Staff',
    'Dagger',
  ]) {
    const card = {
      ...royCards[0],
      gameplay: { ...royCards[0].gameplay, allowedWeapons: [weapon] },
    };
    const icon = `/art/aether/icons/weapons/${weapon.toLowerCase()}.svg`;
    const html = render(CardRenderer, { card });
    assert.ok(html.includes(`aria-label="${weapon}"`), weapon);
    assert.ok(html.includes(icon), weapon);
    await access(new URL(`../public${icon}`, import.meta.url));
  }
});

test('Lilina and Lyn C–UR use available artwork and shared gameplay displays', () => {
  for (const [cards, name, skills, weapons] of [
    [
      lilinaCards,
      'Lilina',
      ['Arcane Flame', 'Gentle Heart'],
      ['Magic', 'Staff'],
    ],
    [lynCards, 'Lyn', ['Swift Strike', 'Sacaen Precision'], ['Sword', 'Bow']],
  ]) {
    assert.deepEqual(
      cards.map((card) => card.rarity),
      ['Common', 'U', 'R', 'SR', 'UR'],
    );
    assert.ok(cards.every((card) => card.gameplay === cards[0].gameplay));
    for (const card of cards) {
      const html = render(CardRenderer, { card });
      assert.ok(html.includes(name), card.id);
      assert.ok(html.includes('hero-status-panel'), card.id);
      for (const skill of skills) assert.ok(html.includes(skill), card.id);
      for (const weapon of weapons)
        assert.ok(html.includes(`aria-label="${weapon}"`), card.id);
    }
  }
  assert.ok(
    render(CardRenderer, { card: lynCards[0] }).includes(
      '/art/aether/icons/weapons/bow.svg',
    ),
  );
});

test('Roy UR uses its own artwork and the shared foil frame', () => {
  const card = royCards.find((entry) => entry.rarity === 'UR');
  assert.ok(card);
  assert.equal(card.id, 'FE-011');
  assert.equal(card.heroTitle, 'Emblem Hero');
  assert.equal(card.artwork.foreground, royCards[3].artwork.foreground);
  const html = render(CardRenderer, { card });
  assert.ok(html.includes('roy_of_binding_UR.png'));
  assert.ok(html.includes('roy-BG-UR.webp'));
  assert.ok(html.includes('ultra-rare-hero-body'));
  assert.ok(html.includes('patterned-foil-border'));
  assert.ok(html.includes('Blazing Resolve'));
  assert.ok(html.includes('/art/aether/heroes/Roy/effects/marth_sr_front.png'));
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

test('pending SER pack resumes as a face-up active card in the stack', async () => {
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
  assert.ok(html.includes('stacked-reveal'));
  assert.ok(html.includes('scr-hero-card'));
  assert.ok(!html.includes('data-face="back"'));
  assert.ok(html.includes('View pack summary'));
});

test('stack renders the active hero and four actual hidden rarity frames', async () => {
  const { StackedCardReveal } = await server.ssrLoadModule(
    '/src/components/pack/StackedCardReveal.tsx',
  );
  const cards = [
    marthCards[0],
    marthCards[1],
    marthCards[2],
    marthCards[4],
    marthCards[5],
  ];
  const html = render(StackedCardReveal, {
    cards,
    newCards: [0],
    sound: false,
    onComplete() {},
  });
  assert.equal((html.match(/class="stack-edge"/g) ?? []).length, 4);
  assert.equal((html.match(/class="stack-card"/g) ?? []).length, 1);
  assert.ok(html.includes('New discovery'));
  assert.ok(html.includes('Next Card'));
  assert.ok(html.includes('1 / 5'));
  // Underlying previews omit all character artwork; only the active card loads art.
  for (const card of cards.slice(1)) {
    assert.ok(!html.includes(card.artwork?.character ?? card.image));
  }
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
