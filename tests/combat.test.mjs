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
  '/src/data/characters/marth/marthGameplay.ts',
);
const { marthCards } = await server.ssrLoadModule(
  '/src/data/characters/marth/marth.ts',
);
const { royGameplay } = await server.ssrLoadModule(
  '/src/data/characters/roy/royGameplay.ts',
);
const { royCards } = await server.ssrLoadModule(
  '/src/data/characters/roy/roy.ts',
);
const { hectorGameplay } = await server.ssrLoadModule(
  '/src/data/characters/hector/hectorGameplay.ts',
);
const { ephraimGameplay } = await server.ssrLoadModule(
  '/src/data/characters/ephraim/ephraimGameplay.ts',
);
const { lilinaGameplay } = await server.ssrLoadModule(
  '/src/data/characters/lilina/lilinaGameplay.ts',
);
const { lynGameplay } = await server.ssrLoadModule(
  '/src/data/characters/lyn/lynGameplay.ts',
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

function royBattle(currentHp = 3000, enemyHp = 4000) {
  const initial = engine.createInitialBattleState([
    {
      id: 'allies',
      characters: [{ instanceId: 'roy', character: royGameplay }],
    },
    {
      id: 'enemies',
      characters: [
        {
          instanceId: 'enemy',
          character: {
            ...enemy,
            baseStats: { ...enemy.baseStats, HP: enemyHp },
          },
        },
      ],
    },
  ]);
  return {
    ...initial,
    teams: [
      {
        ...initial.teams[0],
        characters: [{ ...initial.teams[0].characters[0], currentHp }],
      },
      initial.teams[1],
    ],
  };
}

test('registered Roy cards share Roy gameplay and skills', () => {
  assert.ok(royCards.every((card) => card.gameplay === royGameplay));
  assert.deepEqual(royGameplay.allowedWeapons, ['Sword', 'Lance']);
});

test('Blazing Resolve adds ATK at or below half HP on any attack', () => {
  const attack = (hp, weapon) =>
    engine.processAttackAction(royBattle(hp), {
      kind: 'attack',
      actorId: 'roy',
      targetId: 'enemy',
      weapon,
    }).attack;
  assert.equal(attack(1501, 'Lance').attack, 1000);
  for (const weapon of ['Sword', 'Lance']) {
    const result = attack(1500, weapon);
    assert.equal(result.attack, 1150);
    assert.ok(result.skillIds.includes('blazing-resolve'));
  }
});

test('Binding Flame adds damage only for Sword against a target with more HP', () => {
  const declare = (royHp, enemyHp, weapon) =>
    engine.processAttackAction(royBattle(royHp, enemyHp), {
      kind: 'attack',
      actorId: 'roy',
      targetId: 'enemy',
      weapon,
    });
  const { state, attack } = declare(3000, 4000, 'Sword');
  assert.equal(attack.attack, 1000);
  assert.equal(attack.damageBonus, 250);
  assert.deepEqual(attack.skillIds, ['binding-flame']);
  const resolved = engine.applyResolvedDamage(state, attack.id, 100);
  assert.equal(resolved.teams[1].characters[0].currentHp, 3650);
  assert.equal(resolved.events.at(-1).amount, 350);
  assert.equal(declare(3000, 3000, 'Sword').attack.damageBonus, 0);
  assert.equal(declare(3000, 4000, 'Lance').attack.damageBonus, 0);
});

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

test('Bow can be equipped, used to attack, and matched by weapon skills', () => {
  const archer = {
    ...enemy,
    allowedWeapons: ['Bow'],
    skills: [
      {
        id: 'bow-focus',
        name: 'Bow Focus',
        description: 'Bow attack: +100 ATK.',
        type: 'Passive',
        trigger: 'on-attack',
        condition: { kind: 'weapon-is', weapon: 'Bow' },
        effect: { kind: 'attack-bonus', stat: 'ATK', amount: 100 },
      },
    ],
  };
  assert.equal(engine.canUseWeapon(archer, 'Bow'), true);
  assert.equal(engine.canUseWeapon(marthGameplay, 'Bow'), false);
  const initial = engine.createInitialBattleState(
    [
      {
        id: 'archers',
        characters: [{ instanceId: 'archer', character: archer }],
      },
      { id: 'foes', characters: [{ instanceId: 'target', character: enemy }] },
    ],
    'archers',
  );
  const equipped = engine.equipItem(initial, 'archer', {
    id: 'practice-bow',
    weaponType: 'Bow',
  });
  const { attack } = engine.processAttackAction(equipped, {
    kind: 'attack',
    actorId: 'archer',
    targetId: 'target',
  });
  assert.equal(attack.weapon, 'Bow');
  assert.equal(attack.attack, 700);
  assert.deepEqual(attack.skillIds, ['bow-focus']);
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

test('Hector and Ephraim expose the requested types, roles, weapons, and stats', () => {
  assert.equal(hectorGameplay.displayType, 'Hero · Armored Lord');
  assert.equal(hectorGameplay.combatRole.displayName, 'Tank / Counterattacker');
  assert.deepEqual(hectorGameplay.allowedWeapons, ['Axe', 'Sword']);
  assert.deepEqual(hectorGameplay.baseStats, {
    HP: 4500,
    ATK: 1400,
    DEF: 1500,
    MAG: null,
    RES: 600,
    SPD: 700,
  });
  assert.equal(ephraimGameplay.displayType, 'Hero · Lord');
  assert.equal(
    ephraimGameplay.combatRole.displayName,
    'Lance Specialist / Duelist',
  );
  assert.deepEqual(ephraimGameplay.allowedWeapons, ['Lance', 'Axe']);
  assert.deepEqual(ephraimGameplay.baseStats, {
    HP: 3800,
    ATK: 1700,
    DEF: 1000,
    MAG: null,
    RES: 700,
    SPD: 1300,
  });
});

function hectorBattle(attacker = ephraimGameplay) {
  return engine.createInitialBattleState([
    {
      id: 'foes',
      characters: [{ instanceId: 'attacker', character: attacker }],
    },
    {
      id: 'heroes',
      characters: [{ instanceId: 'hector', character: hectorGameplay }],
    },
  ]);
}

function hitHector(state, damage, weapon) {
  const declared = engine.processAttackAction(state, {
    kind: 'attack',
    actorId: 'attacker',
    targetId: 'hector',
    weapon,
  });
  return engine.applyResolvedDamage(declared.state, declared.attack.id, damage);
}

test('Ostian Guard reduces armed and unarmed damage; Armads counters only once per enemy turn', () => {
  const initial = hectorBattle();
  const first = hitHector(initial, 1000);
  assert.equal(first.teams[1].characters[0].currentHp, 3650);
  assert.equal(first.teams[0].characters[0].currentHp, 3500);
  assert.equal(
    first.events.find((event) => event.kind === 'damage-applied').amount,
    850,
  );
  assert.equal(
    first.events.filter((event) => event.kind === 'counter-damage-applied')
      .length,
    1,
  );

  const second = hitHector(first, 101, 'Axe');
  assert.equal(second.teams[1].characters[0].currentHp, 3565);
  assert.equal(second.teams[0].characters[0].currentHp, 3500);
  assert.equal(
    second.events.filter((event) => event.kind === 'counter-damage-applied')
      .length,
    1,
  );

  const nextEnemyTurn = engine.advanceTurn(engine.advanceTurn(second));
  const third = hitHector(nextEnemyTurn, 100);
  assert.equal(third.teams[0].characters[0].currentHp, 3200);
  assert.equal(
    third.events.filter((event) => event.kind === 'counter-damage-applied')
      .length,
    2,
  );
  assert.equal(initial.teams[1].characters[0].currentHp, 4500);
});

test('Armads cannot counter after defeat or start a counter chain', () => {
  const lethal = hitHector(hectorBattle(), 6000);
  assert.equal(lethal.teams[1].characters[0].currentHp, 0);
  assert.equal(
    lethal.events.filter((event) => event.kind === 'counter-damage-applied')
      .length,
    0,
  );

  const mirror = hectorBattle({
    ...hectorGameplay,
    baseStats: { ...hectorGameplay.baseStats, SPD: 1400 },
  });
  const result = hitHector(mirror, 100);
  assert.equal(
    result.events.filter((event) => event.kind === 'counter-damage-applied')
      .length,
    1,
  );
  assert.equal(result.teams[0].characters[0].currentHp, 4200);
});

test('Siegmund pierces DEF only with a Lance, while Renais Assault applies only against full HP', () => {
  const initial = engine.createInitialBattleState([
    {
      id: 'heroes',
      characters: [{ instanceId: 'ephraim', character: ephraimGameplay }],
    },
    {
      id: 'foes',
      characters: [{ instanceId: 'hector', character: hectorGameplay }],
    },
  ]);
  const action = (weapon) => ({
    kind: 'attack',
    actorId: 'ephraim',
    targetId: 'hector',
    weapon,
  });
  const lance = engine.processAttackAction(initial, action('Lance'));
  assert.equal(lance.attack.attack, 2000);
  assert.equal(lance.attack.defenseIgnorePercent, 20);
  assert.equal(
    engine.effectiveDefenseForAttack(lance.state, lance.attack.id),
    1200,
  );
  assert.deepEqual(lance.attack.skillIds, ['siegmunds-edge', 'renais-assault']);
  const lanceDamage = Math.max(
    0,
    lance.attack.attack -
      engine.effectiveDefenseForAttack(lance.state, lance.attack.id),
  );
  const lanceHit = engine.applyResolvedDamage(
    lance.state,
    lance.attack.id,
    lanceDamage,
  );
  assert.equal(lanceHit.teams[1].characters[0].currentHp, 3820);

  const axe = engine.processAttackAction(initial, action('Axe'));
  assert.equal(axe.attack.attack, 2000);
  assert.equal(axe.attack.defenseIgnorePercent, 0);
  assert.equal(
    engine.effectiveDefenseForAttack(axe.state, axe.attack.id),
    1500,
  );
  assert.deepEqual(axe.attack.skillIds, ['renais-assault']);
  const axeDamage = Math.max(
    0,
    axe.attack.attack -
      engine.effectiveDefenseForAttack(axe.state, axe.attack.id),
  );
  const axeHit = engine.applyResolvedDamage(
    axe.state,
    axe.attack.id,
    axeDamage,
  );
  assert.equal(axeHit.teams[1].characters[0].currentHp, 4075);

  const wounded = engine.applyResolvedDamage(lance.state, lance.attack.id, 100);
  const next = engine.processAttackAction(wounded, action('Lance'));
  assert.equal(next.attack.attack, 1700);
  assert.deepEqual(next.attack.skillIds, ['siegmunds-edge']);
  assert.equal(ephraimGameplay.baseStats.ATK, 1700);
});

test('Lilina uses MAG for Magic attacks and records Staff healing as pending', () => {
  const initial = engine.createInitialBattleState([
    {
      id: 'allies',
      characters: [{ instanceId: 'lilina', character: lilinaGameplay }],
    },
    { id: 'foes', characters: [{ instanceId: 'enemy', character: enemy }] },
  ]);
  assert.deepEqual(lilinaGameplay.allowedWeapons, ['Magic', 'Staff']);
  assert.deepEqual(lilinaGameplay.baseStats, {
    HP: 2800,
    ATK: 500,
    DEF: 500,
    MAG: 1900,
    RES: 1300,
    SPD: 1000,
  });
  assert.equal(lilinaGameplay.displayType, 'Mage · Fire Mage');
  assert.equal(
    lilinaGameplay.combatRole.displayName,
    'Magic DPS / Secondary Healer',
  );
  assert.equal(engine.canUseWeapon(lilinaGameplay, 'Staff', 'heal'), true);
  assert.equal(engine.canUseWeapon(lilinaGameplay, 'Staff', 'attack'), false);
  assert.equal(engine.canUseWeapon(lilinaGameplay, 'Magic', 'heal'), false);
  const magic = engine.processAttackAction(initial, {
    kind: 'attack',
    actorId: 'lilina',
    targetId: 'enemy',
    weapon: 'Magic',
  }).attack;
  assert.equal(magic.attackStat, 'MAG');
  assert.equal(magic.attack, 2200);
  assert.deepEqual(magic.skillIds, ['arcane-flame']);
  const unarmed = engine.processAttackAction(initial, {
    kind: 'attack',
    actorId: 'lilina',
    targetId: 'enemy',
  }).attack;
  assert.equal(unarmed.attackStat, 'ATK');
  assert.equal(unarmed.attack, 500);
  assert.throws(() =>
    engine.processAttackAction(initial, {
      kind: 'attack',
      actorId: 'lilina',
      targetId: 'enemy',
      weapon: 'Staff',
    }),
  );
  assert.deepEqual(lilinaGameplay.skills[1].effect, {
    kind: 'heal-bonus',
    amount: 300,
    cap: 'target-max-hp',
  });
  assert.equal(lilinaGameplay.skills[1].runtime, 'pending');
  assert.equal(lilinaGameplay.baseStats.MAG, 1900);
});

test('Lyn compares effective SPD and pierces DEF only with Bow', () => {
  const initial = engine.createInitialBattleState([
    {
      id: 'allies',
      characters: [{ instanceId: 'lyn', character: lynGameplay }],
    },
    { id: 'foes', characters: [{ instanceId: 'enemy', character: enemy }] },
  ]);
  assert.deepEqual(lynGameplay.allowedWeapons, ['Sword', 'Bow']);
  assert.deepEqual(lynGameplay.baseStats, {
    HP: 3100,
    ATK: 1400,
    DEF: 650,
    MAG: null,
    RES: 750,
    SPD: 1900,
  });
  assert.equal(lynGameplay.displayType, 'Hero · Myrmidon');
  assert.equal(
    lynGameplay.combatRole.displayName,
    'Speed Attacker / Precision Archer',
  );
  const bowResult = engine.processAttackAction(initial, {
    kind: 'attack',
    actorId: 'lyn',
    targetId: 'enemy',
    weapon: 'Bow',
  });
  const bow = bowResult.attack;
  assert.equal(bow.attack, 1650);
  assert.equal(bow.defenseIgnorePercent, 15);
  assert.equal(engine.effectiveDefenseForAttack(bowResult.state, bow.id), 255);
  assert.deepEqual(bow.skillIds, ['swift-strike', 'sacaen-precision']);
  const sword = engine.processAttackAction(initial, {
    kind: 'attack',
    actorId: 'lyn',
    targetId: 'enemy',
    weapon: 'Sword',
  }).attack;
  assert.equal(sword.attack, 1650);
  assert.equal(sword.defenseIgnorePercent, 0);

  const fasterTarget = engine.equipItem(initial, 'enemy', {
    id: 'speed-boost',
    statModifiers: { SPD: 1800 },
  });
  const againstFaster = engine.processAttackAction(fasterTarget, {
    kind: 'attack',
    actorId: 'lyn',
    targetId: 'enemy',
    weapon: 'Bow',
  }).attack;
  assert.equal(againstFaster.attack, 1400);
  assert.deepEqual(againstFaster.skillIds, ['sacaen-precision']);
  assert.equal(engine.canUseWeapon(lynGameplay, 'Bow'), true);
  assert.equal(lynGameplay.baseStats.ATK, 1400);
});
