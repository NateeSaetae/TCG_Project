import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
after(() => server.close());

const rules = await server.ssrLoadModule('/src/gameplay/mvp/rules/combat.ts');

test('MVP combat uses 10 HP and two base damage, without card stats', () => {
  assert.equal(rules.MVP_MAX_HP, 10);
  assert.equal(rules.MVP_BASE_ATTACK_DAMAGE, 2);
  assert.deepEqual(
    rules.resolveBasicAttack({
      attackerPosition: 2,
      targetPosition: 2,
      attackerWeapon: 'Magic',
      defenderWeapon: 'Axe',
    }),
    { damage: 2, weaponAdvantage: false },
  );
  assert.equal(rules.remainingHp(10, 1), 9);
  assert.equal(rules.remainingHp(1, 2), 0);
});

test('weapon triangle grants exactly one extra damage in the winning direction', () => {
  for (const [attackerWeapon, defenderWeapon] of [
    ['Sword', 'Axe'],
    ['Axe', 'Lance'],
    ['Lance', 'Sword'],
  ]) {
    assert.deepEqual(
      rules.resolveBasicAttack({
        attackerPosition: 2,
        targetPosition: 2,
        attackerWeapon,
        defenderWeapon,
      }),
      { damage: 3, weaponAdvantage: true },
    );
    assert.equal(
      rules.hasWeaponAdvantage(defenderWeapon, attackerWeapon),
      false,
    );
  }
  assert.equal(rules.hasWeaponAdvantage('Bow', 'Axe'), false);
  assert.equal(rules.hasWeaponAdvantage('Sword', 'Magic'), false);
});

test('melee targets only the directly opposing position', () => {
  for (const weapon of ['Sword', 'Lance', 'Axe']) {
    assert.deepEqual(rules.attackablePositions(2, weapon), [2]);
    assert.equal(rules.isTargetInRange(2, 1, weapon), false);
    assert.equal(rules.isTargetInRange(2, 2, weapon), true);
  }
});

test('Bow targets adjacent positions, Magic also targets directly opposite', () => {
  assert.deepEqual(rules.attackablePositions(2, 'Bow'), [1, 3]);
  assert.deepEqual(rules.attackablePositions(2, 'Magic'), [1, 2, 3]);
  assert.equal(rules.isTargetInRange(2, 2, 'Bow'), false);
  assert.equal(
    rules.resolveBasicAttack({
      attackerPosition: 2,
      targetPosition: 2,
      attackerWeapon: 'Bow',
      defenderWeapon: 'Sword',
    }),
    null,
  );
});

test('range ignores positions beyond either board edge', () => {
  assert.deepEqual(rules.attackablePositions(0, 'Bow'), [1]);
  assert.deepEqual(rules.attackablePositions(4, 'Bow'), [3]);
  assert.deepEqual(rules.attackablePositions(0, 'Magic'), [0, 1]);
  assert.deepEqual(rules.attackablePositions(4, 'Magic'), [3, 4]);
  assert.equal(rules.isTargetInRange(0, -1, 'Magic'), false);
  assert.equal(rules.isTargetInRange(4, 5, 'Magic'), false);
});
