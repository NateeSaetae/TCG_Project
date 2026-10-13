import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
after(() => server.close());

const engine = await server.ssrLoadModule('/src/combat/engine.ts');
const { marthGameplay } = await server.ssrLoadModule(
  '/src/data/characters/marthGameplay.ts',
);
const { marthCards } = await server.ssrLoadModule(
  '/src/data/characters/marth.ts',
);

const enemy = {
  id: 'enemy',
  baseClass: 'Fighter',
  displayType: 'Fighter',
  allowedWeapons: ['Axe'],
  baseStats: { HP: 500, ATK: 600, DEF: 300, MAG: null, RES: 100, SPD: 200 },
  skills: [],
};

function battle() {
  return engine.createInitialBattleState([
    {
      id: 'allies',
      characters: [
        { instanceId: 'marth', character: marthGameplay },
        { instanceId: 'ally', character: marthGameplay },
      ],
    },
    { id: 'enemies', characters: [{ instanceId: 'enemy', character: enemy }] },
  ]);
}

test('all Marth rarities share one gameplay definition without changing Power', () => {
  assert.ok(marthCards.every((card) => card.gameplay === marthGameplay));
  assert.ok(marthCards.every((card) => card.power === 2000));
  assert.deepEqual(marthGameplay.baseStats, {
    HP: 3500,
    ATK: 1500,
    DEF: 1000,
    MAG: null,
    RES: 800,
    SPD: 1400,
  });
});

test('weapon compatibility disallows unavailable weapons and Staff attacks', () => {
  for (const weapon of ['Sword', 'Lance', 'Axe'])
    assert.equal(engine.canUseWeapon(marthGameplay, weapon), true);
  for (const weapon of ['Magic', 'Staff', 'Dagger'])
    assert.equal(engine.canUseWeapon(marthGameplay, weapon), false);
  const healer = { ...enemy, allowedWeapons: ['Staff'] };
  assert.equal(engine.canUseWeapon(healer, 'Staff', 'heal'), true);
  assert.equal(engine.canUseWeapon(healer, 'Staff', 'attack'), false);
  assert.throws(() =>
    engine.equipItem(battle(), 'marth', { id: 'staff', weaponType: 'Staff' }),
  );
});

test("Hero's Resolve only adds ATK to a Sword attack", () => {
  const initial = battle();
  const action = (weapon) => ({
    kind: 'attack',
    actorId: 'marth',
    targetId: 'enemy',
    weapon,
  });
  const sword = engine.processAttackAction(initial, action('Sword')).attack;
  const lance = engine.processAttackAction(initial, action('Lance')).attack;
  const base = engine.processAttackAction(initial, action(undefined)).attack;
  assert.equal(sword.attack, 1700);
  assert.deepEqual(sword.skillIds, ['heroes-resolve']);
  assert.equal(lance.attack, 1500);
  assert.equal(base.attack, 1500);
  assert.deepEqual(lance.skillIds, []);
  assert.throws(() => engine.processAttackAction(initial, action('Staff')));
  assert.equal(marthGameplay.baseStats.ATK, 1500);
  assert.equal(initial.events.length, 0);
});

test('Altean Legacy buffs only living other allies and expires after their next turn', () => {
  const initial = battle();
  const { state: declared, attack } = engine.processAttackAction(initial, {
    kind: 'attack',
    actorId: 'marth',
    targetId: 'enemy',
    weapon: 'Sword',
  });
  const resolved = engine.applyResolvedDamage(declared, attack.id, 500);
  const allies = resolved.teams[0].characters;
  assert.equal(resolved.teams[1].characters[0].currentHp, 0);
  assert.equal(engine.isTeamDefeated(resolved.teams[1]), true);
  assert.equal(engine.effectiveStats(allies[0]).ATK, 1500);
  assert.equal(engine.effectiveStats(allies[1]).ATK, 1600);
  assert.equal(allies[1].modifiers[0].sourceSkillId, 'altean-legacy');
  assert.equal(engine.effectiveStats(allies[1]).MAG, null);
  assert.throws(() => engine.applyResolvedDamage(resolved, attack.id, 1));

  const afterCurrentTurn = engine.advanceTurn(resolved);
  assert.equal(
    engine.effectiveStats(afterCurrentTurn.teams[0].characters[1]).ATK,
    1600,
  );
  const afterEnemyTurn = engine.advanceTurn(afterCurrentTurn);
  assert.equal(
    engine.effectiveStats(afterEnemyTurn.teams[0].characters[1]).ATK,
    1600,
  );
  const afterNextOwnTurn = engine.advanceTurn(afterEnemyTurn);
  assert.equal(
    engine.effectiveStats(afterNextOwnTurn.teams[0].characters[1]).ATK,
    1500,
  );
  assert.equal(marthGameplay.baseStats.ATK, 1500);
  assert.equal(initial.teams[0].characters[1].modifiers.length, 0);
});

test('a nonlethal hit does not activate on-kill skills', () => {
  const { state, attack } = engine.processAttackAction(battle(), {
    kind: 'attack',
    actorId: 'marth',
    targetId: 'enemy',
    weapon: 'Sword',
  });
  const resolved = engine.applyResolvedDamage(state, attack.id, 100);
  assert.equal(resolved.teams[1].characters[0].currentHp, 400);
  assert.equal(resolved.teams[0].characters[1].modifiers.length, 0);
  assert.equal(engine.isTeamDefeated(resolved.teams[1]), false);
});

test('on-kill buffs skip defeated allies', () => {
  const initial = battle();
  const withDefeatedAlly = {
    ...initial,
    teams: [
      {
        ...initial.teams[0],
        characters: [
          initial.teams[0].characters[0],
          { ...initial.teams[0].characters[1], currentHp: 0 },
        ],
      },
      initial.teams[1],
    ],
  };
  const { state, attack } = engine.processAttackAction(withDefeatedAlly, {
    kind: 'attack',
    actorId: 'marth',
    targetId: 'enemy',
    weapon: 'Sword',
  });
  const resolved = engine.applyResolvedDamage(state, attack.id, 500);
  assert.equal(resolved.teams[0].characters[1].modifiers.length, 0);
});

test('team Speed uses living effective SPD; equipment does not alter base class or stats', () => {
  const initial = battle();
  assert.equal(engine.calculateTeamSpeed(initial.teams[0]), 2800);
  assert.equal(engine.determineFirstTeam(initial.teams), 'allies');
  assert.equal(initial.turn.activeTeamId, 'allies');
  const equipped = engine.equipItem(initial, 'ally', {
    id: 'swift-sword',
    weaponType: 'Sword',
    combatRole: { id: 'vanguard', displayName: 'Vanguard' },
    statModifiers: { SPD: 100 },
  });
  assert.equal(engine.calculateTeamSpeed(equipped.teams[0]), 2900);
  assert.equal(
    engine.effectiveCombatRole(equipped.teams[0].characters[1]).id,
    'vanguard',
  );
  assert.equal(equipped.teams[0].characters[1].character.baseClass, 'Hero');
  assert.equal(
    engine.effectiveStats(equipped.teams[0].characters[1]).MAG,
    null,
  );
  assert.equal(marthGameplay.baseStats.SPD, 1400);
  assert.equal(engine.calculateTeamSpeed(initial.teams[0]), 2800);
});

test('initiative ties require an explicit first team', () => {
  const setup = [
    { id: 'one', characters: [{ instanceId: 'a', character: enemy }] },
    { id: 'two', characters: [{ instanceId: 'b', character: enemy }] },
  ];
  assert.throws(() => engine.createInitialBattleState(setup));
  assert.equal(
    engine.createInitialBattleState(setup, 'two').turn.activeTeamId,
    'two',
  );
});
