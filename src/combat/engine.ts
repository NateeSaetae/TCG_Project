import type {
  BattleAction,
  BattleCharacterState,
  BattleEvent,
  BattleState,
  BattleTeamState,
  CharacterGameplayData,
  CharacterBaseStats,
  EquippedItem,
  SkillCondition,
  StatKey,
  WeaponType,
} from '../types/combat';

export type TeamSetup = {
  id: string;
  characters: readonly {
    instanceId: string;
    character: CharacterGameplayData;
    equippedItem?: EquippedItem;
  }[];
};

export type AttackDeclaration = Extract<
  BattleEvent,
  { kind: 'attack-declared' }
>;

function mapTeams(
  teams: BattleState['teams'],
  transform: (team: BattleTeamState) => BattleTeamState,
): BattleState['teams'] {
  return [transform(teams[0]), transform(teams[1])];
}

function findCharacter(state: BattleState, instanceId: string) {
  for (const team of state.teams) {
    const character = team.characters.find(
      (entry) => entry.instanceId === instanceId,
    );
    if (character) return { team, character };
  }
  throw new Error(`Unknown battle character: ${instanceId}`);
}

function updateCharacter(
  state: BattleState,
  instanceId: string,
  update: (character: BattleCharacterState) => BattleCharacterState,
): BattleState {
  return {
    ...state,
    teams: mapTeams(state.teams, (team) => ({
      ...team,
      characters: team.characters.map((character) =>
        character.instanceId === instanceId ? update(character) : character,
      ),
    })),
  };
}

export function canUseWeapon(
  character: CharacterGameplayData,
  weapon: WeaponType,
  purpose: 'attack' | 'heal' = 'attack',
): boolean {
  return (
    character.allowedWeapons.includes(weapon) &&
    (purpose === 'heal' ? weapon === 'Staff' : weapon !== 'Staff')
  );
}

export function effectiveStats(
  character: BattleCharacterState,
): CharacterBaseStats {
  const stats = { ...character.character.baseStats };
  const apply = (stat: StatKey, amount: number) => {
    // An unavailable stat stays unavailable, including MAG: null.
    if (stats[stat] !== null) stats[stat] = stats[stat]! + amount;
  };
  for (const [stat, amount] of Object.entries(
    character.equippedItem?.statModifiers ?? {},
  ))
    apply(stat as StatKey, amount);
  for (const modifier of character.modifiers)
    apply(modifier.stat, modifier.amount);
  return stats;
}

export function effectiveCombatRole(character: BattleCharacterState) {
  return (
    character.equippedItem?.combatRole ??
    character.character.combatRole ?? {
      id: character.character.baseClass,
      displayName: character.character.baseClass,
    }
  );
}

/** Provisional initiative policy: sum the SPD of living team members. */
export function calculateTeamSpeed(team: BattleTeamState): number {
  return team.characters.reduce((total, character) => {
    if (character.currentHp <= 0) return total;
    const speed = effectiveStats(character).SPD;
    if (speed === null)
      throw new Error(`SPD unavailable for ${character.instanceId}`);
    return total + speed;
  }, 0);
}

/** A tie returns null so the caller can supply a future tie-break rule. */
export function determineFirstTeam(
  teams: readonly [BattleTeamState, BattleTeamState],
): string | null {
  const difference =
    calculateTeamSpeed(teams[0]) - calculateTeamSpeed(teams[1]);
  return difference === 0 ? null : teams[difference > 0 ? 0 : 1].id;
}

export function createInitialBattleState(
  setups: readonly [TeamSetup, TeamSetup],
  firstTeamId?: string,
): BattleState {
  if (setups[0].id === setups[1].id) throw new Error('Team IDs must differ');
  if (setups.some((team) => team.characters.length === 0))
    throw new Error('Each team needs at least one character');
  const instanceIds = setups.flatMap((team) =>
    team.characters.map((c) => c.instanceId),
  );
  if (new Set(instanceIds).size !== instanceIds.length)
    throw new Error('Battle character instance IDs must be unique');
  const buildTeam = (setup: TeamSetup): BattleTeamState => ({
    id: setup.id,
    completedTurns: 0,
    characters: setup.characters.map(
      ({ instanceId, character, equippedItem }) => {
        if (character.baseStats.HP === null || character.baseStats.HP <= 0)
          throw new Error(`HP unavailable for ${instanceId}`);
        if (
          equippedItem?.weaponType &&
          !character.allowedWeapons.includes(equippedItem.weaponType)
        )
          throw new Error(
            `${instanceId} cannot equip ${equippedItem.weaponType}`,
          );
        return {
          instanceId,
          character,
          currentHp: character.baseStats.HP,
          equippedItem,
          modifiers: [],
        };
      },
    ),
  });
  const teams: BattleState['teams'] = [
    buildTeam(setups[0]),
    buildTeam(setups[1]),
  ];
  const first = determineFirstTeam(teams);
  if (!first && !firstTeamId)
    throw new Error('Initiative tie requires a firstTeamId');
  if (firstTeamId && !teams.some((team) => team.id === firstTeamId))
    throw new Error(`Unknown first team: ${firstTeamId}`);
  if (first && firstTeamId && first !== firstTeamId)
    throw new Error('First team must follow team Speed');
  return {
    teams,
    turn: { number: 1, activeTeamId: firstTeamId ?? first! },
    events: [],
  };
}

export function equipItem(
  state: BattleState,
  instanceId: string,
  item?: EquippedItem,
): BattleState {
  const { character } = findCharacter(state, instanceId);
  if (
    item?.weaponType &&
    !character.character.allowedWeapons.includes(item.weaponType)
  )
    throw new Error(`${instanceId} cannot equip ${item.weaponType}`);
  return updateCharacter(state, instanceId, (current) => ({
    ...current,
    equippedItem: item,
  }));
}

function conditionMatches(
  condition: SkillCondition,
  actor: BattleCharacterState,
  target?: BattleCharacterState,
  weapon?: WeaponType,
): boolean {
  switch (condition.kind) {
    case 'always':
      return true;
    case 'weapon-is':
      return condition.weapon === weapon;
    case 'hp-at-most-percent':
      return (
        actor.currentHp * 100 <=
        actor.character.baseStats.HP! * condition.percent
      );
    case 'target-hp-greater':
      return Boolean(target && target.currentHp > actor.currentHp);
    case 'target-spd-lower': {
      if (!target) return false;
      const actorSpeed = effectiveStats(actor).SPD;
      const targetSpeed = effectiveStats(target).SPD;
      return (
        actorSpeed !== null && targetSpeed !== null && actorSpeed > targetSpeed
      );
    }
    case 'target-full-hp':
      return Boolean(
        target && target.currentHp === target.character.baseStats.HP,
      );
    case 'all':
      return condition.conditions.every((part) =>
        conditionMatches(part, actor, target, weapon),
      );
  }
}

export function evaluateAttackPassives(
  character: BattleCharacterState,
  weapon?: WeaponType,
  target?: BattleCharacterState,
  attackStat: 'ATK' | 'MAG' = 'ATK',
): { attackBonus: number; defenseIgnorePercent: number; skillIds: string[] } {
  let attackBonus = 0;
  let defenseIgnorePercent = 0;
  const skillIds: string[] = [];
  for (const skill of character.character.skills) {
    if (
      skill.type !== 'Passive' ||
      skill.trigger !== 'on-attack' ||
      !conditionMatches(skill.condition, character, target, weapon)
    )
      continue;
    if (
      skill.effect.kind === 'attack-bonus' &&
      skill.effect.stat === attackStat
    )
      attackBonus += skill.effect.amount;
    else if (skill.effect.kind === 'ignore-defense')
      defenseIgnorePercent += skill.effect.percent;
    else continue;
    skillIds.push(skill.id);
  }
  return {
    attackBonus,
    defenseIgnorePercent: Math.min(100, defenseIgnorePercent),
    skillIds,
  };
}

function evaluateAttackTriggers(
  actor: BattleCharacterState,
  target: BattleCharacterState,
  weapon?: WeaponType,
  attackStat: 'ATK' | 'MAG' = 'ATK',
): { attackBonus: number; damageBonus: number; skillIds: string[] } {
  let attackBonus = 0;
  let damageBonus = 0;
  const skillIds: string[] = [];
  for (const skill of actor.character.skills) {
    if (
      skill.type !== 'Trigger' ||
      skill.trigger !== 'on-attack' ||
      !conditionMatches(skill.condition, actor, target, weapon)
    )
      continue;
    if (
      skill.effect.kind === 'attack-bonus' &&
      skill.effect.stat === attackStat
    )
      attackBonus += skill.effect.amount;
    else if (skill.effect.kind === 'damage-bonus')
      damageBonus += skill.effect.amount;
    else continue;
    skillIds.push(skill.id);
  }
  return { attackBonus, damageBonus, skillIds };
}

/** Declares an attack using ATK or MAG. Damage is intentionally resolved elsewhere. */
export function processAttackAction(
  state: BattleState,
  action: BattleAction,
): { state: BattleState; attack: AttackDeclaration } {
  const actor = findCharacter(state, action.actorId);
  const target = findCharacter(state, action.targetId);
  if (actor.team.id !== state.turn.activeTeamId)
    throw new Error('Actor is not on the active team');
  if (actor.team.id === target.team.id)
    throw new Error('Cannot attack an ally');
  if (actor.character.currentHp <= 0 || target.character.currentHp <= 0)
    throw new Error('Defeated characters cannot attack or be targeted');
  const weapon = action.weapon ?? actor.character.equippedItem?.weaponType;
  if (weapon && !canUseWeapon(actor.character.character, weapon, 'attack'))
    throw new Error(`${action.actorId} cannot attack with ${weapon}`);
  if (
    action.weapon &&
    actor.character.equippedItem?.weaponType &&
    action.weapon !== actor.character.equippedItem.weaponType
  )
    throw new Error('Attack weapon does not match equipped item');
  const attackStatKey = weapon === 'Magic' ? 'MAG' : 'ATK';
  const attackStat = effectiveStats(actor.character)[attackStatKey];
  if (attackStat === null) throw new Error(`${attackStatKey} is unavailable`);
  const passive = evaluateAttackPassives(
    actor.character,
    weapon,
    target.character,
    attackStatKey,
  );
  const trigger = evaluateAttackTriggers(
    actor.character,
    target.character,
    weapon,
    attackStatKey,
  );
  const attack: AttackDeclaration = {
    kind: 'attack-declared',
    id: `attack-${state.events.filter((event) => event.kind === 'attack-declared').length + 1}`,
    actorId: action.actorId,
    targetId: action.targetId,
    attack: attackStat + passive.attackBonus + trigger.attackBonus,
    attackStat: attackStatKey,
    damageBonus: trigger.damageBonus,
    defenseIgnorePercent: passive.defenseIgnorePercent,
    weapon,
    skillIds: [...passive.skillIds, ...trigger.skillIds],
  };
  return { state: { ...state, events: [...state.events, attack] }, attack };
}

/** Effective physical DEF for an already declared attack; callers retain control of the damage formula. */
export function effectiveDefenseForAttack(
  state: BattleState,
  attackId: string,
): number {
  const attack = state.events.find(
    (event): event is AttackDeclaration =>
      event.kind === 'attack-declared' && event.id === attackId,
  );
  if (!attack) throw new Error(`Unknown attack: ${attackId}`);
  const defense = effectiveStats(
    findCharacter(state, attack.targetId).character,
  ).DEF;
  if (defense === null) throw new Error('DEF is unavailable');
  return Math.floor(defense * (1 - attack.defenseIgnorePercent / 100));
}

/** Applies externally calculated base damage plus declared skill damage bonuses. */
export function applyResolvedDamage(
  state: BattleState,
  attackId: string,
  damage: number,
): BattleState {
  if (!Number.isSafeInteger(damage) || damage < 0)
    throw new Error('Resolved damage must be a nonnegative integer');
  const attack = state.events.find(
    (event): event is AttackDeclaration =>
      event.kind === 'attack-declared' && event.id === attackId,
  );
  if (!attack) throw new Error(`Unknown attack: ${attackId}`);
  const incomingDamage = damage + attack.damageBonus;
  if (!Number.isSafeInteger(incomingDamage))
    throw new Error('Total damage must be a safe integer');
  if (
    state.events.some(
      (event) => event.kind === 'damage-applied' && event.attackId === attackId,
    )
  )
    throw new Error(`Attack already resolved: ${attackId}`);
  const target = findCharacter(state, attack.targetId);
  if (target.character.currentHp <= 0)
    throw new Error('Target is already defeated');
  const reduction = target.character.character.skills
    .filter(
      (skill) =>
        skill.type === 'Passive' &&
        skill.trigger === 'on-damage' &&
        skill.effect.kind === 'incoming-damage-reduction' &&
        conditionMatches(skill.condition, target.character),
    )
    .reduce(
      (percent, skill) =>
        percent +
        (skill.effect.kind === 'incoming-damage-reduction'
          ? skill.effect.percent
          : 0),
      0,
    );
  const totalDamage = Math.floor(
    incomingDamage * (1 - Math.min(100, reduction) / 100),
  );
  const remainingHp = Math.max(0, target.character.currentHp - totalDamage);
  let next = updateCharacter(state, attack.targetId, (current) => ({
    ...current,
    currentHp: remainingHp,
  }));
  next = {
    ...next,
    events: [
      ...next.events,
      {
        kind: 'damage-applied',
        attackId,
        targetId: attack.targetId,
        amount: totalDamage,
        remainingHp,
      },
    ],
  };
  if (remainingHp > 0) {
    const attacker = findCharacter(next, attack.actorId);
    for (const skill of target.character.character.skills) {
      if (
        skill.type !== 'Trigger' ||
        skill.trigger !== 'on-hit' ||
        skill.effect.kind !== 'counter-damage' ||
        attacker.team.id === target.team.id ||
        attacker.character.currentHp <= 0 ||
        !conditionMatches(
          skill.condition,
          findCharacter(next, attack.targetId).character,
          attacker.character,
          attack.weapon,
        ) ||
        (skill.effect.limit === 'once-per-enemy-turn' &&
          next.events.some(
            (event) =>
              event.kind === 'counter-damage-applied' &&
              event.sourceId === attack.targetId &&
              event.skillId === skill.id &&
              event.turnNumber === next.turn.number,
          ))
      )
        continue;
      const counterHp = Math.max(
        0,
        attacker.character.currentHp - skill.effect.amount,
      );
      next = updateCharacter(next, attack.actorId, (current) => ({
        ...current,
        currentHp: counterHp,
      }));
      next = {
        ...next,
        events: [
          ...next.events,
          {
            kind: 'counter-damage-applied',
            sourceId: attack.targetId,
            targetId: attack.actorId,
            skillId: skill.id,
            amount: skill.effect.amount,
            remainingHp: counterHp,
            turnNumber: next.turn.number,
          },
          ...(counterHp === 0
            ? [
                {
                  kind: 'character-defeated' as const,
                  actorId: attack.targetId,
                  targetId: attack.actorId,
                },
              ]
            : []),
        ],
      };
      // Counter damage is applied directly and cannot start another attack.
      if (counterHp === 0) break;
    }
    return next;
  }

  next = {
    ...next,
    events: [
      ...next.events,
      {
        kind: 'character-defeated',
        actorId: attack.actorId,
        targetId: attack.targetId,
      },
    ],
  };
  const actor = findCharacter(next, attack.actorId);
  const defeated = findCharacter(next, attack.targetId).character;
  for (const skill of actor.character.character.skills) {
    if (
      skill.type !== 'Trigger' ||
      skill.trigger !== 'on-kill' ||
      !conditionMatches(
        skill.condition,
        actor.character,
        defeated,
        attack.weapon,
      ) ||
      skill.effect.kind !== 'team-buff'
    )
      continue;
    for (const ally of actor.team.characters) {
      if (ally.instanceId === actor.character.instanceId || ally.currentHp <= 0)
        continue;
      const modifier = {
        id: `${attackId}-${skill.id}-${ally.instanceId}`,
        sourceSkillId: skill.id,
        stat: skill.effect.stat,
        amount: skill.effect.amount,
        expiresAt: {
          teamId: actor.team.id,
          completedTurns: actor.team.completedTurns + 2,
        },
      };
      next = updateCharacter(next, ally.instanceId, (current) => ({
        ...current,
        modifiers: [...current.modifiers, modifier],
      }));
      next = {
        ...next,
        events: [
          ...next.events,
          { kind: 'modifier-applied', targetId: ally.instanceId, modifier },
        ],
      };
    }
  }
  return next;
}

export function advanceTurn(state: BattleState): BattleState {
  const current = state.turn.activeTeamId;
  const teams = mapTeams(state.teams, (team) => {
    const completedTurns = team.completedTurns + (team.id === current ? 1 : 0);
    return {
      ...team,
      completedTurns,
      characters: team.characters.map((character) => ({
        ...character,
        modifiers: character.modifiers.filter(
          (modifier) =>
            modifier.expiresAt.teamId !== current ||
            modifier.expiresAt.completedTurns > completedTurns,
        ),
      })),
    };
  });
  return {
    ...state,
    teams,
    turn: {
      number: state.turn.number + 1,
      activeTeamId: teams.find((team) => team.id !== current)!.id,
    },
    events: [
      ...state.events,
      { kind: 'turn-advanced', teamId: current, turnNumber: state.turn.number },
    ],
  };
}

export function isTeamDefeated(team: BattleTeamState): boolean {
  return (
    team.characters.length > 0 && team.characters.every((c) => c.currentHp <= 0)
  );
}
