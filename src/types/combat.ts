export type WeaponType =
  'Sword' | 'Lance' | 'Axe' | 'Bow' | 'Magic' | 'Staff' | 'Dagger';

export type StatKey = 'HP' | 'ATK' | 'DEF' | 'MAG' | 'RES' | 'SPD';

export type CharacterBaseStats = Record<StatKey, number | null>;

/** The base class is permanent; equipment can provide a temporary combat role. */
export interface CombatRole {
  id: string;
  displayName: string;
}

export type SkillCondition =
  | { kind: 'weapon-is'; weapon: WeaponType }
  | { kind: 'hp-at-most-percent'; percent: number }
  | { kind: 'target-hp-greater' }
  | { kind: 'target-spd-lower' }
  | { kind: 'target-full-hp' }
  | { kind: 'all'; conditions: readonly SkillCondition[] }
  | { kind: 'always' };

export type SkillEffect =
  | { kind: 'attack-bonus'; stat: 'ATK' | 'MAG'; amount: number }
  | { kind: 'heal-bonus'; amount: number; cap: 'target-max-hp' }
  | { kind: 'damage-bonus'; amount: number }
  | { kind: 'ignore-defense'; percent: number }
  | { kind: 'incoming-damage-reduction'; percent: number }
  | { kind: 'counter-damage'; amount: number; limit: 'once-per-enemy-turn' }
  | {
      kind: 'team-buff';
      stat: 'ATK';
      amount: number;
      target: 'other-living-allies';
      duration: 'through-next-own-turn';
    };

export interface CharacterSkill {
  id: string;
  name: string;
  description: string;
  type: 'Passive' | 'Trigger';
  trigger: 'on-attack' | 'on-kill' | 'on-damage' | 'on-hit' | 'on-heal';
  /** The engine does not yet process this skill's trigger. */
  runtime?: 'pending';
  condition: SkillCondition;
  effect: SkillEffect;
}

export interface CharacterGameplayData {
  id: string;
  baseClass: string;
  displayType: string;
  combatRole?: CombatRole;
  allowedWeapons: readonly WeaponType[];
  baseStats: Readonly<CharacterBaseStats>;
  skills: readonly CharacterSkill[];
}

export interface TemporaryStatusModifier {
  id: string;
  sourceSkillId: string;
  stat: StatKey;
  amount: number;
  /** Remove at the end of this team's completed turn. */
  expiresAt: { teamId: string; completedTurns: number };
}

export interface EquippedItem {
  id: string;
  weaponType?: WeaponType;
  combatRole?: CombatRole;
  statModifiers?: Partial<Record<StatKey, number>>;
}

export interface BattleCharacterState {
  instanceId: string;
  character: CharacterGameplayData;
  currentHp: number;
  equippedItem?: EquippedItem;
  modifiers: readonly TemporaryStatusModifier[];
}

export interface BattleTeamState {
  id: string;
  characters: readonly BattleCharacterState[];
  completedTurns: number;
}

export interface BattleTurnState {
  number: number;
  activeTeamId: string;
}

export type BattleAction = {
  kind: 'attack';
  actorId: string;
  targetId: string;
  /** Omit for a base-class attack without an equipped weapon. */
  weapon?: WeaponType;
};

export type BattleEvent =
  | {
      kind: 'attack-declared';
      id: string;
      actorId: string;
      targetId: string;
      attack: number;
      /** MAG for Magic attacks, ATK for other attacks. */
      attackStat: 'ATK' | 'MAG';
      /** Added to the caller's base damage when the hit resolves. */
      damageBonus: number;
      /** Percentage of target DEF ignored by this attack. The damage resolver uses this. */
      defenseIgnorePercent: number;
      weapon?: WeaponType;
      skillIds: string[];
    }
  | {
      kind: 'damage-applied';
      attackId: string;
      targetId: string;
      amount: number;
      remainingHp: number;
    }
  | {
      kind: 'counter-damage-applied';
      sourceId: string;
      targetId: string;
      skillId: string;
      amount: number;
      remainingHp: number;
      turnNumber: number;
    }
  | { kind: 'character-defeated'; actorId: string; targetId: string }
  | {
      kind: 'modifier-applied';
      targetId: string;
      modifier: TemporaryStatusModifier;
    }
  | { kind: 'turn-advanced'; teamId: string; turnNumber: number };

export interface BattleState {
  teams: readonly [BattleTeamState, BattleTeamState];
  turn: BattleTurnState;
  events: readonly BattleEvent[];
}
