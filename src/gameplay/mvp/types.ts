import type { WeaponType } from '../../types/combat';

/** Only these weapons have attack ranges in MVP Ver.1. */
export type MvpAttackWeapon = Extract<
  WeaponType,
  'Sword' | 'Lance' | 'Axe' | 'Bow' | 'Magic'
>;

export type BattlefieldPosition = 0 | 1 | 2 | 3 | 4;

/** A battle instance refers to a character, never to a collectible print. */
export interface MvpCombatant {
  instanceId: string;
  characterId: string;
  currentHp: number;
  weapon: MvpAttackWeapon;
  allowedWeapons: readonly MvpAttackWeapon[];
  newlyDeployed: boolean;
  exhausted: boolean;
  itemUsedThisTurn: boolean;
  rally: boolean;
  defensiveStance: boolean;
}

export type MvpBattlefield = readonly [
  MvpCombatant | null,
  MvpCombatant | null,
  MvpCombatant | null,
  MvpCombatant | null,
  MvpCombatant | null,
];
