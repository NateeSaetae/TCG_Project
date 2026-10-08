import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePack } from '../src/utils/packGenerator';
import { cards } from '../src/data/cards';
import { rank, rarityWeights } from '../src/config/rarity';
test('10,000 seeded packs contain five distinct cards and at least one Rare+', () => {
  let seed = 9137;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const seen = new Set<string>();
  for (let i = 0; i < 10000; i++) {
    const pack = generatePack(random);
    assert.equal(pack.length, 5);
    assert.equal(new Set(pack.map((c) => c.id)).size, 5);
    assert.ok(pack.some((c) => rank(c.rarity) >= 2));
    for (const c of pack) {
      assert.ok(cards.includes(c));
      seen.add(c.rarity);
    }
  }
  assert.equal(seen.size, 6);
});
test('boundary random values still respect the guarantee', () => {
  for (const value of [0, 0.999999999]) {
    const pack = generatePack(() => value);
    assert.equal(new Set(pack.map((c) => c.id)).size, 5);
    assert.ok(pack.some((c) => rank(c.rarity) >= 2));
  }
});
test('catalog IDs and numbers are unique and weights sum to 100', () => {
  assert.equal(cards.length, 30);
  assert.equal(new Set(cards.map((c) => c.id)).size, 30);
  assert.equal(new Set(cards.map((c) => c.cardNumber)).size, 30);
  assert.equal(
    Object.values(rarityWeights).reduce((a, b) => a + b, 0),
    100,
  );
});
