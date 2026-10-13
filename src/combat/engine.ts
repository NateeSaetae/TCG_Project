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
    character.equippedItem?.combatRole ?? {
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
  weapon?: WeaponType,
): boolean {
  return condition.kind === 'always' || condition.weapon === weapon;
}

export function evaluateAttackPassives(
  character: BattleCharacterState,
  weapon?: WeaponType,
): { attackBonus: number; skillIds: string[] } {
  let attackBonus = 0;
  const skillIds: string[] = [];
  for (const skill of character.character.skills) {
    if (
      skill.type !== 'Passive' ||
      skill.trigger !== 'on-attack' ||
      !conditionMatches(skill.condition, weapon) ||
      skill.effect.kind !== 'attack-bonus'
    )
      continue;
    attackBonus += skill.effect.amount;
    skillIds.push(skill.id);
  }
  return { attackBonus, skillIds };
}

/** Declares an attack and reports ATK. Damage is intentionally resolved elsewhere. */
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
  const attackStat = effectiveStats(actor.character).ATK;
  if (attackStat === null) throw new Error('ATK is unavailable');
  const passive = evaluateAttackPassives(actor.character, weapon);
  const attack: AttackDeclaration = {
    kind: 'attack-declared',
    id: `attack-${state.events.filter((event) => event.kind === 'attack-declared').length + 1}`,
    actorId: action.actorId,
    targetId: action.targetId,
    attack: attackStat + passive.attackBonus,
    weapon,
    skillIds: passive.skillIds,
  };
  return { state: { ...state, events: [...state.events, attack] }, attack };
}

/** Accepts damage supplied by a future rule module; this module defines no damage formula. */
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
  if (
    state.events.some(
      (event) => event.kind === 'damage-applied' && event.attackId === attackId,
    )
  )
    throw new Error(`Attack already resolved: ${attackId}`);
  const target = findCharacter(state, attack.targetId);
  if (target.character.currentHp <= 0)
    throw new Error('Target is already defeated');
  const remainingHp = Math.max(0, target.character.currentHp - damage);
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
        amount: damage,
        remainingHp,
      },
    ],
  };
  if (remainingHp > 0) return next;

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
  for (const skill of actor.character.character.skills) {
    if (
      skill.type !== 'Trigger' ||
      skill.trigger !== 'on-kill' ||
      !conditionMatches(skill.condition, attack.weapon) ||
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
