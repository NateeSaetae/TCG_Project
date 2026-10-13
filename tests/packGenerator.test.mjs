import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
after(() => server.close());

const { generatePack, selectWeightedRarity } = await server.ssrLoadModule(
  '/src/utils/packGenerator.ts',
);
const { archiveCards, heroCards } = await server.ssrLoadModule(
  '/src/data/catalog.ts',
);
const { marthCards } = await server.ssrLoadModule(
  '/src/data/characters/marth/marth.ts',
);
const { PACK_SIZE, rank, rarityName, rarityWeights } =
  await server.ssrLoadModule('/src/config/rarity.ts');

function seededRandom(seed = 9137) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test('registered hero cards have unique IDs and resolvable artwork', async () => {
  assert.equal(
    new Set(heroCards.map((card) => card.id)).size,
    heroCards.length,
  );
  for (const card of heroCards) {
    const paths = [
      card.image,
      ...Object.values(card.artwork ?? {}),
      card.magicEffects?.foilArtwork,
      card.magicEffects?.foilMask,
      card.magicEffects?.backgroundArtwork,
    ].filter(Boolean);
    for (const asset of paths) {
      assert.ok(asset.startsWith('/art/'), `${card.id}: ${asset}`);
      await access(
        fileURLToPath(new URL('../public' + asset, import.meta.url)),
      );
    }
  }
});

test('packs draw registered hero cards and keep the Rare+ guarantee', () => {
  const random = seededRandom();
  for (let i = 0; i < 10000; i++) {
    const pack = generatePack(random);
    assert.equal(pack.length, PACK_SIZE);
    assert.ok(pack.some((card) => rank(card.rarity) >= 2));
    for (const card of pack) {
      assert.ok(heroCards.includes(card));
    }
  }
});

test('weighted rarity selection follows the existing configured weights', () => {
  const random = seededRandom(119);
  const counts = new Map();
  const samples = 100000;
  for (let i = 0; i < samples; i++) {
    const rarity = selectWeightedRarity(marthCards, random);
    counts.set(rarity, (counts.get(rarity) ?? 0) + 1);
  }
  for (const [rarity, weight] of Object.entries(rarityWeights)) {
    const observed = ((counts.get(rarity) ?? 0) / samples) * 100;
    assert.ok(Math.abs(observed - weight) < 0.5, rarity);
  }
});

test('forced development pulls do not change the normal generator', () => {
  for (const card of heroCards) {
    const pack = generatePack(() => 0, { forceCardId: card.id });
    assert.ok(pack.includes(card));
    const rarity = rarityName(card.rarity);
    assert.ok(
      generatePack(() => 0, { forceRarity: rarity }).some(
        (pulled) => rarityName(pulled.rarity) === rarity,
      ),
    );
  }
  assert.throws(() => generatePack(() => 0, { forceCardId: 'missing' }));
  assert.equal(generatePack(() => 0).length, PACK_SIZE);
});

test('duplicates stay distinct pulls and the archive contains only registered heroes', () => {
  const pack = generatePack(() => 0);
  assert.ok(new Set(pack.map((card) => card.id)).size < PACK_SIZE);
  assert.equal(new Set(marthCards.map((card) => card.id)).size, 6);
  assert.ok(marthCards.every((card) => card.cost === 3 && card.power === 2000));
  assert.ok(marthCards.every((card) => heroCards.includes(card)));
  assert.equal(
    new Set(archiveCards.map((card) => card.id)).size,
    heroCards.length,
  );
  assert.equal(
    Object.values(rarityWeights).reduce((sum, weight) => sum + weight, 0),
    100,
  );
});
