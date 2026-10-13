export type WeaponType =
  'Sword' | 'Lance' | 'Axe' | 'Magic' | 'Staff' | 'Dagger';

export type StatKey = 'HP' | 'ATK' | 'DEF' | 'MAG' | 'RES' | 'SPD';

export type CharacterBaseStats = Record<StatKey, number | null>;

/** The base class is permanent; equipment can provide a temporary combat role. */
export interface CombatRole {
  id: string;
  displayName: string;
}

export type SkillCondition =
  { kind: 'weapon-is'; weapon: WeaponType } | { kind: 'always' };

export type SkillEffect =
  | { kind: 'attack-bonus'; stat: 'ATK'; amount: number }
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
  trigger: 'on-attack' | 'on-kill';
  condition: SkillCondition;
  effect: SkillEffect;
}

export interface CharacterGameplayData {
  id: string;
  baseClass: string;
  displayType: string;
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
